# HashCrack Backend (Professional API)

This is the professional backend for the HashCrack platform, built with FastAPI.

## Features
- REST API for hash cracking, hash identification, wordlist upload/download
- WebSocket endpoint for real-time updates
- Ready for production extension (add DB, authentication, distributed jobs, etc.)

## Quick Start (Development)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

API will be available at: http://localhost:8000

## Endpoints
- `POST /api/crack_hash` — Crack a hash (demo: MD5 only)
- `GET /api/identify_hash?hash=...` — Identify hash type
- `POST /api/upload_wordlist` — Upload a wordlist file
- `GET /api/download_wordlist/{wordlist_id}` — Download a wordlist
- `WS /socket.io` — WebSocket for real-time features

## Next Steps
- Add database for jobs, users, teams
- Implement distributed cracking engine
- Add authentication and rate limiting
- Integrate with frontend

---
MIT License
