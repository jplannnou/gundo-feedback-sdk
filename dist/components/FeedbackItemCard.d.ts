import type { FeedbackItem } from '../types';
interface FeedbackItemCardProps {
    item: FeedbackItem;
    onClick?: (item: FeedbackItem) => void;
    locale?: 'es' | 'en';
}
export declare function FeedbackItemCard({ item, onClick, locale }: FeedbackItemCardProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=FeedbackItemCard.d.ts.map