import React, { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Download,
  Printer,
  FileText,
  RotateCw,
  Layers,
  AlertCircle,
  Loader2,
  RefreshCw
} from "lucide-react";

// Configure PDF.js worker
if (typeof window !== "undefined") {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  } catch {
    // Fallback if version string unavailable
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist@5.4.394/build/pdf.worker.min.mjs";
  }
}

interface PdfViewerProps {
  pdfData: string; // Base64 data URL ("data:application/pdf;base64,..."), raw base64, or URL
  fileName?: string;
  title?: string;
  className?: string;
  initialZoom?: number;
}

export default function PdfViewer({
  pdfData,
  fileName = "document.pdf",
  title = "Procedure Document",
  className = "",
  initialZoom = 1.0,
}: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(initialZoom);
  const [rotation, setRotation] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"single" | "continuous">("single");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [renderingPage, setRenderingPage] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Helper to convert base64 or URL to Uint8Array for PDF.js
  const getPdfSource = (data: string): Uint8Array | string => {
    if (data.startsWith("data:application/pdf;base64,") || data.startsWith("data:application/octet-stream;base64,")) {
      const base64 = data.split(",")[1];
      const binaryString = window.atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }
    if (data.startsWith("http://") || data.startsWith("https://") || data.startsWith("/")) {
      return data;
    }
    // Assume raw base64
    try {
      const binaryString = window.atob(data.trim());
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    } catch {
      return data;
    }
  };

  // Monitor container width for responsive scale
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Load PDF Document
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    const loadDoc = async () => {
      try {
        const source = getPdfSource(pdfData);
        const loadingTask = pdfjsLib.getDocument(typeof source === "string" ? { url: source } : { data: source });
        const doc = await loadingTask.promise;
        if (!isCancelled) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setCurrentPage(1);
          setLoading(false);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error("PDF.js load error:", err);
          setError(err?.message || "Failed to load PDF document.");
          setLoading(false);
        }
      }
    };

    loadDoc();

    return () => {
      isCancelled = true;
    };
  }, [pdfData]);

  // Render single page onto canvas
  const renderSinglePage = async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current) return;
    setRenderingPage(true);

    try {
      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) return;

      // Base unscaled viewport
      const unscaledViewport = page.getViewport({ scale: 1, rotation });
      
      // Compute automatic responsive scale to fit container width smoothly
      const targetWidth = containerWidth > 0 ? containerWidth - (isFullscreen ? 64 : 32) : 600;
      const fitScale = targetWidth > 0 ? Math.min(targetWidth / unscaledViewport.width, 2.2) : 1;
      const finalScale = fitScale * scale;

      const viewport = page.getViewport({ scale: finalScale, rotation });
      const pixelRatio = window.devicePixelRatio || 1;

      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";

      const renderContext = {
        canvasContext: context,
        viewport,
        transform: pixelRatio !== 1 ? [pixelRatio, 0, 0, pixelRatio, 0, 0] : undefined,
      };

      await page.render(renderContext).promise;
    } catch (err: any) {
      if (err?.name !== "RenderingCancelledException") {
        console.error("Error rendering PDF page:", err);
      }
    } finally {
      setRenderingPage(false);
    }
  };

  useEffect(() => {
    if (pdfDoc && viewMode === "single") {
      renderSinglePage(currentPage);
    }
  }, [pdfDoc, currentPage, scale, rotation, containerWidth, viewMode]);

  // Navigation handlers
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleResetZoom = () => {
    setScale(1.0);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handlePrint = () => {
    if (!pdfData) return;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>${title}</title></head>
          <body style="margin:0;padding:0;">
            <iframe src="${pdfData}" style="width:100%;height:100vh;border:none;"></iframe>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = pdfData;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      ref={containerRef}
      className={`bg-slate-900 text-slate-100 rounded-lg overflow-hidden border border-slate-700 shadow-lg flex flex-col ${
        isFullscreen
          ? "fixed inset-0 z-50 rounded-none w-screen h-screen flex flex-col bg-slate-950"
          : className
      }`}
    >
      {/* Top Toolbar */}
      <div className="bg-slate-850 border-b border-slate-700 px-3 py-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
        {/* Document Title & File Info */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="bg-red-600/20 text-red-400 p-1.5 rounded border border-red-500/30 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-100 truncate max-w-[180px] sm:max-w-[280px]">
              {title}
            </h4>
            <span className="text-[10px] font-mono text-slate-400 block truncate">
              {fileName} {numPages > 0 ? `(${numPages} ${numPages === 1 ? "page" : "pages"})` : ""}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          {/* Page Navigator */}
          {numPages > 1 && (
            <div className="flex items-center bg-slate-800 rounded border border-slate-700 text-xs font-mono px-1 py-0.5">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={currentPage <= 1 || loading}
                className="p-1 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 text-[11px] text-slate-200">
                {currentPage} / {numPages}
              </span>
              <button
                type="button"
                onClick={handleNextPage}
                disabled={currentPage >= numPages || loading}
                className="p-1 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center bg-slate-800 rounded border border-slate-700 text-xs px-1 py-0.5">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={loading || scale <= 0.6}
              className="p-1 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-1.5 text-[11px] font-mono text-slate-300 hover:text-white cursor-pointer"
              title="Reset Zoom to 100%"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={loading || scale >= 2.8}
              className="p-1 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Rotate Control */}
          <button
            type="button"
            onClick={handleRotate}
            disabled={loading}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 cursor-pointer text-xs transition-colors"
            title="Rotate Clockwise"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Download PDF */}
          <button
            type="button"
            onClick={handleDownload}
            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold font-mono flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
            title="Download PDF Document"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Download</span>
          </button>

          {/* Print PDF */}
          <button
            type="button"
            onClick={handlePrint}
            className="hidden md:flex p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 cursor-pointer text-xs transition-colors"
            title="Print PDF"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Expand / Collapse */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 cursor-pointer text-xs transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Preview"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Canvas / PDF Viewport Area */}
      <div className="flex-1 bg-slate-950 p-2 sm:p-4 overflow-auto flex items-center justify-center min-h-[360px] max-h-[750px] relative">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 gap-2">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            <span className="text-xs font-mono font-medium">Initializing PDF Rendering Engine...</span>
          </div>
        ) : error ? (
          <div className="bg-red-950/50 border border-red-800 p-6 rounded-lg max-w-md text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
            <h5 className="text-sm font-bold text-red-200">Unable to Preview PDF</h5>
            <p className="text-xs text-red-300 leading-relaxed font-mono">{error}</p>
            <div className="pt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold font-mono flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download PDF File
              </button>
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col items-center justify-center my-auto transition-all">
            {renderingPage && (
              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center z-10 rounded">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
            <div className="bg-white rounded shadow-2xl overflow-hidden border border-slate-300">
              <canvas ref={canvasRef} className="block mx-auto max-w-full h-auto" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Mobile Helper Bar */}
      <div className="bg-slate-900 border-t border-slate-800 px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span>
          Page {currentPage} of {numPages || 1}
        </span>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline">📱 Responsive Canvas Rendering</span>
          <span className="text-slate-500">Zoom: {Math.round(scale * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
