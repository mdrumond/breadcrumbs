declare module 'vscode' {
  export interface Disposable {
    dispose(): void;
  }

  export type ProviderResult<T> = T | undefined | null | Promise<T | undefined | null>;

  export interface Event<T> {
    (listener: (e: T) => unknown): Disposable;
  }

  export class EventEmitter<T> {
    constructor();
    event: Event<T>;
    fire(data: T): void;
  }

  export interface ExtensionContext {
    readonly extensionPath: string;
    readonly subscriptions: Disposable[];
  }

  export enum ViewColumn {
    Active = 1,
    Beside = 2
  }

  export class Uri {
    static file(path: string): Uri;
    readonly path: string;
    readonly fsPath: string;
  }

  export class RelativePattern {
    constructor(base: Uri, pattern: string);
  }

  export interface QuickPickItem {
    label: string;
    description?: string;
    detail?: string;
    id?: string;
  }

  export namespace window {
    function registerTreeDataProvider<T>(viewId: string, provider: TreeDataProvider<T>): Disposable;
    function createWebviewPanel(
      viewType: string,
      title: string,
      showOptions: ViewColumn,
      options: { enableScripts?: boolean }
    ): WebviewPanel;
    function showQuickPick<T extends QuickPickItem>(
      items: readonly T[] | Promise<readonly T[]>,
      options?: { placeHolder?: string }
    ): Promise<T | undefined>;
    function showErrorMessage(message: string): void;
    function showWarningMessage(message: string): void;
    function showInformationMessage(
      message: string,
      options?: { modal?: boolean; detail?: string }
    ): void;
    function showNotebookDocument(
      document: NotebookDocument,
      options?: { preview?: boolean }
    ): Promise<void>;
  }

  export namespace commands {
    function registerCommand(
      command: string,
      callback: (...args: unknown[]) => unknown
    ): Disposable;
  }

  export namespace workspace {
    function registerNotebookSerializer(
      notebookType: string,
      serializer: NotebookSerializer,
      options?: { transientOutputs?: boolean }
    ): Disposable;
    function openNotebookDocument(type: string, uri: Uri): Promise<NotebookDocument>;
    function findFiles(pattern: RelativePattern): Promise<Uri[]>;
  }

  export interface NotebookCellMetadata {
    [key: string]: unknown;
  }

  export class NotebookCellData {
    constructor(kind: NotebookCellKind, value: string, language: string);
    readonly kind: NotebookCellKind;
    value: string;
    readonly languageId: string;
    metadata?: NotebookCellMetadata;
  }

  export enum NotebookCellKind {
    Markdown = 1,
    Code = 2
  }

  export class NotebookData {
    constructor(cells: NotebookCellData[]);
    cells: NotebookCellData[];
    metadata?: NotebookCellMetadata;
  }

  export interface NotebookDocument {
    readonly metadata?: NotebookCellMetadata;
    readonly cells: NotebookCellData[];
  }

  export interface NotebookSerializer {
    deserializeNotebook(content: Uint8Array): NotebookData | Promise<NotebookData>;
    serializeNotebook(data: NotebookData): Uint8Array | Promise<Uint8Array>;
  }

  export interface TreeItemLabel {
    label: string;
  }

  export class TreeItem {
    constructor(label: string, collapsibleState: TreeItemCollapsibleState);
    description?: string;
    tooltip?: string;
    id?: string;
    resourceUri?: Uri;
  }

  export enum TreeItemCollapsibleState {
    None = 0,
    Collapsed = 1
  }

  export interface TreeDataProvider<T> {
    getTreeItem(element: T): TreeItem;
    getChildren(element?: T): ProviderResult<T[]>;
  }

  export interface Webview {
    html: string;
  }

  export class WebviewPanel {
    readonly webview: Webview;
  }
}
