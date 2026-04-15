<script lang="ts">
  import { appState } from '../lib/state.svelte.ts';
  import DevicePresets from '../lib/DevicePresets.svelte';
  import {
    compare,
    formatFcs,
    FIDELITY_ORDER,
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

  type TrainState = 'go' | 'no-go' | 'none' | 'blank';
  function trainState(fcs: Fcs | null | undefined): TrainState {
    if (fcs === undefined) return 'blank';
    if (fcs === null) return 'none';
    if (!hasFcs) return 'blank';
    return taskExceeds(fcs) ? 'no-go' : 'go';
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

  const trainStats = $derived.by<{ go: number; applicable: number } | null>(() => {
    if (!hasFcs) return null;
    let go = 0;
    let applicable = 0;
    for (const t of visibleTasks) {
      const fcs = t[appState.level];
      if (fcs && typeof fcs === 'object') {
        applicable++;
        if (!taskExceeds(fcs)) go++;
      }
    }
    return { go, applicable };
  });

  async function copyTasks(): Promise<void> {
    const headers = ['ID', 'Name', 'Category', 'Level', 'Status', ...features.map(f => f.code)];
    const lines: string[] = [headers.join('\t')];
    for (const t of visibleTasks) {
      const fcs = t[appState.level];
      const status = (
        {
          'go': 'GO',
          'no-go': 'NO-GO',
          'none': 'n/a',
          'blank': hasFcs ? '' : '-',
        } as const
      )[trainState(fcs)];
      const cells = features.map(f => {
        if (fcs === undefined) return '';
        if (fcs === null) return '-';
        return fcs[f.code] ?? 'N';
      });
      lines.push([t.id, t.name, t.aircraft_category, appState.level, status, ...cells].join('\t'));
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
  <!-- Toolbar -->
  <div class="toolbar card">
    <div class="toolbar-row">
      <div class="t-group t-presets">
        <span class="t-label">Reference device</span>
        {#if appState.dataset}
          <DevicePresets
            builtin={appState.dataset.devices}
            currentFcs={appState.deviceFcs}
            currentCategory={presetCategory}
            onLoad={onLoadPreset}
          />
          {#if hasFcs}
            <button type="button" class="ghost" onclick={clearFcs}>Clear FCS</button>
          {/if}
        {/if}
      </div>

      <div class="t-group t-search">
        <span class="t-label">Search</span>
        <input type="search" bind:value={search} placeholder="task id or name…" />
        <span class="count">
          <strong>{visibleTasks.length}</strong>
          <span>of {appState.tasksInCategory.length}</span>
        </span>
      </div>

      <div class="t-group t-actions">
        {#if hasFcs}
          <label class="toggle">
            <input type="checkbox" bind:checked={hideExceeding} />
            <span>Hide exceeding</span>
          </label>
        {/if}
        <button type="button" onclick={copyTasks} title="TSV — paste into a spreadsheet">
          {copied === 'tasks' ? '✓ Copied' : 'Copy tasks'}
        </button>
        {#if hasFcs}
          <button type="button" onclick={copyFcs} title="Labelled FCS vector">
            {copied === 'fcs' ? '✓ Copied' : 'Copy FCS'}
          </button>
        {/if}
      </div>
    </div>

    <div class="legend">
      <span class="legend-group">
        <span class="legend-label">Fidelity</span>
        <span class="sw fid-N">N</span>
        <span class="sw fid-G">G</span>
        <span class="sw fid-R">R</span>
        <span class="sw fid-S">S</span>
      </span>
      {#if hasFcs}
        <span class="legend-group">
          <span class="legend-label">Exceeds</span>
          <span class="sw over-G">G</span>
          <span class="sw over-R">R</span>
          <span class="sw over-S">S</span>
        </span>
        <span class="legend-group legend-train">
          <span class="legend-label">Train</span>
          <span class="badge go">Go</span>
          <span class="badge no-go">No-Go</span>
        </span>
      {/if}
      <span class="legend-group">
        <span class="sw sw-na">—</span>
        <span class="legend-label">not in FSTD</span>
        <span class="sw sw-blank">·</span>
        <span class="legend-label">no {appState.level} row</span>
      </span>
    </div>
  </div>

  {#if copyError}
    <p class="error">Copy failed: {copyError}</p>
  {/if}

  <!-- Main grid -->
  <div class="grid-scroll card">
    <table class="grid">
      <thead>
        <tr class="head-row" class:has-fcs={hasFcs}>
          <th class="task-head">
            <div class="h-task-label">
              <span class="head-eyebrow">Training task</span>
              <span class="head-sub">EASA CS-FSTD Appendix 2</span>
            </div>
            <div class="h-ref-label">
              <span class="ref-tick">▸</span>
              <span>Reference FCS</span>
              <span class="ref-hint">{hasFcs ? 'comparing' : 'set to compare'}</span>
            </div>
          </th>
          <th class="status-head" class:live={hasFcs} title="Can the task be trained on the reference FCS?">
            <div class="h-status-label">
              <span class="status-tick">◈</span>
              <span>Train</span>
            </div>
            <div class="h-status-stats">
              {#if trainStats}
                <span class="stat-num">{trainStats.go}</span>
                <span class="stat-div">/</span>
                <span class="stat-den">{trainStats.applicable}</span>
                <span class="stat-unit">go</span>
              {:else}
                <span class="stat-idle">awaiting FCS</span>
              {/if}
            </div>
          </th>
          {#each features as f (f.code)}
            {@const v = (appState.deviceFcs[f.code] ?? 'N') as Fidelity}
            <th class="combo-head fid-{v}" title={f.name}>
              <div class="h-code">{f.code}</div>
              <div class="h-fcs">
                <select aria-label={f.name} value={v}
                  onchange={(e) => onFidelityChange(f.code, (e.currentTarget as HTMLSelectElement).value as Fidelity)}>
                  {#each FIDELITY_ORDER as lvl (lvl)}
                    <option value={lvl}>{lvl}</option>
                  {/each}
                </select>
              </div>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each visibleTasks as t (t.id)}
          {@const fcs = t[appState.level]}
          {@const ts = trainState(fcs)}
          <tr class="row-{ts}">
            <td class="task-cell">
              <span class="id">{t.id}</span>
              <span class="name">{t.name}</span>
            </td>
            <td class="status-cell" data-state={ts}>
              {#if ts === 'go'}
                <span class="badge go" title="Task is trainable on this FCS">Go</span>
              {:else if ts === 'no-go'}
                <span class="badge no-go" title="Task requires higher fidelity than this FCS">No-Go</span>
              {:else if ts === 'none'}
                <span class="status-muted" title="Not performed in an FSTD">n/a</span>
              {:else if !hasFcs}
                <span class="status-muted" title="Set a reference FCS to evaluate">·</span>
              {:else}
                <span class="status-muted" title="No {appState.level} row">·</span>
              {/if}
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
            <td class="empty" colspan={features.length + 2}>No tasks match.</td>
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
    gap: 0.85rem;
  }

  .card {
    background: var(--paper-warm);
    border: 1px solid var(--rule);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
  }

  /* ── Toolbar ──────────────────────────── */
  .toolbar { padding: 0.7rem 0.9rem; }
  .toolbar-row {
    display: flex;
    flex-wrap: wrap;
    gap: 1.25rem 1.5rem;
    align-items: flex-end;
  }
  .t-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .t-group.t-search { flex: 1; min-width: 18rem; }
  .t-group.t-actions { margin-left: auto; }
  .t-label {
    font: 600 0.62rem/1 var(--font-body);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--ink-mute);
  }
  .t-search input[type="search"] {
    flex: 1;
    min-width: 12rem;
  }
  .count {
    display: inline-flex;
    align-items: baseline;
    gap: 0.3rem;
    font: 0.8rem var(--font-mono);
    color: var(--ink-mute);
    padding-left: 0.4rem;
    border-left: 1px solid var(--rule);
    margin-left: 0.4rem;
  }
  .count strong {
    color: var(--ink);
    font-weight: 700;
    font-size: 0.95rem;
  }
  .toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.85rem;
    color: var(--ink-soft);
    cursor: pointer;
    user-select: none;
  }
  .toggle input { accent-color: var(--ink); }

  button.ghost {
    background: transparent;
    border-color: var(--rule);
    color: var(--ink-mute);
  }
  button.ghost:hover {
    color: var(--paper-warm);
    background: var(--ink-soft);
    border-color: var(--ink-soft);
  }

  /* ── Legend ───────────────────────────── */
  .legend {
    margin-top: 0.6rem;
    padding-top: 0.6rem;
    border-top: 1px dashed var(--rule);
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
    align-items: center;
    font-size: 0.78rem;
    color: var(--ink-mute);
  }
  .legend-group {
    display: inline-flex;
    gap: 0.3rem;
    align-items: center;
  }
  .legend-label {
    color: var(--ink-mute);
    font: 600 0.62rem/1 var(--font-body);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-right: 0.2rem;
  }
  .legend .sw {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.55rem;
    height: 1.2rem;
    border: 1px solid rgba(13, 31, 60, 0.12);
    border-radius: 2px;
    font: 600 0.72rem/1 var(--font-mono);
  }

  /* ── Grid scroll ──────────────────────── */
  .grid-scroll {
    overflow: auto;
    max-height: 76vh;
    background: var(--paper-warm);
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
    border-right: 1px solid var(--rule-soft);
    border-bottom: 1px solid var(--rule-soft);
    padding: 0.32rem 0.45rem;
    text-align: center;
    background: var(--paper-warm);
    font-size: 0.85rem;
    min-width: 2.5rem;
    height: 1.85rem;
  }

  /* Single combined sticky header. Each column's cell stacks the feature
     code (dark band) on top of the editable reference FCS dropdown. This
     guarantees column alignment (one row = one column set) and avoids
     the cross-row sticky-positioning pitfalls of a two-row header. */
  .grid thead tr.head-row th {
    position: sticky;
    top: 0;
    z-index: 4;
    padding: 0;
    height: auto;
    vertical-align: top;
    background: var(--paper-warm);
    border-right: 1px solid var(--rule-soft);
    border-bottom: 2px solid var(--ink);
  }
  .grid thead tr.head-row th.task-head {
    left: 0;
    z-index: 6;
    text-align: left;
    min-width: 19rem;
    box-shadow: 1px 0 0 var(--ink);
  }

  /* Top band on every header cell — dark ink, feature code or task title.
     Fixed height so each column's top band aligns horizontally with the
     neighbouring task-head top band. */
  .h-code,
  .h-task-label {
    background: var(--ink);
    color: var(--paper-warm);
    border-bottom: 1px solid var(--ink-soft);
    box-sizing: border-box;
    height: 2.7rem;
    display: flex;
  }
  .h-code {
    padding: 0.4rem 0.3rem;
    font: 600 0.72rem/1 var(--font-mono);
    letter-spacing: 0.06em;
    align-items: center;
    justify-content: center;
  }
  .h-task-label {
    padding: 0.3rem 0.75rem;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
  }
  .head-eyebrow {
    display: block;
    font: 600 0.78rem/1.1 var(--font-display);
    letter-spacing: 0.02em;
    color: var(--paper-warm);
    text-transform: none;
  }
  .head-sub {
    display: block;
    font: 0.6rem/1.2 var(--font-mono);
    color: rgba(242, 200, 122, 0.85);
    margin-top: 2px;
    text-transform: lowercase;
    letter-spacing: 0.04em;
  }

  /* Bottom band on every header cell — reference FCS row (editable).
     Fixed height so all bottom bands align horizontally. */
  .h-ref-label,
  .h-fcs {
    box-sizing: border-box;
    height: 2.4rem;
    background: var(--paper-soft);
  }
  .h-ref-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.75rem;
    font: 600 0.8rem/1 var(--font-display);
    color: var(--ink);
  }
  .ref-tick { color: var(--accent); font-size: 0.9rem; }
  .ref-hint {
    margin-left: auto;
    font: 0.62rem var(--font-mono);
    color: var(--ink-mute);
    text-transform: lowercase;
    letter-spacing: 0.06em;
  }
  .head-row.has-fcs .ref-hint { color: var(--accent); }

  .h-fcs {
    padding: 0;
    display: flex;
    align-items: stretch;
  }
  .h-fcs select {
    width: 100%;
    border: none;
    background: transparent;
    text-align: center;
    text-align-last: center;
    font: 700 0.9rem var(--font-mono);
    color: inherit;
    padding: 0.35rem 0.3rem;
    appearance: none;
    -webkit-appearance: none;
    cursor: pointer;
    border-radius: 0;
    text-transform: uppercase;
  }
  .h-fcs select:focus {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
    box-shadow: none;
  }

  /* Body: task name column — sticky left */
  .grid .task-cell {
    position: sticky;
    left: 0;
    z-index: 1;
    text-align: left;
    min-width: 19rem;
    max-width: 26rem;
    border-right: 1px solid var(--rule-strong);
    box-shadow: 1px 0 0 var(--rule);
    background: var(--paper-warm);
    white-space: normal;
    padding: 0.4rem 0.75rem;
    line-height: 1.35;
  }
  /* Row striping applies only to the task-name column. FCS cells must keep
     their designed bg so fg contrast (esp. fid-R, fid-S, over-*) survives. */
  .grid tbody tr:nth-child(even) .task-cell { background: var(--paper-soft); }
  .grid .task-cell .id {
    font: 600 0.72rem/1 var(--font-mono);
    color: var(--accent);
    margin-right: 0.55rem;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }
  .grid .task-cell .name {
    color: var(--ink);
    font-size: 0.86rem;
  }
  .grid tbody tr:hover .task-cell { background: #fff7e0; }

  /* ── Fidelity colours (body cells) ─────── */
  .grid td.fid-N,
  :global(.legend .sw.fid-N) { background: var(--fid-N-bg); color: var(--fid-N-fg); font-weight: 600; }
  .grid td.fid-G,
  :global(.legend .sw.fid-G) { background: var(--fid-G-bg); color: var(--fid-G-fg); font-weight: 600; }
  .grid td.fid-R,
  :global(.legend .sw.fid-R) { background: var(--fid-R-bg); color: var(--fid-R-fg); font-weight: 700; }
  .grid td.fid-S,
  :global(.legend .sw.fid-S) { background: var(--fid-S-bg); color: var(--fid-S-fg); font-weight: 700; }

  /* ── Fidelity colours on header's bottom band (reference FCS) ─── */
  .grid thead th.combo-head.fid-N .h-fcs { background: var(--fid-N-bg); color: var(--fid-N-fg); }
  .grid thead th.combo-head.fid-G .h-fcs { background: var(--fid-G-bg); color: var(--fid-G-fg); }
  .grid thead th.combo-head.fid-R .h-fcs { background: var(--fid-R-bg); color: var(--fid-R-fg); }
  .grid thead th.combo-head.fid-S .h-fcs { background: var(--fid-S-bg); color: var(--fid-S-fg); }

  /* Exceeds — warm warning */
  .grid td.over-G,
  :global(.legend .sw.over-G) { background: var(--over-G-bg); color: var(--over-G-fg); font-weight: 700; }
  .grid td.over-R,
  :global(.legend .sw.over-R) { background: var(--over-R-bg); color: var(--over-R-fg); font-weight: 700; }
  .grid td.over-S,
  :global(.legend .sw.over-S) { background: var(--over-S-bg); color: var(--over-S-fg); font-weight: 700; }

  .grid td.sw-na,
  :global(.legend .sw.sw-na) {
    background: repeating-linear-gradient(45deg, transparent 0 4px, rgba(110, 122, 144, 0.08) 4px 5px),
                var(--paper-warm);
    color: var(--ink-mute);
    font-weight: 400;
  }
  .grid td.sw-blank,
  :global(.legend .sw.sw-blank) {
    background: var(--paper-warm);
    color: rgba(110, 122, 144, 0.4);
    font-weight: 400;
  }

  /* ── Status column (GO / NO-GO) ──────────── */
  .grid thead th.status-head {
    padding: 0;
    min-width: 5.4rem;
    width: 5.4rem;
    vertical-align: top;
    border-right: 2px solid var(--ink);
  }
  .h-status-label {
    background: var(--ink);
    color: var(--paper-warm);
    box-sizing: border-box;
    height: 2.7rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    padding: 0.4rem 0.3rem;
    font: 600 0.7rem/1 var(--font-mono);
    letter-spacing: 0.18em;
    text-transform: uppercase;
    border-bottom: 1px solid var(--ink-soft);
  }
  .status-tick {
    font-size: 0.7rem;
    color: var(--accent);
    letter-spacing: 0;
  }
  .status-head.live .status-tick { color: #7ec699; }

  .h-status-stats {
    box-sizing: border-box;
    height: 2.4rem;
    background: var(--paper-soft);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.2rem;
    padding: 0.35rem 0.35rem;
    font: 700 0.95rem/1 var(--font-mono);
    color: var(--ink);
  }
  .status-head.live .h-status-stats {
    background: linear-gradient(180deg, #e6efe3 0%, #d8e4d2 100%);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
  }

  .h-status-stats .stat-num { color: #124131; font-weight: 800; }
  .h-status-stats .stat-div { color: var(--ink-mute); font-weight: 500; }
  .h-status-stats .stat-den { color: var(--ink-soft); font-weight: 600; }
  .h-status-stats .stat-unit {
    margin-left: 0.25rem;
    font: 600 0.58rem/1 var(--font-mono);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--ink-mute);
  }
  .h-status-stats .stat-idle {
    font: italic 0.68rem/1 var(--font-display);
    letter-spacing: 0.04em;
    color: var(--ink-mute);
    text-transform: lowercase;
  }

  /* Body status cell */
  .grid td.status-cell {
    text-align: center;
    padding: 0.25rem 0.35rem;
    min-width: 5.4rem;
    width: 5.4rem;
    background: var(--paper-warm);
    border-right: 2px solid var(--rule-strong);
    box-shadow: 1px 0 0 var(--rule);
  }
  .grid tbody tr:nth-child(even) .status-cell { background: var(--paper-soft); }
  .grid tbody tr:hover .status-cell { background: #fff7e0; }
  .grid tbody tr.row-no-go .status-cell { background: #fbe9dc; }
  .grid tbody tr.row-no-go:nth-child(even) .status-cell { background: #f6e0cf; }
  .grid tbody tr.row-no-go:hover .status-cell { background: #fcd9bd; }

  /* GO / NO-GO stamp — aviation clearance aesthetic.
     Solid filled rectangles, mono type, tight letter-spacing, subtle bevel. */
  .status-cell .badge {
    display: inline-block;
    min-width: 3.2rem;
    padding: 0.3rem 0.5rem 0.26rem;
    font: 700 0.72rem/1 var(--font-mono);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    border-radius: 2px;
    border: 1px solid transparent;
    box-shadow:
      0 1px 0 rgba(13, 31, 60, 0.18),
      inset 0 1px 0 rgba(255, 255, 255, 0.08),
      inset 0 -1px 0 rgba(0, 0, 0, 0.18);
    transform: translateY(0);
    transition: transform 120ms ease, box-shadow 120ms ease;
  }
  .status-cell .badge.go {
    background: #1d5d4a;
    color: #f3e6c4;
    border-color: #0c3224;
  }
  .status-cell .badge.no-go {
    background: var(--over-R-bg);
    color: var(--paper-warm);
    border-color: var(--accent-deep);
  }
  .grid tbody tr:hover .status-cell .badge {
    transform: translateY(-1px);
    box-shadow:
      0 2px 0 rgba(13, 31, 60, 0.22),
      inset 0 1px 0 rgba(255, 255, 255, 0.12),
      inset 0 -1px 0 rgba(0, 0, 0, 0.22);
  }

  .status-cell .status-muted {
    display: inline-block;
    min-width: 1.2rem;
    color: var(--ink-mute);
    font: 0.85rem/1 var(--font-mono);
    opacity: 0.55;
    letter-spacing: 0.08em;
  }

  /* Legend mini-stamps — slightly smaller than the body badge so the
     legend row keeps its lean height. */
  :global(.legend .badge) {
    display: inline-block;
    padding: 0.2rem 0.42rem;
    font: 700 0.62rem/1 var(--font-mono);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    border-radius: 2px;
    border: 1px solid transparent;
  }
  :global(.legend .badge.go) {
    background: #1d5d4a;
    color: #f3e6c4;
    border-color: #0c3224;
  }
  :global(.legend .badge.no-go) {
    background: var(--over-R-bg);
    color: var(--paper-warm);
    border-color: var(--accent-deep);
  }

  .grid .empty {
    text-align: center;
    font-style: italic;
    color: var(--ink-mute);
    padding: 1.2rem;
    background: var(--paper-warm);
  }
</style>
