import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useMemo } from 'react';
import { FeedbackClient } from './api/feedback-client';
const FeedbackContext = createContext(null);
export function FeedbackProvider({ project, apiBaseUrl, getUser, modules, entityId, entityType, children, }) {
    const client = useMemo(() => new FeedbackClient(apiBaseUrl), [apiBaseUrl]);
    const user = getUser();
    const config = useMemo(() => ({ project, apiBaseUrl, getUser, modules, entityId, entityType }), [project, apiBaseUrl, getUser, modules, entityId, entityType]);
    const value = useMemo(() => ({ config, client, user }), [config, client, user]);
    return _jsx(FeedbackContext.Provider, { value: value, children: children });
}
export function useFeedbackContext() {
    const ctx = useContext(FeedbackContext);
    if (!ctx)
        throw new Error('useFeedbackContext must be used within <FeedbackProvider>');
    return ctx;
}
//# sourceMappingURL=FeedbackProvider.js.map