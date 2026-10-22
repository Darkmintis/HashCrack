/**
 * HashCrack - Professional Hash Cracking Tool for CTF Players
 * Configuration File
 */

globalThis.HASHCRACK_CONFIG = {
    // App info
    APP_NAME: "HashCrack",
    VERSION: "v2.0",

    // Features
    FEATURES: {
        CLIENT_SIDE_CRACKING: true,
        OFFLINE_MODE: true,
        CUSTOM_WORDLISTS: true,
        MULTI_THREADING: true,
        WORDLIST_OFFLINE_CACHE: true
    },

    // Built-in wordlist downloads.
    // Files are served from a static CDN as gzip-compressed .txt.gz files.
    // For local 10K/100K testing, set this to "wordlists" to use the
    // uncompressed source files. RockYou needs the generated gzip file or
    // the public CDN.
    WORDLIST_CDN: "https://cdn.darkmintis.dev/wordlists",

    // Wordlists available
    WORDLISTS: [
        { id: "10k", name: "Common Passwords (10K)", size: 10000 },
        { id: "100k", name: "Extended Passwords (100K)", size: 100000 },
        { id: "rockyou", name: "RockYou", size: 14344375 }
    ],

    // Supported hash types
    HASH_TYPES: [
        { id: "md5", name: "MD5", example: "5f4dcc3b5aa765d61d8327deb882cf99" },
        { id: "sha1", name: "SHA1", example: "5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8" },
        { id: "sha256", name: "SHA256", example: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8" },
        { id: "sha512", name: "SHA512", example: "b109f3bbbc244eb82441917ed06d618b9008dd09b3befd1b5e07394c706a8bb980b1d7785e5976ec049b46df5f1326af5a2ea6d103fd07c95385ffab0cacbc86" },
        { id: "sha224", name: "SHA224" },
        { id: "sha384", name: "SHA384" }
    ],

    // Performance settings
    PERFORMANCE: {
        MAX_WORKERS: navigator.hardwareConcurrency || 4,
        BATCH_SIZE: 5000,
        PROGRESS_INTERVAL_MS: 500
    },

    // Limits
    MAX_HASH_LENGTH: 200,
    MAX_WORDLIST_SIZE_MB: 500, // Support larger files for CTF players

    // Storage keys
    STORAGE_KEYS: {
        RESULTS: "hashCrackResults",
        CUSTOM_WORDLISTS: "hashCrackWordlists"
    }
};

// No console.log here to reduce noise
