<script lang="ts">
  import { onMount } from 'svelte';
  import { loadDataset } from './data/loader.ts';
  import { appState } from './lib/state.svelte.ts';
  import { currentRoute, navigate, startRouter } from './lib/router.svelte.ts';
  import Grid from './routes/Grid.svelte';
  import ByTask from './routes/ByTask.svelte';
  import ByDevice from './routes/ByDevice.svelte';
  import '../styles/main.css';

  let error = $state<string | null>(null);
  let loading = $state(true);

  onMount(() => {
    const stop = startRouter();
    loadDataset('./data/')
      .then(ds => { appState.dataset = ds; loading = false; })
      .catch(e => { error = String(e); loading = false; });
    return stop;
  });

  function go(name: 'grid' | 'by-task' | 'by-device', e: Event): void {
    e.preventDefault();
    navigate(name);
  }
</script>

<header>
  <h1>FCSifier</h1>
  <nav>
    <a
      href="#/grid"
      class:active={currentRoute.name === 'grid'}
      onclick={(e) => go('grid', e)}
    >Grid</a>
    <a
      href="#/by-task"
      class:active={currentRoute.name === 'by-task'}
      onclick={(e) => go('by-task', e)}
    >By task</a>
    <a
      href="#/by-device"
      class:active={currentRoute.name === 'by-device'}
      onclick={(e) => go('by-device', e)}
    >By device</a>
  </nav>
  <div class="shared-controls">
    <label>
      <span>Level</span>
      <select bind:value={appState.level}>
        <option value="TP">TP — to proficiency</option>
        <option value="T">T — introduction</option>
      </select>
    </label>
    <label>
      <span>Category</span>
      <select bind:value={appState.category}>
        <option value="all">All</option>
        <option value="aeroplane">Aeroplane</option>
        <option value="helicopter">Helicopter</option>
      </select>
    </label>
  </div>
</header>

<main>
  {#if loading}
    <p class="loading">Loading dataset…</p>
  {:else if error}
    <p class="error">Failed to load dataset: {error}</p>
  {:else if currentRoute.name === 'by-device'}
    <ByDevice />
  {:else if currentRoute.name === 'by-task'}
    <ByTask />
  {:else}
    <Grid />
  {/if}
</main>

<style>
  header {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
  }
  header h1 { flex: 0 0 auto; }
  nav { flex: 1; }
  nav a.active {
    font-weight: 600;
    text-decoration: underline;
  }
  .shared-controls {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }
  .shared-controls label {
    display: inline-flex;
    gap: 0.4rem;
    align-items: center;
  }
  .shared-controls span { color: var(--muted); font-size: 0.85rem; }
  .shared-controls select { padding: 0.2rem 0.4rem; font: inherit; }
</style>
