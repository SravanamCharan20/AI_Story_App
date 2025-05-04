/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4C6FFF',
        secondary: '#F1F3F5',
        text: {
          primary: '#1A1A1A',
          secondary: '#495057',
          light: '#868E96'
        },
        background: {
          primary: '#FFFFFF',
          secondary: '#F8F9FA'
        }
      },
      fontFamily: {
        sans: ['System', 'sans-serif']
      }
    },
  },
  plugins: [],
};
