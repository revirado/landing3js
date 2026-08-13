--- landing-personal/vite.config.ts (原始)


+++ landing-personal/vite.config.ts (修改后)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})