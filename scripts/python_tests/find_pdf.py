import os
import fitz

folders = ["/Users/admin/Desktop", "/Users/admin/Documents"]
for folder in folders:
    for root, _, files in os.walk(folder):
        for f in files:
            if f.lower().endswith('.pdf'):
                path = os.path.join(root, f)
                try:
                    doc = fitz.open(path)
                    text = doc[0].get_text("text")[:2000]
                    if "Piceatannol" in text:
                        print(f"FOUND: {path}")
                except Exception:
                    pass
print("Done")
