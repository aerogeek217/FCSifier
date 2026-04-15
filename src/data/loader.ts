// Loads and joins the four data files into a typed dataset. Pure parsing logic
// is in `parseDataset`; `loadDataset` is the browser wrapper that fetches the
// files. Tests exercise `parseDataset` with raw strings.

import { parseCsv } from './csv.js';
import {
  FEATURE_CODES,
  type Fcs,
  type Feature,
  type FeatureCode,
  type TrainingLevel,
  isFidelity,
} from '../domain/fcs.js';

const FEATURE_CODE_SET: ReadonlySet<string> = new Set(FEATURE_CODES);

function isFeatureCode(v: unknown): v is FeatureCode {
  return typeof v === 'string' && FEATURE_CODE_SET.has(v);
}

export type AircraftCategory = 'aeroplane' | 'helicopter';

export interface TaskRow {
  id: string;
  name: string;
  phase: string;
  aircraft_category: AircraftCategory;
  section: string;
  source: string;
  notes: string;
  // `undefined` — no row at this level in task_fcs.csv.
  // `null`      — row exists but all cells are '-' (task not performed in an FSTD).
  // `Fcs`       — populated vector.
  T?: Fcs | null;
  TP?: Fcs | null;
}

export interface Device {
  id: string;
  name: string;
  vendor: string;
  aircraft_category: AircraftCategory;
  fcs: Fcs;
  source: string;
}

export interface Dataset {
  features: Feature[];
  tasks: TaskRow[];
  devices: Device[];
}

export interface DatasetInputs {
  featuresJson: string;
  tasksCsv: string;
  taskFcsCsv: string;
  devicesJson: string;
}

function isCategory(v: unknown): v is AircraftCategory {
  return v === 'aeroplane' || v === 'helicopter';
}

function parseFeatures(json: string): Feature[] {
  const raw = JSON.parse(json);
  if (!Array.isArray(raw)) throw new Error('features.json: expected array');
  return raw.map((r, i) => {
    if (!r || typeof r !== 'object' || typeof r.name !== 'string') {
      throw new Error(`features.json[${i}]: expected { code, name, ... }`);
    }
    if (!isFeatureCode(r.code)) {
      throw new Error(`features.json[${i}]: unknown feature code "${String(r.code)}"`);
    }
    return r as Feature;
  });
}

function parseTasks(csv: string): Map<string, TaskRow> {
  const { headers, rows } = parseCsv(csv);
  const required = ['id', 'name', 'phase', 'aircraft_category', 'section', 'source', 'notes'];
  for (const h of required) {
    if (!headers.includes(h)) throw new Error(`tasks.csv: missing column "${h}"`);
  }
  const out = new Map<string, TaskRow>();
  for (const r of rows) {
    if (!r.id) continue;
    if (!isCategory(r.aircraft_category)) {
      throw new Error(`tasks.csv: task "${r.id}" has invalid aircraft_category "${r.aircraft_category}"`);
    }
    if (out.has(r.id)) throw new Error(`tasks.csv: duplicate id "${r.id}"`);
    out.set(r.id, {
      id: r.id,
      name: r.name,
      phase: r.phase,
      aircraft_category: r.aircraft_category,
      section: r.section,
      source: r.source,
      notes: r.notes,
    });
  }
  return out;
}

function parseTaskFcs(
  csv: string,
  featureCodes: readonly FeatureCode[],
  tasks: Map<string, TaskRow>,
): void {
  const { headers, rows } = parseCsv(csv);
  if (!headers.includes('task_id') || !headers.includes('level')) {
    throw new Error('task_fcs.csv: missing task_id or level column');
  }
  for (const code of featureCodes) {
    if (!headers.includes(code)) throw new Error(`task_fcs.csv: missing feature column "${code}"`);
  }

  for (const r of rows) {
    const taskId = r.task_id;
    const level = r.level;
    if (!taskId) continue;
    if (level !== 'T' && level !== 'TP') {
      throw new Error(`task_fcs.csv: row "${taskId}" has invalid level "${level}" (expected T or TP)`);
    }
    const task = tasks.get(taskId);
    if (!task) throw new Error(`task_fcs.csv: unknown task_id "${taskId}"`);

    const values = featureCodes.map(c => r[c]);
    const allDash = values.every(v => v === '-');
    let fcs: Fcs | null;
    if (allDash) {
      fcs = null;
    } else {
      fcs = {};
      for (let i = 0; i < featureCodes.length; i++) {
        const v = values[i];
        if (v === '-') {
          throw new Error(
            `task_fcs.csv: task "${taskId}" level ${level}: mixed '-' with fidelity values (feature ${featureCodes[i]}). Use all '-' or no '-'.`,
          );
        }
        if (!isFidelity(v)) {
          throw new Error(
            `task_fcs.csv: task "${taskId}" level ${level}: invalid fidelity "${v}" for feature ${featureCodes[i]}`,
          );
        }
        fcs[featureCodes[i]] = v;
      }
    }

    const key: TrainingLevel = level;
    if (task[key] !== undefined) {
      throw new Error(`task_fcs.csv: duplicate ${level} row for task "${taskId}"`);
    }
    task[key] = fcs;
  }
}

function parseDevices(json: string, featureCodes: readonly FeatureCode[]): Device[] {
  const raw = JSON.parse(json);
  if (!Array.isArray(raw)) throw new Error('devices.json: expected array');
  return raw.map((d, i) => {
    if (!d || typeof d !== 'object') throw new Error(`devices.json[${i}]: not an object`);
    if (typeof d.id !== 'string' || !d.id) throw new Error(`devices.json[${i}]: missing id`);
    if (!isCategory(d.aircraft_category)) {
      throw new Error(`devices.json[${i}] (${d.id}): invalid aircraft_category`);
    }
    if (!d.fcs || typeof d.fcs !== 'object') {
      throw new Error(`devices.json[${i}] (${d.id}): missing fcs object`);
    }
    const fcs: Fcs = {};
    for (const code of featureCodes) {
      const v = (d.fcs as Record<string, unknown>)[code];
      if (v === undefined) continue; // optional — absent = 'N' per domain contract
      if (!isFidelity(v)) {
        throw new Error(`devices.json[${i}] (${d.id}): invalid fidelity "${String(v)}" for feature ${code}`);
      }
      fcs[code] = v;
    }
    return {
      id: d.id,
      name: typeof d.name === 'string' ? d.name : '',
      vendor: typeof d.vendor === 'string' ? d.vendor : '',
      aircraft_category: d.aircraft_category,
      fcs,
      source: typeof d.source === 'string' ? d.source : '',
    };
  });
}

export function parseDataset(inputs: DatasetInputs): Dataset {
  const features = parseFeatures(inputs.featuresJson);
  const featureCodes = features.map(f => f.code);
  const tasks = parseTasks(inputs.tasksCsv);
  parseTaskFcs(inputs.taskFcsCsv, featureCodes, tasks);
  const devices = parseDevices(inputs.devicesJson, featureCodes);
  return { features, tasks: [...tasks.values()], devices };
}

export async function loadDataset(baseUrl = 'data/'): Promise<Dataset> {
  const [featuresJson, tasksCsv, taskFcsCsv, devicesJson] = await Promise.all([
    fetch(`${baseUrl}features.json`).then(r => r.text()),
    fetch(`${baseUrl}tasks.csv`).then(r => r.text()),
    fetch(`${baseUrl}task_fcs.csv`).then(r => r.text()),
    fetch(`${baseUrl}devices.json`).then(r => r.text()),
  ]);
  return parseDataset({ featuresJson, tasksCsv, taskFcsCsv, devicesJson });
}
