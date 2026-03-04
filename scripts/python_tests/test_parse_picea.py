import sys
import os
import json

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from server.main import parse_pdf
import asyncio

async def test():
    class DummyFile:
        async def read(self):
            with open("/Users/admin/Desktop/insightflow/server/test_paper.pdf", "rb") as f:
                return f.read()

    res = await parse_pdf(DummyFile())
    print(f"Num Pages: {res.numPages}")
    print(f"TOC count: {len(res.toc)}")
    
    # Print the first 30 TOC items clearly
    for item in res.toc[:30]:
        print(f"L{item.level} | {item.title} (page={item.page}, x={item.x}, y={item.y})")

if __name__ == "__main__":
    asyncio.run(test())
