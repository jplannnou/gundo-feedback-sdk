import { useState, type CSSProperties, type ReactNode } from 'react';
import { useFeedbackContext } from '../FeedbackProvider';
import { theme as t } from '../utils/theme';

interface FeedbackPanelProps {
  /**
   * Optional callback fired right before review mode activates. Hosts that
   * embed FeedbackPanel inside another floating UI (e.g. the GundoWidget
   * feedback tab) can use this to close the surrounding panel so the user
   * sees the page they're about to mark, not a chat panel blocking it.
   */
  onBeforeActivate?: () => void;
  /** Override the panel title (default Spanish copy aimed at testers) */
  title?: string;
  /** Override the body copy. Pass a node for richer formatting. */
  description?: ReactNode;
  /** Override the activate-button label */
  buttonLabel?: string;
  /** Override the message shown while review mode is already running */
  activeMessage?: ReactNode;
}

/**
 * Inline feedback CTA card. Render anywhere inside <FeedbackProvider> — most
 * commonly as the `feedbackSlot` of @gundo/ui's GundoWidget — to expose the
 * "mark a zone of the screen + leave feedback" flow without owning a
 * standalone floating button (FeedbackToggle).
 *
 * Internal behavior: clicking the button flips `reviewActive` in
 * FeedbackContext to `true`. A sibling <ReviewMode /> (already required for
 * the toggle flow) then takes over the page — same UX as the toggle, just
 * triggered from inside another widget instead of a fixed button.
 */
export function FeedbackPanel({
  onBeforeActivate,
  title = 'Reportá un problema o sugerencia',
  description = (
    <>
      Vas a poder hacer clic en cualquier parte de la pantalla para
      capturarla, dejar un comentario y mandarla al equipo. Útil para
      bugs visuales, copy raro o ideas concretas.
    </>
  ),
  buttonLabel = 'Marcar una zona y dejar feedback',
  activeMessage = (
    <>
      Modo feedback activo. Hacé clic en cualquier parte de la pantalla
      para capturarla.
    </>
  ),
}: FeedbackPanelProps) {
  const { reviewActive, activateReview } = useFeedbackContext();
  const [hover, setHover] = useState(false);

  const handleClick = () => {
    onBeforeActivate?.();
    activateReview();
  };

  const cardStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px',
    fontFamily: t.fontFamily,
    color: t.text,
  };

  const titleStyle: CSSProperties = {
    margin: 0,
    fontSize: '15px',
    fontWeight: 600,
    color: t.text,
  };

  const descStyle: CSSProperties = {
    margin: 0,
    fontSize: '13px',
    lineHeight: 1.5,
    color: t.textSecondary,
  };

  const buttonStyle: CSSProperties = {
    marginTop: '4px',
    padding: '10px 16px',
    borderRadius: t.radiusLg,
    border: 'none',
    background: hover ? t.primaryHover : t.primary,
    color: t.surface,
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.15s ease',
    fontFamily: t.fontFamily,
  };

  const activeBannerStyle: CSSProperties = {
    padding: '12px 14px',
    borderRadius: t.radiusLg,
    border: `1px solid ${t.warning}`,
    background: 'rgba(234,179,8,0.10)',
    color: t.warning,
    fontSize: '13px',
    lineHeight: 1.5,
  };

  return (
    <div style={cardStyle}>
      <h3 style={titleStyle}>{title}</h3>
      <p style={descStyle}>{description}</p>
      {reviewActive ? (
        <div style={activeBannerStyle} role="status">
          {activeMessage}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={buttonStyle}
        >
          {buttonLabel}
        </button>
      )}
    </div>
  );
}
