<script lang="ts">
  import type { Device } from '../data/loader.ts';
  import type { AircraftCategory } from '../data/loader.ts';
  import type { Fcs } from '../domain/fcs.ts';

  interface Props {
    builtin: readonly Device[];
    currentFcs: Fcs;
    currentCategory: AircraftCategory;
    onLoad: (device: Device) => void;
  }

  let { builtin, currentFcs, currentCategory, onLoad }: Props = $props();

  const LS_KEY = 'fcsifier:user-presets';

  function readUserPresets(): Device[] {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  let userPresets = $state<Device[]>(readUserPresets());
  let selectedId = $state<string>('');

  function persistUserPresets(next: Device[]): void {
    userPresets = next;
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  }

  function loadById(id: string): void {
    const dev = [...builtin, ...userPresets].find(d => d.id === id);
    if (dev) onLoad(dev);
  }

  function onPick(e: Event & { currentTarget: HTMLSelectElement }): void {
    const id = e.currentTarget.value;
    selectedId = id;
    if (id) loadById(id);
  }

  function onSave(): void {
    const name = prompt('Name this preset:');
    if (!name) return;
    const id = `user-${Date.now().toString(36)}`;
    const dev: Device = {
      id,
      name: name.trim(),
      vendor: '',
      aircraft_category: currentCategory,
      fcs: { ...currentFcs },
      source: 'user (localStorage)',
    };
    persistUserPresets([...userPresets, dev]);
    selectedId = id;
  }

  function onDelete(): void {
    if (!selectedId || !selectedId.startsWith('user-')) return;
    if (!confirm('Delete this preset?')) return;
    persistUserPresets(userPresets.filter(p => p.id !== selectedId));
    selectedId = '';
  }

  const isUserSelected = $derived(selectedId.startsWith('user-'));
</script>

<div class="presets">
  <label>
    <span>Load preset</span>
    <select value={selectedId} onchange={onPick}>
      <option value="">— choose —</option>
      {#if builtin.length}
        <optgroup label="Built-in">
          {#each builtin as d (d.id)}
            <option value={d.id}>{d.name}</option>
          {/each}
        </optgroup>
      {/if}
      {#if userPresets.length}
        <optgroup label="Your presets">
          {#each userPresets as d (d.id)}
            <option value={d.id}>{d.name}</option>
          {/each}
        </optgroup>
      {/if}
    </select>
  </label>
  <button type="button" onclick={onSave}>Save current as preset</button>
  {#if isUserSelected}
    <button type="button" onclick={onDelete} class="danger">Delete</button>
  {/if}
</div>

<style>
  .presets {
    display: inline-flex;
    gap: 0.4rem;
    align-items: center;
    flex-wrap: wrap;
  }
  .presets label {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }
  .presets label span {
    font: 600 0.62rem/1 var(--font-body);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--ink-mute);
  }
  .presets select {
    min-width: 11rem;
    font-size: 0.85rem;
  }
  .presets button {
    font-size: 0.78rem;
    padding: 0.35rem 0.6rem;
  }
</style>
