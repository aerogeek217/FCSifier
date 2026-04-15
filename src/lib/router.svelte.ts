// Hash router: bidirectional sync between `location.hash` and `appState`.
// URL grammar:  #/<route>?level=TP&cat=aeroplane&tasks=id1,id2&fcs=S,S,R,…
// The hash is split on the first `?` into route path and URLSearchParams query.
// All state mutations call `history.replaceState` so the back button steps
// between user navigations, not keystrokes.

import { appState } from './state.svelte.ts';
import { parseFcs, formatFcs } from '../domain/fcs.ts';

export type RouteName = 'by-task' | 'by-device';

class RouteState {
  name = $state<RouteName>('by-task');
}

export const currentRoute = new RouteState();

export function navigate(name: RouteName): void {
  currentRoute.name = name;
}

function readHash(): void {
  const raw = location.hash.startsWith('#') ? location.hash.slice(1) : location.hash;
  const qIndex = raw.indexOf('?');
  const path = qIndex >= 0 ? raw.slice(0, qIndex) : raw;
  const query = qIndex >= 0 ? raw.slice(qIndex + 1) : '';
  const params = new URLSearchParams(query);

  currentRoute.name = path === '/by-device' ? 'by-device' : 'by-task';

  const level = params.get('level');
  appState.level = level === 'T' ? 'T' : 'TP';

  const cat = params.get('cat');
  appState.category = cat === 'aeroplane' || cat === 'helicopter' ? cat : 'all';

  const tasks = params.get('tasks');
  appState.selectedTaskIds = tasks ? tasks.split(',').filter(Boolean) : [];

  const fcs = params.get('fcs');
  if (fcs) {
    try { appState.deviceFcs = parseFcs(fcs); }
    catch { appState.deviceFcs = {}; }
  } else {
    appState.deviceFcs = {};
  }
}

function writeHash(): void {
  const params = new URLSearchParams();
  params.set('level', appState.level);
  if (appState.category !== 'all') params.set('cat', appState.category);
  if (currentRoute.name === 'by-task' && appState.selectedTaskIds.length > 0) {
    params.set('tasks', appState.selectedTaskIds.join(','));
  }
  if (currentRoute.name === 'by-device' && Object.keys(appState.deviceFcs).length > 0) {
    params.set('fcs', formatFcs(appState.deviceFcs));
  }
  const q = params.toString();
  const newHash = `#/${currentRoute.name}${q ? '?' + q : ''}`;
  if (location.hash !== newHash) {
    history.replaceState(null, '', newHash);
  }
}

export function startRouter(): () => void {
  readHash();
  const onHashChange = () => readHash();
  window.addEventListener('hashchange', onHashChange);

  const stopEffect = $effect.root(() => {
    $effect(() => {
      // Read every piece of state that participates in the hash so this effect
      // re-runs on any relevant change. writeHash() is idempotent, so a change
      // driven by readHash() won't ping-pong.
      void appState.level;
      void appState.category;
      void appState.selectedTaskIds.length;
      void appState.selectedTaskIds.join(',');
      void appState.deviceFcs;
      void currentRoute.name;
      writeHash();
    });
  });

  return () => {
    window.removeEventListener('hashchange', onHashChange);
    stopEffect();
  };
}
