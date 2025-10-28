#!/usr/bin/env node
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

/**
 * Recursively gather file paths for linting.
 * @param {string} base - Directory to traverse.
 * @returns {string[]} Absolute file paths.
 */
function collectFiles(base) {
  /** @type {string[]} */
  const files = [];
  for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
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

/**
 * Determine whether the line index has a TSDoc comment immediately before it.
 * @param {string[]} lines - Source lines.
 * @param {number} index - Line index of the declaration.
 * @returns {boolean} Whether a TSDoc comment is found.
 */
function hasTsDoc(lines, index) {
  let i = index - 1;
  while (i >= 0) {
    const trimmed = lines[i].trim();
    if (trimmed.length === 0) {
      i -= 1;
      continue;
    }
    if (trimmed === '*/' || trimmed.startsWith('*')) {
      i -= 1;
      continue;
    }
    return trimmed.startsWith('/**');
  }
  return false;
}

/**
 * Run the lint checks for a single file.
 * @param {string} filePath - Absolute path to lint.
 * @returns {string[]} A list of error messages.
 */
function lintFile(filePath) {
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

const root = process.cwd();
const files = collectFiles(root);
/** @type {string[]} */
let allErrors = [];
for (const file of files) {
  allErrors = allErrors.concat(lintFile(file));
}

if (allErrors.length > 0) {
  for (const error of allErrors) {
    console.error(error);
  }
  process.exitCode = 1;
} else {
  console.log('Lint checks passed.');
}
