import { type ReactNode } from 'react';
import { FeedbackClient } from './api/feedback-client';
import { ContextCollector } from './utils/context-collector';
import type { FeedbackConfig, FeedbackUserInfo } from './types';
interface FeedbackContextValue {
    config: FeedbackConfig;
    client: FeedbackClient;
    user: FeedbackUserInfo | null;
    contextCollector: ContextCollector;
}
interface FeedbackProviderProps {
    /** Project identifier */
    project: string;
    /** Base URL of the feedback proxy on your backend (e.g. '/api/feedback-proxy') */
    apiBaseUrl: string;
    /** Returns current user info from your app's auth */
    getUser: () => FeedbackUserInfo | null;
    /** Returns a Firebase ID token for authenticating proxy requests */
    getToken?: () => Promise<string | null>;
    /** Optional list of modules/sections in this project */
    modules?: string[];
    /** Optional entity context */
    entityId?: string;
    entityType?: string;
    /** Optional: returns custom app context (Redux state, feature flags, build version) */
    getCustomContext?: () => Record<string, unknown>;
    children: ReactNode;
}
export declare function FeedbackProvider({ project, apiBaseUrl, getUser, getToken, modules, entityId, entityType, getCustomContext, children, }: FeedbackProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function useFeedbackContext(): FeedbackContextValue;
export {};
//# sourceMappingURL=FeedbackProvider.d.ts.map