import { useEffect, useRef, useState } from "react";

export interface UsePdfPreviewOptions {
  scale?: number; // rendering scale (1.0 = default)
  maxPages?: number; // max pages to render (default: 5)
}

export interface UsePdfPreviewResult {
  loading: boolean;
  images: string[]; // data URLs
  numPages?: number;
  error?: Error | null;
  progress?: number; // 0..1
}

export function usePdfPreview(
  file: File | null,
  options: UsePdfPreviewOptions = {},
): UsePdfPreviewResult {
  const { scale = 1.5, maxPages = 5 } = options;
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [numPages, setNumPages] = useState<number | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState<number | undefined>(0);

  const cancelRef = useRef(false);

  useEffect(() => {
    cancelRef.current = false;
    setImages([]);
    setError(null);
    setNumPages(undefined);
    setProgress(0);

    if (!file) {
      setLoading(false);
      return;
    }

    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        const arrayBuffer = await file.arrayBuffer();

        if (!mounted || cancelRef.current) return;

        // Dynamically import pdfjs to avoid static type/module resolution issues
        const pdfjs = (await import(
          "pdfjs-dist"
        )) as typeof import("pdfjs-dist");
        try {
          // configure worker (fallback to CDN)
          pdfjs.GlobalWorkerOptions.workerSrc =
            typeof window !== "undefined"
              ? "https://unpkg.com/pdfjs-dist/build/pdf.worker.min.js"
              : "";
        } catch {
          // ignore
        }

        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        // Track progress if available
        loadingTask.onProgress = (p: import("pdfjs-dist").PDFProgressData) => {
          try {
            const ratio = p && p.loaded && p.total ? p.loaded / p.total : 0;
            if (mounted) setProgress(ratio);
          } catch {
            // ignore
          }
        };

        const pdf =
          (await loadingTask.promise) as import("pdfjs-dist").PDFDocumentProxy;

        if (!mounted || cancelRef.current) return;

        const pagesToRender = Math.min(pdf.numPages, maxPages);
        setNumPages(pdf.numPages);

        const rendered: string[] = [];

        for (let i = 1; i <= pagesToRender; i++) {
          if (!mounted || cancelRef.current) break;

          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);

          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Failed to get canvas context");

          // Render the page into the canvas
          const renderTask = page.render({
            canvasContext: ctx,
            canvas,
            viewport,
          });
          await renderTask.promise;

          if (!mounted || cancelRef.current) break;

          // Convert to data URL (png)
          const dataUrl = canvas.toDataURL("image/png");
          rendered.push(dataUrl);

          // Update partial results for better UX
          if (mounted) setImages((prev) => [...prev, dataUrl]);
        }

        if (mounted && !cancelRef.current) {
          setImages(rendered);
        }
      } catch (err) {
        if (mounted && !cancelRef.current) setError(err as Error);
      } finally {
        if (mounted && !cancelRef.current) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      cancelRef.current = true;
    };
  }, [file, scale, maxPages]);

  return { loading, images, numPages, error, progress: progress ?? 0 };
}
