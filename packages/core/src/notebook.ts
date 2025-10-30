import type { BreadcrumbTrail, NotebookCellData, NotebookDocumentData } from './types.js';
import { summarizeTrail, formatTrailSummary } from './summary.js';

/**
 * Convert a breadcrumb trail into a markdown representation.
 * @param trail - Trail to format.
 * @returns Markdown content describing the trail.
 */
export function trailToMarkdown(trail: BreadcrumbTrail): string {
  const lines: string[] = [];
  lines.push(`# ${trail.title}`);
  if (trail.description) {
    lines.push('', trail.description);
  }
  const summary = summarizeTrail(trail);
  const summaryLine = formatTrailSummary(summary);
  if (summaryLine.length > 0) {
    lines.push('', `> ${summaryLine}`);
  }
  lines.push('', '## Steps');
  trail.nodes.forEach((node, index) => {
    const position = index + 1;
    lines.push('', `### ${position}. ${node.label}`);
    lines.push(`- **Kind:** ${node.kind}`);
    if (node.timestamp) {
      lines.push(`- **Timestamp:** ${node.timestamp}`);
    }
    if (node.tags && node.tags.length > 0) {
      lines.push(`- **Tags:** ${node.tags.join(', ')}`);
    }
    if (node.description) {
      lines.push('', node.description);
    }
    if (node.metadata && Object.keys(node.metadata).length > 0) {
      lines.push('', '```json', JSON.stringify(node.metadata, null, 2), '```');
    }
  });
  return lines.join('\n');
}

/**
 * Transform a breadcrumb trail into notebook cell data.
 * @param trail - Trail to transform.
 * @returns Notebook document ready for the custom notebook controller.
 */
export function trailToNotebook(trail: BreadcrumbTrail): NotebookDocumentData {
  const header: NotebookCellData = {
    kind: 'markdown',
    value: trailToMarkdown(trail)
  };
  const timeline: NotebookCellData = {
    kind: 'code',
    value: JSON.stringify(trail.nodes, null, 2)
  };
  return {
    title: trail.title,
    cells: [header, timeline]
  };
}
