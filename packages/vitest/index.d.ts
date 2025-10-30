export declare function describe(name: string, fn: () => void): void;
export declare namespace describe {
  const skip: (name: string, fn: () => void) => void;
}

export declare function beforeEach(fn: () => void | Promise<void>): void;
export declare function afterEach(fn: () => void | Promise<void>): void;

export declare function it(name: string, fn: () => void | Promise<void>): void;
export declare const test: typeof it & { skip(name: string): void };

export interface VitestMatchers {
  toBe(expected: unknown): void;
  toEqual(expected: unknown): void;
  toContain(expected: unknown): void;
  toThrow(expected?: RegExp): void;
  toBeDefined(): void;
  toBeUndefined(): void;
  toHaveLength(expected: number): void;
  readonly not: VitestMatchers;
}

export declare function expect(actual: unknown): VitestMatchers;
