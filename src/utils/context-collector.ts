// ── Automatic Context Collector ──────────────────────────────────
// Captures browser environment, user actions (breadcrumbs), console
// logs, API errors, and performance metrics to enrich feedback submissions.

/** Parsed browser/OS info without external deps */
export interface DeviceInfo {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  device: 'desktop' | 'tablet' | 'mobile';
  viewport: { width: number; height: number };
  screen: { width: number; height: number };
  pixelRatio: number;
  language: string;
  networkType: string | null;
}

/** Breadcrumb trail entry — replaces legacy UserAction */
export interface Breadcrumb {
  type: 'click' | 'navigation' | 'xhr' | 'console' | 'input' | 'focus';
  category: 'ui' | 'http' | 'console';
  message: string;
  data?: Record<string, unknown>;
  timestamp: number;
}

/** Console log entry with optional stack trace */
export interface ConsoleLog {
  level: 'log' | 'info' | 'warn' | 'error';
  message: string;
  stack?: string;
  timestamp: number;
}

/** Enriched API error with duration and response body */
export interface ApiError {
  url: string;
  method: string;
  status: number;
  statusText: string;
  duration: number;
  responseBody: string;
  timestamp: number;
}

export interface PerformanceMetrics {
  fcp: number | null;
  lcp: number | null;
  cls: number | null;
  ttfb: number | null;
  timeOnPage: number;
}

// ── Legacy interfaces (backward compat) ─────────────────────────

/** @deprecated Use Breadcrumb instead */
export interface UserAction {
  type: 'click' | 'navigation' | 'input';
  target: string;
  timestamp: number;
  detail?: string;
}

/** @deprecated Use ConsoleLog instead */
export interface ConsoleError {
  message: string;
  timestamp: number;
}

// ── Collected context shape ─────────────────────────────────────

export interface CollectedContext {
  sessionId: string;
  device: DeviceInfo;
  breadcrumbs: Breadcrumb[];
  consoleLogs: ConsoleLog[];
  apiErrors: ApiError[];
  performance: PerformanceMetrics;
  app: Record<string, unknown>;
  url: string;
  referrer: string;
  timestamp: string;
  // Legacy aliases for backward compat
  actions: UserAction[];
  consoleErrors: ConsoleError[];
}

// ── Ring buffer for capped arrays ────────────────────────────────

class RingBuffer<T> {
  private items: T[] = [];
  constructor(private maxSize: number) {}

  push(item: T) {
    if (this.items.length >= this.maxSize) this.items.shift();
    this.items.push(item);
  }

  getAll(): T[] {
    return [...this.items];
  }

  clear() {
    this.items = [];
  }
}

// ── Device detection (no external deps) ──────────────────────────

function parseDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent;

  // Browser detection
  let browser = 'Unknown';
  let browserVersion = '';
  if (ua.includes('Firefox/')) {
    browser = 'Firefox';
    browserVersion = ua.match(/Firefox\/([\d.]+)/)?.[1] ?? '';
  } else if (ua.includes('Edg/')) {
    browser = 'Edge';
    browserVersion = ua.match(/Edg\/([\d.]+)/)?.[1] ?? '';
  } else if (ua.includes('Chrome/')) {
    browser = 'Chrome';
    browserVersion = ua.match(/Chrome\/([\d.]+)/)?.[1] ?? '';
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    browser = 'Safari';
    browserVersion = ua.match(/Version\/([\d.]+)/)?.[1] ?? '';
  }

  // OS detection
  let os = 'Unknown';
  let osVersion = '';
  if (ua.includes('Windows')) {
    os = 'Windows';
    osVersion = ua.match(/Windows NT ([\d.]+)/)?.[1] ?? '';
  } else if (ua.includes('Mac OS X')) {
    os = 'macOS';
    osVersion = (ua.match(/Mac OS X ([\d_]+)/)?.[1] ?? '').replace(/_/g, '.');
  } else if (ua.includes('Linux')) {
    os = 'Linux';
  } else if (ua.includes('Android')) {
    os = 'Android';
    osVersion = ua.match(/Android ([\d.]+)/)?.[1] ?? '';
  } else if (/iPhone|iPad/.test(ua)) {
    os = 'iOS';
    osVersion = (ua.match(/OS ([\d_]+)/)?.[1] ?? '').replace(/_/g, '.');
  }

  // Device type
  const width = window.innerWidth;
  const device = width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop';

  // Network type
  const conn = (navigator as { connection?: { effectiveType?: string } }).connection;
  const networkType = conn?.effectiveType ?? null;

  return {
    browser,
    browserVersion,
    os,
    osVersion,
    device,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    screen: { width: screen.width, height: screen.height },
    pixelRatio: window.devicePixelRatio || 1,
    language: navigator.language,
    networkType,
  };
}

// ── Performance metrics ──────────────────────────────────────────

function getPerformanceMetrics(): PerformanceMetrics {
  let fcp: number | null = null;
  let lcp: number | null = null;
  let cls: number | null = null;
  let ttfb: number | null = null;

  try {
    const entries = performance.getEntriesByType('paint');
    const fcpEntry = entries.find((e) => e.name === 'first-contentful-paint');
    if (fcpEntry) fcp = Math.round(fcpEntry.startTime);
  } catch { /* not supported */ }

  try {
    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navEntries.length > 0) {
      ttfb = Math.round(navEntries[0].responseStart - navEntries[0].requestStart);
    }
  } catch { /* not supported */ }

  // LCP and CLS are stored by observers if running
  if (_lcpValue !== null) lcp = Math.round(_lcpValue);
  if (_clsValue !== null) cls = Math.round(_clsValue * 1000) / 1000;

  const timeOnPage = Math.round(performance.now() / 1000);

  return { fcp, lcp, cls, ttfb, timeOnPage };
}

// ── Module-level storage for observer values ─────────────────────

let _lcpValue: number | null = null;
let _clsValue: number | null = null;

// ── Context Collector Class ──────────────────────────────────────

export class ContextCollector {
  private sessionId: string;
  private breadcrumbs = new RingBuffer<Breadcrumb>(50);
  private consoleLogs = new RingBuffer<ConsoleLog>(30);
  private apiErrors = new RingBuffer<ApiError>(10);
  private cleanupFns: (() => void)[] = [];
  private originalFetch: typeof fetch | null = null;
  private getCustomContext: (() => Record<string, unknown>) | undefined;

  constructor(getCustomContext?: () => Record<string, unknown>) {
    this.sessionId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this.getCustomContext = getCustomContext;
  }

  /** Start collecting context data. Call destroy() to clean up. */
  start() {
    this.observeBreadcrumbs();
    this.observeConsoleLogs();
    this.interceptFetch();
    this.observePerformance();
  }

  /** Collect all current context into a snapshot */
  collect(): CollectedContext {
    const breadcrumbs = this.breadcrumbs.getAll();
    const consoleLogs = this.consoleLogs.getAll();
    const apiErrors = this.apiErrors.getAll();

    // Build legacy aliases from enriched data
    const actions: UserAction[] = breadcrumbs
      .filter((b) => b.type === 'click' || b.type === 'navigation' || b.type === 'input')
      .map((b) => ({
        type: b.type as 'click' | 'navigation' | 'input',
        target: b.message,
        timestamp: b.timestamp,
        detail: b.data?.text as string | undefined,
      }));

    const consoleErrors: ConsoleError[] = consoleLogs
      .filter((l) => l.level === 'error')
      .map((l) => ({ message: l.message, timestamp: l.timestamp }));

    return {
      sessionId: this.sessionId,
      device: parseDeviceInfo(),
      breadcrumbs,
      consoleLogs,
      apiErrors,
      performance: getPerformanceMetrics(),
      app: this.getCustomContext?.() ?? {},
      url: window.location.href,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
      // Legacy aliases
      actions,
      consoleErrors,
    };
  }

  /** Clean up all listeners and patches */
  destroy() {
    for (const fn of this.cleanupFns) fn();
    this.cleanupFns = [];
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
      this.originalFetch = null;
    }
  }

  // ── Private: breadcrumb trail (clicks, navigation, input, focus) ──

  private observeBreadcrumbs() {
    // Click events
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const tag = target.tagName.toLowerCase();
      const id = target.id ? `#${target.id}` : '';
      const cls = target.className && typeof target.className === 'string'
        ? `.${target.className.split(' ').slice(0, 2).join('.')}`
        : '';
      const text = target.textContent?.slice(0, 50)?.trim() || '';

      this.breadcrumbs.push({
        type: 'click',
        category: 'ui',
        message: `${tag}${id}${cls}`,
        data: text ? { text } : undefined,
        timestamp: Date.now(),
      });
    };
    document.addEventListener('click', handleClick, { capture: true, passive: true });
    this.cleanupFns.push(() => document.removeEventListener('click', handleClick, { capture: true }));

    // Navigation via popstate
    const handleNav = () => {
      this.breadcrumbs.push({
        type: 'navigation',
        category: 'ui',
        message: window.location.pathname,
        timestamp: Date.now(),
      });
    };
    window.addEventListener('popstate', handleNav);
    this.cleanupFns.push(() => window.removeEventListener('popstate', handleNav));

    // Input events (no value for security — just tag + name)
    const handleInput = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const tag = target.tagName.toLowerCase();
      const name = (target as HTMLInputElement).name || (target as HTMLInputElement).id || '';
      this.breadcrumbs.push({
        type: 'input',
        category: 'ui',
        message: `${tag}${name ? `[name="${name}"]` : ''}`,
        timestamp: Date.now(),
      });
    };
    document.addEventListener('change', handleInput, { capture: true, passive: true });
    this.cleanupFns.push(() => document.removeEventListener('change', handleInput, { capture: true }));

    // Focus events on interactive elements
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!target || !target.tagName) return;
      const tag = target.tagName.toLowerCase();
      if (!['input', 'textarea', 'select', 'button', 'a'].includes(tag)) return;
      const id = target.id ? `#${target.id}` : '';
      this.breadcrumbs.push({
        type: 'focus',
        category: 'ui',
        message: `${tag}${id}`,
        timestamp: Date.now(),
      });
    };
    document.addEventListener('focusin', handleFocus, { capture: true, passive: true });
    this.cleanupFns.push(() => document.removeEventListener('focusin', handleFocus, { capture: true }));
  }

  // ── Private: console log/warn/info/error capture ──────────────

  private observeConsoleLogs() {
    const levels = ['log', 'info', 'warn', 'error'] as const;
    const originals: Record<string, (...args: unknown[]) => void> = {};

    for (const level of levels) {
      originals[level] = console[level];
      console[level] = (...args: unknown[]) => {
        const message = args.map((a) => {
          if (typeof a === 'string') return a;
          if (a instanceof Error) return a.message;
          try { return JSON.stringify(a); } catch { return String(a); }
        }).join(' ').slice(0, 300);

        let stack: string | undefined;
        if (level === 'error' || level === 'warn') {
          const errorArg = args.find((a) => a instanceof Error) as Error | undefined;
          if (errorArg?.stack) {
            stack = errorArg.stack.slice(0, 500);
          }
        }

        this.consoleLogs.push({ level, message, stack, timestamp: Date.now() });

        // Also add to breadcrumb trail for console errors/warnings
        if (level === 'error' || level === 'warn') {
          this.breadcrumbs.push({
            type: 'console',
            category: 'console',
            message: message.slice(0, 80),
            data: { level },
            timestamp: Date.now(),
          });
        }

        originals[level].apply(console, args);
      };
    }

    this.cleanupFns.push(() => {
      for (const level of levels) {
        console[level] = originals[level];
      }
    });

    // Unhandled errors
    const handleError = (e: ErrorEvent) => {
      this.consoleLogs.push({
        level: 'error',
        message: `Unhandled: ${e.message}`.slice(0, 300),
        stack: e.error?.stack?.slice(0, 500),
        timestamp: Date.now(),
      });
    };
    window.addEventListener('error', handleError);
    this.cleanupFns.push(() => window.removeEventListener('error', handleError));

    // Unhandled promise rejections
    const handleRejection = (e: PromiseRejectionEvent) => {
      const err = e.reason instanceof Error ? e.reason : null;
      const msg = err ? err.message : String(e.reason);
      this.consoleLogs.push({
        level: 'error',
        message: `Unhandled rejection: ${msg}`.slice(0, 300),
        stack: err?.stack?.slice(0, 500),
        timestamp: Date.now(),
      });
    };
    window.addEventListener('unhandledrejection', handleRejection);
    this.cleanupFns.push(() => window.removeEventListener('unhandledrejection', handleRejection));
  }

  // ── Private: intercept fetch for API errors + breadcrumbs ──────

  private interceptFetch() {
    this.originalFetch = window.fetch;
    const self = this;

    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const method = (init?.method || 'GET').toUpperCase();
      const startTime = performance.now();

      try {
        const response = await self.originalFetch!.call(window, input, init);
        const duration = Math.round(performance.now() - startTime);

        if (!response.ok && response.status >= 400) {
          // Try to read response body for error context
          let responseBody = '';
          try {
            const cloned = response.clone();
            const text = await cloned.text();
            responseBody = text.slice(0, 200);
          } catch { /* body not readable */ }

          self.apiErrors.push({
            url: url.slice(0, 200),
            method,
            status: response.status,
            statusText: response.statusText || '',
            duration,
            responseBody,
            timestamp: Date.now(),
          });

          // Add XHR breadcrumb for failed requests
          self.breadcrumbs.push({
            type: 'xhr',
            category: 'http',
            message: `${method} ${url.slice(0, 80)} → ${response.status}`,
            data: { status: response.status, duration },
            timestamp: Date.now(),
          });
        }

        return response;
      } catch (err) {
        const duration = Math.round(performance.now() - startTime);
        self.apiErrors.push({
          url: url.slice(0, 200),
          method,
          status: 0,
          statusText: 'Network Error',
          duration,
          responseBody: err instanceof Error ? err.message.slice(0, 200) : '',
          timestamp: Date.now(),
        });

        self.breadcrumbs.push({
          type: 'xhr',
          category: 'http',
          message: `${method} ${url.slice(0, 80)} → Network Error`,
          data: { status: 0, duration },
          timestamp: Date.now(),
        });

        throw err;
      }
    };
  }

  // ── Private: observe LCP + CLS ───────────────────────────────

  private observePerformance() {
    try {
      // LCP observer
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          _lcpValue = entries[entries.length - 1].startTime;
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      this.cleanupFns.push(() => lcpObserver.disconnect());
    } catch { /* not supported */ }

    try {
      // CLS observer
      _clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as { hadRecentInput?: boolean }).hadRecentInput) {
            _clsValue = (_clsValue ?? 0) + ((entry as { value?: number }).value ?? 0);
          }
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      this.cleanupFns.push(() => clsObserver.disconnect());
    } catch { /* not supported */ }
  }
}
