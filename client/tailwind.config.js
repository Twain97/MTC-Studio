/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dawn: {
          50: '#f3f7fa',
          100: '#e5edf3',
          200: '#cbdde8',
          300: '#a7c4d6',
          400: '#7fabc2',
          500: '#628fac',
          600: '#4f748f',
          700: '#425e74',
          800: '#394f61',
          900: '#293946',
          950: '#17232c'
        },
        gold: {
          50: '#fcf9ef',
          100: '#f7efd4',
          200: '#efdda8',
          300: '#e4c574',
          400: '#d9aa4d',
          500: '#c99435',
          600: '#ad742a',
          700: '#8b5625',
          800: '#744724',
          900: '#633c22'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        display: ['Cormorant Garamond', 'Georgia', 'serif']
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(228,197,116,.25), 0 20px 60px rgba(23,35,44,.22)'
      }
    }
  },
  plugins: []
}

