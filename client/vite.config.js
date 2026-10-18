import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
  root: __dirname,
  cacheDir: path.resolve(__dirname, '../.vite-cache'),
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:3000' } },
  build: { outDir: path.resolve(__dirname, 'dist'), emptyOutDir: true }
});
