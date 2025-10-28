import path from 'node:path';
import * as vscode from 'vscode';
import type { BreadcrumbTrail } from '../../core/src/types.ts';
import { BreadcrumbNotebookSerializer } from './notebookSerializer.js';
import { TrailStore } from './trailStore.js';
import { TrailTreeDataProvider } from './treeDataProvider.js';
import { renderTrailPanel } from './webview.js';

/**
 * Activate the breadcrumbs extension.
 * @param context - Extension context supplied by VS Code.
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const examplesDirectory = path.join(context.extensionPath, '.breadcrumbs/examples');
  const store = new TrailStore(examplesDirectory);
  await store.refresh();

  const treeProvider = new TrailTreeDataProvider(store);
  context.subscriptions.push(vscode.window.registerTreeDataProvider('breadcrumbsExplorer', treeProvider));

  const notebookSerializer = new BreadcrumbNotebookSerializer();
  context.subscriptions.push(
    vscode.workspace.registerNotebookSerializer('breadcrumbsTrail', notebookSerializer, { transientOutputs: true })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('breadcrumbs.openTrailPanel', async () => {
      const selection = await vscode.window.showQuickPick(store.getQuickPickItems(), {
        placeHolder: 'Select a breadcrumb trail'
      });
      if (!selection) {
        return;
      }
      const entry = store.getTrail(selection.id);
      if (!entry) {
        vscode.window.showErrorMessage('Trail could not be loaded.');
        return;
      }
      const panel = vscode.window.createWebviewPanel('breadcrumbsTrail', entry.trail.title, vscode.ViewColumn.Beside, {
        enableScripts: false
      });
      await renderTrailPanel(panel, entry.trail);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('breadcrumbs.openSampleNotebook', async () => {
      const notebookFiles = await store.getNotebookFiles();
      if (notebookFiles.length === 0) {
        vscode.window.showWarningMessage('No .crumbnb notebook files were found in the examples directory.');
        return;
      }
      const document = await vscode.workspace.openNotebookDocument('breadcrumbsTrail', notebookFiles[0]);
      await vscode.window.showNotebookDocument(document, { preview: false });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('breadcrumbs.peekTrailNode', async () => {
      const trailPick = await vscode.window.showQuickPick(store.getQuickPickItems(), {
        placeHolder: 'Select a trail to inspect'
      });
      if (!trailPick) {
        return;
      }
      const entry = store.getTrail(trailPick.id);
      if (!entry) {
        vscode.window.showErrorMessage('Trail data could not be located.');
        return;
      }
      const nodePick = await vscode.window.showQuickPick(
        entry.trail.nodes.map((node) => ({
          label: node.label,
          description: node.timestamp,
          detail: node.description,
          node
        })),
        { placeHolder: 'Select a breadcrumb step' }
      );
      if (!nodePick) {
        return;
      }
      showNodePeek(entry.trail, nodePick.node);
    })
  );
}

/**
 * Deactivate the extension (no-op).
 */
export function deactivate(): void {
  // No teardown required.
}

function showNodePeek(trail: BreadcrumbTrail, node: BreadcrumbTrail['nodes'][number]): void {
  const detail = [
    `Trail: ${trail.title}`,
    node.timestamp ? `Timestamp: ${node.timestamp}` : undefined,
    node.tags && node.tags.length > 0 ? `Tags: ${node.tags.join(', ')}` : undefined,
    node.description ?? undefined
  ]
    .filter((value): value is string => Boolean(value))
    .join('\n');
  vscode.window.showInformationMessage(node.label, { modal: false, detail });
}
