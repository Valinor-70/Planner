/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      maxWidth: {
        'content': '840px',
      },
      transitionDuration: {
        'calm': '160ms',
      },
      colors: {
        'calm-bg': '#fafafa',
        'calm-text': '#1a1a1a',
        'calm-border': '#e0e0e0',
        'calm-accent': '#6366f1',
        'calm-danger': '#ef4444',
        'calm-success': '#10b981',
      }
    },
  },
  plugins: [],
}
