import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  NotebookIndexManager,
  NotebookDataStore,
  computeSnippetHash
} from '../../dist/index.js';

const TEMP_PREFIX = 'breadcrumbs-index-manager-';

describe('NotebookIndexManager', () => {
  let workspace: string;
  let store: NotebookDataStore;
  let manager: NotebookIndexManager;

  beforeEach(async () => {
    workspace = await mkdtemp(path.join(tmpdir(), TEMP_PREFIX));
    store = new NotebookDataStore(workspace);
    manager = new NotebookIndexManager(workspace);
  });

  afterEach(async () => {
    await rm(workspace, { recursive: true, force: true });
  });

  async function seedWorkspace(): Promise<void> {
    const snippetSource = 'function compute() { return 7; }';
    const hash = computeSnippetHash(snippetSource);
    await store.saveNote({
      frontmatter: {
        id: 'note-a',
        title: 'Establish Context',
        kind: 'observation',
        tags: ['context'],
        links: [],
        snippet: { hash, language: 'ts' }
      },
      content: 'Gather initial context from the issue tracker.',
      snippet: { code: snippetSource, hash, language: 'ts' }
    });
    await store.saveChain({
      frontmatter: {
        id: 'chain-a',
        title: 'Investigation',
        description: 'Walk through discovery steps.',
        notes: ['note-a'],
        tags: ['workflow']
      },
      content: 'Follow up with stakeholders.'
    });
  }

  it('creates an index with backlinks and caching', async () => {
    await seedWorkspace();
    const index = await manager.refresh();
    expect(index.version).toBe(1);
    expect(index.notes['note-a']).toBeDefined();
    expect(index.notes['note-a'].path).toContain('notes');
    expect(index.backlinks['note-a']).toEqual(['chain-a']);

    const cached = await manager.refresh();
    expect(cached).toBe(index);

    const loaded = await manager.load();
    expect(loaded).toEqual(index);
    const indexPath = path.join(workspace, '.breadcrumbs', 'index.json');
    const raw = await readFile(indexPath, 'utf8');
    expect(raw).toContain('"version": 1');
  });

  it('rebuilds the index when notes change', async () => {
    await seedWorkspace();
    const first = await manager.refresh();
    const newSnippet = 'function compute() { return 8; }';
    const newHash = computeSnippetHash(newSnippet);
    await store.saveNote({
      frontmatter: {
        id: 'note-a',
        title: 'Establish Context',
        kind: 'observation',
        tags: ['context'],
        links: [],
        snippet: { hash: newHash, language: 'ts' }
      },
      content: 'Gather updated context after the customer call.',
      snippet: { code: newSnippet, hash: newHash, language: 'ts' }
    });
    const second = await manager.refresh();
    expect(second).not.toBe(first);
    expect(second.checksum).not.toBe(first.checksum);
  });
});
