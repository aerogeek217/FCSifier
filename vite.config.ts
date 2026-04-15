import { defineConfig, type PluginOption } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { cpSync, createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';

// Vite's `publicDir` is a single directory. We keep the canonical datasets at
// repo-root `data/` (so the EASA extractor and Node-side tests can reach them
// without reaching into `public/`), and mirror them into the served output with
// this tiny plugin: dev-server middleware under `/data/*`, and a `closeBundle`
// copy into `dist/data/` at build time.
function copyDataDir(): PluginOption {
  const src = path.resolve(process.cwd(), 'data');
  return {
    name: 'copy-data-dir',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? '';
        if (!url.startsWith('/data/')) return next();
        const file = path.join(src, url.slice('/data/'.length));
        if (!file.startsWith(src) || !existsSync(file) || !statSync(file).isFile()) {
          return next();
        }
        createReadStream(file).pipe(res);
      });
    },
    closeBundle() {
      cpSync(src, path.resolve(process.cwd(), 'dist/data'), { recursive: true });
    },
  };
}

export default defineConfig({
  plugins: [svelte(), copyDataDir()],
  base: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    sourcemap: false,
    emptyOutDir: true,
  },
});
