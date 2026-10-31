from fastapi import FastAPI, UploadFile, File
from fastapi.responses import Response
from pypdf import PdfWriter, PdfReader
import io

app = FastAPI()

@app.post("/api/merge")
async def merge_pdfs(files: list[UploadFile] = File(...)):
    merger = PdfWriter()
    
    try:
        for file in files:
            # Read the uploaded file into memory
            content = await file.read()
            pdf = PdfReader(io.BytesIO(content))
            merger.append(pdf)
            
        output_pdf = io.BytesIO()
        merger.write(output_pdf)
        merger.close()
        
        # Reset buffer pointer to the beginning
        output_pdf.seek(0)
        
        return Response(
            content=output_pdf.getvalue(),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=merged.pdf"}
        )
    except Exception as e:
        return Response(content=f"Error processing PDFs: {str(e)}", status_code=500)