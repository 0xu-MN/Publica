"""
docx_mapper.py — Coordinate-based DOCX Template Mapping Engine

Two modes:
  1. COORDINATE MODE: If template is recognized (via template_registry), use exact
     cell coordinates to insert content. Maximum precision.
  2. HEURISTIC MODE: For unrecognized forms, fallback to keyword-scanning heuristics.
"""
import docx
import os
import tempfile
import json
import re
from bs4 import BeautifulSoup
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.table import WD_ROW_HEIGHT_RULE
from template_registry import detect_template, normalize_section_key, get_unique_cells, SECTION_ALIASES


# ─────────────────────────────────────────────
# Shared Utilities
# ─────────────────────────────────────────────

def _reset_paragraph_format(p):
    """Forcefully cure overlapping text bugs in strict government forms."""
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
    p.paragraph_format.line_spacing = 1.0
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)


def _apply_style(run, style_config):
    """Apply font style from template config to a run."""
    if not style_config:
        return
    if "font_name" in style_config:
        run.font.name = style_config["font_name"]
    if "font_size" in style_config:
        run.font.size = Pt(style_config["font_size"])


def __render_markdown_text(p, text, style_config=None):
    """Parse **bold** markers and handle newlines. Optionally apply style."""
    text = text.replace('\\n', '\n')
    parts = re.split(r'(\*\*.*?\*\*)', text)
    
    for part in parts:
        if not part:
            continue
        is_bold = part.startswith('**') and part.endswith('**')
        clean_text = part[2:-2] if is_bold else part
        
        lines = clean_text.split('\n')
        for i, line in enumerate(lines):
            if line:
                run = p.add_run(line)
                if is_bold:
                    run.bold = True
                _apply_style(run, style_config)
            if i < len(lines) - 1:
                p.add_run().add_break()


def _clear_cell(cell):
    """Remove all existing content from a cell, preserving cell structure."""
    for paragraph in cell.paragraphs:
        for run in paragraph.runs:
            run.text = ""
        paragraph.text = ""
    # Remove extra paragraphs beyond the first
    while len(cell.paragraphs) > 1:
        p = cell.paragraphs[-1]
        p._element.getparent().remove(p._element)


def _insert_html_into_cell(cell, elements, style_config=None):
    """Insert parsed HTML elements into a specific cell with style preservation."""
    # Clear existing content first
    _clear_cell(cell)
    
    first_element = True
    for element in elements:
        if element.name in ['h1', 'h2', 'h3', 'h4']:
            level = int(element.name[1])
            if first_element:
                p = cell.paragraphs[0]
                first_element = False
            else:
                p = cell.add_paragraph()
            _reset_paragraph_format(p)
            p.paragraph_format.space_before = Pt(8)
            p.paragraph_format.space_after = Pt(3)
            run = p.add_run(element.get_text().strip())
            run.bold = True
            size = min(12, max(9, 13 - level))
            run.font.size = Pt(size)
            _apply_style(run, style_config)

        elif element.name == 'p':
            text = element.get_text().strip()
            if text:
                if first_element:
                    p = cell.paragraphs[0]
                    first_element = False
                else:
                    p = cell.add_paragraph()
                _reset_paragraph_format(p)
                p.paragraph_format.space_before = Pt(3)
                p.paragraph_format.space_after = Pt(3)
                __render_markdown_text(p, text, style_config)

        elif element.name in ['ul', 'ol']:
            for li in element.find_all('li', recursive=False):
                if first_element:
                    p = cell.paragraphs[0]
                    first_element = False
                else:
                    p = cell.add_paragraph()
                _reset_paragraph_format(p)
                p.paragraph_format.space_before = Pt(2)
                p.paragraph_format.left_indent = Pt(10)
                bullet_run = p.add_run("• ")
                _apply_style(bullet_run, style_config)
                __render_markdown_text(p, li.get_text().strip(), style_config)

        elif element.name == 'table':
            # Skip nested tables inside cells for now — just extract text
            rows = element.find_all('tr')
            for r in rows:
                cells_html = r.find_all(['td', 'th'])
                row_text = " | ".join(c.get_text().strip() for c in cells_html)
                if row_text.strip():
                    if first_element:
                        p = cell.paragraphs[0]
                        first_element = False
                    else:
                        p = cell.add_paragraph()
                    _reset_paragraph_format(p)
                    __render_markdown_text(p, row_text, style_config)

        elif element.name is None:
            text = str(element).strip()
            if text:
                if first_element:
                    p = cell.paragraphs[0]
                    first_element = False
                else:
                    p = cell.add_paragraph()
                _reset_paragraph_format(p)
                __render_markdown_text(p, text, style_config)


def insert_elements_into_container(container, elements, style_config=None):
    """Insert elements into a Document or Cell container (heuristic mode)."""
    for element in elements:
        if element.name in ['h1', 'h2', 'h3', 'h4']:
            level = int(element.name[1])
            p = container.add_paragraph()
            _reset_paragraph_format(p)
            p.paragraph_format.space_before = Pt(14)
            p.paragraph_format.space_after = Pt(4)
            run = p.add_run(element.get_text().strip())
            run.bold = True
            run.font.size = Pt(13 - (level * 1))

        elif element.name == 'p':
            text = element.get_text().strip()
            if text:
                p = container.add_paragraph()
                _reset_paragraph_format(p)
                p.paragraph_format.space_before = Pt(6)
                p.paragraph_format.space_after = Pt(6)
                __render_markdown_text(p, text, style_config)

        elif element.name in ['ul', 'ol']:
            for li in element.find_all('li', recursive=False):
                p = container.add_paragraph()
                _reset_paragraph_format(p)
                p.paragraph_format.space_before = Pt(4)
                p.paragraph_format.left_indent = Pt(14)
                p.add_run("• ")
                __render_markdown_text(p, li.get_text().strip(), style_config)

        elif element.name == 'table':
            rows = element.find_all('tr')
            if rows:
                max_cols = max([len(r.find_all(['td', 'th'])) for r in rows])
                docx_table = container.add_table(rows=0, cols=max_cols)
                try:
                    docx_table.style = 'Table Grid'
                except KeyError:
                    pass
                for i, r in enumerate(rows):
                    cells = r.find_all(['td', 'th'])
                    if cells:
                        row_cells = docx_table.add_row().cells
                        for j, c in enumerate(cells):
                            if j < len(row_cells):
                                target_cell = row_cells[j]
                                p = target_cell.paragraphs[0]
                                _reset_paragraph_format(p)
                                p.text = ""
                                __render_markdown_text(p, c.get_text().strip(), style_config)
                                if c.name == 'th':
                                    for run in p.runs:
                                        run.bold = True

        elif element.name is None:
            text = str(element).strip()
            if text:
                p = container.add_paragraph()
                _reset_paragraph_format(p)
                p.paragraph_format.space_before = Pt(6)
                __render_markdown_text(p, text, style_config)


# ─────────────────────────────────────────────
# HTML → Section Parser
# ─────────────────────────────────────────────

def parse_html_into_sections(payload_html: str) -> dict:
    """
    Parse AI-generated HTML into named sections.
    Returns: { "문제인식": [elements...], "실현가능성": [elements...], ... }
    """
    # Pre-process HTML bold tags into Markdown equivalent
    payload_html = payload_html.replace('<strong>', '**').replace('</strong>', '**')
    payload_html = payload_html.replace('<b>', '**').replace('</b>', '**')

    soup = BeautifulSoup(payload_html, "html.parser")
    all_elements = list(soup.body.children if soup.body else soup.children)

    sections = {}
    current_key = "도입부"
    sections[current_key] = []

    for element in all_elements:
        if element.name in ['h1', 'h2', 'h3', 'h4']:
            text = element.get_text().strip()
            n_key = normalize_section_key(text)
            if n_key:
                current_key = n_key

            if current_key not in sections:
                sections[current_key] = []
            sections[current_key].append(element)
        else:
            if str(element).strip():
                if current_key not in sections:
                    sections[current_key] = []
                sections[current_key].append(element)

    return sections, all_elements


# ─────────────────────────────────────────────
# MODE 1: Coordinate-based Fill (Precision)
# ─────────────────────────────────────────────

def coordinate_based_fill(doc, template_config, payload_html, output_path) -> bool:
    """
    Use hardcoded cell coordinates from the template registry to insert
    AI content into the exact right cells. Maximum accuracy.
    """
    try:
        sections, all_elements = parse_html_into_sections(payload_html)
        style_config = template_config.get("style", {})
        section_map = template_config.get("sections", {})
        mapped_keys = set()

        print(f"📋 Parsed sections: {list(sections.keys())}")
        print(f"📋 Template sections: {list(section_map.keys())}")

        for section_key, coord in section_map.items():
            t_idx = coord["table_index"]
            r_idx = coord["content_row"]
            c_idx = coord["content_col"]

            if t_idx >= len(doc.tables):
                print(f"⚠️ Table index {t_idx} out of range (doc has {len(doc.tables)} tables)")
                continue

            table = doc.tables[t_idx]
            if r_idx >= len(table.rows):
                print(f"⚠️ Row index {r_idx} out of range in table {t_idx}")
                continue

            # Get the unique (deduplicated) cells in the target row
            unique_cells = get_unique_cells(table.rows[r_idx])
            if c_idx >= len(unique_cells):
                print(f"⚠️ Col index {c_idx} out of range in table {t_idx} row {r_idx}")
                continue

            target_cell = unique_cells[c_idx]

            # Find matching section content
            if section_key in sections and len(sections[section_key]) > 0:
                print(f"✅ Inserting '{section_key}' → Table {t_idx}, Row {r_idx}, Col {c_idx}")
                _insert_html_into_cell(target_cell, sections[section_key], style_config)
                mapped_keys.add(section_key)
            else:
                print(f"⚠️ No content found for section '{section_key}'")

        # Handle unmapped sections (append at end)
        unmapped = [k for k in sections.keys() if k not in mapped_keys and k != "도입부"]
        if unmapped:
            print(f"📎 Unmapped sections will be appended: {unmapped}")
            doc.add_page_break()
            title_para = doc.add_paragraph()
            title_run = title_para.add_run("=== 추가 AI 분석 내용 ===")
            title_run.bold = True
            title_run.font.size = Pt(13)
            for k in unmapped:
                insert_elements_into_container(doc, sections[k], style_config)

        # XML-Level fix: Remove rigid row heights
        _fix_row_heights(doc)

        doc.save(output_path)
        print(f"✅ Coordinate-based fill complete → {output_path}")
        return True

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"❌ Coordinate-based fill error: {e}")
        return False


# ─────────────────────────────────────────────
# MODE 2: Heuristic Fill (Fallback)
# ─────────────────────────────────────────────

def heuristic_fill(doc, payload_html, output_path) -> bool:
    """
    Fallback for unrecognized templates. Scans table cells for keywords
    and tries to insert content into adjacent cells.
    """
    try:
        sections, all_elements = parse_html_into_sections(payload_html)
        mapped_keys = set()

        for table in doc.tables:
            # Skip ToC / summary tables
            table_head_text = ""
            if len(table.rows) > 0:
                table_head_text = "".join(c.text for c in table.rows[0].cells).replace(" ", "")
            if "목차" in table_head_text or "개요" in table_head_text or "요약" in table_head_text:
                continue

            for r_idx, row in enumerate(table.rows):
                for c_idx, cell in enumerate(row.cells):
                    cell_text = cell.text.strip()
                    n_key = normalize_section_key(cell_text)

                    if "{{본문}}" in cell_text or "{{내용}}" in cell_text:
                        cell.text = ""
                        insert_elements_into_container(cell, all_elements)
                        mapped_keys.add("본문")
                        continue

                    if n_key and n_key in sections and n_key not in mapped_keys:
                        target_cell = None

                        # Strategy 1: single merged row below
                        if r_idx + 1 < len(table.rows):
                            below_row = table.rows[r_idx + 1]
                            if len(set(c._tc for c in below_row.cells)) == 1:
                                target_cell = below_row.cells[0]

                        # Strategy 2: right cell (different _tc)
                        if not target_cell and c_idx + 1 < len(row.cells):
                            if row.cells[c_idx + 1]._tc != cell._tc:
                                target_cell = row.cells[c_idx + 1]

                        # Strategy 3: below cell (same column)
                        if not target_cell and r_idx + 1 < len(table.rows):
                            if table.rows[r_idx + 1].cells[c_idx]._tc != cell._tc:
                                target_cell = table.rows[r_idx + 1].cells[c_idx]

                        if target_cell:
                            _clear_cell(target_cell)
                            _insert_html_into_cell(target_cell, sections[n_key])
                            mapped_keys.add(n_key)

        # Fallback append
        unmapped = [k for k in sections.keys() if k not in mapped_keys and k != "도입부"]
        if len(mapped_keys) == 0:
            doc.add_page_break()
            title_para = doc.add_paragraph()
            title_run = title_para.add_run("=== AI 초안 본문 (자동 첨부) ===")
            title_run.bold = True
            title_run.font.size = Pt(14)
            insert_elements_into_container(doc, all_elements)
        elif len(unmapped) > 0:
            doc.add_page_break()
            title_para = doc.add_paragraph()
            title_run = title_para.add_run("=== 누락된 AI 구역 내용 (자동 첨부) ===")
            title_run.bold = True
            for k in unmapped:
                insert_elements_into_container(doc, sections[k])

        _fix_row_heights(doc)
        doc.save(output_path)
        print(f"✅ Heuristic fill complete → {output_path}")
        return True

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"❌ Heuristic fill error: {e}")
        return False


# ─────────────────────────────────────────────
# Row Height Fix (shared)
# ─────────────────────────────────────────────

def _fix_row_heights(doc):
    """Remove rigid trHeight from all tables to allow auto-expansion."""
    ns = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
    for table in doc.tables:
        for row in table.rows:
            tr = row._tr
            trPr = tr.trPr
            if trPr is not None:
                for trh in trPr.findall(f"{ns}trHeight"):
                    trPr.remove(trh)


# ─────────────────────────────────────────────
# Main Entry Point
# ─────────────────────────────────────────────

def fill_docx_template(input_path: str, payload_html: str, output_path: str) -> bool:
    """
    Master function: detects template type and dispatches to the right mode.
    """
    try:
        doc = docx.Document(input_path)
        template_config = detect_template(doc)

        if template_config:
            return coordinate_based_fill(doc, template_config, payload_html, output_path)
        else:
            return heuristic_fill(doc, payload_html, output_path)

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"❌ DOCX processing error: {e}")
        return False
