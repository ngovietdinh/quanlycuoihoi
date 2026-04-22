import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Cormorant Garamond'", 'Georgia', 'serif'],
        body:    ["'DM Sans'", 'system-ui', 'sans-serif'],
        mono:    ["'JetBrains Mono'", 'monospace'],
      },
      colors: {
        sakura: { 50:'#fff1f5',100:'#ffe4ed',200:'#ffc9db',300:'#ff9bb8',400:'#ff6b96',500:'#ff3d78',600:'#f01460',700:'#c8004e',800:'#a60040',900:'#8c013a' },
        gold:   { 50:'#fffbeb',100:'#fef3c7',200:'#fde68a',300:'#fcd34d',400:'#fbbf24',500:'#f59e0b',600:'#d97706',700:'#b45309',800:'#92400e',900:'#78350f' },
        jade:   { 50:'#ecfdf5',100:'#d1fae5',200:'#a7f3d0',300:'#6ee7b7',400:'#34d399',500:'#10b981',600:'#059669',700:'#047857',800:'#065f46',900:'#064e3b' },
        ink:    { 50:'#f8f7f4',100:'#f0ede6',200:'#e0d9cc',300:'#c9bfaa',400:'#b0a286',500:'#957f63',600:'#7a6450',700:'#635042',800:'#503f36',900:'#2c1810',950:'#1a0d08' },
      },
      boxShadow: {
        'glow-sakura': '0 0 20px rgba(255,61,120,0.15), 0 4px 16px rgba(255,61,120,0.12)',
        'glow-gold':   '0 0 20px rgba(245,158,11,0.15), 0 4px 16px rgba(245,158,11,0.12)',
        'card':        '0 1px 3px rgba(44,24,16,0.04), 0 4px 12px rgba(44,24,16,0.06)',
        'card-hover':  '0 4px 20px rgba(44,24,16,0.10), 0 8px 32px rgba(44,24,16,0.06)',
        'modal':       '0 24px 64px rgba(44,24,16,0.20), 0 8px 24px rgba(44,24,16,0.12)',
        'inner':       'inset 0 1px 3px rgba(44,24,16,0.08)',
      },
      backgroundImage: {
        'hero':       'linear-gradient(135deg, #1a0d08 0%, #2c1810 30%, #4a2520 60%, #78350f 100%)',
        'card-warm':  'linear-gradient(135deg, #fffbf7 0%, #fff7f0 100%)',
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
