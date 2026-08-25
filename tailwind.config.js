/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: 'rgb(var(--bg-surface) / <alpha-value>)',
          900: 'rgb(var(--bg-canvas) / <alpha-value>)',
          850: 'rgb(var(--bg-surface-elevated) / <alpha-value>)',
          800: 'rgb(var(--bg-surface-muted) / <alpha-value>)',
          700: 'rgb(var(--border-color) / var(--border-opacity))',
          600: 'rgb(var(--text-dim) / <alpha-value>)',
        },
        chalk: {
          50: 'rgb(var(--text-primary) / <alpha-value>)',
          100: 'rgb(var(--text-primary) / <alpha-value>)',
          200: 'rgb(var(--text-primary) / <alpha-value>)',
          300: 'rgb(var(--text-secondary) / <alpha-value>)',
          400: 'rgb(var(--text-muted) / <alpha-value>)',
          500: 'rgb(var(--text-dim) / <alpha-value>)',
          600: 'rgb(var(--border-color) / var(--border-opacity))',
        },
        amber: {
          DEFAULT: 'rgb(var(--amber-primary) / <alpha-value>)',
          glow: 'rgb(var(--amber-glow) / <alpha-value>)',
          dim: 'rgb(var(--amber-dim) / <alpha-value>)',
        },
        acid: {
          500: 'rgb(var(--acid-color) / <alpha-value>)',
          400: 'rgb(var(--acid-color) / <alpha-value>)',
        },
        electric: {
          500: 'rgb(var(--electric-color) / <alpha-value>)',
          400: 'rgb(var(--electric-color) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'monospace'],
      },
      animation: {
        'marquee': 'marquee 30s linear infinite',
        'marquee-reverse': 'marquee-reverse 30s linear infinite',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'marquee-reverse': {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0%)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.02)' },
        },
      },
    },
  },
  plugins: [],
}
