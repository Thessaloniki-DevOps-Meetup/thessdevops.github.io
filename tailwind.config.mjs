/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: '#2d4a5e',
        accent: '#e07a5f',
        cream: '#f5f0e8',
        'blue-gray': '#d5dfe5',
      },
      fontFamily: {
        sans: ['"Trebuchet MS"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
};
