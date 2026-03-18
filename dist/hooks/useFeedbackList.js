import { useState, useEffect, useCallback } from 'react';
import { useFeedbackContext } from '../FeedbackProvider.js';
export function useFeedbackList(params = {}) {
    const { client } = useFeedbackContext();
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fetchKey, setFetchKey] = useState(0);
    const paramsKey = JSON.stringify(params);
    const refetch = useCallback(() => setFetchKey((k) => k + 1), []);
    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        setError(null);
        client
            .listFeedback(params)
            .then((res) => {
            if (!cancelled) {
                setData(res);
                setIsLoading(false);
            }
        })
            .catch((err) => {
            if (!cancelled) {
                setError(err);
                setIsLoading(false);
            }
        });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [client, paramsKey, fetchKey]);
    return {
        items: data?.items ?? [],
        total: data?.total ?? 0,
        stats: data?.stats ?? [],
        isLoading,
        error,
        refetch,
    };
}
//# sourceMappingURL=useFeedbackList.js.map