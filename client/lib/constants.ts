// Design System Constants for Instructor Portal Redesign

export const DESIGN_TOKENS = {
  colors: {
    light: {
      background: '#FFFFFF',
      surface: '#FFFFFF',
      border: '#E5E7EB', // gray-200
      primary: '#2563EB', // blue-600
      primaryHover: '#1D4ED8', // blue-700
      success: '#10B981', // green-500
      warning: '#F59E0B', // amber-500
      error: '#EF4444', // red-500
      textPrimary: '#0F172A', // slate-900
      textSecondary: '#334155', // slate-700
      textTertiary: '#64748B', // slate-500
      hoverBg: '#EFF6FF', // blue-50
    },
    dark: {
      background: '#0F172A', // slate-900
      surface: '#1E293B', // slate-800
      border: '#334155', // slate-700
      primary: '#3B82F6', // blue-500
      primaryHover: '#2563EB', // blue-600
      success: '#10B981', // green-500
      warning: '#F59E0B', // amber-500
      error: '#EF4444', // red-500
      textPrimary: '#F1F5F9', // slate-100
      textSecondary: '#CBD5E1', // slate-300
      textTertiary: '#94A3B8', // slate-400
      hoverBg: '#1E293B', // slate-800
    },
  },
  spacing: {
    sectionGap: '2.5rem', // 40px
    containerPadding: '1.5rem', // 24px
    cardPadding: '1.5rem', // 24px
    elementGap: '1rem', // 16px
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    headingWeight: 700,
    bodyWeight: 400,
    labelWeight: 500,
  },
  borderRadius: {
    default: '0.375rem', // 6px (rounded-md)
    large: '0.5rem', // 8px (rounded-lg)
  },
  shadows: {
    card: '0 1px 3px rgba(0, 0, 0, 0.05)',
    hover: '0 4px 6px rgba(0, 0, 0, 0.07)',
  },
  animations: {
    fadeIn: {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3 },
    },
    hoverLift: {
      scale: 1.02,
      transition: { duration: 0.2 },
    },
  },
} as const;

export const SIDEBAR_WIDTH = 280;
export const MOBILE_BREAKPOINT = 768;

// TypeScript interfaces for design tokens
export type DesignTokens = typeof DESIGN_TOKENS;
export type ColorTheme = keyof typeof DESIGN_TOKENS.colors;
export type ColorKey = keyof typeof DESIGN_TOKENS.colors.light;
