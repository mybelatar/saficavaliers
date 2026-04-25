import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          950: '#0f172a',
          900: '#111827'
        }
      }
    }
  },
  plugins: []
};

export default config;
