import { parseCsv } from './csv.js';

export async function loadDataset(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path}: ${res.status} ${res.statusText}`);
  const text = await res.text();
  if (path.endsWith('.json')) return JSON.parse(text);
  if (path.endsWith('.csv')) return parseCsv(text).rows;
  throw new Error(`${path}: unsupported extension`);
}
