# PDF Generation & Optimization Guide

## Overview

This guide covers comprehensive best practices for generating high-quality PDFs from HTML content in React applications. These techniques are applicable to any feature requiring PDF export—reports, documents, invoices, contracts, etc.

## Table of Contents

1. [Architecture](#architecture)
2. [Implementation](#implementation)
3. [Optimization Techniques](#optimization-techniques)
4. [Page Breaking & Layout](#page-breaking--layout)
5. [Performance Tips](#performance-tips)
6. [Troubleshooting](#troubleshooting)
7. [Testing](#testing)

---

## Architecture

### PDF Generation Pipeline

```
React Component
      ↓
HTML Element
      ↓
Canvas Rendering (html2canvas)
      ↓
PDF Creation (jsPDF)
      ↓
PDF Download/Save
```

### Core Dependencies

| Library       | Purpose                  | Size   |
| ------------- | ------------------------ | ------ |
| `html2pdf.js` | HTML to PDF conversion   | ~200KB |
| `html2canvas` | HTML to canvas rendering | ~400KB |
| `jsPDF`       | PDF document creation    | ~300KB |

---

## Implementation

### 1. PDF Download Hook

Create a reusable hook for all PDF operations:

```typescript
import { useCallback, useState } from "react";

export interface PdfDownloadOptions {
  filename: string;
  margin?: number | [number, number, number, number];
  imageQuality?: number;
  scale?: number;
  format?: "a4" | "letter" | "legal";
  orientation?: "portrait" | "landscape";
  compress?: boolean;
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
        const html2pdf = (await import("html2pdf.js")).default;

        const {
          filename,
          margin = 0,
          imageQuality = 0.98,
          scale = 2,
          format = "a4",
          orientation = "portrait",
        } = options;

        const opt = {
          margin,
          filename,
          image: { type: "jpeg", quality: imageQuality },
          html2canvas: { scale, useCORS: true, logging: false },
          jsPDF: {
            unit: "in",
            format,
            orientation: orientation === "portrait" ? "portrait" : "landscape",
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

  return { downloadPdf, isDownloading, error };
};
```

### 2. Basic PDF Export Component

```typescript
import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { usePdfDownload } from "@/hooks/usePdfDownload";

interface PdfExportProps {
  content: React.ReactNode;
  filename: string;
}

export function PdfExport({ content, filename }: PdfExportProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const { downloadPdf, isDownloading } = usePdfDownload();

  const handleDownload = async () => {
    await downloadPdf(contentRef.current, {
      filename,
      format: "a4",
      orientation: "portrait",
    });
  };

  return (
    <>
      <div ref={contentRef} style={{ display: "none" }}>
        {content}
      </div>

      <Button onClick={handleDownload} disabled={isDownloading}>
        {isDownloading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Generating PDF...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </>
        )}
      </Button>
    </>
  );
}
```

---

## Optimization Techniques

### 1. Page Breaking Prevention

**Problem:** Content gets split across pages awkwardly

**Solution:** Use CSS `pageBreakInside: "avoid"`

```typescript
const sectionStyle = {
  pageBreakInside: "avoid",
  marginBottom: "20px",
};

// Applied to:
<div style={sectionStyle}>
  <h2>Section Title</h2>
  <p>Section content stays together...</p>
</div>
```

**CSS Alternative:**

```css
.pdf-section {
  page-break-inside: avoid;
  margin-bottom: 20px;
}

.pdf-heading {
  page-break-after: avoid;
}

.pdf-table {
  page-break-inside: avoid;
}
```

### 2. Full-Width Content

**Problem:** Margins and centering waste PDF space

**Solution:** Remove max-width constraints for PDF

```typescript
// For PDF rendering
const pdfContainer = {
  width: "100%",
  maxWidth: "none",
  margin: 0,
  padding: 0,
  boxSizing: "border-box",
};

// For browser display
const screenContainer = {
  maxWidth: "800px",
  margin: "0 auto",
  padding: "20px",
};
```

### 3. Image Quality Management

**Problem:** Large images = large PDF file size; Poor images = unreadable

**Solution:** Balance quality with file size

```typescript
const options = {
  imageQuality: 0.98, // 98% quality (good balance)
  scale: 2, // 2x rendering for crisp output
};

// Scale options:
// 1 = normal (fast but may be blurry)
// 2 = 2x (better quality, slower)
// 3 = 3x (best quality, much slower)

// Quality options:
// 0.75 = 75% (small file, visible compression)
// 0.90 = 90% (good balance)
// 0.98 = 98% (high quality, larger file)
```

### 4. Margin Optimization

**Problem:** Default margins waste space; Custom margins complex

**Solution:** Use smart margin configuration

```typescript
// No margins (full width)
margin: 0;

// Symmetric: 0.5 inches all sides
margin: 0.5;

// Different top/bottom and left/right
margin: [0.5, 0.25]; // [vertical, horizontal]

// All sides different
margin: [0.5, 0.25, 0.5, 0.25]; // [top, right, bottom, left]
```

### 5. Style Optimization for PDF

**Strategy 1: Use Inline Styles (Most Compatible)**

```typescript
<div style={{
  background: "#f0f0f0",
  padding: "20px",
  pageBreakInside: "avoid"
}}>
  Content
</div>
```

**Strategy 2: Embed CSS in Component**

```typescript
<div>
  <style>{`
    .pdf-section { page-break-inside: avoid; }
    .pdf-heading { font-weight: 600; margin: 10px 0; }
  `}</style>
  <div className="pdf-section">
    <h2 className="pdf-heading">Title</h2>
  </div>
</div>
```

**Strategy 3: Print-Specific CSS**

```typescript
<style>{`
  @media print {
    .no-print { display: none; }
    .pdf-page { page-break-before: always; }
    body { margin: 0; padding: 0; }
  }
`}</style>
```

### 6. File Size Optimization

```typescript
// Compress images
const compressImage = async (src: string) => {
  const img = new Image();
  img.src = src;
  const canvas = await new Promise<HTMLCanvasElement>((resolve) => {
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width * 0.8; // Reduce size
      c.height = img.height * 0.8;
      c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
      resolve(c);
    };
  });
  return canvas.toDataURL("image/jpeg", 0.8);
};

// Remove unused styles
const cleanHtml = (html: string) => {
  return html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
};

// Lazy load images
const options = {
  imageTimeout: 10000, // Wait max 10s for images
};
```

---

## Page Breaking & Layout

### Multi-Page Document Structure

```typescript
function MultiPageDocument() {
  return (
    <div className="pdf-document">
      {/* Page 1 */}
      <div className="pdf-page" style={{ pageBreakAfter: "always" }}>
        <h1>Title</h1>
        <p>Content...</p>
      </div>

      {/* Page 2 */}
      <div className="pdf-page" style={{ pageBreakAfter: "always" }}>
        <h1>Chapter 2</h1>
        <p>More content...</p>
      </div>

      {/* Last Page (no page break) */}
      <div className="pdf-page">
        <p>Final page...</p>
      </div>
    </div>
  );
}
```

### Table Page Breaking

```typescript
function PrintFriendlyTable() {
  return (
    <table style={{ width: "100%" }}>
      <thead style={{ display: "table-header-group" }}>
        <tr>
          <th>Header 1</th>
          <th>Header 2</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(row => (
          <tr key={row.id} style={{ pageBreakInside: "avoid" }}>
            <td>{row.col1}</td>
            <td>{row.col2}</td>
          </tr>
        ))}
      </tbody>
      <tfoot style={{ display: "table-footer-group" }}>
        <tr>
          <td colSpan={2}>Footer</td>
        </tr>
      </tfoot>
    </table>
  );
}
```

### Section Grouping

```typescript
function GroupedSections() {
  return (
    <div>
      {sections.map(section => (
        <section
          key={section.id}
          style={{
            pageBreakInside: "avoid",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ pageBreakAfter: "avoid" }}>
            {section.title}
          </h2>
          <div>{section.content}</div>
        </section>
      ))}
    </div>
  );
}
```

---

## Performance Tips

### 1. Lazy Load PDFDownload Hook

```typescript
// Don't load until needed
const usePdfDownloadLazy = () => {
  return useCallback(async (element: HTMLElement) => {
    const { usePdfDownload } = await import("@/hooks/usePdfDownload");
    const { downloadPdf } = usePdfDownload();
    return downloadPdf(element, {});
  }, []);
};
```

### 2. Memoize Content

```typescript
const MemoizedPdfContent = React.memo(({ data }: Props) => (
  <div>
    {data.map(item => (
      <div key={item.id}>{item.content}</div>
    ))}
  </div>
));
```

### 3. Use Web Workers for Large PDFs

```typescript
// pdf-worker.ts
self.onmessage = async (e) => {
  const { html, options } = e.data;
  const html2pdf = await import("html2pdf.js");
  const result = await html2pdf().set(options).from(html).output();
  self.postMessage({ success: true, result });
};

// usage
const generatePdfAsync = (html: string, options: any) => {
  return new Promise((resolve) => {
    const worker = new Worker("pdf-worker.ts");
    worker.postMessage({ html, options });
    worker.onmessage = (e) => {
      resolve(e.data.result);
      worker.terminate();
    };
  });
};
```

### 4. Progressive PDF Generation

```typescript
async function generatePdfProgressively(
  element: HTMLElement,
  onProgress: (progress: number) => void,
) {
  const sections = element.querySelectorAll(".pdf-section");
  let processed = 0;

  for (const section of sections) {
    // Render section
    onProgress((processed / sections.length) * 100);
    processed++;
  }

  onProgress(100);
}
```

---

## Troubleshooting

### Issue: Blurry PDF Output

**Causes:** Low scale or quality settings

**Solutions:**

```typescript
const options = {
  imageQuality: 0.98, // Increase quality
  scale: 3, // Increase scale (slower but crisper)
  html2canvas: {
    scale: 3,
    useCORS: true,
    logging: false,
  },
};
```

### Issue: Missing Images in PDF

**Causes:** CORS issues, missing images, slow loading

**Solutions:**

```typescript
// Add crossOrigin
<img src={url} crossOrigin="anonymous" alt="..." />

// Increase timeout
html2canvas: { imageTimeout: 30000 }

// Use data URLs
const dataUrl = await canvasToDataUrl(canvas);
// Then embed in PDF
```

### Issue: Large File Size

**Causes:** High quality, large images, multiple pages

**Solutions:**

```typescript
// Reduce quality
imageQuality: 0.75;

// Compress images before embedding
// Remove unused CSS/JS
// Split into multiple PDFs

const maxSize = 10 * 1024 * 1024; // 10MB limit
if (pdfSize > maxSize) {
  // Split into multiple files
}
```

### Issue: Font Issues

**Causes:** Missing fonts, non-system fonts

**Solutions:**

```typescript
// Use system fonts
style={{ fontFamily: "Arial, sans-serif" }}

// Embed fonts (if necessary)
<style>{`
  @font-face {
    font-family: 'CustomFont';
    src: url('data:application/x-font-woff...');
  }
`}</style>

// Fallback fonts
fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
```

### Issue: Inconsistent Page Breaks

**Causes:** Complex layouts, floating elements

**Solutions:**

```css
/* Force breaks before elements */
.page-break-before {
  page-break-before: always;
}

/* Prevent breaks inside */
.no-break {
  page-break-inside: avoid;
}

/* Avoid orphaned text */
.section-title {
  page-break-after: avoid;
}

/* Keep header/footer */
thead {
  display: table-header-group;
}
tfoot {
  display: table-footer-group;
}
```

---

## Testing

### Unit Tests for PDF Generation

```typescript
describe("PDF Generation", () => {
  test("generates PDF successfully", async () => {
    const element = document.createElement("div");
    element.innerHTML = "<h1>Test</h1>";

    const { downloadPdf } = usePdfDownload();
    const result = await downloadPdf(element, {
      filename: "test.pdf",
    });

    expect(result).toBe(true);
  });

  test("handles missing element", async () => {
    const { downloadPdf } = usePdfDownload();
    const result = await downloadPdf(null, { filename: "test.pdf" });

    expect(result).toBe(false);
  });

  test("formats filename correctly", async () => {
    const element = document.createElement("div");
    const spy = jest.spyOn(global, "fetch");

    // Setup spy to capture filename

    const { downloadPdf } = usePdfDownload();
    await downloadPdf(element, {
      filename: "my-document.pdf",
    });

    // Assert filename used
  });
});
```

### Visual Tests

```typescript
// Use tools like Percy, Chromatic, or VRT
describe("PDF Visual", () => {
  test("renders correctly", async () => {
    render(<PdfExportComponent />);

    // Capture baseline
    expect(screen.getByTestId("pdf-content")).toMatchSnapshot();
  });
});
```

---

## Best Practices

| Practice                       | Benefit                         |
| ------------------------------ | ------------------------------- |
| Use `pageBreakInside: "avoid"` | Prevents awkward section splits |
| Optimize image quality (0.98)  | Balance file size and clarity   |
| Use scale: 2                   | Crisp text rendering            |
| Embed CSS for styling          | Better compatibility            |
| Test with different page sizes | Handles A4 and Letter           |
| Monitor file size              | Alert on oversized PDFs         |
| Use margin wisely              | Consistent layout               |
| Lazy load PDF library          | Faster initial load             |

---

## References

- [html2pdf.js Documentation](https://github.com/parallax/html2pdf.js)
- [jsPDF Docs](https://github.com/parallax/jsPDF)
- [html2canvas Docs](https://html2canvas.hertzen.com/)
- [CSS for Print](https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries/Using_media_queries_for_accessibility#print)

---

## Conclusion

Generating professional PDFs requires attention to layout, styling, performance, and file size. By following these guidelines and using the provided hook, you can create high-quality PDF exports for any feature in your application.
