/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
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
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					50: '#f0fdfa',
					100: '#ccfbf1',
					200: '#99f6e4',
					300: '#5eead4',
					400: '#2dd4bf',
					500: '#14b8a6',
					600: '#0d9488',
					700: '#0f766e',
					800: '#115e59',
					900: '#134e4a',
					950: '#042f2e',
					DEFAULT: '#2B5D3A',
					foreground: 'hsl(var(--primary-foreground))',
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
					DEFAULT: '#4A90E2',
					foreground: 'hsl(var(--secondary-foreground))',
				},
				accent: {
					DEFAULT: '#F5A623',
					foreground: 'hsl(var(--accent-foreground))',
				},
				destructive: {
					light: '#fee2e2',
					main: '#dc2626',
					dark: '#b91c1c',
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				warning: {
					light: '#fef3c7',
					main: '#f59e0b',
					dark: '#d97706',
				},
				success: {
					light: '#dcfce7',
					main: '#16a34a',
					dark: '#15803d',
				},
				info: {
					light: '#dbeafe',
					main: '#2563eb',
					dark: '#1d4ed8',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
			fontSize: {
				'responsive-h1': [
					'1.875rem',
					{
						lineHeight: '2.25rem',
						'@screen sm': {
							fontSize: '2.25rem',
							lineHeight: '2.5rem',
						},
						'@screen md': {
							fontSize: '2.5rem',
							lineHeight: '2.75rem',
						},
						'@screen lg': {
							fontSize: '3rem',
							lineHeight: '3.25rem',
						},
						'@screen xl': {
							fontSize: '3.75rem',
							lineHeight: '4rem',
						},
					},
				],
				'responsive-h2': [
					'1.5rem',
					{
						lineHeight: '2rem',
						'@screen sm': {
							fontSize: '1.75rem',
							lineHeight: '2.25rem',
						},
						'@screen md': {
							fontSize: '2rem',
							lineHeight: '2.5rem',
						},
						'@screen lg': {
							fontSize: '2.25rem',
							lineHeight: '2.75rem',
						},
						'@screen xl': {
							fontSize: '2.5rem',
							lineHeight: '3rem',
						},
					},
				],
				'responsive-body': [
					'0.875rem',
					{
						lineHeight: '1.25rem',
						'@screen sm': {
							fontSize: '0.9375rem',
							lineHeight: '1.375rem',
						},
						'@screen md': {
							fontSize: '1rem',
							lineHeight: '1.5rem',
						},
						'@screen lg': {
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
						'@screen sm': '1.5rem',
						'@screen md': '2rem',
						'@screen lg': '2rem',
						'@screen xl': '3rem',
					},
				],
				'responsive-section': [
					'3rem',
					{
						'@screen sm': '4rem',
						'@screen md': '5rem',
						'@screen lg': '6rem',
						'@screen xl': '8rem',
					},
				],
			},
			keyframes: {
				'accordion-down': {
					from: { height: 0 },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: 0 },
				},
				blob: {
					'0%': { transform: 'translate(0px, 0px) scale(1)' },
					'33%': { transform: 'translate(30px, -50px) scale(1.1)' },
					'66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
					'100%': { transform: 'translate(0px, 0px) scale(1)' },
				},
				float: {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-20px)' },
				},
				fadeInUp: {
					'0%': { opacity: 0, transform: 'translateY(20px)' },
					'100%': { opacity: 1, transform: 'translateY(0)' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				blob: 'blob 7s infinite',
				float: 'float 6s ease-in-out infinite',
				'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
}