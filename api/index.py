from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from pypdf import PdfWriter, PdfReader
import io
import requests
from reportlab.pdfgen import canvas
from reportlab.lib.colors import red

app = FastAPI()

@app.get("/api")
async def root():
    return {"status": "Python Backend is running successfully!"}

class URLPayload(BaseModel):
    url: str
    text: str = ""

def create_text_overlay(text: str, width: float, height: float):
    packet = io.BytesIO()
    c = canvas.Canvas(packet, pagesize=(width, height))
    c.setFont("Helvetica-Bold", 36)
    c.setFillColor(red)
    c.drawString(width / 4, height / 2, text)
    c.save()
    packet.seek(0)
    return packet

@app.post("/api/open-link")
async def open_pdf_from_link(payload: URLPayload):
    try:
        # ADDED: Fake browser headers to bypass basic bot-blocking
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/pdf, application/octet-stream, */*"
        }
        
        # Fetch the URL
        response = requests.get(payload.url, headers=headers, timeout=20)
        response.raise_for_status()
        
        # ADDED: Check if the server returned a web page (like a login screen) instead of a file
        content_type = response.headers.get("Content-Type", "").lower()
        if "text/html" in content_type:
            raise ValueError("The server returned an HTML web page instead of a PDF. This usually means the URL requires a login/password, or the link is invalid.")

        pdf_bytes = io.BytesIO(response.content)
        
        try:
            reader = PdfReader(pdf_bytes)
            if len(reader.pages) == 0:
                raise ValueError("PDF has no pages")
        except Exception as e:
             raise ValueError("The downloaded file is not a valid PDF document. It might be corrupted or protected.")

        # Add text overlay if provided
        if payload.text and payload.text.strip():
            writer = PdfWriter()
            for page in reader.pages:
                width = float(page.mediabox.width)
                height = float(page.mediabox.height)
                
                overlay_pdf = create_text_overlay(payload.text, width, height)
                overlay_reader = PdfReader(overlay_pdf)
                
                page.merge_page(overlay_reader.pages[0])
                writer.add_page(page)
            
            output = io.BytesIO()
            writer.write(output)
            output.seek(0)
            pdf_bytes = output
        else:
            pdf_bytes.seek(0)
        
        return Response(
            content=pdf_bytes.getvalue(),
            media_type="application/pdf",
            headers={"Content-Disposition": "inline; filename=edited.pdf"}
        )
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=400, detail=f"Network error while fetching URL: {str(e)}")
    except ValueError as e:
        # Return our custom error messages to the frontend
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.post("/api/merge")
async def merge_pdfs(files: list[UploadFile] = File(...)):
    # ... (Keep your existing merge code exactly as it was) ...
    merger = PdfWriter()
    try:
        for file in files:
            content = await file.read()
            pdf = PdfReader(io.BytesIO(content))
            merger.append(pdf)
        output_pdf = io.BytesIO()
        merger.write(output_pdf)
        merger.close()
        output_pdf.seek(0)
        return Response(
            content=output_pdf.getvalue(),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=merged.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error merging PDFs: {str(e)}")