import type { FeedbackItem } from '../types';
import { timeAgo } from '../utils/time-helpers';
import { Card, Badge } from '@gundo/ui';

interface FeedbackItemCardProps {
  item: FeedbackItem;
  onClick?: (item: FeedbackItem) => void;
  locale?: 'es' | 'en';
}

const TYPE_BADGE: Record<string, { label: string; variant: 'default' | 'success' | 'error' | 'warning' | 'info' | 'purple' }> = {
  bug: { label: 'B', variant: 'error' },
  improvement: { label: 'I', variant: 'info' },
  feature: { label: 'F', variant: 'purple' },
  text_selection: { label: 'T', variant: 'warning' },
  image_area: { label: 'Img', variant: 'default' },
  general: { label: 'G', variant: 'default' },
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'var(--ui-warning, #eab308)',
  in_progress: 'var(--ui-info, #3b82f6)',
  applied: 'var(--ui-success, #22c55e)',
  resolved: 'var(--ui-success, #22c55e)',
  dismissed: 'var(--ui-text-muted, #6b7280)',
  wontfix: 'var(--ui-text-muted, #6b7280)',
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'var(--ui-error, #ef4444)',
  high: '#f97316',
  medium: 'var(--ui-warning, #eab308)',
  low: 'var(--ui-success, #22c55e)',
};

export function FeedbackItemCard({ item, onClick, locale = 'es' }: FeedbackItemCardProps) {
  const typeBadge = TYPE_BADGE[item.feedbackType] || TYPE_BADGE.general;
  const statusColor = STATUS_COLORS[item.status] || 'var(--ui-text-muted, #6b7280)';
  const priorityColor = PRIORITY_COLORS[item.priority] || 'var(--ui-warning, #eab308)';

  return (
    <Card
      onClick={onClick ? () => onClick(item) : undefined}
      hover={!!onClick}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        {/* Type badge */}
        <Badge variant={typeBadge.variant} size="sm">
          {typeBadge.label}
        </Badge>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.title || item.comment.substring(0, 80)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--ui-text-secondary, #9ca3af)', flexWrap: 'wrap' }}>
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
    </Card>
  );
}
