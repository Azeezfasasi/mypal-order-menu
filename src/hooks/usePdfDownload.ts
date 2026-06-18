"use client";

import { useCallback, useState } from "react";

export interface PdfDownloadOptions {
  filename: string;
  margin?: number | [number, number, number, number];
  imageQuality?: number;
  scale?: number;
  format?: "a4" | "letter" | "legal";
  orientation?: "portrait" | "landscape";
}

export const usePdfDownload = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const downloadPdf = useCallback(
    async (
      element: HTMLElement | null,
      options: PdfDownloadOptions,
    ): Promise<boolean> => {
      if (!element) {
        setError(new Error("Element not found"));
        return false;
      }

      setIsDownloading(true);
      setError(null);

      try {
        // Dynamically import html2pdf to avoid SSR issues
        const html2pdf = (await import("html2pdf.js")).default;

        const {
          filename,
          margin = 0,
          imageQuality = 0.98,
          scale = 2,
          format = "a4",
          orientation = "portrait",
        } = options;

        const pdfOrientation: "portrait" | "landscape" =
          orientation === "portrait" ? "portrait" : "landscape";

        const opt = {
          margin,
          filename,
          image: { type: "jpeg" as const, quality: imageQuality },
          html2canvas: { scale, useCORS: true, logging: false },
          jsPDF: {
            unit: "in" as const,
            format,
            orientation: pdfOrientation,
          },
        };

        await html2pdf().set(opt).from(element).save();

        setIsDownloading(false);
        return true;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to generate PDF");
        setError(error);
        setIsDownloading(false);
        console.error("Error generating PDF:", error);
        return false;
      }
    },
    [],
  );

  return {
    downloadPdf,
    isDownloading,
    error,
  };
};
