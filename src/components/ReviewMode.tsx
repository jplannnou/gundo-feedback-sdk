import { useState, useEffect, useCallback, useRef, type CSSProperties } from 'react';
import { useFeedbackContext } from '../FeedbackProvider';
import type { FeedbackPriority, FeedbackType } from '../types';
import { captureElementScreenshot } from '../utils/screenshot-capture';
import { theme as t } from '../utils/theme';
import { Button, Textarea } from '@gundo/ui';

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
  const { client } = useFeedbackContext();

  const [, setHoveredEl] = useState<HTMLElement | null>(null);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [screenshotBlob, setScreenshotBlob] = useState<Blob | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  const [description, setDescription] = useState('');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>(types[0]);
  const [priority, setPriority] = useState<FeedbackPriority>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const formRef = useRef<HTMLDivElement>(null);

  // ── Element highlighting on mouse move ──
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!active || showForm) return;
      const target = e.target as HTMLElement;
      if (target.closest('[data-review-mode]')) return;
      setHoveredEl(target);
      setHighlightRect(target.getBoundingClientRect());
    },
    [active, showForm],
  );

  // ── Click to capture ──
  const handleClick = useCallback(
    async (e: MouseEvent) => {
      if (!active || showForm) return;
      const target = e.target as HTMLElement;
      if (target.closest('[data-review-mode]')) return;
      e.preventDefault();
      e.stopPropagation();

      setHighlightRect(null);
      setShowForm(true);

      // Capture screenshot
      try {
        const captureEl = document.querySelector(captureSelector) as HTMLElement;
        if (captureEl) {
          const blob = await captureElementScreenshot(captureEl);
          setScreenshotBlob(blob);
          const url = URL.createObjectURL(blob);
          setScreenshotPreview(url);
        }
      } catch {
        // Screenshot capture is optional
      }
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

  // ── Mouse listeners ──
  useEffect(() => {
    if (!active) return;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick, true);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick, true);
    };
  }, [active, handleMouseMove, handleClick]);

  function resetForm() {
    setShowForm(false);
    setDescription('');
    setFeedbackType(types[0]);
    setPriority('medium');
    setScreenshotBlob(null);
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
        const result = await client.uploadScreenshot(screenshotBlob);
        screenshotUrl = result.url;
      }

      await client.submitFeedback({
        items: [
          {
            comment: description.trim(),
            feedbackType,
            priority,
            module: currentSection,
            screenshotUrl,
            context: {
              url: window.location.href,
              viewport: `${window.innerWidth}x${window.innerHeight}`,
              userAgent: navigator.userAgent,
              section: currentSection,
              timestamp: new Date().toISOString(),
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
            height: '100vh',
            background: t.surface,
            borderLeft: `1px solid ${t.border}`,
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            color: t.text,
            fontFamily: t.fontFamily,
            fontSize: '14px',
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
            <Button variant="ghost" size="sm" onClick={resetForm}>✕</Button>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
            {/* Screenshot preview */}
            {screenshotPreview && (
              <div style={{ marginBottom: '16px' }}>
                <img src={screenshotPreview} alt="Captura" style={{ width: '100%', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
            )}

            {/* Section/Module */}
            <div style={{ marginBottom: '16px', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '12px', color: t.textSecondary }}>
              Sección: <span style={{ color: t.text }}>{currentSection}</span>
            </div>

            {/* Description */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Descripción *
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe el problema o sugerencia..."
                rows={4}
                autoFocus
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
                      padding: '6px 14px',
                      borderRadius: '6px',
                      border: feedbackType === t ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                      background: feedbackType === t ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
                      color: feedbackType === t ? '#60a5fa' : '#9ca3af',
                      cursor: 'pointer',
                      fontSize: '13px',
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
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: priority === p ? `1px solid ${PRIORITY_COLORS[p]}` : '1px solid rgba(255,255,255,0.1)',
                      background: priority === p ? `${PRIORITY_COLORS[p]}20` : 'rgba(255,255,255,0.05)',
                      color: priority === p ? PRIORITY_COLORS[p] : '#9ca3af',
                      cursor: 'pointer',
                      fontSize: '12px',
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
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!description.trim() || isSubmitting}
              loading={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
            </Button>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div
          data-review-mode
          style={{
            position: 'fixed',
            bottom: '24px',
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

      {/* Cursor hint */}
      {!showForm && (
        <div
          data-review-mode
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            padding: '8px 16px',
            borderRadius: '8px',
            background: 'rgba(59,130,246,0.9)',
            color: '#fff',
            fontSize: '13px',
            zIndex: 99998,
            backdropFilter: 'blur(4px)',
          }}
        >
          Click en cualquier elemento · <kbd style={{ opacity: 0.7 }}>Esc</kbd> para salir
        </div>
      )}
    </>
  );
}
