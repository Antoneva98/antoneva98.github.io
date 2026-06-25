import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Served under the project page: antoneva98.github.io/my_portfolio/v3/
export default defineConfig({
  base: '/my_portfolio/v3/',
  plugins: [react(), tailwindcss()],
})
