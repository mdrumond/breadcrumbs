import { NotebookCellData, NotebookCellKind, NotebookData } from 'vscode';
import type { BreadcrumbTrail } from '../../core/src/types.ts';
import { getCoreModule } from './coreProxy.js';

/**
 * Notebook serializer that bridges breadcrumb trails with the VS Code notebook API.
 */
export class BreadcrumbNotebookSerializer implements import('vscode').NotebookSerializer {
  /**
   * Deserialize notebook content into notebook cells.
   * @param content - Raw notebook content.
   * @returns Notebook data populated from the serialized trail.
   */
  async deserializeNotebook(content: Uint8Array): Promise<NotebookData> {
    const text = Buffer.from(content).toString('utf8').trim();
    if (!text) {
      return new NotebookData([]);
    }
    const raw = JSON.parse(text);
    const core = await getCoreModule();
    const trail = core.parseBreadcrumbTrail(raw);
    const notebook = core.trailToNotebook(trail);
    const cells = notebook.cells.map((cell) =>
      new NotebookCellData(
        cell.kind === 'markdown' ? NotebookCellKind.Markdown : NotebookCellKind.Code,
        cell.value,
        cell.kind === 'markdown' ? 'markdown' : 'json'
      )
    );
    const data = new NotebookData(cells);
    data.metadata = { trail } satisfies { trail: BreadcrumbTrail };
    return data;
  }

  /**
   * Serialize notebook cells back to a JSON trail representation.
   * @param data - Notebook data to serialize.
   * @returns Encoded JSON representation.
   */
  async serializeNotebook(data: NotebookData): Promise<Uint8Array> {
    const core = await getCoreModule();
    const metadataTrail = (data.metadata as { trail?: BreadcrumbTrail } | undefined)?.trail;
    if (metadataTrail) {
      return Buffer.from(JSON.stringify(metadataTrail, null, 2));
    }
    const codeCell = data.cells.find((cell) => cell.kind === NotebookCellKind.Code);
    if (codeCell) {
      const rawNodes = JSON.parse(codeCell.value);
      const trail = core.parseBreadcrumbTrail({
        id: 'notebook-export',
        title: 'Notebook Export',
        nodes: rawNodes
      });
      return Buffer.from(JSON.stringify(trail, null, 2));
    }
    return Buffer.from('');
  }
}
