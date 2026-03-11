import type { HealthScore } from '../types';
import { Card, Spinner, ProgressBar } from '@gundo/ui';

interface HealthScoreCardProps {
  score: HealthScore | null;
  isLoading?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'var(--ui-success, #22c55e)';
  if (score >= 60) return 'var(--ui-warning, #eab308)';
  if (score >= 40) return 'var(--ui-warning, #f97316)';
  return 'var(--ui-error, #ef4444)';
}

export function HealthScoreCard({ score, isLoading }: HealthScoreCardProps) {
  if (isLoading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '8px' }}>
          <Spinner size="sm" />
        </div>
      </Card>
    );
  }

  if (!score) return null;

  const color = getScoreColor(Number(score.score));

  return (
    <Card>
      <div style={{ fontSize: '12px', color: 'var(--ui-text-secondary, #9ca3af)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
        Health Score — {score.project}
      </div>
      <div style={{ fontSize: '36px', fontWeight: 700, color, marginBottom: '4px' }}>
        {Number(score.score).toFixed(0)}
      </div>
      <ProgressBar value={Number(score.score)} max={100} color={color} />
    </Card>
  );
}
