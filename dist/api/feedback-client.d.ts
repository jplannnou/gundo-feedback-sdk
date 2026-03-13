import type { SubmitFeedbackInput, UpdateFeedbackInput, ListFeedbackParams, FeedbackListResponse, FeedbackDetailResponse, FeedbackStats, FeedbackComment, HealthScore, ChangelogEntry, FeedbackUser } from '../types';
/**
 * HTTP client for the GUNDO Feedback Hub API.
 *
 * Calls go to the project's own backend proxy (e.g. /api/feedback-proxy/*)
 * which forwards them to the centralized Feedback API with proper auth headers.
 */
export declare class FeedbackClient {
    private baseUrl;
    constructor(baseUrl: string);
    private request;
    submitFeedback(data: SubmitFeedbackInput): Promise<{
        sessionId: number;
        items: unknown[];
    }>;
    listFeedback(params?: ListFeedbackParams): Promise<FeedbackListResponse>;
    getFeedback(id: number): Promise<FeedbackDetailResponse>;
    updateFeedback(id: number, data: UpdateFeedbackInput): Promise<FeedbackDetailResponse>;
    deleteFeedback(id: number): Promise<void>;
    addComment(feedbackId: number, content: string): Promise<FeedbackComment>;
    getComments(feedbackId: number): Promise<FeedbackComment[]>;
    uploadScreenshot(file: Blob, filename?: string): Promise<{
        url: string;
    }>;
    getStats(project?: string): Promise<FeedbackStats>;
    getRecentResolved(project?: string): Promise<unknown[]>;
    getHealthScores(): Promise<HealthScore[]>;
    getProjectHealthHistory(project: string): Promise<HealthScore[]>;
    getChangelog(project?: string): Promise<ChangelogEntry[]>;
    getUsers(): Promise<FeedbackUser[]>;
}
export declare class FeedbackApiError extends Error {
    status: number;
    body?: unknown;
    constructor(status: number, message: string, body?: unknown);
}
//# sourceMappingURL=feedback-client.d.ts.map