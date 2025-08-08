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
            // Load available wordlists
            await this.loadWordlistFromURL('10k');
            await this.loadWordlistFromURL('100k');
            
            // Load rockyou parts and combine them
            const rockyou1Loaded = await this.loadWordlistFromURL('rockyou1');
            const rockyou2Loaded = await this.loadWordlistFromURL('rockyou2');
            
            // Combine rockyou parts if both loaded successfully
            if (rockyou1Loaded && rockyou2Loaded) {
                const rockyou1Words = this.wordlists.get('rockyou1') || [];
                const rockyou2Words = this.wordlists.get('rockyou2') || [];
                
                // Combine and deduplicate
                const combinedRockyou = [...new Set([...rockyou1Words, ...rockyou2Words])];
                this.wordlists.set('rockyou', combinedRockyou);
                console.log(`Created combined rockyou wordlist with ${combinedRockyou.length} unique words`);
            }
        } catch (e) {
            console.log('Using built-in wordlists only');
        }
    }

    async loadWordlistFromURL(name) {
        try {
            const response = await fetch(`wordlists/${name}.txt`);
            if (response.ok) {
                const content = await response.text();
                const words = content.split('\n')
                    .map(word => word.trim())
                    .filter(word => word.length > 0);
                
                this.wordlists.set(name, words);
                console.log(`Loaded ${words.length} words from ${name}.txt`);
                return true;
            } else {
                console.log(`Could not load ${name}.txt (Status: ${response.status})`);
            }
        } catch (e) {
            console.log(`Error loading ${name}.txt:`, e.message);
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

    /**
     * Crack a hash using a wordlist array
     * @param {string} hash - The hash to crack
     * @param {Array<string>} wordlist - Array of words to try
     * @param {Object} options - Options including hashType and progress callback
     * @returns {Promise<Object>} - Result object with found status and password if found
     */
    async crackHash(hash, wordlist, options = {}) {
        if (this.isRunning) {
            throw new Error('Already cracking a hash');
        }
        
        // Handle options
        const hashType = options.hashType || this.detectHashType(hash).type;
        const onProgress = options.onProgress || (() => {});
        
        if (!this.supportedAlgorithms.includes(hashType.toLowerCase())) {
            throw new Error(`Unsupported hash type: ${hashType}`);
        }
        
        // Setup for cracking
        this.isRunning = true;
        this.startTime = performance.now();
        
        // Create a promise to track completion
        return new Promise((resolve, reject) => {
            let attempts = 0;
            let found = false;
            let foundPassword = null;
            let workersDone = 0;
            
            // Function to handle worker completion
            const handleWorkerDone = () => {
                workersDone++;
                if (workersDone === this.workers.length && !found) {
                    // Ensure final progress update before resolving
                    onProgress(
                        1.0,  // 100% progress
                        `Checking passwords (100%) (${attempts.toLocaleString()} attempts)`,
                        attempts
                    );
                    
                    this.isRunning = false;
                    resolve({ found: false, attempts });
                }
            };
            
            // Create event listeners for this job
            const messageHandlers = [];
            
            this.workers.forEach((worker, index) => {
                const wordsPerWorker = Math.ceil(wordlist.length / this.workers.length);
                const startIndex = index * wordsPerWorker;
                const endIndex = Math.min(startIndex + wordsPerWorker, wordlist.length);
                
                // Create a message handler for this worker
                const messageHandler = (e) => {
                    const { found: workerFound, password, processed } = e.data;
                    
                    if (workerFound) {
                        found = true;
                        foundPassword = password;
                        
                        // Clean up all workers
                        this.workers.forEach((w, i) => {
                            w.removeEventListener('message', messageHandlers[i]);
                        });
                        
                        this.isRunning = false;
                        resolve({ found: true, password, attempts });
                    } else if (processed) {
                        attempts += processed;
                        
                        // Calculate overall progress (0-1)
                        const progress = attempts / wordlist.length;
                        
                        // Report progress
                        onProgress(
                            progress,
                            `Checking passwords (${Math.floor(progress * 100)}%) (${attempts.toLocaleString()} attempts)`,
                            attempts
                        );
                        
                        // If this batch is done, check if all workers are done
                        if (processed < wordsPerWorker) {
                            handleWorkerDone();
                        }
                    }
                };
                
                // Store message handler for cleanup
                messageHandlers.push(messageHandler);
                worker.addEventListener('message', messageHandler);
                
                // Start the worker
                worker.postMessage({
                    hashType: hashType,
                    targetHash: hash,
                    wordlist: wordlist.slice(startIndex, endIndex),
                    startIndex: 0,
                    endIndex: endIndex - startIndex
                });
            });
            
            // Timeout for very large wordlists
            const timeoutMinutes = 30;
            const timeout = setTimeout(() => {
                if (this.isRunning) {
                    this.isRunning = false;
                    
                    // Clean up all workers
                    this.workers.forEach((worker, i) => {
                        worker.removeEventListener('message', messageHandlers[i]);
                    });
                    
                    resolve({ 
                        found: false, 
                        attempts,
                        timeout: true,
                        message: `Operation timed out after ${timeoutMinutes} minutes`
                    });
                }
            }, timeoutMinutes * 60 * 1000);
        });
    }
}

// Global instance
window.hashCracker = new HashCracker();
