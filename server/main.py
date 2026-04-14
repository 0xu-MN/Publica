import io
import fitz
import pdfplumber
import re
import math
import os
import tempfile
import zipfile
import shutil
from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from typing import List, Optional
try:
    from lxml import etree
except ImportError:
    pass

import docx_mapper

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
    summary: Optional[str] = None

def get_body_font_size(words):
    if not words:
        return 12.0
    freq = {}
    for w in words:
        size = round(w['size'] * 2) / 2
        # 글자 수만큼 가중치를 부여하여, 잘게 쪼개진 작은 표 숫자들이 본문 크기를 왜곡하지 않도록 방지
        weight = len(w.get('text', 'a'))
        freq[size] = freq.get(size, 0) + weight
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

def is_bold(fontname):
    if not fontname: return False
    name_lower = fontname.lower()
    # HWP PDF 변환 시 'hdr' (header) 폰트가 대제목으로 쓰이는 경우가 많음
    return any(w in name_lower for w in ['bold', 'heavy', 'black', 'godic', '고딕', 'hdr'])

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

    # ── 0. 명백한 본문/불릿 기호 거르기 (절대 제목이 될 수 없음) ──────────────────────
    if re.match(r'^[\-◦•※\*]\s', text) or re.match(r'^[-◦•※\*]$', text):
        return 0, group['text']
    # 원문자(①, ②, ⓐ, ㉮ 등)로 시작하는 항목은 대개 세부 지시사항이거나 본문 리스트임
    if re.match(r'^[①-⑳ⓐ-ⓩ㉠-㉾]', text):
        return 0, group['text']

    # ── 1. 명백한 비제목 패턴 제거 ──────────────────────────────────────────

    # 표/그림 캡션 제외
    if re.search(r'^(표|그림|table|figure|fig\.?|ref\.?)\s*[\d\[\(]', text, re.IGNORECASE):
        return 0, group['text']

    # 폰트 기반 크기/굵기 확인
    is_large = group['size'] > body_size * 1.15
    is_very_large = group['size'] > body_size * 1.3
    group_is_bold = is_bold(group.get('fontname', ''))

    # ✅ 새로운 FIX: 참고문헌(References) 가짜 제목 필터링
    # 번호로 시작하지만, 본문 크기이고 굵지 않으며, 길이가 제법 길면 참고문헌 의심
    if not is_large and not group_is_bold and len(text) > 30:
        # 연도, 페이지, vol, 또는 전형적인 서지사항 저자 이름 패턴 (& Name, Name Initial)
        if re.search(r'\(\d{4}\)|vol\.|pp\.|[A-Z][a-z]+\s+[A-Z]\.?\s*\&|&\s*[A-Z][a-z]+', text):
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
        # 폰트 크기가 충분히 크지 않은 단순 체크박스는 제목 취급 불가
        if not is_large and not group_is_bold:
            return 0, group['text']
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

    # ── 6. 한국어 공문서 개요 기호 (가., 1), 가), (1)) ────────────────────────
    korean_outline = re.match(r'^([가-하]\.|\d{1,2}\)|[가-하]\)|\(\d{1,2}\)|\([가-하]\))\s+(.*)', text)
    if korean_outline:
        content = korean_outline.group(2).strip()
        if not content or re.match(r'^[a-z\-•·oㅇ○\*]', content) or len(text) > 100:
             return 0, group['text']
        if re.search(r'(다|함|됨|음|니다)[\.\s]*$', content):
             return 0, group['text']
        return 3, text

    # ── 7. 폰트 크기 기반 무번호 대제목 추론 (정부 공고문용 최후의 보루) ────────────────────────
    # 숫자가 전혀 없더라도, 글씨가 압도적으로 크고 굵으면 대제목(L1)으로 인정
    if is_very_large and group_is_bold and len(text) < 40 and len(text.split()) < 8:
        # 단, 진짜 문장처럼 마침표나 종결어미로 끝나면 안됨
        stripped_for_check = text.rstrip()
        if not re.search(r'(다\.|함\.|됨\.|음\.|니다\.|기\.|고\.|며\.|은\.|는\.|이\.|가\.|을\.|를\.|,\s*|;\s*|\.\s*)$', stripped_for_check):
             # 압도적으로 크고 굵은 무번호 제목은 보통 1 레벨로 간주
             return 1, text

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

    file_content = await file.read()
    
    # 1. 문서 메타데이터 TOC (Bookmarks) 우선 탐색 (fitz 사용)
    try:
        fitz_doc = fitz.open(stream=file_content, filetype="pdf")
        embedded_toc = fitz_doc.get_toc()
        # fitz.get_toc() 리턴 구조: [[level, title, page_num], ...]
        if embedded_toc and len(embedded_toc) > 0:
            print(f"🌟 SUCCESS: Found native embedded TOC with {len(embedded_toc)} items!")
            for idx, item in enumerate(embedded_toc):
                level, title, page_num_native = item[0], str(item[1]).strip(), int(item[2])
                
                # Sparkle 버튼을 위한 X, Y 좌표 계산
                x_coord, y_coord = 0.0, 0.0
                try:
                    # PyMuPDF pages are 0-indexed, internal TOC is typically 1-indexed
                    actual_page_idx = max(0, page_num_native - 1)
                    if actual_page_idx < len(fitz_doc):
                        # 목차의 페이지 번호가 실제 논리적 페이지와 다를 수 있으므로 해당 페이지와 다음 페이지(혹은 다다음)까지 검색
                        search_pages = [actual_page_idx, actual_page_idx + 1]
                        for search_idx in search_pages:
                            if search_idx >= len(fitz_doc): continue
                            page_obj = fitz_doc[search_idx]
                            
                            rects = page_obj.search_for(title)
                            
                            # PDF 본문에는 리거처(ligature)가 쓰였을 수 있음 (fi -> ﬁ, fl -> ﬂ)
                            if not rects and ("fi" in title or "fl" in title):
                                lig_title = title.replace("fi", "ﬁ").replace("fl", "ﬂ")
                                rects = page_obj.search_for(lig_title)
                                
                            # 목차 메타데이터 번호 형식("2. ")과 실제 본문 형식("2 ")이 다를 수 있음. 문자 부분만 추출하여 검색
                            if not rects:
                                clean_text_only = re.sub(r'^[\d\.\s]+', '', title)
                                if len(clean_text_only) > 5:
                                    rects = page_obj.search_for(clean_text_only)
                            
                            if not rects and len(title.split()) > 3:
                                short_title = " ".join(title.split()[:4])
                                rects = page_obj.search_for(short_title)
                                if not rects and ("fi" in short_title or "fl" in short_title):
                                    rects = page_obj.search_for(short_title.replace("fi", "ﬁ").replace("fl", "ﬂ"))
                                    
                            # 문자 부분만의 첫 3단어 검색 (단어 불일치 대비 최후 보루)
                            if not rects:
                                clean_text_only = re.sub(r'^[\d\.\s]+', '', title)
                                if len(clean_text_only.split()) > 2:
                                    short_clean = " ".join(clean_text_only.split()[:3])
                                    rects = page_obj.search_for(short_clean)
                                    
                            if not rects and len(title.split()) > 2:
                                short_title = " ".join(title.split()[:2])
                                rects = page_obj.search_for(short_title)
                                if not rects and ("fi" in short_title or "fl" in short_title):
                                    rects = page_obj.search_for(short_title.replace("fi", "ﬁ").replace("fl", "ﬂ"))
                                
                            if rects:
                                x_coord = float(rects[0].x0)
                                y_coord = float(rects[0].y0)
                                # 만약 실제 찾은 페이지가 목차 페이지와 다르면, 목차 페이지 넘버도 업데이트해줌
                                if search_idx != actual_page_idx:
                                    page_num_native = search_idx + 1
                                break
                except Exception:
                    pass

                toc.append(TOCItem(
                    id=f"native-toc-{idx}",
                    level=level,
                    title=title,
                    rawTitle=title,
                    number=parse_section_number(title),
                    page=page_num_native,
                    readingOrder=idx,
                    x=x_coord,
                    y=y_coord
                ))
            
            # 본문 추출 (검색/컨텍스트를 위해) - 목차 ID를 키로 매핑
            # 페이지별 텍스트를 추출한 뒤, 해당 페이지에 있는 목차 ID들에게 텍스트를 분배 (가장 단순한 폴백 매핑)
            page_to_tocs = {}
            for t in toc:
                if t.page not in page_to_tocs:
                    page_to_tocs[t.page] = []
                page_to_tocs[t.page].append(t)

            for page_num in range(len(fitz_doc)):
                # fitz_doc is 0-indexed, toc.page is 1-indexed
                page = fitz_doc[page_num]
                text = page.get_text("text") + "\n"
                
                tocs_on_page = page_to_tocs.get(page_num + 1, [])
                for t in tocs_on_page:
                    # 해당 페이지의 모든 목차 ID들에 대해 페이지 전체 텍스트를 할당 (클라이언트에서 어떤 걸 클릭해도 조회 가능)
                    sections[t.id] = text
                
                # 이전 버전 호환성을 위해 기본 sec- ID에도 저장
                sec_id = f"sec-{page_num}-0"
                sections[sec_id] = text
                
            return PDFParseResult(
                numPages=len(fitz_doc),
                toc=toc,
                sections=sections,
                summary=f"Native metadata TOC extracted. Pages: {len(fitz_doc)}"
            )
    except Exception as e:
        print(f"⚠️ PyMuPDF TOC extraction failed: {e}")
        pass

    # 2. 메타데이터 TOC가 없을 경우 기존의 휴리스틱 파서로 폴백
    with pdfplumber.open(io.BytesIO(file_content)) as pdf:
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


# ═══════════════════════════════════════════════════════════════
# 공고문 분석 엔드포인트
# 공고 텍스트 → 평가기준 / 배점 / 필수섹션 / 작성전략 자동 추출
# ═══════════════════════════════════════════════════════════════

class AnnouncementAnalysisRequest(BaseModel):
    announcement_text: str
    gemini_api_key: str

@app.post("/api/analyze-announcement")
async def analyze_announcement(request: AnnouncementAnalysisRequest):
    """
    공고문 텍스트를 분석하여 평가기준, 배점, 필수 섹션, 작성 힌트를 반환.
    프론트엔드에서 브레인스토밍/초안 작성 시 이 분석 결과를 프롬프트에 주입.
    """
    from template_registry import analyze_announcement_with_ai

    if not request.announcement_text or len(request.announcement_text.strip()) < 50:
        return JSONResponse(status_code=400, content={"error": "공고문 텍스트가 너무 짧습니다."})

    if not request.gemini_api_key:
        return JSONResponse(status_code=400, content={"error": "Gemini API 키가 필요합니다."})

    result = analyze_announcement_with_ai(request.announcement_text, request.gemini_api_key)
    if not result:
        return JSONResponse(status_code=500, content={"error": "공고문 분석에 실패했습니다. 다시 시도해주세요."})

    return JSONResponse(content=result)


# ═══════════════════════════════════════════════════════════════
# DOCX 양식 AI 분석 엔드포인트
# 처음 보는 양식도 AI가 구조를 읽고 섹션 매핑 자동 생성
# ═══════════════════════════════════════════════════════════════

@app.post("/api/analyze-docx-template")
async def analyze_docx_template(
    file: UploadFile = File(...),
    gemini_api_key: str = Form(...),
    announcement_sections: str = Form("[]"),
):
    """
    업로드된 DOCX 양식을 AI로 분석하여 섹션 → 셀 좌표 매핑 반환.
    내보내기 전에 호출하여 동적 매핑 테이블을 생성.
    """
    import json as _json
    from template_registry import analyze_template_with_ai
    import docx as _docx

    if not file.filename.endswith('.docx'):
        return JSONResponse(status_code=400, content={"error": "DOCX 파일만 지원됩니다."})

    try:
        sections_list = _json.loads(announcement_sections) if announcement_sections else []
    except Exception:
        sections_list = []

    temp_dir = tempfile.mkdtemp()
    input_path = os.path.join(temp_dir, "template.docx")

    try:
        content = await file.read()
        with open(input_path, "wb") as f:
            f.write(content)

        doc = _docx.Document(input_path)
        config = analyze_template_with_ai(doc, input_path, gemini_api_key, sections_list if sections_list else None)

        if not config:
            return JSONResponse(status_code=422, content={"error": "AI가 양식 구조를 인식하지 못했습니다. 하드코딩 레지스트리나 휴리스틱 모드로 처리됩니다."})

        return JSONResponse(content={
            "template_name": config.get("_template_name", "Unknown"),
            "sections": config.get("sections", {}),
            "style": config.get("style", {}),
        })
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


# ═══════════════════════════════════════════════════════════════
# HWPX 실제 XML 삽입 구현
# ═══════════════════════════════════════════════════════════════

def _hwpx_plain_text(html_content: str) -> str:
    """HTML → 순수 텍스트 변환 (HWPX 삽입용)."""
    from bs4 import BeautifulSoup as _BS
    soup = _BS(html_content, "html.parser")
    lines = []
    for elem in soup.find_all(['h1','h2','h3','h4','p','li']):
        text = elem.get_text().strip()
        if text:
            if elem.name in ['h1','h2','h3','h4']:
                lines.append(f"\n[{text}]\n")
            elif elem.name == 'li':
                lines.append(f"  • {text}")
            else:
                lines.append(text)
    return "\n".join(lines) if lines else html_content


def _build_hwp_paragraph(text: str, ns: str) -> "etree.Element":
    """HWP XML 단락 요소 생성."""
    para = etree.Element(f"{ns}p")
    run = etree.SubElement(para, f"{ns}run")
    char_elem = etree.SubElement(run, f"{ns}t")
    char_elem.text = text
    return para


def _insert_hwpx_content(section_xml_path: str, sections_content: dict) -> bool:
    """
    HWPX section0.xml의 테이블 셀에 내용 삽입.
    빈 셀을 찾아 AI가 추출한 섹션 내용을 순서대로 배치.
    """
    try:
        tree = etree.parse(section_xml_path)
        root = tree.getroot()

        # HWPX 네임스페이스 동적 감지
        ns_map = root.nsmap
        # 주요 네임스페이스 후보
        hp_ns = None
        for prefix, uri in ns_map.items():
            if 'hwpml' in uri.lower() or 'hml' in uri.lower() or (prefix in ('hp', 'hc', None) and 'para' in uri.lower()):
                hp_ns = uri
                break
        if not hp_ns:
            # 폴백: 첫 번째 non-None 네임스페이스
            for prefix, uri in ns_map.items():
                if prefix is not None:
                    hp_ns = uri
                    break

        ns = f"{{{hp_ns}}}" if hp_ns else ""

        # 테이블 찾기 (다양한 네임스페이스 대응)
        tables = root.findall(f".//{ns}tbl") or root.findall(".//tbl")
        if not tables:
            # 모든 하위 요소 중 'tbl' 포함하는 태그 검색
            tables = [e for e in root.iter() if e.tag.endswith('tbl')]

        print(f"📄 HWPX: {len(tables)}개 테이블 발견")

        content_list = list(sections_content.values())
        content_idx = 0

        for tbl in tables:
            # 셀 찾기
            cells = [e for e in tbl.iter() if e.tag.endswith('tc')]
            for cell in cells:
                if content_idx >= len(content_list):
                    break

                # 현재 셀 내용 확인 (짧거나 비어있으면 입력 대상)
                cell_text = "".join(e.text or "" for e in cell.iter() if e.text)
                if len(cell_text.strip()) > 200:
                    # 이미 내용이 있는 레이블 셀 — 스킵
                    continue

                # 기존 단락 제거 후 새 내용 삽입
                paras = [e for e in cell if e.tag.endswith('p')]
                for p in paras:
                    cell.remove(p)

                # 새 텍스트를 줄 단위로 단락 분할하여 삽입
                new_text = content_list[content_idx]
                for line in new_text.split('\n'):
                    line = line.strip()
                    if not line:
                        continue
                    p_elem = _build_hwp_paragraph(line, ns)
                    cell.append(p_elem)

                print(f"✅ HWPX 셀 삽입 완료 (섹션 {content_idx + 1})")
                content_idx += 1

        tree.write(section_xml_path, encoding='utf-8', xml_declaration=True)
        return True

    except Exception as e:
        import traceback
        print(f"❌ HWPX XML 삽입 오류: {e}")
        traceback.print_exc()
        return False


@app.post("/api/upload-hwpx")
async def process_hwpx(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    payload: str = Form("{}")
):
    """
    HWPX 양식에 AI 초안 내용 삽입.
    1. ZIP 압축 해제
    2. Contents/section0.xml 파싱
    3. 빈 테이블 셀에 HTML→텍스트 변환 후 삽입
    4. 재압축하여 반환
    """
    import json as _json

    if not file.filename.endswith('.hwpx'):
        return JSONResponse(status_code=400, content={"error": "Only .hwpx files are supported"})

    temp_dir = tempfile.mkdtemp()
    input_path = os.path.join(temp_dir, "input.hwpx")
    extract_dir = os.path.join(temp_dir, "extracted")
    output_path = os.path.join(temp_dir, "output.hwpx")

    try:
        content = await file.read()
        with open(input_path, "wb") as f:
            f.write(content)

        with zipfile.ZipFile(input_path, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)

        section0_path = os.path.join(extract_dir, 'Contents', 'section0.xml')
        if not os.path.exists(section0_path):
            # 대체 경로 탐색
            for root_dir, dirs, files in os.walk(extract_dir):
                for fname in files:
                    if 'section' in fname.lower() and fname.endswith('.xml'):
                        section0_path = os.path.join(root_dir, fname)
                        break

        # 페이로드에서 HTML 추출
        payload_html = ""
        try:
            payload_data = _json.loads(payload)
            payload_html = payload_data.get("document_html", "")
        except Exception:
            payload_html = payload

        if payload_html and os.path.exists(section0_path):
            # HTML → 섹션별 텍스트로 변환
            from bs4 import BeautifulSoup as _BS
            soup = _BS(payload_html, "html.parser")
            sections_content = {}
            current_key = "본문"
            current_texts = []

            for elem in soup.find_all(['h1','h2','h3','h4','p','ul','ol']):
                if elem.name in ['h1','h2','h3','h4']:
                    if current_texts:
                        sections_content[current_key] = "\n".join(current_texts)
                    current_key = elem.get_text().strip()
                    current_texts = [f"[{current_key}]"]
                elif elem.name in ['ul','ol']:
                    for li in elem.find_all('li'):
                        current_texts.append(f"• {li.get_text().strip()}")
                else:
                    text = elem.get_text().strip()
                    if text:
                        current_texts.append(text)
            if current_texts:
                sections_content[current_key] = "\n".join(current_texts)

            if sections_content:
                insert_ok = _insert_hwpx_content(section0_path, sections_content)
                print(f"{'✅' if insert_ok else '⚠️'} HWPX 내용 삽입: {'성공' if insert_ok else '실패 (원본 구조 유지)'}")

        # 재압축
        with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zip_out:
            for root_dir, _, files in os.walk(extract_dir):
                for f_name in files:
                    file_path = os.path.join(root_dir, f_name)
                    arcname = os.path.relpath(file_path, extract_dir)
                    zip_out.write(file_path, arcname)

        background_tasks.add_task(shutil.rmtree, temp_dir, ignore_errors=True)
        return FileResponse(
            output_path,
            filename=f"filled_{file.filename}",
            media_type="application/haansofthwp"
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        shutil.rmtree(temp_dir, ignore_errors=True)
        return JSONResponse(status_code=500, content={"error": str(e)})


# ═══════════════════════════════════════════════════════════════
# DOCX 자동 완성 (3단계 전략: 하드코딩 → AI동적 → 휴리스틱)
# ═══════════════════════════════════════════════════════════════

@app.post("/api/autofill-docx")
async def process_docx(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    payload: str = Form("{}")
):
    """
    DOCX 양식에 AI 초안 내용 자동 매핑.
    1. 하드코딩 레지스트리 (알려진 양식)
    2. AI 동적 분석 (처음 보는 양식)
    3. 휴리스틱 폴백
    """
    import json as _json

    if not file.filename.endswith('.docx'):
        return JSONResponse(status_code=400, content={"error": "Only .docx files are supported here"})

    payload_html = ""
    gemini_api_key = None
    announcement_sections = None

    try:
        payload_data = _json.loads(payload)
        payload_html = payload_data.get("document_html", "")
        gemini_api_key = payload_data.get("gemini_api_key")
        announcement_sections = payload_data.get("announcement_sections")
        print(f"📄 Payload 파싱 완료. HTML 길이: {len(payload_html)}자, Gemini키: {'있음' if gemini_api_key else '없음'}")
    except (_json.JSONDecodeError, TypeError):
        payload_html = payload
        print(f"⚠️ JSON 아님 — raw HTML 사용. 길이: {len(payload_html)}자")

    if not payload_html or len(payload_html.strip()) < 10:
        return JSONResponse(status_code=400, content={"error": "document_html이 비어있습니다. 에디터에 내용을 작성 후 내보내기를 시도하세요."})

    temp_dir = tempfile.mkdtemp()
    input_path = os.path.join(temp_dir, "input.docx")
    output_path = os.path.join(temp_dir, "output.docx")

    try:
        content = await file.read()
        print(f"📁 파일 수신: {file.filename} ({len(content)} bytes)")
        with open(input_path, "wb") as f:
            f.write(content)

        print(f"🚀 docx_mapper.fill_docx_template 시작 (3단계 전략)...")
        success = docx_mapper.fill_docx_template(
            input_path, payload_html, output_path,
            gemini_api_key=gemini_api_key,
            announcement_sections=announcement_sections
        )

        if not success:
            return JSONResponse(status_code=500, content={"error": "문서 매핑 실패. 서버 로그를 확인하세요."})

        print(f"✅ DOCX 매핑 성공 → {output_path}")
        background_tasks.add_task(shutil.rmtree, temp_dir, ignore_errors=True)
        return FileResponse(
            output_path,
            filename=f"filled_{file.filename}",
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        shutil.rmtree(temp_dir, ignore_errors=True)
        return JSONResponse(status_code=500, content={"error": str(e)})