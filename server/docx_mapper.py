import docx
import os
import tempfile
import json
from bs4 import BeautifulSoup # We'll need bs4 to parse the html payload if we want, or just string match

def fill_docx_template(input_path: str, payload_html: str, output_path: str) -> bool:
    """
    Parses the target .docx file and inserts the AI payload.
    For Phase 2 PoC, we will extract text from the HTML and look for specific template tags 
    like {{목표}} or simply append to specific tables.
    """
    try:
        doc = docx.Document(input_path)
        
        # Super simple PoC: If the doc has tables, just paste the raw text of the payload 
        # into the first empty cell we find, or replace a specific token.
        
        # 1. Clean the payload (very basic HTML to text for now, full HTML-to-Docx comes later)
        # Assuming payload_html is provided, but user might just want raw text for now.
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(payload_html, "html.parser")
        clean_text = soup.get_text(separator="\n").strip()

        # 2. Iterate through paragraphs and replace tokens if exist
        for para in doc.paragraphs:
            if "{{사업아이템}}" in para.text:
                para.text = para.text.replace("{{사업아이템}}", "AI 자동 작성 사업 아이템")
        
        # 3. Iterate through tables to find targets
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    if "{{내용}}" in cell.text:
                        cell.text = cell.text.replace("{{내용}}", clean_text[:500] + "... (AI 자동완성)")
                        
        doc.save(output_path)
        return True
    except Exception as e:
        print(f"DOCX processing error: {e}")
        return False
