// ── Automatic Context Collector ──────────────────────────────────
// Captures browser environment, user actions, API errors, console
// errors, and performance metrics to enrich feedback submissions.

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

export interface UserAction {
  type: 'click' | 'navigation' | 'input';
  target: string;
  timestamp: number;
  detail?: string;
}

export interface ApiError {
  url: string;
  method: string;
  status: number;
  timestamp: number;
}

export interface ConsoleError {
  message: string;
  timestamp: number;
}

export interface PerformanceMetrics {
  fcp: number | null;
  lcp: number | null;
  cls: number | null;
  ttfb: number | null;
  timeOnPage: number;
}

export interface CollectedContext {
  device: DeviceInfo;
  actions: UserAction[];
  apiErrors: ApiError[];
  consoleErrors: ConsoleError[];
  performance: PerformanceMetrics;
  url: string;
  referrer: string;
  timestamp: string;
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
  private actions = new RingBuffer<UserAction>(10);
  private apiErrors = new RingBuffer<ApiError>(5);
  private consoleErrors = new RingBuffer<ConsoleError>(10);
  private cleanupFns: (() => void)[] = [];
  private originalFetch: typeof fetch | null = null;

  /** Start collecting context data. Call destroy() to clean up. */
  start() {
    this.observeActions();
    this.observeConsoleErrors();
    this.interceptFetch();
    this.observePerformance();
  }

  /** Collect all current context into a snapshot */
  collect(): CollectedContext {
    return {
      device: parseDeviceInfo(),
      actions: this.actions.getAll(),
      apiErrors: this.apiErrors.getAll(),
      consoleErrors: this.consoleErrors.getAll(),
      performance: getPerformanceMetrics(),
      url: window.location.href,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
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

  // ── Private: track user actions ──────────────────────────────

  private observeActions() {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const tag = target.tagName.toLowerCase();
      const text = target.textContent?.slice(0, 50)?.trim() || '';
      const id = target.id ? `#${target.id}` : '';
      const cls = target.className && typeof target.className === 'string'
        ? `.${target.className.split(' ').slice(0, 2).join('.')}`
        : '';

      this.actions.push({
        type: 'click',
        target: `${tag}${id}${cls}`,
        timestamp: Date.now(),
        detail: text || undefined,
      });
    };

    document.addEventListener('click', handleClick, { capture: true, passive: true });
    this.cleanupFns.push(() => document.removeEventListener('click', handleClick, { capture: true }));

    // Track navigations via popstate
    const handleNav = () => {
      this.actions.push({
        type: 'navigation',
        target: window.location.pathname,
        timestamp: Date.now(),
      });
    };

    window.addEventListener('popstate', handleNav);
    this.cleanupFns.push(() => window.removeEventListener('popstate', handleNav));
  }

  // ── Private: capture console errors ──────────────────────────

  private observeConsoleErrors() {
    const origError = console.error;
    console.error = (...args: unknown[]) => {
      const message = args.map((a) =>
        typeof a === 'string' ? a : a instanceof Error ? a.message : String(a)
      ).join(' ').slice(0, 200);

      this.consoleErrors.push({ message, timestamp: Date.now() });
      origError.apply(console, args);
    };

    this.cleanupFns.push(() => { console.error = origError; });

    // Also capture unhandled errors
    const handleError = (e: ErrorEvent) => {
      this.consoleErrors.push({
        message: `Unhandled: ${e.message}`.slice(0, 200),
        timestamp: Date.now(),
      });
    };

    window.addEventListener('error', handleError);
    this.cleanupFns.push(() => window.removeEventListener('error', handleError));

    // Unhandled promise rejections
    const handleRejection = (e: PromiseRejectionEvent) => {
      const msg = e.reason instanceof Error ? e.reason.message : String(e.reason);
      this.consoleErrors.push({
        message: `Unhandled rejection: ${msg}`.slice(0, 200),
        timestamp: Date.now(),
      });
    };

    window.addEventListener('unhandledrejection', handleRejection);
    this.cleanupFns.push(() => window.removeEventListener('unhandledrejection', handleRejection));
  }

  // ── Private: intercept fetch for API errors ──────────────────

  private interceptFetch() {
    this.originalFetch = window.fetch;
    const self = this;

    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const method = init?.method || 'GET';

      try {
        const response = await self.originalFetch!.call(window, input, init);
        if (!response.ok && response.status >= 400) {
          self.apiErrors.push({
            url: url.slice(0, 200),
            method: method.toUpperCase(),
            status: response.status,
            timestamp: Date.now(),
          });
        }
        return response;
      } catch (err) {
        self.apiErrors.push({
          url: url.slice(0, 200),
          method: method.toUpperCase(),
          status: 0,
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
