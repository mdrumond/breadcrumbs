const testQueue = [];
const describeStack = [];

function formatName(name) {
  if (describeStack.length === 0) {
    return name;
  }
  return `${describeStack.join(' › ')} › ${name}`;
}

/**
 * Group related tests under a shared heading.
 * @param {string} name - Name of the describe block.
 * @param {() => void} fn - Callback that registers nested tests.
 */
export function describe(name, fn) {
  describeStack.push(name);
  try {
    fn();
  } finally {
    describeStack.pop();
  }
}

describe.skip = function skip(name, fn) {
  describe(name, () => {
    void fn;
  });
};

/**
 * Register an individual test case.
 * @param {string} name - Description of the assertion being verified.
 * @param {() => void | Promise<void>} fn - Test implementation.
 */
export function it(name, fn) {
  testQueue.push({ name: formatName(name), fn });
}

/**
 * Alias for {@link it} to align with Vitest's API.
 */
export const test = it;

test.skip = function skip(name) {
  console.log(`○ ${formatName(name)} (skipped)`);
};

function isPromise(value) {
  return Boolean(value) && typeof value.then === 'function';
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function stringify(value) {
  try {
    if (typeof value === 'string') {
      return JSON.stringify(value);
    }
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return String(value);
  }
}

function compareDeep(a, b) {
  return stringify(a) === stringify(b);
}

/**
 * Create an assertion object for the provided value.
 * @param {unknown} actual - Value under test.
 */
export function expect(actual) {
  return {
    toBe(expected) {
      assert(
        Object.is(actual, expected),
        `Expected ${stringify(actual)} to be ${stringify(expected)}`
      );
    },
    toEqual(expected) {
      assert(
        compareDeep(actual, expected),
        `Expected ${stringify(actual)} to equal ${stringify(expected)}`
      );
    },
    toContain(expected) {
      assert(
        typeof actual === 'string' && actual.includes(expected),
        `Expected ${stringify(actual)} to contain ${stringify(expected)}`
      );
    },
    toThrow(expected) {
      assert(typeof actual === 'function', 'toThrow expects a function.');
      let thrown = false;
      try {
        actual();
      } catch (error) {
        thrown = true;
        if (expected instanceof RegExp) {
          assert(expected.test(String(error)), `Expected thrown error to match ${expected}`);
        }
      }
      assert(thrown, 'Expected function to throw.');
    }
  };
}

async function runTests() {
  let failures = 0;
  for (const entry of testQueue) {
    try {
      const result = entry.fn();
      if (isPromise(result)) {
        await result;
      }
      console.log(`✓ ${entry.name}`);
    } catch (error) {
      failures += 1;
      console.error(`✖ ${entry.name}`);
      console.error(error instanceof Error ? (error.stack ?? error.message) : error);
    }
  }
  if (failures > 0) {
    process.exitCode = 1;
  }
}

process.on('beforeExit', () => {
  if (testQueue.length === 0) {
    return;
  }
  try {
    const promise = runTests();
    if (isPromise(promise)) {
      // Ensure Node waits for async completion.
      return promise;
    }
    return undefined;
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
    return undefined;
  }
});
