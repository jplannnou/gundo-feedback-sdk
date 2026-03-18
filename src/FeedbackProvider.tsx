import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { FeedbackClient } from './api/feedback-client';
import { ContextCollector } from './utils/context-collector';
import type { FeedbackConfig, FeedbackUserInfo } from './types';

interface FeedbackContextValue {
  config: FeedbackConfig;
  client: FeedbackClient;
  user: FeedbackUserInfo | null;
  contextCollector: ContextCollector;
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

  const value = useMemo(() => ({ config, client, user, contextCollector }), [config, client, user, contextCollector]);

  return <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>;
}

export function useFeedbackContext() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedbackContext must be used within <FeedbackProvider>');
  return ctx;
}
