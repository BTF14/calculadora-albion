/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        albion: {
          dark: '#1a140f',
          panel: '#2d221a',
          border: '#5c4433',
          accent: '#d4af37',
          paper: '#e8d4b4',
        },
      },
    },
  },
  plugins: [],
}
