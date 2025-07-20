/**
 * HashCrack Frontend Application
 * Main JavaScript for team collaboration and hash cracking
 */

// Configuration for client-side only operation
const CONFIG = {
    VERSION: 'v0.5-dev',
    OFFLINE_MODE: true // Pure client-side, no backend
};

// Global state
const AppState = {
    currentUser: null,
    activeJobs: new Map(),
    teamWordlists: [],
    results: []
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    checkUrlParameters();
});

function initializeApp() {
    console.log('[APP] Initializing HashCrack v' + CONFIG.VERSION);
    
    // Initialize demo animation
    startDemoAnimation();
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('href').substring(1);
            showSection(target);
        });
    });
    
    // Mode selector buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Hash input auto-detection
    const hashInput = document.getElementById('hashInput');
    if (hashInput) {
        hashInput.addEventListener('input', function() {
            const hash = this.value.trim();
            if (hash.length > 16) {
                identifyHash(hash);
            }
        });
    }
    
    // File upload
    const fileInput = document.getElementById('wordlistFile');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }
}

// Navigation Functions
function showSection(sectionName) {
    // Hide all sections
    const sections = ['home', 'crack', 'wordlists', 'results', 'team', 'api', 'nodes'];
    sections.forEach(section => {
        const element = document.getElementById(section);
        if (element) {
            element.style.display = 'none';
        }
    });
    
    // Show requested section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.style.display = 'block';
    }
    
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`[href="#${sectionName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Load section-specific data
    if (sectionName === 'team') {
        // Initialize team section
        if (AppState.currentTeam) {
            showTeamDashboard(AppState.currentTeam);
        }
    } else if (sectionName === 'wordlists') {
        loadPopularWordlists();
    } else if (sectionName === 'results') {
        loadResults();
    }
}

function showCrackSection() {
    showSection('crack');
}

function showDemo() {
    // Demo functionality - animate the hero visualization
    const demoHash = document.getElementById('demoHash');
    const demoResult = document.getElementById('demoResult');
    const demoProgress = document.getElementById('demoProgress');
    const progressPercent = document.getElementById('progressPercent');
    
    if (demoHash && demoResult && demoProgress) {
        // Reset
        demoResult.style.opacity = '0';
        demoProgress.style.strokeDasharray = '0 314';
        progressPercent.textContent = '0%';
        
        // Animate progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += 2;
            const circumference = 314;
            const offset = circumference - (progress / 100) * circumference;
            demoProgress.style.strokeDasharray = `${circumference - offset} ${circumference}`;
            progressPercent.textContent = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    demoResult.style.opacity = '1';
                    showNotification('Demo completed! Hash cracked in 2.3 seconds.', 'success');
                }, 300);
            }
        }, 50);
    }
}

// Initialize navigation
document.addEventListener('DOMContentLoaded', function() {
    // Setup navigation click handlers
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionName = this.getAttribute('href').substring(1);
            showSection(sectionName);
        });
    });
    
    // Show home section by default
    showSection('home');
});

// Enhanced API call function with better error handling
async function apiCall(endpoint, method = 'GET', data = null) {
    const url = CONFIG.API_BASE_URL + (endpoint.startsWith('/') ? endpoint : '/' + endpoint);
    
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
        
    } catch (error) {
        console.error('API call failed:', error);
        
        // If backend is unavailable, show helpful message
        if (error.message.includes('fetch')) {
            showNotification('Backend unavailable. Some features may be limited.', 'warning');
        }
        
        throw error;
    }
}

// Enhanced notification system
function showNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icon = {
        'success': 'fas fa-check-circle',
        'error': 'fas fa-exclamation-circle',
        'warning': 'fas fa-exclamation-triangle',
        'info': 'fas fa-info-circle'
    }[type] || 'fas fa-info-circle';
    
    notification.innerHTML = `
        <i class="${icon}"></i>
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to page
    let container = document.getElementById('notificationContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notificationContainer';
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
    
    container.appendChild(notification);
    
    // Auto-remove after duration
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, duration);
}

// Enhanced hash identification
async function identifyHash(hash) {
    if (!hash || hash.length < 8) return;
    
    const hashInfo = document.getElementById('hashInfo');
    
    if (!hashInfo) return;
    
    try {
        // Local hash type detection
        const localType = detectHashTypeLocal(hash);
        
        if (localType) {
            hashInfo.style.display = 'block';
            document.getElementById('detectedType').textContent = localType.type;
            document.getElementById('confidence').textContent = `${localType.confidence}% confidence`;
        }
        
        // Try backend identification for more detailed analysis
        const response = await apiCall('/identify_hash', 'POST', { hash: hash });
        
        if (response.success && response.identifications.length > 0) {
            const bestMatch = response.identifications[0];
            hashInfo.style.display = 'block';
            document.getElementById('detectedType').textContent = bestMatch.hash_type;
            document.getElementById('confidence').textContent = `${Math.round(bestMatch.confidence * 100)}% confidence`;
            
            // Check for yescrypt
            if (response.is_yescrypt) {
                document.getElementById('detectedType').textContent = 'yescrypt (Modern Linux)';
                document.getElementById('confidence').textContent = '99% confidence';
            }
        }
        
    } catch (error) {
        // Use local detection only
        console.log('Using local hash detection');
    }
}

function detectHashTypeLocal(hash) {
    const cleanHash = hash.trim();
    
    // yescrypt detection
    if (cleanHash.startsWith('$y$') || cleanHash.startsWith('$7$')) {
        return { type: 'yescrypt', confidence: 95 };
    }
    
    // Remove common prefixes
    const hashOnly = cleanHash.replace(/^(\$\w+\$.*?\$|\{[^}]+\}|0x)/i, '');
    
    switch (hashOnly.length) {
        case 32:
            return /^[a-f0-9]+$/i.test(hashOnly) ? { type: 'MD5', confidence: 90 } : null;
        case 40:
            return /^[a-f0-9]+$/i.test(hashOnly) ? { type: 'SHA1', confidence: 90 } : null;
        case 56:
            return /^[a-f0-9]+$/i.test(hashOnly) ? { type: 'SHA224', confidence: 85 } : null;
        case 64:
            return /^[a-f0-9]+$/i.test(hashOnly) ? { type: 'SHA256', confidence: 90 } : null;
        case 96:
            return /^[a-f0-9]+$/i.test(hashOnly) ? { type: 'SHA384', confidence: 85 } : null;
        case 128:
            return /^[a-f0-9]+$/i.test(hashOnly) ? { type: 'SHA512', confidence: 90 } : null;
        default:
            if (cleanHash.includes(':')) {
                return { type: 'NTLM (with salt)', confidence: 80 };
            }
            return { type: 'Unknown', confidence: 0 };
    }
}

// Enhanced Team Management Functions
async function createTeam() {
    const teamName = document.getElementById('createTeamName').value.trim();
    const userName = document.getElementById('createUserName').value.trim();
    const teamDesc = document.getElementById('createTeamDesc').value.trim();
    
    if (!teamName || !userName) {
        showNotification('Please enter both team name and your name', 'error');
        return;
    }
    
    try {
        const response = await apiCall('/create_team', 'POST', {
            team_name: teamName,
            user_name: userName,
            description: teamDesc
        });
        
        if (response.success) {
            AppState.currentTeam = response;
            AppState.currentUser = { user_id: response.user_id, name: userName };
            showTeamDashboard(response);
            showNotification(`Team "${teamName}" created successfully!`, 'success');
            
            // Join WebSocket room
            if (window.WebSocketManager) {
                window.WebSocketManager.joinTeamRoom(response.team_id, response.user_id);
            }
        } else {
            showNotification(response.error || 'Failed to create team', 'error');
        }
    } catch (error) {
        showNotification('Error creating team: ' + error.message, 'error');
    }
}

async function joinTeam() {
    const teamInput = document.getElementById('joinTeamId').value.trim();
    const userName = document.getElementById('joinUserName').value.trim();
    
    if (!teamInput || !userName) {
        showNotification('Please enter team ID and your name', 'error');
        return;
    }
    
    // Extract team ID from URL if full URL provided
    let teamId = teamInput;
    if (teamInput.includes('team=')) {
        const urlParams = new URLSearchParams(teamInput.split('?')[1]);
        teamId = urlParams.get('team');
    }
    
    try {
        const response = await apiCall('/join_team', 'POST', {
            team_id: teamId,
            user_name: userName
        });
        
        if (response.success) {
            AppState.currentTeam = response;
            AppState.currentUser = { user_id: response.user_id, name: userName };
            showTeamDashboard(response);
            showNotification(`Joined team "${response.team_name}" successfully!`, 'success');
            
            // Join WebSocket room
            if (window.WebSocketManager) {
                window.WebSocketManager.joinTeamRoom(response.team_id, response.user_id);
            }
        } else {
            showNotification(response.error || 'Failed to join team', 'error');
        }
    } catch (error) {
        showNotification('Error joining team: ' + error.message, 'error');
    }
}

function showTeamDashboard(teamData) {
    // Hide team setup, show dashboard
    document.getElementById('teamSetup').style.display = 'none';
    document.getElementById('teamDashboard').style.display = 'block';
    
    // Update team info
    document.getElementById('teamName').textContent = teamData.team_name;
    document.getElementById('teamId').textContent = teamData.team_id;
    
    // Update stats
    updateTeamStats(teamData);
    
    // Load team members
    loadTeamMembers();
    
    // Load team wordlists
    loadTeamWordlists();
    
    // Load active jobs
    loadActiveJobs();
}

function updateTeamStats(data) {
    document.getElementById('memberCount').textContent = data.member_count || 0;
    document.getElementById('activeJobsCount').textContent = data.active_jobs || 0;
    document.getElementById('crackedCount').textContent = data.cracked_count || 0;
    document.getElementById('teamSpeed').textContent = (data.team_speed || 0) + ' H/s';
}

async function loadTeamMembers() {
    if (!AppState.currentTeam) return;
    
    try {
        const response = await apiCall(`/team_members/${AppState.currentTeam.team_id}?user_id=${AppState.currentUser.user_id}`);
        if (response.success) {
            displayTeamMembers(response.members);
        }
    } catch (error) {
        console.error('Failed to load team members:', error);
    }
}

function displayTeamMembers(members) {
    const membersList = document.getElementById('membersList');
    membersList.innerHTML = '';
    
    members.forEach(member => {
        const memberCard = document.createElement('div');
        memberCard.className = 'member-card';
        memberCard.innerHTML = `
            <div class="member-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="member-info">
                <div class="member-name">${member.user_name}</div>
                <div class="member-status ${member.status}">${member.status}</div>
            </div>
            <div class="member-stats">
                <span class="stat">${member.hashes_cracked || 0} cracked</span>
            </div>
        `;
        membersList.appendChild(memberCard);
    });
}

async function loadTeamWordlists() {
    if (!AppState.currentTeam) return;
    
    try {
        const response = await apiCall(`/team_wordlists/${AppState.currentTeam.team_id}?user_id=${AppState.currentUser.user_id}`);
        if (response.success) {
            displayTeamWordlists(response.wordlists);
        }
    } catch (error) {
        console.error('Failed to load team wordlists:', error);
    }
}

function displayTeamWordlists(wordlists) {
    const grid = document.getElementById('teamWordlistsGrid');
    grid.innerHTML = '';
    
    wordlists.forEach(wordlist => {
        const card = document.createElement('div');
        card.className = 'wordlist-card';
        card.innerHTML = `
            <div class="wordlist-header">
                <h5>${wordlist.name}</h5>
                <span class="wordlist-size">${wordlist.size_mb}MB</span>
            </div>
            <div class="wordlist-meta">
                <span class="category">${wordlist.category}</span>
                <span class="uploader">by ${wordlist.uploader}</span>
            </div>
            <div class="wordlist-description">${wordlist.description || 'No description'}</div>
            <div class="wordlist-actions">
                <button class="btn-small" onclick="selectWordlist('${wordlist.id}')">
                    <i class="fas fa-check"></i>
                    Select
                </button>
                <button class="btn-small" onclick="downloadWordlist('${wordlist.id}')">
                    <i class="fas fa-download"></i>
                    Download
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function showTeamTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Show/hide tab content
    document.getElementById('createTab').style.display = tab === 'create' ? 'block' : 'none';
    document.getElementById('joinTab').style.display = tab === 'join' ? 'block' : 'none';
}

function shareTeamLink() {
    if (!AppState.currentTeam) return;
    
    const teamId = AppState.currentTeam.team_id;
    const currentUrl = window.location.origin + window.location.pathname;
    const teamLink = `${currentUrl}?team=${teamId}`;
    
    document.getElementById('shareTeamId').value = teamId;
    document.getElementById('shareTeamLink').value = teamLink;
    
    // Show modal
    document.getElementById('shareTeamModal').style.display = 'block';
    
    // Generate QR code if library available
    if (window.QRCode) {
        const qrContainer = document.getElementById('qrCode');
        qrContainer.innerHTML = '';
        new QRCode(qrContainer, teamLink);
    }
}

function copyTeamId() {
    if (!AppState.currentTeam) return;
    
    navigator.clipboard.writeText(AppState.currentTeam.team_id).then(() => {
        showNotification('Team ID copied to clipboard!', 'success');
    }).catch(() => {
        showNotification('Failed to copy team ID', 'error');
    });
}

function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    element.select();
    document.execCommand('copy');
    showNotification('Copied to clipboard!', 'success');
}

function leaveTeam() {
    if (!AppState.currentTeam) return;
    
    if (confirm('Are you sure you want to leave this team?')) {
        // Leave WebSocket room
        if (window.WebSocketManager) {
            window.WebSocketManager.leaveTeamRoom();
        }
        
        // Reset state
        AppState.currentTeam = null;
        AppState.currentUser = null;
        
        // Show team setup again
        document.getElementById('teamDashboard').style.display = 'none';
        document.getElementById('teamSetup').style.display = 'block';
        
        showNotification('Left team successfully', 'info');
    }
}

function showUploadWordlist() {
    if (!AppState.currentTeam) {
        showNotification('Please join a team first to upload wordlists', 'warning');
        return;
    }
    document.getElementById('uploadWordlistModal').style.display = 'block';
}

function closeUploadModal() {
    document.getElementById('uploadWordlistModal').style.display = 'none';
    // Reset form
    document.getElementById('uploadWordlistName').value = '';
    document.getElementById('uploadWordlistDesc').value = '';
    document.getElementById('wordlistFileInput').value = '';
}

function generateContextualWordlist() {
    if (!AppState.currentTeam) {
        showNotification('Please join a team first', 'warning');
        return;
    }
    document.getElementById('generateWordlistModal').style.display = 'block';
}

function closeGenerateModal() {
    document.getElementById('generateWordlistModal').style.display = 'none';
}

function closeShareModal() {
    document.getElementById('shareTeamModal').style.display = 'none';
}

async function uploadWordlist() {
    const fileInput = document.getElementById('wordlistFileInput');
    const name = document.getElementById('uploadWordlistName').value.trim();
    const category = document.getElementById('uploadWordlistCategory').value;
    const description = document.getElementById('uploadWordlistDesc').value.trim();
    
    if (!fileInput.files.length || !name) {
        showNotification('Please select a file and enter a name', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('wordlist', fileInput.files[0]);
    formData.append('name', name);
    formData.append('category', category);
    formData.append('description', description);
    formData.append('team_id', AppState.currentTeam.team_id);
    formData.append('user_id', AppState.currentUser.user_id);
    
    try {
        const response = await fetch(CONFIG.API_BASE_URL + '/upload_team_wordlist', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeUploadModal();
            loadTeamWordlists();
            showNotification('Wordlist uploaded successfully!', 'success');
        } else {
            showNotification(data.error || 'Upload failed', 'error');
        }
    } catch (error) {
        showNotification('Error uploading wordlist: ' + error.message, 'error');
    }
}

async function generateWordlist() {
    const contextType = document.getElementById('contextType').value;
    const keywords = document.getElementById('contextKeywords').value.trim();
    const info = document.getElementById('contextInfo').value.trim();
    
    if (!keywords) {
        showNotification('Please enter some keywords', 'error');
        return;
    }
    
    try {
        const response = await apiCall('/generate_contextual_wordlist', 'POST', {
            context_type: contextType,
            keywords: keywords.split(',').map(k => k.trim()),
            additional_info: info,
            team_id: AppState.currentTeam.team_id,
            user_id: AppState.currentUser.user_id
        });
        
        if (response.success) {
            closeGenerateModal();
            loadTeamWordlists();
            showNotification(`Generated wordlist with ${response.word_count} words!`, 'success');
        } else {
            showNotification(response.error || 'Generation failed', 'error');
        }
    } catch (error) {
        showNotification('Error generating wordlist: ' + error.message, 'error');
    }
}

// Team chat functions
function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message || !AppState.currentTeam) return;
    
    if (window.WebSocketManager) {
        window.WebSocketManager.sendChatMessage(message);
        input.value = '';
    }
}

function addChatMessage(data) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="sender">${data.sender}</span>
            <span class="timestamp">${new Date(data.timestamp).toLocaleTimeString()}</span>
        </div>
        <div class="message-content">${data.message}</div>
    `;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function toggleChat() {
    const chatContainer = document.getElementById('teamChat');
    chatContainer.style.display = chatContainer.style.display === 'none' ? 'block' : 'none';
}

// Check URL parameters for team invite
function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const teamId = urlParams.get('team');
    
    if (teamId) {
        // Auto-switch to team tab and pre-fill team ID
        showSection('team');
        showTeamTab('join');
        document.getElementById('joinTeamId').value = teamId;
    }
}

// File upload handling for wordlist modal
document.addEventListener('DOMContentLoaded', function() {
    const fileUploadArea = document.getElementById('fileUploadArea');
    const fileInput = document.getElementById('wordlistFileInput');
    
    if (fileUploadArea && fileInput) {
        fileUploadArea.addEventListener('click', () => fileInput.click());
        
        fileUploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('dragover');
        });
        
        fileUploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
        });
        
        fileUploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                updateFileUploadDisplay(files[0].name);
            }
        });
        
        fileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                updateFileUploadDisplay(this.files[0].name);
            }
        });
    }
});

function updateFileUploadDisplay(filename) {
    const fileUploadArea = document.getElementById('fileUploadArea');
    fileUploadArea.innerHTML = `
        <i class="fas fa-file-alt"></i>
        <p>Selected: ${filename}</p>
        <small>Click to select a different file</small>
    `;
}

// --- Distributed Hash Cracking Entry Point ---
// --- Wordlist Source Map ---
// --- Split Wordlist Support ---
const WORDLIST_SOURCES = {
    rockyou: {
        type: 'split',
        parts: ['wordlists/rockyou-part1.txt', 'wordlists/rockyou-part2.txt'],
        label: 'rockyou'
    }
};

function updateWordlistDropdown() {
    const select = document.getElementById('wordlistSelect');
    if (!select) return;
    select.innerHTML = '';
    // Only show 'rockyou' if both parts exist
    fetch(WORDLIST_SOURCES.rockyou.parts[0]).then(r1 => {
        if (!r1.ok) throw new Error();
        return fetch(WORDLIST_SOURCES.rockyou.parts[1]);
    }).then(r2 => {
        if (!r2.ok) throw new Error();
        const opt = document.createElement('option');
        opt.value = 'rockyou';
        opt.textContent = 'rockyou';
        select.appendChild(opt);
    }).catch(() => {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'No wordlists available. Please upload.';
        select.appendChild(opt);
    });
}
document.addEventListener('DOMContentLoaded', updateWordlistDropdown);

// --- Load wordlist (split support) ---
async function loadWordlistByKey(key) {
    const src = WORDLIST_SOURCES[key];
    if (!src) return [];
    if (src.type === 'split') {
        let allWords = [];
        for (const part of src.parts) {
            try {
                const res = await fetch(part);
                if (!res.ok) throw new Error('Failed to load part');
                const text = await res.text();
                allWords = allWords.concat(text.split('\n').map(w => w.trim()).filter(Boolean));
            } catch (e) {
                showNotification('Error loading part: ' + part, 'error');
            }
        }
        return allWords;
    }
    showNotification('Wordlist not loaded: ' + key, 'error');
    return [];
}

// --- Patch startCracking to use new loader ---
window.startCracking = async function startCracking() {
    const hashInput = document.getElementById('hashInput').value.trim();
    const wordlistSelect = document.getElementById('wordlistSelect');
    let selectedWordlists = [];
    let wordlistNames = [];
    if (wordlistSelect && wordlistSelect.multiple) {
        selectedWordlists = Array.from(wordlistSelect.selectedOptions).map(opt => opt.value);
        wordlistNames = selectedWordlists.slice();
    } else if (wordlistSelect) {
        selectedWordlists = [wordlistSelect.value];
        wordlistNames = [wordlistSelect.value];
    } else {
        selectedWordlists = ['common'];
        wordlistNames = ['common'];
    }
    const modeBtn = document.querySelector('.mode-btn.active');
    const attackMode = modeBtn ? modeBtn.getAttribute('data-mode') : 'dictionary';

    if (!hashInput) {
        showNotification('Please enter a hash to crack.', 'error');
        return;
    }

    // 2. Load all selected wordlists (local or remote)
    let wordlists = [];
    for (const name of selectedWordlists) {
        const words = await loadWordlistByKey(name);
        if (words.length) {
            wordlists.push(words);
        } else {
            showNotification('Wordlist not loaded: ' + name, 'warning');
        }
    }
    if (!wordlists.length || wordlists.every(wl => !wl.length)) {
        showNotification('No valid wordlists selected.', 'error');
        return;
    }

    // 3. Prepare job info
    const jobId = 'job_' + Math.random().toString(36).substring(2, 10);
    const hashInfo = {
        hash_value: hashInput,
        type: (window.clientHashCracker ? window.clientHashCracker.detectHashType(hashInput) : 'Unknown'),
        mode: attackMode
    };

    // 4. Assign wordlists to peers using P2PManager (hybrid logic)
    if (window.p2pManager && typeof window.p2pManager.assignHybridToPeers === 'function') {
        window.p2pManager.assignHybridToPeers(jobId, hashInfo, wordlists, wordlistNames);
        showNotification('Distributed cracking started!', 'info');
    } else {
        showNotification('P2P manager not initialized.', 'error');
        return;
    }

    // 5. Track job and handle results (handled by onDistributedCrackResult)
};

// --- Distributed Cracking Result Callback ---
window.onDistributedCrackResult = function(result) {
    showNotification(`Hash cracked by network: ${result.plaintext}`, 'success');
    // Update UI
    document.getElementById('resultDisplay').style.display = 'block';
    document.getElementById('originalHash').textContent = result.hash || '';
    document.getElementById('crackedPassword').textContent = result.plaintext || '';
    document.getElementById('timeTaken').textContent = (result.time_taken ? result.time_taken + 's' : '--');
};

// --- Distributed Cracking Progress Callback ---
window.onDistributedCrackProgress = function(progressData) {
    // progressData: { progress, attempts, speed, eta }
    const progressBar = document.getElementById('mainProgress');
    const progressLabel = document.getElementById('progressLabel');
    const speedEl = document.getElementById('crackSpeed');
    const etaEl = document.getElementById('crackETA');
    const statusIndicator = document.getElementById('statusIndicator');
    if (progressBar) progressBar.style.width = (progressData.progress || 0) + '%';
    if (progressLabel) progressLabel.textContent = Math.round(progressData.progress || 0) + '%';
    if (speedEl) speedEl.textContent = (progressData.speed || 0) + ' H/s';
    if (etaEl) etaEl.textContent = progressData.eta || '--';
    if (statusIndicator) {
        statusIndicator.className = 'status-indicator cracking';
        statusIndicator.innerHTML = '<span></span><span>Cracking...</span>';
    }
};

// Reset Crack Hash UI
function resetCrackUI() {
    const progressBar = document.getElementById('mainProgress');
    const progressLabel = document.getElementById('progressLabel');
    const speedEl = document.getElementById('crackSpeed');
    const etaEl = document.getElementById('crackETA');
    const statusIndicator = document.getElementById('statusIndicator');
    if (progressBar) progressBar.style.width = '0%';
    if (progressLabel) progressLabel.textContent = '0%';
    if (speedEl) speedEl.textContent = '0 H/s';
    if (etaEl) etaEl.textContent = '--';
    if (statusIndicator) {
        statusIndicator.className = 'status-indicator idle';
        statusIndicator.innerHTML = '<span></span><span>Idle</span>';
    }
    const resultDisplay = document.getElementById('resultDisplay');
    if (resultDisplay) resultDisplay.style.display = 'none';
}

// Hook up reset button
const resetBtn = document.getElementById('resetCrackBtn');
if (resetBtn) {
    resetBtn.onclick = resetCrackUI;
}

// Patch P2PManager to call progress callback
if (window.p2pManager) {
    const origSendWorkProgress = window.p2pManager.sendWorkProgress;
    window.p2pManager.sendWorkProgress = function(peer, jobId, progress, hashesChecked) {
        if (typeof window.onDistributedCrackProgress === 'function') {
            window.onDistributedCrackProgress({
                progress: Math.min(progress * 100, 100),
                attempts: hashesChecked,
                speed: window.p2pManager.capabilities.max_speed || 0,
                eta: '--' // ETA calculation can be improved
            });
        }
        if (origSendWorkProgress) origSendWorkProgress.apply(this, arguments);
    };
}

// --- Local Wordlist Upload for Multi-Select ---
document.addEventListener('DOMContentLoaded', function() {
    const localInput = document.getElementById('localWordlistInput');
    const wordlistSelect = document.getElementById('wordlistSelect');
    const localList = document.getElementById('localWordlistList');
    if (localInput && wordlistSelect && localList) {
        localInput.addEventListener('change', async function() {
            const files = Array.from(localInput.files);
            let added = [];
            let idx = 0;
            for (const file of files) {
                try {
                    if (!window.clientHashCracker) continue;
                    const result = await window.clientHashCracker.loadWordlistFromFile(file);
                    // Assign professional name
                    let label = PROFESSIONAL_WORDLIST_NAMES[idx] || `Custom ${customWordlistCount++}`;
                    idx++;
                    // Store with professional name as key
                    window.clientHashCracker.wordlists.set(label, result.count ? result.words : result);
                    added.push(label);
                } catch (e) {
                    showNotification('Failed to load wordlist: ' + file.name, 'error');
                }
            }
            updateWordlistDropdown();
            if (added.length) {
                localList.textContent = 'Added: ' + added.join(', ');
            }
        });
    }
});

// --- Dashboard Stats Fetch and Update ---
async function loadDashboardStats() {
    try {
        const stats = await apiCall('/dashboard_stats', 'GET');
        if (stats) {
            const hashes = document.getElementById('totalHashes');
            const nodes = document.getElementById('activeNodes');
            const speed = document.getElementById('totalSpeed');
            if (hashes) hashes.textContent = stats.hashes_cracked;
            if (nodes) nodes.textContent = stats.active_nodes;
            if (speed) speed.textContent = (stats.network_speed || 0) + ' H/s';
        }
    } catch (e) {
        // Optionally show a warning
    }
}

// Periodically refresh dashboard stats
setInterval(() => {
    const homeSection = document.getElementById('home');
    if (homeSection && homeSection.style.display !== 'none') {
        loadDashboardStats();
    }
}, 10000);

// Load stats when showing home section
const origShowSection = showSection;
showSection = function(sectionName) {
    origShowSection(sectionName);
    if (sectionName === 'home') {
        loadDashboardStats();
    }
};

// --- Global Wordlists Fetch and Display ---
async function loadGlobalWordlists() {
    try {
        const wordlists = await apiCall('/list_wordlists', 'GET');
        const grid = document.getElementById('popularWordlistsGrid');
        if (grid) {
            grid.innerHTML = '';
            if (Array.isArray(wordlists) && wordlists.length > 0) {
                wordlists.forEach(wl => {
                    const card = document.createElement('div');
                    card.className = 'wordlist-card';
                    card.innerHTML = `
                        <div class="wordlist-info">
                            <h4>${wl.filename}</h4>
                            <p>Uploaded: ${new Date(wl.upload_time).toLocaleString()}</p>
                            <span class="size">${(wl.size / 1024).toFixed(1)} KB</span>
                        </div>
                        <button class="btn-primary" onclick="downloadWordlistById('${wl.id}')">
                            <i class="fas fa-download"></i> Download
                        </button>
                    `;
                    grid.appendChild(card);
                });
            } else {
                grid.innerHTML = '<div style="color:#888;padding:1em;">No global wordlists found.</div>';
            }
        }
    } catch (e) {
        // Optionally show a warning
    }
}

window.downloadWordlistById = function(wordlistId) {
    window.open(`/api/download_wordlist/${wordlistId}`, '_blank');
};

// Load global wordlists when showing wordlists section
const origShowSectionWordlists = showSection;
showSection = function(sectionName) {
    origShowSectionWordlists(sectionName);
    if (sectionName === 'wordlists') {
        loadGlobalWordlists();
    }
};

// --- Results Fetch, Display, and Store ---
async function loadResults() {
    try {
        const results = await apiCall('/list_results', 'GET');
        const tbody = document.getElementById('resultsTableBody');
        if (tbody) {
            tbody.innerHTML = '';
            if (Array.isArray(results) && results.length > 0) {
                // Get filter values
                const engineFilter = document.getElementById('filterEngine')?.value || '';
                const hashTypeFilter = document.getElementById('filterHashType')?.value || '';
                const search = document.getElementById('searchResults')?.value?.toLowerCase() || '';
                results.filter(r => {
                    let ok = true;
                    if (engineFilter && r.engine !== engineFilter) ok = false;
                    if (hashTypeFilter && r.type !== hashTypeFilter) ok = false;
                    if (search && !(r.hash?.toLowerCase().includes(search) || r.password?.toLowerCase().includes(search))) ok = false;
                    return ok;
                }).forEach(r => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${r.hash || ''}</td>
                        <td>${r.type || ''}</td>
                        <td>${r.password || ''}</td>
                        <td>${r.engine || ''}</td>
                        <td>${r.time || ''}</td>
                        <td>${r.date ? new Date(r.date).toLocaleString() : ''}</td>
                        <td><button class="btn-icon" onclick="copyToClipboardText('${r.password || ''}')"><i class="fas fa-copy"></i></button></td>
                    `;
                    tbody.appendChild(tr);
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="7" style="color:#888;text-align:center;">No results found.</td></tr>';
            }
        }
    } catch (e) {
        // Optionally show a warning
    }
}

window.copyToClipboardText = function(text) {
    navigator.clipboard.writeText(text);
    showNotification('Copied to clipboard!', 'success');
};

// Store result when cracked
window.onDistributedCrackResult = async function(result) {
    showNotification(`Hash cracked by network: ${result.plaintext}`, 'success');
    // Update UI
    document.getElementById('resultDisplay').style.display = 'block';
    document.getElementById('originalHash').textContent = result.hash || '';
    document.getElementById('crackedPassword').textContent = result.plaintext || '';
    document.getElementById('timeTaken').textContent = (result.time_taken ? result.time_taken + 's' : '--');
    // Store in backend
    try {
        await apiCall('/store_result', 'POST', {
            hash: result.hash,
            type: result.hashType || result.type,
            password: result.plaintext,
            engine: result.engine_used || 'distributed',
            time: result.time_taken
        });
    } catch (e) {}
    // Refresh results
    loadResults();
};

// Load results when showing results section
const origShowSectionResults = showSection;
showSection = function(sectionName) {
    origShowSectionResults(sectionName);
    if (sectionName === 'results') {
        loadResults();
        // Add filter listeners
        document.getElementById('filterEngine')?.addEventListener('change', loadResults);
        document.getElementById('filterHashType')?.addEventListener('change', loadResults);
        document.getElementById('searchResults')?.addEventListener('input', loadResults);
    }
};

// --- Professional Wordlist Naming ---
const PROFESSIONAL_WORDLIST_NAMES = ['rockyou', '100k most common', '10k most common'];
let customWordlistCount = 1;

function updateWordlistDropdown() {
    const select = document.getElementById('wordlistSelect');
    if (!select) return;
    select.innerHTML = '';
    if (window.clientHashCracker && window.clientHashCracker.wordlists.size > 0) {
        let idx = 0;
        window.clientHashCracker.wordlists.forEach((words, key) => {
            let label = PROFESSIONAL_WORDLIST_NAMES[idx] || `Custom ${customWordlistCount++}`;
            idx++;
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = label;
            select.appendChild(opt);
        });
    } else {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'No wordlists available. Please upload.';
        select.appendChild(opt);
    }
}
document.addEventListener('DOMContentLoaded', updateWordlistDropdown);

// Patch local wordlist upload logic to use professional names
const localInput = document.getElementById('localWordlistInput');
const wordlistSelect = document.getElementById('wordlistSelect');
const localList = document.getElementById('localWordlistList');
if (localInput && wordlistSelect && localList) {
    localInput.addEventListener('change', async function() {
        const files = Array.from(localInput.files);
        let added = [];
        let idx = 0;
        // Clear previous mapping to keep order consistent
        window.clientHashCracker.wordlists = new Map();
        customWordlistCount = 1;
        for (const file of files) {
            try {
                if (!window.clientHashCracker) continue;
                const result = await window.clientHashCracker.loadWordlistFromFile(file);
                // Assign professional name
                let label = PROFESSIONAL_WORDLIST_NAMES[idx] || `Custom ${customWordlistCount++}`;
                idx++;
                window.clientHashCracker.wordlists.set(label, result.count ? result.words : result);
                added.push(label);
            } catch (e) {
                showNotification('Failed to load wordlist: ' + file.name, 'error');
            }
        }
        updateWordlistDropdown();
        if (added.length) {
            localList.textContent = 'Added: ' + added.join(', ');
        }
    });
}
