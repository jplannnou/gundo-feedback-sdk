import { useState, useEffect, useCallback } from 'react';
import { useFeedbackContext } from '../FeedbackProvider';
import type { FeedbackItem, FeedbackListResponse, ListFeedbackParams } from '../types';

export interface UseFeedbackListReturn {
  items: FeedbackItem[];
  total: number;
  stats: Array<{ status: string; count: number }>;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useFeedbackList(params: ListFeedbackParams = {}): UseFeedbackListReturn {
  const { client } = useFeedbackContext();
  const [data, setData] = useState<FeedbackListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
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
