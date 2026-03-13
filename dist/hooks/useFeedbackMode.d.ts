import type { CreateFeedbackItemInput } from '../types';
export interface PendingFeedbackItem extends CreateFeedbackItemInput {
    _id: string;
}
export interface UseFeedbackModeReturn {
    isActive: boolean;
    toggle: () => void;
    activate: () => void;
    deactivate: () => void;
    pendingItems: PendingFeedbackItem[];
    addItem: (item: CreateFeedbackItemInput) => void;
    removeItem: (id: string) => void;
    clearItems: () => void;
    pendingCount: number;
}
export declare function useFeedbackMode(): UseFeedbackModeReturn;
//# sourceMappingURL=useFeedbackMode.d.ts.map