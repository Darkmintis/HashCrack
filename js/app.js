/**
 * HashCrack Ultimate Platform - Client Application
 * Simplified, powerful hash cracking with no server dependencies
 */

// Configuration
const CONFIG = {
    VERSION: 'v2.0',
    PLATFORM_NAME: 'HashCrack'
};

// Global application state
const AppState = {
    results: [],
    isActive: false,
    customWordlists: new Map()
};

// Utility function for logging
function logMessage(type, message) {
    console.log(`[${type}] ${message}`);
}

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupFileUpload();
});

function initializeApp() {
    // Silent initialization to reduce console noise
    // logMessage('INFO', `${CONFIG.PLATFORM_NAME} ${CONFIG.VERSION} initialized successfully`);
    
    // Load stored results
    loadStoredResults();
    
    // Initialize UI
    updateStats();
    updateResultsDisplay();
    
    // Set up real-time hash detection
    setupHashDetection();
    
    // Check if CryptoJS and hash cracker are loaded
    if (typeof CryptoJS === 'undefined') {
        console.error('[CRITICAL] CryptoJS library not loaded - hash operations unavailable');
        showNotification('CryptoJS library failed to load', 'error');
        return;
    }
    
    if (!window.hashCracker) {
        console.error('[CRITICAL] Hash cracker module not initialized - core functionality unavailable');
        showNotification('Hash cracker failed to initialize', 'error');
        return;
    }
    
    // Silent success to reduce console noise
    // console.log('[SUCCESS] All dependencies loaded successfully');
}

// Add real-time hash detection
function setupHashDetection() {
    const hashInput = document.getElementById('hashInput');
    const hashDetection = document.getElementById('hashDetection');
    
    if (!hashInput || !hashDetection) return;
    
    // Detect hash type on input
    let typingTimer;
    hashInput.addEventListener('input', () => {
        clearTimeout(typingTimer);
        
        // Hide detection if input is short
        if (hashInput.value.length < 16) {
            hashDetection.style.display = 'none';
            return;
        }
        
        // Wait for user to stop typing
        typingTimer = setTimeout(() => {
            const hash = hashInput.value.trim();
            if (hash && window.hashCracker) {
                const detection = window.hashCracker.detectHashType(hash);
                
                if (detection.confidence > 50) {
                    hashDetection.innerHTML = `
                        <i class="fas fa-check-circle"></i> 
                        Detected <strong>${detection.type}</strong> hash 
                        (${detection.confidence}% confidence)
                    `;
                    
                    // Check if this is an advanced algorithm that may be slower
                    if (window.hashCracker.advancedAlgorithms && 
                        window.hashCracker.advancedAlgorithms.includes(detection.type.toLowerCase())) {
                        hashDetection.innerHTML += `
                            <div class="info-text">
                                <i class="fas fa-info-circle"></i>
                                This hash type is computationally intensive and may take longer to crack
                            </div>
                        `;
                    }
                    
                    // Memory-hard algorithms get a special note
                    if (['argon2', 'scrypt', 'yescrypt'].includes(detection.type.toLowerCase())) {
                        hashDetection.innerHTML += `
                            <div class="info-text">
                                <i class="fas fa-microchip"></i>
                                Using optimized implementation for this memory-hard function
                            </div>
                        `;
                    }
                    
                    hashDetection.style.display = 'block';
                } else {
                    hashDetection.innerHTML = `
                        <i class="fas fa-question-circle"></i>
                        Unknown hash format
                    `;
                    hashDetection.style.display = 'block';
                }
            } else {
                hashDetection.style.display = 'none';
            }
        }, 500);
    });
}

// Setup file upload handling for wordlists
function setupFileUpload() {
    const fileUploadArea = document.getElementById('fileUploadArea');
    const fileInput = document.getElementById('wordlistFile');
    const uploadStatus = document.getElementById('uploadStatus');
    const wordlistSelect = document.getElementById('wordlistSelect');
    
    if (!fileUploadArea || !fileInput || !uploadStatus || !wordlistSelect) return;
    
    // Click on upload area to trigger file input
    fileUploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Drag and drop handling
    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.classList.add('dragover');
    });
    
    fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.classList.remove('dragover');
    });
    
    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');
        
        if (e.dataTransfer.files.length) {
            handleWordlistFile(e.dataTransfer.files[0]);
        }
    });
    
    // File input change
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
            handleWordlistFile(fileInput.files[0]);
        }
    });
    
    // Process wordlist file with efficient chunking for large files
    function handleWordlistFile(file) {
        if (!file) return;
        
        // Validate file type and size
        if (!file.name.toLowerCase().endsWith('.txt')) {
            showNotification('Please upload a .txt file', 'error');
            return;
        }
        
        const maxSize = 500 * 1024 * 1024; // 500MB
        if (file.size > maxSize) {
            showNotification(`File too large (max ${maxSize/1024/1024}MB)`, 'error');
            return;
        }
        
        uploadStatus.textContent = 'Processing wordlist...';
        
        // Process file in chunks for better performance with large files
        const customWordlistName = `custom_${Date.now()}`;
        let words = [];
        let loadedChunks = 0;
        let wordCount = 0;
        
        // Use FileReader with chunking for better memory performance
        const chunkSize = 10 * 1024 * 1024; // 10MB chunks
        const totalChunks = Math.ceil(file.size / chunkSize);
        
        function readNextChunk(start) {
            if (start >= file.size) {
                // All chunks read, finalize
                finishWordlistProcessing(customWordlistName, words);
                return;
            }
            
            loadedChunks++;
            uploadStatus.textContent = `Processing ${Math.round((loadedChunks / totalChunks) * 100)}%...`;
            
            const chunk = file.slice(start, start + chunkSize);
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const text = e.target.result;
                // Process chunk
                const chunkWords = text.split(/\r?\n/)
                    .map(word => word.trim())
                    .filter(word => word.length > 0);
                
                // Add unique words to the list
                words = [...words, ...chunkWords];
                wordCount += chunkWords.length;
                
                // Read next chunk
                readNextChunk(start + chunkSize);
            };
            
            reader.onerror = function() {
                uploadStatus.textContent = 'Error reading file';
                showNotification('Failed to read wordlist file', 'error');
            };
            
            reader.readAsText(chunk);
        }
        
        // Start reading chunks
        readNextChunk(0);
    }
    
    function finishWordlistProcessing(customWordlistName, words) {
        // Remove duplicates for efficiency
        const uniqueWords = [...new Set(words)];
        
        // Store in memory and localStorage (if small enough)
        AppState.customWordlists.set(customWordlistName, uniqueWords);
        
        try {
            // Only store in localStorage if small enough (< 5MB)
            if (JSON.stringify(uniqueWords).length < 5 * 1024 * 1024) {
                localStorage.setItem(`wordlist_${customWordlistName}`, JSON.stringify(uniqueWords));
            }
        } catch (e) {
            console.warn('[WARNING] Could not save wordlist to localStorage:', e.message);
        }
        
        // Add to select dropdown
        const option = document.createElement('option');
        option.value = customWordlistName;
        option.textContent = `Custom (${uniqueWords.length.toLocaleString()} words)`;
        option.selected = true;
        wordlistSelect.appendChild(option);
        
        uploadStatus.textContent = `Loaded ${uniqueWords.length.toLocaleString()} unique words`;
        showNotification(`Custom wordlist loaded with ${uniqueWords.length.toLocaleString()} words`, 'success');
        
        // Add to hash cracker
        if (window.hashCracker) {
            window.hashCracker.addWordlist(customWordlistName, uniqueWords);
            console.log(`[INFO] Custom wordlist added with ${uniqueWords.length.toLocaleString()} unique passwords`);
        }
    }
}

// Main hash cracking function
window.startCracking = async function startCracking() {
    if (AppState.isActive) {
        showNotification('Cracking already in progress', 'warning');
        return;
    }
    
    const hashInput = document.getElementById('hashInput').value.trim();
    const wordlistSelect = document.getElementById('wordlistSelect');
    const crackButton = document.getElementById('crackButton');
    
    // Validation
    if (!hashInput) {
        showNotification('Please enter a hash to crack', 'error');
        return;
    }
    
    if (hashInput.length < 16) {
        showNotification('Hash appears too short. Please verify.', 'warning');
        return;
    }
    
    if (!window.hashCracker) {
        showNotification('Hash cracker not available', 'error');
        return;
    }
    
    // Set active state
    AppState.isActive = true;
    crackButton.disabled = true;
    crackButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cracking...';
    
    try {
        // Detect hash type
        const hashType = window.hashCracker.detectHashType(hashInput);
        console.log(`[OPERATION] Starting crack attempt - Detected hash type: ${hashType.type} (${hashType.confidence}% confidence)`);
        
        showNotification(`Starting ${hashType.type} hash crack...`, 'info');
        updateProgress(5, `Detected ${hashType.type} hash`);
        
        // Load wordlists
        let allWords = [];
        const selectedOptions = Array.from(wordlistSelect.selectedOptions);
        
        if (selectedOptions.length === 0) {
            selectedOptions.push(wordlistSelect.options[0]); // Default to first option
        }
        
        updateProgress(10, 'Loading wordlists...');
        
        for (const option of selectedOptions) {
            const wordlistName = option.value;
            console.log(`[INFO] Loading wordlist: ${wordlistName}`);
            
            let words = [];
            
            // Check if it's a custom wordlist
            if (wordlistName.startsWith('custom_')) {
                const stored = localStorage.getItem(`wordlist_${wordlistName}`);
                if (stored) {
                    words = JSON.parse(stored);
                }
            } else {
                // Load built-in wordlist
                words = await loadBuiltInWordlist(wordlistName);
            }
            
            if (words.length > 0) {
                allWords = allWords.concat(words);
                console.log(`[INFO] Loaded ${words.length.toLocaleString()} words from ${wordlistName}`);
            }
        }
        
        if (allWords.length === 0) {
            throw new Error('No wordlists could be loaded or all wordlists are empty');
        }
        
        // Remove duplicates and filter
        const originalCount = allWords.length;
        allWords = [...new Set(allWords)].filter(word => word && word.trim());
        console.log(`[INFO] Total unique passwords prepared: ${allWords.length.toLocaleString()} (removed ${(originalCount - allWords.length).toLocaleString()} duplicates/empty entries)`);
        
        updateProgress(20, `Loaded ${allWords.length.toLocaleString()} unique passwords`);
        
        // Progress callback
        const progressCallback = (progress, status, attempts) => {
            const adjustedProgress = 20 + (progress * 0.75); // Scale to 20-95%
            updateProgress(adjustedProgress, `${status} (${attempts?.toLocaleString() || 0} attempts)`);
        };
        
        // Start the cracking process
        const startTime = performance.now();
        const result = await window.hashCracker.crackHash(hashInput, allWords, {
            onProgress: progressCallback,
            hashType: hashType.type
        });
        
        const endTime = performance.now();
        const timeTaken = Math.round(endTime - startTime);
        
        if (result.found) {
            // Success!
            const successMessage = `🎉 Hash cracked! Password: "${result.password}"`;
            showNotification(successMessage, 'success');
            updateProgress(100, `Found: ${result.password}`);
            
            // Store result
            const newResult = {
                hash: hashInput,
                password: result.password,
                type: hashType.type,
                attempts: result.attempts || 0,
                time: timeTaken,
                timestamp: new Date().toISOString(),
                wordlists: selectedOptions.map(opt => opt.textContent),
                found: true
            };
            
            addResult(newResult);
            
            console.log(`[SUCCESS] Hash cracked successfully in ${timeTaken}ms after ${result.attempts.toLocaleString()} attempts`);
            
        } else {
            // Not found
            const attemptStr = result.attempts?.toLocaleString() || 0;
            const failureMessage = `Password not found in wordlist after trying ${attemptStr} passwords`;
            showNotification(failureMessage, 'warning');
            
            // Ensure progress bar shows 100% when complete, even if not found
            updateProgress(100, failureMessage);
            
            console.log(`[OPERATION] Hash cracking completed - No matching password found after ${result.attempts.toLocaleString()} attempts in ${timeTaken}ms`);
            
            // Store result as "not found" for reference
            const newResult = {
                hash: hashInput,
                password: 'Password not found in wordlist',
                type: hashType.type,
                attempts: result.attempts || 0,
                time: timeTaken,
                timestamp: new Date().toISOString(),
                wordlists: selectedOptions.map(opt => opt.textContent),
                found: false
            };
            
            addResult(newResult);
        }
        
    } catch (error) {
        console.error('[ERROR] Cracking operation failed:', error.message);
        showNotification(`Cracking failed: ${error.message}`, 'error');
        updateProgress(0, 'Error occurred');
    } finally {
        // Reset state
        AppState.isActive = false;
        crackButton.disabled = false;
        crackButton.innerHTML = '<i class="fas fa-rocket"></i> Start Cracking';
        
        // Auto-hide progress after delay
        setTimeout(() => {
            const progressSection = document.getElementById('progressSection');
            if (progressSection) {
                progressSection.classList.remove('active');
            }
        }, 3000);
    }
};

// Load built-in wordlists
async function loadBuiltInWordlist(name) {
    try {
        // Handle combined rockyou case
        if (name === 'rockyou') {
            console.log('[INFO] Loading RockYou wordlist (combined from Part 1 and Part 2)');
            
            // Try to load it directly first
            const response = await fetch(`wordlists/rockyou.txt`);
            if (response.ok) {
                console.log('[INFO] Found single RockYou file, using that directly');
                const text = await response.text();
                return text.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0);
            }
            
            // If not available, try to combine rockyou1 and rockyou2
            const response1 = await fetch(`wordlists/rockyou1.txt`);
            const response2 = await fetch(`wordlists/rockyou2.txt`);
            
            if (response1.ok && response2.ok) {
                console.log('[INFO] Combining RockYou Part 1 and Part 2 wordlists');
                const text1 = await response1.text();
                const text2 = await response2.text();
                
                const words1 = text1.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0);
                    
                const words2 = text2.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0);
                
                console.log(`[INFO] Loaded ${words1.length.toLocaleString()} passwords from Part 1 and ${words2.length.toLocaleString()} from Part 2`);
                
                // Combine and remove duplicates
                const combined = [...new Set([...words1, ...words2])];
                console.log(`[INFO] Combined RockYou wordlist has ${combined.length.toLocaleString()} unique passwords`);
                return combined;
            } else {
                console.warn('[WARNING] Failed to load one or both RockYou wordlist parts');
                // If only one part is available, return that
                if (response1.ok) {
                    console.log('[INFO] Only RockYou Part 1 is available, using that');
                    const text1 = await response1.text();
                    return text1.split('\n')
                        .map(line => line.trim())
                        .filter(line => line.length > 0);
                }
                if (response2.ok) {
                    console.log('[INFO] Only RockYou Part 2 is available, using that');
                    const text2 = await response2.text();
                    return text2.split('\n')
                        .map(line => line.trim())
                        .filter(line => line.length > 0);
                }
                return [];
            }
        }
        
        // Regular wordlist loading
        const response = await fetch(`wordlists/${name}.txt`);
        if (response.ok) {
            const text = await response.text();
            return text.split(/\r?\n/).filter(word => word.trim());
        } else {
            console.warn(`[WARNING] Could not load wordlist ${name}.txt (HTTP Status: ${response.status})`);
            return [];
        }
    } catch (error) {
        console.warn(`[WARNING] Error loading wordlist ${name}: ${error.message}`);
        return [];
    }
}

// Load stored results from localStorage
function loadStoredResults() {
    try {
        const stored = localStorage.getItem('hashCrackResults');
        if (stored) {
            AppState.results = JSON.parse(stored);
        }
    } catch (error) {
        console.warn('[WARNING] Could not load stored results from localStorage:', error.message);
        AppState.results = [];
    }
}

// Add a new result
function addResult(result) {
    AppState.results.unshift(result); // Add to beginning
    
    // Limit to last 100 results
    if (AppState.results.length > 100) {
        AppState.results = AppState.results.slice(0, 100);
    }
    
    // Save to localStorage
    try {
        localStorage.setItem('hashCrackResults', JSON.stringify(AppState.results));
    } catch (error) {
        console.warn('[STORAGE] Could not save results:', error);
    }
    
    // Update displays
    updateStats();
    updateResultsDisplay();
}

// Update statistics display
function updateStats() {
    const totalElement = document.getElementById('totalCracked');
    const successElement = document.getElementById('successRate');
    const avgTimeElement = document.getElementById('avgTime');
    
    if (totalElement) totalElement.textContent = AppState.results.length;
    if (successElement) successElement.textContent = AppState.results.length > 0 ? '100%' : '0%';
    
    if (avgTimeElement && AppState.results.length > 0) {
        const avgTime = AppState.results.reduce((sum, r) => sum + (r.time || 0), 0) / AppState.results.length;
        avgTimeElement.textContent = Math.round(avgTime) + 'ms';
    } else if (avgTimeElement) {
        avgTimeElement.textContent = '0ms';
    }
}

// Update results display
function updateResultsDisplay() {
    const resultsContainer = document.getElementById('resultsContainer');
    const resultsSection = document.getElementById('resultsSection');
    const noResultsMessage = document.getElementById('noResultsMessage');
    const resultCount = document.getElementById('resultCount');
    
    if (!resultsContainer || !resultsSection) return;
    
    // Update the result count badge
    if (resultCount) {
        resultCount.textContent = AppState.results.length;
    }
    
    if (AppState.results.length === 0) {
        // Show the no results message
        if (noResultsMessage) {
            noResultsMessage.style.display = 'flex';
        }
        resultsContainer.innerHTML = '';
        return;
    }
    
    // Hide the no results message
    if (noResultsMessage) {
        noResultsMessage.style.display = 'none';
    }
    
    resultsContainer.innerHTML = AppState.results.map(result => {
        const date = new Date(result.timestamp).toLocaleString();
        
        // Format hash with proper handling for different lengths
        const hashDisplay = result.hash.length > 50 
            ? `${result.hash.substring(0, 50)}...` 
            : result.hash;
        
        // Format time to be more human-readable
        const timeDisplay = result.time < 1000 
            ? `${result.time}ms` 
            : `${(result.time / 1000).toFixed(2)}s`;
            
        // Determine success or failure styling
        const isSuccess = result.found !== false;
        const resultClass = isSuccess ? 'success' : 'failure';
        const passwordClass = isSuccess ? 'found' : 'not-found';
        
        return `
            <div class="result-item ${resultClass}">
                <div class="result-hash" title="${result.hash}">${hashDisplay}</div>
                <div class="result-password ${passwordClass}">${result.password}</div>
                <div class="result-details">
                    <div class="result-detail-item">
                        <i class="fas fa-fingerprint"></i> ${result.type}
                    </div>
                    <div class="result-detail-item">
                        <i class="fas fa-tachometer-alt"></i> ${result.attempts?.toLocaleString() || 0} attempts
                    </div>
                    <div class="result-detail-item">
                        <i class="fas fa-clock"></i> ${timeDisplay}
                    </div>
                    <div class="result-detail-item">
                        <i class="fas fa-calendar-alt"></i> ${date}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Enhanced progress display
function updateProgress(percentage, status) {
    const progressSection = document.getElementById('progressSection');
    const progressBar = document.getElementById('progressBar');
    const progressStatus = document.getElementById('progressStatus');
    
    if (progressSection && percentage > 0) {
        progressSection.classList.add('active');
    }
    
    if (progressBar) {
        progressBar.style.width = Math.min(100, Math.max(0, percentage)) + '%';
    }
    
    if (progressStatus) {
        progressStatus.textContent = status || 'Processing...';
    }
}

// Enhanced notification system
function showNotification(message, type = 'info') {
    // Also log to console for debugging
    console.log(`[NOTIFICATION] ${type.toUpperCase()}: ${message}`);
    
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Add appropriate icon based on notification type
    const iconClass = type === 'success' ? 'fa-check-circle' : 
                     type === 'error' ? 'fa-exclamation-circle' : 
                     type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
    
    notification.innerHTML = `<i class="fas ${iconClass}"></i> ${message}`;
    
    container.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Auto remove after duration based on type
    const duration = type === 'error' ? 8000 : type === 'success' ? 6000 : 5000;
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (container.contains(notification)) {
                container.removeChild(notification);
            }
        }, 300);
    }, duration);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Enter key to start cracking (when hash input is focused)
    if (e.key === 'Enter' && document.activeElement?.id === 'hashInput') {
        e.preventDefault();
        if (!AppState.isActive) {
            startCracking();
        }
    }
    
    // Escape key to stop (if implemented in future)
    if (e.key === 'Escape' && AppState.isActive) {
        console.log('[INPUT] Escape key detected - stopping operation would be implemented here');
    }
});

// Export for debugging
window.HashCrackApp = {
    config: CONFIG,
    state: AppState,
    addResult,
    updateStats,
    updateResultsDisplay,
    loadBuiltInWordlist,
    showNotification
};

// Silent startup to reduce console noise
// console.log('[SYSTEM] HashCrack platform ready for operation');
