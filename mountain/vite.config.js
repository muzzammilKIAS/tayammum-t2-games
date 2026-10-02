import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const page = name => resolve(import.meta.dirname, `${name}.html`);
export default defineConfig({
  base: './',
  publicDir: false,
  server: { host: '0.0.0.0', proxy: { '/socket.io': { target: 'http://127.0.0.1:3001', ws: true }, '/api': 'http://127.0.0.1:3001' } },
  build: { rollupOptions: { input: { main: page('index'), host: page('host'), join: page('join'), solo: page('solo') } } },
});
