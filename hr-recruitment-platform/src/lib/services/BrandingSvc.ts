/**
 * Branding service for dynamic multi-tenant UI customization.
 */

export interface TenantBranding {
    primaryColor?: string;
    accentColor?: string;
    logoUrl?: string;
    companyName?: string;
}

export const brandingSvc = {
    /**
     * Apply branding settings by injecting CSS variables into the document root.
     */
    applyBranding: (branding: TenantBranding | undefined) => {
        const root = document.documentElement;

        // Use defaults if no branding provided
        const primary = branding?.primaryColor || '#0891b2'; // Cyan-600
        const accent = branding?.accentColor || '#4f46e5';   // Indigo-600

        root.style.setProperty('--color-primary', primary);
        root.style.setProperty('--color-accent', accent);

        // Add variations for hover states (simplified for now)
        root.style.setProperty('--color-primary-hover', brandingSvc.adjustBrightness(primary, -10));
        root.style.setProperty('--color-accent-hover', brandingSvc.adjustBrightness(accent, -10));

        console.log(`[BrandingSvc] Applied theme: ${primary} / ${accent}`);
    },

    /**
     * Simple utility to darken/lighten a hex color.
     */
    adjustBrightness: (hex: string, percent: number) => {
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);

        r = Math.min(255, Math.max(0, r + (r * percent) / 100));
        g = Math.min(255, Math.max(0, g + (g * percent) / 100));
        b = Math.min(255, Math.max(0, b + (b * percent) / 100));

        const rr = Math.round(r).toString(16).padStart(2, '0');
        const gg = Math.round(g).toString(16).padStart(2, '0');
        const bb = Math.round(b).toString(16).padStart(2, '0');

        return `#${rr}${gg}${bb}`;
    }
};
