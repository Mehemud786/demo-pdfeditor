from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI(docs_url=None, redoc_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/fetch-pdf")
async def fetch_pdf(url: str):
    # Auto-add https if missing
    if not url.startswith("http"):
        url = "https://" + url

    # Trick servers into thinking this request is coming from a real Chrome browser
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        "Accept": "application/pdf,application/octet-stream,*/*"
    }

    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=15.0) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            
            # Prevent crashing if the URL is a webpage (like Google Drive) instead of a raw PDF
            content_type = response.headers.get("content-type", "").lower()
            if "text/html" in content_type:
                raise HTTPException(status_code=400, detail="URL returned a webpage, not a direct PDF file. Ensure this is a raw download link.")
            
            return Response(
                content=response.content, 
                media_type="application/pdf",
                headers={"Content-Disposition": "inline; filename=document.pdf"}
            )
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Request timed out. The PDF might be too large.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))