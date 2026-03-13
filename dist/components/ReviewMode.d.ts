import type { FeedbackType } from '../types';
interface ReviewModeProps {
    /** Whether review mode is active */
    active: boolean;
    /** Called when user deactivates review mode */
    onDeactivate?: () => void;
    /** Override for section detection */
    currentSection?: string;
    /** Available feedback types (defaults to bug/improvement/feature) */
    types?: FeedbackType[];
    /** Container element selector for screenshot capture (defaults to 'main') */
    captureSelector?: string;
}
export declare function ReviewMode({ active, onDeactivate, currentSection, types, captureSelector, }: ReviewModeProps): import("react/jsx-runtime").JSX.Element | null;
export {};
//# sourceMappingURL=ReviewMode.d.ts.map