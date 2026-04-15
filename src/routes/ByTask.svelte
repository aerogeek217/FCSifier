<script lang="ts">
  import { appState } from '../lib/state.svelte.ts';
  import FcsMatrix from '../lib/FcsMatrix.svelte';
  import type { TaskRow } from '../data/loader.ts';

  let search = $state('');

  const visibleTasks = $derived<TaskRow[]>(
    (appState.dataset?.tasks ?? []).filter(t => {
      if (appState.category !== 'all' && t.aircraft_category !== appState.category) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q);
    }),
  );

  const selectedIdSet = $derived(new Set(appState.selectedTaskIds));

  function toggle(id: string, checked: boolean): void {
    if (checked) {
      if (!selectedIdSet.has(id)) {
        appState.selectedTaskIds = [...appState.selectedTaskIds, id];
      }
    } else {
      appState.selectedTaskIds = appState.selectedTaskIds.filter(x => x !== id);
    }
  }

  function clearSelection(): void {
    appState.selectedTaskIds = [];
  }

  // Shape `drivingTasksByFeature` for the matrix (needs name + id).
  const drivingForMatrix = $derived<Record<string, { id: string; name: string }[]>>(
    Object.fromEntries(
      Object.entries(appState.drivingTasksByFeature).map(([code, tasks]) => [
        code,
        tasks.map(t => ({ id: t.id, name: t.name })),
      ]),
    ),
  );
</script>

<section class="by-task">
  <aside class="picker">
    <div class="controls">
      <label class="search">
        <span>Search</span>
        <input type="search" bind:value={search} placeholder="id or name…" />
      </label>
      <span class="count">{appState.selectedTaskIds.length} selected</span>
      {#if appState.selectedTaskIds.length > 0}
        <button type="button" onclick={clearSelection}>Clear</button>
      {/if}
    </div>
    <ul class="tasks">
      {#each visibleTasks as t (t.id)}
        {@const hasFcsAtLevel = t[appState.level] !== undefined && t[appState.level] !== null}
        {@const isNa = t[appState.level] === null}
        <li class:selected={selectedIdSet.has(t.id)}>
          <label>
            <input
              type="checkbox"
              checked={selectedIdSet.has(t.id)}
              onchange={(e) => toggle(t.id, e.currentTarget.checked)}
            />
            <span class="id">{t.id}</span>
            <span class="name">{t.name}</span>
            {#if !hasFcsAtLevel}
              <span class="tag" title={isNa ? 'Not performed in an FSTD' : `No ${appState.level} row`}>
                {isNa ? 'N/A' : `no ${appState.level}`}
              </span>
            {/if}
          </label>
        </li>
      {:else}
        <li class="empty">No tasks match.</li>
      {/each}
    </ul>
  </aside>

  <div class="result">
    <h2>Required FCS (rollup)</h2>
    {#if appState.dataset && appState.selectedBuckets.withFcs.length > 0}
      <FcsMatrix
        features={appState.dataset.features}
        fcs={appState.requiredFcs}
        drivingTasks={drivingForMatrix}
      />
      <p class="hint">
        Driving task per feature shown below each column. Tooltip on a cell shows the full task name.
      </p>
    {:else if appState.dataset}
      <p class="empty">
        {appState.selectedTaskIds.length === 0
          ? 'Pick one or more tasks to see the minimum FCS that authorises them.'
          : `None of the ${appState.selectedTaskIds.length} selected task(s) has a ${appState.level} FCS row. See buckets below.`}
      </p>
    {/if}

    {#if appState.selectedBuckets.na.length > 0}
      <section class="bucket">
        <h3>Not performed in an FSTD ({appState.selectedBuckets.na.length})</h3>
        <ul>
          {#each appState.selectedBuckets.na as t (t.id)}
            <li><span class="id">{t.id}</span> {t.name}</li>
          {/each}
        </ul>
      </section>
    {/if}

    {#if appState.selectedBuckets.noRequirement.length > 0}
      <section class="bucket">
        <h3>No {appState.level} requirement defined ({appState.selectedBuckets.noRequirement.length})</h3>
        <ul>
          {#each appState.selectedBuckets.noRequirement as t (t.id)}
            <li><span class="id">{t.id}</span> {t.name}</li>
          {/each}
        </ul>
      </section>
    {/if}
  </div>
</section>

<style>
  .by-task {
    display: grid;
    grid-template-columns: minmax(18rem, 30rem) 1fr;
    gap: 1.5rem;
  }
  .picker { min-width: 0; }
  .controls {
    display: flex;
    gap: 0.6rem;
    align-items: center;
    margin-bottom: 0.6rem;
    flex-wrap: wrap;
  }
  .search { display: flex; gap: 0.4rem; align-items: center; flex: 1; }
  .search span {
    color: var(--ink-mute);
    font: 600 0.62rem/1 var(--font-body);
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }
  .search input { flex: 1; min-width: 8rem; }
  .count {
    color: var(--ink-mute);
    font: 0.78rem var(--font-mono);
    padding: 0.2rem 0.5rem;
    background: var(--paper-warm);
    border: 1px solid var(--rule);
    border-radius: 999px;
  }
  .tasks {
    list-style: none;
    padding: 0;
    margin: 0;
    max-height: 70vh;
    overflow: auto;
    background: var(--paper-warm);
    border: 1px solid var(--rule);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
  }
  .tasks li {
    border-bottom: 1px solid var(--rule-soft);
    padding: 0.3rem 0.6rem;
    transition: background 100ms ease;
  }
  .tasks li:last-child { border-bottom: none; }
  .tasks li:hover { background: var(--paper-soft); }
  .tasks li.selected {
    background: rgba(184, 82, 26, 0.08);
    border-left: 3px solid var(--accent);
    padding-left: calc(0.6rem - 3px);
  }
  .tasks label {
    display: flex;
    gap: 0.5rem;
    align-items: baseline;
    cursor: pointer;
  }
  .tasks input[type="checkbox"] { accent-color: var(--ink); }
  .tasks .id {
    font: 600 0.72rem/1 var(--font-mono);
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 0.02em;
    flex-shrink: 0;
    min-width: 5.5rem;
  }
  .tasks .name { flex: 1; color: var(--ink); }
  .tasks .tag {
    font: 600 0.62rem/1 var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 0.15rem 0.4rem;
    border-radius: 2px;
    background: var(--paper);
    color: var(--ink-mute);
    border: 1px solid var(--rule);
    flex-shrink: 0;
  }
  .empty { padding: 0.6rem; color: var(--ink-mute); font-style: italic; }
  .result h2 {
    font-size: 1.15rem;
    margin: 0 0 0.6rem;
    padding-bottom: 0.3rem;
    border-bottom: 1px solid var(--rule);
  }
  .hint { color: var(--ink-mute); font-size: 0.8rem; margin: 0.6rem 0 1.2rem; font-style: italic; }
  .bucket { margin-top: 1.2rem; }
  .bucket h3 {
    font: 600 0.7rem/1 var(--font-body);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin: 0 0 0.4rem;
    color: var(--ink-mute);
  }
  .bucket ul {
    list-style: none;
    padding: 0;
    margin: 0;
    background: var(--paper-warm);
    border: 1px solid var(--rule);
    border-radius: var(--radius-lg);
  }
  .bucket li {
    padding: 0.25rem 0.6rem;
    border-bottom: 1px solid var(--rule-soft);
  }
  .bucket li:last-child { border-bottom: none; }
  .bucket .id {
    font: 600 0.72rem/1 var(--font-mono);
    color: var(--accent);
    text-transform: uppercase;
    margin-right: 0.6rem;
  }

  @media (max-width: 880px) {
    .by-task { grid-template-columns: 1fr; }
  }
</style>
