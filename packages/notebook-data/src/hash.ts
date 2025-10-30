import { createHash } from 'node:crypto';

/**
 * Compute a deterministic SHA-256 hash for snippet content.
 */
export function computeSnippetHash(source: string): string {
  return createHash('sha256').update(source, 'utf8').digest('hex');
}
