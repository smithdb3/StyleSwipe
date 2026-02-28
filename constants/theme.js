/**
 * Shared design tokens for StyleSwipe.
 * Use these for consistent spacing, typography, and color across screens.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const colors = {
  background: '#ffffff',
  surface: '#f8f8f8',
  border: '#e5e5e5',
  borderFocus: '#0a0a0a',
  text: '#0a0a0a',
  textSecondary: '#737373',
  textMuted: '#a3a3a3',
  error: '#b91c1c',
  primary: '#0a0a0a',
  primaryForeground: '#ffffff',
};

export const typography = {
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  caption: {
    fontSize: 14,
    fontWeight: '400',
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    fontSize: 15,
    fontWeight: '500',
  },
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  input: 12,
  button: 12,
};

/** Minimum touch target size (iOS HIG / Material) */
export const minTouchTarget = 44;
