/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        'error-container': '#93000a', primary: '#c0c1ff', 'on-primary': '#1000a9',
        'primary-container': '#8083ff', 'surface-container-low': '#131b2e', surface: '#0b1326',
        'tertiary-container': '#d97721', 'on-background': '#dae2fd', 'surface-container': '#171f33',
        secondary: '#4edea3', outline: '#908fa0', 'on-secondary-container': '#00311f',
        error: '#ffb4ab', 'on-error': '#690005', background: '#0b1326', 'on-surface': '#dae2fd',
        'on-surface-variant': '#c7c4d7', 'surface-container-high': '#222a3d',
        'surface-container-highest': '#2d3449', 'surface-container-lowest': '#060e20',
        'surface-variant': '#2d3449', 'outline-variant': '#464554', tertiary: '#ffb783',
        'secondary-container': '#00a572', 'on-secondary': '#003824', 'primary-fixed-dim': '#c0c1ff',
        'primary-fixed': '#e1e0ff', 'on-primary-container': '#0d0096', 'surface-bright': '#31394d',
        'on-error-container': '#ffdad6',
      },
      borderRadius: { DEFAULT: '0.25rem', lg: '0.5rem', xl: '0.75rem', full: '9999px' },
      spacing: {
        margin: '1rem', 'margin-md': '1.5rem', 'margin-lg': '2rem',
        'space-xs': '0.25rem', 'space-sm': '0.5rem', 'space-md': '1rem', 'space-lg': '1.5rem', 'space-xl': '2rem',
        gutter: '1rem', 'gutter-lg': '1.5rem',
      },
      fontFamily: {
        'display-lg': ['Geist Variable', 'sans-serif'], 'headline-xl': ['Geist Variable', 'sans-serif'],
        'headline-md': ['Geist Variable', 'sans-serif'], 'headline-sm': ['Geist Variable', 'sans-serif'],
        'body-lg': ['Geist Variable', 'sans-serif'], 'body-md': ['Geist Variable', 'sans-serif'],
        'body-sm': ['Geist Variable', 'sans-serif'],
        'label-md': ['JetBrains Mono Variable', 'monospace'], 'label-sm': ['JetBrains Mono Variable', 'monospace'],
      },
      fontSize: {
        'display-lg': ['3.5rem', { lineHeight: '4rem', letterSpacing: '-0.03em', fontWeight: '600' }],
        'headline-xl': ['2.25rem', { lineHeight: '2.75rem', letterSpacing: '-0.025em', fontWeight: '600' }],
        'headline-md': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.015em', fontWeight: '500' }],
        'headline-sm': ['1.125rem', { lineHeight: '1.5rem', letterSpacing: '-0.01em', fontWeight: '500' }],
        'body-lg': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],
        'body-md': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],
        'body-sm': ['0.75rem', { lineHeight: '1rem', fontWeight: '400' }],
        'label-md': ['0.8125rem', { lineHeight: '1rem', letterSpacing: '0.02em', fontWeight: '500' }],
        'label-sm': ['0.6875rem', { lineHeight: '0.875rem', letterSpacing: '0.04em', fontWeight: '500' }],
      },
    },
  },
}
