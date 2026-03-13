interface FeedbackToggleProps {
    /** Whether feedback/review mode is active */
    active: boolean;
    /** Toggle callback */
    onClick: () => void;
    /** Number of pending feedback items */
    pendingCount?: number;
    /** Position on screen */
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    /** Custom label */
    label?: string;
}
export declare function FeedbackToggle({ active, onClick, pendingCount, position, label, }: FeedbackToggleProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=FeedbackToggle.d.ts.map