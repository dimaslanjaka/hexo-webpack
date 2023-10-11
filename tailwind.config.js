/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,js,jsx,ts,tsx}',
    './public/**/*.html',
    // tw-elements
    // './node_modules/tw-elements-react/dist/js/**/*.js',
    // flowbite
    './node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {}
  },
  variants: {
    extend: {}
  },
  darkMode: 'class',
  // tw-elements
  // plugins: [require('tw-elements-react/dist/plugin.cjs')]
  // flowbite
  plugins: [require('flowbite/plugin')]
};
