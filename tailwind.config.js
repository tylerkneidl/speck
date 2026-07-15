/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      fontFamily: {
        sans: ['"Hanken Grotesk Variable"', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Archivo Variable"', '"Hanken Grotesk Variable"', 'ui-sans-serif', 'sans-serif'],
        mono: ['"JetBrains Mono Variable"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        // Brand: cool "ink" neutrals remap Tailwind's zinc scale, so every
        // hardcoded zinc-* in the app recolors to the Speck palette at once.
        zinc: {
          50: '#f5f7fb',
          100: '#e8ecf4',
          200: '#d2d8e6',
          300: '#adb6c9',
          400: '#8b93a7',
          500: '#667087',
          600: '#464f63',
          700: '#2c3444',
          800: '#1a2030',
          900: '#11141d',
          950: '#090b11',
        },
        // Flare (hot accent) remaps emerald — the old accent color name.
        emerald: {
          50: '#fff1ec',
          100: '#ffe0d5',
          200: '#ffc0aa',
          300: '#ff9d78',
          400: '#ff7a45',
          500: '#ff5a2c',
          600: '#ff4e22',
          700: '#d63a12',
          800: '#ad3011',
          900: '#8a2913',
          950: '#4b1206',
        },
        // Flare alias (use going forward instead of emerald)
        flare: {
          DEFAULT: '#ff4e22',
          hi: '#ff7a45',
          lo: '#d63a12',
        },
        // Plasma (cool data signal) — graphs, "saved", velocity cues
        plasma: {
          DEFAULT: '#27e0cf',
          hi: '#64f0e2',
          lo: '#14b9ab',
        },
        // shadcn semantic tokens (used by ui/* primitives)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        sunken: { DEFAULT: 'hsl(var(--sunken))', foreground: 'hsl(var(--sunken-foreground))' },
        warning: { DEFAULT: 'hsl(var(--warning))', foreground: 'hsl(var(--warning-foreground))' },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}
