const typographyShared = {
  css: {
    // codeblock are handled with highlight.js
    // disable tailwind typography for codeblocks
    pre: false,
    code: false,
    'pre code': false,
    'code::before': false,
    'code::after': false
  }
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,js,jsx,ts,tsx}',
    './public/**/*.html',
    // tw-elements
    // './node_modules/tw-elements-react/dist/js/**/*.js',
    // flowbite
    './node_modules/flowbite/**/*.js',
    './node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      typography: {
        DEFAULT: typographyShared,
        sm: typographyShared,
        md: typographyShared,
        lg: typographyShared,
        xl: typographyShared,
        '2xl': typographyShared
      }
    }
  },
  variants: {
    extend: {}
  },
  darkMode: 'class',
  // tw-elements
  // plugins: [require('tw-elements-react/dist/plugin.cjs')]
  // flowbite
  plugins: [require('@tailwindcss/typography'), require('flowbite/plugin')]
};
