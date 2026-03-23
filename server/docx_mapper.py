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

def __render_markdown_text(p, text):
    """ Parses **bold** and handles actual newlines (and literal '\\n') """
    text = text.replace('\\n', '\n')
    parts = re.split(r'(\*\*.*?\*\*)', text)
    
    for part in parts:
        if not part: continue
        is_bold = part.startswith('**') and part.endswith('**')
        clean_text = part[2:-2] if is_bold else part
        
        lines = clean_text.split('\n')
        for i, line in enumerate(lines):
            if line:
                run = p.add_run(line)
                if is_bold:
                    run.bold = True
            if i < len(lines) - 1:
                p.add_run().add_break()

def insert_elements_into_container(container, elements):
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
                __render_markdown_text(p, text)
        
        elif element.name in ['ul', 'ol']:
            for li in element.find_all('li', recursive=False):
                p = container.add_paragraph()
                _reset_paragraph_format(p)
                p.paragraph_format.space_before = Pt(4)
                p.paragraph_format.left_indent = Pt(14)
                p.add_run("• ")
                __render_markdown_text(p, li.get_text().strip())
                
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
                                # Reset cell's paragraph
                                p = target_cell.paragraphs[0]
                                _reset_paragraph_format(p)
                                p.text = "" 
                                __render_markdown_text(p, c.get_text().strip())
                                if c.name == 'th':
                                    for run in p.runs: run.bold = True
        elif element.name is None:
            text = str(element).strip()
            if text:
                p = container.add_paragraph()
                _reset_paragraph_format(p)
                p.paragraph_format.space_before = Pt(6)
                __render_markdown_text(p, text)

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
            # 🌟 FIX: Skip Table of Contents (목차) and Summary (요약) tables which falsely trap mapping keywords!
            table_head_text = ""
            if len(table.rows) > 0:
                table_head_text = "".join(c.text for c in table.rows[0].cells).replace(" ", "")
            if "목차" in table_head_text or "개요" in table_head_text or "요약" in table_head_text:
                continue

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
                        # Find the target blank cell! (Bulletproof Heuristic)
                        target_cell = None
                        
                        # 1. Prefer Below Cell if it's a dedicated big box (Very common for major sections)
                        if r_idx + 1 < len(table.rows):
                            below_row = table.rows[r_idx + 1]
                            # If the below row is a single giant merged cell, it is 100% the text area
                            if len(set(below_row.cells)) == 1:
                                target_cell = below_row.cells[0]
                                
                        # 2. If not a giant below box, try Right Cell
                        if not target_cell and c_idx + 1 < len(row.cells):
                            # Ensure it's not the same merged cell
                            if row.cells[c_idx+1] != cell:
                                target_cell = row.cells[c_idx+1]

                        # 3. Fallback to strict Below cell
                        if not target_cell and r_idx + 1 < len(table.rows):
                            if table.rows[r_idx+1].cells[c_idx] != cell:
                                target_cell = table.rows[r_idx+1].cells[c_idx]
                                
                        if target_cell:
                            target_cell.text = "" # Completely wipe government placeholder guides!
                            insert_elements_into_container(target_cell, sections[n_key])
                            mapped_keys.add(n_key)

        # 3. Fallback Append for unmapped sections
        unmapped_sections = [k for k in sections.keys() if k not in mapped_keys and k != "도입부"]
        
        if len(mapped_keys) == 0:
            doc.add_page_break()
            title_para = doc.add_paragraph()
            title_run = title_para.add_run("=== AI 초안 본문 (자동 첨부) ===")
            title_run.bold = True
            title_run.font.size = Pt(14)
            insert_elements_into_container(doc, all_elements)
        elif len(unmapped_sections) > 0:
            doc.add_page_break()
            title_para = doc.add_paragraph()
            title_run = title_para.add_run("=== 누락된 AI 구역 내용 (자동 첨부) ===")
            title_run.bold = True
            for k in unmapped_sections:
                insert_elements_into_container(doc, sections[k])

        # 4. XML-Level Eradication of rigid row heights
        # Government forms enforce w:trHeight=exact. python-docx API often fails to remove it. We must delete the XML nodes.
        for table in doc.tables:
            for row in table.rows:
                tr = row._tr
                trPr = tr.trPr
                if trPr is not None:
                    # Find all w:trHeight elements and brutally remove them
                    trHeights = trPr.findall("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}trHeight")
                    for trh in trHeights:
                        trPr.remove(trh)

        doc.save(output_path)
        return True
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"DOCX processing error: {e}")
        return False
