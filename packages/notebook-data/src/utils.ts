/**
 * Normalize an array of strings by trimming whitespace and removing duplicates.
 */
export function uniqueStrings(values: readonly string[] | undefined): string[] {
  if (!values) {
    return [];
  }
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
 * Convert an identifier into a lowercase, filesystem-friendly slug.
 */
export function slugifyId(identifier: string): string {
  return identifier
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
