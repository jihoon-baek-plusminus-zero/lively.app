import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: '#0064FF',
          50: '#E6F0FF',
          100: '#CCE1FF',
          200: '#99C3FF',
          300: '#66A5FF',
          400: '#3387FF',
          500: '#0064FF',
          600: '#0050CC',
          700: '#003C99',
          800: '#002866',
          900: '#001433',
        },
        destructive: {
          DEFAULT: '#FF1E00',
          50: '#FFE8E5',
          100: '#FFD1CC',
          200: '#FFA399',
          300: '#FF7566',
          400: '#FF4733',
          500: '#FF1E00',
          600: '#CC1800',
          700: '#991200',
          800: '#660C00',
          900: '#330600',
        },
      },
    },
  },
  plugins: [],
}
export default config
