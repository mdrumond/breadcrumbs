declare module 'node:path' {
  export function resolve(...segments: string[]): string;
  export function join(...segments: string[]): string;
  export function basename(path: string): string;
  export function extname(path: string): string;
  export function dirname(path: string): string;
  export function relative(from: string, to: string): string;
}

declare module 'node:fs/promises' {
  export interface Dirent {
    readonly name: string;
    isFile(): boolean;
    isDirectory(): boolean;
  }
  export interface ReaddirOptions {
    withFileTypes?: boolean;
  }
  export function readFile(path: string, options?: { encoding?: string } | string): Promise<string>;
  export function writeFile(
    path: string,
    data: string,
    options?: { encoding?: string } | string
  ): Promise<void>;
  export function readdir(path: string): Promise<string[]>;
  export function readdir(path: string, options: { withFileTypes: true }): Promise<Dirent[]>;
  export function readdir(path: string, options: ReaddirOptions): Promise<string[] | Dirent[]>;
  export function access(path: string): Promise<void>;
  export function mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  export function rename(oldPath: string, newPath: string): Promise<void>;
  export function unlink(path: string): Promise<void>;
  export interface Stats {
    readonly mtimeMs: number;
  }
  export function stat(path: string): Promise<Stats>;
  export function mkdtemp(prefix: string, options?: { encoding?: string }): Promise<string>;
  export function rm(
    path: string,
    options?: { recursive?: boolean; force?: boolean }
  ): Promise<void>;
}

declare namespace NodeJS {
  interface ErrnoException extends Error {
    code?: string;
  }
}

declare module 'node:crypto' {
  interface Hash {
    update(data: string, inputEncoding?: string): Hash;
    digest(encoding: 'hex'): string;
  }
  export function createHash(algorithm: string): Hash;
  export function randomUUID(): string;
}

declare module 'node:child_process' {
  export interface ExecFileOptions {
    cwd?: string;
  }
  export interface ExecFileResult {
    stdout: string;
    stderr: string;
  }
  export function execFile(
    file: string,
    args: readonly string[],
    options: ExecFileOptions,
    callback: (error: Error | null, stdout: string, stderr: string) => void
  ): void;
}

declare module 'node:util' {
  export function promisify<T extends (...args: any[]) => void>(fn: T): (...args: any[]) => Promise<any>;
}

declare module 'node:assert/strict' {
  function assert(value: unknown, message?: string): asserts value;
  namespace assert {
    function equal(actual: unknown, expected: unknown): void;
    function deepEqual(actual: unknown, expected: unknown): void;
    function strictEqual(actual: unknown, expected: unknown): void;
    function throws(fn: () => unknown): void;
    function ok(value: unknown): asserts value;
  }
  export default assert;
}

declare module 'node:test' {
  export default function test(name: string, fn: () => void | Promise<void>): void;
}

declare module 'node:os' {
  export function tmpdir(): string;
}
