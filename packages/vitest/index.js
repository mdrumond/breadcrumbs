const testQueue = [];
let hasRunTests = false;
const describeStack = [];
const hookStack = [createHookContext()];

function createHookContext() {
  return {
    beforeEach: [],
    afterEach: []
  };
}

function currentHooks() {
  return hookStack[hookStack.length - 1];
}

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
  hookStack.push(createHookContext());
  try {
    fn();
  } finally {
    hookStack.pop();
    describeStack.pop();
  }
}

describe.skip = function skip(name, fn) {
  describe(name, () => {
    void fn;
  });
};

/**
 * Register a function to run before each test in the current scope.
 * @param {() => void | Promise<void>} fn - Hook implementation.
 */
export function beforeEach(fn) {
  currentHooks().beforeEach.push(fn);
}

/**
 * Register a function to run after each test in the current scope.
 * @param {() => void | Promise<void>} fn - Hook implementation.
 */
export function afterEach(fn) {
  currentHooks().afterEach.push(fn);
}

/**
 * Register an individual test case.
 * @param {string} name - Description of the assertion being verified.
 * @param {() => void | Promise<void>} fn - Test implementation.
 */
export function it(name, fn) {
  const beforeEachHandlers = [];
  for (const context of hookStack) {
    beforeEachHandlers.push(...context.beforeEach);
  }
  const afterEachHandlers = [];
  for (const context of [...hookStack].reverse()) {
    afterEachHandlers.push(...context.afterEach);
  }
  testQueue.push({ name: formatName(name), fn, beforeEachHandlers, afterEachHandlers });
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

function checkExpectation(pass, positiveMessage, negativeMessage, isNegated) {
  if (isNegated) {
    if (pass) {
      throw new Error(negativeMessage ?? positiveMessage.replace('Expected', 'Did not expect'));
    }
    return;
  }
  if (!pass) {
    throw new Error(positiveMessage);
  }
}

function contains(actual, expected) {
  if (typeof actual === 'string') {
    return actual.includes(expected);
  }
  if (Array.isArray(actual)) {
    return actual.includes(expected);
  }
  return false;
}

function createMatchers(actual, isNegated = false) {
  const matchers = {
    toBe(expected) {
      const pass = Object.is(actual, expected);
      const message = `Expected ${stringify(actual)} to be ${stringify(expected)}`;
      const negated = `Expected ${stringify(actual)} not to be ${stringify(expected)}`;
      checkExpectation(pass, message, negated, isNegated);
    },
    toEqual(expected) {
      const pass = compareDeep(actual, expected);
      const message = `Expected ${stringify(actual)} to equal ${stringify(expected)}`;
      const negated = `Expected ${stringify(actual)} not to equal ${stringify(expected)}`;
      checkExpectation(pass, message, negated, isNegated);
    },
    toContain(expected) {
      const pass = contains(actual, expected);
      const message = `Expected ${stringify(actual)} to contain ${stringify(expected)}`;
      const negated = `Expected ${stringify(actual)} not to contain ${stringify(expected)}`;
      checkExpectation(pass, message, negated, isNegated);
    },
    toThrow(expected) {
      assert(typeof actual === 'function', 'toThrow expects a function.');
      let thrown = false;
      let thrownValue;
      try {
        actual();
      } catch (error) {
        thrown = true;
        thrownValue = error;
      }
      if (expected instanceof RegExp && thrown) {
        const pass = expected.test(String(thrownValue));
        const message = `Expected thrown error to match ${expected}, received ${stringify(thrownValue)}`;
        const negated = `Expected thrown error not to match ${expected}`;
        checkExpectation(pass, message, negated, isNegated);
        return;
      }
      const message = 'Expected function to throw.';
      const negated = 'Expected function not to throw.';
      checkExpectation(thrown, message, negated, isNegated);
    },
    toBeDefined() {
      const pass = actual !== undefined;
      const message = `Expected value to be defined but received ${stringify(actual)}`;
      const negated = 'Expected value to be undefined.';
      checkExpectation(pass, message, negated, isNegated);
    },
    toBeUndefined() {
      const pass = actual === undefined;
      const message = `Expected value to be undefined but received ${stringify(actual)}`;
      const negated = 'Expected value to be defined.';
      checkExpectation(pass, message, negated, isNegated);
    },
    toHaveLength(expected) {
      const length = actual != null && typeof actual.length === 'number' ? actual.length : undefined;
      const pass = length === expected;
      const message = `Expected ${stringify(actual)} to have length ${expected} but received ${length}`;
      const negated = `Expected ${stringify(actual)} not to have length ${expected}`;
      checkExpectation(pass, message, negated, isNegated);
    }
  };

  Object.defineProperty(matchers, 'not', {
    enumerable: true,
    get() {
      return createMatchers(actual, !isNegated);
    }
  });

  return matchers;
}

/**
 * Create an assertion object for the provided value.
 * @param {unknown} actual - Value under test.
 */
export function expect(actual) {
  return createMatchers(actual);
}

async function runTests() {
  let failures = 0;
  for (const entry of testQueue) {
    try {
      for (const hook of entry.beforeEachHandlers) {
        const hookResult = hook();
        if (isPromise(hookResult)) {
          await hookResult;
        }
      }
      const result = entry.fn();
      if (isPromise(result)) {
        await result;
      }
      console.log(`✓ ${entry.name}`);
      for (const hook of entry.afterEachHandlers) {
        const hookResult = hook();
        if (isPromise(hookResult)) {
          await hookResult;
        }
      }
    } catch (error) {
      failures += 1;
      console.error(`✖ ${entry.name}`);
      console.error(error instanceof Error ? (error.stack ?? error.message) : error);
      for (const hook of entry.afterEachHandlers) {
        try {
          const hookResult = hook();
          if (isPromise(hookResult)) {
            await hookResult;
          }
        } catch (hookError) {
          console.error(hookError);
        }
      }
    }
  }
  if (failures > 0) {
    process.exitCode = 1;
  }
  hasRunTests = true;
  testQueue.length = 0;
}

process.on('beforeExit', () => {
  if (testQueue.length === 0 || hasRunTests) {
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
