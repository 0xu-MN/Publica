import sys
import fitz

def test_toc(filepath):
    print(f"--- Testing {filepath} ---")
    try:
        doc = fitz.open(filepath)
        toc = doc.get_toc()
        if toc:
            print(f"SUCCESS: Found embedded TOC with {len(toc)} items!")
            for item in toc[:5]:
                print(f"  Level {item[0]}: {item[1]} (Page {item[2]})")
            print("  ...")
        else:
            print("FAILURE: No embedded TOC found.")
    except Exception as e:
        print(f"Error: {e}")
    print()

test_toc("/Users/admin/Downloads/s41420-018-0109-7.pdf")
test_toc("/Users/admin/Downloads/2025년 경기청년 기회사다리금융 공급계획 공고문.pdf")
test_toc("/Users/admin/Desktop/insightflow/server/test_paper.pdf")
