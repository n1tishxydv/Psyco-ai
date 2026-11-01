/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Official Psyco AI Navy-Slate Palette
        psyco: {
          deepNavy: '#06141B',
          darkNavy: '#11212D',
          slate: '#253745',
          steel: '#4A5C6A',
          coolGrey: '#9BA8AB',
          softGrey: '#CCD0CF',
        },
        // Harmonized Slate Palette mapped to official tones
        slate: {
          950: '#06141B', // Deep Navy
          900: '#11212D', // Dark Navy
          850: '#1B2C3B',
          800: '#253745', // Slate Elevated
          750: '#384A58',
          700: '#4A5C6A', // Steel Border
          600: '#647784',
          500: '#7F919C',
          400: '#9BA8AB', // Cool Grey Typography
          300: '#B4BFB1',
          200: '#CCD0CF', // Soft Grey Primary
          100: '#E2E6E5',
          50: '#F3F5F5',
        },
        // Core Legacy Aliases re-mapped to official palette
        midnightNavy: '#06141B',
        deepBlueGray: '#11212D',
        elevatedSlate: '#253745',
        borderSteel: '#4A5C6A',
        primaryText: '#CCD0CF',
        secondaryText: '#9BA8AB',
        mutedText: '#9BA8AB',
        softTeal: '#CCD0CF',
        deepJade: '#253745',

        // Controlled Accessible Healthcare Status Semantics
        calmGreen: '#4E9A7E',
        mutedAmber: '#C48B3F',
        mutedCoral: '#B54848',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        'button': '12px',
        'input': '12px',
        'card': '16px',
        'modal': '20px',
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(6, 20, 27, 0.4), 0 1px 2px -1px rgba(6, 20, 27, 0.4)',
        'elevated': '0 4px 6px -1px rgba(6, 20, 27, 0.5), 0 2px 4px -2px rgba(6, 20, 27, 0.5)',
        'modal': '0 20px 25px -5px rgba(6, 20, 27, 0.7), 0 8px 10px -6px rgba(6, 20, 27, 0.7)',
      },
    },
  },
  plugins: [],
}
