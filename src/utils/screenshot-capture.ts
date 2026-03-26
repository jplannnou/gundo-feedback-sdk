/**
 * Force cross-origin images to reload with CORS headers so html2canvas can read them.
 * Without this, the browser may serve a cached non-CORS response which taints the canvas.
 */
function prepareCrossOriginImages(root: HTMLElement): () => void {
  const images = root.querySelectorAll('img');
  const originals: { img: HTMLImageElement; crossOrigin: string | null; src: string }[] = [];

  for (const img of images) {
    const src = img.src || '';
    if (!src || src.startsWith('data:') || src.startsWith('blob:')) continue;

    try {
      const imgUrl = new URL(src, window.location.origin);
      if (imgUrl.origin !== window.location.origin && !img.crossOrigin) {
        originals.push({ img, crossOrigin: img.crossOrigin, src: img.src });
        img.crossOrigin = 'anonymous';
        // Bust browser cache to force re-fetch with CORS
        const separator = img.src.includes('?') ? '&' : '?';
        img.src = img.src + separator + '_cors=1';
      }
    } catch {
      // invalid URL, skip
    }
  }

  return () => {
    for (const { img, crossOrigin, src } of originals) {
      img.crossOrigin = crossOrigin;
      img.src = src;
    }
  };
}

/**
 * Hide cross-origin images by replacing their src with a transparent pixel.
 * Used as a fallback when CORS capture fails — produces a screenshot without
 * external images rather than no screenshot at all.
 */
const TRANSPARENT_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

function hideCrossOriginImages(root: HTMLElement): () => void {
  const images = root.querySelectorAll('img');
  const originals: { img: HTMLImageElement; src: string; crossOrigin: string | null }[] = [];

  for (const img of images) {
    const src = img.src || '';
    if (!src || src.startsWith('data:') || src.startsWith('blob:')) continue;

    try {
      const imgUrl = new URL(src, window.location.origin);
      if (imgUrl.origin !== window.location.origin) {
        originals.push({ img, src: img.src, crossOrigin: img.crossOrigin });
        img.src = TRANSPARENT_PIXEL;
        img.crossOrigin = null;
      }
    } catch {
      // invalid URL, skip
    }
  }

  return () => {
    for (const { img, src, crossOrigin } of originals) {
      img.src = src;
      img.crossOrigin = crossOrigin;
    }
  };
}

/**
 * Wait for all images inside root to finish loading (or fail), up to a timeout.
 */
function waitForImages(root: HTMLElement, timeoutMs: number): Promise<void> {
  const images = root.querySelectorAll('img');
  const pending: Promise<void>[] = [];

  for (const img of images) {
    if (!img.complete) {
      pending.push(new Promise<void>(resolve => {
        img.addEventListener('load', () => resolve(), { once: true });
        img.addEventListener('error', () => resolve(), { once: true });
      }));
    }
  }

  if (pending.length === 0) return Promise.resolve();

  return Promise.race([
    Promise.all(pending).then(() => {}),
    new Promise<void>(resolve => setTimeout(resolve, timeoutMs)),
  ]);
}

/**
 * Capture a screenshot of an HTML element using html2canvas.
 * html2canvas is dynamically imported to avoid bundling it in the main chunk.
 * Consumer projects must install html2canvas as a dependency.
 *
 * Strategy: try CORS-clean capture first. If that fails (tainted canvas, CORS errors),
 * fall back to capturing with cross-origin images hidden (degraded but functional).
 */
export async function captureElementScreenshot(element: HTMLElement): Promise<Blob> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod = await import('html2canvas' as any);
  const html2canvas = mod.default || mod;

  // Attempt 1: CORS-clean capture (best quality)
  const restoreCors = prepareCrossOriginImages(element);
  await waitForImages(element, 2000);

  try {
    const canvas = await html2canvas(element, {
      scale: Math.min(window.devicePixelRatio || 1, 2),
      backgroundColor: '#1a1a2e',
      useCORS: true,
      allowTaint: false,
      logging: false,
    });
    const blob = await canvasToBlob(canvas);
    restoreCors();
    return blob;
  } catch (corsError) {
    restoreCors();
    console.warn('[feedback-sdk] CORS capture failed, retrying without external images:', corsError);
  }

  // Attempt 2: Hide cross-origin images and capture without them
  const restoreHidden = hideCrossOriginImages(element);

  try {
    const canvas = await html2canvas(element, {
      scale: Math.min(window.devicePixelRatio || 1, 2),
      backgroundColor: '#1a1a2e',
      useCORS: false,
      allowTaint: false,
      logging: false,
    });
    const blob = await canvasToBlob(canvas);
    restoreHidden();
    return blob;
  } catch (fallbackError) {
    restoreHidden();
    console.error('[feedback-sdk] Screenshot capture failed completely:', fallbackError);
    throw fallbackError;
  }
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
          reject(new Error(`[feedback-sdk] canvas.toBlob returned ${blob ? 'empty blob' : 'null'} (canvas ${canvas.width}x${canvas.height})`));
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
    logging: false,
  });
  return canvasToBlob(canvas);
}
