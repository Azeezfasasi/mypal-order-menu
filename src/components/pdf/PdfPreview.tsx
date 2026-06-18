"use client";

import { usePdfPreview } from "@/hooks/usePdfPreview";
import React, { useEffect, useMemo, useRef, useState } from "react";

interface PdfPreviewProps {
  file: File | null;
  maxPages?: number;
  scale?: number;
  className?: string;
  // prefer react-pdf if available
  preferReactPdf?: boolean;
}

export default function PdfPreview({
  file,
  maxPages = 3,
  scale = 1.2,
  className = "",
  preferReactPdf = true,
}: PdfPreviewProps) {
  // Responsive helpers: compute adaptive scale and page rendering width
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const [computedScale, setComputedScale] = useState<number>(scale);
  const [computedMaxPages, setComputedMaxPages] = useState<number>(maxPages);

  useEffect(() => {
    // Set initial container width and listen for resizes
    function update() {
      const width =
        (containerRef.current && containerRef.current.clientWidth) ||
        (typeof window !== "undefined" ? window.innerWidth : 1024);
      setContainerWidth(width);

      // Heuristics: smaller screens -> smaller scale and fewer pages
      if (width < 480) {
        setComputedScale(Math.min(scale, 0.9));
        setComputedMaxPages(Math.min(maxPages, 1));
      } else if (width < 768) {
        setComputedScale(Math.min(scale, 1.0));
        setComputedMaxPages(Math.min(maxPages, 2));
      } else {
        setComputedScale(scale);
        setComputedMaxPages(maxPages);
      }
    }

    update();
    if (typeof window !== "undefined") {
      window.addEventListener("resize", update);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", update);
      }
    };
  }, [scale, maxPages]);

  // Pass computed values to the hook
  const { loading, images, numPages, error } = usePdfPreview(file, {
    scale: computedScale,
    maxPages: computedMaxPages,
  });

  const [reactPdfAvailable, setReactPdfAvailable] = useState(false);
  const [ReactPdfComponents, setReactPdfComponents] = useState<{
    Document: React.ComponentType<Record<string, unknown>> | null;
    Page: React.ComponentType<Record<string, unknown>> | null;
    pdfjs: Record<string, unknown> | null;
  } | null>(null);

  // Blob URL for passing to react-pdf or iframe if needed
  const blobUrl = useMemo(() => {
    if (!file) return null;
    try {
      return URL.createObjectURL(file);
    } catch {
      return null;
    }
  }, [file]);

  useEffect(() => {
    let mounted = true;
    if (!preferReactPdf) return;

    (async () => {
      try {
        const mod = await import("react-pdf");

        if (!mounted) return;
        setReactPdfComponents({
          Document: mod.Document ?? null,
          Page: mod.Page ?? null,
          pdfjs: null,
        });
        setReactPdfAvailable(true);
      } catch {
        setReactPdfAvailable(false);
        setReactPdfComponents(null);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [preferReactPdf]);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  if (!file) return <div className={className}>No file selected</div>;

  if (error)
    return (
      <div className={className}>
        <p>Unable to preview PDF</p>
        <pre>{error.message}</pre>
      </div>
    );

  // If react-pdf available and we have blob URL, use it to render pages
  if (
    reactPdfAvailable &&
    ReactPdfComponents &&
    ReactPdfComponents.Document &&
    ReactPdfComponents.Page &&
    blobUrl
  ) {
    const Document = ReactPdfComponents.Document as React.ElementType;
    const Page = ReactPdfComponents.Page as React.ElementType;

    // compute page width to fit container (leave some padding)
    const pageWidth = Math.min(800, (containerWidth ?? 800) - 24);

    return (
      <div ref={containerRef} className={`pdf-preview ${className}`}>
        <Document
          file={blobUrl}
          loading={<div>Loading PDF…</div>}
          error={<div>Failed to load PDF</div>}
        >
          {Array.from({
            length: Math.min(numPages ?? computedMaxPages, computedMaxPages),
          }).map((_, idx) => (
            <div key={idx} style={{ marginBottom: 12 }}>
              <Page
                pageNumber={idx + 1}
                width={pageWidth}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </div>
          ))}
        </Document>
      </div>
    );
  }

  // Fallback: image previews from pdfjs rendering hook
  return (
    <div ref={containerRef} className={`pdf-preview ${className}`}>
      {loading && images.length === 0 && <div>Rendering preview…</div>}

      {images.length > 0 ? (
        <div className="grid gap-4">
          {images.map((src, idx) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={idx}
              src={src}
              alt={`page-${idx + 1}`}
              style={{ maxWidth: "100%", height: "auto", borderRadius: 6 }}
            />
          ))}
          {numPages && numPages > images.length && (
            <div className="text-sm text-neutral-500">{`+${numPages - images.length} more pages`}</div>
          )}
        </div>
      ) : (
        !loading && <div>No preview available</div>
      )}
    </div>
  );
}
