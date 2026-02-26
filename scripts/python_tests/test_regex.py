import re

texts = [
    "X. Sun, R. Chai, H. Wang",
    "C. Roma-Mateo, C. Avendano",
    "Biomedicine & Pharmacotherapy",
    "Piceatannol protects against age-related",
    "A B S T R A C T",
    "1 1. Introduction",
    "1 Introduction levels of reactive",
    "3.6 3.6. Effect of PCT on the viability of HE-OC-1",
    "2 2 2",
    "3.2 3.2. PCT attenuates inflammation and"
]

def test(text):
    text = text.strip()
    text = re.sub(r'^([IIVXLCDM]+|[A-Z]|\d+(?:\.\d+)*)\.?\s+\1\.', r'\1.', text)
    
    number_match = re.match(r'^([IIVXLCDM]+\.|[A-Z]\.|\d{1,2}\.|\d{1,2}(?:\.\d{1,2})+\.?)\s+(.*)', text)
    clean_text = re.sub(r'^[\d\s\.]+', '', text).strip()
    is_academic = bool(re.match(r'^(abstract|introduction|background|methods|materials and methods|results|discussion|conclusions|references)$', clean_text, re.IGNORECASE))
    
    if is_academic: return f"Academic Match: {clean_text}"
    if number_match: return f"Number Match: {number_match.group(1)} | {number_match.group(2)}"
    return "No match"

for t in texts:
    print(f"'{t}' -> {test(t)}")
