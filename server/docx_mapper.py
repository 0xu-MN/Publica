import docx
import os
import tempfile
import json
import re
from bs4 import BeautifulSoup
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.table import WD_ROW_HEIGHT_RULE

def _reset_paragraph_format(p):
    """ Forcefully cure overlapping text bugs in strict government forms """
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
    p.paragraph_format.line_spacing = 1.0
    p.paragraph_format.space_before = Pt(3)
    p.paragraph_format.space_after = Pt(3)

def insert_elements_into_container(container, elements):
    for element in elements:
        if element.name in ['h1', 'h2', 'h3', 'h4']:
            level = int(element.name[1])
            p = container.add_paragraph()
            _reset_paragraph_format(p)
            run = p.add_run(element.get_text().strip())
            run.bold = True
            run.font.size = Pt(13 - (level * 1)) # Downsize slightly to fit tables
        
        elif element.name == 'p':
            text = element.get_text().strip()
            if text:
                p = container.add_paragraph(text)
                _reset_paragraph_format(p)
        
        elif element.name in ['ul', 'ol']:
            for li in element.find_all('li', recursive=False):
                p = container.add_paragraph("• " + li.get_text().strip())
                _reset_paragraph_format(p)
                
        elif element.name == 'table':
            rows = element.find_all('tr')
            if rows:
                max_cols = max([len(r.find_all(['td', 'th'])) for r in rows])
                docx_table = container.add_table(rows=0, cols=max_cols)
                try: docx_table.style = 'Table Grid'
                except KeyError: pass
                
                for i, r in enumerate(rows):
                    cells = r.find_all(['td', 'th'])
                    if cells:
                        row_cells = docx_table.add_row().cells
                        for j, c in enumerate(cells):
                            if j < len(row_cells):
                                target_cell = row_cells[j]
                                target_cell.text = c.get_text().strip()
                                # Reset cell's paragraph
                                for cp in target_cell.paragraphs:
                                    _reset_paragraph_format(cp)
                                if c.name == 'th':
                                    for paragraph in target_cell.paragraphs:
                                        for run in paragraph.runs: run.bold = True
        elif element.name is None:
            text = str(element).strip()
            if text:
                p = container.add_paragraph(text)
                _reset_paragraph_format(p)

def get_normalized_key(text):
    text = re.sub(r'\s+', '', text)
    if "문제" in text and "인식" in text: return "문제인식"
    if ("실현" in text and "가능" in text) or "솔루션" in text: return "실현가능성"
    if "성장" in text and "전략" in text: return "성장전략"
    if "팀" in text and ("구성" in text or "역량" in text): return "팀구성"
    if "사업비" in text or "예산" in text: return "사업비"
    return None

def fill_docx_template(input_path: str, payload_html: str, output_path: str) -> bool:
    try:
        doc = docx.Document(input_path)
        soup = BeautifulSoup(payload_html, "html.parser")
        
        all_elements = list(soup.body.children if soup.body else soup.children)

        # 1. Parse HTML into sections
        sections = {}
        current_key = "도입부"
        sections[current_key] = []
        
        for element in all_elements:
            if element.name in ['h1', 'h2', 'h3', 'h4']:
                text = element.get_text().strip()
                n_key = get_normalized_key(text)
                if n_key:
                    current_key = n_key
                
                if current_key not in sections:
                    sections[current_key] = []
                # Keep heading
                sections[current_key].append(element)
            else:
                if str(element).strip():
                    if current_key not in sections:
                        sections[current_key] = []
                    sections[current_key].append(element)

        # 2. Smart Table Cell Finder
        mapped_keys = set()
        
        for table in doc.tables:
            for r_idx, row in enumerate(table.rows):
                for c_idx, cell in enumerate(row.cells):
                    cell_text = cell.text.strip()
                    n_key = get_normalized_key(cell_text)
                    
                    # Also support explicit legacy tags if present
                    if "{{본문}}" in cell_text or "{{내용}}" in cell_text:
                        cell.text = ""
                        insert_elements_into_container(cell, all_elements)
                        mapped_keys.add("본문")
                        continue

                    if n_key and n_key in sections and n_key not in mapped_keys:
                        # Find the target blank cell!
                        target_cell = None
                        
                        # Heuristic 1: Is there a cell to the right?
                        if c_idx + 1 < len(row.cells):
                            right_cell = row.cells[c_idx + 1]
                            # If right cell is mostly empty, it's the blank!
                            if len(right_cell.text.strip()) < 50:
                                target_cell = right_cell
                        
                        # Heuristic 2: If cell spans the row, look directly below
                        if not target_cell and r_idx + 1 < len(table.rows):
                            below_cell = table.rows[r_idx + 1].cells[c_idx]
                            if len(below_cell.text.strip()) < 50:
                                target_cell = below_cell
                                
                        if target_cell:
                            target_cell.text = "" # Clear template placeholders like [작성란]
                            insert_elements_into_container(target_cell, sections[n_key])
                            mapped_keys.add(n_key)

        # 3. Fallback Append for unmapped sections
        unmapped_sections = [k for k in sections.keys() if k not in mapped_keys and k != "도입부"]
        
        if len(mapped_keys) == 0:
            # Nothing matched at all! Do a global append
            doc.add_page_break()
            title_para = doc.add_paragraph()
            title_run = title_para.add_run("=== AI 초안 본문 (자동 첨부) ===")
            title_run.bold = True
            title_run.font.size = Pt(14)
            insert_elements_into_container(doc, all_elements)
        elif len(unmapped_sections) > 0:
            # Some sections mapped, some didn't. Append missing ones.
            doc.add_page_break()
            title_para = doc.add_paragraph()
            title_run = title_para.add_run("=== 누락된 AI 구역 내용 (자동 첨부) ===")
            title_run.bold = True
            for k in unmapped_sections:
                insert_elements_into_container(doc, sections[k])

        # 4. Eradicate all rigid row heights to prevent text clipping (Crucial for Govt Forms)
        for table in doc.tables:
            for row in table.rows:
                row.height_rule = WD_ROW_HEIGHT_RULE.AUTO
                row.height = None

        doc.save(output_path)
        return True
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"DOCX processing error: {e}")
        return False
