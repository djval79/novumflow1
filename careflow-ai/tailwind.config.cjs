/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        container: {
            center: true,
            padding: {
                DEFAULT: '1rem',
                sm: '1.5rem',
                lg: '2rem',
                xl: '3rem',
            },
            screens: {
                xs: '320px',
                sm: '640px',
                md: '768px',
                lg: '1024px',
                xl: '1280px',
                '2xl': '1536px',
                '3xl': '1920px',
            },
        },
        extend: {
            colors: {
                primary: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    200: '#bae6fd',
                    300: '#7dd3fc',
                    400: '#38bdf8',
                    500: '#0ea5e9',
                    600: '#0284c7',
                    700: '#0369a1',
                    800: '#075985',
                    900: '#0c4a6e',
                },
                secondary: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                    950: '#020617',
                },
                success: {
                    light: '#dcfce7',
                    main: '#16a34a',
                    dark: '#15803d',
                },
                warning: {
                    light: '#fef3c7',
                    main: '#f59e0b',
                    dark: '#d97706',
                },
                error: {
                    light: '#fee2e2',
                    main: '#dc2626',
                    dark: '#b91c1c',
                },
                info: {
                    light: '#dbeafe',
                    main: '#2563eb',
                    dark: '#1d4ed8',
                },
            },
            fontSize: {
                'responsive-h1': [
                    '1.875rem',
                    {
                        lineHeight: '2.25rem',
                        '@media (min-width: 640px)': {
                            fontSize: '2.25rem',
                            lineHeight: '2.5rem',
                        },
                        '@media (min-width: 768px)': {
                            fontSize: '2.5rem',
                            lineHeight: '2.75rem',
                        },
                        '@media (min-width: 1024px)': {
                            fontSize: '3rem',
                            lineHeight: '3.25rem',
                        },
                        '@media (min-width: 1280px)': {
                            fontSize: '3.75rem',
                            lineHeight: '4rem',
                        },
                    },
                ],
                'responsive-h2': [
                    '1.5rem',
                    {
                        lineHeight: '2rem',
                        '@media (min-width: 640px)': {
                            fontSize: '1.75rem',
                            lineHeight: '2.25rem',
                        },
                        '@media (min-width: 768px)': {
                            fontSize: '2rem',
                            lineHeight: '2.5rem',
                        },
                        '@media (min-width: 1024px)': {
                            fontSize: '2.25rem',
                            lineHeight: '2.75rem',
                        },
                        '@media (min-width: 1280px)': {
                            fontSize: '2.5rem',
                            lineHeight: '3rem',
                        },
                    },
                ],
                'responsive-body': [
                    '0.875rem',
                    {
                        lineHeight: '1.25rem',
                        '@media (min-width: 640px)': {
                            fontSize: '0.9375rem',
                            lineHeight: '1.375rem',
                        },
                        '@media (min-width: 768px)': {
                            fontSize: '1rem',
                            lineHeight: '1.5rem',
                        },
                        '@media (min-width: 1024px)': {
                            fontSize: '1.125rem',
                            lineHeight: '1.75rem',
                        },
                    },
                ],
            },
            spacing: {
                'responsive-container': [
                    '1rem',
                    {
                        '@media (min-width: 640px)': '1.5rem',
                        '@media (min-width: 768px)': '2rem',
                        '@media (min-width: 1024px)': '2rem',
                        '@media (min-width: 1280px)': '3rem',
                    },
                ],
                'responsive-section': [
                    '3rem',
                    {
                        '@media (min-width: 640px)': '4rem',
                        '@media (min-width: 768px)': '5rem',
                        '@media (min-width: 1024px)': '6rem',
                        '@media (min-width: 1280px)': '8rem',
                    },
                ],
            },
        },
    },
    plugins: [],
}
