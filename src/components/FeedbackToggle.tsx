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
  'bottom-right': { bottom: '24px', right: '24px' },
  'bottom-left': { bottom: '24px', left: '24px' },
  'top-right': { top: '24px', right: '24px' },
  'top-left': { top: '24px', left: '24px' },
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
        padding: '10px 18px',
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
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
