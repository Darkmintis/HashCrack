# 🔓 HashCrack - Professional Hash Cracking Platform

<div align="center">

![HashCrack](https://img.shields.io/badge/HashCrack-V2.0-blue?style=for-the-badge&logo=security)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deploy](https://img.shields.io/badge/Deploy-10%20minutes-green?style=for-the-badge)](GETTING_STARTED.md)

**Next-generation hash cracking tool for CTF teams and cybersecurity professionals**

[🚀 **TRY LIVE DEMO**](https://yourusername.github.io/HashCrack/) • [📖 **Getting Started**](GETTING_STARTED.md) • [⚡ **Deploy Your Own**](#deployment)

</div>

---

## ⚡ Quick Start (2 minutes)

### Option 1: Use Public Instance

1. **Visit:** [https://yourusername.github.io/HashCrack/](https://yourusername.github.io/HashCrack/)
2. **Enter hash:** `5f4dcc3b5aa765d61d8327deb882cf99`
3. **Click "Crack Hash"** → See result in seconds!

### Option 2: Deploy Your Own (10 minutes)

```bash
# 1. Fork this repository on GitHub
# 2. Run the deployment script
./deploy.sh    # Linux/Mac
deploy.bat     # Windows

# 3. Follow the prompts to deploy to:
#    - Backend: Render (free tier)
#    - Frontend: GitHub Pages (free)
```

**Your own HashCrack instance will be live at:**
- Frontend: `https://yourusername.github.io/HashCrack/`
- Backend: `https://your-app.render.com/`

---

## 🎯 Real-World Usage Examples

### Example 1: Solo Penetration Tester

**Sarah** needs to crack Windows NTLM hashes from a pentest:

1. Opens HashCrack web interface
2. Pastes hash: `aad3b435b51404eeaad3b435b51404ee:8846f7eaee8fb117ad06bdd830b7586c`
3. Auto-detected as "NTLM" with 98% confidence
4. Selects "RockYou" wordlist (14M passwords)
5. **Result:** `"password123"` found in 1.2 seconds

### Example 2: CTF Team Competition

**Team "CyberNinjas"** competing in major CTF:

1. **Team Lead (Alex):** Creates team room, gets link: `https://hashcrack.io/?team=ninjas_abc123`
2. **Member (Bob):** Joins team, uploads CTF-specific wordlist `ctf2024.txt`
3. **Member (Carol):** Shares 5 hashes from challenge, team distributes workload
4. **Team Result:** All hashes cracked in under 3 minutes using distributed P2P
5. **Victory:** First team to submit flags, wins competition! 🏆

### Example 3: yescrypt Support (Latest Linux)

```bash
Hash: $y$j9T$salt$hashedpassword...
Type: yescrypt (auto-detected)
Security: Very High (latest Linux password hashing)
Method: GPU-accelerated with contextual wordlist
Result: "admin2024!" (found using smart generation)
```

---

## 🌟 What Makes HashCrack Special

| Feature | HashCrack | Hashcat | John | Online Tools |
|---------|-----------|---------|------|--------------|
| **Multi-Engine Support** | ✓ John + Hashcat | ✗ | ✗ | ✗ |
| **Web Interface** | ✓ Modern UI | ✗ | ✗ | ✓ Basic |
| **Auto Hash Detection** | ✓ 200+ formats | ✗ | ✓ Limited | ✓ Basic |
| **Real-time Progress** | ✓ WebSocket | ✗ | ✗ | ✗ |
| **CTF Team Features** | ✓ Collaboration | ✗ | ✗ | ✗ |
| **Smart Wordlists** | ✓ Auto-download | ✗ | ✗ | ✗ |
| **Privacy** | ✓ Local/LAN | ✓ | ✓ | ✗ |
| **GPU Acceleration** | ✓ | ✓ | ✗ | ✗ |

---

## What Makes HashCrack Revolutionary

### Multi-Engine Intelligence
- **Automatic engine selection** based on hash type and available hardware
- **Seamless fallback** when one engine fails
- **Performance optimization** for each hash algorithm

### Advanced Hash Detection
- **200+ hash formats** supported (vs 20-50 in other tools)  
- **Confidence scoring** for accurate identification
- **Custom format support** for CTF and obscure algorithms
- **Salt extraction** and intelligent handling

### Adaptive Cracking Strategy
```
Smart Attack Progression:
Dictionary → Rules → Hybrid → Brute Force
     ↓         ↓       ↓         ↓
Context-aware wordlists + Learning system
```

### CTF Team Collaboration
- **Real-time workspace** for multiple team members
- **Live progress sharing** across the team
- **Role assignments** and task distribution
- **Hint system** with contextual suggestions

---

## Quick Start

### Option 1: Web Interface (Recommended)
```bash
# Clone the repository
git clone https://github.com/Darkmintis/HashCrack.git
cd HashCrack

# Install dependencies
pip install -r requirements.txt

# Run setup (installs John, Hashcat, downloads wordlists)
python setup.py

# Start web interface
python web_interface.py
```

**Open http://localhost:5000 in your browser**

### Option 2: Command Line
```bash
# Crack a single hash
python hashcrack.py --hash "5f4dcc3b5aa765d61d8327deb882cf99" --wordlist auto

# Crack multiple hashes from file
python hashcrack.py --input hashes.txt --wordlist rockyou --output results.json

# CTF mode with hints
python hashcrack.py --hash "hash_here" --ctf --category crypto
```

---

## Supported Hash Types

<details>
<summary><strong>Click to see all 200+ supported formats</strong></summary>

### Common Hashes
- MD5, SHA1, SHA224, SHA256, SHA384, SHA512
- NTLM, LM, NetNTLMv1, NetNTLMv2
- bcrypt, scrypt, Argon2

### Database Hashes
- MySQL (all versions), PostgreSQL, MSSQL, Oracle
- SQLite, MongoDB, Cassandra

### Application Hashes
- WordPress, Joomla, Drupal, phpBB
- Django, Flask, Rails, Laravel

### Archive Formats
- ZIP, RAR, 7-Zip, PDF, Office documents
- TrueCrypt, VeraCrypt, BitLocker

### Wireless Security
- WPA/WPA2 PSK, WPS, WEP
- 802.11 handshakes

### Operating Systems
- Linux /etc/shadow (all formats)
- Windows SAM, Active Directory
- macOS, FreeBSD, AIX, Solaris

### CTF & Custom
- Base64, Hex, ROT13, Caesar cipher
- Custom algorithms, nested encodings
- Steganography-related hashes

</details>

---

## CTF Mode

HashCrack includes specialized features for Capture The Flag competitions:

### Smart CTF Detection
```python
# Automatically detects CTF-style challenges
python hashcrack.py --hash "flag{encoded_string}" --ctf

# Category-specific hints
python hashcrack.py --hash "hash" --ctf --category "crypto,forensics"

# Team collaboration mode
python hashcrack.py --team-server --port 8080
```

### CTF-Specific Features
- **Flag format detection**: `flag{...}`, `CTF{...}`, custom formats
- **Hint system**: Context-aware suggestions
- **Time pressure mode**: Optimized for competition speed
- **Team dashboard**: Real-time collaboration

---

## Installation

### Requirements
- Python 3.8+
- 4GB RAM minimum (8GB+ recommended)
- GPU (optional, for Hashcat acceleration)

### Automatic Installation
```bash
git clone https://github.com/Darkmintis/HashCrack.git
cd HashCrack
python setup.py --full  # Installs everything including wordlists
```

### Manual Installation
```bash
# Install Python dependencies
pip install -r requirements.txt

# Install John the Ripper
# Ubuntu/Debian: sudo apt install john
# macOS: brew install john-jumbo
# Windows: Download from openwall.com

# Install Hashcat
# Ubuntu/Debian: sudo apt install hashcat
# macOS: brew install hashcat
# Windows: Download from hashcat.net
```

---

## Documentation

### Use Cases

<details>
<summary><strong>Penetration Testing</strong></summary>

```bash
# Crack Windows NTLM hashes
python hashcrack.py --input ntlm_hashes.txt --wordlist rockyou

# MySQL password recovery
python hashcrack.py --hash "mysql_hash" --type mysql

# WiFi WPA2 handshake
python hashcrack.py --input handshake.hccapx --wordlist wifi-passwords
```

</details>

<details>
<summary><strong>Digital Forensics</strong></summary>

```bash
# Crack archive passwords
python hashcrack.py --input encrypted.zip --wordlist custom

# Office document passwords  
python hashcrack.py --input document.docx --brute-force --max-length 8

# Disk encryption recovery
python hashcrack.py --input veracrypt.vol --wordlist names+dates
```

</details>

<details>
<summary><strong>CTF Competitions</strong></summary>

```bash
# Quick CTF mode
python hashcrack.py --hash "ctf_hash" --ctf --fast

# Team collaboration
python hashcrack.py --team-mode --share-progress

# Custom algorithms
python hashcrack.py --hash "encoded" --ctf --algorithm custom
```

</details>

### Configuration

Create `config/settings.json` for custom configuration:
```json
{
  "engines": {
    "john": {
      "path": "/usr/bin/john",
      "threads": "auto"
    },
    "hashcat": {
      "path": "/usr/bin/hashcat",
      "gpu": true,
      "workload": 3
    }
  },
  "wordlists": {
    "auto_download": true,
    "max_size_gb": 10,
    "priority": ["rockyou", "seclist", "ctf"]
  },
  "ctf": {
    "hint_level": "medium",
    "time_pressure": false,
    "team_mode": true
  }
}
```

---

## Architecture

```
HashCrack/
├── hash_engine.py      # Multi-engine intelligence
├── wordlist_manager.py # Smart wordlist management
├── progress_tracker.py # Real-time progress tracking
├── web_interface.py    # Modern web UI
├── hashcrack.py        # Enhanced CLI
├── ctf_mode.py         # CTF-specific features
├── result_cache.py     # Intelligent caching
└── setup.py           # Automated installation
```

---

## Contributing

We welcome contributions from the cybersecurity community!

### Ways to Contribute
- **Bug Reports**: Found an issue? [Create an issue](https://github.com/Darkmintis/HashCrack/issues)
- **Feature Requests**: Have an idea? [Start a discussion](https://github.com/Darkmintis/HashCrack/discussions)
- **Code**: Submit pull requests with improvements
- **Documentation**: Help improve our docs
- **Testing**: Test on different platforms
- **Spread the word**: Star the repo, share with friends

### Development Setup
```bash
# Fork the repository
git clone https://github.com/YourUsername/HashCrack.git
cd HashCrack

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows

# Install development dependencies
pip install -r requirements-dev.txt

# Run tests
python -m pytest tests/

# Start development server
python web_interface.py --dev
```

### Contribution Guidelines
- Follow PEP 8 style guidelines
- Add tests for new features
- Update documentation
- Ensure cross-platform compatibility

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License - Use freely, modify, distribute, even for commercial purposes
```

---

## 🚀 Deployment

### Production Deployment (GitHub Pages + Render)

**Perfect for teams and organizations**

#### Step 1: Fork & Configure (2 minutes)
```bash
# 1. Fork this repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOURUSERNAME/HashCrack.git
cd HashCrack

# 3. Run deployment configurator
./deploy.sh    # Linux/Mac
deploy.bat     # Windows
```

#### Step 2: Deploy Backend to Render (5 minutes)
1. Sign up at [render.com](https://render.com) (free tier available)
2. Create new **Web Service**
3. Connect your GitHub repository
4. Settings:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python enhanced_web_interface.py`
   - **Environment:** Python 3.9+
5. Deploy and get your URL: `https://your-app.render.com`

#### Step 3: Deploy Frontend to GitHub Pages (3 minutes)
1. Go to your repository **Settings**
2. Navigate to **Pages** section
3. Set Source: **Deploy from a branch**
4. Branch: `main`, Folder: `/frontend`
5. Your frontend will be live at: `https://YOURUSERNAME.github.io/HashCrack/`

#### Step 4: Test Your Instance
1. Visit `https://YOURUSERNAME.github.io/HashCrack/`
2. Enter test hash: `5f4dcc3b5aa765d61d8327deb882cf99`
3. Click "Crack Hash"
4. Should return: `"password"` 

**🎉 Your HashCrack instance is now live and ready for teams!**

### Local Development
```bash
# Backend
cd HashCrack
pip install -r requirements.txt
python enhanced_web_interface.py

# Frontend (in another terminal)
cd frontend
python -m http.server 8080

# Visit: http://localhost:8080
```

### Docker Deployment
```bash
# One-line deployment
docker run -p 5000:5000 -p 8080:8080 darkmintis/hashcrack:latest

# Or build yourself
docker build -t hashcrack .
docker run -p 5000:5000 hashcrack
```

### Cost Analysis

| Component | Free Tier | Usage | Cost/Month |
|-----------|-----------|--------|------------|
| **GitHub Pages** | Unlimited | Frontend hosting | $0 |
| **Render** | 750 hours | Backend API | $0 |
| **Total** | - | Small team usage | **$0** |

**For larger teams:** Render Pro ($7/month) removes sleep and adds more resources.

---

## Community

Join our growing community of cybersecurity professionals:

- **GitHub**: [Issues & Discussions](https://github.com/Darkmintis/HashCrack)
- **Email**: hashcrack@darkmintis.com
- **Twitter**: [@HashCrackTool](https://twitter.com/HashCrackTool)
- **YouTube**: [HashCrack Tutorials](https://youtube.com/HashCrackTool)

---

## Acknowledgments

HashCrack builds upon the incredible work of:
- **John the Ripper** team for their password cracking engine
- **Hashcat** team for GPU-accelerated cracking
- **SecLists** project for comprehensive wordlists
- **The entire cybersecurity community** for continuous feedback

---

## Legal Disclaimer

HashCrack is designed for:
- **Authorized penetration testing**
- **Password recovery for owned systems**
- **Educational and research purposes**
- **CTF competitions and security training**

**Users are responsible for ensuring legal compliance in their jurisdiction.**

---

<div align="center">

**Star this repository if HashCrack helps you crack the code!**

Made with passion by [Darkmintis](https://github.com/Darkmintis)

![HashCrack](https://img.shields.io/badge/HashCrack-Next%20Generation%20Hash%20Cracking-success?style=for-the-badge)

</div>
#   H a s h C r a c k  
 