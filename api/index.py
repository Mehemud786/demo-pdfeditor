from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from pypdf import PdfWriter, PdfReader
import io
import requests
from reportlab.pdfgen import canvas
from reportlab.lib.colors import red

app = FastAPI()

# Health check to verify API is running
@app.get("/api")
async def root():
    return {"status": "Python Backend is running successfully!"}

# Model for the URL fetch request
class URLPayload(BaseModel):
    url: str
    text: str = ""

# Helper function to create a transparent PDF layer with text
def create_text_overlay(text: str, width: float, height: float):
    packet = io.BytesIO()
    c = canvas.Canvas(packet, pagesize=(width, height))
    
    # Configure text appearance
    c.setFont("Helvetica-Bold", 36)
    c.setFillColor(red)
    
    # Draw the text in the lower-middle of the page
    c.drawString(width / 4, height / 2, text)
    
    c.save()
    packet.seek(0)
    return packet

@app.post("/api/open-link")
async def open_pdf_from_link(payload: URLPayload):
    try:
        # 1. Fetch the PDF from URL
        response = requests.get(payload.url, timeout=15)
        response.raise_for_status()
        
        pdf_bytes = io.BytesIO(response.content)
        reader = PdfReader(pdf_bytes)
        
        if len(reader.pages) == 0:
            raise ValueError("PDF has no pages")

        # 2. Add text overlay if provided
        if payload.text and payload.text.strip():
            writer = PdfWriter()
            
            for page in reader.pages:
                width = float(page.mediabox.width)
                height = float(page.mediabox.height)
                
                # Generate and apply the text layer
                overlay_pdf = create_text_overlay(payload.text, width, height)
                overlay_reader = PdfReader(overlay_pdf)
                overlay_page = overlay_reader.pages[0]
                
                page.merge_page(overlay_page)
                writer.add_page(page)
            
            output = io.BytesIO()
            writer.write(output)
            output.seek(0)
            pdf_bytes = output
        else:
            pdf_bytes.seek(0)
        
        # 3. Return the edited PDF inline
        return Response(
            content=pdf_bytes.getvalue(),
            media_type="application/pdf",
            headers={"Content-Disposition": "inline; filename=edited.pdf"}
        )
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=400, detail=f"Failed to download from URL: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")


@app.post("/api/merge")
async def merge_pdfs(files: list[UploadFile] = File(...)):
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