
# 🔓 HashCrack

<div align="center">
  <img src="https://img.shields.io/badge/HashCrack-V2.0-blue?style=for-the-badge&logo=security" alt="HashCrack">
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="MIT License"></a>
</div>

---

## 🚀 Overview

**HashCrack** is a next-generation hash cracking platform for CTF teams, penetration testers, and cybersecurity professionals. It features a modern web interface, distributed cracking, real-time team collaboration, and support for 200+ hash types.

---

## 🌟 Features

- **Modern Web UI**: Intuitive dashboard for solo and team use
- **Distributed Cracking**: Leverage multiple nodes for speed
- **Auto Hash Detection**: 200+ formats, confidence scoring
- **Smart Wordlists**: Built-in, downloadable, and custom upload
- **CTF & Team Mode**: Real-time collaboration, chat, and job sharing
- **REST API**: Integrate with your own tools and workflows
- **Privacy First**: Crack hashes locally or via your own backend

---

## ⚡ Quick Start

### Try Online

1. Visit: [https://yourusername.github.io/HashCrack/](https://yourusername.github.io/HashCrack/)
2. Paste a hash (e.g., `5f4dcc3b5aa765d61d8327deb882cf99`)
3. Click **Crack Hash** and see results instantly

### Deploy Your Own (5 Minutes)

1. **Fork** this repo and clone it
2. Deploy backend to [Render](https://render.com) (see `simple_backend/`)
3. Deploy frontend to GitHub Pages (`frontend/` folder)
4. Update `frontend/config.js` with your backend URL
5. Done! Your own instance is live

---

## 📦 Project Structure

```
HashCrack/
├── frontend/         # Web UI (HTML, JS, CSS)
│   ├── index.html
│   ├── js/
│   ├── css/
│   └── wordlists/
├── simple_backend/   # Minimal Flask backend (for teams)
│   ├── app.py
│   ├── requirements.txt
│   └── render.yaml
├── README.md
└── ...
```


## 🛠️ Deployment

**Frontend:**
- Host `frontend/` on GitHub Pages or any static site host

**Backend:**
- Deploy `simple_backend/` to Render (free tier) or your own server

**Configuration:**
- Edit `frontend/config.js` to set your backend API URL


## 🧑‍💻 Community & Support

- [GitHub Issues](https://github.com/Darkmintis/HashCrack/issues)
- [Discussions](https://github.com/Darkmintis/HashCrack/discussions)
- [Email](mailto:hashcrack@darkmintis.com)
- [Twitter](https://twitter.com/HashCrackTool)

---

## ⚠️ Legal & Disclaimer

HashCrack is for **authorized security testing, password recovery, CTF, and educational use only**. Ensure you comply with all laws and have permission before use.

---

<div align="center">
  <b>⭐ Star this repo if you like HashCrack!</b><br>
  <sub>Made with ❤️ by <a href="https://github.com/Darkmintis">Darkmintis</a></sub>
</div>