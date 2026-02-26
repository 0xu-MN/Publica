import sys
import os
import re
sys.path.append(os.path.abspath("server"))
from main import determine_level

texts = [
    "X. Sun, R. Chai, H. Wang",
    "C. Roma-Mateo, C. Avendano",
    "A B S T R A C T",
    "1 Introduction",
    "2.1 Animal handling",
    "2.2. Auditory brainstem response",
    "2.3 Hematoxylin-Eosin",
    "3.9 BAY11-7082 reduces pyroptosis",
    "3.10. Immunofluorescence",
    "3 Results",
    "4. Discussion",
    "5 Conclusions",
    "Conclusions",
    "References"
]

for t in texts:
    group = {'text': t}
    lvl, clean = determine_level(group, 12.0)
    print(f"L{lvl}: '{clean}'  <- {t}")
