import path from 'node:path';
import { validateNotebookIndex } from './schema.js';
import type { ChainSummary, NotebookIndex, NoteSummary } from './types.js';
import { NotebookDataStore } from './store.js';
import { computeSnippetHash } from './hash.js';
import { getFileSignature, readFileIfExists, writeFileAtomic } from './fs.js';

function toRelative(root: string, filePath: string): string {
  return path.relative(root, filePath) || filePath;
}

function sortIds(values: Iterable<string>): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

/**
 * Manage the derived notebook index stored on disk with caching and integrity checks.
 */
export class NotebookIndexManager {
  private readonly indexPath: string;
  private readonly store: NotebookDataStore;
  private cache?: NotebookIndex;
  private signatures = new Map<string, string>();

  constructor(private readonly workspaceRoot: string) {
    this.indexPath = path.join(workspaceRoot, '.breadcrumbs', 'index.json');
    this.store = new NotebookDataStore(workspaceRoot);
  }

  async load(): Promise<NotebookIndex | undefined> {
    if (this.cache) {
      return this.cache;
    }
    const raw = await readFileIfExists(this.indexPath);
    if (!raw) {
      return undefined;
    }
    const parsed = validateNotebookIndex(JSON.parse(raw));
    const notes = await this.store.listNotes();
    const chains = await this.store.listChains();
    const expectedChecksum = this.computeChecksum(notes, chains);
    if (parsed.checksum !== expectedChecksum) {
      return this.refresh(true, { notes, chains });
    }
    this.cache = parsed;
    this.signatures = await this.captureSignatures(notes, chains);
    return parsed;
  }

  async refresh(
    force = false,
    existing?: { readonly notes: NoteSummary[]; readonly chains: ChainSummary[] }
  ): Promise<NotebookIndex> {
    const notes = existing?.notes ?? (await this.store.listNotes());
    const chains = existing?.chains ?? (await this.store.listChains());
    const signatures = await this.captureSignatures(notes, chains);
    if (!force && this.cache && this.sameSignatures(signatures)) {
      return this.cache;
    }
    const index = this.buildIndex(notes, chains);
    await writeFileAtomic(this.indexPath, `${JSON.stringify(index, null, 2)}\n`);
    this.cache = index;
    this.signatures = signatures;
    return index;
  }

  private async captureSignatures(
    notes: readonly NoteSummary[],
    chains: readonly ChainSummary[]
  ): Promise<Map<string, string>> {
    const signatures = new Map<string, string>();
    for (const summary of notes) {
      const signature = await getFileSignature(summary.path);
      const payload = {
        type: 'note' as const,
        id: summary.id,
        title: summary.title,
        kind: summary.kind,
        tags: Array.from(summary.tags),
        snippetHash: summary.snippetHash ?? null,
        snippetCommit: summary.snippetCommit ?? null,
        fileSignature: signature ?? null
      };
      signatures.set(summary.path, JSON.stringify(payload));
    }
    for (const summary of chains) {
      const signature = await getFileSignature(summary.path);
      const payload = {
        type: 'chain' as const,
        id: summary.id,
        title: summary.title,
        notes: Array.from(summary.notes),
        tags: Array.from(summary.tags),
        fileSignature: signature ?? null
      };
      signatures.set(summary.path, JSON.stringify(payload));
    }
    return signatures;
  }

  private sameSignatures(next: Map<string, string>): boolean {
    if (this.signatures.size !== next.size) {
      return false;
    }
    for (const [file, signature] of next) {
      if (this.signatures.get(file) !== signature) {
        return false;
      }
    }
    return true;
  }

  private computeChecksum(notes: readonly NoteSummary[], chains: readonly ChainSummary[]): string {
    const normalized = {
      notes: [...notes]
        .map((note) => ({
          id: note.id,
          title: note.title,
          kind: note.kind,
          tags: Array.from(note.tags),
          snippetHash: note.snippetHash,
          snippetCommit: note.snippetCommit
        }))
        .sort((a, b) => a.id.localeCompare(b.id)),
      chains: [...chains]
        .map((chain) => ({
          id: chain.id,
          title: chain.title,
          notes: Array.from(chain.notes),
          tags: Array.from(chain.tags)
        }))
        .sort((a, b) => a.id.localeCompare(b.id))
    };
    return computeSnippetHash(JSON.stringify(normalized));
  }

  private buildIndex(notes: readonly NoteSummary[], chains: readonly ChainSummary[]): NotebookIndex {
    const checksum = this.computeChecksum(notes, chains);
    const generatedAt = new Date().toISOString();
    const noteEntries = Object.fromEntries(
      [...notes]
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((note) => [
          note.id,
          {
            id: note.id,
            title: note.title,
            kind: note.kind,
            tags: Array.from(note.tags),
            path: toRelative(this.workspaceRoot, note.path),
            snippetHash: note.snippetHash,
            snippetCommit: note.snippetCommit
          }
        ])
    );
    const chainEntries = Object.fromEntries(
      [...chains]
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((chain) => [
          chain.id,
          {
            id: chain.id,
            title: chain.title,
            notes: Array.from(chain.notes),
            tags: Array.from(chain.tags),
            path: toRelative(this.workspaceRoot, chain.path)
          }
        ])
    );
    const backlinks: Record<string, string[]> = {};
    for (const note of notes) {
      backlinks[note.id] = [];
    }
    for (const chain of chains) {
      for (const noteId of chain.notes) {
        const list = backlinks[noteId] ?? (backlinks[noteId] = []);
        list.push(chain.id);
      }
    }
    for (const key of Object.keys(backlinks)) {
      backlinks[key] = sortIds(backlinks[key]);
    }
    return {
      version: 1,
      generatedAt,
      notes: noteEntries,
      chains: chainEntries,
      backlinks,
      checksum
    };
  }
}
