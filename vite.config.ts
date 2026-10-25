import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/tictactoe-buddies/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2022',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        arena: resolve(__dirname, 'arena.html'),
        modes: resolve(__dirname, 'modes.html'),
        profile: resolve(__dirname, 'profile.html'),
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
