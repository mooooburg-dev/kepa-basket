/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      padding: {
        safe: 'env(safe-area-inset-top)',
      },
      margin: {
        safe: 'env(safe-area-inset-top)',
      },
    },
  },
  plugins: [],
};
