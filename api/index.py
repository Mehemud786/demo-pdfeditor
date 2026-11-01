from fastapi import FastAPI, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. ADD THIS: A simple GET route so you can test it in your browser
@app.get("/")
def health_check():
    return {"status": "Vercel Python backend is alive and routing correctly!"}

# 2. Your existing POST route
@app.post("/api/extract-token")
def extract_token(username: str = Form(...), password: str = Form(...)):
    # ... (keep your existing login logic here) ...
    pass

TARGET_LOGIN_URL = "https://api.example.com/login" 

@app.post("/api/extract-token")
def extract_token(username: str = Form(...), password: str = Form(...)):
    payload = {
        "username": username,
        "password": password
    }
    
    try:
        session = requests.Session()
        response = session.post(TARGET_LOGIN_URL, data=payload)
        
        if response.status_code not in (200, 201, 302):
            raise HTTPException(status_code=response.status_code, detail="Authentication failed")
            
        extracted_cookies = session.cookies.get_dict()
        
        json_token = None
        if "application/json" in response.headers.get("Content-Type", ""):
            json_token = response.json().get("token") 

        return {
            "target": "example.com",
            "status_code": response.status_code,
            "session_cookies": extracted_cookies,
            "json_token": json_token,
        }
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=str(e))
        