import sys
import os
import re

sys.path.append(os.path.abspath("server"))
import pdfplumber

def group_by_line(words, y_tolerance=4, x_tolerance=20):
    if not words: return []
    sorted_words = sorted(words, key=lambda w: (w['top'], w['x0']))
    lines = []
    current_line = [sorted_words[0]]
    for word in sorted_words[1:]:
        last_word = current_line[-1]
        if abs(word['top'] - last_word['top']) < y_tolerance:
            if word['x0'] - last_word['x1'] > x_tolerance:
                lines.append(current_line)
                current_line = [word]
            else:
                current_line.append(word)
        else:
            lines.append(current_line)
            current_line = [word]
    if current_line:
        lines.append(current_line)
    grouped = []
    for line in lines:
        if not line: continue
        text = " ".join([w['text'] for w in line])
        avg_size = sum([w['size'] for w in line]) / len(line)
        grouped.append({'text': text, 'fontname': line[0].get('fontname', '')})
    return grouped

def determine_level(group, body_size):
    text = group['text'].strip()
    text = re.sub(r'^([IIVXLCDM]+|[A-Z]|\d+(?:\.\d+)*)\.?\s+\1\.', r'\1.', text)
    if re.search(r'^(표|그림|table|figure|fig\.?|ref\.?)\s*[\d\[\(]', text, re.IGNORECASE): return 0, text
    if re.search(r'(다\.|함\.|됨\.|음\.|니다\.|기\.|고\.|며\.|은\.|는\.|이\.|가\.|을\.|를\.|,\s*|;\s*|\.\s*)$', text): return 0, text
    is_korean_box = text.startswith('□') or text.startswith('■') or text.startswith('▣') or text.startswith('▶')
    number_match = re.match(r'^([IIVXLCDM]+\.|[A-Z]\.|\d{1,2}\.|\d{1,2}(?:\.\d{1,2})+\.?)\s+(.*)', text)
    clean_text = re.sub(r'^[\d\s\.]+', '', text).strip()
    is_academic = bool(re.match(r'^(abstract|introduction|background|methods|materials and methods|results|discussion|conclusions|references)$', clean_text, re.IGNORECASE))

    if is_academic: return 1, text
    if is_korean_box: return (2, text) if len(text.split()) <= 8 else (0, text)

    if number_match:
        num = number_match.group(1).rstrip('.')
        content = number_match.group(2).strip()
        if not content or re.match(r'^[a-z\-•·oㅇ○\*]', content): return 0, text
        if len(text) > 150 or len(text.split()) > 25: return 0, text
        dots = num.count('.')
        return dots+1 if dots < 3 else 3, text
        
    return 0, text

with pdfplumber.open("public/sample.pdf") as pdf:
    for i in range(len(pdf.pages)):
        words = pdf.pages[i].extract_words(extra_attrs=['size', 'fontname'])
        groups = group_by_line(words)
        for g in groups:
            lvl, txt = determine_level(g, 12.0)
            if lvl > 0:
                print(f"Page {i+1} [{lvl}] {txt}")
