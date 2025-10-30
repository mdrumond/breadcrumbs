import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { computeSnippetHash, NotebookDataStore } from '../../dist/index.js';

const TEMP_PREFIX = 'breadcrumbs-notebook-data-';

describe('NotebookDataStore', () => {
  let workspace: string;
  let store: NotebookDataStore;

  beforeEach(async () => {
    workspace = await mkdtemp(path.join(tmpdir(), TEMP_PREFIX));
    store = new NotebookDataStore(workspace);
  });

  afterEach(async () => {
    await rm(workspace, { recursive: true, force: true });
  });

  it('saves, reads, and lists notes and chains', async () => {
    const snippetSource = 'export const answer = 42;';
    const snippetHash = computeSnippetHash(snippetSource);
    const note = {
      frontmatter: {
        id: 'note-one',
        title: 'Capture Observation',
        kind: 'observation' as const,
        tags: ['observability'],
        links: [],
        createdAt: '2024-02-01T09:00:00.000Z',
        updatedAt: '2024-02-01T09:15:00.000Z',
        snippet: {
          hash: snippetHash,
          language: 'ts'
        }
      },
      content: 'Document the anomaly spotted in the deployment logs.',
      snippet: {
        code: snippetSource,
        hash: snippetHash,
        language: 'ts'
      }
    };
    const chain = {
      frontmatter: {
        id: 'chain-one',
        title: 'Mitigation Plan',
        description: 'Steps taken to address the observed anomaly.',
        notes: ['note-one'],
        tags: ['remediation']
      },
      content: 'Assign remediation tasks to the on-call engineer.'
    };

    await store.saveNote(note);
    await store.saveChain(chain);

    const storedNote = await store.readNote('note-one');
    expect(storedNote?.frontmatter.title).toBe('Capture Observation');
    expect(storedNote?.snippet?.hash).toBe(snippetHash);

    const notes = await store.listNotes();
    expect(notes).toHaveLength(1);
    expect(notes[0].id).toBe('note-one');
    expect(path.basename(notes[0].path)).toBe('note-one.md');

    const chains = await store.listChains();
    expect(chains).toHaveLength(1);
    expect(chains[0].notes).toEqual(['note-one']);

    await store.deleteNote('note-one');
    const missing = await store.readNote('note-one');
    expect(missing).toBeUndefined();
  });
});
