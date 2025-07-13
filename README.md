# 🔓 HashCrack

<div align="center">

![HashCrack](https://img.shields.io/badge/HashCrack-v0.5--dev-orange?style=for-the-badge&logo=security)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Status](https://img.shields.io/badge/Status-Development-yellow?style=for-the-badge)](README.md)

**Simple client-side hash cracking in your browser**

[🚀 **Live Demo**](https://yourusername.github.io/HashCrack/) • [📖 **Architecture**](SIMPLE_ARCHITECTURE.md) • [🚀 **Deploy Guide**](SIMPLE_DEPLOY.md)

</div>

---

## 🎯 What is HashCrack?

HashCrack is a **simple, client-side hash cracking tool** that runs entirely in your browser. No server setup, no backend complexity - just paste a hash and let your browser do the work using wordlists.

### ✨ Key Features

- **🌐 Client-Side**: All cracking happens in your browser using your CPU
- ** Zero Install**: Works on any device with a modern web browser
- **🔒 Privacy First**: Your hashes never leave your device
- **📝 Wordlist Based**: Uses wordlist files for password attempts
- **🚀 Easy Deploy**: Host on GitHub Pages for free

### 🎮 Perfect For

- **Learning**: Understanding how hash cracking works
- **CTF Competitions**: Quick hash cracking during competitions
- **Privacy-Conscious Users**: Keep your hashes completely local
- **Offline Use**: Works without internet connection

---

## 🚀 Quick Start

### Option 1: Use Online (Easiest)

1. Visit the live demo: **[HashCrack Online](https://yourusername.github.io/HashCrack/)**
2. Paste your hash: `5f4dcc3b5aa765d61d8327deb882cf99`
3. Select a wordlist and click "Start Cracking"
4. Result: `password` found!

### Option 2: Run Locally

```bash
# Clone the repository
git clone https://github.com/yourusername/HashCrack.git
cd HashCrack

# Serve the frontend locally
cd frontend
python -m http.server 8080

# Open browser to http://localhost:8080
```

### Option 3: Deploy Your Own

See our [Simple Deploy Guide](SIMPLE_DEPLOY.md) for hosting on GitHub Pages.

---

## 🔧 How It Works

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Your Browser  │    │   Wordlist File │    │     Results     │
│                 │    │                 │    │                 │
│ • Hash Input    │◄──►│ • Load from URL │◄──►│ • Display Found │
│ • Hash Cracking │    │ • User Upload   │    │ • Show Progress │
│ • Progress UI   │    │ • Built-in Demo │    │ • Export Data   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Pure Client-Side Operation:**
- Hash cracking engine runs in your browser
- Wordlist loading from files or user uploads
- Progress tracking and results display
- No server communication required
- Complete privacy - nothing leaves your device

---

## 📝 Supported Hash Types

Currently supported in the browser:

| Hash Type | Example | Status |
|-----------|---------|--------|
| **SHA1** | `da39a3ee5e6b4b0d3255bfef95601890afd80709` | ✅ Native |
| **SHA256** | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` | ✅ Native |
| **SHA512** | `cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce...` | ✅ Native |
| **MD5** | `d41d8cd98f00b204e9800998ecf8427e` | ⚠️ Requires crypto-js |

### Adding MD5 Support

To enable MD5 hashing, add crypto-js to your frontend:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>
```

---

## 📁 Project Structure

```
HashCrack/
├── frontend/                 # GitHub Pages frontend
│   ├── index.html           # Main interface
│   ├── config.js            # Configuration
│   ├── css/style.css        # Styling
│   ├── js/
│   │   ├── app.js           # Main application
│   │   ├── client-cracker.js # Hash cracking engine
│   │   └── offline.js       # Offline features
│   └── wordlists/           # Sample wordlists
│       ├── common.txt       # Basic passwords
│       └── enhanced.txt     # Extended wordlist
│
├── SIMPLE_ARCHITECTURE.md  # Architecture overview
├── SIMPLE_DEPLOY.md        # Deployment guide
└── README.md               # This file
```

---

## 🛠️ Development

### Local Development Setup

```bash
# Frontend development
cd frontend
python -m http.server 8080
# Open browser to http://localhost:8080
```

### Adding New Hash Types

1. Add detection logic in `detectHashType()` in `client-cracker.js`
2. Implement hashing function in `hashPassword()`
3. Test with known hash/password pairs

### Contributing

We welcome contributions! This is a simple, educational project focused on:

- **Simplicity**: Keep it simple and browser-based
- **Privacy**: Client-side processing
- **Education**: Help people learn about hash cracking
- **Offline Use**: Works without internet connection

---

## 📄 License

MIT License - feel free to use, modify, and distribute.

---

## ⚠️ Important Notes

### This is a Development Version (v0.5-dev)

- **Not for production use**: Still in active development
- **Limited hash support**: Only basic hash types currently
- **Educational purpose**: Designed for learning and CTF competitions
- **No guarantees**: Use at your own risk

### Legal Disclaimer

HashCrack is intended for:
- **Educational purposes**
- **Authorized security testing**
- **CTF competitions**
- **Personal password recovery**

Users are responsible for legal compliance in their jurisdiction.

---

<div align="center">

**Made with ❤️ for the cybersecurity community**

[⭐ Star this repo](https://github.com/yourusername/HashCrack) if you find it useful!

</div>