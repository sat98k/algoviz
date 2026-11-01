/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  // hover: utilities apply only where the pointer can hover, so a tap never leaves one stuck on.
  future: { hoverOnlyWhenSupported: true },
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
        // Semantic colours: bg-sem-mismatch/15, border-sem-mismatch, text-sem-mismatch-ink …
        sem: {
          current: 'rgb(var(--sem-current) / <alpha-value>)',
          'current-ink': 'rgb(var(--sem-current-ink) / <alpha-value>)',
          compare: 'rgb(var(--sem-compare) / <alpha-value>)',
          'compare-ink': 'rgb(var(--sem-compare-ink) / <alpha-value>)',
          match: 'rgb(var(--sem-match) / <alpha-value>)',
          'match-ink': 'rgb(var(--sem-match-ink) / <alpha-value>)',
          mismatch: 'rgb(var(--sem-mismatch) / <alpha-value>)',
          'mismatch-ink': 'rgb(var(--sem-mismatch-ink) / <alpha-value>)',
          pruned: 'rgb(var(--sem-pruned) / <alpha-value>)',
          'pruned-ink': 'rgb(var(--sem-pruned-ink) / <alpha-value>)',
          backtrack: 'rgb(var(--sem-backtrack) / <alpha-value>)',
          'backtrack-ink': 'rgb(var(--sem-backtrack-ink) / <alpha-value>)',
          decision: 'rgb(var(--sem-decision) / <alpha-value>)',
          'decision-ink': 'rgb(var(--sem-decision-ink) / <alpha-value>)',
          final: 'rgb(var(--sem-final) / <alpha-value>)',
          'final-ink': 'rgb(var(--sem-final-ink) / <alpha-value>)',
          formula: 'rgb(var(--sem-formula) / <alpha-value>)',
          'formula-ink': 'rgb(var(--sem-formula-ink) / <alpha-value>)',
          warning: 'rgb(var(--sem-warning) / <alpha-value>)',
          'warning-ink': 'rgb(var(--sem-warning-ink) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['"Red Hat Display"', 'system-ui', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['"Red Hat Text"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'monospace'],
      },
      // Strong custom curves (Emil Kowalski's set) in place of the weak built-in ones: ease-out for
      // things entering or answering a press, ease-in-out for objects moving across a scene.
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.23, 1, 0.32, 1)',
        out: 'cubic-bezier(0.23, 1, 0.32, 1)',
        'in-out': 'cubic-bezier(0.77, 0, 0.175, 1)',
      },
      // transition-all names what may move. Positions and sizes stay on the list because the story
      // scenes glide items between slots (docs/animation-preferences.md); nothing else animates by accident.
      transitionProperty: {
        all: 'transform, translate, scale, rotate, opacity, color, background-color, border-color, fill, stroke, stroke-dashoffset, box-shadow, filter, left, top, right, bottom, width, height',
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
