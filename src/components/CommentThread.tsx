import { useState, type KeyboardEvent } from 'react';
import type { FeedbackComment } from '../types';
import { timeAgo } from '../utils/time-helpers';
import { Avatar, Input, Button } from '@gundo/ui';

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
    <div style={{ fontFamily: 'var(--ui-font-family, system-ui, sans-serif)', color: 'var(--ui-text, #f2f4f3)' }}>
      {/* Comments list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
        {comments.map((c) => (
          <div key={c.id} style={{ display: 'flex', gap: '10px' }}>
            <Avatar
              src={c.userAvatar}
              initials={(c.userName?.[0] || c.userEmail[0]).toUpperCase()}
              size="sm"
            />

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '2px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{c.userName || c.userEmail.split('@')[0]}</span>
                <span style={{ fontSize: '11px', color: 'var(--ui-text-muted, #6b7280)' }}>{timeAgo(c.createdAt, locale)}</span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--ui-text-secondary, #d1d5db)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                {c.content}
              </div>
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <div style={{ fontSize: '13px', color: 'var(--ui-text-muted, #6b7280)', textAlign: 'center', padding: '12px' }}>
            {locale === 'es' ? 'Sin comentarios aún' : 'No comments yet'}
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={locale === 'es' ? 'Agregar comentario...' : 'Add a comment...'}
            disabled={isSubmitting}
          />
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          loading={isSubmitting}
        >
          {locale === 'es' ? 'Enviar' : 'Send'}
        </Button>
      </div>
    </div>
  );
}
