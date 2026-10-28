/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        midnightNavy: '#111B2B',
        deepBlueGray: '#172536',
        elevatedSlate: '#1D3042',
        softTeal: '#79CBB8',
        deepJade: '#2D8276',
        primaryText: '#F4F7F6',
        secondaryText: '#A7B5BE',
        mutedAmber: '#E6B96C',
        calmGreen: '#65B891',
        mutedCoral: '#D87575',
        // Light Theme Semantics
        light: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
          elevated: '#F1F5F9',
          textPrimary: '#0F172A',
          textSecondary: '#475569',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
