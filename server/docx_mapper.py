import docx
import os
import tempfile
import json
from bs4 import BeautifulSoup
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

def fill_docx_template(input_path: str, payload_html: str, output_path: str) -> bool:
    """
    Parses the target .docx file and inserts the AI payload.
    If specific tags like {{내용}} or {{본문}} are found, it replaces them.
    Otherwise, it intelligently parses the HTML and appends native DOCX elements 
    (headings, tables, lists) to the end of the template.
    """
    try:
        doc = docx.Document(input_path)
        soup = BeautifulSoup(payload_html, "html.parser")
        clean_text = soup.get_text(separator="\\n").strip()

        # Step 1: Token Replacement (If user prepared the template)
        replaced_tokens = False
        
        for para in doc.paragraphs:
            if "{{사업아이템}}" in para.text:
                para.text = para.text.replace("{{사업아이템}}", "AI 자동 작성 사업 아이템")
                replaced_tokens = True
            if "{{내용}}" in para.text or "{{본문}}" in para.text:
                para.text = para.text.replace("{{내용}}", clean_text).replace("{{본문}}", clean_text)
                replaced_tokens = True
        
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    if "{{내용}}" in cell.text or "{{본문}}" in cell.text:
                        cell.text = cell.text.replace("{{내용}}", clean_text).replace("{{본문}}", clean_text)
                        replaced_tokens = True

        # Step 2: Fallback Appender (If no tokens found, append HTML to the end of the DOCX)
        if not replaced_tokens:
            doc.add_page_break()
            title_para = doc.add_paragraph()
            title_run = title_para.add_run("=== AI 초안 본문 (자동 첨부) ===")
            title_run.bold = True
            title_run.font.size = Pt(14)
            title_run.font.color.rgb = RGBColor(0, 51, 153)
            
            # HTML to Native DOCX parser
            for element in soup.body.children if soup.body else soup.children:
                if element.name in ['h1', 'h2', 'h3', 'h4']:
                    level = int(element.name[1])
                    # docx headings are 0-indexed for style 'Heading X'
                    # But style names can differ by locale, so we do bold text
                    p = doc.add_paragraph()
                    run = p.add_run(element.get_text().strip())
                    run.bold = True
                    run.font.size = Pt(16 - (level * 1))
                
                elif element.name == 'p':
                    text = element.get_text().strip()
                    if text:
                        doc.add_paragraph(text)
                
                elif element.name in ['ul', 'ol']:
                    for li in element.find_all('li', recursive=False):
                        # Use manual bullet character to avoid "no style with name 'List Bullet'" errors
                        # since many templates strip out default Word styles.
                        doc.add_paragraph("• " + li.get_text().strip())
                        
                elif element.name == 'table':
                    rows = element.find_all('tr')
                    if rows:
                        max_cols = max([len(r.find_all(['td', 'th'])) for r in rows])
                        docx_table = doc.add_table(rows=0, cols=max_cols)
                        
                        # Try to apply Table Grid style, fallback silently if not found
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
                                        row_cells[j].text = c.get_text().strip()
                                        if c.name == 'th':
                                            for paragraph in row_cells[j].paragraphs:
                                                for run in paragraph.runs:
                                                    run.bold = True
                elif element.name is None:
                    # Raw text node outside tags
                    text = str(element).strip()
                    if text:
                        doc.add_paragraph(text)

        doc.save(output_path)
        return True
    except Exception as e:
        print(f"DOCX processing error: {e}")
        return False
