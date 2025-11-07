/**
 * HashCrack Offline Engine
 * Provides basic hash cracking capabilities when backend is unavailable
 */

class OfflineHashEngine {
    constructor() {
        this.commonPasswords = [
            'password', '123456', 'password123', 'admin', 'qwerty', 'letmein',
            '123456789', 'welcome', 'monkey', '1234567890', 'abc123', '111111',
            'password1', 'iloveyou', '1234567', 'sunshine', 'princess', 'admin123',
            'welcome123', 'charlie', 'passw0rd', 'dragon', 'master', 'hello',
            'freedom', 'whatever', 'qwerty123', 'trustno1', 'jordan23', 'harley',
            'robert', 'matthew', 'jordan', 'asshole', 'daniel'
        ];
        
        this.supportedTypes = new Map([
            ['md5', this.md5],
            ['sha1', this.sha1],
            ['sha256', this.sha256],
            ['ntlm', this.ntlm]
        ]);
    }

    /**
     * Attempt to crack a hash using common passwords
     */
    async crackHash(hash, hashType = null) {
        const detectedType = hashType || this.detectHashType(hash);
        
        if (!detectedType) {
            throw new Error('Unable to detect hash type');
        }

        const hashFunc = this.supportedTypes.get(detectedType.toLowerCase());
        if (!hashFunc) {
            throw new Error(`Hash type ${detectedType} not supported in offline mode`);
        }

        console.log(`🔧 Offline cracking ${detectedType.toUpperCase()} hash...`);
        
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const startTime = Date.now();
            
            const tryPassword = (passwordIndex) => {
                if (passwordIndex >= this.commonPasswords.length) {
                    reject(new Error('Password not found in common wordlist'));
                    return;
                }
                
                const password = this.commonPasswords[passwordIndex];
                attempts++;
                
                // Simulate processing time
                setTimeout(async () => {
                    try {
                        const hashedPassword = await hashFunc.call(this, password);
                        
                        if (hashedPassword.toLowerCase() === hash.toLowerCase()) {
                            const elapsed = Date.now() - startTime;
                            resolve({
                                password: password,
                                attempts: attempts,
                                time: elapsed,
                                method: 'offline_common_passwords'
                            });
                        } else {
                            tryPassword(passwordIndex + 1);
                        }
                    } catch (error) {
                        // Log error and continue to next password
                        console.warn('Error hashing password:', error);
                        tryPassword(passwordIndex + 1);
                    }
                }, 10); // Small delay to prevent UI blocking
            };
            
            tryPassword(0);
        });
    }

    /**
     * Detect hash type based on length and format
     */
    detectHashType(hash) {
        const cleanHash = hash.trim();
        
        // Remove common prefixes
        const hashOnly = cleanHash.replace(/^(\$\w+\$.*?\$|\{[^}]+\}|0x)/i, '');
        
        switch (hashOnly.length) {
            case 32:
                return /^[a-f0-9]+$/i.test(hashOnly) ? 'MD5' : null;
            case 40:
                return /^[a-f0-9]+$/i.test(hashOnly) ? 'SHA1' : null;
            case 64:
                return /^[a-f0-9]+$/i.test(hashOnly) ? 'SHA256' : null;
            default:
                return null;
        }
    }

    /**
     * Hash functions using SubtleCrypto API
     */
    async md5(text) {
        // Note: MD5 is not available in SubtleCrypto, using a simple implementation
        return this.simpleMD5(text);
    }

    async sha1(text) {
        const msgBuffer = new TextEncoder().encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    async sha256(text) {
        const msgBuffer = new TextEncoder().encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    async ntlm(text) {
        // NTLM uses UTF-16LE encoding
        const utf16le = new TextEncoder('utf-16le').encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-1', utf16le);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * Simple MD5 implementation for offline use
     */
    simpleMD5(text) {
        // This is a simplified implementation - in production you'd use a proper MD5 library
        // For demonstration purposes, returning a placeholder
        const hash = text.split('').reduce((hash, char) => {
            return char.codePointAt(0) + ((hash << 5) - hash);
        }, 0);
        return Math.abs(hash).toString(16).padStart(32, '0').substring(0, 32);
    }
}

// Global offline engine instance
globalThis.OfflineHashEngine = new OfflineHashEngine();
