#!/usr/bin/env node
/**
 * Build gzip-compressed wordlists for the R2 CDN.
 *
 * Output: wordlists-gz/<id>.txt.gz
 *
 *   node scripts/prepare-wordlists.mjs
 *
 * The two RockYou parts are concatenated into a single rockyou.txt.gz so the
 * browser only downloads, decompresses and parses one stream. (The split has
 * only a handful of duplicate lines; runtime duplicate removal is unnecessary.)
 *
 * Then upload the files with Wrangler (see README) or any S3-compatible tool.
 */
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inputDir = path.join(root, 'wordlists');
const outputDir = path.join(root, 'wordlists-gz');

const lists = [
    { id: '10k', parts: ['10k.txt'] },
    { id: '100k', parts: ['100k.txt'] },
    { id: 'rockyou', parts: ['rockyou1.txt', 'rockyou2.txt'] }
];

function formatBytes(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
}

async function sha256(file) {
    const hash = createHash('sha256');
    for await (const chunk of createReadStream(file)) hash.update(chunk);
    return hash.digest('hex');
}

async function buildList({ id, parts }) {
    const output = path.join(outputDir, `${id}.txt.gz`);

    async function* source() {
        for (const part of parts) {
            const file = path.join(inputDir, part);
            await stat(file); // fail early with a clear error
            for await (const chunk of createReadStream(file)) {
                yield chunk;
            }
            // Make sure the next part starts on a new line. An extra blank
            // line is ignored by the parser.
            yield Buffer.from('\n');
        }
    }

    await pipeline(Readable.from(source()), createGzip({ level: 9 }), createWriteStream(output));

    const { size } = await stat(output);
    const hash = await sha256(output);
    return { id, file: path.basename(output), bytes: size, sha256: hash };
}

async function main() {
    await mkdir(outputDir, { recursive: true });

    const manifest = {
        generatedAt: new Date().toISOString(),
        files: []
    };

    for (const list of lists) {
        process.stdout.write(`Compressing ${list.id}... `);
        const result = await buildList(list);
        manifest.files.push(result);
        console.log(`${formatBytes(result.bytes)} (${result.file})`);
    }

    await writeFile(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    console.log(`\nDone. Files are in ${outputDir}`);
    console.log('Upload them to R2 with Wrangler (see README) or your S3 client.');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
