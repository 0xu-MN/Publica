import sys
import os
import traceback
sys.path.append(os.path.abspath("server"))
import pdfplumber
from main import group_by_line, determine_level, get_body_font_size

def run():
    print("Opening test_paper.pdf...")
    with pdfplumber.open("server/test_paper.pdf") as pdf:
        num_pages = len(pdf.pages)
        sample_words = []
        for p_idx in [0, min(2, num_pages - 1), num_pages // 2]:
            sample_words.extend(pdf.pages[p_idx].extract_words(extra_attrs=['size']))
        body_size = get_body_font_size(sample_words)
        
        for page_num in range(num_pages):
            words = pdf.pages[page_num].extract_words(extra_attrs=['size', 'fontname'])
            page_width = pdf.pages[page_num].width
            all_groups = group_by_line(words)
            page_toc_items = []
            for group in all_groups:
                level, cleaned = determine_level(group, body_size)
                if level > 0:
                    page_toc_items.append({
                        'level': level,
                        'title': cleaned,
                        'raw': group['text'],
                        'x': float(group['x0']),
                        'y': float(group['top']),
                        'page': page_num + 1
                    })
            
            page_toc_items.sort(key=lambda item: (
                0 if item['x'] < page_width * 0.45 else 1,
                item['y']
            ))
            for item in page_toc_items:
                print(f"P{item['page']} L{item['level']} '{item['title']}'")

try:
    run()
except Exception as e:
    traceback.print_exc()

