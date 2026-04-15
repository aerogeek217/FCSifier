<script lang="ts">
  import { appState } from '../lib/state.svelte.ts';
  import FcsMatrix from '../lib/FcsMatrix.svelte';
  import DevicePresets from '../lib/DevicePresets.svelte';
  import type { Device } from '../data/loader.ts';
  import type { FeatureCode, Fidelity } from '../domain/fcs.ts';

  function onFidelityChange(code: FeatureCode, value: Fidelity): void {
    appState.deviceFcs = { ...appState.deviceFcs, [code]: value };
  }

  function onLoadPreset(d: Device): void {
    appState.deviceFcs = { ...d.fcs };
    appState.category = d.aircraft_category;
  }

  function clearFcs(): void {
    appState.deviceFcs = {};
  }

  const presetCategory = $derived(
    appState.category === 'all' ? 'aeroplane' : appState.category,
  );
</script>

<section class="by-device">
  <div class="device-head">
    <h2>Device capability (FCS)</h2>
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
      <div class="device-actions">
        <button type="button" onclick={clearFcs}>Reset to all N</button>
      </div>
    {/if}
  </div>

  <div class="authorized">
    <h2>Authorised tasks ({appState.deviceBuckets.withFcs.length})</h2>
    <p class="hint">
      Tasks whose {appState.level} FCS requirement is met by the device above, filtered to
      {appState.category === 'all' ? 'all categories' : appState.category + 's'}.
    </p>

    {#if appState.deviceBuckets.withFcs.length > 0}
      <ul class="task-list">
        {#each appState.deviceBuckets.withFcs as { task } (task.id)}
          <li><span class="id">{task.id}</span> {task.name}</li>
        {/each}
      </ul>
    {:else}
      <p class="empty">No tasks are authorised by this FCS at the {appState.level} level.</p>
    {/if}

    {#if appState.deviceBuckets.notAuthorized.length > 0}
      <section class="bucket">
        <h3>Not authorised ({appState.deviceBuckets.notAuthorized.length})</h3>
        <ul class="task-list">
          {#each appState.deviceBuckets.notAuthorized as { task } (task.id)}
            <li><span class="id">{task.id}</span> {task.name}</li>
          {/each}
        </ul>
      </section>
    {/if}

    {#if appState.deviceBuckets.na.length > 0}
      <section class="bucket">
        <h3>Not performed in an FSTD ({appState.deviceBuckets.na.length})</h3>
        <ul class="task-list">
          {#each appState.deviceBuckets.na as t (t.id)}
            <li><span class="id">{t.id}</span> {t.name}</li>
          {/each}
        </ul>
      </section>
    {/if}

    {#if appState.deviceBuckets.noRequirement.length > 0}
      <section class="bucket">
        <h3>No {appState.level} requirement defined ({appState.deviceBuckets.noRequirement.length})</h3>
        <ul class="task-list">
          {#each appState.deviceBuckets.noRequirement as t (t.id)}
            <li><span class="id">{t.id}</span> {t.name}</li>
          {/each}
        </ul>
      </section>
    {/if}
  </div>
</section>

<style>
  .by-device { display: grid; gap: 1.5rem; }
  .device-head {
    display: grid;
    gap: 0.7rem;
    background: var(--paper-warm);
    border: 1px solid var(--rule);
    border-radius: var(--radius-lg);
    padding: 1rem 1.1rem;
    box-shadow: var(--shadow-sm);
  }
  .device-head h2 {
    margin: 0;
    font-size: 1.15rem;
    padding-bottom: 0.3rem;
    border-bottom: 1px solid var(--rule);
  }
  .device-actions { margin-top: 0.4rem; }
  .device-actions button { font-size: 0.78rem; }

  .authorized h2 {
    font-size: 1.15rem;
    margin: 0 0 0.4rem;
    padding-bottom: 0.3rem;
    border-bottom: 1px solid var(--rule);
  }
  .hint { color: var(--ink-mute); font-size: 0.82rem; margin: 0 0 0.6rem; font-style: italic; }
  .task-list {
    list-style: none;
    padding: 0;
    margin: 0;
    background: var(--paper-warm);
    border: 1px solid var(--rule);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }
  .task-list li {
    padding: 0.3rem 0.6rem;
    border-bottom: 1px solid var(--rule-soft);
    transition: background 100ms ease;
  }
  .task-list li:last-child { border-bottom: none; }
  .task-list li:hover { background: var(--paper-soft); }
  .task-list .id {
    font: 600 0.72rem/1 var(--font-mono);
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 0.02em;
    margin-right: 0.6rem;
  }
  .bucket { margin-top: 1.2rem; }
  .bucket h3 {
    font: 600 0.7rem/1 var(--font-body);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin: 0 0 0.4rem;
    color: var(--ink-mute);
  }
  .empty { color: var(--ink-mute); font-style: italic; }
</style>
