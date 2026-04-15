<script lang="ts">
  import { appState } from '../lib/state.svelte.ts';
  import FcsMatrix from '../lib/FcsMatrix.svelte';
  import DevicePresets from '../lib/DevicePresets.svelte';
  import {
    compare,
    formatFcs,
    type Fcs,
    type FeatureCode,
    type Fidelity,
  } from '../domain/fcs.ts';
  import type { Device, TaskRow } from '../data/loader.ts';

  let search = $state('');
  let hideExceeding = $state(false);
  let copied = $state<'tasks' | 'fcs' | null>(null);
  let copyError = $state<string | null>(null);

  const hasFcs = $derived(Object.keys(appState.deviceFcs).length > 0);
  const features = $derived(appState.dataset?.features ?? []);
  const presetCategory = $derived(
    appState.category === 'all' ? 'aeroplane' : appState.category,
  );

  function onFidelityChange(code: FeatureCode, value: Fidelity): void {
    appState.deviceFcs = { ...appState.deviceFcs, [code]: value };
  }
  function onLoadPreset(d: Device): void {
    appState.deviceFcs = { ...d.fcs };
    appState.category = d.aircraft_category;
  }
  function clearFcs(): void {
    appState.deviceFcs = {};
    hideExceeding = false;
  }

  function taskExceeds(taskFcs: Fcs): boolean {
    for (const code of Object.keys(taskFcs) as FeatureCode[]) {
      const t = taskFcs[code];
      if (!t) continue;
      const d = appState.deviceFcs[code] ?? 'N';
      if (compare(t, d) > 0) return true;
    }
    return false;
  }

  const visibleTasks = $derived.by<TaskRow[]>(() => {
    const q = search.trim().toLowerCase();
    return appState.tasksInCategory.filter(t => {
      if (q && !(t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q))) {
        return false;
      }
      if (hideExceeding && hasFcs) {
        const fcs = t[appState.level];
        if (fcs && typeof fcs === 'object' && taskExceeds(fcs)) return false;
      }
      return true;
    });
  });

  async function copyTasks(): Promise<void> {
    const headers = ['ID', 'Name', 'Category', 'Level', ...features.map(f => f.code)];
    const lines: string[] = [headers.join('\t')];
    for (const t of visibleTasks) {
      const fcs = t[appState.level];
      const cells = features.map(f => {
        if (fcs === undefined) return '';
        if (fcs === null) return '-';
        return fcs[f.code] ?? 'N';
      });
      lines.push([t.id, t.name, t.aircraft_category, appState.level, ...cells].join('\t'));
    }
    await writeClipboard(lines.join('\n'), 'tasks');
  }

  async function copyFcs(): Promise<void> {
    const labelled = features
      .map(f => `${f.code}=${appState.deviceFcs[f.code] ?? 'N'}`)
      .join(', ');
    const compact = formatFcs(appState.deviceFcs);
    await writeClipboard(`${labelled}\n(${compact})`, 'fcs');
  }

  async function writeClipboard(text: string, kind: 'tasks' | 'fcs'): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      copied = kind;
      copyError = null;
      setTimeout(() => { if (copied === kind) copied = null; }, 1500);
    } catch (e) {
      copyError = e instanceof Error ? e.message : String(e);
    }
  }
</script>

<section class="grid-view">
  <details class="fcs-panel" open>
    <summary>
      <strong>Reference FCS</strong>
      <span class="hint">
        {hasFcs
          ? '— cells exceeding this show red; uncheck/clear to disable comparison'
          : '— optional; set to compare tasks against a device'}
      </span>
    </summary>
    {#if appState.dataset}
      <DevicePresets
        builtin={appState.dataset.devices}
        currentFcs={appState.deviceFcs}
        currentCategory={presetCategory}
        onLoad={onLoadPreset}
      />
      <FcsMatrix
        features={appState.dataset.features}
        fcs={appState.deviceFcs}
        mode="edit"
        onFcsChange={onFidelityChange}
      />
      <div class="fcs-actions">
        <button type="button" onclick={clearFcs}>Clear (all N)</button>
      </div>
    {/if}
  </details>

  <div class="toolbar">
    <label class="search">
      <span>Search</span>
      <input type="search" bind:value={search} placeholder="id or name…" />
    </label>
    {#if hasFcs}
      <label class="toggle">
        <input type="checkbox" bind:checked={hideExceeding} />
        Hide tasks exceeding FCS
      </label>
    {/if}
    <span class="count">Showing {visibleTasks.length} of {appState.tasksInCategory.length}</span>
    <div class="copy-actions">
      <button type="button" onclick={copyTasks} title="TSV — paste into a spreadsheet">
        {copied === 'tasks' ? '✓ Copied' : 'Copy task list'}
      </button>
      {#if hasFcs}
        <button type="button" onclick={copyFcs} title="Labelled FCS vector">
          {copied === 'fcs' ? '✓ Copied' : 'Copy FCS'}
        </button>
      {/if}
    </div>
  </div>

  {#if copyError}
    <p class="error">Copy failed: {copyError}</p>
  {/if}

  <div class="legend">
    <span class="legend-group">
      <span class="legend-label">Fidelity:</span>
      <span class="sw fid-N">N</span>
      <span class="sw fid-G">G</span>
      <span class="sw fid-R">R</span>
      <span class="sw fid-S">S</span>
    </span>
    {#if hasFcs}
      <span class="legend-group">
        <span class="legend-label">Exceeds FCS:</span>
        <span class="sw over-G">G</span>
        <span class="sw over-R">R</span>
        <span class="sw over-S">S</span>
      </span>
    {/if}
    <span class="legend-group">
      <span class="sw sw-na">—</span><span class="legend-label">not performed in FSTD</span>
      <span class="sw sw-blank">·</span><span class="legend-label">no {appState.level} row</span>
    </span>
  </div>

  <div class="grid-scroll">
    <table class="grid">
      <thead>
        <tr>
          <th class="task-head">Task</th>
          {#each features as f (f.code)}
            <th title={f.name}>{f.code}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each visibleTasks as t (t.id)}
          {@const fcs = t[appState.level]}
          <tr>
            <td class="task-cell">
              <span class="id">{t.id}</span>
              <span class="name">{t.name}</span>
            </td>
            {#if fcs === undefined}
              {#each features as f (f.code)}
                <td class="sw-blank" title="No {appState.level} row">·</td>
              {/each}
            {:else if fcs === null}
              {#each features as f (f.code)}
                <td class="sw-na" title="Not performed in an FSTD">—</td>
              {/each}
            {:else}
              {#each features as f (f.code)}
                {@const v = fcs[f.code] ?? 'N'}
                {@const exceeds = hasFcs && compare(v, appState.deviceFcs[f.code] ?? 'N') > 0}
                <td class={exceeds ? `over-${v}` : `fid-${v}`} title={`${f.name}: ${v}`}>
                  {v}
                </td>
              {/each}
            {/if}
          </tr>
        {:else}
          <tr>
            <td class="empty" colspan={features.length + 1}>No tasks match.</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</section>

<style>
  .grid-view {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .fcs-panel {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 0.4rem 0.75rem 0.6rem;
  }
  .fcs-panel summary {
    cursor: pointer;
    user-select: none;
    padding: 0.15rem 0;
  }
  .fcs-panel summary .hint {
    color: var(--muted);
    font-weight: normal;
    font-size: 0.85rem;
    margin-left: 0.5rem;
  }
  .fcs-actions { margin-top: 0.5rem; }
  .fcs-actions button { padding: 0.25rem 0.5rem; font: inherit; }

  .toolbar {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    flex-wrap: wrap;
  }
  .toolbar .search {
    display: inline-flex;
    gap: 0.35rem;
    align-items: center;
  }
  .toolbar .search span { color: var(--muted); font-size: 0.85rem; }
  .toolbar .search input {
    padding: 0.25rem 0.4rem;
    border: 1px solid var(--border);
    border-radius: 3px;
    font: inherit;
    min-width: 10rem;
  }
  .toolbar .toggle {
    display: inline-flex;
    gap: 0.35rem;
    align-items: center;
    font-size: 0.9rem;
  }
  .toolbar .count { color: var(--muted); font-size: 0.85rem; }
  .toolbar .copy-actions {
    margin-left: auto;
    display: flex;
    gap: 0.4rem;
  }
  .toolbar .copy-actions button {
    padding: 0.25rem 0.6rem;
    font: inherit;
    cursor: pointer;
  }

  .error { color: #b00020; margin: 0; }

  .legend {
    display: flex;
    gap: 1.25rem;
    flex-wrap: wrap;
    align-items: center;
    font-size: 0.8rem;
    color: var(--muted);
  }
  .legend .legend-group {
    display: inline-flex;
    gap: 0.35rem;
    align-items: center;
  }
  .legend .legend-label { color: var(--muted); }
  .legend .sw {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.6rem;
    height: 1.2rem;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 3px;
    font-weight: 600;
    font-size: 0.75rem;
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  }

  .grid-scroll {
    overflow: auto;
    max-height: 72vh;
    border: 1px solid var(--border);
    background: #fff;
  }
  .grid {
    border-collapse: separate;
    border-spacing: 0;
    font-variant-numeric: tabular-nums;
    width: auto;
    margin: 0;
  }
  .grid th,
  .grid td {
    border-right: 1px solid #eaeaea;
    border-bottom: 1px solid #eaeaea;
    padding: 0.25rem 0.35rem;
    text-align: center;
    background: #fff;
    font-size: 0.85rem;
    min-width: 2.25rem;
  }
  .grid thead th {
    position: sticky;
    top: 0;
    z-index: 2;
    background: #f1f3f5;
    font-size: 0.8rem;
    letter-spacing: 0.03em;
  }
  .grid thead th.task-head {
    left: 0;
    z-index: 3;
    text-align: left;
    min-width: 18rem;
  }
  .grid .task-cell {
    position: sticky;
    left: 0;
    z-index: 1;
    text-align: left;
    min-width: 18rem;
    max-width: 24rem;
    border-right: 2px solid var(--border);
    background: #fff;
    white-space: normal;
  }
  .grid tbody tr:nth-child(even) .task-cell { background: #fafafa; }
  .grid .task-cell .id {
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
    font-size: 0.78rem;
    color: var(--muted);
    margin-right: 0.5rem;
  }
  .grid tbody tr:hover .task-cell { background: #eef6ff; }

  /* Fidelity — blue gradient from N (lightest) to S (darkest) */
  .grid td.fid-N,
  .legend .sw.fid-N { background: #eff4fa; color: #7c8b9c; font-weight: 600; }
  .grid td.fid-G,
  .legend .sw.fid-G { background: #bfdbfe; color: #1e3a8a; font-weight: 600; }
  .grid td.fid-R,
  .legend .sw.fid-R { background: #3b82f6; color: #fff;    font-weight: 600; }
  .grid td.fid-S,
  .legend .sw.fid-S { background: #1e3a8a; color: #fff;    font-weight: 600; }

  /* Exceeds FCS — red gradient */
  .grid td.over-G,
  .legend .sw.over-G { background: #fecaca; color: #7f1d1d; font-weight: 700; }
  .grid td.over-R,
  .legend .sw.over-R { background: #ef4444; color: #fff;    font-weight: 700; }
  .grid td.over-S,
  .legend .sw.over-S { background: #7f1d1d; color: #fff;    font-weight: 700; }

  .grid td.sw-na,
  .legend .sw.sw-na { background: #f6f6f6; color: var(--muted); font-weight: 400; }
  .grid td.sw-blank,
  .legend .sw.sw-blank { background: #fcfcfc; color: #bbb; font-weight: 400; }

  .grid .empty {
    text-align: center;
    font-style: italic;
    color: var(--muted);
    padding: 1rem;
  }
</style>
