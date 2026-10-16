/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          900: '#102F29',
          800: '#153D34', // Primary dark green
          700: '#1E4E43',
          600: '#23785D', // Emerald accent
          500: '#2E9374',
          100: '#D7EBE4',
          50: '#EAF2EA',  // Soft sage background
        },
        ivory: {
          DEFAULT: '#F8F7F2', // Warm ivory background
          cream: '#F1EEE7',   // Subtle cream
          darker: '#E7E2D6',
        },
        terracotta: {
          DEFAULT: '#C57B55', // Terracotta accent (attention/changes)
          light: '#DE9976',
          dark: '#A65F3A',
          bg: '#FAF0EB',
        },
        ink: {
          DEFAULT: '#1E2925', // Dark text
          muted: '#66736B',   // Muted text
          subtle: '#8C9A92',
          border: '#D8D4C8',
        }
      },
      fontFamily: {
        serif: ['Fraunces', 'Newsreader', 'Georgia', 'serif'],
        sans: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
