import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// base: './' keeps the build portable (GitHub Pages sub-paths, itch.io, any static host).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2020',
    sourcemap: true,
    // Split vendors so game updates don't bust the cached engine.
    rollupOptions: { output: { manualChunks: { three: ['three'], react: ['react', 'react-dom', 'zustand'] } } },
  },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
