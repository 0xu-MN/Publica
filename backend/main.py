import tempfile
import zipfile
import os
import shutil
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from lxml import etree

app = FastAPI(title="Publica Nexus HWPX Engine", version="1.0")

# CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "service": "Nexus HWPX Engine is running"}

@app.post("/upload-hwpx")
async def process_hwpx(
    file: UploadFile = File(...),
    payload: str = Form("{}")
):
    """
    1. Receives a .hwpx file and AI generated payload.
    2. Unzips the .hwpx (which is just a zip of XMLs).
    3. Parses Contents/section0.xml.
    4. (Future) Maps payload into the XML tables.
    5. Zips it back and returns the file.
    """
    if not file.filename.endswith('.hwpx'):
        return JSONResponse(status_code=400, content={"error": "Only .hwpx files are supported"})

    temp_dir = tempfile.mkdtemp()
    input_path = os.path.join(temp_dir, "input.hwpx")
    extract_dir = os.path.join(temp_dir, "extracted")
    output_path = os.path.join(temp_dir, "output.hwpx")

    try:
        # Save uploaded file
        content = await file.read()
        with open(input_path, "wb") as f:
            f.write(content)

        # Unzip the HWPX
        with zipfile.ZipFile(input_path, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)
        
        # Check standard XML content
        section0_path = os.path.join(extract_dir, 'Contents', 'section0.xml')
        has_section0 = os.path.exists(section0_path)
        
        preview_text = "No section0.xml found"
        if has_section0:
            with open(section0_path, 'r', encoding='utf-8') as f:
                xml_content = f.read()
            # Just grab the first 200 chars to prove we opened it
            preview_text = xml_content[:200]

        # For PoC: Just re-zip it exactly as is to ensure we can reconstruct valid HWPX
        # In actual implementation, we will modify section0.xml here before zipping
        with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zip_out:
            for root, _, files in os.walk(extract_dir):
                for f_name in files:
                    file_path = os.path.join(root, f_name)
                    arcname = os.path.relpath(file_path, extract_dir)
                    zip_out.write(file_path, arcname)

        return {
            "status": "success",
            "message": "HWPX successfully extracted and inspected",
            "section0_preview": preview_text,
            "payload_received": payload
        }
        
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
    finally:
        # Clean up is commented out for debugging purposes if needed locally
        shutil.rmtree(temp_dir)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
