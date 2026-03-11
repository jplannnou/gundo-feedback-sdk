import type { HealthScore } from '../types';
import { theme as t } from '../utils/theme';

interface HealthScoreCardProps {
  score: HealthScore | null;
  isLoading?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#eab308';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

export function HealthScoreCard({ score, isLoading }: HealthScoreCardProps) {
  if (isLoading) {
    return (
      <div style={{ padding: '20px', background: t.surfaceRaised, borderRadius: t.radiusXl, border: `1px solid ${t.border}`, textAlign: 'center', color: t.textMuted, fontFamily: t.fontFamily }}>
        Calculando...
      </div>
    );
  }

  if (!score) return null;

  const color = getScoreColor(Number(score.score));

  return (
    <div style={{ padding: '20px', background: t.surfaceRaised, borderRadius: t.radiusXl, border: `1px solid ${t.border}`, fontFamily: t.fontFamily, color: t.text }}>
      <div style={{ fontSize: '12px', color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
        Health Score — {score.project}
      </div>
      <div style={{ fontSize: '36px', fontWeight: 700, color, marginBottom: '4px' }}>
        {Number(score.score).toFixed(0)}
      </div>
      <div style={{
        width: '100%',
        height: '6px',
        borderRadius: '3px',
        background: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
      }}>
        <div style={{ width: `${Math.min(100, Number(score.score))}%`, height: '100%', borderRadius: '3px', background: color, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}
