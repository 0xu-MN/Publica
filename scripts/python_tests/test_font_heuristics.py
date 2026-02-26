import sys
import os
import re
sys.path.append(os.path.abspath("server"))
from main import determine_level

# body_size = 10.0
mock_groups = [
    # Should be rejected (reference pattern)
    {'text': '1. Newman, M., Ebrahimie, E. & Lardelli...', 'size': 10.0, 'fontname': 'Times-Roman'},
    {'text': '18. Voisin T & Vellas B Diagnosis...', 'size': 10.0, 'fontname': 'Times-Roman'},
    
    # Should be accepted (large font, no number)
    {'text': 'Zebrafish as an AD model', 'size': 12.0, 'fontname': 'Times-Bold'},
    
    # Should be accepted (bold font, no number)
    {'text': 'Neurological similarity', 'size': 10.0, 'fontname': 'Times-Bold'},
    
    # Should be accepted (korean outline)
    {'text': '가. 지원규모', 'size': 10.0, 'fontname': 'HCR-Batang'},
    {'text': '1) 세부지원요건', 'size': 10.0, 'fontname': 'HCR-Batang'},
    
    # Should be accepted (standard numbered)
    {'text': '1. Introduction', 'size': 10.0, 'fontname': 'Times-Roman'},
    
    # Should be rejected (regular sentence with bold)
    {'text': 'This is a regular sentence that happens to be bold.', 'size': 10.0, 'fontname': 'Times-Bold'}
]

for g in mock_groups:
    lvl, clean = determine_level(g, 10.0)
    print(f"L{lvl} | '{clean}' <- {g['text']}")
