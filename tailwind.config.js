// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
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
        }, // <--- Revisa que esta coma esté aquí
      },
    },
  },
  plugins: [],
}
