import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, Spinner, ProgressBar } from '@gundo/ui';
function getScoreColor(score) {
    if (score >= 80)
        return 'var(--ui-success, #22c55e)';
    if (score >= 60)
        return 'var(--ui-warning, #eab308)';
    if (score >= 40)
        return 'var(--ui-warning, #f97316)';
    return 'var(--ui-error, #ef4444)';
}
export function HealthScoreCard({ score, isLoading }) {
    if (isLoading) {
        return (_jsx(Card, { children: _jsx("div", { style: { textAlign: 'center', padding: '8px' }, children: _jsx(Spinner, { size: "sm" }) }) }));
    }
    if (!score)
        return null;
    const color = getScoreColor(Number(score.score));
    return (_jsxs(Card, { children: [_jsxs("div", { style: { fontSize: '12px', color: 'var(--ui-text-secondary, #9ca3af)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }, children: ["Health Score \u2014 ", score.project] }), _jsx("div", { style: { fontSize: '36px', fontWeight: 700, color, marginBottom: '4px' }, children: Number(score.score).toFixed(0) }), _jsx(ProgressBar, { value: Number(score.score), max: 100, color: color })] }));
}
//# sourceMappingURL=HealthScoreCard.js.map