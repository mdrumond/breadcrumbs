import fs from 'node:fs/promises';
import path from 'node:path';
import { workspace, Uri, RelativePattern } from 'vscode';
import type { BreadcrumbTrail, TrailFileDescriptor } from '../../core/src/types.ts';
import { getCoreModule } from './coreProxy.js';

/**
 * Entry stored within the trail store cache.
 */
export interface TrailEntry {
  readonly descriptor: TrailFileDescriptor;
  readonly trail: BreadcrumbTrail;
}

/**
 * Cache and load breadcrumb trails from the examples directory.
 */
export class TrailStore {
  private readonly trailMap = new Map<string, TrailEntry>();

  /**
   * Construct the store for a specific examples directory.
   * @param examplesDirectory - Absolute path to the examples folder.
   */
  constructor(private readonly examplesDirectory: string) {}

  /**
   * Resolve a path within the examples directory.
   * @param segments - Path segments to append.
   * @returns Resolved filesystem path.
   */
  resolve(...segments: string[]): string {
    return path.join(this.examplesDirectory, ...segments);
  }

  /**
   * Refresh the store by reading all trail files from disk.
   */
  async refresh(): Promise<void> {
    const core = await getCoreModule();
    try {
      await fs.access(this.examplesDirectory);
    } catch {
      this.trailMap.clear();
      return;
    }
    const descriptors = await core.findTrailFiles(this.examplesDirectory);
    this.trailMap.clear();
    for (const descriptor of descriptors) {
      const trail = await core.loadBreadcrumbTrail(descriptor.path);
      this.trailMap.set(trail.id, { descriptor, trail });
    }
  }

  /**
   * Get the currently loaded trail entries.
   * @returns Ordered list of trail entries.
   */
  getTrails(): TrailEntry[] {
    return Array.from(this.trailMap.values()).sort((a, b) => a.trail.title.localeCompare(b.trail.title));
  }

  /**
   * Find a trail by identifier.
   * @param id - Trail identifier.
   * @returns Matching trail entry or undefined.
   */
  getTrail(id: string): TrailEntry | undefined {
    return this.trailMap.get(id);
  }

  /**
   * Create quick pick items for the available trails.
   */
  getQuickPickItems(): { label: string; description?: string; id: string }[] {
    return this.getTrails().map((entry) => ({
      label: entry.trail.title,
      description: entry.descriptor.summary,
      id: entry.trail.id
    }));
  }

  /**
   * Locate notebook files within the examples directory.
   * @returns URIs for notebook files.
   */
  async getNotebookFiles(): Promise<Uri[]> {
    try {
      await fs.access(this.examplesDirectory);
    } catch {
      return [];
    }
    const folderUri = Uri.file(this.examplesDirectory);
    const pattern = new RelativePattern(folderUri, '*.crumbnb');
    const files = await workspace.findFiles(pattern);
    return files.sort((a, b) => a.path.localeCompare(b.path));
  }
}
