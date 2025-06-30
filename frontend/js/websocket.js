/**
 * WebSocket Communication for Real-time Team Collaboration
 */

class WebSocketManager {
    constructor() {
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.isConnected = false;
        this.messageHandlers = new Map();
        
        this.setupEventHandlers();
    }
    
    connect(teamId, userId) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.disconnect();
        }
        
        const wsUrl = CONFIG.WS_URL || CONFIG.API_BASE_URL.replace('http', 'ws');
        console.log('[WS] Connecting to:', wsUrl);
        
        try {
            this.socket = io(CONFIG.API_BASE_URL, {
                transports: ['websocket', 'polling'],
                upgrade: true,
                rememberUpgrade: true
            });
            
            this.setupSocketEvents(teamId, userId);
            
        } catch (error) {
            console.error('[WS] Connection failed:', error);
            this.handleReconnect();
        }
    }
    
    setupSocketEvents(teamId, userId) {
        this.socket.on('connect', () => {
            console.log('[WS] Connected to server');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            
            // Join team room
            this.socket.emit('join_team_room', {
                team_id: teamId,
                user_id: userId
            });
            
            this.emit('connection_status', { status: 'connected' });
        });
        
        this.socket.on('disconnect', () => {
            console.log('[WS] Disconnected from server');
            this.isConnected = false;
            this.emit('connection_status', { status: 'disconnected' });
            this.handleReconnect();
        });
        
        this.socket.on('connect_error', (error) => {
            console.error('[WS] Connection error:', error);
            this.handleReconnect();
        });
        
        // Team events
        this.socket.on('joined_team', (data) => {
            console.log('[WS] Joined team:', data.team_name);
            this.emit('team_joined', data);
        });
        
        this.socket.on('member_joined', (data) => {
            console.log('[WS] Member joined:', data.user_name);
            this.emit('member_joined', data);
            showNotification(`${data.user_name} joined the team`, 'info');
        });
        
        this.socket.on('member_left', (data) => {
            console.log('[WS] Member left:', data.user_name);
            this.emit('member_left', data);
            showNotification(`${data.user_name} left the team`, 'info');
        });
        
        // Wordlist events
        this.socket.on('wordlist_uploaded', (data) => {
            console.log('[WS] Wordlist uploaded:', data.wordlist_name);
            this.emit('wordlist_uploaded', data);
            showNotification(`${data.uploader} uploaded "${data.wordlist_name}"`, 'success');
            
            // Refresh wordlists
            if (typeof loadTeamWordlists === 'function') {
                loadTeamWordlists();
            }
        });
        
        // Job events
        this.socket.on('job_created', (data) => {
            console.log('[WS] Job created:', data.job_id);
            this.emit('job_created', data);
            showNotification(`${data.created_by} started cracking a ${data.hash_type} hash`, 'info');
        });
        
        this.socket.on('job_completed', (data) => {
            console.log('[WS] Job completed:', data.job_id);
            this.emit('job_completed', data);
            
            if (data.success) {
                showNotification(`Hash cracked: ${data.plaintext}`, 'success');
                
                // Update UI if this was our job
                if (AppState.activeJobs.has(data.job_id)) {
                    const job = AppState.activeJobs.get(data.job_id);
                    showCrackingResult(job.hash_info.hash_value, data.plaintext, data.time_taken, data.engine_used);
                    AppState.activeJobs.delete(data.job_id);
                }
            }
        });
        
        this.socket.on('progress_update', (data) => {
            this.emit('progress_update', data);
            
            // Update progress for active jobs
            if (AppState.activeJobs.has(data.job_id)) {
                updateJobProgress(data.job_id, data.progress);
            }
        });
        
        this.socket.on('job_cancelled', (data) => {
            console.log('[WS] Job cancelled:', data.job_id);
            this.emit('job_cancelled', data);
            
            if (AppState.activeJobs.has(data.job_id)) {
                AppState.activeJobs.delete(data.job_id);
                updateCrackingStatus('cancelled', 'Job was cancelled');
            }
        });
        
        // Error handling
        this.socket.on('error', (data) => {
            console.error('[WS] Server error:', data);
            this.emit('error', data);
            showNotification('Server error: ' + data.message, 'error');
        });
        
        // Enhanced team event handlers
        this.socket.on('member_joined', (data) => {
            showNotification(`${data.user_name} joined the team`, 'info');
            if (window.loadTeamMembers) loadTeamMembers();
        });
        
        this.socket.on('member_left', (data) => {
            showNotification(`${data.user_name} left the team`, 'info');
            if (window.loadTeamMembers) loadTeamMembers();
        });
        
        this.socket.on('member_status_update', (data) => {
            updateMemberStatus(data.user_id, data.status);
        });
        
        // Wordlist events
        this.socket.on('wordlist_uploaded', (data) => {
            showNotification(`${data.uploader} uploaded wordlist: ${data.wordlist_name}`, 'info');
            if (window.loadTeamWordlists) loadTeamWordlists();
        });
        
        this.socket.on('wordlist_generated', (data) => {
            showNotification(`${data.generator} generated contextual wordlist: ${data.wordlist_name}`, 'info');
            if (window.loadTeamWordlists) loadTeamWordlists();
        });
        
        // Job events
        this.socket.on('job_started', (data) => {
            showNotification(`${data.started_by} started cracking: ${data.hash_preview}`, 'info');
            if (window.loadActiveJobs) loadActiveJobs();
        });
        
        this.socket.on('job_completed', (data) => {
            if (data.success) {
                showNotification(`🎉 Hash cracked by ${data.cracked_by}: ${data.plaintext}`, 'success');
            } else {
                showNotification(`Job completed by ${data.cracked_by} - no result`, 'warning');
            }
            if (window.loadActiveJobs) loadActiveJobs();
        });
        
        this.socket.on('job_progress', (data) => {
            updateJobProgress(data.job_id, data.progress, data.eta);
        });
        
        // Chat events
        this.socket.on('team_chat_message', (data) => {
            if (window.addChatMessage) {
                addChatMessage(data);
            }
        });
        
        // P2P coordination
        this.socket.on('p2p_request', (data) => {
            if (window.P2PManager) {
                window.P2PManager.handleP2PRequest(data);
            }
        });
        
        this.socket.on('p2p_response', (data) => {
            if (window.P2PManager) {
                window.P2PManager.handleP2PResponse(data);
            }
        });
        
        // Team stats updates
        this.socket.on('team_stats_update', (data) => {
            updateTeamStats(data);
        });
    }
    
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.isConnected = false;
    }
    
    send(event, data) {
        if (this.socket && this.isConnected) {
            this.socket.emit(event, data);
        } else {
            console.warn('[WS] Not connected, cannot send:', event);
        }
    }
    
    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`[WS] Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            setTimeout(() => {
                if (AppState.currentTeam && AppState.currentUser) {
                    this.connect(AppState.currentTeam.team_id, AppState.currentUser.user_id);
                }
            }, this.reconnectDelay * this.reconnectAttempts);
        } else {
            console.error('[WS] Max reconnection attempts reached');
            showNotification('Lost connection to server. Please refresh the page.', 'error');
        }
    }
    
    setupEventHandlers() {
        // Custom event system for internal communication
        this.messageHandlers.set('connection_status', this.handleConnectionStatus.bind(this));
        this.messageHandlers.set('team_joined', this.handleTeamJoined.bind(this));
        this.messageHandlers.set('member_joined', this.handleMemberJoined.bind(this));
        this.messageHandlers.set('member_left', this.handleMemberLeft.bind(this));
    }
    
    on(event, handler) {
        if (!this.messageHandlers.has(event)) {
            this.messageHandlers.set(event, []);
        }
        
        const handlers = this.messageHandlers.get(event);
        if (Array.isArray(handlers)) {
            handlers.push(handler);
        } else {
            this.messageHandlers.set(event, [handlers, handler]);
        }
    }
    
    emit(event, data) {
        const handlers = this.messageHandlers.get(event);
        if (handlers) {
            if (Array.isArray(handlers)) {
                handlers.forEach(handler => handler(data));
            } else {
                handlers(data);
            }
        }
    }
    
    handleConnectionStatus(data) {
        const connectBtn = document.getElementById('connectBtn');
        if (connectBtn) {
            if (data.status === 'connected') {
                connectBtn.className = 'btn-success';
                connectBtn.innerHTML = '<i class="fas fa-check"></i> Connected';
            } else {
                connectBtn.className = 'btn-warning';
                connectBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Disconnected';
            }
        }
    }
    
    handleTeamJoined(data) {
        console.log('[WS] Successfully joined team room');
    }
    
    handleMemberJoined(data) {
        updateMembersList();
    }
    
    handleMemberLeft(data) {
        updateMembersList();
    }
}

// Global WebSocket instance
const wsManager = new WebSocketManager();

// Helper functions for WebSocket integration
function connectToTeamRoom() {
    if (AppState.currentTeam && AppState.currentUser) {
        wsManager.connect(AppState.currentTeam.team_id, AppState.currentUser.user_id);
    }
}

function disconnectFromTeamRoom() {
    wsManager.disconnect();
}

function updateMemberStatus(userId, status) {
    const memberCards = document.querySelectorAll('.member-card');
    memberCards.forEach(card => {
        if (card.dataset.userId === userId) {
            const statusElement = card.querySelector('.member-status');
            if (statusElement) {
                statusElement.className = `member-status ${status}`;
                statusElement.textContent = status;
            }
        }
    });
}

function updateJobProgress(jobId, progress, eta) {
    const jobElements = document.querySelectorAll(`[data-job-id="${jobId}"]`);
    jobElements.forEach(element => {
        const progressBar = element.querySelector('.progress-fill');
        const etaElement = element.querySelector('.job-eta');
        
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        
        if (etaElement) {
            etaElement.textContent = eta;
        }
    });
}

async function loadActiveJobs() {
    if (!AppState.currentTeam) return;
    
    try {
        const response = await apiCall(`/team_jobs/${AppState.currentTeam.team_id}?user_id=${AppState.currentUser.user_id}`);
        if (response.success) {
            displayActiveJobs(response.jobs);
        }
    } catch (error) {
        console.error('Failed to load active jobs:', error);
    }
}

function displayActiveJobs(jobs) {
    const jobsList = document.getElementById('activeJobsList');
    
    if (!jobs || jobs.length === 0) {
        jobsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <p>No active jobs. Start cracking some hashes!</p>
            </div>
        `;
        return;
    }
    
    jobsList.innerHTML = '';
    
    jobs.forEach(job => {
        const jobCard = document.createElement('div');
        jobCard.className = 'job-card';
        jobCard.dataset.jobId = job.job_id;
        
        jobCard.innerHTML = `
            <div class="job-header">
                <div class="job-info">
                    <h5>${job.hash_type} Hash</h5>
                    <span class="job-hash">${job.hash_preview}...</span>
                </div>
                <div class="job-status ${job.status}">
                    ${job.status}
                </div>
            </div>
            <div class="job-details">
                <div class="job-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${job.progress || 0}%"></div>
                    </div>
                    <span class="progress-text">${job.progress || 0}%</span>
                </div>
                <div class="job-meta">
                    <span class="job-assignee">by ${job.started_by}</span>
                    <span class="job-eta">${job.eta || '--'}</span>
                </div>
            </div>
            ${job.result ? `
                <div class="job-result">
                    <i class="fas fa-check-circle"></i>
                    Result: <strong>${job.result}</strong>
                </div>
            ` : ''}
        `;
        
        jobsList.appendChild(jobCard);
    });
    
    // Update job count
    document.getElementById('jobCount').textContent = `${jobs.length} active`;
    document.getElementById('activeJobsCount').textContent = jobs.length;
}
