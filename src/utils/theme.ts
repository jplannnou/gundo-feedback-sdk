/**
 * SDK theme tokens that map to @gundo/ui CSS custom properties.
 * These are used by all SDK components for consistent theming.
 *
 * When @gundo/ui's theme.css is loaded, these resolve to the design system tokens.
 * When not loaded, the fallback values provide a sensible dark theme.
 */
export const theme = {
  // Surfaces
  surface: 'var(--ui-surface, #292E37)',
  surfaceRaised: 'var(--ui-surface-raised, rgba(255,255,255,0.04))',
  surfaceHover: 'var(--ui-surface-hover, rgba(255,255,255,0.07))',

  // Text
  text: 'var(--ui-text, #F2F4F3)',
  textSecondary: 'var(--ui-text-secondary, #9ca3af)',
  textMuted: 'var(--ui-text-muted, #6b7280)',

  // Borders
  border: 'var(--ui-border, rgba(255,255,255,0.1))',
  borderHover: 'var(--ui-border-hover, rgba(255,255,255,0.2))',

  // Primary
  primary: 'var(--ui-primary, #67C728)',
  primaryHover: 'var(--ui-primary-hover, #5ab322)',
  primarySoft: 'var(--ui-primary-soft, rgba(103,199,40,0.15))',

  // Semantic
  success: 'var(--ui-success, #22c55e)',
  error: 'var(--ui-error, #ef4444)',
  warning: 'var(--ui-warning, #f59e0b)',
  info: 'var(--ui-info, #3b82f6)',

  // Typography
  fontFamily: "var(--ui-font-family, 'Montserrat', system-ui, sans-serif)",
  fontMono: "var(--ui-font-mono, 'JetBrains Mono', monospace)",

  // Radius
  radiusSm: 'var(--ui-radius-sm, 0.25rem)',
  radiusMd: 'var(--ui-radius-md, 0.5rem)',
  radiusLg: 'var(--ui-radius-lg, 0.75rem)',
  radiusXl: 'var(--ui-radius-xl, 1rem)',

  // Shadows
  shadowSm: 'var(--ui-shadow-sm, 0 1px 2px rgba(0,0,0,0.3))',
  shadowMd: 'var(--ui-shadow-md, 0 4px 6px rgba(0,0,0,0.3))',
  shadowLg: 'var(--ui-shadow-lg, 0 10px 15px rgba(0,0,0,0.3))',

  // Focus
  focusRing: 'var(--ui-focus-ring, 0 0 0 2px #67C728)',

  // Z-index
  zModal: 'var(--ui-z-modal, 500)',
  zToast: 'var(--ui-z-toast, 600)',
} as const;
