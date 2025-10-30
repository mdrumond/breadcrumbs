import { describe, expect, it } from 'vitest';
import { computeSnippetHash, parseNoteMarkdown, serializeNoteMarkdown } from '../../dist/index.js';

const SAMPLE_SNIPPET = "console.log('hello world');";
const SAMPLE_HASH = computeSnippetHash(SAMPLE_SNIPPET);

const SAMPLE_NOTE = `---
id: note-1
title: Inspect Logs
kind: analysis
createdAt: 2024-01-01T10:00:00.000Z
updatedAt: 2024-01-01T10:15:00.000Z
tags:
  - logs
links:
  - docs/logging
snippet:
  hash: ${SAMPLE_HASH}
  language: ts
---
Review the error budget dashboard and capture unusual spikes.

\`\`\`ts
${SAMPLE_SNIPPET}
\`\`\`
`;

describe('parseNoteMarkdown', () => {
  it('parses frontmatter, markdown, and snippet content', () => {
    const note = parseNoteMarkdown(SAMPLE_NOTE);
    expect(note.frontmatter.id).toBe('note-1');
    expect(note.frontmatter.kind).toBe('analysis');
    expect(note.frontmatter.tags).toEqual(['logs']);
    expect(note.snippet?.code).toContain('console.log');
    expect(note.snippet?.hash).toBe(SAMPLE_HASH);
  });

  it('rejects missing snippet content when metadata exists', () => {
    const invalid = [
      '---',
      'id: note-2',
      'title: Missing Snippet',
      'kind: task',
      'snippet:',
      `  hash: ${SAMPLE_HASH}`,
      '---',
      'Body only.'
    ].join('\n');
    expect(() => parseNoteMarkdown(invalid)).toThrow(/Snippet metadata declared/);
  });
});

describe('serializeNoteMarkdown', () => {
  it('round-trips a parsed note', () => {
    const parsed = parseNoteMarkdown(SAMPLE_NOTE);
    const serialized = serializeNoteMarkdown(parsed);
    const reparsed = parseNoteMarkdown(serialized);
    expect(reparsed.frontmatter).toEqual(parsed.frontmatter);
    expect(reparsed.snippet?.code).toBe(parsed.snippet?.code);
  });

  it('validates snippet hashes before serialization', () => {
    const parsed = parseNoteMarkdown(SAMPLE_NOTE);
    const modified = {
      ...parsed,
      snippet: parsed.snippet && { ...parsed.snippet, hash: 'deadbeef' }
    };
    expect(() => serializeNoteMarkdown(modified)).toThrow(/Snippet hash mismatch/);
  });
});
