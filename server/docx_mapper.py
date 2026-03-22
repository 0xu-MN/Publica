import docx
import os
import tempfile
import json
from bs4 import BeautifulSoup
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

def insert_elements_into_container(container, elements):
    """ Helper to insert parsed BeautifulSoup elements into a python-docx container (Document or Cell) """
    for element in elements:
        if element.name in ['h1', 'h2', 'h3', 'h4']:
            level = int(element.name[1])
            p = container.add_paragraph()
            run = p.add_run(element.get_text().strip())
            run.bold = True
            run.font.size = Pt(16 - (level * 1))
        
        elif element.name == 'p':
            text = element.get_text().strip()
            if text:
                container.add_paragraph(text)
        
        elif element.name in ['ul', 'ol']:
            for li in element.find_all('li', recursive=False):
                container.add_paragraph("• " + li.get_text().strip())
                
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
                                row_cells[j].text = c.get_text().strip()
                                if c.name == 'th':
                                    for paragraph in row_cells[j].paragraphs:
                                        for run in paragraph.runs: run.bold = True
        elif element.name is None:
            text = str(element).strip()
            if text:
                container.add_paragraph(text)

def fill_docx_template(input_path: str, payload_html: str, output_path: str) -> bool:
    try:
        doc = docx.Document(input_path)
        soup = BeautifulSoup(payload_html, "html.parser")
        
        # Extract all elements for universal {{본문}} tag
        all_elements = list(soup.body.children if soup.body else soup.children)

        # Step 1: Parse HTML into logical sections based on Headings
        sections = {}
        current_key = "{{도입부}}"
        sections[current_key] = []
        
        for element in all_elements:
            if element.name in ['h1', 'h2', 'h3', 'h4']:
                text = element.get_text().strip()
                if "문제" in text: current_key = "{{문제인식}}"
                elif "실현" in text or "솔루션" in text: current_key = "{{실현가능성}}"
                elif "성장" in text or "시장" in text: current_key = "{{성장전략}}"
                elif "역량" in text or "팀" in text: current_key = "{{팀구성}}"
                elif "사업비" in text or "예산" in text: current_key = "{{사업비}}"
                elif "개요" in text or "목표" in text: current_key = "{{사업개요}}"
                elif "기대효과" in text or "파급효과" in text: current_key = "{{기대효과}}"
                else: current_key = f"{{{{{text}}}}}"
                
                if current_key not in sections:
                    sections[current_key] = []
                # Keep the heading in the section itself for completeness
                sections[current_key].append(element)
            else:
                if str(element).strip():
                    sections[current_key].append(element)

        # Step 2: Traverse DOCX and inject Native Elements inside targeted Table Cells
        replaced_tokens = False
        
        # Process simple text overrides outside tables
        for para in doc.paragraphs:
            if "{{사업아이템}}" in para.text:
                para.text = para.text.replace("{{사업아이템}}", "AI 자동 작성 사업 아이템")
            # Usually users put {{본문}} or {{문제인식}} inside tables. 
            # If it's a raw paragraph, we just clear it (injecting rich elements mid-paragraph is limited in python-docx)
            for key in list(sections.keys()) + ["{{본문}}", "{{내용}}"]:
                if key in para.text:
                    para.text = para.text.replace(key, "")
                    replaced_tokens = True # We consider it replaced, but rely on table injection for rich formatting
        
        # Process Table Cells (where 99% of government blanks are)
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    # Universal body tag
                    if "{{본문}}" in cell.text or "{{내용}}" in cell.text:
                        cell.text = cell.text.replace("{{본문}}", "").replace("{{내용}}", "").strip()
                        insert_elements_into_container(cell, all_elements)
                        replaced_tokens = True
                        continue # Move to next cell to avoid double injecting

                    # Specific section tags
                    for key, elements in sections.items():
                        if key in cell.text:
                            # Clear the tag and inject the rich section elements
                            cell.text = cell.text.replace(key, "").strip()
                            insert_elements_into_container(cell, elements)
                            replaced_tokens = True

        # Step 3: Fallback Appender (If user uploaded a fully blank template with NO tags)
        if not replaced_tokens:
            doc.add_page_break()
            title_para = doc.add_paragraph()
            title_run = title_para.add_run("=== AI 초안 본문 (자동 첨부) ===")
            title_run.bold = True
            title_run.font.size = Pt(14)
            title_run.font.color.rgb = RGBColor(0, 51, 153)
            
            insert_elements_into_container(doc, all_elements)

        doc.save(output_path)
        return True
    except Exception as e:
        print(f"DOCX processing error: {e}")
        return False
