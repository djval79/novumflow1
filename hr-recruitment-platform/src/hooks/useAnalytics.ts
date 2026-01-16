import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import posthog from 'posthog-js';
import * as Sentry from '@sentry/browser';

export const useAnalytics = () => {
    const location = useLocation();

    // Track Pageviews
    useEffect(() => {
        posthog.capture('$pageview');
    }, [location]);

    const trackEvent = (eventName: string, properties?: Record<string, any>) => {
        posthog.capture(eventName, properties);

        // Also log to Sentry breadcrumbs for better debugging
        Sentry.addBreadcrumb({
            category: 'analytics',
            message: `Event tracked: ${eventName}`,
            data: properties,
            level: 'info',
        });
    };

    const identifyUser = (userId: string, traits?: Record<string, any>) => {
        posthog.identify(userId, traits);
        Sentry.setUser({ id: userId, ...traits });
    };

    return { trackEvent, identifyUser };
};
