/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Deep aviation-inspired palette
        'midnight-navy': '#0D0F0E',
        'obsidian': '#151817',
        'atmospheric-blue': '#D68A3A',
        'electric-cyan': '#4FA89A',
        'soft-white': '#F3EFE5',
        'muted-silver': '#B7B5AC',

        // Semantic colors (use sparingly)
        'success': '#5FAF82',
        'warning': '#D6A14A',
        'danger': '#C96B5B',
        'info': '#9BA7A0',

        // Legacy compatibility (deprecated, will remove gradually)
        'background': '#0D0F0E',
        'card': '#1C211F',
        'surface': '#242621',
        'border': '#3A3B35',
        'accent': '#D68A3A',
        'blue': '#D68A3A',
        'muted': '#7F817B',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      backdropBlur: {
        'glass': '12px',
        'glass-heavy': '24px',
      },
      animation: {
        'float-slow': 'float 20s ease-in-out infinite',
        'float-medium': 'float 15s ease-in-out infinite',
        'float-fast': 'float 10s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
        'glow-cyan': 'glow-cyan 4s ease-in-out infinite',
        'glow-blue': 'glow-blue 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'glow-cyan': {
          '0%, 100%': {
            'box-shadow': '0 0 20px rgba(79, 168, 154, 0.2)',
            'text-shadow': '0 0 10px rgba(79, 168, 154, 0.35)'
          },
          '50%': {
            'box-shadow': '0 0 40px rgba(79, 168, 154, 0.35)',
            'text-shadow': '0 0 20px rgba(79, 168, 154, 0.5)'
          },
        },
        'glow-blue': {
          '0%, 100%': {
            'box-shadow': '0 0 20px rgba(214, 138, 58, 0.2)',
            'text-shadow': '0 0 10px rgba(214, 138, 58, 0.35)'
          },
          '50%': {
            'box-shadow': '0 0 40px rgba(214, 138, 58, 0.35)',
            'text-shadow': '0 0 20px rgba(214, 138, 58, 0.5)'
          },
        },
      },
    },
  },
  plugins: [],
}
