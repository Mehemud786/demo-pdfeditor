from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from pypdf import PdfWriter, PdfReader
import io
import requests
from reportlab.pdfgen import canvas
from reportlab.lib.colors import red

app = FastAPI()

# Health check
@app.get("/api")
async def root():
    return {"status": "Python Backend is running successfully!"}

# Payloads
class FetchPayload(BaseModel):
    url: str

class EditPayload(BaseModel):
    url: str
    text: str
    x_pct: float  # X position as a percentage (0.0 to 1.0)
    y_pct: float  # Y position as a percentage (0.0 to 1.0)

# Function to create text layer using user's coordinates
def create_text_overlay(text: str, width: float, height: float, x_pct: float, y_pct: float):
    packet = io.BytesIO()
    c = canvas.Canvas(packet, pagesize=(width, height))
    c.setFont("Helvetica-Bold", 36)
    c.setFillColor(red)
    
    # HTML canvas originates top-left, but PDFs originate bottom-left. 
    # We invert the Y percentage to match the PDF coordinate system.
    pdf_x = width * x_pct
    pdf_y = height * (1.0 - y_pct)
    
    c.drawString(pdf_x, pdf_y, text)
    c.save()
    packet.seek(0)
    return packet

# Fetch raw PDF for the frontend canvas to display (bypasses CORS)
@app.post("/api/fetch-raw")
async def fetch_raw_pdf(payload: FetchPayload):
    try:
        response = requests.get(payload.url, timeout=15)
        response.raise_for_status()
        return Response(content=response.content, media_type="application/pdf")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to load PDF: {str(e)}")

# Edit the PDF using precise coordinates
@app.post("/api/edit-pdf")
async def edit_pdf_canvas(payload: EditPayload):
    try:
        response = requests.get(payload.url, timeout=15)
        response.raise_for_status()
        
        pdf_bytes = io.BytesIO(response.content)
        reader = PdfReader(pdf_bytes)
        
        if not payload.text.strip():
            pdf_bytes.seek(0)
            output_bytes = pdf_bytes.getvalue()
        else:
            writer = PdfWriter()
            for page in reader.pages:
                width = float(page.mediabox.width)
                height = float(page.mediabox.height)
                
                overlay_pdf = create_text_overlay(payload.text, width, height, payload.x_pct, payload.y_pct)
                overlay_reader = PdfReader(overlay_pdf)
                
                page.merge_page(overlay_reader.pages[0])
                writer.add_page(page)
            
            output = io.BytesIO()
            writer.write(output)
            output.seek(0)
            output_bytes = output.getvalue()
            
        return Response(
            content=output_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "inline; filename=edited.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

# (Optional) Keep the local merge endpoint if you still want it
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