import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { theme as t } from '../utils/theme';
const POSITIONS = {
    'bottom-right': { bottom: '72px', right: '24px' },
    'bottom-left': { bottom: '72px', left: '24px' },
    'top-right': { top: '24px', right: '24px' },
    'top-left': { top: '24px', left: '24px' },
};
export function FeedbackToggle({ active, onClick, pendingCount = 0, position = 'bottom-right', label, }) {
    return (_jsxs("button", { onClick: onClick, "data-review-mode": true, title: active ? 'Salir de modo revisión' : 'Activar modo revisión', style: {
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
        }, children: [_jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) }), label || (active ? 'Salir Revisión' : 'Feedback'), pendingCount > 0 && (_jsx("span", { style: {
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
                }, children: pendingCount }))] }));
}
//# sourceMappingURL=FeedbackToggle.js.map