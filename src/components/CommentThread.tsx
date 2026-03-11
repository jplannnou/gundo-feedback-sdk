import { useState, type KeyboardEvent } from 'react';
import type { FeedbackComment } from '../types';
import { timeAgo } from '../utils/time-helpers';
import { theme as t } from '../utils/theme';

interface CommentThreadProps {
  comments: FeedbackComment[];
  onAddComment: (content: string) => Promise<void>;
  locale?: 'es' | 'en';
}

export function CommentThread({ comments, onAddComment, locale = 'en' }: CommentThreadProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!content.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAddComment(content.trim());
      setContent('');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', color: '#f2f4f3' }}>
      {/* Comments list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
        {comments.map((c) => (
          <div key={c.id} style={{ display: 'flex', gap: '10px' }}>
            {/* Avatar */}
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '14px',
                background: c.userAvatar ? `url(${c.userAvatar}) center/cover` : '#374151',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 600,
                color: '#9ca3af',
              }}
            >
              {!c.userAvatar && (c.userName?.[0]?.toUpperCase() || c.userEmail[0].toUpperCase())}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '2px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{c.userName || c.userEmail.split('@')[0]}</span>
                <span style={{ fontSize: '11px', color: '#6b7280' }}>{timeAgo(c.createdAt, locale)}</span>
              </div>
              <div style={{ fontSize: '13px', color: '#d1d5db', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                {c.content}
              </div>
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <div style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center', padding: '12px' }}>
            {locale === 'es' ? 'Sin comentarios aún' : 'No comments yet'}
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={locale === 'es' ? 'Agregar comentario...' : 'Add a comment...'}
          disabled={isSubmitting}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)',
            color: '#f2f4f3',
            fontSize: '13px',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: !content.trim() || isSubmitting ? '#374151' : '#3b82f6',
            color: '#fff',
            fontSize: '13px',
            cursor: !content.trim() || isSubmitting ? 'not-allowed' : 'pointer',
          }}
        >
          {isSubmitting ? '...' : locale === 'es' ? 'Enviar' : 'Send'}
        </button>
      </div>
    </div>
  );
}
