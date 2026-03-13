import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { timeAgo } from '../utils/time-helpers';
import { Card, Badge } from '@gundo/ui';
const TYPE_BADGE = {
    bug: { label: 'B', variant: 'error' },
    improvement: { label: 'I', variant: 'info' },
    feature: { label: 'F', variant: 'purple' },
    text_selection: { label: 'T', variant: 'warning' },
    image_area: { label: 'Img', variant: 'default' },
    general: { label: 'G', variant: 'default' },
};
const STATUS_COLORS = {
    pending: 'var(--ui-warning, #eab308)',
    in_progress: 'var(--ui-info, #3b82f6)',
    applied: 'var(--ui-success, #22c55e)',
    resolved: 'var(--ui-success, #22c55e)',
    dismissed: 'var(--ui-text-muted, #6b7280)',
    wontfix: 'var(--ui-text-muted, #6b7280)',
};
const PRIORITY_COLORS = {
    critical: 'var(--ui-error, #ef4444)',
    high: '#f97316',
    medium: 'var(--ui-warning, #eab308)',
    low: 'var(--ui-success, #22c55e)',
};
export function FeedbackItemCard({ item, onClick, locale = 'en' }) {
    const typeBadge = TYPE_BADGE[item.feedbackType] || TYPE_BADGE.general;
    const statusColor = STATUS_COLORS[item.status] || 'var(--ui-text-muted, #6b7280)';
    const priorityColor = PRIORITY_COLORS[item.priority] || 'var(--ui-warning, #eab308)';
    return (_jsx(Card, { onClick: onClick ? () => onClick(item) : undefined, hover: !!onClick, children: _jsxs("div", { style: { display: 'flex', alignItems: 'flex-start', gap: '10px' }, children: [_jsx(Badge, { variant: typeBadge.variant, size: "sm", children: typeBadge.label }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("div", { style: { fontSize: '14px', fontWeight: 500, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, children: item.title || item.comment.substring(0, 80) }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--ui-text-secondary, #9ca3af)', flexWrap: 'wrap' }, children: [_jsx("span", { style: { color: priorityColor, fontWeight: 600, textTransform: 'capitalize' }, children: item.priority }), _jsx("span", { style: { color: statusColor, textTransform: 'capitalize' }, children: item.status.replace('_', ' ') }), item.module && _jsxs("span", { children: ["\u00B7 ", item.module] }), _jsxs("span", { children: ["\u00B7 ", timeAgo(item.createdAt, locale)] }), item.reportedByName && _jsxs("span", { children: ["\u00B7 ", item.reportedByName] })] })] }), item.screenshotUrl && (_jsx("span", { style: { fontSize: '14px', opacity: 0.5 }, title: "Has screenshot", children: "\uD83D\uDCF7" }))] }) }));
}
//# sourceMappingURL=FeedbackItemCard.js.map