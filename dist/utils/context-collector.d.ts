/** Parsed browser/OS info without external deps */
export interface DeviceInfo {
    browser: string;
    browserVersion: string;
    os: string;
    osVersion: string;
    device: 'desktop' | 'tablet' | 'mobile';
    viewport: {
        width: number;
        height: number;
    };
    screen: {
        width: number;
        height: number;
    };
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
    actions: UserAction[];
    consoleErrors: ConsoleError[];
}
export declare class ContextCollector {
    private sessionId;
    private breadcrumbs;
    private consoleLogs;
    private apiErrors;
    private cleanupFns;
    private originalFetch;
    private getCustomContext;
    constructor(getCustomContext?: () => Record<string, unknown>);
    /** Start collecting context data. Call destroy() to clean up. */
    start(): void;
    /** Collect all current context into a snapshot */
    collect(): CollectedContext;
    /** Clean up all listeners and patches */
    destroy(): void;
    private observeBreadcrumbs;
    private observeConsoleLogs;
    private interceptFetch;
    private observePerformance;
}
//# sourceMappingURL=context-collector.d.ts.map