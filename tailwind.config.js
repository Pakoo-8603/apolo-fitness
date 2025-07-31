/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'apolo': {
          'primary': '#C47A3B', // Dorado/naranja principal
          'secondary': '#F59E0B', // Dorado más claro
          'dark': '#000000', // Negro principal
          'gray-dark': '#1F2937', // Gris oscuro
          'gray-light': '#9CA3AF', // Gris claro
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        serif: ['Cinzel', 'ui-serif', 'Georgia'],
        garamond: ['"EB Garamond"', 'serif'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

