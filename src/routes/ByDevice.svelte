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
  .device-head { display: grid; gap: 0.5rem; }
  .device-head h2 { margin: 0; font-size: 1rem; }
  .device-actions { margin-top: 0.5rem; }
  .device-actions button { padding: 0.25rem 0.5rem; font: inherit; }
  .authorized h2 { font-size: 1rem; margin: 0 0 0.25rem; }
  .hint { color: var(--muted); font-size: 0.85rem; margin: 0 0 0.5rem; }
  .task-list { list-style: none; padding: 0; margin: 0; }
  .task-list li {
    padding: 0.15rem 0.4rem;
    border-bottom: 1px solid #eee;
    background: #fff;
  }
  .task-list .id {
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
    font-size: 0.85rem;
    color: var(--muted);
    margin-right: 0.5rem;
  }
  .bucket { margin-top: 1rem; }
  .bucket h3 { font-size: 0.9rem; margin: 0 0 0.25rem; color: var(--muted); }
  .empty { color: var(--muted); }
</style>
