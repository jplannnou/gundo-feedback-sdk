import { useState, useCallback } from 'react';
import { useFeedbackContext } from '../FeedbackProvider';
export function useFeedbackSubmit() {
    const { client, contextCollector } = useFeedbackContext();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [lastSessionId, setLastSessionId] = useState(null);
    const submit = useCallback(async (data) => {
        setIsSubmitting(true);
        setError(null);
        try {
            // Auto-enrich items with collected context
            const collectedCtx = contextCollector.collect();
            const enrichedData = {
                ...data,
                items: data.items.map((item) => ({
                    ...item,
                    context: {
                        ...collectedCtx,
                        ...item.context, // user-provided context takes precedence
                    },
                })),
            };
            const result = await client.submitFeedback(enrichedData);
            setLastSessionId(result.sessionId);
            return { sessionId: result.sessionId };
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
            throw err;
        }
        finally {
            setIsSubmitting(false);
        }
    }, [client]);
    return { submit, isSubmitting, error, lastSessionId };
}
//# sourceMappingURL=useFeedbackSubmit.js.map