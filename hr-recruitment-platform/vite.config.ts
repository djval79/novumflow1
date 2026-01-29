import { resolve } from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'NovumFlow HR',
        short_name: 'NovumFlow',
        description: 'Premium HR & Recruitment Platform',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      shortcuts: [
        {
          name: 'Recruitment',
          short_name: 'Recruit',
          description: 'Manage job postings and applications',
          url: '/recruitment',
          icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
        },
        {
          name: 'Add Employee',
          short_name: 'Add Staff',
          description: 'Quickly onboard a new staff member',
          url: '/hr',
          icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
        },
        {
          name: 'Attendance',
          short_name: 'Clock',
          description: 'View today\'s attendance',
          url: '/attendance',
          icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
        }
      ]
    })
  ],
  server: {
    watch: {
      ignored: ['**/playwright-report/**', '**/test-results/**'],
    },
  },
  base: '/',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'supabase-api-cache',
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 // 24 hours
          },
          cacheableResponse: {
            statuses: [0, 200]
          }
        }
      },
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-cache',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
          },
          cacheableResponse: {
            statuses: [0, 200]
          }
        }
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'image-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
          }
        }
      },
      {
        urlPattern: /\.(?:js|css)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-resources',
          expiration: {
            maxEntries: 60,
            maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
          }
        }
      }
    ]
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@/components": resolve(__dirname, "./src/components"),
      "@/context": resolve(__dirname, "./src/context"),
      "@/lib": resolve(__dirname, "./src/lib"),
      "@/pages": resolve(__dirname, "./src/pages"),
      "@/services": resolve(__dirname, "./src/services"),
      "@/types": resolve(__dirname, "./src/types")
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000,
    minify: 'esbuild',
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        // manualChunks removed to let Vite handle dependency splitting
        // This fixes circular dependency and initialization errors in production builds
      }
    }
  },
  esbuild: {
    legalComments: 'none',
  },
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.GEMINI_API_KEY),
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY)
  }
})