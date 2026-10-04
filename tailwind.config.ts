import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef8ff',
          100: '#d9efff',
          200: '#bce2ff',
          300: '#8ed0ff',
          400: '#56b3ff',
          500: '#2b92fe',
          600: '#1572f3',
          700: '#0e5adb',
          800: '#124ab2',
          900: '#15418c',
          950: '#112955',
        },
        sidebar: {
          bg: '#0F172A',
          hover: '#1E293B',
          active: '#2563EB',
          text: '#94A3B8',
          textActive: '#FFFFFF',
          border: '#334155',
        }
      },
    },
  },
  plugins: [],
}
export default config
