/**
 * Minimal test runner for Minor League Major Filtration.
 *
 * Provides describe/it/assert without external dependencies.
 * Can run in Node (via dynamic import) or in the browser (test.html).
 */

let _suiteCount = 0;
let _passCount = 0;
let _failCount = 0;
const _failures = [];

export function describe(name, fn) {
  _suiteCount++;
  console.log(`\n=== ${name} ===`);
  fn();
}

export function it(name, fn) {
  try {
    fn();
    _passCount++;
    console.log(`  PASS: ${name}`);
  } catch (e) {
    _failCount++;
    _failures.push({ suite: name, error: e.message || String(e) });
    console.error(`  FAIL: ${name} — ${e.message || e}`);
  }
}

export const assert = {
  equal(actual, expected, msg) {
    if (actual !== expected) {
      throw new Error(msg || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  },
  deepEqual(actual, expected, msg) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(msg || `Deep equal failed:\n  expected: ${JSON.stringify(expected)}\n  actual:   ${JSON.stringify(actual)}`);
    }
  },
  ok(value, msg) {
    if (!value) {
      throw new Error(msg || `Expected truthy value, got ${JSON.stringify(value)}`);
    }
  },
  notOk(value, msg) {
    if (value) {
      throw new Error(msg || `Expected falsy value, got ${JSON.stringify(value)}`);
    }
  },
  throws(fn, msg) {
    let threw = false;
    try { fn(); } catch (e) { threw = true; }
    if (!threw) {
      throw new Error(msg || 'Expected function to throw, but it did not');
    }
  },
  approximately(actual, expected, tolerance, msg) {
    if (Math.abs(actual - expected) > tolerance) {
      throw new Error(msg || `Expected ${actual} to be within ${tolerance} of ${expected}`);
    }
  },
  greaterThan(actual, expected, msg) {
    if (actual <= expected) {
      throw new Error(msg || `Expected ${actual} > ${expected}`);
    }
  },
  lessThan(actual, expected, msg) {
    if (actual >= expected) {
      throw new Error(msg || `Expected ${actual} < ${expected}`);
    }
  },
};

export function summary() {
  console.log('\n' + '='.repeat(50));
  console.log(`Suites: ${_suiteCount}  |  Pass: ${_passCount}  |  Fail: ${_failCount}`);
  if (_failures.length > 0) {
    console.log('\nFailed tests:');
    for (const f of _failures) {
      console.log(`  - ${f.suite}: ${f.error}`);
    }
  }
  console.log('='.repeat(50));
  return { suites: _suiteCount, pass: _passCount, fail: _failCount, failures: _failures };
}

export function reset() {
  _suiteCount = 0;
  _passCount = 0;
  _failCount = 0;
  _failures.length = 0;
}
