import fitz
import sys

def main():
    try:
        doc = fitz.open("/Users/admin/Downloads/ilovepdf_merged.pdf")
        for i in range(1, 4):
            page = doc[i]
            print(f"--- PAGE {i} ---")
            text = page.get_text("text")
            lines = text.split('\n')
            for line in lines:
                if "Material" in line or "Cell" in line or "Western" in line or "BAY11" in line:
                    print(line.strip())
            print("--- END PAGE ---")
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    main()
