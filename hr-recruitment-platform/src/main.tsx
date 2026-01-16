import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import './index.css'
import './lib/i18n'
import * as Sentry from "@sentry/browser";
import posthog from 'posthog-js'
import App from './App.tsx'

if (typeof window !== 'undefined') {
  const phKey = import.meta.env.VITE_POSTHOG_KEY;
  if (phKey && phKey !== 'phc_placeholder') {
    posthog.init(phKey, {
      api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://eu.posthog.com',
      person_profiles: 'identified_only',
      capture_pageview: false // We will handle this in a router hook
    });
  } else {
    console.warn('[PH] PostHog initialization skipped: Missing VITE_POSTHOG_KEY');
  }
}

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || "https://examplePublicKey@o0.ingest.sentry.io/0",
  integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  environment: import.meta.env.MODE,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
