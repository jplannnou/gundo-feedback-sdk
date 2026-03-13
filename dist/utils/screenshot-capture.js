/**
 * Capture a screenshot of an HTML element using html2canvas.
 * html2canvas is dynamically imported to avoid bundling it in the main chunk.
 * Consumer projects must install html2canvas as a dependency.
 */
export async function captureElementScreenshot(element) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = await import('html2canvas');
    const html2canvas = mod.default || mod;
    const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#1a1a2e',
        useCORS: true,
        logging: false,
    });
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob)
                resolve(blob);
            else
                reject(new Error('Failed to capture screenshot'));
        }, 'image/png');
    });
}
/**
 * Capture a screenshot of the visible viewport area.
 */
export async function captureViewportScreenshot() {
    return captureElementScreenshot(document.body);
}
/**
 * Capture a specific area of an image element.
 */
export async function captureAreaScreenshot(imageElement, boundingBox) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = await import('html2canvas');
    const html2canvas = mod.default || mod;
    const rect = imageElement.getBoundingClientRect();
    const canvas = await html2canvas(imageElement, {
        scale: 2,
        x: rect.width * boundingBox.x,
        y: rect.height * boundingBox.y,
        width: rect.width * boundingBox.width,
        height: rect.height * boundingBox.height,
        backgroundColor: null,
        useCORS: true,
        logging: false,
    });
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob)
                resolve(blob);
            else
                reject(new Error('Failed to capture area screenshot'));
        }, 'image/png');
    });
}
//# sourceMappingURL=screenshot-capture.js.map