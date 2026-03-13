/**
 * SDK theme tokens that map to @gundo/ui CSS custom properties.
 * These are used by all SDK components for consistent theming.
 *
 * When @gundo/ui's theme.css is loaded, these resolve to the design system tokens.
 * When not loaded, the fallback values provide a sensible dark theme.
 */
export declare const theme: {
    readonly surface: "var(--ui-surface, #292E37)";
    readonly surfaceRaised: "var(--ui-surface-raised, rgba(255,255,255,0.04))";
    readonly surfaceHover: "var(--ui-surface-hover, rgba(255,255,255,0.07))";
    readonly text: "var(--ui-text, #F2F4F3)";
    readonly textSecondary: "var(--ui-text-secondary, #9ca3af)";
    readonly textMuted: "var(--ui-text-muted, #6b7280)";
    readonly border: "var(--ui-border, rgba(255,255,255,0.1))";
    readonly borderHover: "var(--ui-border-hover, rgba(255,255,255,0.2))";
    readonly primary: "var(--ui-primary, #67C728)";
    readonly primaryHover: "var(--ui-primary-hover, #5ab322)";
    readonly primarySoft: "var(--ui-primary-soft, rgba(103,199,40,0.15))";
    readonly success: "var(--ui-success, #22c55e)";
    readonly error: "var(--ui-error, #ef4444)";
    readonly warning: "var(--ui-warning, #f59e0b)";
    readonly info: "var(--ui-info, #3b82f6)";
    readonly fontFamily: "var(--ui-font-family, 'Montserrat', system-ui, sans-serif)";
    readonly fontMono: "var(--ui-font-mono, 'JetBrains Mono', monospace)";
    readonly radiusSm: "var(--ui-radius-sm, 0.25rem)";
    readonly radiusMd: "var(--ui-radius-md, 0.5rem)";
    readonly radiusLg: "var(--ui-radius-lg, 0.75rem)";
    readonly radiusXl: "var(--ui-radius-xl, 1rem)";
    readonly shadowSm: "var(--ui-shadow-sm, 0 1px 2px rgba(0,0,0,0.3))";
    readonly shadowMd: "var(--ui-shadow-md, 0 4px 6px rgba(0,0,0,0.3))";
    readonly shadowLg: "var(--ui-shadow-lg, 0 10px 15px rgba(0,0,0,0.3))";
    readonly focusRing: "var(--ui-focus-ring, 0 0 0 2px #67C728)";
    readonly zModal: "var(--ui-z-modal, 500)";
    readonly zToast: "var(--ui-z-toast, 600)";
};
//# sourceMappingURL=theme.d.ts.map