/**
 * P2P (Peer-to-Peer) Communication for Distributed Hash Cracking
 * Uses WebRTC for direct browser-to-browser communication
 */

class P2PManager {
    constructor() {
        this.peers = new Map();
        this.localPeerId = this.generatePeerId();
        this.isInitialized = false;
        this.configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' }
            ]
        };
        
        this.capabilities = {
            cpu_cores: navigator.hardwareConcurrency || 4,
            memory: navigator.deviceMemory || 4,
            gpu_available: this.detectGPU(),
            max_speed: 0, // Will be calculated during benchmarking
            available_for_work: false
        };
        
        this.workQueue = [];
        this.activeWork = null;
        this.benchmarkResults = null;
        
        console.log('[P2P] Initialized with peer ID:', this.localPeerId);
    }
    
    generatePeerId() {
        return 'peer_' + Math.random().toString(36).substring(2, 15);
    }
    
    detectGPU() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                return renderer.toLowerCase().includes('nvidia') || 
                       renderer.toLowerCase().includes('amd') ||
                       renderer.toLowerCase().includes('intel');
            }
        }
        return false;
    }
    
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            // Run performance benchmark
            await this.runBenchmark();
            
            this.isInitialized = true;
            console.log('[P2P] P2P manager initialized');
            console.log('[P2P] Capabilities:', this.capabilities);
            
            return true;
        } catch (error) {
            console.error('[P2P] Initialization failed:', error);
            return false;
        }
    }
    
    async runBenchmark() {
        console.log('[P2P] Running performance benchmark...');
        
        const startTime = performance.now();
        let hashCount = 0;
        
        // Simple MD5-like operations to estimate speed
        const testData = 'benchmark_test_string';
        const iterations = 100000;
        
        for (let i = 0; i < iterations; i++) {
            // Simulate hash computation
            const hash = await this.simpleHash(testData + i);
            hashCount++;
        }
        
        const endTime = performance.now();
        const timeSeconds = (endTime - startTime) / 1000;
        const hashesPerSecond = Math.round(hashCount / timeSeconds);
        
        this.capabilities.max_speed = hashesPerSecond;
        this.benchmarkResults = {
            hashes_per_second: hashesPerSecond,
            test_duration: timeSeconds,
            timestamp: Date.now()
        };
        
        console.log(`[P2P] Benchmark complete: ${hashesPerSecond} H/s`);
    }
    
    async simpleHash(input) {
        const encoder = new TextEncoder();
        const data = encoder.encode(input);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    async connectToPeer(peerId, offer = null) {
        if (this.peers.has(peerId)) {
            console.log('[P2P] Already connected to peer:', peerId);
            return this.peers.get(peerId);
        }
        
        console.log('[P2P] Connecting to peer:', peerId);
        
        const peerConnection = new RTCPeerConnection(this.configuration);
        const dataChannel = peerConnection.createDataChannel('hashcrack', {
            ordered: true
        });
        
        this.setupPeerConnection(peerConnection, dataChannel, peerId);
        
        if (offer) {
            // Answering a connection
            await peerConnection.setRemoteDescription(offer);
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            return answer;
        } else {
            // Initiating a connection
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            return offer;
        }
    }
    
    setupPeerConnection(peerConnection, dataChannel, peerId) {
        const peer = {
            id: peerId,
            connection: peerConnection,
            channel: dataChannel,
            state: 'connecting',
            capabilities: null,
            lastSeen: Date.now()
        };
        
        this.peers.set(peerId, peer);
        
        // Handle connection state changes
        peerConnection.onconnectionstatechange = () => {
            console.log(`[P2P] Connection state with ${peerId}:`, peerConnection.connectionState);
            peer.state = peerConnection.connectionState;
            
            if (peerConnection.connectionState === 'connected') {
                this.onPeerConnected(peer);
            } else if (peerConnection.connectionState === 'disconnected' || 
                      peerConnection.connectionState === 'failed') {
                this.onPeerDisconnected(peer);
            }
        };
        
        // Handle data channel
        dataChannel.onopen = () => {
            console.log('[P2P] Data channel opened with', peerId);
            this.sendCapabilities(peer);
        };
        
        dataChannel.onmessage = (event) => {
            this.handlePeerMessage(peer, JSON.parse(event.data));
        };
        
        dataChannel.onerror = (error) => {
            console.error('[P2P] Data channel error with', peerId, error);
        };
        
        // Handle incoming data channels
        peerConnection.ondatachannel = (event) => {
            const channel = event.channel;
            channel.onmessage = (event) => {
                this.handlePeerMessage(peer, JSON.parse(event.data));
            };
        };
    }
    
    onPeerConnected(peer) {
        console.log('[P2P] Peer connected:', peer.id);
        this.updateNetworkStats();
        
        // Notify UI
        if (typeof updateNetworkNode === 'function') {
            updateNetworkNode(peer.id, 'connected', peer.capabilities);
        }
    }
    
    onPeerDisconnected(peer) {
        console.log('[P2P] Peer disconnected:', peer.id);
        this.peers.delete(peer.id);
        this.updateNetworkStats();
        
        // Notify UI
        if (typeof updateNetworkNode === 'function') {
            updateNetworkNode(peer.id, 'disconnected');
        }
    }
    
    sendCapabilities(peer) {
        const message = {
            type: 'capabilities',
            data: {
                peer_id: this.localPeerId,
                capabilities: this.capabilities,
                benchmark: this.benchmarkResults
            }
        };
        
        this.sendMessage(peer, message);
    }
    
    handlePeerMessage(peer, message) {
        console.log('[P2P] Message from', peer.id, ':', message.type);
        
        switch (message.type) {
            case 'capabilities':
                peer.capabilities = message.data.capabilities;
                peer.benchmark = message.data.benchmark;
                console.log('[P2P] Peer capabilities:', peer.capabilities);
                break;
                
            case 'work_assignment':
                this.handleWorkAssignment(peer, message.data);
                break;
                
            case 'work_result':
                this.handleWorkResult(peer, message.data);
                break;
                
            case 'work_progress':
                this.handleWorkProgress(peer, message.data);
                break;
                
            case 'ping':
                this.sendMessage(peer, { type: 'pong', data: { timestamp: Date.now() } });
                break;
                
            case 'pong':
                peer.lastSeen = Date.now();
                break;
                
            default:
                console.warn('[P2P] Unknown message type:', message.type);
        }
    }
    
    async handleWorkAssignment(peer, workData) {
        if (!this.capabilities.available_for_work) {
            console.log('[P2P] Not available for work, rejecting assignment');
            this.sendMessage(peer, {
                type: 'work_rejected',
                data: { reason: 'not_available' }
            });
            return;
        }
        
        console.log('[P2P] Received work assignment:', workData);
        
        // Add to work queue
        this.workQueue.push({
            peer: peer,
            assignment: workData,
            received_at: Date.now()
        });
        
        // Start processing if not already working
        if (!this.activeWork) {
            this.processWorkQueue();
        }
    }
    
    async processWorkQueue() {
        if (this.workQueue.length === 0) {
            this.activeWork = null;
            return;
        }
        
        const work = this.workQueue.shift();
        this.activeWork = work;
        
        console.log('[P2P] Starting work on assignment:', work.assignment.job_id);
        
        try {
            // Simulate hash cracking work
            const result = await this.performHashCracking(work.assignment);
            
            // Send result back
            this.sendMessage(work.peer, {
                type: 'work_result',
                data: {
                    job_id: work.assignment.job_id,
                    success: result.success,
                    plaintext: result.plaintext,
                    time_taken: result.time_taken,
                    hashes_checked: result.hashes_checked
                }
            });
            
        } catch (error) {
            console.error('[P2P] Work processing failed:', error);
            
            this.sendMessage(work.peer, {
                type: 'work_result',
                data: {
                    job_id: work.assignment.job_id,
                    success: false,
                    error: error.message
                }
            });
        }
        
        // Continue with next work item
        this.activeWork = null;
        setTimeout(() => this.processWorkQueue(), 100);
    }
    
    async performHashCracking(assignment) {
        const { hash_info, wordlist_chunk, job_id } = assignment;
        const startTime = Date.now();
        let hashesChecked = 0;
        
        console.log('[P2P] Cracking hash:', hash_info.hash_value.substring(0, 16) + '...');
        
        // Simulate cracking work
        for (const password of wordlist_chunk.passwords) {
            hashesChecked++;
            
            // Report progress every 1000 hashes
            if (hashesChecked % 1000 === 0) {
                const progress = hashesChecked / wordlist_chunk.passwords.length;
                this.sendWorkProgress(assignment.peer, job_id, progress, hashesChecked);
            }
            
            // Simulate hash checking
            const candidateHash = await this.simpleHash(password);
            
            // For demo purposes, sometimes "find" the password
            if (password === 'password' || password === 'admin' || password === '123456') {
                return {
                    success: true,
                    plaintext: password,
                    time_taken: (Date.now() - startTime) / 1000,
                    hashes_checked: hashesChecked
                };
            }
            
            // Small delay to prevent blocking
            if (hashesChecked % 100 === 0) {
                await new Promise(resolve => setTimeout(resolve, 1));
            }
        }
        
        return {
            success: false,
            time_taken: (Date.now() - startTime) / 1000,
            hashes_checked: hashesChecked
        };
    }
    
    sendWorkProgress(peer, jobId, progress, hashesChecked) {
        this.sendMessage(peer, {
            type: 'work_progress',
            data: {
                job_id: jobId,
                progress: progress,
                hashes_checked: hashesChecked,
                timestamp: Date.now()
            }
        });
    }
    
    sendMessage(peer, message) {
        if (peer.channel && peer.channel.readyState === 'open') {
            peer.channel.send(JSON.stringify(message));
        } else {
            console.warn('[P2P] Cannot send message, channel not open for peer:', peer.id);
        }
    }
    
    broadcastMessage(message) {
        this.peers.forEach(peer => {
            this.sendMessage(peer, message);
        });
    }
    
    setAvailableForWork(available) {
        this.capabilities.available_for_work = available;
        console.log('[P2P] Available for work:', available);
        
        // Broadcast capability update
        this.broadcastMessage({
            type: 'capabilities',
            data: {
                peer_id: this.localPeerId,
                capabilities: this.capabilities,
                benchmark: this.benchmarkResults
            }
        });
    }
    
    updateNetworkStats() {
        const connectedPeers = Array.from(this.peers.values()).filter(p => p.state === 'connected');
        const totalSpeed = connectedPeers.reduce((sum, peer) => {
            return sum + (peer.benchmark ? peer.benchmark.hashes_per_second : 0);
        }, 0);
        
        // Update UI
        const totalNodesEl = document.getElementById('totalNodes');
        const avgSpeedEl = document.getElementById('avgSpeed');
        
        if (totalNodesEl) {
            totalNodesEl.textContent = connectedPeers.length;
        }
        
        if (avgSpeedEl) {
            avgSpeedEl.textContent = this.formatHashRate(totalSpeed);
        }
    }
    
    formatHashRate(hashesPerSecond) {
        if (hashesPerSecond >= 1000000000) {
            return (hashesPerSecond / 1000000000).toFixed(1) + ' GH/s';
        } else if (hashesPerSecond >= 1000000) {
            return (hashesPerSecond / 1000000).toFixed(1) + ' MH/s';
        } else if (hashesPerSecond >= 1000) {
            return (hashesPerSecond / 1000).toFixed(1) + ' KH/s';
        } else {
            return hashesPerSecond + ' H/s';
        }
    }
    
    getNetworkInfo() {
        const connectedPeers = Array.from(this.peers.values()).filter(p => p.state === 'connected');
        
        return {
            local_peer_id: this.localPeerId,
            connected_peers: connectedPeers.length,
            capabilities: this.capabilities,
            benchmark: this.benchmarkResults,
            peers: connectedPeers.map(peer => ({
                id: peer.id,
                capabilities: peer.capabilities,
                benchmark: peer.benchmark,
                last_seen: peer.lastSeen
            }))
        };
    }
}

// Global P2P instance
const p2pManager = new P2PManager();

// Helper functions for P2P integration
async function startContributing() {
    console.log('[P2P] Starting contribution to network...');
    
    if (!p2pManager.isInitialized) {
        await p2pManager.initialize();
    }
    
    p2pManager.setAvailableForWork(true);
    
    // Update UI
    const resourceSettings = document.getElementById('resourceSettings');
    if (resourceSettings) {
        resourceSettings.style.display = 'block';
    }
    
    showNotification('You are now contributing to the network!', 'success');
}

function useNetworkOnly() {
    console.log('[P2P] Using network only (not contributing)');
    
    p2pManager.setAvailableForWork(false);
    
    showNotification('Connected to network for hash cracking only', 'info');
}

function updateNetworkNode(peerId, status, capabilities = null) {
    // Update the network visualization
    const nodesGrid = document.getElementById('nodesGrid');
    if (!nodesGrid) return;
    
    let nodeElement = document.getElementById(`node-${peerId}`);
    
    if (status === 'connected' && !nodeElement) {
        // Create new node element
        nodeElement = document.createElement('div');
        nodeElement.id = `node-${peerId}`;
        nodeElement.className = 'network-node';
        nodeElement.innerHTML = `
            <div class="node-status ${status}"></div>
            <div class="node-info">
                <div class="node-id">${peerId.substring(0, 8)}...</div>
                <div class="node-speed">${capabilities ? p2pManager.formatHashRate(capabilities.max_speed) : 'Unknown'}</div>
            </div>
        `;
        nodesGrid.appendChild(nodeElement);
        
    } else if (status === 'disconnected' && nodeElement) {
        // Remove node element
        nodeElement.remove();
    }
}

// Export for other modules
window.p2pManager = p2pManager;

console.log('[P2P] P2P manager initialized');
