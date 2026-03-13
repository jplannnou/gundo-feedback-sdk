import type { FeedbackComment } from '../types';
interface CommentThreadProps {
    comments: FeedbackComment[];
    onAddComment: (content: string) => Promise<void>;
    locale?: 'es' | 'en';
}
export declare function CommentThread({ comments, onAddComment, locale }: CommentThreadProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=CommentThread.d.ts.map