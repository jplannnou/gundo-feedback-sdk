import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { timeAgo } from '../utils/time-helpers';
import { Avatar, Input, Button } from '@gundo/ui';
export function CommentThread({ comments, onAddComment, locale = 'en' }) {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    async function handleSubmit() {
        if (!content.trim() || isSubmitting)
            return;
        setIsSubmitting(true);
        try {
            await onAddComment(content.trim());
            setContent('');
        }
        finally {
            setIsSubmitting(false);
        }
    }
    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    }
    return (_jsxs("div", { style: { fontFamily: 'var(--ui-font-family, system-ui, sans-serif)', color: 'var(--ui-text, #f2f4f3)' }, children: [_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }, children: [comments.map((c) => (_jsxs("div", { style: { display: 'flex', gap: '10px' }, children: [_jsx(Avatar, { src: c.userAvatar, initials: (c.userName?.[0] || c.userEmail[0]).toUpperCase(), size: "sm" }), _jsxs("div", { style: { flex: 1 }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '2px' }, children: [_jsx("span", { style: { fontSize: '13px', fontWeight: 600 }, children: c.userName || c.userEmail.split('@')[0] }), _jsx("span", { style: { fontSize: '11px', color: 'var(--ui-text-muted, #6b7280)' }, children: timeAgo(c.createdAt, locale) })] }), _jsx("div", { style: { fontSize: '13px', color: 'var(--ui-text-secondary, #d1d5db)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }, children: c.content })] })] }, c.id))), comments.length === 0 && (_jsx("div", { style: { fontSize: '13px', color: 'var(--ui-text-muted, #6b7280)', textAlign: 'center', padding: '12px' }, children: locale === 'es' ? 'Sin comentarios aún' : 'No comments yet' }))] }), _jsxs("div", { style: { display: 'flex', gap: '8px', alignItems: 'flex-start' }, children: [_jsx("div", { style: { flex: 1 }, children: _jsx(Input, { value: content, onChange: (e) => setContent(e.target.value), onKeyDown: handleKeyDown, placeholder: locale === 'es' ? 'Agregar comentario...' : 'Add a comment...', disabled: isSubmitting }) }), _jsx(Button, { variant: "primary", size: "sm", onClick: handleSubmit, disabled: !content.trim() || isSubmitting, loading: isSubmitting, children: locale === 'es' ? 'Enviar' : 'Send' })] })] }));
}
//# sourceMappingURL=CommentThread.js.map