"""
Template Registry — 정부지원사업 DOCX 양식 매핑 엔진

두 가지 모드:
  1. 하드코딩 레지스트리: 알려진 양식(예비창업패키지 등)에 대해 정확한 셀 좌표 사용
  2. AI 동적 분석: 처음 보는 양식도 Gemini가 구조를 읽고 섹션 매핑 자동 생성

Coordinate Convention:
  table_index: doc.tables[]의 0-based 인덱스
  row:         해당 테이블 내 0-based 행 인덱스
  col:         병합셀 dedup 후 0-based 고유 셀 인덱스
"""

import hashlib
import re
import urllib.request

# ─────────────────────────────────────────────
# 하드코딩 레지스트리 (정밀도 최우선)
# ─────────────────────────────────────────────

TEMPLATE_REGISTRY = {
    "예비창업패키지": {
        "identifier_keywords": ["사업계획서", "문제 인식", "실현 가능성"],
        "structural_check": {
            "table_index": 4,
            "expected_labels": {
                2: "문제",
                3: "실현",
                4: "성장",
                5: "팀",
            }
        },
        "sections": {
            "아이템개요": {"table_index": 4, "content_row": 1, "content_col": 1},
            "문제인식":   {"table_index": 4, "content_row": 2, "content_col": 1},
            "실현가능성": {"table_index": 4, "content_row": 3, "content_col": 1},
            "성장전략":   {"table_index": 4, "content_row": 4, "content_col": 1},
            "팀구성":     {"table_index": 4, "content_row": 5, "content_col": 1},
        },
        "style": {"font_name": "맑은 고딕", "font_size": 10, "line_spacing": 1.15},
        "skip_tables": [0, 1],
    },

    "초기창업패키지": {
        "identifier_keywords": ["초기창업패키지", "창업아이템", "사업화"],
        "structural_check": None,
        "sections": {
            "창업아이템개요": {"table_index": 3, "content_row": 1, "content_col": 1},
            "문제인식":       {"table_index": 3, "content_row": 2, "content_col": 1},
            "실현가능성":     {"table_index": 3, "content_row": 3, "content_col": 1},
            "성장전략":       {"table_index": 3, "content_row": 4, "content_col": 1},
            "팀구성":         {"table_index": 3, "content_row": 5, "content_col": 1},
        },
        "style": {"font_name": "맑은 고딕", "font_size": 10, "line_spacing": 1.15},
        "skip_tables": [0, 1, 2],
    },

    "TIPS": {
        "identifier_keywords": ["TIPS", "기술혁신", "민간투자"],
        "structural_check": None,
        "sections": {
            "기술개요":   {"table_index": 2, "content_row": 1, "content_col": 1},
            "문제인식":   {"table_index": 2, "content_row": 2, "content_col": 1},
            "기술혁신성": {"table_index": 2, "content_row": 3, "content_col": 1},
            "사업화전략": {"table_index": 2, "content_row": 4, "content_col": 1},
            "팀구성":     {"table_index": 2, "content_row": 5, "content_col": 1},
        },
        "style": {"font_name": "맑은 고딕", "font_size": 10},
        "skip_tables": [0],
    },
}


# ─────────────────────────────────────────────
# 섹션 별칭 매핑 (다양한 표현 → 표준 키)
# ─────────────────────────────────────────────

SECTION_ALIASES = {
    # 문제/필요성
    "문제인식":     ["문제인식", "문제 인식", "Problem", "problem", "필요성", "배경", "문제점", "현황및문제점", "현황 및 문제점"],
    # 솔루션/기술
    "실현가능성":   ["실현가능성", "실현 가능성", "솔루션", "Solution", "solution", "기술개요", "기술혁신성", "혁신성", "차별성", "핵심기술"],
    # 성장/시장
    "성장전략":     ["성장전략", "성장 전략", "Scale-up", "scale-up", "스케일업", "사업화전략", "시장진출", "시장성", "목표시장", "사업화계획"],
    # 팀
    "팀구성":       ["팀구성", "팀 구성", "팀역량", "Team", "team", "추진팀", "창업팀", "인력현황"],
    # 개요/아이템
    "아이템개요":   ["아이템개요", "아이템 개요", "창업아이템", "개요", "사업개요", "아이템", "창업아이템개요", "제품서비스"],
    # 사업비
    "사업비":       ["사업비", "예산", "사업비 산출", "Budget", "budget", "소요예산", "사업비계획"],
    # 기대효과
    "기대효과":     ["기대효과", "기대 효과", "효과", "impact", "Impact", "파급효과"],
    # 추진일정
    "추진일정":     ["추진일정", "일정", "마일스톤", "milestone", "Milestone", "실행계획"],
}


def normalize_section_key(text: str) -> str:
    """다양한 표현을 표준 섹션 키로 변환."""
    cleaned = re.sub(r'\s+', '', text)
    cleaned = re.sub(r'[0-9.①②③④⑤]+', '', cleaned)  # 번호 제거
    cleaned = re.sub(r'[()（）\[\]]', '', cleaned)

    for canonical, aliases in SECTION_ALIASES.items():
        for alias in aliases:
            if alias.replace(' ', '') in cleaned:
                return canonical
    return None


def get_unique_cells(row):
    """병합셀 dedup — 행에서 고유 셀만 반환."""
    unique = []
    seen_tcs = set()
    for cell in row.cells:
        if cell._tc not in seen_tcs:
            seen_tcs.add(cell._tc)
            unique.append(cell)
    return unique


# ─────────────────────────────────────────────
# 하드코딩 템플릿 감지
# ─────────────────────────────────────────────

def detect_template(doc) -> dict:
    """
    알려진 양식 자동 감지.
    Strategy 1: 구조적 확인 (특정 셀에 특정 레이블이 있는지)
    Strategy 2: 키워드 스캔 폴백
    """
    for template_name, config in TEMPLATE_REGISTRY.items():
        structural = config.get("structural_check")
        if structural:
            t_idx = structural["table_index"]
            expected = structural["expected_labels"]
            if t_idx < len(doc.tables):
                table = doc.tables[t_idx]
                match_count = 0
                for row_idx, expected_text in expected.items():
                    row_idx = int(row_idx)
                    if row_idx < len(table.rows):
                        unique_cells = get_unique_cells(table.rows[row_idx])
                        if unique_cells:
                            cell_text = unique_cells[0].text.replace(" ", "")
                            if expected_text in cell_text:
                                match_count += 1
                if match_count >= len(expected) * 0.75:
                    print(f"✅ 템플릿 감지 (구조적): {template_name} ({match_count}/{len(expected)} 라벨 일치)")
                    return config

        scan_text = ""
        for i, table in enumerate(doc.tables):
            if i >= 5:
                break
            for row in table.rows:
                for cell in row.cells:
                    scan_text += cell.text + " "
        scan_text_clean = scan_text.replace(" ", "")
        keyword_matches = sum(1 for kw in config["identifier_keywords"] if kw.replace(" ", "") in scan_text_clean)
        if keyword_matches >= 2:
            print(f"✅ 템플릿 감지 (키워드): {template_name} ({keyword_matches}개 키워드)")
            return config

    print("⚠️ 알려진 템플릿 없음 — AI 동적 분석으로 전환")
    return None


# ─────────────────────────────────────────────
# DOCX 구조 텍스트 추출 (AI 분석용)
# ─────────────────────────────────────────────

def extract_docx_structure(doc) -> str:
    """
    DOCX의 모든 테이블 구조를 AI가 읽기 쉬운 텍스트로 추출.
    출력 예:
      [테이블 0]
        행 0: | 사업계획서 제목 | 2024년 예비창업패키지 |
        행 1: | 문제인식 | (빈 칸) |
    """
    lines = []
    for t_idx, table in enumerate(doc.tables):
        lines.append(f"\n[테이블 {t_idx}] ({len(table.rows)}행 × {len(table.columns)}열)")
        for r_idx, row in enumerate(table.rows):
            unique_cells = get_unique_cells(row)
            cell_texts = []
            for c_idx, cell in enumerate(unique_cells):
                text = cell.text.strip()
                if not text:
                    text = "(빈 칸)"
                elif len(text) > 80:
                    text = text[:80] + "..."
                cell_texts.append(f"[열{c_idx}]{text}")
            lines.append(f"  행 {r_idx}: " + " | ".join(cell_texts))
    return "\n".join(lines)


# ─────────────────────────────────────────────
# 파일 해시 (캐싱용)
# ─────────────────────────────────────────────

def get_file_hash(file_path: str) -> str:
    """MD5 해시로 파일 식별 (같은 양식 → 재분석 방지)."""
    h = hashlib.md5()
    with open(file_path, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            h.update(chunk)
    return h.hexdigest()


# ─────────────────────────────────────────────
# AI 동적 템플릿 분석 (핵심 신규 기능)
# ─────────────────────────────────────────────

# 인메모리 캐시: {파일해시: template_config}
_ai_template_cache: dict = {}


def analyze_template_with_ai(doc, file_path: str, gemini_api_key: str, announcement_sections: list = None) -> dict:
    """
    Gemini AI로 DOCX 양식 구조를 분석하여 동적 섹션 매핑을 생성.

    announcement_sections: 공고에서 추출한 필수 섹션 목록 (있으면 더 정확한 매핑 가능)
    Returns: template_config dict (TEMPLATE_REGISTRY와 동일한 구조)
    """
    file_hash = get_file_hash(file_path)
    if file_hash in _ai_template_cache:
        print(f"✅ AI 템플릿 캐시 히트: {file_hash[:8]}...")
        return _ai_template_cache[file_hash]

    structure_text = extract_docx_structure(doc)

    sections_hint = ""
    if announcement_sections:
        sections_hint = f"\n\n[이 공고에서 필요한 섹션들]: {', '.join(announcement_sections)}"

    prompt = f"""당신은 정부지원사업 사업계획서 양식 분석 전문가입니다.

아래는 업로드된 DOCX 양식의 테이블 구조입니다. 각 테이블의 행/열 구조와 셀 내용을 분석하여,
**사용자가 실제 사업계획서 내용을 입력해야 하는 셀들**의 정확한 좌표(테이블 인덱스, 행, 열)를 파악해주세요.{sections_hint}

[분석 기준]
- "문제인식", "실현가능성", "성장전략", "팀구성" 등의 레이블 옆/아래에 있는 빈 칸이 입력 대상입니다
- 레이블 셀(열0) 옆의 큰 빈 칸(열1)이 내용 입력 셀인 경우가 많습니다
- 양식 제목, 날짜, 사업자 정보 등 메타 셀은 제외하세요
- 가장 중요한 본문 섹션들의 좌표만 반환하세요 (최대 8개)

[DOCX 구조]
{structure_text}

반드시 아래 JSON 포맷으로만 응답하세요. 앞뒤 텍스트나 마크다운 블록은 절대 붙이지 마세요:
{{
  "template_name": "분석된 양식명 (예: 예비창업패키지, 도전K-스타트업 등)",
  "sections": {{
    "섹션키": {{
      "table_index": 0,
      "content_row": 1,
      "content_col": 1,
      "label": "실제 레이블 텍스트"
    }}
  }},
  "style": {{
    "font_name": "맑은 고딕",
    "font_size": 10
  }}
}}"""

    try:
        import json as _json

        req_data = _json.dumps({
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.1}
        }).encode("utf-8")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key={gemini_api_key}"
        req = urllib.request.Request(url, data=req_data, headers={"Content-Type": "application/json"})

        with urllib.request.urlopen(req, timeout=45) as resp:
            result = _json.loads(resp.read().decode("utf-8"))

        ai_text = result["candidates"][0]["content"]["parts"][0]["text"].strip()

        # JSON 추출
        json_match = re.search(r'\{[\s\S]*\}', ai_text)
        if not json_match:
            raise ValueError("AI 응답에서 JSON을 찾을 수 없음")

        ai_config = _json.loads(json_match.group(0))

        # 유효성 검증
        if "sections" not in ai_config or not ai_config["sections"]:
            raise ValueError("AI가 섹션 매핑을 생성하지 못함")

        template_config = {
            "identifier_keywords": [],
            "structural_check": None,
            "sections": ai_config["sections"],
            "style": ai_config.get("style", {"font_name": "맑은 고딕", "font_size": 10}),
            "skip_tables": [],
            "_ai_generated": True,
            "_template_name": ai_config.get("template_name", "AI 분석 양식"),
        }

        # 캐시 저장
        _ai_template_cache[file_hash] = template_config
        print(f"✅ AI 템플릿 분석 완료: {ai_config.get('template_name')} → {list(ai_config['sections'].keys())}")
        return template_config

    except Exception as e:
        print(f"❌ AI 템플릿 분석 실패: {e}")
        return None


# ─────────────────────────────────────────────
# 공고문 분석 (평가기준 추출)
# ─────────────────────────────────────────────

def analyze_announcement_with_ai(announcement_text: str, gemini_api_key: str) -> dict:
    """
    공고문 텍스트에서 평가기준, 배점, 필수 섹션, 글자수 제한 등을 추출.

    Returns:
    {
        "evaluation_criteria": [{"item": "기술혁신성", "score": 30, "description": "...", "keywords": [...]}],
        "required_sections": ["문제인식", "실현가능성", ...],
        "writing_hints": {"문제인식": "평가위원이 이 부분에서 체크하는 핵심은...", ...},
        "form_info": {"title": "예비창업패키지", "agency": "중소벤처기업부", "deadline": "..."},
        "character_limits": {"문제인식": 1000, ...}
    }
    """
    import json as _json

    prompt = f"""당신은 대한민국 정부지원사업 공고문 분석 전문가입니다.

아래 공고문을 분석하여 사업계획서 작성에 필요한 모든 정보를 추출해주세요.

[추출 항목]
1. 평가기준: 항목명, 배점, 평가 포인트 설명, 합격에 필요한 핵심 키워드
2. 필수 작성 섹션: 사업계획서에 반드시 포함해야 할 항목들
3. 작성 힌트: 각 섹션별로 "평가위원이 실제로 보는 포인트"와 "합격률을 높이는 작성 방법"
4. 양식 정보: 공고명, 주관기관, 지원 규모
5. 글자수/분량 제한 (있는 경우)

[공고문]
{announcement_text[:8000]}

반드시 아래 JSON 포맷으로만 응답하세요:
{{
  "evaluation_criteria": [
    {{
      "item": "평가항목명",
      "score": 30,
      "description": "평가 설명",
      "keywords": ["핵심키워드1", "핵심키워드2"],
      "weight": "high"
    }}
  ],
  "required_sections": ["문제인식", "실현가능성", "성장전략", "팀구성"],
  "writing_hints": {{
    "문제인식": "이 섹션에서 평가위원이 체크하는 핵심 포인트와 작성 전략",
    "실현가능성": "..."
  }},
  "form_info": {{
    "title": "공고명",
    "agency": "주관기관",
    "budget": "지원금액",
    "deadline": "접수마감"
  }},
  "character_limits": {{
    "문제인식": 1000
  }},
  "pass_strategy": "이 공고에서 합격하기 위한 전체 전략 2~3문장"
}}"""

    try:
        req_data = _json.dumps({
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.1}
        }).encode("utf-8")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key={gemini_api_key}"
        req = urllib.request.Request(url, data=req_data, headers={"Content-Type": "application/json"})

        with urllib.request.urlopen(req, timeout=60) as resp:
            result = _json.loads(resp.read().decode("utf-8"))

        ai_text = result["candidates"][0]["content"]["parts"][0]["text"].strip()
        json_match = re.search(r'\{[\s\S]*\}', ai_text)
        if not json_match:
            raise ValueError("JSON 없음")

        return _json.loads(json_match.group(0))

    except Exception as e:
        print(f"❌ 공고문 분석 실패: {e}")
        return None
