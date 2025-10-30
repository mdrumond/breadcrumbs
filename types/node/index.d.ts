declare module 'node:path' {
  export function resolve(...segments: string[]): string;
  export function join(...segments: string[]): string;
  export function basename(path: string): string;
  export function extname(path: string): string;
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
  export function readdir(path: string, options?: ReaddirOptions): Promise<Dirent[]>;
  export function access(path: string): Promise<void>;
  export function mkdtemp(prefix: string, options?: { encoding?: string }): Promise<string>;
  export function rm(
    path: string,
    options?: { recursive?: boolean; force?: boolean }
  ): Promise<void>;
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
