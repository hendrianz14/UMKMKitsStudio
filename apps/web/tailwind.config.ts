import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './src/data/**/*.{ts,tsx}',
    './src/styles/**/*.{ts,tsx,css}'
  ],
  darkMode: ['class'],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.25rem',
        md: '1.5rem',
        lg: '2rem',
        xl: '3rem',
        '2xl': '4rem'
      },
      screens: {
        '2xl': '80rem'
      }
    },
    extend: {
      colors: {
        background: {
          DEFAULT: '#0B0F1A',
          light: '#FFFFFF'
        },
        surface: {
          DEFAULT: '#0F172A',
          light: '#F8FAFC'
        },
        secondary: '#1E293B',
        text: {
          DEFAULT: '#E2E8F0',
          dark: '#0F172A'
        },
        primary: {
          DEFAULT: '#3B82F6',
          foreground: '#0B1220'
        },
        accent: {
          blue: '#3B82F6',
          indigo: '#6366F1',
          purple: '#8B5CF6'
        },
        border: '#1E293B',
        muted: {
          DEFAULT: 'rgba(148, 163, 184, 0.35)',
          foreground: 'rgba(226, 232, 240, 0.72)'
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', ...defaultTheme.fontFamily.sans],
        display: ['"Clash Display"', ...defaultTheme.fontFamily.sans]
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '1.75rem'
      },
      boxShadow: {
        glow: '0 30px 120px -40px rgba(59, 130, 246, 0.45)',
        subtle: '0 12px 45px -30px rgba(15, 23, 42, 0.7)'
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #8B5CF6 100%)',
        'radial-hero':
          'radial-gradient(circle at 20% 20%, rgba(59,130,246,0.4), transparent 60%), radial-gradient(circle at 80% 0%, rgba(99,102,241,0.4), transparent 55%)'
      }
    }
  },
  plugins: [require('@tailwindcss/typography')]
};

export default config;
