import './FeedbackDashboard.css';
interface FeedbackDashboardProps {
    /** Show changelog tab */
    showChangelog?: boolean;
    /** Available modules for filter */
    modules?: string[];
    /** Locale for UI text */
    locale?: 'es' | 'en';
    /** Allow creating new feedback from dashboard */
    allowCreate?: boolean;
    /** Override the + Nuevo button: calls this instead of opening the internal form. Use to trigger ReviewMode. */
    onNewFeedback?: () => void;
}
export declare function FeedbackDashboard({ showChangelog, modules, locale, allowCreate, onNewFeedback, }: FeedbackDashboardProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=FeedbackDashboard.d.ts.map