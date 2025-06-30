/**
 * HashCrack Configuration
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Deploy backend to Render and get your URL (e.g., https://your-app.render.com)
 * 2. Replace YOUR_RENDER_URL_HERE with your actual Render URL
 * 3. Deploy frontend to GitHub Pages
 * 4. Users can now access your service!
 */

window.HASHCRACK_CONFIG = {
    // CHANGE THIS: Replace with your actual Render backend URL
    PRODUCTION_API_URL: 'https://YOUR_RENDER_URL_HERE',
    
    // Optional: Custom branding
    APP_NAME: 'HashCrack',
    TEAM_NAME: 'Your Organization', // Will appear in UI
    
    // Optional: Feature flags
    FEATURES: {
        TEAM_MODE: true,
        P2P_CRACKING: true,
        WORDLIST_UPLOAD: true,
        YESCRYPT_SUPPORT: true
    },
    
    // Optional: Limits
    LIMITS: {
        MAX_HASH_LENGTH: 200,
        MAX_WORDLIST_SIZE_MB: 100,
        MAX_TEAM_SIZE: 20
    }
};

// Auto-generate URLs based on environment
window.HASHCRACK_CONFIG.getApiUrl = function() {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isLocal) {
        return 'http://localhost:5000';
    }
    
    if (this.PRODUCTION_API_URL === 'https://YOUR_RENDER_URL_HERE') {
        console.warn('⚠️ CONFIGURATION NEEDED: Please update PRODUCTION_API_URL in config.js with your Render URL');
        return 'https://hashcrack-demo.render.com'; // Fallback demo URL
    }
    
    return this.PRODUCTION_API_URL;
};

window.HASHCRACK_CONFIG.getWsUrl = function() {
    return this.getApiUrl().replace('http://', 'ws://').replace('https://', 'wss://');
};
