import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    // Fix reload issue on routes - always serve index.html for SPA
    historyApiFallback: true,
  },
})
