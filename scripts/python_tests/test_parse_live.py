import traceback
import asyncio
from fastapi import UploadFile
import sys
import os
sys.path.append(os.path.abspath("server"))
from main import parse_pdf
import io

class MockUploadFile:
    def __init__(self, filename):
        self.filename = filename
        with open(filename, 'rb') as f:
            self.content = f.read()
            
    async def read(self):
        return self.content

async def run():
    try:
        mock_file = MockUploadFile("/Users/admin/Downloads/s41420-018-0109-7.pdf")
        res = await parse_pdf(mock_file)
        
        for item in res.toc[:20]:
            print(f"L{item.level} | {item.title} (page={item.page}, x={item.x}, y={item.y})")
            
        print("TOC count:", len(res.toc))
    except Exception:
        traceback.print_exc()

asyncio.run(run())
