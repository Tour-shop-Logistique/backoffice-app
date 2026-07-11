/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        accent: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764',
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        sans: ['Geist Variable', 'system-ui', '-apple-system', 'sans-serif'],
      },
      // Échelle de police relevée globalement (~+15-20% par palier) : toute
      // l'app utilise text-xs/sm/base/... partout, donc plutôt que de corriger
      // fichier par fichier, on agrandit la source une fois pour toutes.
      fontSize: {
        'xs': ['0.875rem', { lineHeight: '1.25rem' }],   // 14px (était 12px)
        'sm': ['1rem', { lineHeight: '1.5rem' }],        // 16px (était 14px)
        'base': ['1.125rem', { lineHeight: '1.75rem' }], // 18px (était 16px)
        'lg': ['1.25rem', { lineHeight: '1.875rem' }],   // 20px (était 18px)
        'xl': ['1.375rem', { lineHeight: '2rem' }],      // 22px (était 20px)
        '2xl': ['1.625rem', { lineHeight: '2.125rem' }], // 26px (était 24px)
        '3xl': ['2rem', { lineHeight: '2.375rem' }],     // 32px (était 30px)
        '4xl': ['2.375rem', { lineHeight: '2.625rem' }], // 38px (était 36px)
        '5xl': ['3.25rem', { lineHeight: '1' }],         // 52px (était 48px)
      },
      spacing: {
        'sidebar': '18rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
