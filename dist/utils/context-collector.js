// ── Automatic Context Collector ──────────────────────────────────
// Captures browser environment, user actions (breadcrumbs), console
// logs, API errors, and performance metrics to enrich feedback submissions.
// ── Ring buffer for capped arrays ────────────────────────────────
class RingBuffer {
    maxSize;
    items = [];
    constructor(maxSize) {
        this.maxSize = maxSize;
    }
    push(item) {
        if (this.items.length >= this.maxSize)
            this.items.shift();
        this.items.push(item);
    }
    getAll() {
        return [...this.items];
    }
    clear() {
        this.items = [];
    }
}
// ── Device detection (no external deps) ──────────────────────────
function parseDeviceInfo() {
    const ua = navigator.userAgent;
    // Browser detection
    let browser = 'Unknown';
    let browserVersion = '';
    if (ua.includes('Firefox/')) {
        browser = 'Firefox';
        browserVersion = ua.match(/Firefox\/([\d.]+)/)?.[1] ?? '';
    }
    else if (ua.includes('Edg/')) {
        browser = 'Edge';
        browserVersion = ua.match(/Edg\/([\d.]+)/)?.[1] ?? '';
    }
    else if (ua.includes('Chrome/')) {
        browser = 'Chrome';
        browserVersion = ua.match(/Chrome\/([\d.]+)/)?.[1] ?? '';
    }
    else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
        browser = 'Safari';
        browserVersion = ua.match(/Version\/([\d.]+)/)?.[1] ?? '';
    }
    // OS detection
    let os = 'Unknown';
    let osVersion = '';
    if (ua.includes('Windows')) {
        os = 'Windows';
        osVersion = ua.match(/Windows NT ([\d.]+)/)?.[1] ?? '';
    }
    else if (ua.includes('Mac OS X')) {
        os = 'macOS';
        osVersion = (ua.match(/Mac OS X ([\d_]+)/)?.[1] ?? '').replace(/_/g, '.');
    }
    else if (ua.includes('Linux')) {
        os = 'Linux';
    }
    else if (ua.includes('Android')) {
        os = 'Android';
        osVersion = ua.match(/Android ([\d.]+)/)?.[1] ?? '';
    }
    else if (/iPhone|iPad/.test(ua)) {
        os = 'iOS';
        osVersion = (ua.match(/OS ([\d_]+)/)?.[1] ?? '').replace(/_/g, '.');
    }
    // Device type
    const width = window.innerWidth;
    const device = width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop';
    // Network type
    const conn = navigator.connection;
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
function getPerformanceMetrics() {
    let fcp = null;
    let lcp = null;
    let cls = null;
    let ttfb = null;
    try {
        const entries = performance.getEntriesByType('paint');
        const fcpEntry = entries.find((e) => e.name === 'first-contentful-paint');
        if (fcpEntry)
            fcp = Math.round(fcpEntry.startTime);
    }
    catch { /* not supported */ }
    try {
        const navEntries = performance.getEntriesByType('navigation');
        if (navEntries.length > 0) {
            ttfb = Math.round(navEntries[0].responseStart - navEntries[0].requestStart);
        }
    }
    catch { /* not supported */ }
    // LCP and CLS are stored by observers if running
    if (_lcpValue !== null)
        lcp = Math.round(_lcpValue);
    if (_clsValue !== null)
        cls = Math.round(_clsValue * 1000) / 1000;
    const timeOnPage = Math.round(performance.now() / 1000);
    return { fcp, lcp, cls, ttfb, timeOnPage };
}
// ── Module-level storage for observer values ─────────────────────
let _lcpValue = null;
let _clsValue = null;
// ── Context Collector Class ──────────────────────────────────────
export class ContextCollector {
    sessionId;
    breadcrumbs = new RingBuffer(50);
    consoleLogs = new RingBuffer(30);
    apiErrors = new RingBuffer(10);
    cleanupFns = [];
    originalFetch = null;
    getCustomContext;
    constructor(getCustomContext) {
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
    collect() {
        const breadcrumbs = this.breadcrumbs.getAll();
        const consoleLogs = this.consoleLogs.getAll();
        const apiErrors = this.apiErrors.getAll();
        // Build legacy aliases from enriched data
        const actions = breadcrumbs
            .filter((b) => b.type === 'click' || b.type === 'navigation' || b.type === 'input')
            .map((b) => ({
            type: b.type,
            target: b.message,
            timestamp: b.timestamp,
            detail: b.data?.text,
        }));
        const consoleErrors = consoleLogs
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
        for (const fn of this.cleanupFns)
            fn();
        this.cleanupFns = [];
        if (this.originalFetch) {
            window.fetch = this.originalFetch;
            this.originalFetch = null;
        }
    }
    // ── Private: breadcrumb trail (clicks, navigation, input, focus) ──
    observeBreadcrumbs() {
        // Click events
        const handleClick = (e) => {
            const target = e.target;
            if (!target)
                return;
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
        const handleInput = (e) => {
            const target = e.target;
            if (!target)
                return;
            const tag = target.tagName.toLowerCase();
            const name = target.name || target.id || '';
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
        const handleFocus = (e) => {
            const target = e.target;
            if (!target || !target.tagName)
                return;
            const tag = target.tagName.toLowerCase();
            if (!['input', 'textarea', 'select', 'button', 'a'].includes(tag))
                return;
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
    observeConsoleLogs() {
        const levels = ['log', 'info', 'warn', 'error'];
        const originals = {};
        for (const level of levels) {
            originals[level] = console[level];
            console[level] = (...args) => {
                const message = args.map((a) => typeof a === 'string' ? a : a instanceof Error ? a.message : String(a)).join(' ').slice(0, 300);
                let stack;
                if (level === 'error' || level === 'warn') {
                    const errorArg = args.find((a) => a instanceof Error);
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
        const handleError = (e) => {
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
        const handleRejection = (e) => {
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
    interceptFetch() {
        this.originalFetch = window.fetch;
        const self = this;
        window.fetch = async function (input, init) {
            const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
            const method = (init?.method || 'GET').toUpperCase();
            const startTime = performance.now();
            try {
                const response = await self.originalFetch.call(window, input, init);
                const duration = Math.round(performance.now() - startTime);
                if (!response.ok && response.status >= 400) {
                    // Try to read response body for error context
                    let responseBody = '';
                    try {
                        const cloned = response.clone();
                        const text = await cloned.text();
                        responseBody = text.slice(0, 200);
                    }
                    catch { /* body not readable */ }
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
            }
            catch (err) {
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
    observePerformance() {
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
        }
        catch { /* not supported */ }
        try {
            // CLS observer
            _clsValue = 0;
            const clsObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        _clsValue = (_clsValue ?? 0) + (entry.value ?? 0);
                    }
                }
            });
            clsObserver.observe({ type: 'layout-shift', buffered: true });
            this.cleanupFns.push(() => clsObserver.disconnect());
        }
        catch { /* not supported */ }
    }
}
//# sourceMappingURL=context-collector.js.map