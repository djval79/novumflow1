import { resolve } from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0'
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/context': resolve(__dirname, './src/context'),
      '@/lib': resolve(__dirname, './src/lib'),
      '@/pages': resolve(__dirname, './src/pages'),
      '@/services': resolve(__dirname, './src/services'),
      '@/types': resolve(__dirname, './src/types')
    }
  }
})