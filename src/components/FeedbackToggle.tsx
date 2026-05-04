import type { CSSProperties, PointerEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { theme as t } from '../utils/theme';

type Corner = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

interface FeedbackToggleProps {
  /** Whether feedback/review mode is active */
  active: boolean;
  /** Toggle callback */
  onClick: () => void;
  /** Number of pending feedback items */
  pendingCount?: number;
  /** Position on screen (starting corner if draggable) */
  position?: Corner;
  /** Custom label */
  label?: string;
  /** Allow user to drag the toggle between screen corners. Position persists per-storageKey. */
  draggable?: boolean;
  /** localStorage key for persisted corner when draggable */
  storageKey?: string;
  /** Hide label on narrow viewports (<640px) — default true */
  compactOnMobile?: boolean;
}

const POSITIONS: Record<Corner, CSSProperties> = {
  'bottom-right': { bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))', right: 'max(24px, env(safe-area-inset-right, 0px))' },
  'bottom-left': { bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))', left: 'max(24px, env(safe-area-inset-left, 0px))' },
  'top-right': { top: 'max(24px, env(safe-area-inset-top, 0px))', right: 'max(24px, env(safe-area-inset-right, 0px))' },
  'top-left': { top: 'max(24px, env(safe-area-inset-top, 0px))', left: 'max(24px, env(safe-area-inset-left, 0px))' },
};

const DRAG_THRESHOLD_PX = 8;
const MOBILE_BREAKPOINT = 640;

function getStoredCorner(key: string, fallback: Corner): Corner {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw && (POSITIONS as Record<string, unknown>)[raw]) return raw as Corner;
  } catch {
    // ignore storage errors (private mode, etc.)
  }
  return fallback;
}

function snapToCorner(x: number, y: number, width: number, height: number): Corner {
  const horizontal = x < width / 2 ? 'left' : 'right';
  const vertical = y < height / 2 ? 'top' : 'bottom';
  return `${vertical}-${horizontal}` as Corner;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false,
  );
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export function FeedbackToggle({
  active,
  onClick,
  pendingCount = 0,
  position = 'bottom-right',
  label,
  draggable = false,
  storageKey = 'gundo-feedback-toggle-corner',
  compactOnMobile = true,
}: FeedbackToggleProps) {
  const isMobile = useIsMobile();
  const [corner, setCorner] = useState<Corner>(() =>
    draggable ? getStoredCorner(storageKey, position) : position,
  );
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Persist draggable corner changes
  useEffect(() => {
    if (!draggable) return;
    try {
      window.localStorage.setItem(storageKey, corner);
    } catch {
      // ignore
    }
  }, [corner, draggable, storageKey]);

  const showLabel = !(compactOnMobile && isMobile);
  const padding = compactOnMobile && isMobile ? '10px' : '12px 20px';

  // WCAG 2.5.3 (Label in Name): when the button shows visible text, the
  // accessible name MUST include that visible text. Otherwise voice-control
  // users saying the visible word can't activate the control. We use the
  // visible text verbatim when present, and fall back to a descriptive label
  // only when the icon-only compact-mobile mode is active.
  const visibleLabel = label || (active ? 'Salir Revisión' : 'Feedback');
  const accessibleName = showLabel
    ? visibleLabel
    : active ? 'Salir del modo revisión' : 'Activar modo revisión';

  const handlePointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (!draggable) return;
    dragStartRef.current = { x: e.clientX, y: e.clientY, moved: false };
    buttonRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (!draggable || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (!dragStartRef.current.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
    dragStartRef.current.moved = true;
    setDragOffset({ x: dx, y: dy });
  };

  const handlePointerUp = (e: PointerEvent<HTMLButtonElement>) => {
    if (!draggable) {
      // Non-draggable: normal click path
      return;
    }
    buttonRef.current?.releasePointerCapture(e.pointerId);
    const start = dragStartRef.current;
    dragStartRef.current = null;
    if (!start || !start.moved) {
      // treated as click
      setDragOffset(null);
      onClick();
      return;
    }
    // drag ended: snap to closest corner
    const w = window.innerWidth;
    const h = window.innerHeight;
    const newCorner = snapToCorner(e.clientX, e.clientY, w, h);
    setCorner(newCorner);
    setDragOffset(null);
  };

  const handleClick = () => {
    // Only fire from plain click (keyboard / mouse) when NOT draggable.
    // When draggable we fire onClick from pointerup if no drag happened.
    if (draggable) return;
    onClick();
  };

  const baseStyle: CSSProperties = {
    position: 'fixed',
    ...POSITIONS[corner],
    zIndex: 99990,
    display: 'flex',
    alignItems: 'center',
    gap: showLabel ? '8px' : '0',
    padding,
    borderRadius: t.radiusXl,
    border: active ? `2px solid ${t.warning}` : `1px solid ${t.border}`,
    background: active ? 'rgba(234,179,8,0.15)' : t.surface,
    color: active ? t.warning : t.text,
    fontSize: '13px',
    fontWeight: 600,
    cursor: draggable ? (dragOffset ? 'grabbing' : 'grab') : 'pointer',
    backdropFilter: 'blur(8px)',
    boxShadow: t.shadowLg,
    transition: dragOffset ? 'none' : 'all 0.2s ease',
    fontFamily: t.fontFamily,
    touchAction: draggable ? 'none' : 'auto',
  };

  // Apply drag offset via transform while dragging
  if (dragOffset) {
    baseStyle.transform = `translate(${dragOffset.x}px, ${dragOffset.y}px)`;
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => { dragStartRef.current = null; setDragOffset(null); }}
      data-review-mode
      aria-label={accessibleName}
      title={accessibleName}
      style={baseStyle}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      {showLabel && (
        <span>{visibleLabel}</span>
      )}
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
