import pdfplumber
import re
import math
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="InsightFlow PDF Parser")

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
    sections: dict

def get_body_font_size(words):
    if not words:
        return 12.0
    freq = {}
    for w in words:
        size = round(w['size'] * 2) / 2
        freq[size] = freq.get(size, 0) + 1
    return max(freq.items(), key=lambda x: x[1])[0]

def group_by_line(words, y_tolerance=4, x_tolerance=10):
    if not words:
        return []
        
    # 1. Sort purely by Y to get horizontal bands
    sorted_by_y = sorted(words, key=lambda w: w['top'])
    
    lines_by_y = []
    current_y_line = [sorted_by_y[0]]
    for word in sorted_by_y[1:]:
        if abs(word['top'] - current_y_line[0]['top']) < y_tolerance:
            current_y_line.append(word)
        else:
            lines_by_y.append(current_y_line)
            current_y_line = [word]
    if current_y_line:
        lines_by_y.append(current_y_line)
        
    grouped = []
    # 2. Inside each Y-band, sort by X and split columns
    for y_line in lines_by_y:
        y_line.sort(key=lambda w: w['x0'])
        
        sub_lines = []
        current_sub = [y_line[0]]
        for word in y_line[1:]:
            last_word = current_sub[-1]
            if word['x0'] - last_word['x1'] > x_tolerance:
                sub_lines.append(current_sub)
                current_sub = [word]
            else:
                current_sub.append(word)
        if current_sub:
            sub_lines.append(current_sub)
            
        for sub in sub_lines:
            if not sub: continue
            text = " ".join([w['text'] for w in sub])
            avg_size = sum([w['size'] for w in sub]) / len(sub)
            grouped.append({
                'text': text,
                'x0': sub[0]['x0'],
                'x1': sub[-1]['x1'],
                'top': min([w['top'] for w in sub]),
                'bottom': max([w['bottom'] for w in sub]),
                'size': avg_size,
                'fontname': sub[0].get('fontname', ''),
                'raw_words': sub
            })
    return grouped

def parse_section_number(text):
    first_word = text.split(' ')[0].rstrip('.')
    m = re.match(r'^((\d{1,2}\.){1,3}\d{0,2}|\d{1,2})$', first_word)
    if m:
        return m.group(1).rstrip('.')
    return None

def determine_level(group, body_size):
    text = group['text'].strip()

    # Fix PDF extraction duplications (e.g. "2.11 2.11." → "2.11.")
    text = re.sub(r'^([\d]+(?:\.[\d]+)*)\.?\s+\1\.?\s+', r'\1 ', text).strip()

    if not text or len(text) < 2:
        return 0, group['text']
        
    if "et al." in text.lower():
        return 0, group['text']

    # ── 1. 명백한 비제목 패턴 제거 ──────────────────────────────────────────

    # 표/그림 캡션 제외
    if re.search(r'^(표|그림|table|figure|fig\.?|ref\.?)\s*[\d\[\(]', text, re.IGNORECASE):
        return 0, group['text']

    # ✅ FIX: 문장 종결 패턴 — 번호+점으로 끝나는 경우는 제외해야 함
    # "2.2." 같은 번호는 마침표로 끝나지만 제목임
    # 진짜 문장만 걸러냄: 한국어 종결어미 또는 콤마/세미콜론으로 끝나는 경우
    stripped_for_check = text.rstrip()
    is_numbered_heading_candidate = bool(re.match(r'^[\dIVX]', stripped_for_check))

    if not is_numbered_heading_candidate:
        # 번호가 없는 텍스트는 문장 종결 패턴으로 거름
        if re.search(r'(다\.|함\.|됨\.|음\.|니다\.|기\.|고\.|며\.|은\.|는\.|이\.|가\.|을\.|를\.|,\s*|;\s*)$', stripped_for_check):
            return 0, group['text']
        # 마침표로 끝나는데 번호가 아닌 경우 (일반 문장)
        if re.search(r'[가-힣a-z]\.$', stripped_for_check):
            return 0, group['text']

    # ── 2. 한국어 박스형 제목 (□ ■ ▣ ▶) ────────────────────────────────────
    is_korean_box = text.startswith('□') or text.startswith('■') or text.startswith('▣') or text.startswith('▶')
    if is_korean_box:
        rest = re.sub(r'^[□■▣▶]\s*', '', text).strip()
        # 콜론이 있는 항목 (□ 지원내용 : 사업화)은 제목이 아님
        if ':' in rest or '：' in rest:
            return 0, group['text']
        # 너무 긴 항목 제외
        if len(rest.split()) > 6:
            return 0, group['text']
        return 2, text

    # ── 3. 표준 학술 섹션명 ────────────────────────────────────────────────
    clean_text = re.sub(r'^[\d\s\.]+', '', text).strip()
    is_spaced_abstract = bool(re.match(r'^A\s*B\s*S\s*T\s*R\s*A\s*C\s*T$', clean_text, re.IGNORECASE))
    is_academic = bool(re.match(
        r'^(abstract|introduction|background|methods?|materials?\s+and\s+methods?|results?|discussion|conclusions?|references?|acknowledgments?)$',
        clean_text, re.IGNORECASE
    ))
    if is_academic or is_spaced_abstract:
        return 1, clean_text

    # ── 4. ✅ 한국어 번호형 제목 (점 없이): "1 사업 개요", "2 지원내용" ─────
    # 반드시 한국어 또는 대문자로 시작하는 내용이 따라와야 함
    korean_no_dot = re.match(r'^(\d{1,2}(?:\.\d{1,2})*)\s+([가-힣A-Z].{0,60})$', text)
    if korean_no_dot and re.search(r'[가-힣]', text):
        num_part = korean_no_dot.group(1)
        content = korean_no_dot.group(2).strip()

        # 문장 종결어미로 끝나면 제외
        if re.search(r'(다|함|됨|음|니다|기|고|며|을|를|이|가|은|는)$', content.rstrip('.')):
            return 0, group['text']
        # 너무 길면 제외
        if len(text) > 80 or len(text.split()) > 10:
            return 0, group['text']

        dots = num_part.count('.')
        if dots == 0:
            return 1, text
        if dots == 1:
            return 2, text
        return 3, text

    # ── 5. 표준 번호형 제목 (점 포함): "1.", "2.1.", "3.1.2." ──────────────
    number_match = re.match(r'^([IVX]+\.|\d{1,2}\.|\d{1,2}(?:\.\d{1,2})+\.?)\s+(.*)', text)
    if number_match:
        num = number_match.group(1).rstrip('.')
        content = number_match.group(2).strip()

        # 소문자/불릿으로 시작하는 내용 제외
        if not content or re.match(r'^[a-z\-•·oㅇ○\*]', content):
            return 0, group['text']

        # 길이 제한
        if len(text) > 160 or len(text.split()) > 28:
            return 0, group['text']

        # ✅ FIX: 내용이 한국어 종결어미로 끝나면 제목 아님
        if re.search(r'(다|함|됨|음|니다)[\.\s]*$', content):
            return 0, group['text']

        dots = num.count('.')
        if dots == 0:
            return 1, text
        if dots == 1:
            return 2, text
        return 3, text

    return 0, group['text']


@app.post("/api/parse-pdf", response_model=PDFParseResult)
async def parse_pdf(file: UploadFile = File(...)):
    toc = []
    sections = {}
    current_section_id = None
    reading_order_counter = 0

    # ✅ 전역 중복 방지 (번호 기반)
    seen_numbers = set()
    seen_titles = set()

    with pdfplumber.open(file.file) as pdf:
        num_pages = len(pdf.pages)

        # 본문 폰트 크기: 1번째, 중간 페이지 샘플링
        sample_words = []
        sample_indices = list({0, min(2, num_pages - 1), num_pages // 2})
        for p_idx in sample_indices:
            sample_words.extend(pdf.pages[p_idx].extract_words(extra_attrs=['size']))
        body_size = get_body_font_size(sample_words)
        print(f"📏 Body font size: {body_size}")

        for page_num, page in enumerate(pdf.pages):
            words = page.extract_words(extra_attrs=['size', 'fontname'])
            page_height = page.height
            page_width = page.width

            all_groups = group_by_line(words)

            page_toc_items = []
            
            for group in all_groups:
                level, cleaned_text = determine_level(group, body_size)
                group['text'] = cleaned_text

                # 헤더/푸터 영역 제외 (상위 8%, 하위 8%)
                top_ratio = group['top'] / page_height
                if top_ratio < 0.08 or top_ratio > 0.92:
                    if level == 0 or (len(group['text'].split()) < 5 and not group['text'].startswith('□')):
                        level = 0

                # 표/그림 다시 한번 걸러냄
                if level > 0:
                    if re.match(r'^(표|그림|table|figure|fig)\s*\d+', group['text'], re.IGNORECASE):
                        level = 0

                if level > 0:
                    title = group['text'].strip()
                    # 제목 끝 불필요한 구두점 제거 (단, 번호형 마침표는 유지)
                    title = re.sub(r'[;!?]$', '', title).strip()

                    sec_id = f"sec-{page_num}-{int(group['top'])}"
                    number = parse_section_number(title)

                    # ✅ 전역 중복 체크 (번호 기반)
                    if number:
                        if number in seen_numbers:
                            print(f"⏭️ Skip duplicate number: {number} '{title}'")
                            # 중복 번호지만 섹션 텍스트는 계속 누적
                            if current_section_id:
                                sections[current_section_id] = sections.get(current_section_id, "") + group['text'] + "\n"
                            continue
                        seen_numbers.add(number)
                    
                    # 텍스트 기반 중복 체크 (번호 떼고 순수 텍스트로 비교하여 "5 Conclusions"와 "Conclusions" 중복 방지)
                    clean_title_key = re.sub(r'^[\d\s\.]+', '', title).lower().strip()[:60]
                    if clean_title_key: # "2.2" 같이 텍스트가 없는 경우는 스킵 안함
                        if clean_title_key in seen_titles:
                            print(f"⏭️ Skip duplicate title: '{title}'")
                            if current_section_id:
                                sections[current_section_id] = sections.get(current_section_id, "") + group['text'] + "\n"
                            continue
                        seen_titles.add(clean_title_key)

                    # 같은 페이지 직전 항목과 좌표 중복 체크 (PDF 레이어 중복)
                    if toc and toc[-1].page == page_num + 1:
                        y_diff = abs(toc[-1].y - float(group['top']))
                        x_diff = abs(toc[-1].x - float(group['x0']))
                        if y_diff < 8 and x_diff < 8:
                            print(f"⏭️ Skip coordinate duplicate: '{title}'")
                            continue

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
                    page_toc_items.append(toc_item)
                    sections[sec_id] = title + "\n"
                    current_section_id = sec_id
                    print(f"✅ L{level} p{page_num+1}: '{title}' (num={number})")

                else:
                    # 본문 텍스트 → 현재 섹션에 누적
                    if current_section_id:
                        existing = sections.get(current_section_id, "")
                        # 섹션당 최대 8000자 (AI 컨텍스트 과부하 방지)
                        if len(existing) < 8000:
                            sections[current_section_id] = existing + group['text'] + "\n"

            # 페이지가 끝나면, 왼쪽 열 -> 오른쪽 열 순으로 정렬하여 TOC에 편입
            page_toc_items.sort(key=lambda item: (
                0 if item.x < page_width * 0.45 else 1,  # Left column first
                item.y                                   # Then top-to-bottom
            ))
            for item in page_toc_items:
                item.readingOrder = reading_order_counter
                toc.append(item)
                reading_order_counter += 1

    print(f"\n📋 총 TOC 항목: {len(toc)}개")
    return PDFParseResult(
        numPages=num_pages,
        toc=toc,
        sections=sections
    )


@app.get("/health")
def health():
    return {"status": "ok"}