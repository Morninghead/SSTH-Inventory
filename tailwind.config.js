/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'okabe-ito': {
          black: '#000000',
          orange: '#E69F00',
          skyBlue: '#56B4E9',
          bluishGreen: '#009E73',
          yellow: '#F0E442',
          blue: '#0072B2',
          vermillion: '#D55E00',
          reddishPurple: '#CC79A7',
        },
      },
    },
  },
  plugins: [],
}
