/**
 * Screenshot capture utility.
 *
 * Primary: html-to-image (uses browser-native SVG foreignObject rendering,
 * supports ALL modern CSS including oklch/oklab from Tailwind 4).
 *
 * Fallback: html2canvas (for consumers that haven't installed html-to-image).
 *
 * Consumer projects should install html-to-image as a dependency:
 *   pnpm add html-to-image
 */

/**
 * Capture a screenshot of an HTML element.
 * Tries html-to-image first (modern CSS compatible), falls back to html2canvas.
 */
export async function captureElementScreenshot(element: HTMLElement): Promise<Blob> {
  // Attempt 1: html-to-image (preferred — supports oklch, oklab, modern CSS)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const htmlToImage = await import('html-to-image' as any);
    const toPng = htmlToImage.toPng || htmlToImage.default?.toPng;

    if (toPng) {
      const dataUrl = await toPng(element, {
        backgroundColor: '#1a1a2e',
        pixelRatio: 1,
        skipFonts: true,
        cacheBust: false,
        // Skip the SDK's own overlays (highlight, form panel, toggle button)
        // so they don't end up rasterized inside the screenshot.
        filter: (node: HTMLElement) =>
          !(node?.dataset && node.dataset.reviewMode !== undefined),
      });
      const blob = dataUrlToBlob(dataUrl);
      if (blob && blob.size > 0) return blob;
      console.warn('[feedback-sdk] html-to-image produced empty result, trying html2canvas');
    }
  } catch (err) {
    console.warn('[feedback-sdk] html-to-image failed, trying html2canvas:', err);
  }

  // Attempt 2: html2canvas (legacy fallback)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = await import('html2canvas' as any);
    const html2canvas = mod.default || mod;

    const canvas = await html2canvas(element, {
      scale: 1,
      backgroundColor: '#1a1a2e',
      useCORS: true,
      allowTaint: true,
      logging: false,
      ignoreElements: (el: Element) =>
        el instanceof HTMLElement && el.dataset?.reviewMode !== undefined,
    });
    return canvasToBlob(canvas);
  } catch (err) {
    console.error('[feedback-sdk] Screenshot capture failed completely:', err);
    throw err;
  }
}

/**
 * Convert a data URL to a Blob.
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
  const raw = atob(parts[1]);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/**
 * Convert canvas to blob with proper error handling.
 */
function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    try {
      canvas.toBlob((blob: Blob | null) => {
        if (blob && blob.size > 0) {
          resolve(blob);
        } else {
          reject(new Error(`[feedback-sdk] canvas.toBlob returned ${blob ? 'empty blob' : 'null'}`));
        }
      }, 'image/png');
    } catch (err) {
      reject(new Error(`[feedback-sdk] canvas.toBlob threw: ${err}`));
    }
  });
}

/**
 * Capture a screenshot of the visible viewport area.
 */
export async function captureViewportScreenshot(): Promise<Blob> {
  return captureElementScreenshot(document.body);
}

/**
 * Capture a specific area of an image element.
 */
export async function captureAreaScreenshot(
  imageElement: HTMLElement,
  boundingBox: { x: number; y: number; width: number; height: number },
): Promise<Blob> {
  // For area capture, use html2canvas (html-to-image doesn't support partial capture)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod = await import('html2canvas' as any);
  const html2canvas = mod.default || mod;
  const rect = imageElement.getBoundingClientRect();
  const canvas = await html2canvas(imageElement, {
    scale: Math.min(window.devicePixelRatio || 1, 2),
    x: rect.width * boundingBox.x,
    y: rect.height * boundingBox.y,
    width: rect.width * boundingBox.width,
    height: rect.height * boundingBox.height,
    backgroundColor: null,
    useCORS: true,
    allowTaint: true,
    logging: false,
  });
  return canvasToBlob(canvas);
}
