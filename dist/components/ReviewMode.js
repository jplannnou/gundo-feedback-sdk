import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback, useRef } from 'react';
import { useFeedbackContext } from '../FeedbackProvider';
import { captureElementScreenshot } from '../utils/screenshot-capture';
import { theme as t } from '../utils/theme';
import { Button, Textarea } from '@gundo/ui';
const DEFAULT_TYPES = ['bug', 'improvement', 'feature'];
const PRIORITY_COLORS = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
};
const TYPE_LABELS = {
    bug: 'Bug',
    improvement: 'Mejora',
    feature: 'Feature',
    general: 'General',
};
export function ReviewMode({ active, onDeactivate, currentSection = 'general', types = DEFAULT_TYPES, captureSelector = 'main', }) {
    const { client } = useFeedbackContext();
    const [, setHoveredEl] = useState(null);
    const [highlightRect, setHighlightRect] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [screenshotBlob, setScreenshotBlob] = useState(null);
    const [screenshotPreview, setScreenshotPreview] = useState(null);
    const [description, setDescription] = useState('');
    const [feedbackType, setFeedbackType] = useState(types[0]);
    const [priority, setPriority] = useState('medium');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState(null);
    const formRef = useRef(null);
    // ── Element highlighting on mouse move ──
    const handleMouseMove = useCallback((e) => {
        if (!active || showForm)
            return;
        const target = e.target;
        if (target.closest('[data-review-mode]'))
            return;
        setHoveredEl(target);
        setHighlightRect(target.getBoundingClientRect());
    }, [active, showForm]);
    // ── Click to capture ──
    const handleClick = useCallback(async (e) => {
        if (!active || showForm)
            return;
        const target = e.target;
        if (target.closest('[data-review-mode]'))
            return;
        e.preventDefault();
        e.stopPropagation();
        setHighlightRect(null);
        setShowForm(true);
        // Capture screenshot
        try {
            const captureEl = document.querySelector(captureSelector);
            if (captureEl) {
                const blob = await captureElementScreenshot(captureEl);
                setScreenshotBlob(blob);
                const url = URL.createObjectURL(blob);
                setScreenshotPreview(url);
            }
        }
        catch {
            // Screenshot capture is optional
        }
    }, [active, showForm, captureSelector]);
    // ── Keyboard: Escape to close ──
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (showForm) {
                    resetForm();
                }
                else if (active) {
                    onDeactivate?.();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [active, showForm, onDeactivate]);
    // ── Mouse listeners ──
    useEffect(() => {
        if (!active)
            return;
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
        if (!description.trim() || isSubmitting)
            return;
        setIsSubmitting(true);
        try {
            let screenshotUrl;
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
        }
        catch {
            setToast({ type: 'error', message: 'Error al enviar feedback' });
        }
        finally {
            setIsSubmitting(false);
        }
    }
    // Auto-dismiss toast
    useEffect(() => {
        if (!toast)
            return;
        const t = setTimeout(() => setToast(null), 3500);
        return () => clearTimeout(t);
    }, [toast]);
    if (!active)
        return null;
    const highlightStyle = highlightRect && !showForm
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
    return (_jsxs(_Fragment, { children: [highlightStyle && _jsx("div", { "data-review-mode": true, style: highlightStyle }), showForm && (_jsxs("div", { "data-review-mode": true, ref: formRef, style: {
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
                }, children: [_jsxs("div", { style: { padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx("span", { style: { fontWeight: 600, fontSize: '16px' }, children: "Nuevo Feedback" }), _jsx(Button, { variant: "ghost", size: "sm", onClick: resetForm, children: "\u2715" })] }), _jsxs("div", { style: { flex: 1, overflow: 'auto', padding: '20px' }, children: [screenshotPreview && (_jsx("div", { style: { marginBottom: '16px' }, children: _jsx("img", { src: screenshotPreview, alt: "Captura", style: { width: '100%', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' } }) })), _jsxs("div", { style: { marginBottom: '16px', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '12px', color: t.textSecondary }, children: ["Secci\u00F3n: ", _jsx("span", { style: { color: t.text }, children: currentSection })] }), _jsxs("div", { style: { marginBottom: '16px' }, children: [_jsx("label", { style: { display: 'block', marginBottom: '6px', fontSize: '12px', color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }, children: "Descripci\u00F3n *" }), _jsx(Textarea, { value: description, onChange: (e) => setDescription(e.target.value), placeholder: "Describe el problema o sugerencia...", rows: 4, autoFocus: true })] }), _jsxs("div", { style: { marginBottom: '16px' }, children: [_jsx("label", { style: { display: 'block', marginBottom: '6px', fontSize: '12px', color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }, children: "Tipo" }), _jsx("div", { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' }, children: types.map((t) => (_jsx("button", { onClick: () => setFeedbackType(t), style: {
                                                padding: '6px 14px',
                                                borderRadius: '6px',
                                                border: feedbackType === t ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                                                background: feedbackType === t ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
                                                color: feedbackType === t ? '#60a5fa' : '#9ca3af',
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                            }, children: TYPE_LABELS[t] || t }, t))) })] }), _jsxs("div", { style: { marginBottom: '16px' }, children: [_jsx("label", { style: { display: 'block', marginBottom: '6px', fontSize: '12px', color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }, children: "Prioridad" }), _jsx("div", { style: { display: 'flex', gap: '8px' }, children: ['critical', 'high', 'medium', 'low'].map((p) => (_jsx("button", { onClick: () => setPriority(p), style: {
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                border: priority === p ? `1px solid ${PRIORITY_COLORS[p]}` : '1px solid rgba(255,255,255,0.1)',
                                                background: priority === p ? `${PRIORITY_COLORS[p]}20` : 'rgba(255,255,255,0.05)',
                                                color: priority === p ? PRIORITY_COLORS[p] : '#9ca3af',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                textTransform: 'capitalize',
                                            }, children: p }, p))) })] })] }), _jsx("div", { style: { padding: '16px 20px', borderTop: `1px solid ${t.border}` }, children: _jsx(Button, { variant: "primary", onClick: handleSubmit, disabled: !description.trim() || isSubmitting, loading: isSubmitting, className: "w-full", children: isSubmitting ? 'Enviando...' : 'Enviar Feedback' }) })] })), toast && (_jsx("div", { "data-review-mode": true, style: {
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
                }, children: toast.message })), !showForm && (_jsxs("div", { "data-review-mode": true, style: {
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
                }, children: ["Click en cualquier elemento \u00B7 ", _jsx("kbd", { style: { opacity: 0.7 }, children: "Esc" }), " para salir"] }))] }));
}
//# sourceMappingURL=ReviewMode.js.map