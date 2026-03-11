import { useState, useCallback } from 'react';
import { useFeedbackContext } from '../FeedbackProvider';
import type { SubmitFeedbackInput } from '../types';

export interface UseFeedbackSubmitReturn {
  submit: (data: SubmitFeedbackInput) => Promise<{ sessionId: number }>;
  isSubmitting: boolean;
  error: Error | null;
  lastSessionId: number | null;
}

export function useFeedbackSubmit(): UseFeedbackSubmitReturn {
  const { client } = useFeedbackContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastSessionId, setLastSessionId] = useState<number | null>(null);

  const submit = useCallback(
    async (data: SubmitFeedbackInput) => {
      setIsSubmitting(true);
      setError(null);
      try {
        const result = await client.submitFeedback(data);
        setLastSessionId(result.sessionId);
        return { sessionId: result.sessionId };
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [client],
  );

  return { submit, isSubmitting, error, lastSessionId };
}
