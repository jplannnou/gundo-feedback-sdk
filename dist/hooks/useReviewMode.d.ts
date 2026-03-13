export interface UseReviewModeReturn {
    active: boolean;
    toggle: () => void;
    activate: () => void;
    deactivate: () => void;
    currentSection: string;
    setCurrentSection: (s: string) => void;
}
export declare function useReviewMode(): UseReviewModeReturn;
//# sourceMappingURL=useReviewMode.d.ts.map