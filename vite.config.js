import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cloudflare } from '@cloudflare/vite-plugin' // ← REMOVE THIS

export default defineConfig({
  plugins: [
    cloudflare(), // ← REMOVE THIS TOO
    react(),
  ],
})
Change it to just:
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
