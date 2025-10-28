import {
  EventEmitter,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  Uri
} from 'vscode';
import type { TrailStore, TrailEntry } from './trailStore.js';

/**
 * Tree item representing a breadcrumb trail or node within the explorer view.
 */
class BreadcrumbTreeItem extends TreeItem {
  constructor(label: string, collapsibleState: TreeItemCollapsibleState) {
    super(label, collapsibleState);
  }
}

/**
 * Tree data provider that surfaces breadcrumb trails and their nodes.
 */
export class TrailTreeDataProvider implements TreeDataProvider<BreadcrumbTreeItem> {
  private readonly emitter = new EventEmitter<void>();

  /**
   * Construct the provider with an underlying trail store.
   * @param store - Store responsible for loading trail data.
   */
  constructor(private readonly store: TrailStore) {}

  readonly onDidChangeTreeData = this.emitter.event;

  /**
   * Refresh the tree view by reloading trail data.
   */
  async refresh(): Promise<void> {
    await this.store.refresh();
    this.emitter.fire();
  }

  /**
   * Retrieve the tree item representation of a node.
   * @param element - Existing tree item.
   * @returns Tree item instance.
   */
  getTreeItem(element: BreadcrumbTreeItem): TreeItem {
    return element;
  }

  /**
   * Provide children for the given tree element.
   * @param element - Parent element or undefined for root items.
   * @returns Tree items to display under the parent.
   */
  async getChildren(element?: BreadcrumbTreeItem): Promise<BreadcrumbTreeItem[]> {
    if (!element) {
      return this.store.getTrails().map((entry) => this.createTrailItem(entry));
    }
    const trail = this.store.getTrail(element.id ?? '');
    if (trail) {
      return trail.trail.nodes.map((node) => {
        const item = new BreadcrumbTreeItem(node.label, TreeItemCollapsibleState.None);
        item.description = node.description;
        item.tooltip = node.timestamp;
        item.id = `${trail.trail.id}:${node.id}`;
        return item;
      });
    }
    return [];
  }

  private createTrailItem(entry: TrailEntry): BreadcrumbTreeItem {
    const item = new BreadcrumbTreeItem(entry.trail.title, TreeItemCollapsibleState.Collapsed);
    item.description = entry.descriptor.summary;
    item.id = entry.trail.id;
    item.resourceUri = Uri.file(entry.descriptor.path);
    return item;
  }
}
