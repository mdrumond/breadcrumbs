#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const userArgs = process.argv.slice(2);
const MODE = userArgs.includes('--write') ? '--write' : '--check';
const TARGETS = userArgs.filter((arg) => !['--write', '--check'].includes(arg));
const CLI_ARGS = [MODE, ...(TARGETS.length > 0 ? TARGETS : ['.'])];

function runPrettier() {
  const result = spawnSync('prettier', CLI_ARGS, {
    encoding: 'utf8',
    stdio: 'pipe'
  });

  if (result.error && result.error.code === 'ENOENT') {
    return { success: false, fallback: true };
  }

  if (typeof result.status === 'number' && result.status === 0) {
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    return { success: true, fallback: false };
  }

  if (MODE === '--check') {
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    console.warn('Prettier CLI reported differences; using heuristic formatting checks instead.');
    return { success: false, fallback: true };
  }

  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  process.exit(result.status ?? 1);
}

const TEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.cjs',
  '.mjs',
  '.json',
  '.md',
  '.yml',
  '.yaml',
  '.css',
  '.html',
  '.scss',
  '.less'
]);

const IGNORE_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  'dist',
  'coverage',
  '.vscode-test',
  '.vscode',
  '.breadcrumbs'
]);

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
    } else if (TEXT_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function checkJsonFormatting(filePath, content) {
  const errors = [];
  try {
    JSON.parse(content);
  } catch (error) {
    errors.push(
      `${filePath} is not valid JSON (${error instanceof Error ? error.message : 'unknown error'})`
    );
    return errors;
  }

  const lines = content.split(/\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim().length === 0) {
      continue;
    }
    const match = line.match(/^\s*/u);
    const leading = match ? match[0] : '';
    if (/\t/.test(leading)) {
      errors.push(`${filePath}:${index + 1} uses tab indentation`);
    }
    if (leading.length % 2 !== 0) {
      errors.push(`${filePath}:${index + 1} is not indented with multiples of two spaces`);
    }
  }

  return errors;
}

function checkTextFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  /** @type {string[]} */
  const errors = [];
  if (content.length > 0 && !content.endsWith('\n')) {
    errors.push(`${filePath} is missing a trailing newline`);
  }
  if (content.includes('\r')) {
    errors.push(`${filePath} contains carriage return characters`);
  }

  const lines = content.split(/\n/);
  lines.forEach((line, index) => {
    if (/\s+$/.test(line)) {
      errors.push(`${filePath}:${index + 1} has trailing whitespace`);
    }
  });

  if (filePath.endsWith('.json')) {
    errors.push(...checkJsonFormatting(filePath, content));
  }

  return errors;
}

if (MODE === '--write') {
  const result = runPrettier();
  if (result?.success) {
    process.exit(0);
  }
  if (result?.fallback) {
    console.warn('Prettier CLI is unavailable; automatic formatting cannot be applied.');
    process.exit(1);
  }
}

const result = runPrettier();
if (result?.success) {
  process.exit(0);
}

if (!result?.fallback) {
  process.exit(1);
}

console.warn('Prettier CLI is unavailable. Running fallback formatting checks...');

const files = collectFiles(process.cwd());
let errors = [];
for (const file of files) {
  errors = errors.concat(checkTextFile(file));
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(error);
  }
  process.exit(1);
}

console.log('Fallback formatting checks passed.');
