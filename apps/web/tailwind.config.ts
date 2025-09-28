import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const withOpacityValue = (variable: `--${string}`) =>
  `hsl(var(${variable}) / <alpha-value>)`;

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
        border: withOpacityValue('--border'),
        input: withOpacityValue('--input'),
        ring: withOpacityValue('--ring'),
        background: withOpacityValue('--background'),
        foreground: withOpacityValue('--foreground'),
        card: {
          DEFAULT: withOpacityValue('--card'),
          foreground: withOpacityValue('--card-foreground')
        },
        popover: {
          DEFAULT: withOpacityValue('--popover'),
          foreground: withOpacityValue('--popover-foreground')
        },
        primary: {
          DEFAULT: withOpacityValue('--primary'),
          foreground: withOpacityValue('--primary-foreground')
        },
        secondary: {
          DEFAULT: withOpacityValue('--secondary'),
          foreground: withOpacityValue('--secondary-foreground')
        },
        muted: {
          DEFAULT: withOpacityValue('--muted'),
          foreground: withOpacityValue('--muted-foreground')
        },
        accent: {
          DEFAULT: withOpacityValue('--accent'),
          foreground: withOpacityValue('--accent-foreground')
        },
        surface: {
          DEFAULT: withOpacityValue('--surface'),
          foreground: withOpacityValue('--surface-foreground')
        },
        destructive: {
          DEFAULT: withOpacityValue('--destructive'),
          foreground: withOpacityValue('--destructive-foreground')
        },
        success: {
          DEFAULT: withOpacityValue('--success'),
          foreground: withOpacityValue('--success-foreground')
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
