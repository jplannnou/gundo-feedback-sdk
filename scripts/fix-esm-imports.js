/**
 * Post-build script: adds .js extensions to relative imports in dist/*.js files.
 * Required because tsc with "module":"ESNext"+"moduleResolution":"bundler" omits extensions,
 * but ESM consumers (Vite/Rollup) need them for proper resolution from node_modules.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const DIST = 'dist';
const IMPORT_RE = /(from\s+['"])(\.\.?\/[^'"]+?)(?<!\.[a-z]+)(['"])/g;
const EXPORT_RE = /(export\s+.*?from\s+['"])(\.\.?\/[^'"]+?)(?<!\.[a-z]+)(['"])/g;

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.name.endsWith('.js')) files.push(full);
  }
  return files;
}

let fixed = 0;
for (const file of walk(DIST)) {
  let content = readFileSync(file, 'utf8');
  const original = content;
  content = content.replace(IMPORT_RE, '$1$2.js$3');
  content = content.replace(EXPORT_RE, '$1$2.js$3');
  if (content !== original) {
    writeFileSync(file, content);
    fixed++;
  }
}

console.log(`fix-esm-imports: ${fixed} files updated`);
