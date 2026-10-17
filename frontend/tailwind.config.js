/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // STILLGOOD 3.0 Hospitality Palette
        vanilla: '#FFF9F2',
        espresso: '#452C29',
        cocoa: '#30211E',
        saffron: '#E8A44E',
        oat: '#F4E8DA',
        subtle: '#E8DBCF',
        sage: {
          DEFAULT: '#58775A',
          light: '#EAF2EA',
          dark: '#3F5841',
        },
        terracotta: {
          DEFAULT: '#B95438',
          hover: '#9E442D',
          light: '#F8EBE7',
          dark: '#853420',
          bg: '#FAF0EB',
        },
        // Backwards-compatible aliases
        forest: {
          900: '#30211E', // Deep cocoa
          800: '#452C29', // Espresso brown
          700: '#58775A', // Sage
          600: '#58775A',
          500: '#E8A44E', // Saffron
          100: '#EAF2EA',
          50: '#F4E8DA',
        },
        ivory: {
          DEFAULT: '#FFF9F2', // Vanilla cream
          cream: '#F4E8DA',   // Oat cream
          darker: '#E8DBCF',  // Subtle border
        },
        ink: {
          DEFAULT: '#452C29', // Espresso brown
          muted: '#7B6764',   // Warm muted
          subtle: '#A89996',
          border: '#E8DBCF',  // Subtle border
        }
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"DM Sans"', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
