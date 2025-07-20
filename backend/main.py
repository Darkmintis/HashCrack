from fastapi import FastAPI, WebSocket, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
import hashlib
import os
import uuid
from datetime import datetime


from team_api import router as team_router

app = FastAPI(title="HashCrack API", description="Professional hash cracking backend for HashCrack platform.")

# Allow CORS for frontend

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register team API router
app.include_router(team_router)

# In-memory job store (replace with DB in production)
jobs = {}

# In-memory dashboard stats (replace with DB or real metrics in production)
dashboard_stats = {
    'hashes_cracked': 1234,  # Example value
    'active_nodes': 7,       # Example value
    'network_speed': 150000  # Example value (hashes per second)
}

# In-memory results store (replace with DB in production)
results_store = []

class CrackRequest(BaseModel):
    hash: str
    wordlists: List[str]
    mode: Optional[str] = "solo"
    team_id: Optional[str] = None

class CrackResult(BaseModel):
    success: bool
    plaintext: Optional[str]
    hash_type: Optional[str]
    time_taken: Optional[float]
    engine_used: Optional[str]

@app.post("/api/crack_hash", response_model=CrackResult)
def crack_hash(req: CrackRequest, background_tasks: BackgroundTasks):
    # Dummy implementation: only supports MD5 for demo
    hash_type = "MD5" if len(req.hash) == 32 else "Unknown"
    # In production, schedule a background cracking job
    if hash_type == "MD5":
        for word in ["password", "123456", "password123"]:
            if hashlib.md5(word.encode()).hexdigest() == req.hash:
                return CrackResult(success=True, plaintext=word, hash_type=hash_type, time_taken=0.1, engine_used="demo")
        return CrackResult(success=False, plaintext=None, hash_type=hash_type, time_taken=0.1, engine_used="demo")
    return CrackResult(success=False, plaintext=None, hash_type=hash_type, time_taken=0.0, engine_used=None)

@app.get("/api/identify_hash")
def identify_hash(hash: str):
    # Simple hash type detection
    if len(hash) == 32:
        return {"type": "MD5", "confidence": 95}
    elif len(hash) == 40:
        return {"type": "SHA1", "confidence": 90}
    elif len(hash) == 64:
        return {"type": "SHA256", "confidence": 90}
    return {"type": "Unknown", "confidence": 0}

@app.post("/api/upload_wordlist")
def upload_wordlist(file: UploadFile = File(...)):
    # Save uploaded wordlist
    wordlist_id = str(uuid.uuid4())
    path = f"wordlists/{wordlist_id}_{file.filename}"
    os.makedirs("wordlists", exist_ok=True)
    with open(path, "wb") as f:
        f.write(file.file.read())
    return {"success": True, "wordlist_id": wordlist_id, "filename": file.filename}

@app.get("/api/download_wordlist/{wordlist_id}")
def download_wordlist(wordlist_id: str):
    # Find and return wordlist file
    for fname in os.listdir("wordlists"):
        if fname.startswith(wordlist_id):
            return FileResponse(f"wordlists/{fname}", filename=fname.split('_', 1)[-1])
    raise HTTPException(status_code=404, detail="Wordlist not found")

@app.get("/api/list_wordlists")
def list_wordlists():
    wordlists = []
    wordlists_dir = "wordlists"
    if not os.path.exists(wordlists_dir):
        return []
    for fname in os.listdir(wordlists_dir):
        path = os.path.join(wordlists_dir, fname)
        if os.path.isfile(path):
            try:
                wordlist_id, filename = fname.split('_', 1)
            except ValueError:
                wordlist_id, filename = fname, fname
            size = os.path.getsize(path)
            upload_time = datetime.fromtimestamp(os.path.getctime(path)).isoformat()
            wordlists.append({
                "id": wordlist_id,
                "filename": filename,
                "size": size,
                "upload_time": upload_time
            })
    return wordlists

@app.get("/api/dashboard_stats")
def get_dashboard_stats():
    return dashboard_stats

@app.post("/api/store_result")
def store_result(result: dict):
    # Add a timestamp
    from datetime import datetime
    result['date'] = datetime.now().isoformat()
    results_store.append(result)
    return {"success": True}

@app.get("/api/list_results")
def list_results():
    return results_store

@app.websocket("/socket.io")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_text("WebSocket connection established.")
    while True:
        data = await websocket.receive_text()
        await websocket.send_text(f"Echo: {data}")

# Add more endpoints for teams, jobs, results, etc. as needed
