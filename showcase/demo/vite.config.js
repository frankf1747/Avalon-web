// Demo harness: renders the real game pages with mock data (no Firebase), for showcase screenshots.
// Run from the repo root: npx vite --config showcase/demo/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const repo = path.resolve(here, '../..')
const mock = (name) => path.join(here, 'mocks', name)

export default defineConfig({
  root: here,
  publicDir: path.join(repo, 'public'),
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^(\.\.\/)+utils\/roomApi$/, replacement: mock('roomApi.js') },
      { find: /^(\.\.\/)+hooks\/useRoom$/, replacement: mock('hooks.js') },
      { find: /^(\.\.\/)+hooks\/useEvents$/, replacement: mock('hooks.js') },
      { find: /^(\.\.\/)+hooks\/useSecret$/, replacement: mock('hooks.js') },
      { find: /^(\.\.\/)+hooks\/useAuth$/, replacement: mock('hooks.js') },
      { find: /^(\.\.\/)+firebase$/, replacement: mock('firebase.js') },
    ],
  },
  server: { port: 5180, strictPort: true, fs: { allow: [repo] } },
})
