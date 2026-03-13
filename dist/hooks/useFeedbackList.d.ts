import type { FeedbackItem, ListFeedbackParams } from '../types';
export interface UseFeedbackListReturn {
    items: FeedbackItem[];
    total: number;
    stats: Array<{
        status: string;
        count: number;
    }>;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
}
export declare function useFeedbackList(params?: ListFeedbackParams): UseFeedbackListReturn;
//# sourceMappingURL=useFeedbackList.d.ts.map