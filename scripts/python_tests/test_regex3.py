import re

texts = [
    "X. Sun, R. Chai, H. Wang",
    "C. Roma-Mateo, C. Avendano",
    "P. Nalawade, G. Sethi",
    "Biomedicine & Pharmacotherapy",
    "A B S T R A C T",
    "1 1. Introduction",
    "3.9 BAY11-7082 reduces pyroptosis",
    "2. Materials and methods",
    "2.2. Auditory brainstem response",
    "3.10. BAY11-7082"
]

for text in texts:
    text = text.strip()
    text = re.sub(r'^([IIVXLCDM]+|[A-Z]|\d+(?:\.\d+)*)\.?\s+\1\.', r'\1.', text)
    
    number_match = re.match(r'^([IVX]+\.|\d{1,2}\.|\d{1,2}(?:\.\d{1,2})+\.?)\s+(.*)', text)
    clean_text = re.sub(r'^[\d\s\.]+', '', text).strip()
    
    is_spaced_abstract = bool(re.match(r'^A\s*B\s*S\s*T\s*R\s*A\s*C\s*T$', clean_text, re.IGNORECASE))
    is_academic = bool(re.match(r'^(abstract|introduction|background|methods|materials and methods|results|discussion|conclusions|references)$', clean_text, re.IGNORECASE))
    
    if is_academic or is_spaced_abstract:
        print(f"[{text}] -> ACADEMIC")
        continue
        
    if number_match:
        num = number_match.group(1).rstrip('.')
        content = number_match.group(2).strip()
        if not content or re.match(r'^[a-z\-•·oㅇ○\*]', content):
            print(f"[{text}] -> REJECTED lowercase: {content}")
            continue
        print(f"[{text}] -> NUMBER MATCH (num='{num}')")
    else:
        print(f"[{text}] -> No match")
