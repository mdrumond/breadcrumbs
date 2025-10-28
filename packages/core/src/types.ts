/**
 * Describes an individual step within a breadcrumb trail.
 */
export interface BreadcrumbNode {
  /**
   * Unique identifier for the node.
   */
  readonly id: string;
  /**
   * Short human readable label that summarizes the step.
   */
  readonly label: string;
  /**
   * Optional narrative that elaborates on the step.
   */
  readonly description?: string;
  /**
   * ISO-8601 timestamp describing when the step occurred.
   */
  readonly timestamp?: string;
  /**
   * Tags that classify the step (e.g. feature names or contexts).
   */
  readonly tags?: readonly string[];
  /**
   * Arbitrary metadata associated with the step.
   */
  readonly metadata?: Record<string, unknown>;
}

/**
 * Represents a named breadcrumb trail.
 */
export interface BreadcrumbTrail {
  /**
   * Unique identifier for the trail.
   */
  readonly id: string;
  /**
   * Title that should be displayed in UIs.
   */
  readonly title: string;
  /**
   * Optional detailed description of the trail's purpose.
   */
  readonly description?: string;
  /**
   * Timestamp representing when the trail was first recorded.
   */
  readonly createdAt?: string;
  /**
   * Timestamp representing the most recent update.
   */
  readonly updatedAt?: string;
  /**
   * Ordered collection of breadcrumb nodes.
   */
  readonly nodes: readonly BreadcrumbNode[];
}

/**
 * Aggregated statistics describing a breadcrumb trail.
 */
export interface TrailSummary {
  /**
   * Identifier of the summarized trail.
   */
  readonly id: string;
  /**
   * Number of nodes contained in the trail.
   */
  readonly totalNodes: number;
  /**
   * Timestamp for the first node in the trail if available.
   */
  readonly firstTimestamp?: string;
  /**
   * Timestamp for the last node in the trail if available.
   */
  readonly lastTimestamp?: string;
  /**
   * Total duration in milliseconds if timestamps are present.
   */
  readonly durationMs?: number;
  /**
   * Unique tags referenced across the trail.
   */
  readonly tags: readonly string[];
}

/**
 * Structure describing a breadcrumb file on disk.
 */
export interface TrailFileDescriptor {
  /**
   * Absolute path to the file.
   */
  readonly path: string;
  /**
   * Trail identifier extracted from the file contents.
   */
  readonly id: string;
  /**
   * Display title for quick picks and menus.
   */
  readonly title: string;
  /**
   * Optional short summary derived from the trail description.
   */
  readonly summary?: string;
}

/**
 * Representation of notebook cell data produced from a trail.
 */
export interface NotebookCellData {
  /**
   * Kind of the cell.
   */
  readonly kind: 'markdown' | 'code';
  /**
   * Source content for the cell.
   */
  readonly value: string;
}

/**
 * Notebook document content produced from a breadcrumb trail.
 */
export interface NotebookDocumentData {
  /**
   * Title of the notebook.
   */
  readonly title: string;
  /**
   * Ordered cells that should be rendered.
   */
  readonly cells: readonly NotebookCellData[];
}
