import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import sourceIdentifierPlugin from 'vite-plugin-source-identifier'

import { VitePWA } from 'vite-plugin-pwa'

const isProd = process.env.BUILD_MODE === 'prod'
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/' : '/',
  plugins: [
    react(),
    sourceIdentifierPlugin({
      enabled: !isProd,
      attributePrefix: 'data-matrix',
      includeProps: true,
    }),
    VitePWA({
      disable: false, // Re-enabled with proper caching strategy
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      
      // Workbox configuration for service worker
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        
        // Runtime caching strategies
        runtimeCaching: [
          {
            // Cache API responses (Supabase)
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst', // Try network first, fallback to cache
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days (not 365!)
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              networkTimeoutSeconds: 10, // Fallback to cache after 10s
            },
          },
          {
            // Cache static assets
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: 'CacheFirst', // Cache first, update in background
            options: {
              cacheName: 'static-images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            // Cache fonts
            urlPattern: /\.(?:woff|woff2|ttf|eot)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year for fonts is OK
              },
            },
          },
        ],
        
        // Clean up old caches
        cleanupOutdatedCaches: true,
        
        // Skip waiting for new service worker
        skipWaiting: true,
        clientsClaim: true,
      },
      
      // Manifest configuration
      manifest: {
        name: 'NovumFlow HR Recruitment Platform',
        short_name: 'NovumFlow',
        description: 'Advanced HR Platform with AI Automation - Saving 60+ hours weekly',
        theme_color: '#2B5D3A',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        categories: ['business', 'productivity'],
        shortcuts: [
          {
            name: 'Dashboard',
            short_name: 'Dashboard',
            description: 'View HR dashboard',
            url: '/dashboard',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Recruitment',
            short_name: 'Jobs',
            description: 'Manage recruitment',
            url: '/recruitment',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
          }
        ]
      },
      
      // Development configuration
      devOptions: {
        enabled: !isProd, // Enable in development for testing
        type: 'module',
      },
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
  },
})

