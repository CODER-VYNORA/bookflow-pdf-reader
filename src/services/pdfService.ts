import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Initialize PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

export type PDFDocument = pdfjsLib.PDFDocumentProxy;
export type PDFPage = pdfjsLib.PDFPageProxy;

// Cache documents in memory by bookId
const docCache = new Map<string, PDFDocument>();

export async function loadPdfDocument(
  source: Blob | ArrayBuffer | Uint8Array,
  cacheKey?: string
): Promise<PDFDocument> {
  if (cacheKey && docCache.has(cacheKey)) {
    return docCache.get(cacheKey)!;
  }

  let data: ArrayBuffer;
  if (source instanceof Blob) {
    data = await source.arrayBuffer();
  } else if (source instanceof Uint8Array) {
    data = source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength) as ArrayBuffer;
  } else {
    data = source;
  }

  const loadingTask = pdfjsLib.getDocument({
    data,
    // CMaps are copied into /cmaps during build so the reader does not
    // depend on an external CDN and can work offline after installation.
    cMapUrl: '/cmaps/',
    cMapPacked: true,
  });

  const pdfDoc = await loadingTask.promise;

  if (cacheKey) {
    docCache.set(cacheKey, pdfDoc);
  }

  return pdfDoc;
}

export function evictPdfCache(cacheKey: string) {
  const doc = docCache.get(cacheKey);
  if (doc) {
    try {
      (doc as any).destroy?.();
    } catch {
      // ignore
    }
    docCache.delete(cacheKey);
  }
}

export async function renderPageToCanvas(
  page: PDFPage,
  canvas: HTMLCanvasElement,
  scale: number = 1.5
): Promise<{ viewport: any; width: number; height: number }> {
  const pixelRatio = window.devicePixelRatio || 1;
  const viewport = page.getViewport({ scale });

  canvas.width = Math.floor(viewport.width * pixelRatio);
  canvas.height = Math.floor(viewport.height * pixelRatio);
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Could not get canvas 2d context');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const transform = pixelRatio !== 1 ? [pixelRatio, 0, 0, pixelRatio, 0, 0] : undefined;

  const renderContext: any = {
    canvasContext: ctx,
    canvas,
    viewport,
    transform,
  };

  await page.render(renderContext).promise;

  return { viewport, width: viewport.width, height: viewport.height };
}

export async function renderTextLayer(
  page: PDFPage,
  container: HTMLDivElement,
  viewport: any
): Promise<void> {
  container.innerHTML = '';
  container.style.width = `${viewport.width}px`;
  container.style.height = `${viewport.height}px`;

  try {
    const textContent = await page.getTextContent();
    const TextLayerClass = (pdfjsLib as any).TextLayer;

    if (TextLayerClass) {
      const textLayer = new TextLayerClass({
        textContentSource: textContent,
        container,
        viewport,
      });
      await textLayer.render();
    }
  } catch (err) {
    console.warn('Text layer render notice:', err);
  }
}

export async function getPageText(page: PDFPage): Promise<string> {
  try {
    const textContent = await page.getTextContent();
    return textContent.items
      .map((item: any) => item.str || '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  } catch {
    return '';
  }
}

export async function generateCoverThumbnail(doc: PDFDocument): Promise<string> {
  try {
    const firstPage = await doc.getPage(1);
    const viewport = firstPage.getViewport({ scale: 0.5 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    await firstPage.render({
      canvasContext: ctx,
      canvas,
      viewport,
    } as any).promise;

    return canvas.toDataURL('image/jpeg', 0.8);
  } catch (err) {
    console.warn('Failed to generate cover thumbnail:', err);
    return '';
  }
}
