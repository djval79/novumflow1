/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_ENABLE_ERROR_REPORTING: string
  readonly VITE_STRIPE_PUBLIC_KEY: string
  readonly VITE_GOOGLE_ANALYTICS_ID: string
  readonly VITE_ENABLE_AI_FEATURES: string
  readonly VITE_ENABLE_OFFLINE_SUPPORT: string
  readonly VITE_ENABLE_PUSH_NOTIFICATIONS: string
  readonly VITE_CORS_ORIGINS: string
  readonly MODE: string
  readonly DEV: boolean
  readonly PROD: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  errorMonitoring?: {
    captureException: (error: Error) => void
    captureMessage: (message: string) => void
    reportPerformanceIssue?: (type: string, value: number, limit: number) => void
  }
  performanceMonitoring?: {
    trackPageLoad: () => void
    trackUserInteraction: (action: string) => void
  }
  gc?: () => void
}

interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
}