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
    grid-template-columns: minmax(18rem, 28rem) 1fr;
    gap: 1.5rem;
  }
  .picker { min-width: 0; }
  .controls {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
  }
  .search { display: flex; gap: 0.25rem; align-items: center; flex: 1; }
  .search span { color: var(--muted); font-size: 0.85rem; }
  .search input {
    flex: 1;
    min-width: 6rem;
    padding: 0.25rem 0.4rem;
    font: inherit;
    border: 1px solid var(--border);
    border-radius: 3px;
  }
  .count { color: var(--muted); font-size: 0.85rem; }
  .tasks {
    list-style: none;
    padding: 0;
    margin: 0;
    max-height: 70vh;
    overflow: auto;
    border: 1px solid var(--border);
    background: #fff;
  }
  .tasks li {
    border-bottom: 1px solid #eee;
    padding: 0.15rem 0.4rem;
  }
  .tasks li.selected { background: #eef6ff; }
  .tasks label {
    display: flex;
    gap: 0.4rem;
    align-items: baseline;
    cursor: pointer;
  }
  .tasks .id {
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
    font-size: 0.85rem;
    color: var(--muted);
    flex-shrink: 0;
    min-width: 5rem;
  }
  .tasks .name { flex: 1; }
  .tasks .tag {
    font-size: 0.7rem;
    padding: 0.05rem 0.3rem;
    border-radius: 2px;
    background: #eee;
    color: var(--muted);
    flex-shrink: 0;
  }
  .empty { padding: 0.5rem; color: var(--muted); }
  .result h2 { font-size: 1rem; margin: 0 0 0.5rem; }
  .hint { color: var(--muted); font-size: 0.85rem; margin: 0.5rem 0 1rem; }
  .bucket { margin-top: 1rem; }
  .bucket h3 { font-size: 0.9rem; margin: 0 0 0.25rem; color: var(--muted); }
  .bucket ul { list-style: none; padding: 0; margin: 0; }
  .bucket li { padding: 0.1rem 0; }
  .bucket .id {
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
    font-size: 0.85rem;
    color: var(--muted);
    margin-right: 0.5rem;
  }
</style>
