import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        body:    ['var(--font-sans)', 'system-ui', 'sans-serif'],
        sans:    ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        sakura: { 50:'#fff1f5',100:'#ffe4ed',200:'#ffc9db',300:'#ff9bb8',400:'#ff6b96',500:'#ff3d78',600:'#f01460',700:'#c8004e',800:'#a60040',900:'#8c013a' },
        gold:   { 50:'#fffbeb',100:'#fef3c7',200:'#fde68a',300:'#fcd34d',400:'#fbbf24',500:'#f59e0b',600:'#d97706',700:'#b45309',800:'#be185d',900:'#9d174d' },
        jade:   { 50:'#ecfdf5',100:'#d1fae5',200:'#a7f3d0',300:'#6ee7b7',400:'#34d399',500:'#10b981',600:'#059669',700:'#047857',800:'#065f46',900:'#064e3b' },
        ink:    { 50:'#f7f6f9',100:'#efedf3',200:'#e2dfe8',300:'#c9c4d3',400:'#9a93a8',500:'#746d83',600:'#5a5368',700:'#463f53',800:'#2f2a3a',900:'#1c1825',950:'#110e17' },
      },
      boxShadow: {
        'glow-sakura': '0 0 20px rgba(255,61,120,0.15), 0 4px 16px rgba(255,61,120,0.12)',
        'glow-gold':   '0 0 20px rgba(245,158,11,0.15), 0 4px 16px rgba(245,158,11,0.12)',
        'card':        '0 1px 2px rgba(28,24,37,0.04), 0 8px 24px -12px rgba(28,24,37,0.14)',
        'card-hover':  '0 2px 4px rgba(28,24,37,0.04), 0 20px 44px -18px rgba(28,24,37,0.26)',
        'modal':       '0 24px 64px rgba(28,24,37,0.20), 0 8px 24px rgba(28,24,37,0.12)',
        'inner':       'inset 0 1px 3px rgba(28,24,37,0.08)',
      },
      backgroundImage: {
        'hero':       'linear-gradient(135deg, #110e17 0%, #1c1825 30%, #3b1d4a 60%, #9d174d 100%)',
        'card-warm':  'linear-gradient(135deg, #ffffff 0%, #fbfafd 100%)',
        'progress':   'linear-gradient(90deg, #ff3d78 0%, #f59e0b 100%)',
        'progress-danger': 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
        'sakura-gradient': 'linear-gradient(135deg, #ff6b96 0%, #ff3d78 50%, #f59e0b 100%)',
      },
      animation: {
        'shimmer':   'shimmer 2s infinite',
        'fadeUp':    'fadeUp .3s cubic-bezier(.16,1,.3,1)',
        'slideIn':   'slideIn .35s cubic-bezier(.16,1,.3,1)',
        'popIn':     'popIn .2s cubic-bezier(.34,1.56,.64,1)',
        'pulse-glow':'pulseGlow 2s ease-in-out infinite',
        'float':     'float 4s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'count-up':  'fadeUp .4s ease-out forwards',
      },
      keyframes: {
        shimmer:   { '0%':{backgroundPosition:'-200% 0'},'100%':{backgroundPosition:'200% 0'} },
        fadeUp:    { from:{opacity:'0',transform:'translateY(12px)'},to:{opacity:'1',transform:'translateY(0)'} },
        slideIn:   { from:{opacity:'0',transform:'translateY(24px) scale(.97)'},to:{opacity:'1',transform:'translateY(0) scale(1)'} },
        popIn:     { from:{opacity:'0',transform:'scale(.9)'},to:{opacity:'1',transform:'scale(1)'} },
        pulseGlow: { '0%,100%':{boxShadow:'0 0 8px rgba(255,61,120,0.2)'},'50%':{boxShadow:'0 0 20px rgba(255,61,120,0.4)'} },
        float:     { '0%,100%':{transform:'translateY(0)'},'50%':{transform:'translateY(-6px)'} },
      },
    },
  },
  plugins: [],
}
export default config
