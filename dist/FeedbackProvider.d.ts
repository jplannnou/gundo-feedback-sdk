import { type ReactNode } from 'react';
import { FeedbackClient } from './api/feedback-client';
import type { FeedbackConfig, FeedbackUserInfo } from './types';
interface FeedbackContextValue {
    config: FeedbackConfig;
    client: FeedbackClient;
    user: FeedbackUserInfo | null;
}
interface FeedbackProviderProps {
    /** Project identifier */
    project: string;
    /** Base URL of the feedback proxy on your backend (e.g. '/api/feedback-proxy') */
    apiBaseUrl: string;
    /** Returns current user info from your app's auth */
    getUser: () => FeedbackUserInfo | null;
    /** Optional list of modules/sections in this project */
    modules?: string[];
    /** Optional entity context */
    entityId?: string;
    entityType?: string;
    children: ReactNode;
}
export declare function FeedbackProvider({ project, apiBaseUrl, getUser, modules, entityId, entityType, children, }: FeedbackProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function useFeedbackContext(): FeedbackContextValue;
export {};
//# sourceMappingURL=FeedbackProvider.d.ts.map