import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--color-ink)',
        muted: 'var(--color-muted)',
        paper: 'var(--color-paper)',
        canvas: 'var(--color-canvas)',
        brand: 'var(--color-brand)',
        'brand-dark': 'var(--color-brand-dark)',
        accent: 'var(--color-accent)',
        line: 'var(--color-line)',
        success: 'var(--color-success)',
        danger: 'var(--color-danger)',
      },
      borderRadius: {
        card: '14px',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
      },
    },
  },
  plugins: [],
};

export default config;
