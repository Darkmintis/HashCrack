/**
 * HashCrack Ultimate Platform - Client Application
 * Simplified, powerful hash cracking with no server dependencies
 */

// Configuration
const CONFIG = {
    PLATFORM_NAME: 'HashCrack',
    PROGRESS_THROTTLE: 100, // Update UI every 100ms max
    CHUNK_SIZE: 5 * 1024 * 1024, // 5MB chunks for file processing
    BATCH_SIZE: 1000, // Process passwords in batches
    MAX_CACHE_SIZE: 50 * 1024 * 1024 // 50MB max cache
};

// Global application state
const AppState = {
    results: [],
    isActive: false,
    customWordlists: new Map(),
    darkMode: false,
    lastProgressUpdate: 0,
    wordlistCache: new Map(),
    cacheSize: 0
};

// Utility function for logging
function logMessage(type, message) {
    console.log(`[${type}] ${message}`);
}

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttled progress update for performance
function updateProgressThrottled(progress, status) {
    const now = Date.now();
    if (now - AppState.lastProgressUpdate < CONFIG.PROGRESS_THROTTLE) {
        return; // Skip this update to reduce UI thrashing
    }
    AppState.lastProgressUpdate = now;
    
    // Use requestAnimationFrame for smooth updates
    requestAnimationFrame(() => {
        updateProgress(progress, status);
    });
}

// Memory-efficient wordlist cache management
function addToCache(key, data) {
    const dataSize = JSON.stringify(data).length;
    
    // If adding this would exceed cache size, clear old entries
    if (AppState.cacheSize + dataSize > CONFIG.MAX_CACHE_SIZE) {
        clearOldestCache();
    }
    
    AppState.wordlistCache.set(key, {
        data: data,
        size: dataSize,
        lastAccess: Date.now()
    });
    AppState.cacheSize += dataSize;
}

function getFromCache(key) {
    const cached = AppState.wordlistCache.get(key);
    if (cached) {
        cached.lastAccess = Date.now();
        return cached.data;
    }
    return null;
}

function clearOldestCache() {
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, value] of AppState.wordlistCache.entries()) {
        if (value.lastAccess < oldestTime) {
            oldestTime = value.lastAccess;
            oldestKey = key;
        }
    }
    
    if (oldestKey) {
        const removed = AppState.wordlistCache.get(oldestKey);
        AppState.cacheSize -= removed.size;
        AppState.wordlistCache.delete(oldestKey);
        console.log(`[CACHE] Removed ${oldestKey} to free memory`);
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupFileUpload();
    setupEventListeners();
    loadSettings();
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
    
    if (!globalThis.hashCracker) {
        console.error('[CRITICAL] Hash cracker module not initialized - core functionality unavailable');
        showNotification('Hash cracker failed to initialize', 'error');
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
            if (hash && globalThis.hashCracker) {
                const detection = globalThis.hashCracker.detectHashType(hash);
                
                if (detection.confidence > 50) {
                    hashDetection.innerHTML = `
                        <i class="fas fa-check-circle"></i> 
                        Detected <strong>${detection.type}</strong> hash 
                        (${detection.confidence}% confidence)
                    `;
                    
                    // Check if this is an advanced algorithm that may be slower
                    if (globalThis.hashCracker.advancedAlgorithms?.includes(detection.type.toLowerCase())) {
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
        
        // Use streaming processing for better memory efficiency
        const customWordlistName = `custom_${Date.now()}`;
        processLargeFileStreaming(file, customWordlistName);
    }
    
    // Streaming file processor for large wordlists
    async function processLargeFileStreaming(file, customWordlistName) {
        try {
            const text = await file.text();
            
            // Process in batches to avoid blocking UI
            const lines = text.split(/\r?\n/);
            const totalLines = lines.length;
            let processedWords = new Set(); // Use Set for automatic deduplication
            let processed = 0;
            
            // Process in chunks
            const processChunk = () => {
                const chunkEnd = Math.min(processed + CONFIG.BATCH_SIZE, totalLines);
                
                for (let i = processed; i < chunkEnd; i++) {
                    const word = lines[i].trim();
                    if (word.length > 0) {
                        processedWords.add(word);
                    }
                }
                
                processed = chunkEnd;
                const progress = Math.round((processed / totalLines) * 100);
                uploadStatus.textContent = `Processing ${progress}%... (${processedWords.size.toLocaleString()} unique words)`;
                
                if (processed < totalLines) {
                    // Schedule next chunk
                    requestAnimationFrame(processChunk);
                } else {
                    // Finished processing
                    finishWordlistProcessing(customWordlistName, Array.from(processedWords));
                }
            };
            
            // Start processing
            processChunk();
            
        } catch (error) {
            console.error('[ERROR] Failed to process wordlist:', error);
            uploadStatus.textContent = 'Error processing file';
            showNotification('Failed to process wordlist file', 'error');
        }
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
        if (globalThis.hashCracker) {
            globalThis.hashCracker.addWordlist(customWordlistName, uniqueWords);
            console.log(`[INFO] Custom wordlist added with ${uniqueWords.length.toLocaleString()} unique passwords`);
        }
    }
}

// Helper function to validate hash input
function validateHashInput(hashInput, crackButton) {
    if (!hashInput) {
        showNotification('Please enter a hash to crack', 'error');
        return false;
    }
    
    if (hashInput.length < 16) {
        showNotification('Hash appears too short. Please verify.', 'warning');
        return false;
    }
    
    if (!globalThis.hashCracker) {
        showNotification('Hash cracker not available', 'error');
        return false;
    }
    
    return true;
}

// Helper function to load selected wordlists
async function loadSelectedWordlists(wordlistSelect) {
    let allWords = [];
    const selectedOptions = Array.from(wordlistSelect.selectedOptions);
    
    if (selectedOptions.length === 0) {
        selectedOptions.push(wordlistSelect.options[0]);
    }
    
    for (const option of selectedOptions) {
        const wordlistName = option.value;
        console.log(`[INFO] Loading wordlist: ${wordlistName}`);
        
        let words = [];
        
        if (wordlistName.startsWith('custom_')) {
            const stored = localStorage.getItem(`wordlist_${wordlistName}`);
            if (stored) {
                words = JSON.parse(stored);
            }
        } else {
            words = await loadBuiltInWordlist(wordlistName);
        }
        
        if (words.length > 0) {
            allWords = allWords.concat(words);
            console.log(`[INFO] Loaded ${words.length.toLocaleString()} words from ${wordlistName}`);
        }
    }
    
    return { allWords, selectedOptions };
}

// Helper function to prepare wordlist
function prepareWordlist(allWords) {
    const originalCount = allWords.length;
    const uniqueWords = [...new Set(allWords)].filter(word => word?.trim());
    console.log(`[INFO] Total unique passwords prepared: ${uniqueWords.length.toLocaleString()} (removed ${(originalCount - uniqueWords.length).toLocaleString()} duplicates/empty entries)`);
    return uniqueWords;
}

// Helper function to handle successful crack
function handleCrackSuccess(result, hashInput, hashType, timeTaken, selectedOptions) {
    const successMessage = `Hash cracked! Password: "${result.password}"`;
    showNotification(successMessage, 'success');
    updateProgress(100, `Found: ${result.password}`);
    
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
}

// Helper function to handle failed crack
function handleCrackFailure(result, hashInput, hashType, timeTaken, selectedOptions) {
    const attemptStr = result.attempts?.toLocaleString() || 0;
    const failureMessage = `Password not found in wordlist after trying ${attemptStr} passwords`;
    showNotification(failureMessage, 'warning');
    updateProgress(100, failureMessage);
    
    console.log(`[OPERATION] Hash cracking completed - No matching password found after ${result.attempts.toLocaleString()} attempts in ${timeTaken}ms`);
    
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

// Main hash cracking function
globalThis.startCracking = async function startCracking() {
    if (AppState.isActive) {
        showNotification('Cracking already in progress', 'warning');
        return;
    }
    
    const hashInput = document.getElementById('hashInput').value.trim();
    const wordlistSelect = document.getElementById('wordlistSelect');
    const crackButton = document.getElementById('crackButton');
    
    // Validation
    if (!validateHashInput(hashInput, crackButton)) {
        return;
    }
    
    // Set active state
    AppState.isActive = true;
    crackButton.disabled = true;
    crackButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cracking...';
    updateStatusBar();
    
    try {
        // Detect hash type
        const hashType = globalThis.hashCracker.detectHashType(hashInput);
        console.log(`[OPERATION] Starting crack attempt - Detected hash type: ${hashType.type} (${hashType.confidence}% confidence)`);
        
        showNotification(`Starting ${hashType.type} hash crack...`, 'info');
        updateProgress(5, `Detected ${hashType.type} hash`);
        
        // Load wordlists
        updateProgress(10, 'Loading wordlists...');
        const { allWords, selectedOptions } = await loadSelectedWordlists(wordlistSelect);
        
        if (allWords.length === 0) {
            throw new Error('No wordlists could be loaded or all wordlists are empty');
        }
        
        // Prepare wordlist
        const uniqueWords = prepareWordlist(allWords);
        updateProgress(20, `Loaded ${uniqueWords.length.toLocaleString()} unique passwords`);
        
        // Progress callback with throttling
        const progressCallback = (progress, status, attempts) => {
            const adjustedProgress = 20 + (progress * 0.75);
            updateProgressThrottled(adjustedProgress, `${status} (${attempts?.toLocaleString() || 0} attempts)`);
        };
        
        // Start the cracking process
        const startTime = performance.now();
        const result = await globalThis.hashCracker.crackHash(hashInput, uniqueWords, {
            onProgress: progressCallback,
            hashType: hashType.type
        });
        
        const endTime = performance.now();
        const timeTaken = Math.round(endTime - startTime);
        
        if (result.found) {
            handleCrackSuccess(result, hashInput, hashType, timeTaken, selectedOptions);
        } else {
            handleCrackFailure(result, hashInput, hashType, timeTaken, selectedOptions);
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
        updateStatusBar(); // Update status to show we're ready
        
        // Auto-hide progress after delay
        setTimeout(() => {
            const progressSection = document.getElementById('progressSection');
            if (progressSection) {
                progressSection.classList.remove('active');
            }
        }, 3000);
    }
};

// Helper function to process wordlist text into array
function processWordlistText(text) {
    return text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
}

// Helper function to load single RockYou file
async function loadSingleRockyouFile() {
    const response = await fetch(`wordlists/rockyou.txt`);
    if (response.ok) {
        console.log('[INFO] Found single RockYou file, using that directly');
        const text = await response.text();
        return processWordlistText(text);
    }
    return null;
}

// Helper function to load and combine RockYou parts
async function loadCombinedRockyou() {
    const response1 = await fetch(`wordlists/rockyou1.txt`);
    const response2 = await fetch(`wordlists/rockyou2.txt`);
    
    if (response1.ok && response2.ok) {
        console.log('[INFO] Combining RockYou Part 1 and Part 2 wordlists');
        const text1 = await response1.text();
        const text2 = await response2.text();
        
        const words1 = processWordlistText(text1);
        const words2 = processWordlistText(text2);
        
        console.log(`[INFO] Loaded ${words1.length.toLocaleString()} passwords from Part 1 and ${words2.length.toLocaleString()} from Part 2`);
        
        const combined = [...new Set([...words1, ...words2])];
        console.log(`[INFO] Combined RockYou wordlist has ${combined.length.toLocaleString()} unique passwords`);
        return combined;
    }
    
    // Try individual parts as fallback
    if (response1.ok) {
        console.log('[INFO] Only RockYou Part 1 is available, using that');
        const text1 = await response1.text();
        return processWordlistText(text1);
    }
    
    if (response2.ok) {
        console.log('[INFO] Only RockYou Part 2 is available, using that');
        const text2 = await response2.text();
        return processWordlistText(text2);
    }
    
    console.warn('[WARNING] Failed to load any RockYou wordlist parts');
    return [];
}

// Helper function to load RockYou wordlist
async function loadRockyouWordlist(name) {
    console.log('[INFO] Loading RockYou wordlist (combined from Part 1 and Part 2)');
    
    // Try single file first
    const singleFile = await loadSingleRockyouFile();
    if (singleFile) {
        addToCache(name, singleFile);
        return singleFile;
    }
    
    // Try combined parts
    const combined = await loadCombinedRockyou();
    if (combined.length > 0) {
        addToCache(name, combined);
    }
    return combined;
}

// Load built-in wordlists with caching
async function loadBuiltInWordlist(name) {
    try {
        // Check cache first
        const cached = getFromCache(name);
        if (cached) {
            console.log(`[CACHE] Using cached wordlist: ${name}`);
            return cached;
        }
        
        console.log(`[INFO] Loading wordlist: ${name}`);
        
        // Handle combined rockyou case
        if (name === 'rockyou') {
            return await loadRockyouWordlist(name);
        }
        
        // Regular wordlist loading
        const response = await fetch(`wordlists/${name}.txt`);
        if (response.ok) {
            const text = await response.text();
            const words = text.split(/\r?\n/).filter(word => word.trim());
            
            console.log(`[INFO] Loaded ${words.length.toLocaleString()} passwords from ${name}`);
            addToCache(name, words);
            return words;
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
    
    if (!resultsContainer || !resultsSection) return;
    
    const noResultsMessage = document.getElementById('noResultsMessage');
    const resultCount = document.getElementById('resultCount');
    
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
    
    // Use document fragment for batch DOM updates (performance optimization)
    const fragment = document.createDocumentFragment();
    
    // Only display last 50 results to prevent DOM bloat
    const displayResults = AppState.results.slice(0, 50);
    
    displayResults.forEach(result => {
        // Format hash with proper handling for different lengths
        const hashDisplay = result.hash.length > 40 
            ? `${result.hash.substring(0, 40)}...` 
            : result.hash;
        
        // Format time to be more human-readable
        const timeDisplay = result.time < 1000 
            ? `${result.time}ms` 
            : `${(result.time / 1000).toFixed(2)}s`;
            
        // Determine success or failure styling
        const isSuccess = result.found !== false;
        const passwordClass = isSuccess ? 'found' : 'not-found';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="history-hash" title="${escapeHtml(result.hash)}">${escapeHtml(hashDisplay)}</td>
            <td class="${passwordClass}">${escapeHtml(result.password)}</td>
            <td>${escapeHtml(result.type)}</td>
            <td>${timeDisplay}</td>
            <td>${result.attempts?.toLocaleString() || 0}</td>
        `;
        fragment.appendChild(row);
    });
    
    // Clear and update in one operation
    resultsContainer.innerHTML = '';
    resultsContainer.appendChild(fragment);
    
    // Show message if there are more results
    if (AppState.results.length > 50) {
        const moreRow = document.createElement('tr');
        moreRow.innerHTML = `
            <td colspan="5" style="text-align: center; color: var(--gray-500); font-style: italic; padding: var(--space-md);">
                Showing latest 50 results. Total: ${AppState.results.length}
            </td>
        `;
        resultsContainer.appendChild(moreRow);
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
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
    const getIconClass = (notificationType) => {
        if (notificationType === 'success') return 'fa-check-circle';
        if (notificationType === 'error') return 'fa-exclamation-circle';
        if (notificationType === 'warning') return 'fa-exclamation-triangle';
        return 'fa-info-circle';
    };
    
    const iconClass = getIconClass(type);
    
    notification.innerHTML = `<i class="fas ${iconClass}"></i> ${message}`;
    
    container.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Auto remove after duration based on type
    const getDuration = (notificationType) => {
        if (notificationType === 'error') return 8000;
        if (notificationType === 'success') return 6000;
        return 5000;
    };
    
    const duration = getDuration(type);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (container.contains(notification)) {
                notification.remove();
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

// Setup event listeners
function setupEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleDarkMode);
    }
    
    // Stats button
    const statsBtn = document.getElementById('statsBtn');
    if (statsBtn) {
        statsBtn.addEventListener('click', () => {
            showStatsModal();
        });
    }
    
    // About button
    const aboutBtn = document.getElementById('aboutBtn');
    if (aboutBtn) {
        aboutBtn.addEventListener('click', () => {
            showAboutModal();
        });
    }
    
    // Results toggle
    const toggleResultsBtn = document.getElementById('toggleResults');
    const resultsContent = document.getElementById('resultsContent');
    if (toggleResultsBtn && resultsContent) {
        // Initially set the toggle icon to up since content is visible by default
        toggleResultsBtn.querySelector('i').classList.remove('fa-chevron-down');
        toggleResultsBtn.querySelector('i').classList.add('fa-chevron-up');
        toggleResultsBtn.classList.add('active');
        
        toggleResultsBtn.addEventListener('click', () => {
            resultsContent.classList.toggle('hidden');
            toggleResultsBtn.classList.toggle('active');
            toggleResultsBtn.querySelector('i').classList.toggle('fa-chevron-up');
            toggleResultsBtn.querySelector('i').classList.toggle('fa-chevron-down');
        });
    }
    
    // Wordlist selection change with debouncing
    const wordlistSelect = document.getElementById('wordlistSelect');
    if (wordlistSelect) {
        const debouncedUpdate = debounce(() => {
            updateStatusBar();
        }, 200);
        
        wordlistSelect.addEventListener('change', debouncedUpdate);
    }
    
    // Initialize status bar
    updateStatusBar();
}

// Toggle dark mode
function toggleDarkMode() {
    AppState.darkMode = !AppState.darkMode;
    document.body.classList.toggle('dark-mode', AppState.darkMode);
    
    // Update icon
    const themeIcon = document.querySelector('#themeToggle i');
    if (themeIcon) {
        themeIcon.className = AppState.darkMode ? 'fas fa-sun' : 'fas fa-moon';
    }
    
    // Save preference
    saveSettings();
}

// Save settings to localStorage
function saveSettings() {
    try {
        localStorage.setItem(
            'hashCrackSettings',
            JSON.stringify({
                darkMode: AppState.darkMode
            })
        );
    } catch (e) {
        console.error('Failed to save settings:', e);
    }
}

// Load settings from localStorage
function loadSettings() {
    try {
        const storedSettings = localStorage.getItem('hashCrackSettings');
        if (storedSettings) {
            const settings = JSON.parse(storedSettings);
            
            // Apply dark mode if needed
            if (settings.darkMode) {
                AppState.darkMode = true;
                document.body.classList.add('dark-mode');
                
                // Update icon
                const themeIcon = document.querySelector('#themeToggle i');
                if (themeIcon) {
                    themeIcon.className = 'fas fa-sun';
                }
                
                // Save setting
                saveSettings();
            }
        } else if (globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches) {
            // Check for system preference
            AppState.darkMode = true;
            document.body.classList.add('dark-mode');
            
            // Update icon
            const themeIcon = document.querySelector('#themeToggle i');
            if (themeIcon) {
                themeIcon.className = 'fas fa-sun';
            }
            
            // Save setting
            saveSettings();
        }
    } catch (e) {
        console.error('Failed to load settings:', e);
    }
}

// Update status bar with current system info
function updateStatusBar() {
    // Update worker count
    const workerCount = document.getElementById('workerCount');
    if (workerCount && globalThis.hashCracker) {
        const numWorkers = globalThis.hashCracker.workers?.length || navigator.hardwareConcurrency || 4;
        workerCount.textContent = `${numWorkers} Workers Active`;
    }
    
    // Update wordlist status
    const wordlistStatus = document.getElementById('wordlistStatus');
    if (wordlistStatus) {
        const select = document.getElementById('wordlistSelect');
        const selectedCount = select ? select.selectedOptions.length : 0;
        const pluralSuffix = selectedCount === 1 ? '' : 's';
        wordlistStatus.textContent = `${selectedCount} Wordlist${pluralSuffix} Selected`;
    }
    
    // Update system status based on readiness
    const systemStatus = document.getElementById('systemStatus');
    const statusIndicator = document.querySelector('.status-indicator');
    if (systemStatus && statusIndicator) {
        if (AppState.isActive) {
            systemStatus.textContent = 'Cracking in Progress';
            statusIndicator.classList.remove('status-ready', 'status-error');
            statusIndicator.classList.add('status-working');
        } else if (typeof CryptoJS !== 'undefined' && globalThis.hashCracker) {
            systemStatus.textContent = 'System Ready';
            statusIndicator.classList.remove('status-working', 'status-error');
            statusIndicator.classList.add('status-ready');
        } else {
            systemStatus.textContent = 'System Error';
            statusIndicator.classList.remove('status-ready', 'status-working');
            statusIndicator.classList.add('status-error');
        }
    }
}

// Show stats modal
function showStatsModal() {
    // Remove any existing modals first
    const existingModals = document.querySelectorAll('.modal-overlay');
    existingModals.forEach(modal => modal.remove());
    
    const totalHashes = AppState.results.length;
    const successfulCracks = AppState.results.filter(r => r.status === 'success').length;
    const failedCracks = totalHashes - successfulCracks;
    const successRate = totalHashes > 0 ? ((successfulCracks / totalHashes) * 100).toFixed(1) : 0;
    
    const totalTime = AppState.results.reduce((sum, r) => sum + (r.time || 0), 0);
    const avgTime = totalHashes > 0 ? (totalTime / totalHashes).toFixed(0) : 0;
    
    const modalContent = `
        <div class="modal-overlay" style="background: rgba(0,0,0,0.8); position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999; display: flex; align-items: center; justify-content: center;" onclick="this.remove()">
            <div style="background: white; padding: 2rem; border-radius: 1rem; max-width: 500px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3);" onclick="event.stopPropagation()">
                <h2 style="margin: 0 0 1.5rem 0; color: #0ea5e9; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-chart-line"></i> Detailed Statistics
                </h2>
                <div style="display: grid; gap: 1rem;">
                    <div style="padding: 1rem; background: #f8fafc; border-radius: 0.5rem; border-left: 4px solid #0ea5e9;">
                        <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">Total Hashes Processed</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: #0ea5e9;">${totalHashes}</div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div style="padding: 1rem; background: #f0fdf4; border-radius: 0.5rem; border-left: 4px solid #10b981;">
                            <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">Successful</div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: #10b981;">${successfulCracks}</div>
                        </div>
                        <div style="padding: 1rem; background: #fef2f2; border-radius: 0.5rem; border-left: 4px solid #ef4444;">
                            <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">Failed</div>
                            <div style="font-size: 1.5rem; font-weight: 700; color: #ef4444;">${failedCracks}</div>
                        </div>
                    </div>
                    <div style="padding: 1rem; background: #fefce8; border-radius: 0.5rem; border-left: 4px solid #f59e0b;">
                        <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">Success Rate</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: #f59e0b;">${successRate}%</div>
                    </div>
                    <div style="padding: 1rem; background: #f5f3ff; border-radius: 0.5rem; border-left: 4px solid #8b5cf6;">
                        <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">Average Time</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: #8b5cf6;">${avgTime}ms</div>
                    </div>
                </div>
                <button onclick="this.closest('div[onclick]').remove()" style="margin-top: 1.5rem; width: 100%; padding: 0.75rem; background: #0ea5e9; color: white; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#0284c7'" onmouseout="this.style.background='#0ea5e9'">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalContent);
}

// Show about modal
function showAboutModal() {
    // Remove any existing modals first
    const existingModals = document.querySelectorAll('.modal-overlay');
    existingModals.forEach(modal => modal.remove());
    
    const modalContent = `
        <div class="modal-overlay" style="background: rgba(0,0,0,0.8); position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999; display: flex; align-items: center; justify-content: center;" onclick="this.remove()">
            <div style="background: white; padding: 2rem; border-radius: 1rem; max-width: 600px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-height: 80vh; overflow-y: auto;" onclick="event.stopPropagation()">
                <h2 style="margin: 0 0 1rem 0; color: #0ea5e9; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-shield-halved"></i> About HashCrack
                </h2>
                <div style="color: #475569; line-height: 1.6;">
                    <p style="margin: 0 0 1rem 0;">
                        HashCrack is a professional client-side hash cracking tool designed specifically for CTF players and security professionals. 
                        All processing happens directly in your browser with no server dependencies.
                    </p>
                    
                    <h3 style="color: #0ea5e9; font-size: 1.1rem; margin: 1.5rem 0 0.75rem 0;">
                        <i class="fas fa-star"></i> Key Features
                    </h3>
                    <ul style="margin: 0 0 1rem 0; padding-left: 1.5rem;">
                        <li>Support for 20+ hash types including MD5, SHA family, bcrypt, Argon2</li>
                        <li>Multi-threaded processing using Web Workers</li>
                        <li>Built-in wordlists with custom upload support</li>
                        <li>Automatic hash type detection</li>
                        <li>100% client-side - no data leaves your browser</li>
                        <li>Real-time progress tracking</li>
                        <li>Results history and statistics</li>
                    </ul>
                    
                    <h3 style="color: #0ea5e9; font-size: 1.1rem; margin: 1.5rem 0 0.75rem 0;">
                        <i class="fas fa-code"></i> Technology Stack
                    </h3>
                    <ul style="margin: 0 0 1rem 0; padding-left: 1.5rem;">
                        <li><strong>Frontend:</strong> Vanilla JavaScript (ES6+)</li>
                        <li><strong>Crypto:</strong> CryptoJS Library</li>
                        <li><strong>Processing:</strong> Web Workers API</li>
                        <li><strong>Storage:</strong> LocalStorage API</li>
                    </ul>
                    
                    <div style="padding: 1rem; background: #f8fafc; border-radius: 0.5rem; border-left: 4px solid #f59e0b; margin-top: 1.5rem;">
                        <strong style="color: #f59e0b;">Disclaimer:</strong>
                        <p style="margin: 0.5rem 0 0 0; font-size: 0.875rem;">
                            This tool is for educational purposes and authorized security testing only. 
                            Always ensure you have proper authorization before testing any systems.
                        </p>
                    </div>
                </div>
                <button onclick="this.closest('div[onclick]').remove()" style="margin-top: 1.5rem; width: 100%; padding: 0.75rem; background: #0ea5e9; color: white; border: none; border-radius: 0.5rem; font-weight: 600; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#0284c7'" onmouseout="this.style.background='#0ea5e9'">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalContent);
}

// Export for debugging
globalThis.HashCrackApp = {
    config: CONFIG,
    state: AppState,
    addResult,
    updateStats,
    updateResultsDisplay,
    loadBuiltInWordlist,
    showNotification,
    toggleDarkMode
};
