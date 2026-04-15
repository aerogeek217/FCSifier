<script lang="ts">
  import type { Feature, Fcs, FeatureCode, Fidelity } from '../domain/fcs.ts';
  import { FIDELITY_ORDER } from '../domain/fcs.ts';

  interface Props {
    features: readonly Feature[];
    fcs: Fcs;
    mode?: 'read' | 'edit';
    onFcsChange?: (code: FeatureCode, value: Fidelity) => void;
    drivingTasks?: Record<string, { id: string; name: string }[]>;
  }

  let { features, fcs, mode = 'read', onFcsChange, drivingTasks }: Props = $props();

  function valueFor(code: FeatureCode): Fidelity {
    return fcs[code] ?? 'N';
  }

  function onSelect(code: FeatureCode, e: Event & { currentTarget: HTMLSelectElement }): void {
    onFcsChange?.(code, e.currentTarget.value as Fidelity);
  }
</script>

<table class="fcs-matrix">
  <thead>
    <tr>
      {#each features as f (f.code)}
        <th title={f.name}>{f.code}</th>
      {/each}
    </tr>
  </thead>
  <tbody>
    <tr>
      {#each features as f (f.code)}
        {@const v = valueFor(f.code)}
        <td class="fid fid-{v}">
          {#if mode === 'edit'}
            <select aria-label={f.name} value={v} onchange={(e) => onSelect(f.code, e)}>
              {#each FIDELITY_ORDER as lvl (lvl)}
                <option value={lvl}>{lvl}</option>
              {/each}
            </select>
          {:else}
            {v}
          {/if}
        </td>
      {/each}
    </tr>
    {#if mode === 'read' && drivingTasks}
      <tr class="driving">
        {#each features as f (f.code)}
          {@const drivers = drivingTasks[f.code] ?? []}
          <td class="driving-cell" title={drivers.map(d => d.name).join('\n') || ''}>
            {#if drivers.length === 1}
              <span class="driver-id">{drivers[0].id}</span>
            {:else if drivers.length > 1}
              <span class="driver-id">×{drivers.length}</span>
            {:else}
              <span class="driver-none">—</span>
            {/if}
          </td>
        {/each}
      </tr>
    {/if}
  </tbody>
</table>

<style>
  .fcs-matrix {
    border-collapse: separate;
    border-spacing: 0;
    font-variant-numeric: tabular-nums;
    background: var(--paper-warm);
    border: 1px solid var(--rule);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }
  .fcs-matrix th,
  .fcs-matrix td {
    border-right: 1px solid var(--rule-soft);
    border-bottom: 1px solid var(--rule-soft);
    padding: 0.32rem 0.45rem;
    text-align: center;
    min-width: 2.75rem;
    height: 1.95rem;
  }
  .fcs-matrix th:last-child,
  .fcs-matrix td:last-child { border-right: none; }
  .fcs-matrix tbody tr:last-child td { border-bottom: none; }

  .fcs-matrix th {
    background: var(--ink);
    color: var(--paper-warm);
    font: 600 0.7rem/1 var(--font-mono);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .fid {
    font-weight: 700;
    font-family: var(--font-mono);
    font-size: 0.85rem;
    letter-spacing: 0.02em;
  }
  .fid-N { color: var(--fid-N-fg); background: var(--fid-N-bg); }
  .fid-G { color: var(--fid-G-fg); background: var(--fid-G-bg); }
  .fid-R { color: var(--fid-R-fg); background: var(--fid-R-bg); }
  .fid-S { color: var(--fid-S-fg); background: var(--fid-S-bg); }

  .fcs-matrix select {
    width: 100%;
    padding: 0.1rem 0.15rem;
    font: 700 0.85rem var(--font-mono);
    color: inherit;
    background: transparent;
    border: 1px solid transparent;
    text-align: center;
    text-align-last: center;
    appearance: none;
    -webkit-appearance: none;
    cursor: pointer;
    border-radius: 2px;
  }
  .fcs-matrix select:hover {
    border-color: rgba(13, 31, 60, 0.25);
    background: rgba(255, 255, 255, 0.5);
  }
  .fcs-matrix select:focus {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
    background: rgba(255, 255, 255, 0.7);
  }

  tr.driving td {
    font: 0.68rem/1 var(--font-mono);
    color: var(--ink-mute);
    font-weight: normal;
    background: var(--paper-soft);
    height: auto;
    padding: 0.25rem 0.35rem;
  }
  .driver-id { color: var(--accent); font-weight: 600; }
  .driver-none { opacity: 0.4; }
</style>
