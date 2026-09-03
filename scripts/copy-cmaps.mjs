import { cp, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'node_modules', 'pdfjs-dist', 'cmaps');
const target = path.join(root, 'public', 'cmaps');

if (!existsSync(source)) {
  console.warn('pdfjs-dist cmaps directory not found; run npm install first.');
  process.exit(0);
}
await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true, force: true });
console.log('Copied PDF.js CMaps to public/cmaps');
