import asyncio
from fastapi import UploadFile
from server.main import parse_pdf
import io

async def run():
    with open("public/sample.pdf", "rb") as f:
        # FastAPI's UploadFile is weird to mock because of SpooledTemporaryFile.
        # Let's just mock what parse_pdf expects: an object with a .file attribute that has a .read()
        class MockFile:
            def __init__(self, f):
                self.file = f
        
        file = MockFile(f)
        try:
            res = await parse_pdf(file)
            print("Finished parse. TOC size:", len(res.toc))
        except Exception as e:
            print("ERROR", str(e))

asyncio.run(run())
