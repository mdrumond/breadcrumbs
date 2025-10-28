import type { BreadcrumbTrail } from '../../core/src/types.ts';
import { getCoreModule } from './coreProxy.js';

/**
 * Render a breadcrumb trail inside the provided webview panel.
 * @param panel - Webview panel to populate.
 * @param trail - Trail to visualize.
 */
export async function renderTrailPanel(panel: import('vscode').WebviewPanel, trail: BreadcrumbTrail): Promise<void> {
  const core = await getCoreModule();
  const summary = core.formatTrailSummary(core.summarizeTrail(trail));
  const tableRows = trail.nodes
    .map((node, index) => {
      const escapedTags = node.tags?.map(escapeHtml).join(', ') ?? '';
      return [
        '<tr>',
        `<td>${index + 1}</td>`,
        `<td>${escapeHtml(node.label)}</td>`,
        `<td>${node.timestamp ?? ''}</td>`,
        `<td>${escapedTags}</td>`,
        `<td>${escapeHtml(node.description ?? '')}</td>`,
        '</tr>'
      ].join('');
    })
    .join('\n');
  panel.webview.html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <style>
      body { font-family: var(--vscode-editor-font-family); padding: 16px; color: var(--vscode-editor-foreground); }
      h1 { margin-bottom: 0; }
      table { border-collapse: collapse; width: 100%; margin-top: 16px; }
      th, td { border: 1px solid var(--vscode-editorWidget-border); padding: 4px 8px; text-align: left; }
      tbody tr:nth-child(even) { background: var(--vscode-editor-selectionBackground, rgba(128,128,128,0.1)); }
    </style>
    <title>${escapeHtml(trail.title)}</title>
  </head>
  <body>
    <h1>${escapeHtml(trail.title)}</h1>
    <p>${escapeHtml(trail.description ?? '')}</p>
    <p><strong>${escapeHtml(summary)}</strong></p>
    <table>
      <thead>
        <tr><th>#</th><th>Label</th><th>Timestamp</th><th>Tags</th><th>Description</th></tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
