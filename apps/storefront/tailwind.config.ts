import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#0D5550', container: '#1A7A73' },
        accent: { DEFAULT: '#F56024', hover: '#D94F1A' },
        tertiary: '#006674',
        surface: {
          DEFAULT: '#F3EFE5',
          'container-lowest': '#FAF8F3',
          'container-low': '#EFEADE',
          'container': '#E8E3D6',
          'container-high': '#E0DACB',
          'container-highest': '#D8D1C1',
        },
        'on-surface': { DEFAULT: '#1a1c1c', variant: '#404943' },
        'on-primary': '#ffffff',
        'outline-variant': 'rgba(26, 28, 28, 0.12)',
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        ambient: '0px 8px 24px rgba(13, 85, 80, 0.06)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
} satisfies Config
