/**
 * Ultimate Client-Side Hash Cracking Engine
 * The most powerful browser-based hash cracker
 */

class HashCracker {
    constructor() {
        this.isRunning = false;
        this.currentJob = null;
        this.hashesPerSecond = 0;
        this.startTime = null;
        this.workers = [];
        this.wordlists = new Map();
        this.supportedAlgorithms = [
            'md5', 'sha1', 'sha256', 'sha512', 'sha224', 'sha384'
        ];
        
        this.loadBuiltInWordlists();
        this.initializeWorkers();
    }

    // Initialize web workers for parallel processing
    initializeWorkers() {
        const numWorkers = navigator.hardwareConcurrency || 4;
        for (let i = 0; i < numWorkers; i++) {
            const worker = new Worker(this.createWorkerBlob());
            worker.onmessage = this.handleWorkerMessage.bind(this);
            this.workers.push(worker);
        }
    }

    createWorkerBlob() {
        const workerCode = `
            importScripts('https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js');
            
            self.onmessage = function(e) {
                const { hashType, targetHash, wordlist, startIndex, endIndex } = e.data;
                
                for (let i = startIndex; i < endIndex; i++) {
                    const word = wordlist[i];
                    if (!word) continue;
                    
                    let hash;
                    switch(hashType.toLowerCase()) {
                        case 'md5':
                            hash = CryptoJS.MD5(word).toString();
                            break;
                        case 'sha1':
                            hash = CryptoJS.SHA1(word).toString();
                            break;
                        case 'sha256':
                            hash = CryptoJS.SHA256(word).toString();
                            break;
                        case 'sha512':
                            hash = CryptoJS.SHA512(word).toString();
                            break;
                        case 'sha224':
                            hash = CryptoJS.SHA224(word).toString();
                            break;
                        case 'sha384':
                            hash = CryptoJS.SHA384(word).toString();
                            break;
                        default:
                            continue;
                    }
                    
                    if (hash === targetHash.toLowerCase()) {
                        self.postMessage({ found: true, password: word, hash: hash });
                        return;
                    }
                }
                
                self.postMessage({ found: false, processed: endIndex - startIndex });
            };
        `;
        
        return URL.createObjectURL(new Blob([workerCode], { type: 'application/javascript' }));
    }

    handleWorkerMessage(e) {
        const { found, password, hash, processed } = e.data;
        
        if (found) {
            this.stopCracking();
            this.displayResult(password, hash);
        } else if (processed) {
            this.updateProgress(processed);
        }
    }

    async loadBuiltInWordlists() {
        // Common passwords - expanded list
        const commonPasswords = [
            'password', '123456', 'password123', 'admin', 'qwerty',
            'letmein', 'welcome', '1234567890', 'abc123', 'iloveyou',
            'password1', '123456789', 'welcome123', 'admin123', 'root',
            'toor', 'pass', 'test', 'guest', 'user', 'login', 'secret',
            'administrator', 'monkey', 'dragon', 'jesus', 'trustno1',
            'hello', 'master', 'sunshine', 'superman', 'football',
            'baseball', 'michael', 'jordan', 'batman', 'harley',
            'ranger', 'hockey', 'george', 'butter', 'rainbow',
            'computer', 'michelle', 'jessica', 'pepper', 'killer',
            'orange', 'access', 'coffee', 'flower', 'chicken',
            'martin', 'tigger', 'liberty', 'internet', 'service',
            'cookie', 'john', 'money', 'princess', 'jennifer',
            'joshua', 'hunter', 'andrew', 'daniel', 'silver',
            'golden', 'summer', 'winter', 'spring', 'autumn'
        ];
        
        this.wordlists.set('common', commonPasswords);
        
        // Load from files if available
        try {
            await this.loadWordlistFromURL('common');
            await this.loadWordlistFromURL('enhanced');
            await this.loadWordlistFromURL('rockyou');
        } catch (e) {
            console.log('Using built-in wordlists');
        }
    }

    async loadWordlistFromURL(name) {
        try {
            const response = await fetch(`./wordlists/${name}.txt`);
            if (response.ok) {
                const content = await response.text();
                const words = content.split('\n')
                    .map(word => word.trim())
                    .filter(word => word.length > 0);
                
                this.wordlists.set(name, words);
                console.log(`Loaded ${words.length} words from ${name}.txt`);
                return true;
            }
        } catch (e) {
            console.log(`Could not load ${name}.txt`);
        }
        return false;
    }

    detectHashType(hash) {
        hash = hash.trim();
        
        // Remove common prefixes
        if (hash.startsWith('$')) {
            if (hash.startsWith('$1$')) return { type: 'MD5 Crypt', confidence: 95 };
            if (hash.startsWith('$2a$') || hash.startsWith('$2b$')) return { type: 'bcrypt', confidence: 95 };
            if (hash.startsWith('$5$')) return { type: 'SHA-256 Crypt', confidence: 95 };
            if (hash.startsWith('$6$')) return { type: 'SHA-512 Crypt', confidence: 95 };
        }
        
        // Detect by length and format
        switch (hash.length) {
            case 32:
                return /^[a-f0-9]{32}$/i.test(hash) ? 
                    { type: 'MD5', confidence: 90 } : 
                    { type: 'Unknown', confidence: 0 };
            case 40:
                return /^[a-f0-9]{40}$/i.test(hash) ? 
                    { type: 'SHA1', confidence: 90 } : 
                    { type: 'Unknown', confidence: 0 };
            case 56:
                return /^[a-f0-9]{56}$/i.test(hash) ? 
                    { type: 'SHA224', confidence: 85 } : 
                    { type: 'Unknown', confidence: 0 };
            case 64:
                return /^[a-f0-9]{64}$/i.test(hash) ? 
                    { type: 'SHA256', confidence: 90 } : 
                    { type: 'Unknown', confidence: 0 };
            case 96:
                return /^[a-f0-9]{96}$/i.test(hash) ? 
                    { type: 'SHA384', confidence: 85 } : 
                    { type: 'Unknown', confidence: 0 };
            case 128:
                return /^[a-f0-9]{128}$/i.test(hash) ? 
                    { type: 'SHA512', confidence: 90 } : 
                    { type: 'Unknown', confidence: 0 };
            default:
                return { type: 'Unknown', confidence: 0 };
        }
    }

    async startCracking(hash, wordlistName = 'common') {
        if (this.isRunning) {
            throw new Error('Already cracking a hash');
        }

        const detection = this.detectHashType(hash);
        if (detection.confidence < 50) {
            throw new Error('Hash type could not be detected reliably');
        }

        const wordlist = this.wordlists.get(wordlistName);
        if (!wordlist || wordlist.length === 0) {
            throw new Error('Wordlist not found or empty');
        }

        this.isRunning = true;
        this.startTime = Date.now();
        this.currentJob = {
            hash: hash.toLowerCase(),
            type: detection.type,
            wordlist: wordlistName,
            totalWords: wordlist.length,
            processedWords: 0
        };

        // Update UI
        this.updateUI('running', detection);
        
        // Distribute work across workers
        const wordsPerWorker = Math.ceil(wordlist.length / this.workers.length);
        
        this.workers.forEach((worker, index) => {
            const startIndex = index * wordsPerWorker;
            const endIndex = Math.min(startIndex + wordsPerWorker, wordlist.length);
            
            worker.postMessage({
                hashType: detection.type,
                targetHash: hash,
                wordlist: wordlist,
                startIndex: startIndex,
                endIndex: endIndex
            });
        });
    }

    stopCracking() {
        this.isRunning = false;
        this.workers.forEach(worker => worker.terminate());
        this.initializeWorkers(); // Recreate workers
        this.updateUI('stopped');
    }

    updateProgress(processed) {
        if (!this.currentJob) return;
        
        this.currentJob.processedWords += processed;
        const progress = (this.currentJob.processedWords / this.currentJob.totalWords) * 100;
        const elapsed = (Date.now() - this.startTime) / 1000;
        this.hashesPerSecond = Math.round(this.currentJob.processedWords / elapsed);
        
        this.updateUI('progress', null, progress);
    }

    displayResult(password, hash) {
        const elapsed = (Date.now() - this.startTime) / 1000;
        this.updateUI('success', null, 100, password, elapsed);
    }

    updateUI(status, detection = null, progress = 0, password = null, elapsed = 0) {
        // Update status indicator
        const statusIndicator = document.getElementById('statusIndicator');
        const progressBar = document.getElementById('mainProgress');
        const progressLabel = document.getElementById('progressLabel');
        const speedDisplay = document.getElementById('crackSpeed');
        const etaDisplay = document.getElementById('crackETA');
        const resultDisplay = document.getElementById('resultDisplay');

        if (statusIndicator) {
            statusIndicator.className = `status-indicator ${status}`;
            statusIndicator.innerHTML = `<span></span><span>${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
        }

        if (progressBar && progressLabel) {
            progressBar.style.width = `${progress}%`;
            progressLabel.textContent = `${Math.round(progress)}%`;
        }

        if (speedDisplay) {
            speedDisplay.textContent = `${this.hashesPerSecond.toLocaleString()} H/s`;
        }

        if (etaDisplay && this.hashesPerSecond > 0 && this.currentJob) {
            const remaining = this.currentJob.totalWords - this.currentJob.processedWords;
            const etaSeconds = remaining / this.hashesPerSecond;
            etaDisplay.textContent = etaSeconds > 3600 ? 
                `${Math.round(etaSeconds / 3600)}h` : 
                `${Math.round(etaSeconds)}s`;
        }

        // Show hash detection info
        if (detection && document.getElementById('hashInfo')) {
            document.getElementById('hashInfo').style.display = 'block';
            document.getElementById('detectedType').textContent = detection.type;
            document.getElementById('confidence').textContent = `${detection.confidence}% confidence`;
        }

        // Show result
        if (status === 'success' && password && resultDisplay) {
            resultDisplay.style.display = 'block';
            document.getElementById('originalHash').textContent = this.currentJob.hash;
            document.getElementById('crackedPassword').textContent = password;
            document.getElementById('timeTaken').textContent = `${elapsed.toFixed(2)}s`;
        }
    }

    // Add custom wordlist
    addWordlist(name, words) {
        this.wordlists.set(name, words);
    }

    // Get available wordlists
    getWordlists() {
        const lists = {};
        this.wordlists.forEach((words, name) => {
            lists[name] = words.length;
        });
        return lists;
    }
}

// Global instance
window.hashCracker = new HashCracker();
