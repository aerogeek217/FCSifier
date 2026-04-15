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
  <div class="brand">
    <h1>
      <span class="word">FCS<span class="ifier">ifier</span></span>
    </h1>
    <p class="tag">
      <span class="tag-mark">‹/›</span>
      EASA CS-FSTD &middot; task &times; device cross-reference
    </p>
  </div>

  <nav class="segmented" aria-label="View">
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
    display: grid;
    grid-template-columns: auto 1fr auto;
    column-gap: 2rem;
    row-gap: 0.6rem;
    align-items: end;
  }

  /* ── Brand ─────────────────────────────── */
  .brand { display: flex; flex-direction: column; gap: 0.1rem; }
  .brand h1 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.95rem;
    line-height: 1;
    letter-spacing: -0.02em;
    color: var(--ink);
    font-weight: 600;
  }
  .brand .word { display: inline-flex; align-items: baseline; }
  .brand .ifier {
    color: var(--accent);
    font-style: italic;
    font-weight: 500;
  }
  .brand .tag {
    margin: 0;
    font: 0.72rem/1.2 var(--font-mono);
    color: var(--ink-mute);
    letter-spacing: 0.04em;
    text-transform: lowercase;
  }
  .brand .tag-mark {
    color: var(--accent);
    font-weight: 700;
    margin-right: 0.35rem;
    letter-spacing: 0;
  }

  /* ── Segmented nav ─────────────────────── */
  .segmented {
    justify-self: center;
    display: inline-flex;
    border: 1px solid var(--rule-strong);
    border-radius: 999px;
    padding: 3px;
    background: var(--paper-warm);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6),
                0 1px 0 rgba(13, 31, 60, 0.04);
  }
  .segmented a {
    padding: 0.4rem 1.05rem;
    border-radius: 999px;
    color: var(--ink-soft);
    text-decoration: none;
    font: 500 0.84rem/1 var(--font-body);
    letter-spacing: 0.02em;
    transition: background 140ms ease, color 140ms ease;
    position: relative;
  }
  .segmented a:hover { color: var(--ink); }
  .segmented a.active {
    background: var(--ink);
    color: var(--paper-warm);
    box-shadow: 0 1px 2px rgba(13, 31, 60, 0.18),
                inset 0 1px 0 rgba(255, 255, 255, 0.06);
  }
  .segmented a.active::after {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: 999px;
    pointer-events: none;
  }

  /* ── Shared controls ───────────────────── */
  .shared-controls {
    display: flex;
    gap: 0.6rem;
    align-items: center;
  }
  .shared-controls label {
    display: inline-flex;
    flex-direction: column;
    gap: 0.18rem;
    align-items: flex-start;
  }
  .shared-controls span {
    color: var(--ink-mute);
    font: 600 0.62rem/1 var(--font-body);
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }
  .shared-controls select {
    font-size: 0.85rem;
    padding: 0.32rem 0.5rem;
    min-width: 9rem;
  }

  @media (max-width: 880px) {
    header {
      grid-template-columns: 1fr;
      row-gap: 0.85rem;
    }
    .segmented { justify-self: start; }
    .shared-controls { flex-wrap: wrap; }
  }
</style>
