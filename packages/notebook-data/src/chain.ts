import { validateChainFrontmatter } from './schema.js';
import { parseFrontmatterDocument, serializeFrontmatterDocument } from './frontmatter.js';
import type { BreadcrumbChain } from './types.js';
import { uniqueStrings } from './utils.js';

/**
 * Deduplicate and trim note identifiers while preserving order.
 */
function uniqueIds(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (trimmed.length === 0 || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    normalized.push(trimmed);
  }
  return normalized;
}

/**
 * Parse a chain markdown document into a structured representation.
 */
export function parseChainMarkdown(raw: string): BreadcrumbChain {
  const { data, body } = parseFrontmatterDocument(raw);
  const parsed = validateChainFrontmatter(data);
  const frontmatter = {
    ...parsed,
    notes: uniqueIds(parsed.notes),
    tags: uniqueStrings(parsed.tags)
  };
  return {
    frontmatter,
    content: body.trim()
  };
}

/**
 * Serialize a chain into markdown with YAML frontmatter.
 */
export function serializeChainMarkdown(chain: BreadcrumbChain): string {
  const notes = uniqueIds(chain.frontmatter.notes);
  const tags = uniqueStrings(chain.frontmatter.tags);
  const frontmatterInput: Record<string, unknown> = {
    id: chain.frontmatter.id,
    title: chain.frontmatter.title,
    description: chain.frontmatter.description,
    notes,
    tags,
    createdAt: chain.frontmatter.createdAt,
    updatedAt: chain.frontmatter.updatedAt
  };
  const validated = validateChainFrontmatter(frontmatterInput);
  const body = chain.content.trim().length > 0 ? `${chain.content.trim()}\n` : '';
  const frontmatterRecord: Record<string, unknown> = {
    id: validated.id,
    title: validated.title,
    description: validated.description,
    notes: Array.from(validated.notes),
    tags: Array.from(validated.tags),
    createdAt: validated.createdAt,
    updatedAt: validated.updatedAt
  };
  return serializeFrontmatterDocument(frontmatterRecord, body);
}
