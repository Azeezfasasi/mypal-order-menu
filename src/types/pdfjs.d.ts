// Type declarations for pdfjs imports used in the project
import * as React from "react";

declare module "pdfjs-dist/webpack";
declare module "pdfjs-dist/build/pdf.worker.entry";
declare module "pdfjs-dist";

declare module "react-pdf" {
  export const Document: React.ComponentType<Record<string, unknown>>;
  export const Page: React.ComponentType<Record<string, unknown>>;
  export const pdfjs: Record<string, unknown>;
  const _default: {
    Document: typeof Document;
    Page: typeof Page;
    pdfjs: typeof pdfjs;
  };
  export default _default;
}

declare module "pdfjs-dist" {
  export const GlobalWorkerOptions: { workerSrc?: string };

  export interface PDFProgressData {
    loaded?: number;
    total?: number;
  }

  export interface PDFLoadingTask<T = unknown> {
    promise: Promise<T>;
    onProgress?: (progressData: PDFProgressData) => void;
  }

  export interface PDFPageViewport {
    width: number;
    height: number;
  }

  export interface PDFPageProxy {
    getViewport(options: { scale: number }): PDFPageViewport;
    render(args: {
      canvasContext: CanvasRenderingContext2D;
      viewport: PDFPageViewport;
    }): { promise: Promise<void> };
  }

  export interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPageProxy>;
  }

  export function getDocument(src: unknown): PDFLoadingTask<PDFDocumentProxy>;
}
