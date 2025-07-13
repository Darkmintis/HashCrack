/**
 * Client-Side Hash Cracking Engine
 * Runs hash cracking in the user's browser using their CPU
 */

class ClientHashCracker {
    constructor() {
        this.isRunning = false;
        this.currentJob = null;
        this.hashesPerSecond = 0;
        this.startTime = null;
        this.workers = [];
        this.wordlists = new Map();
        
        // Load built-in wordlists
        this.loadBuiltInWordlists();
    }

    async loadBuiltInWordlists() {
        // Initialize empty wordlists
        this.wordlists.set('common', []);
        this.wordlists.set('enhanced', []);
        
        // Load wordlists from files
        const commonLoaded = await this.loadWordlistFromURL('common');
        const enhancedLoaded = await this.loadWordlistFromURL('enhanced');
        
        // If no wordlists could be loaded, show a warning
        if (!commonLoaded && !enhancedLoaded) {
            console.warn('⚠️ No wordlists could be loaded. Please upload your own wordlist or check the wordlists directory.');
            this.wordlists.set('common', ['password', '123456', 'admin']); // Minimal fallback
        }
    }

    async loadWordlistFromURL(wordlistName) {
        try {
            // Try to load from wordlists directory
            const response = await fetch(`./wordlists/${wordlistName}.txt`);
            if (response.ok) {
                const content = await response.text();
                const words = content.split('\n')
                    .map(word => word.trim())
                    .filter(word => word.length > 0);
                
                this.wordlists.set(wordlistName, words);
                console.log(`✅ Loaded ${words.length} words from ${wordlistName}.txt`);
                return true;
            } else {
                console.warn(`⚠️ Could not load ${wordlistName}.txt (${response.status})`);
                return false;
            }
        } catch (error) {
            console.warn(`⚠️ Error loading wordlist: ${error.message}`);
            return false;
        }
    }

    async loadWordlistFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    const words = content.split('\n')
                        .map(word => word.trim())
                        .filter(word => word.length > 0);
                    
                    const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
                    this.wordlists.set(fileName, words);
                    console.log(`✅ Loaded ${words.length} words from uploaded file: ${file.name}`);
                    resolve({ name: fileName, count: words.length });
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    // This method is no longer needed since we removed hardcoded passwords
    // Wordlists are now loaded from files or user uploads only

    async crackHash(hashValue, options = {}) {
        if (this.isRunning) {
            throw new Error('Cracking already in progress');
        }

        this.isRunning = true;
        this.startTime = Date.now();
        this.currentJob = {
            hash: hashValue,
            type: this.detectHashType(hashValue),
            wordlist: options.wordlist || 'enhanced',
            onProgress: options.onProgress || (() => {}),
            onFound: options.onFound || (() => {}),
            onComplete: options.onComplete || (() => {})
        };

        try {
            const result = await this.performCracking();
            this.currentJob.onComplete(result);
            return result;
        } catch (error) {
            this.currentJob.onComplete({ success: false, error: error.message });
            throw error;
        } finally {
            this.isRunning = false;
            this.currentJob = null;
        }
    }

    detectHashType(hash) {
        const cleanHash = hash.trim().toLowerCase();
        const length = cleanHash.length;
        
        // Common hash types
        if (/^[a-f0-9]{32}$/.test(cleanHash)) return 'MD5';
        if (/^[a-f0-9]{40}$/.test(cleanHash)) return 'SHA1';
        if (/^[a-f0-9]{64}$/.test(cleanHash)) return 'SHA256';
        if (/^[a-f0-9]{128}$/.test(cleanHash)) return 'SHA512';
        if (/^[a-f0-9]{32}:[a-f0-9]{32}$/.test(cleanHash)) return 'NTLM';
        if (/^\$1\$/.test(hash)) return 'MD5 Crypt';
        if (/^\$2[aby]?\$/.test(hash)) return 'bcrypt';
        if (/^\$5\$/.test(hash)) return 'SHA256 Crypt';
        if (/^\$6\$/.test(hash)) return 'SHA512 Crypt';
        if (/^\$y\$/.test(hash)) return 'yescrypt';
        
        return 'Unknown';
    }

    async performCracking() {
        const { hash, type, wordlist } = this.currentJob;
        const words = this.wordlists.get(wordlist) || this.wordlists.get('common');
        
        let attempts = 0;
        const totalWords = words.length;
        const updateInterval = Math.max(1, Math.floor(totalWords / 100)); // Update progress 100 times
        
        for (let i = 0; i < words.length; i++) {
            if (!this.isRunning) break;
            
            const candidate = words[i];
            attempts++;
            
            // Try the password
            if (await this.testPassword(hash, candidate, type)) {
                const timeTaken = (Date.now() - this.startTime) / 1000;
                return {
                    success: true,
                    password: candidate,
                    hash: hash,
                    hashType: type,
                    attempts: attempts,
                    timeTaken: timeTaken,
                    speed: Math.round(attempts / timeTaken)
                };
            }
            
            // Update progress
            if (i % updateInterval === 0) {
                const progress = (i / totalWords) * 100;
                const elapsed = (Date.now() - this.startTime) / 1000;
                this.hashesPerSecond = Math.round(attempts / elapsed);
                
                this.currentJob.onProgress({
                    progress: progress,
                    attempts: attempts,
                    speed: this.hashesPerSecond,
                    eta: this.calculateETA(i, totalWords, elapsed)
                });
                
                // Yield to prevent blocking the browser
                await new Promise(resolve => setTimeout(resolve, 1));
            }
        }
        
        const timeTaken = (Date.now() - this.startTime) / 1000;
        return {
            success: false,
            message: 'Password not found in wordlist',
            attempts: attempts,
            timeTaken: timeTaken,
            speed: Math.round(attempts / timeTaken)
        };
    }

    async testPassword(hash, password, type) {
        try {
            const candidateHash = await this.hashPassword(password, type);
            return candidateHash === hash.toLowerCase();
        } catch (error) {
            console.warn('Hash calculation error:', error);
            return false;
        }
    }

    async hashPassword(password, type) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        
        switch (type) {
            case 'MD5':
                return await this.md5(password);
            case 'SHA1':
                const sha1Buffer = await crypto.subtle.digest('SHA-1', data);
                return this.bufferToHex(sha1Buffer);
            case 'SHA256':
                const sha256Buffer = await crypto.subtle.digest('SHA-256', data);
                return this.bufferToHex(sha256Buffer);
            case 'SHA512':
                const sha512Buffer = await crypto.subtle.digest('SHA-512', data);
                return this.bufferToHex(sha512Buffer);
            default:
                throw new Error(`Unsupported hash type: ${type}`);
        }
    }

    async md5(string) {
        // Use proper MD5 implementation
        // Note: For production use, integrate a proper MD5 library like crypto-js
        throw new Error('MD5 hashing requires crypto-js library. Please add it to your project.');
    }

    bufferToHex(buffer) {
        return Array.from(new Uint8Array(buffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    calculateETA(current, total, elapsed) {
        if (current === 0) return 'Calculating...';
        
        const rate = current / elapsed;
        const remaining = total - current;
        const eta = remaining / rate;
        
        if (eta < 60) return `${Math.round(eta)}s`;
        if (eta < 3600) return `${Math.round(eta / 60)}m`;
        return `${Math.round(eta / 3600)}h`;
    }

    stop() {
        this.isRunning = false;
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            currentJob: this.currentJob,
            hashesPerSecond: this.hashesPerSecond
        };
    }

    addCustomWordlist(name, words) {
        this.wordlists.set(name, words);
    }

    getAvailableWordlists() {
        return Array.from(this.wordlists.keys());
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClientHashCracker;
} else {
    window.ClientHashCracker = ClientHashCracker;
}
