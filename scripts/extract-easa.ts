// Parses EASA Appendix 2 training matrices (aeroplane + helicopter) into
// data/tasks.csv and data/task_fcs.csv. Output is meant to be human-reviewed
// before commit — the PDF text is messy and a handful of task names leak
// continuation text between neighbours. After running, hand-check these
// tasks in data/tasks.csv against the source PDF:
//     ae-3.7.1 / ae-3.7.2   (upset exercises bullets)
//     ae-3.8.3.4 / ae-3.8.4 ("aerodrome level.")
//     ae-3.8.5   / ae-3.8.6 ("centreline ... Visual approaches")
//     ae-4.4     / ae-4.5   ("or MAPt")
//     ae-5.2                ("in any out-/of-trim" hyphenation)
//
// Usage:  node --import tsx scripts/extract-easa.ts

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(__dirname, '..');

const SRC = path.join(
  repo,
  'docs/EASA/extracted/appendix_2_-_draft_amc_and_gm_to_regulations_eu_no_1178-2011_and_eu_no_965-2012_for_information_only.txt',
);

const FEATURES = [
  'FDK', 'CLH', 'CLO', 'SYS', 'GND',
  'IGE', 'OGE', 'SND', 'VIB', 'MTN',
  'VIS', 'NAV', 'ATM', 'OST',
] as const;

type Category = 'aeroplane' | 'helicopter';

// Matrix ranges (1-based, inclusive). Confirmed in docs/reference/easa-sources.md.
const MATRICES: readonly { category: Category; start: number; end: number }[] = [
  { category: 'aeroplane',  start: 234, end: 557 },
  { category: 'helicopter', start: 558, end: 820 },
];

// Fidelity-row tail: `(TP|T)` + exactly 14 tokens from {S,R,G,N,-}, at EOL.
// Captures: 1=prefix, 2=level, 3=values.
const FIDELITY_TAIL =
  /^(.*?)\b(TP|T)\s+((?:[SRGN\-]\s+){13}[SRGN\-])\s*$/;

const SECTION_HEADER = /^\s*Section\s+(\S+)\s+[–-]\s+.+$/;

const TASK_ID_RE = /\b(\d+(?:\.\d+)+)\b/;

const PHASE_AEROPLANE: Record<string, string> = {
  '1':   'preflight',
  '2':   'takeoff',
  '3':   'flight',
  '3.4': 'systems',
  '3.6': 'emergency',
  '3.7': 'upset',
  '3.8': 'instrument',
  '4':   'missed_approach',
  '5':   'landing',
};
const PHASE_HELICOPTER: Record<string, string> = {
  '1': 'preflight',
  '2': 'flight',
  '3': 'systems',
  '4': 'emergency',
  '5': 'instrument',
};

function isNoise(s: string): boolean {
  const t = s.trim();
  if (!t) return true;
  if (t.startsWith('TE.RPRO')) return true;
  if (/^(An agency of|European Union Aviation|Appendix 2 to Opinion|Proprietary document|Draft AMC)/.test(t)) return true;
  if (/^Training to proficiency|^Manoeuvre\/Procedure/.test(t)) return true;
  // Column-header fragments ("1.Flight deck...", "4. Aircraft systems", ..., "14. Operating Sites and terrain")
  if (/^\d+\.\s*(Flight|Aircraft|Performance|Sound|Vibration|Motion|Visual|Navigation|Atmosphere|Operating|Cockpit)/i.test(t)) return true;
  // The two matrix-intro lines at the top of each matrix
  if (/^\(i+\)\s+For\s+(multi-pilot|helicopters)/.test(t)) return true;
  return false;
}

function splitFidelity(line: string): { prefix: string; level: 'TP' | 'T'; values: string[] } | null {
  const m = line.match(FIDELITY_TAIL);
  if (!m) return null;
  const values = m[3].trim().split(/\s+/);
  if (values.length !== 14) return null;
  return { prefix: m[1], level: m[2] as 'TP' | 'T', values };
}

function phaseFor(id: string, map: Record<string, string>): string {
  const parts = id.split('.');
  const two = parts.slice(0, 2).join('.');
  return map[two] ?? map[parts[0]] ?? '';
}

function normalize(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface ExtractedTask {
  id: string;
  name: string;
  section: string;
  phase: string;
  aircraft_category: Category;
  source: string;
  notes: string;
  rows: { level: 'T' | 'TP'; values: string[] }[];
}

function extractMatrix(
  allLines: string[],
  start: number,
  end: number,
  category: Category,
): ExtractedTask[] {
  const phaseMap = category === 'aeroplane' ? PHASE_AEROPLANE : PHASE_HELICOPTER;
  const prefix = category === 'aeroplane' ? 'ae' : 'he';
  const lines = allLines.slice(start - 1, end);

  const out: ExtractedTask[] = [];
  let section = '';
  let textBuf: string[] = [];
  let current: ExtractedTask | null = null;
  let unknownCount = 0;

  const finalizeId = (t: ExtractedTask): void => {
    if (!t.id || t.id.startsWith(`${prefix}-unknown-`)) return;
    // Strip the raw numeric id from name, if present
    const raw = t.id.slice(prefix.length + 1);
    t.name = normalize(t.name.replace(new RegExp(`\\b${escapeRe(raw)}\\b`), ''));
  };

  const assignId = (t: ExtractedTask, rawId: string): void => {
    t.id = `${prefix}-${rawId}`;
    t.source = `Opinion 01/2025 App.2 §${rawId}`;
    t.phase = phaseFor(rawId, phaseMap) || t.phase;
  };

  for (const raw of lines) {
    const sec = raw.match(SECTION_HEADER);
    if (sec) { section = sec[1]; continue; }

    const fid = splitFidelity(raw);
    if (fid) {
      if (fid.prefix.trim() && !isNoise(fid.prefix)) textBuf.push(fid.prefix.trim());

      if (fid.level === 'TP') {
        if (current) { finalizeId(current); out.push(current); }
        const merged = normalize(textBuf.join(' '));
        const idMatch = merged.match(TASK_ID_RE);
        const rawId = idMatch ? idMatch[1] : '';
        current = {
          id: rawId ? `${prefix}-${rawId}` : `${prefix}-unknown-${++unknownCount}`,
          name: merged,
          section,
          phase: rawId ? phaseFor(rawId, phaseMap) : (phaseMap[section.split('.')[0]] ?? ''),
          aircraft_category: category,
          source: rawId
            ? `Opinion 01/2025 App.2 §${rawId}`
            : `Opinion 01/2025 App.2 Section ${section}`,
          notes: '',
          rows: [{ level: 'TP', values: fid.values }],
        };
        textBuf = [];
        continue;
      }

      // T row
      if (!current) { textBuf = []; continue; }
      current.rows.push({ level: 'T', values: fid.values });
      const merged = normalize(textBuf.join(' '));
      if (merged) {
        if (current.id.startsWith(`${prefix}-unknown-`)) {
          const idMatch = merged.match(TASK_ID_RE);
          if (idMatch) assignId(current, idMatch[1]);
        }
        current.name = normalize(`${current.name} ${merged}`);
      }
      textBuf = [];
      continue;
    }

    const t = raw.trim();
    if (isNoise(t)) continue;
    // Drop solitary single-word continuation fragments (e.g. "procedure" trailing
    // from a T row on the previous line). They pollute the next task's leading
    // text because they carry no task id. Task labels are always multi-word.
    if (!t.includes(' ') && !TASK_ID_RE.test(t)) continue;
    textBuf.push(t);
  }

  if (current) {
    const trailing = normalize(textBuf.join(' '));
    if (trailing) current.name = normalize(`${current.name} ${trailing}`);
    finalizeId(current);
    out.push(current);
  }

  return out;
}

function csvEscape(s: unknown): string {
  if (s === undefined || s === null) return '';
  const str = String(s);
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function toCsv(rows: readonly Record<string, unknown>[], headers: readonly string[]): string {
  const head = headers.map(csvEscape).join(',');
  const body = rows.map(r => headers.map(h => csvEscape(r[h])).join(',')).join('\n');
  return `${head}\n${body}\n`;
}

const text = readFileSync(SRC, 'utf8');
const allLines = text.split(/\r?\n/);

const tasks = MATRICES.flatMap(m => extractMatrix(allLines, m.start, m.end, m.category));

const TASK_HEADERS = ['id', 'name', 'phase', 'aircraft_category', 'section', 'source', 'notes'] as const;
const FCS_HEADERS = ['task_id', 'level', ...FEATURES] as const;

const taskRows = tasks.map(t => ({
  id: t.id,
  name: t.name,
  phase: t.phase,
  aircraft_category: t.aircraft_category,
  section: t.section,
  source: t.source,
  notes: t.notes,
}));

const fcsRows = tasks.flatMap(t =>
  t.rows.map(r => ({
    task_id: t.id,
    level: r.level,
    ...Object.fromEntries(FEATURES.map((f, i) => [f, r.values[i] ?? ''])),
  })),
);

writeFileSync(path.join(repo, 'data/tasks.csv'), toCsv(taskRows, TASK_HEADERS));
writeFileSync(path.join(repo, 'data/task_fcs.csv'), toCsv(fcsRows, FCS_HEADERS));

const aeCount = tasks.filter(t => t.aircraft_category === 'aeroplane').length;
const heCount = tasks.filter(t => t.aircraft_category === 'helicopter').length;
const unknownIds = tasks.filter(t => t.id.includes('-unknown-')).map(t => t.id);
const nullFcsTasks = tasks.filter(t => t.rows.every(r => r.values.every(v => v === '-'))).map(t => t.id);

console.log(`tasks: ${tasks.length} (aeroplane=${aeCount}, helicopter=${heCount})`);
console.log(`task_fcs rows: ${fcsRows.length}`);
if (unknownIds.length) console.log(`unknown-id tasks: ${unknownIds.join(', ')}`);
if (nullFcsTasks.length) console.log(`null-FCS tasks (all '-'): ${nullFcsTasks.join(', ')}`);
