/**
 * Capture a screenshot of an HTML element using html2canvas.
 * html2canvas is dynamically imported to avoid bundling it in the main chunk.
 * Consumer projects must install html2canvas as a dependency.
 */
export declare function captureElementScreenshot(element: HTMLElement): Promise<Blob>;
/**
 * Capture a screenshot of the visible viewport area.
 */
export declare function captureViewportScreenshot(): Promise<Blob>;
/**
 * Capture a specific area of an image element.
 */
export declare function captureAreaScreenshot(imageElement: HTMLElement, boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
}): Promise<Blob>;
//# sourceMappingURL=screenshot-capture.d.ts.map