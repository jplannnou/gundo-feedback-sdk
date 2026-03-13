import type { SubmitFeedbackInput } from '../types';
export interface UseFeedbackSubmitReturn {
    submit: (data: SubmitFeedbackInput) => Promise<{
        sessionId: number;
    }>;
    isSubmitting: boolean;
    error: Error | null;
    lastSessionId: number | null;
}
export declare function useFeedbackSubmit(): UseFeedbackSubmitReturn;
//# sourceMappingURL=useFeedbackSubmit.d.ts.map