/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        // Core System Colors
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',

        // Primary Brand Colors - Food/Marketing themed (warm orange)
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: 'hsl(24 95% 97%)',
          100: 'hsl(24 95% 92%)',
          200: 'hsl(24 95% 84%)',
          300: 'hsl(24 95% 72%)',
          400: 'hsl(24 95% 60%)',
          500: 'hsl(24 95% 53%)', // Default - Warm orange for food
          600: 'hsl(24 95% 45%)',
          700: 'hsl(24 95% 38%)',
          800: 'hsl(24 95% 32%)',
          900: 'hsl(24 95% 26%)',
        },

        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },

        // Semantic Colors
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
          50: 'hsl(142 76% 95%)',
          100: 'hsl(142 76% 88%)',
          200: 'hsl(142 76% 72%)',
          300: 'hsl(142 76% 54%)',
          400: 'hsl(142 76% 42%)',
          500: 'hsl(142 76% 36%)',
          600: 'hsl(142 76% 30%)',
          700: 'hsl(142 76% 24%)',
          800: 'hsl(142 76% 20%)',
          900: 'hsl(142 76% 16%)',
        },

        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
          50: 'hsl(38 92% 95%)',
          100: 'hsl(38 92% 88%)',
          200: 'hsl(38 92% 75%)',
          300: 'hsl(38 92% 62%)',
          400: 'hsl(38 92% 55%)',
          500: 'hsl(38 92% 50%)',
          600: 'hsl(38 92% 42%)',
          700: 'hsl(38 92% 34%)',
          800: 'hsl(38 92% 28%)',
          900: 'hsl(38 92% 22%)',
        },

        error: {
          DEFAULT: 'hsl(var(--error))',
          foreground: 'hsl(var(--error-foreground))',
          50: 'hsl(0 84% 95%)',
          100: 'hsl(0 84% 90%)',
          200: 'hsl(0 84% 80%)',
          300: 'hsl(0 84% 70%)',
          400: 'hsl(0 84% 65%)',
          500: 'hsl(0 84% 60%)',
          600: 'hsl(0 84% 50%)',
          700: 'hsl(0 84% 40%)',
          800: 'hsl(0 84% 32%)',
          900: 'hsl(0 84% 26%)',
        },

        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },

        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },

        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },

        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },

        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },

        // Sidebar Colors
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar))',
          foreground: 'hsl(var(--sidebar-foreground))',
          border: 'hsl(var(--sidebar-border))'
        },

        // Chart Colors
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        }
      },

      fontSize: {
        'xs': ['0.8125rem', { lineHeight: '1.25' }],
        'sm': ['0.9375rem', { lineHeight: '1.375' }],
        'base': ['1rem', { lineHeight: '1.6' }],
        'lg': ['1.125rem', { lineHeight: '1.75' }],
        'xl': ['1.25rem', { lineHeight: '1.75' }],
        '2xl': ['1.5rem', { lineHeight: '2' }],
        '3xl': ['1.875rem', { lineHeight: '2.25' }],
        '4xl': ['2.25rem', { lineHeight: '2.5' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
      },

      borderRadius: {
        'sm': '0.25rem',
        DEFAULT: '0.5rem',
        'md': '0.75rem',
        'lg': '1rem',
        'xl': '1.5rem',
        '2xl': '2rem',
        'full': '9999px',
      },

      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Consolas',
          'monospace'
        ]
      },

      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' }
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
      },

      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'shimmer': 'shimmer 2s infinite',
      },
    }
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
}
