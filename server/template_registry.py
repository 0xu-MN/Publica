"""
Template Registry — Hardcoded cell coordinate maps for government grant DOCX forms.
Each entry tells the mapper exactly which table/row/col to insert AI content into.

Coordinate Convention:
  table_index: 0-based index into doc.tables[]
  row:         0-based row index within that table
  col:         0-based UNIQUE cell index (after deduplicating merged cells via _tc)

How auto-detection works:
  We scan all text in the first 3 tables of the uploaded DOCX.
  If the text matches any `identifier_keywords`, we select that template config.
"""

TEMPLATE_REGISTRY = {
    "예비창업패키지": {
        # Structural detection: checks if TABLE 4 has PSST layout
        "identifier_keywords": ["사업계획서", "문제 인식", "실현 가능성"],
        # Also check structural pattern: Table with 문제인식/실현가능성/성장전략/팀구성 labels in col 0
        "structural_check": {
            "table_index": 4,
            "expected_labels": {
                2: "문제",   # Row 2, Col 0 should contain "문제"
                3: "실현",   # Row 3, Col 0 should contain "실현"
                4: "성장",   # Row 4, Col 0 should contain "성장"
                5: "팀",     # Row 5, Col 0 should contain "팀"
            }
        },
        "sections": {
            # TABLE 4 is the actual content input table
            # Each row has: [label_cell (col 0)] [big empty content cell (col 1)]
            "아이템개요": {
                "table_index": 4,
                "content_row": 1,
                "content_col": 1,   # col 1 = the big empty cell next to label
            },
            "문제인식": {
                "table_index": 4,
                "content_row": 2,
                "content_col": 1,
            },
            "실현가능성": {
                "table_index": 4,
                "content_row": 3,
                "content_col": 1,
            },
            "성장전략": {
                "table_index": 4,
                "content_row": 4,
                "content_col": 1,
            },
            "팀구성": {
                "table_index": 4,
                "content_row": 5,
                "content_col": 1,
            },
        },
        "style": {
            "font_name": "맑은 고딕",
            "font_size": 10,
            "line_spacing": 1.15,
        },
        # Tables to completely skip during heuristic fallback (e.g. ToC, summary)
        "skip_tables": [0, 1],
    },
}

# Normalized key aliases (maps various heading text → canonical section key)
SECTION_ALIASES = {
    "문제인식": ["문제인식", "문제 인식", "Problem", "problem"],
    "실현가능성": ["실현가능성", "실현 가능성", "솔루션", "Solution", "solution"],
    "성장전략": ["성장전략", "성장 전략", "Scale-up", "scale-up", "스케일업"],
    "팀구성": ["팀구성", "팀 구성", "팀역량", "Team", "team"],
    "아이템개요": ["아이템개요", "아이템 개요", "창업아이템", "개요"],
    "사업비": ["사업비", "예산", "사업비 산출", "Budget"],
}


def normalize_section_key(text: str) -> str:
    """Convert various heading texts to a canonical section key."""
    import re
    cleaned = re.sub(r'\s+', '', text)
    cleaned = re.sub(r'[0-9.]+', '', cleaned)  # Remove numbering like "1." "2."
    
    for canonical, aliases in SECTION_ALIASES.items():
        for alias in aliases:
            if alias.replace(' ', '') in cleaned:
                return canonical
    return None


def detect_template(doc) -> dict:
    """
    Auto-detect which government form this DOCX is.
    
    Strategy 1: Structural check — verify if specific table cells contain expected labels.
    Strategy 2: Keyword scanning fallback — scan text in first few tables.
    
    Returns the matching template config dict, or None if not recognized.
    """
    for template_name, config in TEMPLATE_REGISTRY.items():
        # Strategy 1: Structural check (most reliable)
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
                        if len(unique_cells) > 0:
                            cell_text = unique_cells[0].text.replace(" ", "")
                            if expected_text in cell_text:
                                match_count += 1
                
                if match_count >= len(expected) * 0.75:  # 75%+ match = confirmed
                    print(f"✅ Template detected (structural): {template_name} ({match_count}/{len(expected)} labels matched)")
                    return config
        
        # Strategy 2: Keyword scanning fallback
        scan_text = ""
        for i, table in enumerate(doc.tables):
            if i >= 5:
                break
            for row in table.rows:
                for cell in row.cells:
                    scan_text += cell.text + " "
        
        scan_text_clean = scan_text.replace(" ", "")
        keyword_matches = sum(1 for kw in config["identifier_keywords"] if kw.replace(" ", "") in scan_text_clean)
        
        if keyword_matches >= 2:  # At least 2 keywords match
            print(f"✅ Template detected (keyword): {template_name} ({keyword_matches} keywords)")
            return config
    
    print("⚠️ No template matched — falling back to heuristic mode")
    return None


def get_unique_cells(row):
    """Get deduplicated cells from a row (handles merged cells)."""
    unique = []
    seen_tcs = set()
    for cell in row.cells:
        if cell._tc not in seen_tcs:
            seen_tcs.add(cell._tc)
            unique.append(cell)
    return unique
