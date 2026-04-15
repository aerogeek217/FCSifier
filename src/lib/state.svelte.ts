// Shared app state (Svelte 5 runes). A single module-level instance is exported
// so routes, widgets, and the router all see the same reactive state.
//
// `dataset` is null until `App.svelte` finishes loading. Derivations gracefully
// return empty results while null.

import {
  rollup,
  authorizes,
  type Fcs,
  type FeatureCode,
  type Fidelity,
  type TrainingLevel,
} from '../domain/fcs.ts';
import type { AircraftCategory, Dataset, TaskRow } from '../data/loader.ts';

export type CategoryFilter = AircraftCategory | 'all';

export interface TaskBuckets {
  withFcs: { task: TaskRow; fcs: Fcs }[];   // has a real FCS at the active level
  na: TaskRow[];                             // row exists but all '-'  (not performed in FSTD)
  noRequirement: TaskRow[];                  // no row at this level at all
}

export class AppState {
  dataset = $state<Dataset | null>(null);
  selectedTaskIds = $state<string[]>([]);
  deviceFcs = $state<Fcs>({});
  level = $state<TrainingLevel>('TP');
  category = $state<CategoryFilter>('all');

  readonly tasksById = $derived<Map<string, TaskRow>>(
    new Map((this.dataset?.tasks ?? []).map(t => [t.id, t])),
  );

  readonly selectedTasks = $derived<TaskRow[]>(
    this.selectedTaskIds
      .map(id => this.tasksById.get(id))
      .filter((t): t is TaskRow => t !== undefined),
  );

  readonly selectedBuckets = $derived<TaskBuckets>(
    bucketTasks(this.selectedTasks, this.level),
  );

  readonly requiredFcs = $derived<Fcs>(
    rollup(this.selectedBuckets.withFcs.map(b => b.fcs)),
  );

  // For each feature in the rolled-up required FCS, the task(s) that set the max.
  readonly drivingTasksByFeature = $derived<Record<string, TaskRow[]>>(
    drivingTasks(this.selectedBuckets.withFcs, this.requiredFcs),
  );

  readonly tasksInCategory = $derived<TaskRow[]>(
    (this.dataset?.tasks ?? []).filter(
      t => this.category === 'all' || t.aircraft_category === this.category,
    ),
  );

  readonly deviceBuckets = $derived<TaskBuckets & { notAuthorized: { task: TaskRow; fcs: Fcs }[] }>(
    partitionForDevice(this.tasksInCategory, this.level, this.deviceFcs),
  );
}

export const appState = new AppState();

function bucketTasks(tasks: readonly TaskRow[], level: TrainingLevel): TaskBuckets {
  const withFcs: { task: TaskRow; fcs: Fcs }[] = [];
  const na: TaskRow[] = [];
  const noRequirement: TaskRow[] = [];
  for (const t of tasks) {
    const v = t[level];
    if (v === undefined) noRequirement.push(t);
    else if (v === null) na.push(t);
    else withFcs.push({ task: t, fcs: v });
  }
  return { withFcs, na, noRequirement };
}

function drivingTasks(
  withFcs: readonly { task: TaskRow; fcs: Fcs }[],
  required: Fcs,
): Record<string, TaskRow[]> {
  const out: Record<string, TaskRow[]> = {};
  for (const code of Object.keys(required) as FeatureCode[]) {
    const target = required[code] as Fidelity;
    out[code] = withFcs
      .filter(b => b.fcs[code] === target)
      .map(b => b.task);
  }
  return out;
}

function partitionForDevice(
  tasks: readonly TaskRow[],
  level: TrainingLevel,
  device: Fcs,
) {
  const withFcs: { task: TaskRow; fcs: Fcs }[] = [];
  const notAuthorized: { task: TaskRow; fcs: Fcs }[] = [];
  const na: TaskRow[] = [];
  const noRequirement: TaskRow[] = [];
  for (const t of tasks) {
    const v = t[level];
    if (v === undefined) { noRequirement.push(t); continue; }
    if (v === null) { na.push(t); continue; }
    if (authorizes(device, v)) withFcs.push({ task: t, fcs: v });
    else notAuthorized.push({ task: t, fcs: v });
  }
  return { withFcs, notAuthorized, na, noRequirement };
}
