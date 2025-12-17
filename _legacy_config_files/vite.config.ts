import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['defaults', 'not IE 11']
    }),
    // VitePWA({ // Temporarily disabled for debugging persistent caching issues
    //   registerType: 'autoUpdate',
    //   workbox: {
    //     globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    //     runtimeCaching: [
    //       {
    //         urlPattern: /^https:\/\/kvtdyttgthbeomyvtmbj\.supabase\.co\/.*/i,
    //         handler: 'NetworkFirst',
    //         options: {
    //           cacheName: 'supabase-api-cache',
    //           expiration: {
    //             maxEntries: 10,
    //             maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
    //           },
    //           cacheKeyWillBeUsed: async ({ request }) => {
    //             return `${request.url}?${request.method}`
    //           }
    //         }
    //       }
    //     ]
    //   },
    //   includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
    //   manifest: {
    //     name: 'NOVUMFLOW - HR Platform',
    //     short_name: 'NOVUMFLOW',
    //     description: 'Advanced HR Platform with AI Automation - Saving 60+ hours weekly and delivering 176% ROI',
    //     theme_color: '#4f46e5',
    //     background_color: '#ffffff',
    //     display: 'standalone',
    //     orientation: 'portrait',
    //     scope: '/',
    //     start_url: '/',
    //     icons: [
    //       {
    //         src: 'pwa-192x192.png',
    //         sizes: '192x192',
    //         type: 'image/png'
    //       },
    //       {
    //         src: 'pwa-512x512.png',
    //         sizes: '512x512',
    //         type: 'image/png'
    //       },
    //       {
    //         src: 'pwa-512x512.png',
    //         sizes: '512x512',
    //         type: 'image/png',
    //         purpose: 'any maskable'
    //       }
    //     ],
    //     categories: ['business', 'productivity', 'utilities'],
    //     shortcuts: [
    //       {
    //         name: 'Dashboard',
    //         short_name: 'Dashboard',
    //         description: 'View HR dashboard',
    //         url: '/dashboard',
    //         icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
    //       },
    //       {
    //         name: 'Recruitment',
    //         short_name: 'Jobs',
    //         description: 'Manage recruitment',
    //         url: '/recruitment',
    //         icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
    //       },
    //       {
    //         name: 'Employees',
    //         short_name: 'HR',
    //         description: 'Employee management',
    //         url: '/hr',
    //         icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
    //       }
    //     ]
    //   }
    // })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize for Netlify
    outDir: 'dist',
    sourcemap: false, // Disable in production for security
    minify: 'terser',
    target: 'es2020',
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-popover'],
          supabase: ['@supabase/supabase-js'],
          charts: ['recharts'],
          icons: ['lucide-react'],
          utils: ['clsx', 'tailwind-merge', 'date-fns', 'zod']
        }
      }
    },
    // Optimize bundle size
    chunkSizeWarningLimit: 1000,
    assetsDir: 'assets',
    // Enable gzip compression
    reportCompressedSize: true,
    // CSS code splitting
    cssCodeSplit: true
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'recharts',
      'lucide-react'
    ]
  },
  server: {
    port: 3000,
    host: true, // Listen on all addresses
    open: false // Don't auto-open browser in CI
  },
  preview: {
    port: 4173,
    host: true
  },
  define: {
    // Environment variables for build time
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    __COMMIT_SHA__: JSON.stringify(process.env.COMMIT_REF?.slice(0, 7) || 'dev')
  },
  // Enable CSS modules
  css: {
    modules: {
      localsConvention: 'camelCase'
    }
  }
})