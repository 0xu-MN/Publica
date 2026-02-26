import os
import fitz

def search_pdfs():
    downloads = "/Users/admin/Downloads"
    for file in os.listdir(downloads):
        if file.lower().endswith('.pdf'):
            path = os.path.join(downloads, file)
            try:
                doc = fitz.open(path)
                if len(doc) > 0:
                    text = doc[0].get_text("text")
                    if "Piceatannol" in text or "BAY11" in text:
                        print(f"FOUND: {path}")
                        return
                    if len(doc) > 1:
                        text2 = doc[1].get_text("text")
                        if "Piceatannol" in text2 or "BAY11" in text2:
                            print(f"FOUND: {path}")
                            return
            except Exception:
                pass
    print("Not found in Downloads")

search_pdfs()
