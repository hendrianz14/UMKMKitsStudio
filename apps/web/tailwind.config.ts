import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './data/**/*.{ts,tsx}',
    './styles/**/*.{ts,tsx,css}'
  ],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        sand: '#F5E9DA',
        cacao: '#5C3A21',
        charcoal: '#2F2A28',
        accent: '#C99A5A'
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', ...defaultTheme.fontFamily.sans],
        display: ['"Playfair Display"', ...defaultTheme.fontFamily.serif]
      },
      boxShadow: {
        soft: '0 20px 60px -30px rgba(44, 35, 28, 0.6)'
      }
    }
  },
  plugins: [require('@tailwindcss/typography')]
};

export default config;
