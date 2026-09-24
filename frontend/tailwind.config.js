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
        'midnight-navy': '#0a1a3a',
        'obsidian': '#121a2d',
        'atmospheric-blue': '#1e3a8a',
        'electric-cyan': '#06b6d4',
        'soft-white': '#f8fafc',
        'muted-silver': '#94a3b8',

        // Semantic colors (use sparingly)
        'success': '#10b981',
        'warning': '#f59e0b',
        'danger': '#ef4444',

        // Legacy compatibility (deprecated, will remove gradually)
        'background': '#0a1a3a',
        'card': '#121a2d',
        'surface': '#0d1529',
        'border': '#1e293b',
        'accent': '#06b6d4',
        'blue': '#1e3a8a',
        'muted': '#94a3b8',
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
            'box-shadow': '0 0 20px rgba(6, 182, 212, 0.3)',
            'text-shadow': '0 0 10px rgba(6, 182, 212, 0.5)'
          },
          '50%': {
            'box-shadow': '0 0 40px rgba(6, 182, 212, 0.6)',
            'text-shadow': '0 0 20px rgba(6, 182, 212, 0.8)'
          },
        },
        'glow-blue': {
          '0%, 100%': {
            'box-shadow': '0 0 20px rgba(30, 58, 138, 0.3)',
            'text-shadow': '0 0 10px rgba(30, 58, 138, 0.5)'
          },
          '50%': {
            'box-shadow': '0 0 40px rgba(30, 58, 138, 0.6)',
            'text-shadow': '0 0 20px rgba(30, 58, 138, 0.8)'
          },
        },
      },
    },
  },
  plugins: [],
}
