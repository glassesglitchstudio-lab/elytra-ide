/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        app: {
          bg: '#111111',
          sidebar: '#0f0f0f',
          surface: '#161616',
          hover: '#2a2a2a',
          active: '#2a2a2a',
          border: '#1f1f1f',
          inputBorder: '#262626',
          text: '#e5e5e5',
          muted: '#8a8a8a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        btn: '8px',
        input: '14px',
      }
    },
  },
  plugins: [],
}
