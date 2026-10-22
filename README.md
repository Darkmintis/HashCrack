# HashCrack

Client-side hash cracking for CTF players and security researchers. HashCrack
runs entirely in the browser and is a quick alternative to John the Ripper or
Hashcat for dictionary attacks during a CTF.

## Features

- **100% client-side**: hashes and candidate passwords never leave the browser
- **Web Worker cracking**: uses all available CPU cores
- **20+ hash types**: MD5, SHA1, SHA256, SHA512, bcrypt, Argon2, archive hashes,
  and more
- **On-demand wordlists**: 10K, 100K, and RockYou are downloaded only when you
  click Download, then cached in IndexedDB for offline reuse
- **Custom wordlists**: upload your own `.txt` file
- **Automatic hash detection**
- **Local result history** and real-time progress

## Supported hash types

HashCrack can detect and crack the following hash types:

| Hash Type | Description | Example/Format |
|-----------|-------------|----------------|
| MD5 | 32 hexadecimal characters | `5f4dcc3b5aa765d61d8327deb882cf99` |
| SHA1 | 40 hexadecimal characters | `5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8` |
| SHA224 | 56 hexadecimal characters | `d14a028c2a3a2bc9476102bb288234c415a2b01f828ea62ac5b3e42f` |
| SHA256 | 64 hexadecimal characters | `5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8` |
| SHA384 | 96 hexadecimal characters | `a8b64babd0aca91a59bdbb7761b421d4f2bb38280d3a75ba0f21f2bebc45583d446c598660c94ce680c47d19c30783a7` |
| SHA512 | 128 hexadecimal characters | `b109f3bbbc244eb82441917ed06d618b9008dd09b3befd1b5e07394c706a8bb980b1d7785e5976ec049b46df5f1326af5a2ea6d103fd07c95385ffab0cacbc86` |
| MD5 Crypt | Starts with `$1$` | `$1$salt$hash` |
| bcrypt | Starts with `$2a$` or `$2b$` | `$2a$10$salt_and_hash` |
| SHA-256 Crypt | Starts with `$5$` | `$5$salt$hash` |
| SHA-512 Crypt | Starts with `$6$` | `$6$salt$hash` |
| NTLM | 32 hexadecimal characters | `8846F7EAEE8FB117AD06BDD830B7586C` |
| MySQL-SHA1 | `*` followed by 40 hex characters | `*2470C0C06DEE42FD1618BB99005ADCA2EC9D1E19` |
| PBKDF2 | Implementation-dependent | `$pbkdf2$iterations$salt$hash` |
| yescrypt | Modern password hashing | `$y$params$salt$hash` |
| Argon2 | PHC winner | `$argon2id$v=19$m=65536,t=3,p=4$salt$hash` |
| scrypt | Memory-hard hashing | `$scrypt$params$salt$hash` |
| NetNTLMv2 | Windows authentication | `hash:challenge` |
| WPA-PMKID | Wi-Fi password hashing | `pmkid*mac1*mac2` |

### Computationally intensive formats

These are supported but may be slow in a browser:

| Hash Type | Description | Format |
|-----------|-------------|--------|
| KeePass KDBX | Password manager format | `kdbx:<version>:<iterations>:<salt_base64>:<header_hash>` |
| 7z | Archive format | `7z:<salt_hex>:<iterations>:<chash>` |
| RAR5 | Archive format | `rar5:<iterations>:<salt_hex>:<checkval_hex>` |
| PDF | Document encryption | `pdf:<version>:<algorithm>:<iterations>:<salt_hex>:<u_hex>:<o_hex>` |

> Memory-hard algorithms use a high-iteration PBKDF2 fallback when the browser
> does not provide a suitable native implementation.

## Quick start

```bash
git clone https://github.com/Darkmintis/HashCrack.git
cd HashCrack
python3 -m http.server 8080
# Windows: py -m http.server 8080
```

Open <http://localhost:8080>. Any static file server works, but use port 8080:
the default CDN's CORS policy allows `localhost:8080` and `127.0.0.1:8080`.
Do not open `index.html` through `file://` because the wordlist downloads use
`fetch`. The same page runs standalone at `/` or under a subpath such as
`/hashcrack/`.

For local development, `config.js` can point `WORDLIST_CDN` at `"wordlists"` to
use the uncompressed 10K/100K files in this repository. RockYou requires the
generated gzip file or the public CDN.

## Wordlists

The page does **not** fetch a wordlist on load. The Offline downloads panel shows
a Download button for each list. Clicking it downloads a gzip file from the
configured CDN, stores it in IndexedDB, and reuses it on later visits, including
offline.

`config.js` controls the CDN base URL:

```js
WORDLIST_CDN: "https://cdn.darkmintis.dev/wordlists"
```

The default is a public read-only mirror. Self-hosters should set
`WORDLIST_CDN` to their own static host and upload these files:

```text
10k.txt.gz
100k.txt.gz
rockyou.txt.gz
```

Generate the gzip files from the wordlists in this repository:

```bash
node scripts/prepare-wordlists.mjs
```

The script writes `wordlists-gz/*.txt.gz` and concatenates the two RockYou parts
into one stream. Serve the `.gz` files with `Content-Type: application/gzip`;
do **not** add `Content-Encoding: gzip`, because the browser decompresses the
payload with `DecompressionStream`.

Custom `.txt` wordlists can be uploaded directly in the UI.

## Architecture

- **Frontend**: HTML, CSS, and vanilla JavaScript
- **Hashing**: CryptoJS loaded from a pinned CDN version
- **Parallelism**: Web Workers
- **Wordlists**: gzip from a static CDN, parsed in the browser, cached in
  IndexedDB
- **Results**: localStorage

## File structure

```text
HashCrack/
  index.html
  config.js
  css/style.css
  js/
    hash-cracker.js
    app.js
    offline.js
    wordlist-store.js
  scripts/prepare-wordlists.mjs
  wordlists/            # source .txt files (not all deployed)
  wordlists-gz/         # generated gzip files (gitignored)
```

## Performance

- **MD5**: roughly 500K attempts/second on a 4-core desktop
- **SHA256**: roughly 150K attempts/second on a 4-core desktop
- **SHA512**: roughly 80K attempts/second on a 4-core desktop
- **RockYou parse**: about 2 seconds on a modern desktop (14.3M lines)
- **Repeat visits**: no re-download; the gzip stays in IndexedDB
- **Memory**: scales with the selected list. RockYou needs several hundred MB
  while cracking, so prefer 10K/100K on low-memory devices.

## Adding hash types

1. Update `detectHashType()` in `js/hash-cracker.js`.
2. Add the hash function to the `hashFunctions` object.
3. Test with known hash samples.

## Contributing

Contributions are welcome for new hash algorithms, performance improvements,
wordlists, and bug fixes.

## License

MIT License. See [LICENSE](LICENSE).

## Security notice

HashCrack is intended for authorized penetration testing, CTF competitions, and
educational use. You are responsible for having permission before testing any
system.
