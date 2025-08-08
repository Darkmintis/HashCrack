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

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    console.log(`[INIT] ${CONFIG.PLATFORM_NAME} ${CONFIG.VERSION} initialized`);
    
    // Load stored results
    loadStoredResults();
    
    // Initialize UI
    updateStats();
    updateResultsDisplay();
    
    // Check if CryptoJS and hash cracker are loaded
    if (typeof CryptoJS === 'undefined') {
        console.error('[ERROR] CryptoJS not loaded');
        showNotification('CryptoJS library failed to load', 'error');
        return;
    }
    
    if (!window.hashCracker) {
        console.error('[ERROR] Hash cracker not initialized');
        showNotification('Hash cracker failed to initialize', 'error');
        return;
    }
    
    console.log('[SUCCESS] All dependencies loaded successfully');
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
        console.log(`[CRACK] Hash type detected: ${hashType.type} (${hashType.confidence}% confidence)`);
        
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
            console.log(`[WORDLIST] Loading: ${wordlistName}`);
            
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
                console.log(`[WORDLIST] Loaded ${words.length} words from ${wordlistName}`);
            }
        }
        
        if (allWords.length === 0) {
            throw new Error('No wordlists could be loaded');
        }
        
        // Remove duplicates and filter
        allWords = [...new Set(allWords)].filter(word => word && word.trim());
        console.log(`[WORDLIST] Total unique words: ${allWords.length}`);
        
        updateProgress(20, `Loaded ${allWords.length.toLocaleString()} passwords`);
        
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
                wordlists: selectedOptions.map(opt => opt.textContent)
            };
            
            addResult(newResult);
            
            console.log(`[SUCCESS] Hash cracked in ${timeTaken}ms with ${result.attempts} attempts`);
            
        } else {
            // Not found
            showNotification('Hash not found in selected wordlists', 'warning');
            updateProgress(100, `Not found (${result.attempts?.toLocaleString() || 0} attempts)`);
            console.log(`[FAILURE] Hash not found after ${result.attempts} attempts in ${timeTaken}ms`);
        }
        
    } catch (error) {
        console.error('[ERROR] Cracking failed:', error);
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
            // Try to load it directly first
            const response = await fetch(`wordlists/rockyou.txt`);
            if (response.ok) {
                const text = await response.text();
                return text.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0);
            }
            
            // If not available, try to combine rockyou1 and rockyou2
            const response1 = await fetch(`wordlists/rockyou1.txt`);
            const response2 = await fetch(`wordlists/rockyou2.txt`);
            
            if (response1.ok && response2.ok) {
                const text1 = await response1.text();
                const text2 = await response2.text();
                
                const words1 = text1.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0);
                    
                const words2 = text2.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0);
                
                // Combine and remove duplicates
                return [...new Set([...words1, ...words2])];
            }
        }
        
        // Regular wordlist loading
        const response = await fetch(`wordlists/${name}.txt`);
        if (response.ok) {
            const text = await response.text();
            return text.split(/\r?\n/).filter(word => word.trim());
        } else {
            console.warn(`[WORDLIST] Could not load ${name}.txt (Status: ${response.status})`);
            return [];
        }
    } catch (error) {
        console.warn(`[WORDLIST] Error loading ${name}:`, error.message);
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
        console.warn('[STORAGE] Could not load stored results:', error);
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
    
    if (AppState.results.length === 0) {
        resultsSection.classList.remove('has-results');
        return;
    }
    
    resultsSection.classList.add('has-results');
    
    resultsContainer.innerHTML = AppState.results.map(result => {
        const date = new Date(result.timestamp).toLocaleString();
        const shortHash = result.hash.length > 50 ? result.hash.substring(0, 50) + '...' : result.hash;
        
        return `
            <div class="result-item">
                <div class="result-hash">${shortHash}</div>
                <div class="result-password"><strong>${result.password}</strong></div>
                <div class="result-details">
                    ${result.type} • ${result.attempts?.toLocaleString() || 0} attempts • ${result.time}ms • ${date}
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
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
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
        console.log('[INPUT] Escape pressed - stopping would be implemented here');
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

console.log('[READY] HashCrack Ultimate Platform ready for use');
