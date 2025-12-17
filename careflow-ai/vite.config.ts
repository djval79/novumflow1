import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    root: process.cwd(),
    server: {
      port: 5174,
      host: '0.0.0.0',
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: path.resolve(process.cwd(), 'index.html'),
        },
      },
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), './src'),
      }
    }
  };
});
