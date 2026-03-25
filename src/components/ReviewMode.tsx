import { useState, useEffect, useCallback, useRef, useMemo, type CSSProperties } from 'react';
import { useFeedbackContext } from '../FeedbackProvider';
import type { FeedbackPriority, FeedbackType } from '../types';
import { captureElementScreenshot } from '../utils/screenshot-capture';
import { theme as t } from '../utils/theme';
// NOTE: SDK uses inline styles instead of @gundo/ui components to avoid
// dependency on consumer's Tailwind CSS generating the required utility classes.

interface ReviewModeProps {
  /** Whether review mode is active */
  active: boolean;
  /** Called when user deactivates review mode */
  onDeactivate?: () => void;
  /** Override for section detection */
  currentSection?: string;
  /** Available feedback types (defaults to bug/improvement/feature) */
  types?: FeedbackType[];
  /** Container element selector for screenshot capture (defaults to 'main') */
  captureSelector?: string;
}

const DEFAULT_TYPES: FeedbackType[] = ['bug', 'improvement', 'feature'];

const PRIORITY_COLORS: Record<FeedbackPriority, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

const TYPE_LABELS: Record<string, string> = {
  bug: 'Bug',
  improvement: 'Mejora',
  feature: 'Feature',
  general: 'General',
};

export function ReviewMode({
  active,
  onDeactivate,
  currentSection = 'general',
  types = DEFAULT_TYPES,
  captureSelector = 'main',
}: ReviewModeProps) {
  const { config, client, user, contextCollector } = useFeedbackContext();

  const [, setHoveredEl] = useState<HTMLElement | null>(null);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [screenshotBlob, setScreenshotBlob] = useState<Blob | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotFailed, setScreenshotFailed] = useState(false);

  const [description, setDescription] = useState('');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>(types[0]);
  const [priority, setPriority] = useState<FeedbackPriority>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [detectedSection, setDetectedSection] = useState(currentSection);

  const formRef = useRef<HTMLDivElement>(null);
  const pointerDownTargetRef = useRef<HTMLElement | null>(null);

  function detectSection(): string {
    // 1. Try h1 heading on the page
    const h1 = document.querySelector('h1');
    if (h1?.textContent?.trim()) return h1.textContent.trim();
    // 2. Try meaningful route segment
    const path = window.location.pathname;
    if (path && path !== '/') {
      const segment = path.split('/').filter(Boolean).pop();
      if (segment) return segment.replace(/-/g, ' ');
    }
    // 3. Fallback to prop
    return currentSection;
  }

  // Detect touch device once
  const isTouchDevice = useMemo(
    () => typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0),
    [],
  );

  // ── Element highlighting on pointer move (desktop hover) ──
  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!active || showForm) return;
      // Only highlight on mouse hover, not touch drag
      if (e.pointerType === 'touch') return;
      const target = e.target as HTMLElement;
      if (target.closest('[data-review-mode]')) return;
      setHoveredEl(target);
      setHighlightRect(target.getBoundingClientRect());
    },
    [active, showForm],
  );

  // ── Pointer down: highlight element (works for both mouse and touch) ──
  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      if (!active || showForm) return;
      const target = e.target as HTMLElement;
      if (target.closest('[data-review-mode]')) return;
      // On touch: show highlight on tap-down (replaces hover)
      if (e.pointerType === 'touch') {
        setHoveredEl(target);
        setHighlightRect(target.getBoundingClientRect());
      }
      pointerDownTargetRef.current = target;
    },
    [active, showForm],
  );

  // ── Pointer up: confirm selection and open form ──
  const handlePointerUp = useCallback(
    async (e: PointerEvent) => {
      if (!active || showForm) return;
      const target = e.target as HTMLElement;
      if (target.closest('[data-review-mode]')) return;

      // Only capture if pointer up is on the same element as pointer down
      if (pointerDownTargetRef.current && pointerDownTargetRef.current !== target) {
        pointerDownTargetRef.current = null;
        setHighlightRect(null);
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      setHighlightRect(null);
      setDetectedSection(detectSection());
      setScreenshotFailed(false);

      // Capture screenshot BEFORE showing form to avoid layout interference
      try {
        const captureEl = document.querySelector(captureSelector) as HTMLElement;
        if (captureEl) {
          const blob = await captureElementScreenshot(captureEl);
          setScreenshotBlob(blob);
          const url = URL.createObjectURL(blob);
          setScreenshotPreview(url);
        } else {
          setScreenshotFailed(true);
        }
      } catch {
        setScreenshotFailed(true);
      }

      setShowForm(true);
    },
    [active, showForm, captureSelector],
  );

  // ── Keyboard: Escape to close ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showForm) {
          resetForm();
        } else if (active) {
          onDeactivate?.();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [active, showForm, onDeactivate]);

  // ── Pointer listeners (unified mouse + touch + pen) ──
  useEffect(() => {
    if (!active) return;
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('pointerup', handlePointerUp, true);
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('pointerup', handlePointerUp, true);
    };
  }, [active, handlePointerMove, handlePointerDown, handlePointerUp]);

  function resetForm() {
    setShowForm(false);
    setDescription('');
    setFeedbackType(types[0]);
    setPriority('medium');
    setScreenshotBlob(null);
    setScreenshotFailed(false);
    if (screenshotPreview) {
      URL.revokeObjectURL(screenshotPreview);
      setScreenshotPreview(null);
    }
  }

  async function handleSubmit() {
    if (!description.trim() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      let screenshotUrl: string | undefined;
      if (screenshotBlob) {
        try {
          const result = await client.uploadScreenshot(screenshotBlob);
          if (result?.url) {
            screenshotUrl = result.url;
          } else {
            console.warn('[feedback-sdk] Screenshot upload returned no URL');
            setScreenshotFailed(true);
          }
        } catch (err) {
          console.warn('[feedback-sdk] Screenshot upload failed:', err);
          setScreenshotFailed(true);
        }
      }

      const collectedCtx = contextCollector.collect();

      // Auto-generate title from first line of description (max 80 chars)
      const firstLine = description.trim().split('\n')[0];
      const title = firstLine.length > 80 ? `${firstLine.slice(0, 77)}...` : firstLine;

      await client.submitFeedback({
        project: config.project,
        items: [
          {
            comment: description.trim(),
            title,
            feedbackType,
            priority,
            module: detectedSection,
            sectionHeading: detectedSection,
            screenshotUrl,
            reportedBy: user?.email,
            reportedByName: user?.name,
            context: {
              ...collectedCtx,
              section: detectedSection,
            },
          },
        ],
      });

      setToast({ type: 'success', message: 'Feedback enviado correctamente' });
      resetForm();
    } catch {
      setToast({ type: 'error', message: 'Error al enviar feedback' });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  if (!active) return null;

  const highlightStyle: CSSProperties | undefined = highlightRect && !showForm
    ? {
        position: 'fixed',
        top: highlightRect.top - 2,
        left: highlightRect.left - 2,
        width: highlightRect.width + 4,
        height: highlightRect.height + 4,
        border: '2px solid #3b82f6',
        borderRadius: '4px',
        pointerEvents: 'none',
        zIndex: 99998,
        transition: 'all 0.1s ease-out',
      }
    : undefined;

  return (
    <>
      {/* Highlight overlay */}
      {highlightStyle && <div data-review-mode style={highlightStyle} />}

      {/* Form panel */}
      {showForm && (
        <div
          data-review-mode
          ref={formRef}
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: 'min(380px, 100vw)',
            height: '100dvh',
            background: t.surface,
            borderLeft: `1px solid ${t.border}`,
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            color: t.text,
            fontFamily: t.fontFamily,
            fontSize: '16px',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            // Inject CSS custom properties so @gundo/ui components resolve tokens correctly
            '--ui-surface': '#292E37',
            '--ui-surface-hover': 'rgba(255,255,255,0.07)',
            '--ui-text': '#F2F4F3',
            '--ui-text-secondary': '#9ca3af',
            '--ui-text-muted': '#6b7280',
            '--ui-border': 'rgba(255,255,255,0.1)',
            '--ui-border-hover': 'rgba(255,255,255,0.2)',
            '--ui-primary': '#67C728',
            '--ui-primary-hover': '#5ab322',
          } as CSSProperties}
        >
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: '16px' }}>Nuevo Feedback</span>
            <button
              onClick={resetForm}
              style={{
                background: 'transparent',
                border: 'none',
                color: t.textSecondary,
                cursor: 'pointer',
                fontSize: '18px',
                padding: '8px 12px',
                minHeight: '44px',
                borderRadius: '8px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >✕</button>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '20px', WebkitOverflowScrolling: 'touch' }}>
            {/* Screenshot preview */}
            {screenshotPreview && (
              <div style={{ marginBottom: '16px' }}>
                <img src={screenshotPreview} alt="Captura" style={{ width: '100%', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
            )}

            {/* Screenshot capture failed notice */}
            {screenshotFailed && !screenshotPreview && (
              <div style={{ marginBottom: '16px', padding: '8px 12px', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: '6px', fontSize: '13px', color: '#eab308' }}>
                Captura no disponible
              </div>
            )}

            {/* Section/Module */}
            <div style={{ marginBottom: '16px', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '12px', color: t.textSecondary }}>
              Sección: <span style={{ color: t.text }}>{detectedSection}</span>
            </div>

            {/* Description */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Descripción *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe el problema o sugerencia..."
                rows={4}
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(0,0,0,0.2)',
                  border: `1px solid ${t.border}`,
                  borderRadius: '8px',
                  color: t.text,
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#67C728'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = t.border; }}
              />
            </div>

            {/* Type selector */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipo</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {types.map((t) => (
                  <button
                    key={t}
                    onClick={() => setFeedbackType(t)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '6px',
                      border: feedbackType === t ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                      background: feedbackType === t ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
                      color: feedbackType === t ? '#60a5fa' : '#9ca3af',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    {TYPE_LABELS[t] || t}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority selector */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prioridad</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['critical', 'high', 'medium', 'low'] as FeedbackPriority[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: priority === p ? `1px solid ${PRIORITY_COLORS[p]}` : '1px solid rgba(255,255,255,0.1)',
                      background: priority === p ? `${PRIORITY_COLORS[p]}20` : 'rgba(255,255,255,0.05)',
                      color: priority === p ? PRIORITY_COLORS[p] : '#9ca3af',
                      cursor: 'pointer',
                      fontSize: '13px',
                      textTransform: 'capitalize',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit button */}
          <div style={{ padding: '16px 20px', borderTop: `1px solid ${t.border}` }}>
            <button
              onClick={handleSubmit}
              disabled={!description.trim() || isSubmitting}
              style={{
                width: '100%',
                padding: '10px 16px',
                background: !description.trim() || isSubmitting ? 'rgba(103,199,40,0.4)' : '#67C728',
                color: '#292E37',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: !description.trim() || isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s, transform 0.1s',
                opacity: !description.trim() || isSubmitting ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) e.currentTarget.style.background = '#5ab322';
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) e.currentTarget.style.background = '#67C728';
              }}
              onMouseDown={(e) => {
                if (!e.currentTarget.disabled) e.currentTarget.style.transform = 'scale(0.97)';
              }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
            </button>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div
          data-review-mode
          style={{
            position: 'fixed',
            bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            borderRadius: '8px',
            background: toast.type === 'success' ? '#065f46' : '#7f1d1d',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 500,
            zIndex: 100000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Cursor hint + exit button */}
      {!showForm && (
        <div
          data-review-mode
          style={{
            position: 'fixed',
            bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
            right: 'max(24px, env(safe-area-inset-right, 0px))',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            background: 'rgba(59,130,246,0.9)',
            color: '#fff',
            fontSize: '13px',
            zIndex: 99998,
            backdropFilter: 'blur(4px)',
          }}
        >
          <span>{isTouchDevice ? 'Toca cualquier elemento' : 'Click en cualquier elemento'}</span>
          <button
            data-review-mode
            onClick={onDeactivate}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#fff',
              padding: '10px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ✕ Salir
          </button>
        </div>
      )}
    </>
  );
}
