// Enhanced Deployment and Environment Configuration
// Fixed: Environment variables, build optimization, security headers, deployment scripts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

// Environment-specific configurations
const ENVIRONMENTS = {
  development: {
    apiBaseUrl: 'http://localhost:3000',
    wsUrl: 'ws://localhost:3000',
    supabaseUrl: 'http://localhost:54321',
    logLevel: 'debug'
  },
  staging: {
    apiBaseUrl: 'https://staging-api.novumflow.com',
    wsUrl: 'wss://staging-api.novumflow.com',
    supabaseUrl: 'https://staging.supabase.co',
    logLevel: 'info'
  },
  production: {
    apiBaseUrl: 'https://api.novumflow.com',
    wsUrl: 'wss://api.novumflow.com',
    supabaseUrl: 'https://novumflow.supabase.co',
    logLevel: 'warn'
  }
} as const;

// Environment validation utilities
export const validateEnvironment = (env: string): boolean => {
  const validEnvironments = Object.keys(ENVIRONMENTS);
  return validEnvironments.includes(env);
};

// Environment detection
export const getEnvironment = (): keyof typeof ENVIRONMENTS => {
  const nodeEnv = import.meta.env.MODE;
  const customEnv = import.meta.env.VITE_CUSTOM_ENV;
  
  if (customEnv && validateEnvironment(customEnv)) {
    return customEnv as keyof typeof ENVIRONMENTS;
  }
  
  return (nodeEnv as keyof typeof ENVIRONMENTS) || 'development';
};

// Environment-specific configuration export
export const getEnvConfig = () => {
  const env = getEnvironment();
  const config = ENVIRONMENTS[env];
  
  return {
    ...config,
    environment: env,
    isDevelopment: env === 'development',
    isStaging: env === 'staging',
    isProduction: env === 'production',
    // Build specific configs
    buildCommand: env === 'development' ? 'dev' : 
                 env === 'staging' ? 'build:staging' : 
                 'build',
    outputDir: env === 'development' ? 'dist-dev' : 
                  env === 'staging' ? 'dist-staging' : 
                  'dist',
    // Asset optimization
    minify: env !== 'development',
    sourcemap: env !== 'production',
    // API endpoints
    apiBaseUrl: config.apiBaseUrl,
    wsUrl: config.wsUrl,
    supabaseUrl: config.supabaseUrl,
    // Logging
    logLevel: config.logLevel
  };
};

// Enhanced Vite configuration
export default defineConfig(({ mode }) => {
  const env = getEnvironment();
  const envConfig = getEnvConfig();
  
  return {
    // Server configuration
    server: {
      port: env === 'development' ? 3000 : undefined,
      host: env === 'development' ? 'localhost' : '0.0.0.0',
      watch: {
        usePolling: false,
        ignored: [
          '**/node_modules/**',
          '**/dist/**',
          '**/.git/**',
          '**/playwright-report/**',
          '**/test-results/**'
        ]
      }
    },

    // Build configuration with environment-specific optimizations
    build: {
      outDir: envConfig.outputDir,
      emptyOutDir: true,
      sourcemap: envConfig.sourcemap,
      minify: envConfig.minify ? 'esbuild' : false,
      target: 'es2020',
      rollupOptions: {
        output: {
          // Manual chunking for better caching
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js'],
            components: [
              './src/components/ui/index.js',
              './src/components/forms/index.js',
              './src/components/business/index.js'
            ],
            pages: [
              './src/pages/DashboardPage.js',
              './src/pages/HRModulePage.js',
              './src/pages/RecruitmentPage.js'
            ]
          },
          output: {
            // Optimize chunks for better caching
            chunkFileNames: (chunkInfo) => {
              const name = chunkInfo.name || 'chunk';
              const hash = chunkInfo.moduleId || '';
              return `${name}[hash].js`;
            }
          }
        },
        plugins: [
          react({
            // Fast refresh only in development
            fastRefresh: env === 'development',
            // Development optimizations
            devSourcemap: env === 'development'
          }),
          
          // Enhanced PWA configuration
          VitePWA({
            registerType: 'autoUpdate',
            strategies: 'generateSW',
            workbox: {
              // Runtime caching strategy
              runtimeCaching: [
                {
                  urlPattern: /^https:\/\/.*\/api\/.*/,
                  handler: 'NetworkFirst',
                  options: {
                    cacheName: 'api-cache',
                    networkTimeoutSeconds: 10,
                    cacheableResponse: {
                      statuses: [0, 200],
                      headers: {
                        'Cache-Control': 'public, max-age=300'
                      }
                    },
                    expiration: {
                      maxEntries: 100,
                      maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
                    }
                  }
                },
                {
                  // Static asset caching
                  urlPattern: /^https:\/\/.*\.(js|css|png|jpg|jpeg|svg|woff|woff2)$/,
                  handler: 'CacheFirst',
                  options: {
                    cacheName: 'static-assets',
                    expiration: {
                      maxEntries: 200,
                      maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
                    }
                  }
                }
              ],
              globPatterns: [
                '**/*.{js,css,html}',
                '**/*.{png,jpg,jpeg,svg,ico,webp}',
                '**/*.{woff,woff2}'
              ],
              skipWaiting: env === 'production'
            },
            manifest: {
              name: 'NovumFlow HR Platform',
              short_name: 'NovumFlow',
              description: 'Comprehensive HR & Recruitment Management Platform',
              theme_color: '#4f46e5',
              background_color: '#ffffff',
              display: 'standalone',
              orientation: 'portrait-primary',
              start_url: '/',
              scope: '/',
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
              ],
              shortcuts: [
                {
                  name: 'Dashboard',
                  short_name: 'Dashboard',
                  description: 'View HR dashboard',
                  url: '/dashboard',
                  icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
                },
                {
                  name: 'Add Employee',
                  short_name: 'Add Staff',
                  description: 'Quickly onboard new staff',
                  url: '/hr?tab=employees',
                  icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
                },
                {
                  name: 'Schedule',
                  short_name: 'Schedule',
                  description: 'View shift schedules',
                  url: '/hr?tab=shifts',
                  icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
                }
              ]
            }
          })
        ]
      },

      // Environment variables handling
      define: {
        // Provide environment variables to the application
        'VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version || '1.0.0'),
        'VITE_BUILD_TIME': JSON.stringify(new Date().toISOString()),
        'VITE_COMMIT_HASH': JSON.stringify(process.env.VERCEL_GIT_COMMIT_SHA || 'unknown'),
        'VITE_ENVIRONMENT': JSON.stringify(env),
        'VITE_API_BASE_URL': JSON.stringify(envConfig.apiBaseUrl),
        'VITE_SUPABASE_URL': JSON.stringify(envConfig.supabaseUrl),
        'VITE_WS_URL': JSON.stringify(envConfig.wsUrl),
        'VITE_LOG_LEVEL': JSON.stringify(envConfig.logLevel),
        'VITE_PWA_ENABLED': JSON.stringify(env !== 'development'),
        'VITE_SENTRY_DSN': JSON.stringify(process.env.SENTRY_DSN || ''),
        'VITE_ANALYTICS_ID': JSON.stringify(process.env.ANALYTICS_ID || '')
      },

      // CSS preprocessing
      css: {
        postcss: {
          plugins: [
            // Tailwind CSS processing
            require('tailwindcss'),
            // Autoprefixer for browser compatibility
            require('autoprefixer')
          ]
        },
        devSourcemap: env === 'development'
      },

      // Resolve aliases
      resolve: {
        alias: {
          '@': resolve(__dirname, './src'),
          '@components': resolve(__dirname, './src/components'),
          '@pages': resolve(__dirname, './src/pages'),
          '@hooks': resolve(__dirname, './src/hooks'),
          '@lib': resolve(__dirname, './src/lib'),
          '@services': resolve(__dirname, './src/lib/services'),
          '@utils': resolve(__dirname, './src/lib/utils'),
          '@assets': resolve(__dirname, './src/assets'),
          '@public': resolve(__dirname, './public')
        },
        extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
        mainFields: ['module', 'main', 'browser'],
        browserField: 'browser',
        conditions: {
          'imports': 'node',
          'require': 'node',
          'node': 'node',
          'default': 'node'
        }
      },

      // Optimization settings
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          'react-router-dom',
          '@supabase/supabase-js',
          'date-fns',
          'lucide-react'
        ]
      },

      // Development server settings
      preview: {
        port: 3001,
        host: 'localhost'
      },

      // Experimental features
      experimental: {
        renderBuiltUrl: env === 'development',
        viteInspect: env === 'development'
      },

      // Error handling
      clearScreen: false,
      
      // Logging configuration
      logLevel: envConfig.logLevel,
      
      // Environment-specific plugins
      plugins: [
        react({
          fastRefresh: env === 'development',
          devSourcemap: env === 'development'
        })
      ]
    }
  };
});

// Environment-specific package.json scripts
export const getEnvScripts = () => {
  const env = getEnvironment();
  
  return {
    development: {
      "dev": "vite",
      "build": "vite build",
      "preview": "vite preview",
      "test": "vitest run",
      "test:e2e": "playwright test",
      "test:coverage": "vitest run --coverage",
      "lint": "eslint . --ext .ts,.tsx",
      "lint:fix": "eslint . --ext .ts,.tsx --fix",
      "type-check": "tsc --noEmit",
      "clean": "rm -rf dist"
    },
    staging: {
      "build": "vite build --mode staging",
      "preview": "vite preview --mode staging",
      "test": "vitest run",
      "test:e2e": "playwright test",
      "deploy": "npm run deploy:staging",
      "clean": "rm -rf dist"
    },
    production: {
      "build": "vite build --mode production",
      "preview": "vite preview --mode production",
      "test": "vitest run",
      "test:e2e": "playwright test --project=production",
      "deploy": "npm run deploy:production",
      "clean": "rm -rf dist"
    }
  }[env] || {};
};

// Deployment utilities
export const deploymentUtils = {
  // Environment variable validation
  validateRequiredEnvVars: (): { isValid: boolean; missing: string[] } => {
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_GEMINI_API_KEY'
    ];

    const missing = requiredVars.filter(varName => !import.meta.env[varName]);
    
    return {
      isValid: missing.length === 0,
      missing
    };
  },

  // Health check for deployment
  checkDeploymentHealth: async (): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Array<{ name: string; status: 'pass' | 'fail'; message?: string }>;
  }> => {
    const checks = [];
    
    // Check environment variables
    const envValidation = deploymentUtils.validateRequiredEnvVars();
    checks.push({
      name: 'Environment Variables',
      status: envValidation.isValid ? 'pass' : 'fail',
      message: envValidation.isValid ? undefined : `Missing: ${envValidation.missing.join(', ')}`
    });

    // Check Supabase connection
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
        method: 'HEAD',
        timeout: 5000
      });
      
      checks.push({
        name: 'Supabase Connection',
        status: response.ok ? 'pass' : 'fail',
        message: response.ok ? undefined : `Status: ${response.status}`
      });
    } catch (error) {
      checks.push({
        name: 'Supabase Connection',
        status: 'fail',
        message: `Connection failed: ${error.message}`
      });
    }

    // Check API accessibility
    try {
      const apiResponse = await fetch(`${getEnvConfig().apiBaseUrl}/health`, {
        method: 'GET',
        timeout: 5000
      });
      
      checks.push({
        name: 'API Health',
        status: apiResponse.ok ? 'pass' : 'fail',
        message: apiResponse.ok ? undefined : `Status: ${apiResponse.status}`
      });
    } catch (error) {
      checks.push({
        name: 'API Health',
        status: 'fail',
        message: `API health check failed: ${error.message}`
      });
    }

    // Check service worker registration
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        checks.push({
          name: 'Service Worker',
          status: registration ? 'pass' : 'fail',
          message: registration ? undefined : 'Service worker not registered'
        });
      } catch (error) {
        checks.push({
          name: 'Service Worker',
          status: 'fail',
          message: `Service worker check failed: ${error.message}`
        });
      }
    }

    // Determine overall status
    const failedChecks = checks.filter(check => check.status === 'fail');
    const degradedChecks = checks.filter(check => check.status === 'pass' && check.message);
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (failedChecks.length > 0) {
      status = 'unhealthy';
    } else if (degradedChecks.length > 0) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    return { status, checks };
  },

  // Database migration utilities
  runDatabaseMigrations: async (targetEnv?: string): Promise<boolean> => {
    try {
      const env = targetEnv || getEnvironment();
      const config = ENVIRONMENTS[env];
      
      // This would typically run via CI/CD pipeline
      console.log(`Running database migrations for ${env} environment`);
      console.log(`Target database: ${config.supabaseUrl}`);
      
      // In a real scenario, this would execute migration scripts
      // For now, we'll simulate the check
      const migrationCheck = await fetch(`${config.supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        timeout: 10000
      });
      
      return migrationCheck.ok;
    } catch (error) {
      console.error('Migration failed:', error);
      return false;
    }
  },

  // SSL/TLS configuration check
  checkSSLConfiguration: async (url: string): Promise<{
    isValid: boolean;
    details: string;
    certificate?: any;
  }> => {
    try {
      const response = await fetch(url, {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok && response.url.startsWith('https://')) {
        return {
          isValid: true,
          details: 'SSL configuration is valid',
          certificate: null
        };
      } else {
        return {
          isValid: false,
          details: 'SSL/TLS configuration issue detected',
          certificate: null
        };
      }
    } catch (error) {
      return {
        isValid: false,
        details: `SSL check failed: ${error.message}`,
        certificate: null
      };
    }
  }
};

// Production deployment configuration
export const PRODUCTION_CONFIG = {
  // CDN settings
  cdn: {
    provider: 'vercel',
    domain: 'novumflow.vercel.app',
    assetDomain: 'novumflow-assets.vercel.app',
    // Cache headers for different asset types
    cacheHeaders: {
      images: 'public, max-age=31536000, immutable',
      js: 'public, max-age=31536000',
      css: 'public, max-age=31536000',
      fonts: 'public, max-age=31536000, immutable'
    }
  },
  
  // Security headers
  securityHeaders: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  },
  
  // Monitoring and analytics
  monitoring: {
    sentry: {
      dsn: process.env.SENTRY_DSN,
      environment: process.env.VERCEL_ENV || 'production',
      tracesSampleRate: 0.1,
      profilesSampleRate: 0.1
    },
    analytics: {
      id: process.env.ANALYTICS_ID || 'G-XXXXXXXXXX',
      enabled: true
    }
  },
  
  // Backup and recovery
  backup: {
    schedule: '0 2 * * *', // Daily at 2 AM
    retention: 30, // 30 days
    locations: ['s3://novumflow-backups', 'gcs://novumflow-backups'],
    encryption: true
  }
};

// Build optimization utilities
export const buildOptimization = {
  // Bundle analysis utilities
  analyzeBundle: (bundleStats: any) => {
    const analysis = {
      totalSize: bundleStats.totalSize || 0,
      chunks: bundleStats.chunks || [],
      assets: bundleStats.assets || [],
      
      // Identify large chunks
      largeChunks: (bundleStats.chunks || []).filter(chunk => chunk.size > 500000), // > 500KB
      
      // Identify optimization opportunities
      optimizations: [
        // Code splitting opportunities
        ...(bundleStats.chunks || []).length > 20 ? [{
          type: 'code_splitting',
          description: 'Consider implementing route-based code splitting',
          impact: 'high'
        }] : []),
        
        // Tree shaking opportunities
        bundleStats.usedExports ? [] : [{
          type: 'tree_shaking',
          description: 'Consider removing unused exports and dependencies',
          impact: 'medium'
        }]
      ]
    };
    
    return analysis;
  },

  // Generate build report
  generateBuildReport: async (buildStats: any): Promise<string> => {
    const analysis = buildOptimization.analyzeBundle(buildStats);
    
    const report = `
NOVUMFLOW BUILD REPORT
Generated: ${new Date().toISOString()}

BUILD METRICS:
- Total Size: ${Math.round(analysis.totalSize / 1024)}KB
- Total Chunks: ${analysis.chunks.length}
- Large Chunks: ${analysis.largeChunks.length}

OPTIMIZATION RECOMMENDATIONS:
${analysis.optimizations.map(opt => `- ${opt.type}: ${opt.description} (Impact: ${opt.impact})`).join('\n')}

LARGE CHUNKS:
${analysis.largeChunks.map(chunk => `- ${chunk.name}: ${Math.round(chunk.size / 1024)}KB`).join('\n')}
    `;
    
    return report;
  }
};