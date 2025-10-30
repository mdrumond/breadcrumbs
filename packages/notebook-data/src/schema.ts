import type { BreadcrumbNodeKind } from '@breadcrumbs/core';
import type {
  ChainFrontmatter,
  ChainIndexEntry,
  NotebookIndex,
  NoteFrontmatter,
  NoteIndexEntry,
  NoteSnippetMeta
} from './types.js';

const SUPPORTED_NOTE_KINDS: ReadonlySet<BreadcrumbNodeKind> = new Set([
  'observation',
  'analysis',
  'decision',
  'task',
  'reference'
]);

function assertIsoTimestamp(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`${field} must be an ISO-8601 timestamp.`);
  }
}

function expectObject(value: unknown, context: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${context} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function normalizeStringArray(value: unknown, field: string): string[] {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new Error(`${field} must be an array of strings.`);
  }
  const normalized = value.map((entry) => {
    if (typeof entry !== 'string') {
      throw new Error(`${field} must be an array of strings.`);
    }
    return entry.trim();
  });
  return normalized.filter((entry) => entry.length > 0);
}

function normalizeNoteSnippet(value: unknown): NoteSnippetMeta | undefined {
  if (value === undefined) {
    return undefined;
  }
  const data = expectObject(value, 'Snippet metadata');
  const hash = data.hash;
  if (typeof hash !== 'string' || hash.trim().length === 0) {
    throw new Error('Snippet metadata requires a non-empty hash.');
  }
  const language = data.language;
  if (language !== undefined && (typeof language !== 'string' || language.trim().length === 0)) {
    throw new Error('Snippet language must be a non-empty string when provided.');
  }
  const commit = data.commit;
  if (commit !== undefined && (typeof commit !== 'string' || commit.trim().length === 0)) {
    throw new Error('Snippet commit must be a non-empty string when provided.');
  }
  const snippetPath = data.path;
  if (snippetPath !== undefined && (typeof snippetPath !== 'string' || snippetPath.trim().length === 0)) {
    throw new Error('Snippet path must be a non-empty string when provided.');
  }
  return {
    hash: hash.trim(),
    language: typeof language === 'string' ? language.trim() : undefined,
    commit: typeof commit === 'string' ? commit.trim() : undefined,
    path: typeof snippetPath === 'string' ? snippetPath.trim() : undefined
  };
}

/**
 * Validate the structure of a note frontmatter object.
 */
export function validateNoteFrontmatter(raw: Record<string, unknown>): NoteFrontmatter {
  const id = raw.id;
  if (typeof id !== 'string' || id.trim().length === 0) {
    throw new Error('Note id must be a non-empty string.');
  }
  const title = raw.title;
  if (typeof title !== 'string' || title.trim().length === 0) {
    throw new Error('Note title must be a non-empty string.');
  }
  const kind = raw.kind;
  if (typeof kind !== 'string' || !SUPPORTED_NOTE_KINDS.has(kind as BreadcrumbNodeKind)) {
    throw new Error(`Note kind must be one of: ${Array.from(SUPPORTED_NOTE_KINDS).join(', ')}.`);
  }
  const createdAt = raw.createdAt;
  if (createdAt !== undefined) {
    if (typeof createdAt !== 'string') {
      throw new Error('createdAt must be a string when provided.');
    }
    assertIsoTimestamp(createdAt, 'createdAt');
  }
  const updatedAt = raw.updatedAt;
  if (updatedAt !== undefined) {
    if (typeof updatedAt !== 'string') {
      throw new Error('updatedAt must be a string when provided.');
    }
    assertIsoTimestamp(updatedAt, 'updatedAt');
  }
  return {
    id: id.trim(),
    title: title.trim(),
    kind: kind as BreadcrumbNodeKind,
    tags: normalizeStringArray(raw.tags, 'tags'),
    links: normalizeStringArray(raw.links, 'links'),
    createdAt: createdAt as string | undefined,
    updatedAt: updatedAt as string | undefined,
    snippet: normalizeNoteSnippet(raw.snippet)
  };
}

/**
 * Validate the structure of a chain frontmatter object.
 */
export function validateChainFrontmatter(raw: Record<string, unknown>): ChainFrontmatter {
  const id = raw.id;
  if (typeof id !== 'string' || id.trim().length === 0) {
    throw new Error('Chain id must be a non-empty string.');
  }
  const title = raw.title;
  if (typeof title !== 'string' || title.trim().length === 0) {
    throw new Error('Chain title must be a non-empty string.');
  }
  const notesValue = raw.notes;
  if (!Array.isArray(notesValue) || notesValue.length === 0) {
    throw new Error('Chain notes must be a non-empty array of note ids.');
  }
  const notes = notesValue.map((noteId) => {
    if (typeof noteId !== 'string' || noteId.trim().length === 0) {
      throw new Error('Chain notes must be an array of non-empty strings.');
    }
    return noteId.trim();
  });
  const createdAt = raw.createdAt;
  if (createdAt !== undefined) {
    if (typeof createdAt !== 'string') {
      throw new Error('createdAt must be a string when provided.');
    }
    assertIsoTimestamp(createdAt, 'createdAt');
  }
  const updatedAt = raw.updatedAt;
  if (updatedAt !== undefined) {
    if (typeof updatedAt !== 'string') {
      throw new Error('updatedAt must be a string when provided.');
    }
    assertIsoTimestamp(updatedAt, 'updatedAt');
  }
  const description = raw.description;
  if (description !== undefined && typeof description !== 'string') {
    throw new Error('Chain description must be a string when provided.');
  }
  return {
    id: id.trim(),
    title: title.trim(),
    description: typeof description === 'string' ? description : undefined,
    notes,
    tags: normalizeStringArray(raw.tags, 'tags'),
    createdAt: createdAt as string | undefined,
    updatedAt: updatedAt as string | undefined
  };
}

function validateNoteIndexEntry(raw: unknown): NoteIndexEntry {
  const data = expectObject(raw, 'Note index entry');
  const frontmatter = validateNoteFrontmatter({
    id: data.id,
    title: data.title,
    kind: data.kind,
    tags: data.tags,
    links: [],
    snippet: data.snippetHash ? { hash: data.snippetHash, commit: data.snippetCommit } : undefined
  });
  const pathValue = data.path;
  if (typeof pathValue !== 'string' || pathValue.trim().length === 0) {
    throw new Error('Note index path must be a non-empty string.');
  }
  return {
    id: frontmatter.id,
    title: frontmatter.title,
    kind: frontmatter.kind,
    tags: frontmatter.tags,
    path: pathValue.trim(),
    snippetHash: typeof data.snippetHash === 'string' ? data.snippetHash : undefined,
    snippetCommit: typeof data.snippetCommit === 'string' ? data.snippetCommit : undefined
  };
}

function validateChainIndexEntry(raw: unknown): ChainIndexEntry {
  const data = expectObject(raw, 'Chain index entry');
  const frontmatter = validateChainFrontmatter({
    id: data.id,
    title: data.title,
    description: data.description,
    notes: data.notes,
    tags: data.tags
  });
  const pathValue = data.path;
  if (typeof pathValue !== 'string' || pathValue.trim().length === 0) {
    throw new Error('Chain index path must be a non-empty string.');
  }
  return {
    id: frontmatter.id,
    title: frontmatter.title,
    notes: frontmatter.notes,
    path: pathValue.trim(),
    tags: frontmatter.tags
  };
}

/**
 * Validate persisted notebook index data loaded from disk.
 */
export function validateNotebookIndex(raw: unknown): NotebookIndex {
  const data = expectObject(raw, 'Notebook index');
  const version = data.version;
  if (version !== 1) {
    throw new Error('Notebook index version must be 1.');
  }
  const generatedAt = data.generatedAt;
  if (typeof generatedAt !== 'string') {
    throw new Error('Notebook index generatedAt must be a string.');
  }
  assertIsoTimestamp(generatedAt, 'generatedAt');
  const notes = expectObject(data.notes, 'Notebook index notes');
  const noteEntries: Record<string, NoteIndexEntry> = {};
  for (const [key, value] of Object.entries(notes)) {
    noteEntries[key] = validateNoteIndexEntry(value);
  }
  const chains = expectObject(data.chains, 'Notebook index chains');
  const chainEntries: Record<string, ChainIndexEntry> = {};
  for (const [key, value] of Object.entries(chains)) {
    chainEntries[key] = validateChainIndexEntry(value);
  }
  const backlinksValue = expectObject(data.backlinks, 'Notebook index backlinks');
  const backlinks: Record<string, readonly string[]> = {};
  for (const [key, value] of Object.entries(backlinksValue)) {
    backlinks[key] = normalizeStringArray(value, `backlinks.${key}`);
  }
  const checksum = data.checksum;
  if (typeof checksum !== 'string' || checksum.trim().length === 0) {
    throw new Error('Notebook index checksum must be a non-empty string.');
  }
  return {
    version: 1,
    generatedAt,
    notes: noteEntries,
    chains: chainEntries,
    backlinks,
    checksum: checksum.trim()
  };
}
