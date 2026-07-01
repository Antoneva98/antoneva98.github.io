import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Served at the root of the user site: antoneva98.github.io/
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
})
