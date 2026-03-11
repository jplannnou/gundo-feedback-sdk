import type { FeedbackItem } from '../types';
import { timeAgo } from '../utils/time-helpers';
import { theme as t } from '../utils/theme';

interface FeedbackItemCardProps {
  item: FeedbackItem;
  onClick?: (item: FeedbackItem) => void;
  locale?: 'es' | 'en';
}

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  bug: { label: 'B', color: '#ef4444' },
  improvement: { label: 'I', color: '#3b82f6' },
  feature: { label: 'F', color: '#8b5cf6' },
  text_selection: { label: 'T', color: '#f59e0b' },
  image_area: { label: 'Img', color: '#ec4899' },
  general: { label: 'G', color: '#6b7280' },
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#eab308',
  in_progress: '#3b82f6',
  applied: '#22c55e',
  resolved: '#22c55e',
  dismissed: '#6b7280',
  wontfix: '#6b7280',
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

export function FeedbackItemCard({ item, onClick, locale = 'en' }: FeedbackItemCardProps) {
  const typeBadge = TYPE_BADGE[item.feedbackType] || TYPE_BADGE.general;
  const statusColor = STATUS_COLORS[item.status] || '#6b7280';
  const priorityColor = PRIORITY_COLORS[item.priority] || '#eab308';

  return (
    <div
      onClick={() => onClick?.(item)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => { if (onClick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick(item); } }}
      style={{
        padding: '14px 16px',
        background: t.surfaceRaised,
        borderRadius: t.radiusLg,
        border: `1px solid ${t.border}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background 0.15s',
        fontFamily: t.fontFamily,
        color: t.text,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        {/* Type badge */}
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '4px',
            background: `${typeBadge.color}20`,
            color: typeBadge.color,
            fontSize: '11px',
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {typeBadge.label}
        </span>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.title || item.comment.substring(0, 80)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: t.textSecondary, flexWrap: 'wrap' }}>
            <span style={{ color: priorityColor, fontWeight: 600, textTransform: 'capitalize' }}>{item.priority}</span>
            <span style={{ color: statusColor, textTransform: 'capitalize' }}>{item.status.replace('_', ' ')}</span>
            {item.module && <span>· {item.module}</span>}
            <span>· {timeAgo(item.createdAt, locale)}</span>
            {item.reportedByName && <span>· {item.reportedByName}</span>}
          </div>
        </div>

        {/* Screenshot indicator */}
        {item.screenshotUrl && (
          <span style={{ fontSize: '14px', opacity: 0.5 }} title="Has screenshot">📷</span>
        )}
      </div>
    </div>
  );
}
