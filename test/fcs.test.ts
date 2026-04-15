import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  compare,
  rollup,
  authorizes,
  parseFcs,
  formatFcs,
  isFidelity,
  FEATURE_CODES,
  FIDELITY_ORDER,
  type Fcs,
  type Fidelity,
} from '../src/domain/fcs.ts';

// ---- compare ------------------------------------------------------------

test('compare: N < G < R < S', () => {
  assert.ok(compare('N', 'G') < 0);
  assert.ok(compare('G', 'R') < 0);
  assert.ok(compare('R', 'S') < 0);
  assert.ok(compare('N', 'S') < 0);
});

test('compare: equal fidelities return 0', () => {
  for (const f of FIDELITY_ORDER) {
    assert.equal(compare(f, f), 0);
  }
});

test('compare: higher on left returns > 0', () => {
  assert.ok(compare('S', 'N') > 0);
  assert.ok(compare('R', 'G') > 0);
  assert.ok(compare('G', 'N') > 0);
});

test('compare: sorts a fidelity list ascending', () => {
  const arr: Fidelity[] = ['S', 'N', 'R', 'G', 'S', 'N'];
  arr.sort(compare);
  assert.deepEqual(arr, ['N', 'N', 'G', 'R', 'S', 'S']);
});

// ---- rollup -------------------------------------------------------------

test('rollup: empty input returns empty FCS', () => {
  assert.deepEqual(rollup([]), {});
});

test('rollup: singleton is identity', () => {
  const fcs: Fcs = { FDK: 'S', CLH: 'R', MTN: 'N' };
  assert.deepEqual(rollup([fcs]), { FDK: 'S', CLH: 'R', MTN: 'N' });
});

test('rollup: per-feature max across many inputs', () => {
  const a: Fcs = { FDK: 'R', CLH: 'G', MTN: 'S' };
  const b: Fcs = { FDK: 'S', CLH: 'R', MTN: 'N' };
  const c: Fcs = { FDK: 'N', CLH: 'S', MTN: 'R' };
  assert.deepEqual(rollup([a, b, c]), { FDK: 'S', CLH: 'S', MTN: 'S' });
});

test('rollup: features present in only some inputs propagate', () => {
  const a: Fcs = { FDK: 'R' };
  const b: Fcs = { CLH: 'G' };
  assert.deepEqual(rollup([a, b]), { FDK: 'R', CLH: 'G' });
});

test('rollup: feature absent from every input is absent from result', () => {
  const result = rollup([{ FDK: 'R' } as Fcs]);
  assert.ok(!('CLH' in result));
});

test('rollup: ties preserve the level', () => {
  assert.deepEqual(
    rollup([{ FDK: 'R' } as Fcs, { FDK: 'R' } as Fcs]),
    { FDK: 'R' },
  );
});

// ---- authorizes ---------------------------------------------------------

test('authorizes: device ≥ task at every feature → true', () => {
  const device: Fcs = { FDK: 'S', CLH: 'S', MTN: 'R' };
  const task: Fcs = { FDK: 'S', CLH: 'R', MTN: 'G' };
  assert.equal(authorizes(device, task), true);
});

test('authorizes: device below task on any feature → false', () => {
  const device: Fcs = { FDK: 'R', CLH: 'R', MTN: 'R' };
  const task: Fcs = { FDK: 'S', CLH: 'R', MTN: 'R' };
  assert.equal(authorizes(device, task), false);
});

test('authorizes: equal fidelities at every feature → true', () => {
  const device: Fcs = { FDK: 'G', CLH: 'G' };
  const task: Fcs = { FDK: 'G', CLH: 'G' };
  assert.equal(authorizes(device, task), true);
});

test('authorizes: task requires N from a device missing that feature → true', () => {
  const device: Fcs = { FDK: 'S' };
  const task: Fcs = { FDK: 'S', CLH: 'N' };
  assert.equal(authorizes(device, task), true);
});

test('authorizes: task requires > N from a device missing that feature → false', () => {
  const device: Fcs = { FDK: 'S' };
  const task: Fcs = { FDK: 'S', CLH: 'G' };
  assert.equal(authorizes(device, task), false);
});

test('authorizes: device surplus features are ignored', () => {
  const device: Fcs = { FDK: 'S', CLH: 'S', MTN: 'S' };
  const task: Fcs = { FDK: 'R' };
  assert.equal(authorizes(device, task), true);
});

test('authorizes: empty task → always true (nothing required)', () => {
  assert.equal(authorizes({ FDK: 'N' } as Fcs, {}), true);
  assert.equal(authorizes({}, {}), true);
});

test('authorizes: full tier-boundary matrix', () => {
  const tiers: Fidelity[] = ['N', 'G', 'R', 'S'];
  for (let i = 0; i < tiers.length; i++) {
    for (let j = 0; j < tiers.length; j++) {
      const device: Fcs = { FDK: tiers[i] };
      const task: Fcs = { FDK: tiers[j] };
      assert.equal(
        authorizes(device, task),
        i >= j,
        `device=${tiers[i]} task=${tiers[j]} should be ${i >= j}`,
      );
    }
  }
});

// ---- parseFcs / formatFcs ----------------------------------------------

test('parseFcs ∘ formatFcs: round-trips all 14 features in canonical order', () => {
  const s = 'S,S,R,G,N,G,R,R,R,R,S,R,G,N';
  const parsed = parseFcs(s);
  assert.equal(formatFcs(parsed), s);
});

test('parseFcs: assigns tokens to canonical feature codes', () => {
  const parsed = parseFcs('S,R,G,N,S,R,G,N,S,R,G,N,S,R');
  assert.equal(parsed.FDK, 'S');
  assert.equal(parsed.CLH, 'R');
  assert.equal(parsed.OST, 'R');
  assert.equal(parsed.MTN, 'R');
});

test('parseFcs: rejects unknown fidelity codes', () => {
  assert.throws(() => parseFcs('X,S,R,G,N,G,R,R,R,R,S,R,G,N'));
});

test('parseFcs: rejects the "-" placeholder (handled at loader layer, not here)', () => {
  assert.throws(() => parseFcs('-,S,R,G,N,G,R,R,R,R,S,R,G,N'));
});

test('parseFcs: rejects wrong token count', () => {
  assert.throws(() => parseFcs('S,R,G'));
  assert.throws(() => parseFcs('S,R,G,N,S,R,G,N,S,R,G,N,S,R,G'));
});

test('formatFcs: missing features render as "N"', () => {
  const partial: Fcs = { FDK: 'S' };
  assert.equal(formatFcs(partial), 'S,N,N,N,N,N,N,N,N,N,N,N,N,N');
});

test('parseFcs / formatFcs: accept a custom feature order', () => {
  const parsed = parseFcs('S,R', ['FDK', 'CLH']);
  assert.deepEqual(parsed, { FDK: 'S', CLH: 'R' });
  assert.equal(formatFcs({ FDK: 'S', CLH: 'R' }, ['FDK', 'CLH']), 'S,R');
});

test('parseFcs: tolerates whitespace around tokens', () => {
  const parsed = parseFcs(' S , R ', ['FDK', 'CLH']);
  assert.deepEqual(parsed, { FDK: 'S', CLH: 'R' });
});

// ---- constants & guards -------------------------------------------------

test('FEATURE_CODES: 14 canonical codes in canonical order', () => {
  assert.deepEqual([...FEATURE_CODES], [
    'FDK', 'CLH', 'CLO', 'SYS', 'GND',
    'IGE', 'OGE', 'SND', 'VIB', 'MTN',
    'VIS', 'NAV', 'ATM', 'OST',
  ]);
});

test('FIDELITY_ORDER: ascending N,G,R,S', () => {
  assert.deepEqual([...FIDELITY_ORDER], ['N', 'G', 'R', 'S']);
});

test('isFidelity: accepts valid, rejects everything else', () => {
  for (const f of FIDELITY_ORDER) assert.ok(isFidelity(f));
  for (const v of ['-', '', 'X', 'n', 's', null, undefined, 0]) {
    assert.equal(isFidelity(v), false);
  }
});
