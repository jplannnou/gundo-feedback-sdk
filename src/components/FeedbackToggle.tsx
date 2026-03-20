import type { CSSProperties } from 'react';
import { theme as t } from '../utils/theme';

interface FeedbackToggleProps {
  /** Whether feedback/review mode is active */
  active: boolean;
  /** Toggle callback */
  onClick: () => void;
  /** Number of pending feedback items */
  pendingCount?: number;
  /** Position on screen */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Custom label */
  label?: string;
}

const POSITIONS: Record<string, CSSProperties> = {
  'bottom-right': { bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))', right: 'max(24px, env(safe-area-inset-right, 0px))' },
  'bottom-left': { bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))', left: 'max(24px, env(safe-area-inset-left, 0px))' },
  'top-right': { top: 'max(24px, env(safe-area-inset-top, 0px))', right: 'max(24px, env(safe-area-inset-right, 0px))' },
  'top-left': { top: 'max(24px, env(safe-area-inset-top, 0px))', left: 'max(24px, env(safe-area-inset-left, 0px))' },
};

export function FeedbackToggle({
  active,
  onClick,
  pendingCount = 0,
  position = 'bottom-right',
  label,
}: FeedbackToggleProps) {
  return (
    <button
      onClick={onClick}
      data-review-mode
      title={active ? 'Salir de modo revisión' : 'Activar modo revisión'}
      style={{
        position: 'fixed',
        ...POSITIONS[position],
        zIndex: 99990,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 20px',
        borderRadius: t.radiusXl,
        border: active ? `2px solid ${t.warning}` : `1px solid ${t.border}`,
        background: active ? 'rgba(234,179,8,0.15)' : t.surface,
        color: active ? t.warning : t.text,
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
        backdropFilter: 'blur(8px)',
        boxShadow: t.shadowLg,
        transition: 'all 0.2s ease',
        fontFamily: t.fontFamily,
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      {label || (active ? 'Salir Revisión' : 'Feedback')}
      {pendingCount > 0 && (
        <span
          style={{
            minWidth: '18px',
            height: '18px',
            borderRadius: '9px',
            background: '#ef4444',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 5px',
          }}
        >
          {pendingCount}
        </span>
      )}
    </button>
  );
}
