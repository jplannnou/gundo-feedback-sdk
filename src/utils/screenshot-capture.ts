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
 * Capture a screenshot of an HTML element using html2canvas.
 * html2canvas is dynamically imported to avoid bundling it in the main chunk.
 * Consumer projects must install html2canvas as a dependency.
 */
export async function captureElementScreenshot(element: HTMLElement): Promise<Blob> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod = await import('html2canvas' as any);
  const html2canvas = mod.default || mod;

  // Patch cross-origin images to load with CORS, wait briefly for reload
  const restore = prepareCrossOriginImages(element);
  await new Promise(r => setTimeout(r, 200));

  try {
    const canvas = await html2canvas(element, {
      scale: Math.min(window.devicePixelRatio || 1, 2),
      backgroundColor: '#1a1a2e',
      useCORS: true,
      allowTaint: false,
      logging: false,
    });
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob: Blob | null) => {
        restore();
        if (blob) resolve(blob);
        else reject(new Error('Failed to capture screenshot'));
      }, 'image/png');
    });
  } catch (err) {
    restore();
    throw err;
  }
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
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob: Blob | null) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to capture area screenshot'));
    }, 'image/png');
  });
}
