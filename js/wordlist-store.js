/**
 * HashCrack - Wordlist download + offline cache.
 *
 * Built-in wordlists are NOT bundled with the page and are never fetched
 * automatically. The user clicks "Download" once; the compressed file is
 * stored in IndexedDB and reused on every later visit (including offline).
 *
 * Remote files live on a static CDN, e.g.
 *   https://cdn.darkmintis.dev/wordlists/rockyou.txt.gz
 *
 * Set HASHCRACK_CONFIG.WORDLIST_CDN to override the base URL (use
 * "wordlists" for local development with the uncompressed 10K/100K files).
 */
(function () {
    'use strict';

    const DEFAULT_CDN = 'https://cdn.darkmintis.dev/wordlists';
    const DB_NAME = 'hashcrack-wordlists';
    const DB_VERSION = 1;
    const FILES_STORE = 'files';
    const META_STORE = 'meta';
    const CACHE_VERSION = 1;

    // Display metadata. `expected` is used to preallocate the parsed array
    // (it is only a hint; parsing tolerates a different line count).
    const LISTS = [
        {
            id: '10k',
            name: 'Common Passwords',
            wordsLabel: '10K',
            downloadLabel: '~40 KB',
            expected: 10000
        },
        {
            id: '100k',
            name: 'Extended Passwords',
            wordsLabel: '100K',
            downloadLabel: '~430 KB',
            expected: 100000
        },
        {
            id: 'rockyou',
            name: 'RockYou',
            wordsLabel: '14.3M',
            downloadLabel: '~52 MB',
            expected: 14344375
        }
    ];

    // Parsed arrays for this session only. They are never written to storage.
    const memoryCache = new Map();
    let dbPromise = null;
    let persistRequested = false;

    function cdnBase() {
        const config = globalThis.HASHCRACK_CONFIG || {};
        const base = (config.WORDLIST_CDN || DEFAULT_CDN).trim();
        return base.replace(/\/+$/, '');
    }

    function buildUrl(id, extension) {
        const base = cdnBase();
        return `${base}/${encodeURIComponent(id)}.${extension}`;
    }

    function formatBytes(bytes) {
        if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB'];
        const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
        const value = bytes / Math.pow(1024, index);
        return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
    }

    function openDB() {
        if (!('indexedDB' in globalThis)) {
            return Promise.reject(new Error('This browser does not support offline storage (IndexedDB).'));
        }
        if (dbPromise) return dbPromise;

        dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(FILES_STORE)) {
                    db.createObjectStore(FILES_STORE, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(META_STORE)) {
                    db.createObjectStore(META_STORE, { keyPath: 'id' });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error('Could not open offline storage.'));
        });
        return dbPromise;
    }

    async function readStore(storeName, id) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly');
            const request = tx.objectStore(storeName).get(id);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    async function readAllMeta() {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(META_STORE, 'readonly');
            const request = tx.objectStore(META_STORE).getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async function writeRecord(fileRecord, metaRecord) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([FILES_STORE, META_STORE], 'readwrite');
            tx.objectStore(FILES_STORE).put(fileRecord);
            tx.objectStore(META_STORE).put(metaRecord);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(tx.error || new Error('Could not save the wordlist.'));
        });
    }

    async function deleteRecord(id) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([FILES_STORE, META_STORE], 'readwrite');
            tx.objectStore(FILES_STORE).delete(id);
            tx.objectStore(META_STORE).delete(id);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    async function requestPersistence() {
        if (persistRequested) return;
        persistRequested = true;
        try {
            if (navigator.storage && navigator.storage.persist) {
                await navigator.storage.persist();
            }
        } catch (error) {
            // Persistence is a best-effort hint; ignore failures.
        }
    }

    /**
     * Fetch a wordlist and save it to IndexedDB.
     * Tries <id>.txt.gz first, then <id>.txt (useful for local development).
     *
     * @param {string} id
     * @param {(progress: {loaded: number, total: number, phase: string}) => void} [onProgress]
     * @returns {Promise<{id: string, bytes: number, compressed: boolean}>}
     */
    async function download(id, onProgress) {
        if (!LISTS.some(list => list.id === id)) {
            throw new Error(`Unknown wordlist: ${id}`);
        }

        const candidates = [
            { url: buildUrl(id, 'txt.gz'), compressed: true },
            { url: buildUrl(id, 'txt'), compressed: false }
        ];

        let response = null;
        let compressed = false;
        let lastError = null;

        for (const candidate of candidates) {
            try {
                const result = await fetch(candidate.url, {
                    mode: 'cors',
                    credentials: 'omit',
                    cache: 'default'
                });
                if (result.ok) {
                    response = result;
                    compressed = candidate.compressed;
                    break;
                }
                if (result.status === 404) {
                    lastError = new Error(`Wordlist "${id}" was not found on the CDN (404).`);
                    continue;
                }
                throw new Error(`Download failed: HTTP ${result.status} ${result.statusText || ''}`.trim());
            } catch (error) {
                // Network/CORS failure: try the next candidate once, then report.
                lastError = error;
            }
        }

        if (!response) {
            throw lastError || new Error('Could not download the wordlist.');
        }

        const total = Number(response.headers.get('Content-Length')) || 0;
        const chunks = [];
        let loaded = 0;
        let isGzip = compressed;

        if (response.body && typeof response.body.getReader === 'function') {
            const reader = response.body.getReader();
            let firstChunk = true;
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (firstChunk && value && value.length >= 2) {
                    // Some servers send Content-Encoding: gzip instead of a .gz file.
                    isGzip = value[0] === 0x1f && value[1] === 0x8b;
                    firstChunk = false;
                }
                chunks.push(value);
                loaded += value.length;
                if (onProgress) onProgress({ loaded, total, phase: 'download' });
            }
        } else {
            const buffer = await response.arrayBuffer();
            const bytes = new Uint8Array(buffer);
            if (bytes.length >= 2) {
                isGzip = bytes[0] === 0x1f && bytes[1] === 0x8b;
            }
            chunks.push(bytes);
            loaded = bytes.length;
            if (onProgress) onProgress({ loaded, total: loaded, phase: 'download' });
        }

        if (loaded === 0) {
            throw new Error('The downloaded wordlist was empty.');
        }

        const blob = new Blob(chunks, { type: isGzip ? 'application/gzip' : 'text/plain' });
        const meta = {
            id,
            bytes: blob.size,
            compressed: isGzip,
            version: CACHE_VERSION,
            downloadedAt: Date.now()
        };

        await requestPersistence();
        await writeRecord({ id, blob, compressed: isGzip }, meta);
        memoryCache.delete(id);

        return { id, bytes: blob.size, compressed: isGzip };
    }

    /**
     * Decompress + parse a stored wordlist. Streams lines so the full
     * decompressed text is never held in memory at once.
     */
    async function parseStored(record, expected) {
        let stream = record.blob.stream();
        if (record.compressed) {
            if (typeof DecompressionStream === 'undefined') {
                throw new Error('This browser cannot decompress gzip files. Please update your browser.');
            }
            stream = stream.pipeThrough(new DecompressionStream('gzip'));
        }

        const reader = stream.getReader();
        const decoder = new TextDecoder();
        const words = expected > 0 ? new Array(expected) : [];
        let count = 0;
        let rest = '';

        const pushLine = (line) => {
            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (!line.length) return;
            if (count < words.length) {
                words[count] = line;
            } else {
                words.push(line);
            }
            count++;
        };

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            rest += decoder.decode(value, { stream: true });

            let start = 0;
            let index;
            while ((index = rest.indexOf('\n', start)) !== -1) {
                pushLine(rest.slice(start, index));
                start = index + 1;
            }
            if (start > 0) rest = rest.slice(start);
        }

        rest += decoder.decode();
        if (rest.length) pushLine(rest);

        words.length = count;
        return words;
    }

    /**
     * Return the parsed words for a downloaded list, or null if the user
     * has not downloaded it yet. Never performs a network request.
     */
    async function getWords(id) {
        if (memoryCache.has(id)) {
            return memoryCache.get(id);
        }

        const meta = await readStore(META_STORE, id);
        if (!meta || meta.version !== CACHE_VERSION) {
            if (meta) await deleteRecord(id);
            return null;
        }

        const record = await readStore(FILES_STORE, id);
        if (!record || !record.blob) {
            await deleteRecord(id);
            return null;
        }

        // Older records stored `compressed` only in the meta store.
        if (typeof record.compressed !== 'boolean') {
            record.compressed = Boolean(meta.compressed);
        }

        const definition = LISTS.find(list => list.id === id);
        const words = await parseStored(record, definition ? definition.expected : 0);
        memoryCache.set(id, words);
        return words;
    }

    async function has(id) {
        const meta = await readStore(META_STORE, id);
        return Boolean(meta && meta.version === CACHE_VERSION);
    }

    async function list() {
        const all = await readAllMeta();
        return all.filter(meta => meta.version === CACHE_VERSION);
    }

    async function remove(id) {
        memoryCache.delete(id);
        await deleteRecord(id);
    }

    async function clear() {
        memoryCache.clear();
        const all = await readAllMeta();
        for (const meta of all) {
            await deleteRecord(meta.id);
        }
    }

    async function estimate() {
        try {
            if (navigator.storage && navigator.storage.estimate) {
                return await navigator.storage.estimate();
            }
        } catch (error) {
            // ignore
        }
        return null;
    }

    globalThis.wordlistStore = {
        LISTS,
        download,
        getWords,
        has,
        list,
        remove,
        clear,
        estimate,
        formatBytes,
        cdnBase
    };
})();
