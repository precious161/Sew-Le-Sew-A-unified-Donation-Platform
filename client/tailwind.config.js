/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // ADD THIS LINE
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'medical-red': '#C70417',
        accent: "#aa3bff",
      },
      screens: {
        'desktop': '1100px',
      }
    },
  },
  plugins: [],
}