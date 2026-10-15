import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#0A0D0C',
        charcoal: '#111614',
        basalt: '#161C19',
        hairline: '#26302B',
        gold: '#D4AF37',
        emerald: '#10B981',
        crimson: '#E11D48',
        ivory: '#F3F4F6',
        sage: '#8E9B94',
      },
      fontFamily: {
        serif: ['Newsreader', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: { DEFAULT: '2px', sm: '1px', md: '2px', lg: '3px' },
    },
  },
  plugins: [],
} satisfies Config;
