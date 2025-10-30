declare const process: {
  cwd(): string;
  env: Record<string, string | undefined>;
  exitCode?: number;
  stdout: { write(data: string): void };
  stderr: { write(data: string): void };
  argv: string[];
};

declare class Buffer extends Uint8Array {
  constructor(data: string | Uint8Array, encoding?: string);
  static from(data: string | Uint8Array, encoding?: string): Buffer;
  toString(encoding?: string): string;
}

declare const console: {
  log(...args: unknown[]): void;
  error(...args: unknown[]): void;
  warn(...args: unknown[]): void;
};
