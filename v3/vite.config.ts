import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Served under the user page: antoneva98.github.io/v3/
export default defineConfig({
  base: '/v3/',
  plugins: [react(), tailwindcss()],
})
