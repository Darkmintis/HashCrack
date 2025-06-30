# 🚀 HashCrack - Getting Started Guide

## What is HashCrack?

HashCrack is a **next-generation hash cracking platform** designed for CTF teams, penetration testers, and cybersecurity professionals. It provides:

- **500+ hash type support** including yescrypt, bcrypt, NTLM, MD5, SHA, and more
- **Team collaboration** with real-time updates and shared wordlists
- **Distributed P2P cracking** across multiple browsers for faster results
- **Modern web interface** that works on any device
- **Zero installation** - works directly in your browser

## 🎯 Quick Start (5 minutes)

### For Individual Users

1. **Visit the website:** `https://yourusername.github.io/HashCrack/`
2. **Enter a hash:** Paste your hash in the input field
3. **Auto-detection:** HashCrack automatically identifies the hash type
4. **Select wordlist:** Choose from built-in wordlists (RockYou, SecLists, etc.)
5. **Click "Crack Hash":** Watch the progress in real-time
6. **Get result:** Copy the cracked password when found

### For CTF Teams

1. **Team Leader:** Create a new team room
2. **Share team link** with your teammates
3. **Upload custom wordlists** for your CTF
4. **Distribute hash cracking** across all team members
5. **See real-time progress** from all team members
6. **Share results instantly** when hashes are cracked

## 🛠️ Deployment Options

### Option 1: Use Public Instance (Easiest)

Just visit a public HashCrack instance - no setup required!

### Option 2: Deploy Your Own (Recommended for Teams)

#### Step 1: Fork the Repository
```bash
# Go to GitHub and fork the repository
https://github.com/yourusername/HashCrack
```

#### Step 2: Deploy Backend to Render (FREE)
1. Sign up at [render.com](https://render.com)
2. Connect your GitHub account
3. Create a new **Web Service**
4. Select your forked repository
5. Set these values:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python enhanced_web_interface.py`
   - **Environment:** Python 3.9+
6. Deploy and note your URL (e.g., `https://your-app.render.com`)

#### Step 3: Configure Frontend
1. Edit `frontend/config.js`
2. Replace `YOUR_RENDER_URL_HERE` with your Render URL
3. Commit and push changes

#### Step 4: Deploy Frontend to GitHub Pages
1. Go to your repository **Settings**
2. Scroll to **Pages** section
3. Set Source to **Deploy from a branch**
4. Select branch: `main`, folder: `/frontend`
5. Your site will be available at: `https://yourusername.github.io/HashCrack/`

## 🎮 Usage Examples

### Example 1: Single Hash Cracking

```
Hash: 5f4dcc3b5aa765d61d8327deb882cf99
Type: MD5 (auto-detected)
Wordlist: RockYou
Result: "password" (found in 0.2 seconds)
```

### Example 2: Team CTF Scenario

**CTF Challenge:** "Crack these 5 NTLM hashes"

1. **Team Leader (Alice):**
   - Creates team "CyberNinjas"
   - Uploads CTF-specific wordlist
   - Assigns hash #1 to herself

2. **Team Member (Bob):**
   - Joins team via shared link
   - Takes hash #2 and #3
   - Starts distributed cracking

3. **Team Member (Carol):**
   - Joins team
   - Takes hash #4 and #5
   - Enables P2P to help Bob

4. **Results:**
   - Hash #1: Cracked by Alice in 30 seconds
   - Hash #2: Cracked by Bob in 2 minutes
   - Hash #3: Cracked by Bob+Carol P2P in 45 seconds
   - Hash #4: Cracked by Carol in 1 minute
   - Hash #5: Too complex, marked for later

**Team completes challenge in under 5 minutes!**

### Example 3: yescrypt Support

```
Hash: $y$j9T$salt$hash... (yescrypt)
Detection: "yescrypt - Latest Linux Password Hashing"
Security: Very High
Approach: GPU-accelerated cracking with custom wordlist
Result: Found using contextual password generation
```

## 🔧 Advanced Features

### Hash Type Support

HashCrack supports **500+ hash algorithms** including:

- **Modern:** yescrypt, Argon2, bcrypt, scrypt
- **Classic:** MD5, SHA1, SHA256, SHA512, NTLM
- **System:** Unix crypt, Windows LM/NTLM, macOS
- **Application:** WordPress, Joomla, Django, Laravel
- **Cryptocurrency:** Bitcoin, Ethereum wallets
- **CTF:** Custom formats and encoded hashes

### Team Collaboration Features

- **Real-time dashboard** showing all team member activity
- **Shared wordlists** with upload/download capabilities
- **Job distribution** across multiple browsers
- **Live chat** for coordination
- **Progress synchronization** across all team members
- **Automatic result sharing** when hashes are cracked

### P2P Distributed Cracking

- **Browser-to-browser** communication using WebRTC
- **Automatic workload distribution** based on device capability
- **GPU acceleration** when available
- **Fault tolerance** - continues if some peers disconnect
- **Speed scaling** - more browsers = faster cracking

## 🎓 Learning Resources

### For Beginners

1. **What are hashes?** Understanding cryptographic hashing
2. **Common hash types** and their security levels
3. **Password cracking basics** - dictionary vs brute force
4. **Wordlist strategies** for different scenarios

### For CTF Teams

1. **Team coordination** best practices
2. **Custom wordlist creation** for specific challenges
3. **Time management** during competitions
4. **Advanced hash identification** techniques

### For Professionals

1. **Password policy assessment** using cracking results
2. **Security testing** methodologies
3. **Compliance reporting** and documentation
4. **Enterprise deployment** considerations

## 🚨 Responsible Use

HashCrack is designed for **legitimate security testing** only:

✅ **Authorized penetration testing**
✅ **CTF competitions and training**
✅ **Password policy assessment**
✅ **Academic research and education**
✅ **Personal security audit**

❌ **Unauthorized password cracking**
❌ **Illegal access attempts**
❌ **Malicious activities**

## 📞 Support & Community

### Getting Help

- **GitHub Issues:** Report bugs and request features
- **Documentation:** Complete API and usage docs
- **Community:** Join discussions with other users
- **Updates:** Follow for new features and improvements

### Contributing

HashCrack is open source! Contributions welcome:

- **Bug fixes** and improvements
- **New hash type support**
- **UI/UX enhancements**
- **Documentation updates**
- **Performance optimizations**

## 🏆 Why Choose HashCrack?

| Feature | HashCrack | Competitors |
|---------|-----------|-------------|
| **Setup Time** | 0 seconds | 30+ minutes |
| **Team Support** | Real-time collaboration | None |
| **Device Support** | Any browser | Desktop only |
| **yescrypt** | Full support | Limited |
| **Cost** | Free | Varies |
| **Updates** | Automatic | Manual |

HashCrack provides a **Netflix-like experience** for hash cracking - it just works, beautifully, on any device, with your team.

---

**Ready to get started?** Visit your HashCrack instance and crack your first hash in under 30 seconds!
