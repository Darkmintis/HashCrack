# HashCrack - Simple Client-Side Hash Cracking Platform

## What You Actually Need

For your simple hash cracking platform, you only need these files:

### 📁 Frontend (GitHub Pages)
```
frontend/
├── index.html          ✅ (already good)
├── config.js           ✅ (simplified)
├── css/style.css       ✅ (clean design)
└── js/
    ├── app.js          ✅ (main logic)
    ├── client-cracker.js ✅ (browser-based cracking)
    ├── hash-detection.js ✅ (detect hash types)
    ├── p2p.js          ✅ (peer-to-peer sharing)
    └── websocket.js    ✅ (team coordination)
```

### 📁 Simple Backend (Render)
```
simple_backend/
├── app.py              ✅ (minimal Flask for teams)
├── requirements.txt    ✅ (just Flask + WebSocket)
└── render.yaml         ✅ (deployment config)
```

### 📁 Deployment
```
deploy.sh               ✅ (simple deployment)
README.md               ✅ (usage instructions)
```

## What We're Removing

❌ **Unnecessary Files:**
- `enhanced_web_interface.py` (too complex)
- `web_interface.py` (redundant)
- `config.py` (overengineered)
- `db_manager.py` (no database needed)
- `requirements-dev.txt` (not needed)
- `docker-compose.yml` (overkill)
- `Dockerfile` (overkill)
- All monitoring stuff (nginx/, monitoring/, .github/)
- Production deployment docs (too complex)

## How It Works

1. **Frontend (GitHub Pages)**: User pastes hash → browser cracks it using JavaScript
2. **Backend (Render)**: Only for team coordination via WebSocket
3. **No Database**: Everything is in-memory/client-side
4. **No Login**: Just paste hash and crack

## Simple Architecture

```
User Browser (GitHub Pages) ←→ Render Backend (Teams Only)
     ↓
   Cracks Hash Locally
   (Uses user's CPU/GPU)
```

Ready to clean this up?
