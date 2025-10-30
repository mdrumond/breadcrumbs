import path from 'node:path';
import {
  deleteIfExists,
  ensureDirectory,
  listFiles,
  readFileIfExists,
  writeFileAtomic
} from './fs.js';
import { parseNoteMarkdown, serializeNoteMarkdown } from './note.js';
import { parseChainMarkdown, serializeChainMarkdown } from './chain.js';
import type { BreadcrumbChain, BreadcrumbNote, ChainSummary, NoteSummary } from './types.js';
import { slugifyId } from './utils.js';

const NOTE_EXTENSION = '.md';
const CHAIN_EXTENSION = '.chain.md';

/**
 * Provide CRUD access to filesystem-backed notes and chains.
 */
export class NotebookDataStore {
  private readonly notesDirectory: string;
  private readonly chainsDirectory: string;

  constructor(private readonly workspaceRoot: string) {
    const breadcrumbsRoot = path.join(workspaceRoot, '.breadcrumbs');
    this.notesDirectory = path.join(breadcrumbsRoot, 'notes');
    this.chainsDirectory = path.join(breadcrumbsRoot, 'chains');
  }

  private notePath(id: string): string {
    return path.join(this.notesDirectory, `${slugifyId(id)}${NOTE_EXTENSION}`);
  }

  private chainPath(id: string): string {
    return path.join(this.chainsDirectory, `${slugifyId(id)}${CHAIN_EXTENSION}`);
  }

  async saveNote(note: BreadcrumbNote): Promise<string> {
    const filePath = this.notePath(note.frontmatter.id);
    const serialized = serializeNoteMarkdown(note);
    await writeFileAtomic(filePath, serialized);
    return filePath;
  }

  async readNote(id: string): Promise<BreadcrumbNote | undefined> {
    const filePath = this.notePath(id);
    const raw = await readFileIfExists(filePath);
    if (!raw) {
      return undefined;
    }
    return parseNoteMarkdown(raw);
  }

  async deleteNote(id: string): Promise<void> {
    await deleteIfExists(this.notePath(id));
  }

  async listNotes(): Promise<NoteSummary[]> {
    await ensureDirectory(this.notesDirectory);
    const files = await listFiles(this.notesDirectory);
    const summaries: NoteSummary[] = [];
    for (const file of files) {
      if (!file.endsWith(NOTE_EXTENSION)) {
        continue;
      }
      const raw = await readFileIfExists(file);
      if (!raw) {
        continue;
      }
      const note = parseNoteMarkdown(raw);
      summaries.push({
        id: note.frontmatter.id,
        title: note.frontmatter.title,
        kind: note.frontmatter.kind,
        tags: note.frontmatter.tags,
        path: file,
        snippetHash: note.frontmatter.snippet?.hash,
        snippetCommit: note.frontmatter.snippet?.commit
      });
    }
    return summaries;
  }

  async saveChain(chain: BreadcrumbChain): Promise<string> {
    const filePath = this.chainPath(chain.frontmatter.id);
    const serialized = serializeChainMarkdown(chain);
    await writeFileAtomic(filePath, serialized);
    return filePath;
  }

  async readChain(id: string): Promise<BreadcrumbChain | undefined> {
    const filePath = this.chainPath(id);
    const raw = await readFileIfExists(filePath);
    if (!raw) {
      return undefined;
    }
    return parseChainMarkdown(raw);
  }

  async deleteChain(id: string): Promise<void> {
    await deleteIfExists(this.chainPath(id));
  }

  async listChains(): Promise<ChainSummary[]> {
    await ensureDirectory(this.chainsDirectory);
    const files = await listFiles(this.chainsDirectory);
    const summaries: ChainSummary[] = [];
    for (const file of files) {
      if (!file.endsWith(CHAIN_EXTENSION)) {
        continue;
      }
      const raw = await readFileIfExists(file);
      if (!raw) {
        continue;
      }
      const chain = parseChainMarkdown(raw);
      summaries.push({
        id: chain.frontmatter.id,
        title: chain.frontmatter.title,
        notes: chain.frontmatter.notes,
        path: file,
        tags: chain.frontmatter.tags
      });
    }
    return summaries;
  }
}
