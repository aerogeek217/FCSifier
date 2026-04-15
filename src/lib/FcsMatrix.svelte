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
    border-collapse: collapse;
    font-variant-numeric: tabular-nums;
  }
  .fcs-matrix th,
  .fcs-matrix td {
    border: 1px solid var(--border);
    padding: 0.25rem 0.4rem;
    text-align: center;
    min-width: 2.75rem;
  }
  .fcs-matrix th {
    background: #f0f0f0;
    font-size: 0.8rem;
    letter-spacing: 0.03em;
  }
  .fid {
    font-weight: 600;
  }
  .fid-N { color: #999; background: #fafafa; }
  .fid-G { color: #2b6cb0; background: #ebf4ff; }
  .fid-R { color: #975a16; background: #fffbea; }
  .fid-S { color: #22543d; background: #e6fffa; }
  .fcs-matrix select {
    width: 100%;
    padding: 0.1rem 0.15rem;
    font: inherit;
    background: transparent;
    border: 1px solid transparent;
  }
  .fcs-matrix select:hover,
  .fcs-matrix select:focus {
    border-color: var(--border);
    background: #fff;
  }
  tr.driving td {
    font-size: 0.7rem;
    color: var(--muted);
    font-weight: normal;
    background: #fff;
  }
  .driver-id { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
  .driver-none { opacity: 0.4; }
</style>
