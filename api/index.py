from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from pypdf import PdfWriter, PdfReader
import io
import requests
from reportlab.pdfgen import canvas
from reportlab.lib.colors import red

app = FastAPI()

class EditRequest(BaseModel):
    url: str
    text: str = ""

def create_text_layer(text: str, width: float, height: float):
    packet = io.BytesIO()
    c = canvas.Canvas(packet, pagesize=(width, height))
    c.setFont("Helvetica-Bold", 36)
    c.setFillColor(red)
    # Position text in the center
    c.drawString(width / 4, height / 2, text)
    c.save()
    packet.seek(0)
    return packet

@app.post("/api/fetch-and-edit")
async def fetch_and_edit_pdf(payload: EditRequest):
    try:
        # 1. Fetch the URL as a standard web browser to bypass basic blocks
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/pdf, application/octet-stream"
        }
        
        response = requests.get(payload.url, headers=headers, timeout=20)
        response.raise_for_status()
        
        # Prevent processing if a login page or HTML is returned instead of a file
        if "text/html" in response.headers.get("Content-Type", "").lower():
            raise ValueError("The URL returned a web page (HTML). It likely requires a login or the link does not point directly to a PDF.")

        pdf_bytes = io.BytesIO(response.content)
        
        try:
            reader = PdfReader(pdf_bytes)
            if len(reader.pages) == 0:
                raise ValueError("The PDF document is empty.")
        except Exception:
             raise ValueError("The downloaded file is not a valid or readable PDF.")

        # 2. Apply Text Edit if provided
        if payload.text and payload.text.strip():
            writer = PdfWriter()
            for page in reader.pages:
                width = float(page.mediabox.width)
                height = float(page.mediabox.height)
                
                # Generate transparent text layer and merge it
                overlay_pdf = create_text_layer(payload.text, width, height)
                overlay_reader = PdfReader(overlay_pdf)
                page.merge_page(overlay_reader.pages[0])
                writer.add_page(page)
            
            output = io.BytesIO()
            writer.write(output)
            output.seek(0)
            pdf_bytes = output
        else:
            pdf_bytes.seek(0)
        
        # 3. Return the edited file
        return Response(
            content=pdf_bytes.getvalue(),
            media_type="application/pdf",
            headers={"Content-Disposition": "inline; filename=edited_document.pdf"}
        )
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {str(e)}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")