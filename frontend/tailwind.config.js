/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        mars: {
          darkest: '#07080b',
          dark: '#0c0e14',
          surface: '#131620',
          panel: '#181c28',
          border: '#232838',
          muted: '#64748b',
          text: '#e2e8f0',
          orange: '#ea580c',
          rust: '#c2410c',
          red: '#dc2626',
        },
        verdict: {
          go: '#22c55e',       // Green
          caution: '#f59e0b',  // Amber
          nogo: '#ef4444',     // Red
          unknown: '#94a3b8',  // Slate/Grey
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
      }
    },
  },
  plugins: [],
}
