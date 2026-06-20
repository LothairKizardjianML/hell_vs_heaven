/// <reference types="vitest" />
import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  server: { port: 5173, open: false },
  build: { target: 'es2022', sourcemap: true },
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, 'src/core'),
      '@physics': path.resolve(__dirname, 'src/physics'),
      '@gameplay': path.resolve(__dirname, 'src/gameplay'),
      '@input': path.resolve(__dirname, 'src/input'),
      '@rendering': path.resolve(__dirname, 'src/rendering'),
      '@content': path.resolve(__dirname, 'src/content'),
      '@scenes': path.resolve(__dirname, 'src/scenes'),
    },
  },
  test: {
    globals: false,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
