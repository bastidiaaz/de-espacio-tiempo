import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// base: './' keeps the build portable (GitHub Pages sub-paths, itch.io, any static host).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2020',
    // One stylesheet for everything: an act's CSS can't fail to load on its own (a failed CSS chunk
    // is never re-requested by Vite's preload helper, leaving the act unstyled). Costs a few KB on the menu.
    cssCodeSplit: false,
    sourcemap: true,
    // Split vendors so game updates don't bust the cached engine.
    rollupOptions: {
      // estilo.html is the test page of the sketch UI (ART-01): built and deployed, linked from nowhere.
      input: { main: 'index.html', estilo: 'estilo.html' },
      output: { manualChunks: { three: ['three'], react: ['react', 'react-dom', 'zustand'] } },
    },
  },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
