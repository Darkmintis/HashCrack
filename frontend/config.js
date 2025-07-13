/**
 * HashCrack Simple Configuration
 * For client-side hash cracking with minimal backend
 */

window.HASHCRACK_CONFIG = {
    // CHANGE THIS: Replace with your Render backend URL
    BACKEND_URL: 'https://your-render-app.onrender.com',
    
    // App info
    APP_NAME: 'HashCrack',
    VERSION: 'v0.5-dev', // Development phase
    
    // Features (keep it simple)
    FEATURES: {
        CLIENT_SIDE_CRACKING: true,
        TEAM_COORDINATION: true,
        P2P_SHARING: true,
        CUSTOM_WORDLISTS: true
    },
    
    // Limits
    MAX_HASH_LENGTH: 200,
    MAX_WORDLIST_SIZE_MB: 10, // Keep it small for client-side
    MAX_TEAM_SIZE: 10
};

// Auto-detect environment
window.HASHCRACK_CONFIG.getBackendUrl = function() {
    const hostname = window.location.hostname;
    
    // Development (local testing)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5000';
    }
    
    // Production (GitHub Pages)
    if (this.BACKEND_URL === 'https://your-render-app.onrender.com') {
        console.warn('⚠️ Please update BACKEND_URL in config.js with your Render URL');
        return 'https://hashcrack-demo.onrender.com'; // Fallback
    }
    
    return this.BACKEND_URL;
};

// WebSocket URL
window.HASHCRACK_CONFIG.getWebSocketUrl = function() {
    const backendUrl = this.getBackendUrl();
    return backendUrl.replace('http', 'ws') + '/socket.io/';
};

console.log('🚀 HashCrack Simple Config Loaded');
console.log('� Backend:', window.HASHCRACK_CONFIG.getBackendUrl());

window.HASHCRACK_CONFIG.getWsUrl = function() {
    return this.getApiUrl().replace('http://', 'ws://').replace('https://', 'wss://');
};
