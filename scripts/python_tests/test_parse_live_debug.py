import fitz

doc = fitz.open("/Users/admin/Downloads/s41420-018-0109-7.pdf")
page = doc[3] # 4th page
print("PAGE TEXT:")
print(page.get_text("text")[:1000]) # First 1000 chars
