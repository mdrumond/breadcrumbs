#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const MAX_LINE_LENGTH = 120;
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs']);
const IGNORE_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  'dist',
  'coverage',
  '.vscode-test',
  '.vscode',
  '.breadcrumbs'
]);

function runEslint() {
  const result = spawnSync('eslint', ['.', '--max-warnings=0'], {
    encoding: 'utf8'
  });
  if (result.error && result.error.code === 'ENOENT') {
    return { success: false, fallback: true };
  }
  if (typeof result.status === 'number' && result.status === 0) {
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    return { success: true, fallback: false };
  }
  const combined = `${result.stdout}\n${result.stderr}`;
  const missingPlugin =
    /Cannot find (?:module|package)/.test(combined) ||
    /Failed to load plugin|Parsing error/.test(combined);
  if (missingPlugin) {
    console.warn('ESLint execution failed because required plugins are unavailable.');
    return { success: false, fallback: true };
  }
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  process.exit(result.status ?? 1);
}

function collectFiles(base) {
  const entries = fs.readdirSync(base, { withFileTypes: true });
  /** @type {string[]} */
  const files = [];
  for (const entry of entries) {
    if (IGNORE_DIRECTORIES.has(entry.name)) {
      continue;
    }
    const fullPath = path.join(base, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath));
    } else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function hasTsDoc(lines, index) {
  let pointer = index - 1;
  while (pointer >= 0) {
    const trimmed = lines[pointer].trim();
    if (trimmed.length === 0) {
      pointer -= 1;
      continue;
    }
    if (trimmed === '*/' || trimmed.startsWith('*')) {
      pointer -= 1;
      continue;
    }
    return trimmed.startsWith('/**');
  }
  return false;
}

function lintFile(filePath) {
  if (filePath.endsWith('.d.ts')) {
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  /** @type {string[]} */
  const errors = [];

  lines.forEach((line, index) => {
    if (line.length > MAX_LINE_LENGTH) {
      errors.push(`${filePath}:${index + 1} exceeds ${MAX_LINE_LENGTH} characters`);
    }
    if (/\s+$/.test(line)) {
      errors.push(`${filePath}:${index + 1} has trailing whitespace`);
    }
  });

  const exportPatterns = [
    /export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/,
    /export\s+class\s+([A-Za-z0-9_]+)/,
    /export\s+interface\s+([A-Za-z0-9_]+)/,
    /export\s+type\s+([A-Za-z0-9_]+)/,
    /export\s+const\s+([A-Za-z0-9_]+)\s*=\s*\(/,
    /export\s+const\s+([A-Za-z0-9_]+)\s*=\s*async\s*\(/,
    /export\s+const\s+([A-Za-z0-9_]+)\s*=\s*<[^>]+>\s*\(/,
    /export\s+const\s+([A-Za-z0-9_]+)\s*=\s*[^=]*=>/
  ];

  lines.forEach((line, index) => {
    for (const pattern of exportPatterns) {
      if (pattern.test(line)) {
        if (!hasTsDoc(lines, index)) {
          errors.push(`${filePath}:${index + 1} is missing a TSDoc comment`);
        }
        break;
      }
    }
  });

  return errors;
}

const result = runEslint();
if (result?.success) {
  process.exit(0);
}

if (!result?.fallback) {
  process.exit(1);
}

console.warn('Running fallback static analysis checks...');
const root = process.cwd();
const files = collectFiles(root);
let allErrors = [];
for (const file of files) {
  allErrors = allErrors.concat(lintFile(file));
}

if (allErrors.length > 0) {
  for (const error of allErrors) {
    console.error(error);
  }
  process.exit(1);
}

console.log('Fallback lint checks passed.');
