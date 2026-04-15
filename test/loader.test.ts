import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseDataset } from '../src/data/loader.ts';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function readFixture(name: string): string {
  return readFileSync(path.join(fixturesDir, name), 'utf8');
}

function readData(name: string): string {
  return readFileSync(path.join(repoRoot, 'data', name), 'utf8');
}

function fixtureInputs(overrides: Partial<Record<'featuresJson'|'tasksCsv'|'taskFcsCsv'|'devicesJson', string>> = {}) {
  return {
    featuresJson: overrides.featuresJson ?? readFixture('features.json'),
    tasksCsv:     overrides.tasksCsv     ?? readFixture('tasks.csv'),
    taskFcsCsv:   overrides.taskFcsCsv   ?? readFixture('task_fcs.csv'),
    devicesJson:  overrides.devicesJson  ?? readFixture('devices.json'),
  };
}

test('parseDataset attaches TP and T to a task with both rows', () => {
  const ds = parseDataset(fixtureInputs());
  const both = ds.tasks.find(t => t.id === 't-both')!;
  assert.deepEqual(both.TP, { FDK: 'S', CLH: 'R', SYS: 'G' });
  assert.deepEqual(both.T,  { FDK: 'G', CLH: 'G', SYS: 'N' });
});

test('parseDataset leaves missing level as undefined', () => {
  const ds = parseDataset(fixtureInputs());
  const only = ds.tasks.find(t => t.id === 't-tp-only')!;
  assert.deepEqual(only.TP, { FDK: 'R', CLH: 'R', SYS: 'R' });
  assert.equal(only.T, undefined);
});

test('parseDataset maps all-"-" row to null (task not performed in FSTD)', () => {
  const ds = parseDataset(fixtureInputs());
  const nf = ds.tasks.find(t => t.id === 't-nfsrd')!;
  assert.equal(nf.TP, null);
  assert.equal(nf.T, null);
});

test('parseDataset rejects an unknown fidelity code', () => {
  const bad = [
    'task_id,level,FDK,CLH,SYS',
    't-both,TP,S,X,G',
    't-both,T,G,G,N',
  ].join('\n') + '\n';
  assert.throws(
    () => parseDataset(fixtureInputs({ taskFcsCsv: bad })),
    /invalid fidelity "X"/,
  );
});

test('parseDataset rejects a mix of "-" and fidelity in one row', () => {
  const bad = [
    'task_id,level,FDK,CLH,SYS',
    't-both,TP,S,-,G',
    't-both,T,G,G,N',
  ].join('\n') + '\n';
  assert.throws(
    () => parseDataset(fixtureInputs({ taskFcsCsv: bad })),
    /mixed '-' with fidelity values/,
  );
});

test('parseDataset rejects an unknown task_id in task_fcs.csv', () => {
  const bad = readFixture('task_fcs.csv') + 't-missing,TP,S,S,S\n';
  assert.throws(
    () => parseDataset(fixtureInputs({ taskFcsCsv: bad })),
    /unknown task_id "t-missing"/,
  );
});

test('parseDataset rejects an invalid aircraft_category', () => {
  const bad = [
    'id,name,phase,aircraft_category,section,source,notes',
    't-x,Bad cat,takeoff,spaceship,1,fixture,',
  ].join('\n') + '\n';
  assert.throws(
    () => parseDataset(fixtureInputs({ tasksCsv: bad, taskFcsCsv: 'task_id,level,FDK,CLH,SYS\n' })),
    /invalid aircraft_category/,
  );
});

test('parseDataset rejects a duplicate task id', () => {
  const bad = readFixture('tasks.csv') + 't-both,dup,takeoff,aeroplane,1,fixture,\n';
  assert.throws(
    () => parseDataset(fixtureInputs({ tasksCsv: bad })),
    /duplicate id "t-both"/,
  );
});

test('parseDataset rejects duplicate TP rows for a task', () => {
  const bad = readFixture('task_fcs.csv') + 't-both,TP,S,S,S\n';
  assert.throws(
    () => parseDataset(fixtureInputs({ taskFcsCsv: bad })),
    /duplicate TP row for task "t-both"/,
  );
});

test('parseDataset parses devices including partial FCS vectors', () => {
  const ds = parseDataset(fixtureInputs());
  assert.equal(ds.devices.length, 1);
  const dev = ds.devices[0];
  assert.equal(dev.id, 'dev-a');
  assert.equal(dev.aircraft_category, 'aeroplane');
  assert.deepEqual(dev.fcs, { FDK: 'S', CLH: 'R', SYS: 'G' });
});

test('parseDataset rejects device with invalid fidelity', () => {
  const bad = JSON.stringify([{
    id: 'dev-x',
    name: 'Bad',
    vendor: '',
    aircraft_category: 'aeroplane',
    fcs: { FDK: 'Q', CLH: 'R', SYS: 'G' },
    source: 'test',
  }]);
  assert.throws(
    () => parseDataset(fixtureInputs({ devicesJson: bad })),
    /invalid fidelity "Q"/,
  );
});

test('parseDataset rejects device with invalid category', () => {
  const bad = JSON.stringify([{
    id: 'dev-y',
    name: 'Bad cat',
    vendor: '',
    aircraft_category: 'tricycle',
    fcs: { FDK: 'S' },
    source: 'test',
  }]);
  assert.throws(
    () => parseDataset(fixtureInputs({ devicesJson: bad })),
    /invalid aircraft_category/,
  );
});

test('parseDataset rejects features.json with an unknown feature code', () => {
  const bad = JSON.stringify([{ code: 'ZZZ', name: 'nope' }]);
  assert.throws(
    () => parseDataset(fixtureInputs({ featuresJson: bad })),
    /unknown feature code "ZZZ"/,
  );
});

// --- integration: real files under data/ should load cleanly ---
test('parseDataset loads the committed dataset without error', () => {
  const ds = parseDataset({
    featuresJson: readData('features.json'),
    tasksCsv:     readData('tasks.csv'),
    taskFcsCsv:   readData('task_fcs.csv'),
    devicesJson:  readData('devices.json'),
  });
  assert.equal(ds.features.length, 14);
  assert.ok(ds.tasks.length > 100, `expected > 100 tasks, got ${ds.tasks.length}`);
  assert.ok(ds.devices.length >= 3, `expected ≥ 3 devices, got ${ds.devices.length}`);
  // At least one null-FCS task (e.g. §1.1 Performance calculation)
  const nullFcsCount = ds.tasks.filter(t => t.TP === null || t.T === null).length;
  assert.ok(nullFcsCount > 0, 'expected at least one null-FCS task');
});
