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
  /**
   * Extra CSS selectors for sensitive regions (health data, PII) that must be
   * dropped from feedback screenshots. The defaults `[data-gundo-private]` /
   * `.gundo-private` always apply on top of these. `<ReviewMode>` forwards them
   * to the screenshot capture.
   */
  privateSelectors: string[];
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
  /**
   * Optional CSS selectors for sensitive regions (health data, PII) to exclude
   * from feedback screenshots. Use this to centrally redact health zones without
   * tagging every element (e.g. `['[data-test-result]', '.health-panel']`).
   * `[data-gundo-private]` / `.gundo-private` are always excluded regardless.
   */
  privateSelectors?: string[];
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
  privateSelectors,
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

  // Stabilize across renders so memo deps don't churn on a fresh array literal.
  const privateSelectorsKey = (privateSelectors ?? []).join('|');
  const stablePrivateSelectors = useMemo(
    () => privateSelectors ?? [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [privateSelectorsKey],
  );

  const value = useMemo(
    () => ({
      config,
      client,
      user,
      contextCollector,
      reviewActive,
      activateReview,
      deactivateReview,
      privateSelectors: stablePrivateSelectors,
    }),
    [config, client, user, contextCollector, reviewActive, activateReview, deactivateReview, stablePrivateSelectors],
  );

  return <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>;
}

export function useFeedbackContext() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedbackContext must be used within <FeedbackProvider>');
  return ctx;
}

