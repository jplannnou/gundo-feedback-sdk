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
export declare class ContextCollector {
    private actions;
    private apiErrors;
    private consoleErrors;
    private cleanupFns;
    private originalFetch;
    /** Start collecting context data. Call destroy() to clean up. */
    start(): void;
    /** Collect all current context into a snapshot */
    collect(): CollectedContext;
    /** Clean up all listeners and patches */
    destroy(): void;
    private observeActions;
    private observeConsoleErrors;
    private interceptFetch;
    private observePerformance;
}
//# sourceMappingURL=context-collector.d.ts.map