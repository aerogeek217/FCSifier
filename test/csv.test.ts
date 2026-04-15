import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv } from '../src/data/csv.ts';

test('parses simple CSV with headers', () => {
  const { headers, rows } = parseCsv('a,b,c\n1,2,3\n4,5,6\n');
  assert.deepEqual(headers, ['a', 'b', 'c']);
  assert.deepEqual(rows, [
    { a: '1', b: '2', c: '3' },
    { a: '4', b: '5', c: '6' },
  ]);
});

test('handles quoted fields with commas', () => {
  const { rows } = parseCsv('name,desc\nfoo,"a, b, c"\n');
  assert.equal(rows[0].desc, 'a, b, c');
});

test('handles escaped double quotes', () => {
  const { rows } = parseCsv('q\n"he said ""hi"""\n');
  assert.equal(rows[0].q, 'he said "hi"');
});

test('handles CRLF line endings', () => {
  const { rows } = parseCsv('a,b\r\n1,2\r\n');
  assert.deepEqual(rows, [{ a: '1', b: '2' }]);
});

test('returns empty on empty input', () => {
  assert.deepEqual(parseCsv(''), { headers: [], rows: [] });
});

test('skips trailing blank lines', () => {
  const { rows } = parseCsv('a\n1\n\n');
  assert.equal(rows.length, 1);
});
