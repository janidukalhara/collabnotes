/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ink: {
          50:  '#f7f6f3',
          100: '#eeece6',
          200: '#dbd7cc',
          300: '#c3bdb0',
          400: '#a89e8f',
          500: '#8e8070',
          600: '#756a5c',
          700: '#5c5248',
          800: '#3d3730',
          900: '#221f1a',
          950: '#120f0c',
        },
        amber: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        sage: {
          50:  '#f0f4f1',
          100: '#d9e6db',
          200: '#b4ccb8',
          300: '#87ac8d',
          400: '#5e8f66',
          500: '#3d7145',
          600: '#2e5a35',
          700: '#23452a',
          800: '#172e1c',
          900: '#0d1c11',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.25s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { transform: 'translateY(8px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        slideInRight: { from: { transform: 'translateX(12px)', opacity: 0 }, to: { transform: 'translateX(0)', opacity: 1 } },
      },
      boxShadow: {
        'paper': '0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04)',
        'paper-hover': '0 4px 12px rgba(0,0,0,.1), 0 12px 32px rgba(0,0,0,.06)',
        'panel': '0 0 0 1px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.08)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
