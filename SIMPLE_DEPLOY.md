# 🚀 Simple HashCrack Deployment

## What This Project Actually Is

A **simple client-side hash cracking platform** where:
- ✅ Users crack hashes using their own browser/device
- ✅ GitHub Pages hosts the frontend (free)
- ✅ Render hosts minimal backend for teams only (free)
- ✅ No complex infrastructure needed

## File Structure (Simplified)

```
HashCrack/
├── frontend/               # GitHub Pages (main site)
│   ├── index.html         # Main interface ✅
│   ├── config.js          # Simple config ✅
│   ├── css/style.css      # Styling ✅
│   └── js/
│       ├── app.js         # Main app logic ✅
│       ├── client-cracker.js  # Browser hash cracking ✅
│       ├── hash-detection.js  # Detect hash types ✅
│       ├── p2p.js         # P2P sharing ✅
│       └── websocket.js   # Team coordination ✅
│
├── simple_backend/        # Render (team coordination only)
│   ├── app.py            # Minimal Flask server ✅
│   ├── requirements.txt  # Just Flask + WebSocket ✅
│   └── render.yaml       # Deployment config ✅
│
└── README.md             # This file ✅
```

## 🚀 Quick Deploy (5 minutes)

### Step 1: Deploy Backend to Render

1. Create account at [render.com](https://render.com)
2. Create new **Web Service**
3. Connect your GitHub repo
4. Set **Root Directory**: `simple_backend`
5. Click **Deploy**
6. Copy your URL (e.g., `https://your-app.onrender.com`)

### Step 2: Configure Frontend

1. Edit `frontend/config.js`
2. Replace `BACKEND_URL: 'https://your-render-app.onrender.com'`
3. Commit changes

### Step 3: Deploy Frontend to GitHub Pages

1. Go to repo **Settings** → **Pages**
2. Source: **Deploy from branch**
3. Branch: **main** (or development)
4. Folder: **/ (root)**
5. Your site: `https://username.github.io/HashCrack/frontend/`

## ✅ That's It!

Your hash cracking platform is live:
- **Frontend**: `https://username.github.io/HashCrack/frontend/`
- **Backend**: `https://your-app.onrender.com`

## How It Works

1. **User visits your GitHub Pages site**
2. **Pastes hash** → JavaScript detects type
3. **Browser cracks hash** using built-in wordlists
4. **Teams coordinate** via Render WebSocket (optional)
5. **Results shared** in real-time with team

## No Complex Stuff Needed

❌ **You DON'T need:**
- Docker
- Database
- Complex deployment
- Production monitoring
- Security hardening
- Load balancers

✅ **You DO need:**
- GitHub account (free)
- Render account (free)
- 5 minutes to deploy

## Customize

- Add more wordlists in `client-cracker.js`
- Change UI in `index.html` and `style.css`
- Add hash types in `hash-detection.js`
- Modify team features in `app.py`

**Simple and effective!** 🎉
