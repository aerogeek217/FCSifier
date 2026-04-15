// FCS (FSTD Capability Signature) domain logic. Pure, framework-free.
//
// An FCS is a vector of fidelity levels across 14 ICAO Doc 9625 features,
// per EASA Opinion 01/2025. Device authorises a task iff, for every feature,
// deviceFidelity >= taskFidelity under the order N < G < R < S.

export type Fidelity = 'N' | 'G' | 'R' | 'S';

export type FeatureCode =
  | 'FDK' | 'CLH' | 'CLO' | 'SYS' | 'GND'
  | 'IGE' | 'OGE' | 'SND' | 'VIB' | 'MTN'
  | 'VIS' | 'NAV' | 'ATM' | 'OST';

export type TrainingLevel = 'T' | 'TP';

export interface Feature {
  code: FeatureCode;
  name: string;
  category?: string;
  doc9625_ref?: string;
}

export type Fcs = Partial<Record<FeatureCode, Fidelity>>;

export const FIDELITY_ORDER: readonly Fidelity[] = ['N', 'G', 'R', 'S'] as const;

export const FEATURE_CODES: readonly FeatureCode[] = [
  'FDK', 'CLH', 'CLO', 'SYS', 'GND',
  'IGE', 'OGE', 'SND', 'VIB', 'MTN',
  'VIS', 'NAV', 'ATM', 'OST',
] as const;

const FIDELITY_RANK: Record<Fidelity, number> = { N: 0, G: 1, R: 2, S: 3 };

export function isFidelity(v: unknown): v is Fidelity {
  return v === 'N' || v === 'G' || v === 'R' || v === 'S';
}

export function compare(a: Fidelity, b: Fidelity): number {
  return FIDELITY_RANK[a] - FIDELITY_RANK[b];
}

// Per-feature maximum across a list of FCS vectors. Empty input → empty result.
// A feature absent from every input is absent from the output.
export function rollup(fcsList: readonly Fcs[]): Fcs {
  const out: Fcs = {};
  for (const fcs of fcsList) {
    for (const code of Object.keys(fcs) as FeatureCode[]) {
      const v = fcs[code];
      if (v === undefined) continue;
      const cur = out[code];
      if (cur === undefined || compare(v, cur) > 0) {
        out[code] = v;
      }
    }
  }
  return out;
}

// True iff device ≥ task for every feature the task requires.
// A task feature missing from the device is treated as 'N' (none installed).
export function authorizes(device: Fcs, task: Fcs): boolean {
  for (const code of Object.keys(task) as FeatureCode[]) {
    const required = task[code];
    if (required === undefined) continue;
    const has = device[code] ?? 'N';
    if (compare(has, required) < 0) return false;
  }
  return true;
}

// Parse a comma-separated fidelity string into an Fcs, using `features` as the
// column order. Throws on token-count mismatch or unknown fidelity code ('-' is
// a loader-level marker, not a fidelity, so it's rejected here).
export function parseFcs(
  input: string,
  features: readonly FeatureCode[] = FEATURE_CODES,
): Fcs {
  const tokens = input.split(',').map(t => t.trim());
  if (tokens.length !== features.length) {
    throw new Error(
      `parseFcs: expected ${features.length} values, got ${tokens.length}`,
    );
  }
  const out: Fcs = {};
  for (let i = 0; i < features.length; i++) {
    const tok = tokens[i];
    if (!isFidelity(tok)) {
      throw new Error(
        `parseFcs: invalid fidelity "${tok}" for feature ${features[i]}`,
      );
    }
    out[features[i]] = tok;
  }
  return out;
}

// Format an Fcs as a comma-separated string in `features` order.
// A feature missing from the vector is rendered as 'N' (none).
export function formatFcs(
  fcs: Fcs,
  features: readonly FeatureCode[] = FEATURE_CODES,
): string {
  return features.map(f => fcs[f] ?? 'N').join(',');
}
