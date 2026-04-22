import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Cormorant Garamond'", 'Georgia', 'serif'],
        body:    ["'DM Sans'", 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft:   '0 1px 3px rgba(0,0,0,0.04),0 1px 2px -1px rgba(0,0,0,0.04)',
        medium: '0 4px 12px -2px rgba(0,0,0,0.08),0 2px 4px -2px rgba(0,0,0,0.04)',
        rose:   '0 4px 14px -2px rgba(244,63,94,0.3)',
      },
      keyframes: {
        shimmer:  { '0%':   { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition:  '200% 0' } },
        fadeIn:   { from:   { opacity:'0', transform:'translateY(8px)' }, to: { opacity:'1', transform:'translateY(0)' } },
        slideUp:  { from:   { opacity:'0', transform:'translateY(20px) scale(0.98)' }, to: { opacity:'1', transform:'translateY(0) scale(1)' } },
        slideRight: { from: { opacity:'0', transform:'translateX(16px)' }, to: { opacity:'1', transform:'translateX(0)' } },
      },
      animation: {
        shimmer:    'shimmer 1.8s infinite',
        fadeIn:     'fadeIn 0.2s ease-out',
        slideUp:    'slideUp 0.25s cubic-bezier(0.32,0.72,0,1)',
        slideRight: 'slideRight 0.25s ease',
      },
    },
  },
  plugins: [],
}
export default config
