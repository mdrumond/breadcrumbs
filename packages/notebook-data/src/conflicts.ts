import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { computeSnippetHash } from './hash.js';
import type { ConflictResult } from './types.js';

const execFileAsync = promisify(execFile);

/**
 * Resolve the current Git commit for anchoring note metadata.
 */
export async function resolveGitCommit(directory = process.cwd()): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: directory });
    const commit = stdout.trim();
    return commit.length > 0 ? commit : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Compare expected snippet hash metadata with candidate content to surface conflicts.
 */
export function detectSnippetConflict(
  expectedHash: string | undefined,
  candidateSnippet: string | undefined
): ConflictResult {
  if (!candidateSnippet || candidateSnippet.trim().length === 0) {
    if (!expectedHash) {
      return { status: 'clean' };
    }
    return {
      status: 'missing-snippet',
      expectedHash,
      message: 'Snippet content is missing while an expected hash was provided.'
    };
  }
  const actualHash = computeSnippetHash(candidateSnippet);
  if (!expectedHash || expectedHash === actualHash) {
    return { status: 'clean', expectedHash, actualHash };
  }
  return {
    status: 'hash-mismatch',
    expectedHash,
    actualHash,
    message: 'Snippet hash mismatch detected.'
  };
}
