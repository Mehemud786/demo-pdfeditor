from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from pypdf import PdfWriter, PdfReader
import io
import requests

app = FastAPI()

# Model for the incoming JSON request
class URLPayload(BaseModel):
    url: str

@app.post("/api/open-link")
async def open_pdf_from_link(payload: URLPayload):
    try:
        # 1. Fetch the PDF from the provided URL (Server-side)
        # Timeout set to 15 seconds to prevent serverless function timeout
        response = requests.get(payload.url, timeout=15)
        response.raise_for_status()
        
        # 2. Read into memory
        pdf_bytes = io.BytesIO(response.content)
        
        # 3. Validate it's an actual PDF file
        reader = PdfReader(pdf_bytes)
        if len(reader.pages) == 0:
            raise ValueError("PDF has no pages")
            
        # Reset memory pointer to the start of the file
        pdf_bytes.seek(0)
        
        # 4. Return the file inline so the browser can open it
        return Response(
            content=pdf_bytes.getvalue(),
            media_type="application/pdf",
            # "inline" tells the browser to open it in a tab rather than downloading
            headers={"Content-Disposition": "inline; filename=server_fetched.pdf"}
        )
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=400, detail=f"Failed to download from URL: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid PDF file: {str(e)}")

# ... (Keep your existing @app.post("/api/merge") code here) ...