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
}
export declare function FeedbackDashboard({ showChangelog, modules, locale, allowCreate, }: FeedbackDashboardProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=FeedbackDashboard.d.ts.map