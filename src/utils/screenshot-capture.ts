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

export interface CaptureOptions {
  /**
   * CSS selectors for elements the host app marks as sensitive (health data,
   * PII). They are dropped from the screenshot — the SDK never rasterizes them.
   * The defaults `[data-gundo-private]` / `.gundo-private` always apply on top
   * of whatever is passed here.
   */
  privateSelectors?: string[];
}

// Always-on markers: SDK consumers can opt any region out of capture with zero
// config, and the SDK's own overlays are skipped so they don't get rasterized.
const ALWAYS_EXCLUDED_SELECTORS = ['[data-gundo-private]', '.gundo-private'];

/**
 * True if a node must be kept out of the screenshot:
 * - the SDK's own overlays (`data-review-mode`),
 * - anything marked private by default markers or by the host's `privateSelectors`.
 * Excluding a node also excludes its subtree (both renderers stop recursing into
 * a dropped node), so marking a container is enough to redact everything inside.
 * Health / PII regions in GUNDO apps are marked private to stay out of feedback
 * screenshots (GDPR Art. 9).
 */
function isExcludedFromCapture(node: unknown, privateSelectors: string[]): boolean {
  if (!(node instanceof HTMLElement)) return false;
  if (node.dataset?.reviewMode !== undefined) return true;
  for (const sel of privateSelectors) {
    if (!sel) continue;
    try {
      if (node.matches(sel)) return true;
    } catch {
      // Ignore invalid selectors rather than failing the whole capture.
    }
  }
  return false;
}

/**
 * Capture a screenshot of an HTML element.
 * Tries html-to-image first (modern CSS compatible), falls back to html2canvas.
 */
export async function captureElementScreenshot(
  element: HTMLElement,
  options: CaptureOptions = {},
): Promise<Blob> {
  const privateSelectors = [...ALWAYS_EXCLUDED_SELECTORS, ...(options.privateSelectors ?? [])];

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
        // Skip the SDK's own overlays (highlight, form panel, toggle button) and
        // any host-marked private regions so they don't end up in the screenshot.
        filter: (node: HTMLElement) => !isExcludedFromCapture(node, privateSelectors),
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
      ignoreElements: (el: Element) => isExcludedFromCapture(el, privateSelectors),
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
export async function captureViewportScreenshot(options: CaptureOptions = {}): Promise<Blob> {
  return captureElementScreenshot(document.body, options);
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
