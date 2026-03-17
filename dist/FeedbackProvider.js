import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { FeedbackClient } from './api/feedback-client';
import { ContextCollector } from './utils/context-collector';
const FeedbackContext = createContext(null);
export function FeedbackProvider({ project, apiBaseUrl, getUser, getToken, modules, entityId, entityType, children, }) {
    const client = useMemo(() => new FeedbackClient(apiBaseUrl, getToken), [apiBaseUrl, getToken]);
    const user = getUser();
    const collectorRef = useRef(null);
    if (!collectorRef.current) {
        collectorRef.current = new ContextCollector();
    }
    const contextCollector = collectorRef.current;
    useEffect(() => {
        contextCollector.start();
        return () => contextCollector.destroy();
    }, [contextCollector]);
    const config = useMemo(() => ({ project, apiBaseUrl, getUser, modules, entityId, entityType }), [project, apiBaseUrl, getUser, modules, entityId, entityType]);
    const value = useMemo(() => ({ config, client, user, contextCollector }), [config, client, user, contextCollector]);
    return _jsx(FeedbackContext.Provider, { value: value, children: children });
}
export function useFeedbackContext() {
    const ctx = useContext(FeedbackContext);
    if (!ctx)
        throw new Error('useFeedbackContext must be used within <FeedbackProvider>');
    return ctx;
}
//# sourceMappingURL=FeedbackProvider.js.map