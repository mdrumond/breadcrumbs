import type { BreadcrumbTrail, TrailSummary } from './types.ts';

/**
 * Build a summary containing aggregated metadata for a breadcrumb trail.
 * @param trail - Trail to summarize.
 * @returns Computed trail summary.
 */
export function summarizeTrail(trail: BreadcrumbTrail): TrailSummary {
  const timestamps = trail.nodes
    .map((node) => node.timestamp)
    .filter((value): value is string => typeof value === 'string');
  const parsed = timestamps.map((value) => Date.parse(value)).filter((value) => !Number.isNaN(value));
  const first = parsed.length > 0 ? Math.min(...parsed) : undefined;
  const last = parsed.length > 0 ? Math.max(...parsed) : undefined;
  const tags = new Set<string>();
  for (const node of trail.nodes) {
    if (node.tags) {
      for (const tag of node.tags) {
        tags.add(tag);
      }
    }
  }
  return {
    id: trail.id,
    totalNodes: trail.nodes.length,
    firstTimestamp: first !== undefined ? new Date(first).toISOString() : undefined,
    lastTimestamp: last !== undefined ? new Date(last).toISOString() : undefined,
    durationMs: first !== undefined && last !== undefined ? last - first : undefined,
    tags: Array.from(tags).sort((a, b) => a.localeCompare(b))
  };
}

/**
 * Convert a trail summary to a short human readable sentence.
 * @param summary - Summary to stringify.
 * @returns Descriptive text ready for CLI or UI output.
 */
export function formatTrailSummary(summary: TrailSummary): string {
  const parts: string[] = [`${summary.totalNodes} steps`];
  if (summary.durationMs !== undefined && summary.durationMs >= 0) {
    const seconds = Math.round(summary.durationMs / 1000);
    parts.push(`${seconds}s duration`);
  }
  if (summary.tags.length > 0) {
    parts.push(`tags: ${summary.tags.join(', ')}`);
  }
  return parts.join(' · ');
}
