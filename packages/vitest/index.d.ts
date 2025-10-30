export declare function describe(name: string, fn: () => void): void;
export declare namespace describe {
  const skip: (name: string, fn: () => void) => void;
}

export declare function it(name: string, fn: () => void | Promise<void>): void;
export declare const test: typeof it & { skip(name: string): void };

export declare function expect(actual: unknown): {
  toBe(expected: unknown): void;
  toEqual(expected: unknown): void;
  toContain(expected: string): void;
  toThrow(expected?: RegExp): void;
};
