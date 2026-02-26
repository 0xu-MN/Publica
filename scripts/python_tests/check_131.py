import fitz
try:
    doc = fitz.open("/Users/admin/Downloads/1-3-1.pdf")
    print(doc[0].get_text("text")[:500])
except Exception as e:
    print(e)
