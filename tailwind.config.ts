import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red:     '#ff0618',
          dark:    '#121212',
          surface: '#161616',
          card:    '#171717',
          border:  '#222222',
          muted:   '#888888',
          text:    '#dddddd',
        },
        red: {
          50:  '#ff0618',
          100: '#ff0618',
          200: '#ff0618',
          300: '#ff0618',
          400: '#ff0618',
          500: '#ff0618',
          600: '#ff0618',
          700: '#ff0618',
          800: '#ff0618',
          900: '#ff0618',
          950: '#ff0618',
        },
      },
      fontFamily: {
        sans: ['var(--font-poppins)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
