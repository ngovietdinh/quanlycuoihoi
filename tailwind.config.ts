import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'Cormorant Garamond', 'Georgia', 'serif'],
        body:    ['var(--font-body)',    'DM Sans',            'system-ui', 'sans-serif'],
      },
      colors: {
        rose: {
          50:  '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af',
          400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c',
          800: '#9f1239', 900: '#881337', 950: '#4c0519',
        },
      },
      boxShadow: {
        'soft':   '0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'medium': '0 4px 12px -2px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.04)',
        'large':  '0 20px 40px -8px rgba(0,0,0,0.12), 0 8px 16px -4px rgba(0,0,0,0.06)',
        'rose':   '0 4px 14px -2px rgba(244,63,94,0.25)',
        'amber':  '0 4px 14px -2px rgba(245,158,11,0.25)',
        'inner-soft': 'inset 0 1px 3px 0 rgba(0,0,0,0.06)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'shimmer':       'shimmer 1.8s infinite',
        'fade-in':       'fadeIn 0.2s ease-out',
        'slide-up':      'slideUp 0.25s cubic-bezier(0.32,0.72,0,1)',
        'slide-in-right':'slideInRight 0.25s ease',
        'bounce-soft':   'bounceSoft 0.4s ease',
        'spin-slow':     'spin 2s linear infinite',
      },
      keyframes: {
        shimmer:      { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        fadeIn:       { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:      { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideInRight: { from: { opacity: '0', transform: 'translateX(16px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        bounceSoft:   { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.04)' } },
      },
    },
  },
  plugins: [],
}
export default config
