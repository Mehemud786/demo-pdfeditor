from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI(docs_url=None, redoc_url=None) # Disable docs for production

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/fetch-pdf")
async def fetch_pdf(url: str):
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=15.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            
            return Response(
                content=response.content, 
                media_type="application/pdf",
                headers={"Content-Disposition": "inline; filename=document.pdf"}
            )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch PDF: {str(e)}")