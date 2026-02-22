import pdfplumber
import math
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="InsightFlow PDF Parser")

# Allow CORS for local React Native Web
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TOCItem(BaseModel):
    id: str
    title: str
    rawTitle: str
    page: int
    y: float
    x: float
    level: int
    number: Optional[str] = None
    readingOrder: int

class PDFParseResult(BaseModel):
    numPages: int
    toc: List[TOCItem]
    sections: dict # section_id -> text content

def get_body_font_size(words):
    if not words:
        return 12.0
        
    freq = {}
    for w in words:
        size = round(w['size'] * 2) / 2
        freq[size] = freq.get(size, 0) + 1
        
    return max(freq.items(), key=lambda x: x[1])[0]

def group_by_line(words, y_tolerance=3):
    """Group words that are on the same line (similar y0) and close together in X."""
    if not words:
        return []
        
    # Sort initially by Y then X
    sorted_words = sorted(words, key=lambda w: (w['top'], w['x0']))
    
    lines = []
    current_line = [sorted_words[0]]
    
    for word in sorted_words[1:]:
        last_word = current_line[-1]
        
        # If Y is very similar, it's the same line
        if abs(word['top'] - last_word['top']) < y_tolerance:
            current_line.append(word)
        else:
            lines.append(current_line)
            current_line = [word]
            
    if current_line:
        lines.append(current_line)
        
    # Convert line groups to combined objects
    grouped = []
    for line in lines:
        if not line:
            continue
            
        text = " ".join([w['text'] for w in line])
        avg_size = sum([w['size'] for w in line]) / len(line)
        
        grouped.append({
            'text': text,
            'x0': line[0]['x0'],
            'x1': line[-1]['x1'],
            'top': min([w['top'] for w in line]),
            'bottom': max([w['bottom'] for w in line]),
            'size': avg_size,
            'fontname': line[0].get('fontname', ''),
            'raw_words': line
        })
        
    return grouped

def is_bold(fontname):
    if not fontname:
        return False
    name_lower = fontname.lower()
    return any(w in name_lower for w in ['bold', 'heavy', 'black', 'godic', '고딕'])

def parse_section_number(text):
    import re
    first_word = text.split(' ')[0]
    
    # "1", "2.3", "3.1.2"
    m = re.match(r'^((\d{1,2}\.){1,3}\d{0,2}|\d{1,2})$', first_word.rstrip('.'))
    if m:
        return m.group(1).rstrip('.')
    return None

def determine_level(group, body_size):
    size_ratio = group['size'] / body_size
    text = group['text'].strip()
    
    # 1. Start with Boxed Number or solid number "1 사업 개요"
    import re
    if re.match(r'^\d{1,2}\.?\s+', text):
        return 1
        
    # 2. Sub-headings "□ 신청자격"
    if text.startswith('□'):
        return 2
        
    # 3. Nested numbers "1.1 대상"
    if re.match(r'^\d{1,2}\.\d{1,2}\.?\s+', text):
        return 2
        
    if re.match(r'^\d{1,2}\.\d{1,2}\.\d{1,2}\.?\s+', text):
        return 3
        
    # 4. Font size / weight fallback
    if size_ratio >= 1.4 or (size_ratio >= 1.15 and is_bold(group['fontname'])):
        return 1
        
    return 0

@app.post("/api/parse-pdf", response_model=PDFParseResult)
async def parse_pdf(file: UploadFile = File(...)):
    toc = []
    sections = {}
    current_section_id = None
    reading_order_counter = 0
    
    with pdfplumber.open(file.file) as pdf:
        num_pages = len(pdf.pages)
        
        # Get global body font size from sample pages (1st and middle)
        sample_words = []
        for p_idx in [0, min(2, num_pages - 1)]:
            sample_words.extend(pdf.pages[p_idx].extract_words(extra_attrs=['size']))
        body_size = get_body_font_size(sample_words)
        
        for page_num, page in enumerate(pdf.pages):
            words = page.extract_words(extra_attrs=['size', 'fontname'])
            page_height = page.height
            
            # Simple Column detection (left vs right)
            left_col = []
            right_col = []
            page_center = page.width / 2
            
            for w in words:
                if w['x0'] < page_center:
                    left_col.append(w)
                else:
                    right_col.append(w)
                    
            # Process left then right columns to maintain reading order
            sorted_words = []
            if left_col and right_col:
                # Need to group by line within columns first, then combine
                left_groups = group_by_line(left_col)
                right_groups = group_by_line(right_col)
                all_groups = left_groups + right_groups
            else:
                all_groups = group_by_line(words)
                
            for group in all_groups:
                level = determine_level(group, body_size)
                
                # Check for noise (headers/footers)
                if group['top'] < page_height * 0.08 or group['top'] > page_height * 0.92:
                    if len(group['text'].split()) < 8 and not group['text'].startswith('□'):
                       level = 0
                
                if level > 0:
                    import re
                    # Ignore tables / figures
                    if re.match(r'^(표|그림|table|figure|fig)\s*\d+', group['text'], re.IGNORECASE):
                        level = 0
                        
                if level > 0:
                    # Clean title
                    title = group['text']
                    
                    # Remove trailing stuff
                    title = re.sub(r'[\.,;:!?]$', '', title).strip()
                    
                    # Too short or too long
                    if len(title) < 2 or len(title) > 80:
                         level = 0
                    
                    if level > 0:
                        sec_id = f"sec-{page_num}-{int(group['top'])}"
                        number = parse_section_number(title)
                        
                        toc_item = TOCItem(
                            id=sec_id,
                            title=title,
                            rawTitle=group['text'],
                            page=page_num + 1,
                            y=float(group['top']),
                            x=float(group['x0']),
                            level=level,
                            number=number,
                            readingOrder=reading_order_counter
                        )
                        toc.append(toc_item)
                        sections[sec_id] = group['text'] + "\n"
                        current_section_id = sec_id
                        reading_order_counter += 1
                else:
                    if current_section_id:
                        sections[current_section_id] += group['text'] + "\n"
                        
    return PDFParseResult(
        numPages=num_pages,
        toc=toc,
        sections=sections
    )
