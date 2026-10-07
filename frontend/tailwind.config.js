/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // VPD Brand Palette: Deep Dark Charcoal & Warm Gold
        bg: {
          primary: '#0a0a0a',
          secondary: '#121212',
          card: '#171717',
          hover: '#202020',
        },
        border: {
          subtle: '#2a2a2a',
          gold: '#d4af37',
        },
        gold: {
          DEFAULT: '#d4af37',
          primary: '#d4af37',
          highlight: '#dfc067',
          hover: '#c29d2b',
          muted: 'rgba(212, 175, 55, 0.15)',
        },
        brand: {
          DEFAULT: '#d4af37',
          dark: '#0a0a0a',
          light: '#dfc067',
          tint: '#fdf6db',
        },
        accent: {
          gold: '#d4af37',
          'gold-pale': 'rgba(212, 175, 55, 0.1)',
        },
        warning: '#f59e0b',
        danger: '#ef4444',
        success: '#22c55e',
        info: '#38bdf8',

        // Neutral surface scale
        surface: {
          DEFAULT: '#121212',
          dim: '#0a0a0a',
          bright: '#1a1a1a',
          low: '#0f0f0f',
          container: '#171717',
          high: '#202020',
          highest: '#262626',
          white: '#171717',
        },
        ink: {
          DEFAULT: '#ffffff',
          muted: '#a1a1aa',
          inverse: '#0a0a0a',
        },
        outline: {
          DEFAULT: '#2a2a2a',
          variant: '#3f3f46',
        },
        dark: {
          surface: { DEFAULT: '#121212', dim: '#0a0a0a', bright: '#1a1a1a', low: '#0f0f0f', container: '#171717', high: '#202020', highest: '#262626', white: '#171717' },
          ink: { DEFAULT: '#ffffff', muted: '#a1a1aa', inverse: '#0a0a0a' },
          outline: { DEFAULT: '#2a2a2a', variant: '#3f3f46' },
          brand: { DEFAULT: '#d4af37', dark: '#0a0a0a', light: '#dfc067', tint: '#dfc067' },
        },
        status: {
          success: { bg: '#052e16', text: '#4ade80' },
          warning: { bg: '#451a03', text: '#fbbf24' },
          error: { bg: '#450a0a', text: '#f87171' },
          info: { bg: '#082f49', text: '#38bdf8' },
          neutral: { bg: '#27272a', text: '#d4d4d8' },
        },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        stat: ['Montserrat', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
      },
      boxShadow: {
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.4)',
        gold: '0 0 15px rgba(212, 175, 55, 0.25)',
      },
    },
  },
  plugins: [],
}
