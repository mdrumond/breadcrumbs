import { validateNoteFrontmatter } from './schema.js';
import { parseFrontmatterDocument, serializeFrontmatterDocument } from './frontmatter.js';
import { computeSnippetHash } from './hash.js';
import type { BreadcrumbNote, NoteSnippet, NoteSnippetMeta } from './types.js';
import { uniqueStrings } from './utils.js';

const CODE_FENCE_PATTERN = /```(\w+)?\n([\s\S]*?)```/m;

/**
 * Extract a fenced code snippet from the markdown body while reconciling metadata.
 */
function extractSnippet(body: string, declaredMeta?: NoteSnippetMeta): {
  readonly snippet?: NoteSnippet;
  readonly content: string;
  readonly snippetMeta?: NoteSnippetMeta;
} {
  const match = CODE_FENCE_PATTERN.exec(body);
  if (!match) {
    if (declaredMeta) {
      throw new Error('Snippet metadata declared without a fenced code block.');
    }
    return { content: body.trim() };
  }
  const [, languageGroup, codeGroup] = match;
  const code = codeGroup.replace(/\s+$/, '');
  const fencedLanguage = languageGroup?.trim();
  const hash = declaredMeta?.hash ?? computeSnippetHash(code);
  const snippet: NoteSnippet = {
    code,
    hash,
    commit: declaredMeta?.commit,
    path: declaredMeta?.path,
    language: declaredMeta?.language ?? fencedLanguage ?? undefined
  };
  const remainder = `${body.slice(0, match.index)}${body.slice(match.index + match[0].length)}`.trim();
  const snippetMeta: NoteSnippetMeta = {
    hash: snippet.hash,
    commit: snippet.commit,
    path: snippet.path,
    language: snippet.language
  };
  return { snippet, content: remainder, snippetMeta };
}

/**
 * Parse a markdown note with YAML frontmatter into a structured representation.
 */
export function parseNoteMarkdown(raw: string): BreadcrumbNote {
  const { data, body } = parseFrontmatterDocument(raw);
  const parsed = validateNoteFrontmatter(data);
  const { snippet, content, snippetMeta } = extractSnippet(body, parsed.snippet);
  const frontmatter = {
    ...parsed,
    tags: uniqueStrings(parsed.tags),
    links: uniqueStrings(parsed.links),
    snippet: snippetMeta
  };
  return {
    frontmatter,
    content,
    snippet
  };
}

/**
 * Serialize a structured note into markdown with frontmatter and snippet fences.
 */
export function serializeNoteMarkdown(note: BreadcrumbNote): string {
  const tags = uniqueStrings(note.frontmatter.tags);
  const links = uniqueStrings(note.frontmatter.links);
  let snippetMeta: NoteSnippetMeta | undefined;
  let snippetContent = '';
  if (note.snippet) {
    const computedHash = computeSnippetHash(note.snippet.code);
    if (note.snippet.hash !== computedHash) {
      throw new Error(
        `Snippet hash mismatch. Expected ${note.snippet.hash} but computed ${computedHash}.`
      );
    }
    const languageSuffix = note.snippet.language ? note.snippet.language : '';
    const codeBlockLines = ['```' + languageSuffix, note.snippet.code.replace(/\s+$/, ''), '```'];
    snippetContent = codeBlockLines.join('\n');
    snippetMeta = {
      hash: note.snippet.hash,
      commit: note.snippet.commit,
      path: note.snippet.path,
      language: note.snippet.language
    };
  }
  const frontmatterInput: Record<string, unknown> = {
    id: note.frontmatter.id,
    title: note.frontmatter.title,
    kind: note.frontmatter.kind,
    tags,
    links,
    createdAt: note.frontmatter.createdAt,
    updatedAt: note.frontmatter.updatedAt,
    snippet: snippetMeta
  };
  const validated = validateNoteFrontmatter(frontmatterInput);
  const sections: string[] = [];
  if (note.content.trim().length > 0) {
    sections.push(note.content.trim());
  }
  if (snippetContent.length > 0) {
    sections.push(snippetContent);
  }
  const body = sections.length > 0 ? `${sections.join('\n\n')}\n` : '';
  const frontmatterRecord: Record<string, unknown> = {
    id: validated.id,
    title: validated.title,
    kind: validated.kind,
    tags: Array.from(validated.tags),
    links: Array.from(validated.links),
    createdAt: validated.createdAt,
    updatedAt: validated.updatedAt,
    snippet: validated.snippet
  };
  return serializeFrontmatterDocument(frontmatterRecord, body);
}
