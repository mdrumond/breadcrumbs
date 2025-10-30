import type { BreadcrumbNodeKind } from '@breadcrumbs/core';

/**
 * Metadata captured for a code snippet associated with a note.
 */
export interface NoteSnippetMeta {
  readonly language?: string;
  readonly hash: string;
  readonly commit?: string;
  readonly path?: string;
}

/**
 * Full snippet definition including the concrete source code.
 */
export interface NoteSnippet extends NoteSnippetMeta {
  readonly code: string;
}

/**
 * YAML frontmatter fields stored alongside a note document.
 */
export interface NoteFrontmatter {
  readonly id: string;
  readonly title: string;
  readonly kind: BreadcrumbNodeKind;
  readonly tags: readonly string[];
  readonly links: readonly string[];
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly snippet?: NoteSnippetMeta;
}

/**
 * Frontmatter metadata for a chain document referencing ordered note ids.
 */
export interface ChainFrontmatter {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly notes: readonly string[];
  readonly tags: readonly string[];
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

/**
 * Entry captured in the derived index for quick note lookups.
 */
export interface NoteIndexEntry {
  readonly id: string;
  readonly title: string;
  readonly kind: BreadcrumbNodeKind;
  readonly tags: readonly string[];
  readonly path: string;
  readonly snippetHash?: string;
  readonly snippetCommit?: string;
}

/**
 * Chain representation stored in the index file.
 */
export interface ChainIndexEntry {
  readonly id: string;
  readonly title: string;
  readonly notes: readonly string[];
  readonly path: string;
  readonly tags: readonly string[];
}

/**
 * Shape of the persisted index including backlinks and integrity checksum.
 */
export interface NotebookIndex {
  readonly version: 1;
  readonly generatedAt: string;
  readonly notes: Record<string, NoteIndexEntry>;
  readonly chains: Record<string, ChainIndexEntry>;
  readonly backlinks: Record<string, readonly string[]>;
  readonly checksum: string;
}

/**
 * Fully hydrated note document including content and optional snippet.
 */
export interface BreadcrumbNote {
  readonly frontmatter: NoteFrontmatter;
  readonly content: string;
  readonly snippet?: NoteSnippet;
}

/**
 * Hydrated chain document with markdown commentary.
 */
export interface BreadcrumbChain {
  readonly frontmatter: ChainFrontmatter;
  readonly content: string;
}

/**
 * Lightweight description of a note returned by the data store.
 */
export interface NoteSummary {
  readonly id: string;
  readonly title: string;
  readonly kind: BreadcrumbNodeKind;
  readonly tags: readonly string[];
  readonly path: string;
  readonly snippetHash?: string;
  readonly snippetCommit?: string;
}

/**
 * Lightweight chain description returned by the data store.
 */
export interface ChainSummary {
  readonly id: string;
  readonly title: string;
  readonly notes: readonly string[];
  readonly path: string;
  readonly tags: readonly string[];
}

/**
 * Outcome of comparing expected snippet metadata with candidate content.
 */
export interface ConflictResult {
  readonly status: 'clean' | 'hash-mismatch' | 'missing-snippet';
  readonly expectedHash?: string;
  readonly actualHash?: string;
  readonly message?: string;
}
