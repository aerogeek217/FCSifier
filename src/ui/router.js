export function route(views, fallback) {
  const name = (location.hash.replace(/^#\//, '') || fallback).split('/')[0];
  const view = views[name] || views[fallback];
  view();
}
