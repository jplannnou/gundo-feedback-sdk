import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { FeedbackClient } from './api/feedback-client';
import { ContextCollector } from './utils/context-collector';
import type { FeedbackConfig, FeedbackUserInfo } from './types';

interface FeedbackContextValue {
  config: FeedbackConfig;
  client: FeedbackClient;
  user: FeedbackUserInfo | null;
  contextCollector: ContextCollector;
  /**
   * Whether the review/screenshot-capture overlay is active. Lifted to
   * the provider so `<FeedbackPanel>` (rendered inside any UI, e.g. the
   * GundoWidget's feedback tab) can activate it without prop-drilling.
   * `<ReviewMode>` reads this value when no explicit `active` prop is
   * passed, so existing consumers that wired ReviewMode props directly
   * keep working unchanged.
   */
  reviewActive: boolean;
  activateReview: () => void;
  deactivateReview: () => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

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

export function FeedbackProvider({
  project,
  apiBaseUrl,
  getUser,
  getToken,
  modules,
  entityId,
  entityType,
  getCustomContext,
  children,
}: FeedbackProviderProps) {
  const client = useMemo(() => new FeedbackClient(apiBaseUrl, getToken), [apiBaseUrl, getToken]);
  const user = getUser();

  const collectorRef = useRef<ContextCollector | null>(null);
  if (!collectorRef.current) {
    collectorRef.current = new ContextCollector(getCustomContext);
  }
  const contextCollector = collectorRef.current;

  useEffect(() => {
    contextCollector.start();
    return () => contextCollector.destroy();
  }, [contextCollector]);

  const config: FeedbackConfig = useMemo(
    () => ({ project, apiBaseUrl, getUser, modules, entityId, entityType }),
    [project, apiBaseUrl, getUser, modules, entityId, entityType],
  );

  const [reviewActive, setReviewActive] = useState(false);
  const activateReview = useCallback(() => setReviewActive(true), []);
  const deactivateReview = useCallback(() => setReviewActive(false), []);

  const value = useMemo(
    () => ({ config, client, user, contextCollector, reviewActive, activateReview, deactivateReview }),
    [config, client, user, contextCollector, reviewActive, activateReview, deactivateReview],
  );

  return <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>;
}

export function useFeedbackContext() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedbackContext must be used within <FeedbackProvider>');
  return ctx;
}

