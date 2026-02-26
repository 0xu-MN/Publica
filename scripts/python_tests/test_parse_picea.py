import asyncio
import os
from server.main import parse_pdf

class MockUploadFile:
    def __init__(self, path):
        self.filename = os.path.basename(path)
        with open(path, "rb") as f:
            self.content = f.read()

    async def read(self):
        return self.content

async def run():
    try:
        mock_file = MockUploadFile("/Users/admin/Downloads/ilovepdf_merged.pdf")
        res = await parse_pdf(mock_file)
        
        zero_count = 0
        for item in res.toc:
            print(f"L{item.level} | {item.title} (page={item.page}, x={item.x}, y={item.y})")
            if item.x == 0: zero_count += 1
            
        print(f"TOC count: {len(res.toc)}, Zero Coords: {zero_count}")
        
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(run())
