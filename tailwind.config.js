/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}", // make sure your "app" folder is included
    "./components/**/*.{js,ts,jsx,tsx}",
    // ...or wherever else your .tsx files are
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
