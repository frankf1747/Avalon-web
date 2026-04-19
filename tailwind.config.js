/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        night: '#05040b',
        parchment: '#f0e2b5',
        ink: '#f0e2b5',
        inkMuted: '#9a8c66',
        gold: '#c9a84c',
        goldBright: '#f5d97a',
        evilRed: '#b83020',
        goodGreen: '#5ba06a',
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        display: ['"Ma Shan Zheng"', '"Noto Serif SC"', 'serif'],
      },
      boxShadow: {
        gold: '0 0 16px rgba(201,168,76,0.35)',
        card: '0 10px 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(245,217,122,0.15)',
      },
      keyframes: {
        flicker: {
          '0%,100%': { opacity: 1, transform: 'translateY(0) scaleY(1)' },
          '25%': { opacity: 0.85, transform: 'translateY(-1px) scaleY(1.05)' },
          '50%': { opacity: 0.95, transform: 'translateY(1px) scaleY(0.95)' },
          '75%': { opacity: 0.9, transform: 'translateY(0) scaleY(1.02)' },
        },
        fadeUp: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
      animation: {
        flicker: 'flicker 2.5s infinite alternate',
        fadeUp: 'fadeUp 0.5s ease',
      },
    },
  },
  plugins: [],
}
