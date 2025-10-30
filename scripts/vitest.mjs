#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const TEST_PATTERNS = [/\.test\.ts$/i, /\.spec\.ts$/i];
const IGNORE_DIRECTORIES = new Set(['node_modules', 'dist', 'coverage', '.git']);

function isTestFile(filePath) {
  return TEST_PATTERNS.some((pattern) => pattern.test(filePath));
}

function collectTests(base) {
  /** @type {string[]} */
  const files = [];
  for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
    if (IGNORE_DIRECTORIES.has(entry.name)) {
      continue;
    }
    const fullPath = path.join(base, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTests(fullPath));
    } else if (isTestFile(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

const projectRoot = process.cwd();
const buildResult = spawnSync('npm', ['run', 'build'], { stdio: 'inherit' });
if (typeof buildResult.status === 'number' && buildResult.status !== 0) {
  process.exit(buildResult.status);
}
const tests = collectTests(path.join(projectRoot, 'packages'));
if (tests.length === 0) {
  console.log('No test files found.');
  process.exit(0);
}

const registerPath = path.join(projectRoot, 'scripts', 'register-vitest.mjs');
const nodePath = [path.join(projectRoot, 'packages'), process.env.NODE_PATH]
  .filter(Boolean)
  .join(path.delimiter);

let failed = false;
for (const file of tests) {
  const result = spawnSync(
    process.execPath,
    ['--import', registerPath, '--experimental-strip-types', file],
    {
      stdio: 'inherit',
      env: { ...process.env, NODE_PATH: nodePath }
    }
  );
  if (typeof result.status === 'number' && result.status !== 0) {
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}
