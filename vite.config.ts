import { defineConfig } from 'vite';

export default defineConfig({
  base: '/tictactoe-buddies/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2022'
  },
  server: {
    port: 3000,
    open: true
  }
});
