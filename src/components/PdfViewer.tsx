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
  AlertCircle,
  Loader2,
  ExternalLink,
  Smartphone,
  Layers,
  File
} from "lucide-react";

// Configure PDF.js worker
if (typeof window !== "undefined") {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  } catch {
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

// Dedicated Page Renderer Component for multi-page document support
function PageCanvas({
  pdfDoc,
  pageNumber,
  totalPages,
  scale,
  rotation,
  containerWidth,
  isFullscreen,
}: {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  totalPages: number;
  scale: number;
  rotation: number;
  containerWidth: number;
  isFullscreen: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendering, setRendering] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      if (!pdfDoc || !canvasRef.current) return;
      try {
        setRendering(true);
        const page = await pdfDoc.getPage(pageNumber);
        if (cancelled) return;
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (!context) return;

        const unscaledViewport = page.getViewport({ scale: 1, rotation });
        const screenWidth = typeof window !== "undefined" ? window.innerWidth : 375;
        const effectiveWidth = containerWidth > 50 ? containerWidth : Math.min(screenWidth - 20, 750);
        const paddingAllowance = isFullscreen ? 16 : (screenWidth < 640 ? 12 : 28);
        const targetWidth = Math.max(260, effectiveWidth - paddingAllowance);

        const fitScale = targetWidth / unscaledViewport.width;
        const finalScale = Math.min(Math.max(fitScale * scale, 0.35), 3.5);

        const viewport = page.getViewport({ scale: finalScale, rotation });
        const pixelRatio = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;

        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";

        await page.render({
          canvasContext: context,
          viewport,
          transform: pixelRatio !== 1 ? [pixelRatio, 0, 0, pixelRatio, 0, 0] : undefined,
        }).promise;
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.error(`Error rendering page ${pageNumber}:`, err);
        }
      } finally {
        if (!cancelled) setRendering(false);
      }
    };

    render();
    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pageNumber, scale, rotation, containerWidth, isFullscreen]);

  return (
    <div className="relative bg-white rounded-lg shadow-xl overflow-hidden border border-slate-300 max-w-full my-3 transition-shadow hover:shadow-2xl">
      {rendering && (
        <div className="absolute inset-0 bg-slate-100/70 backdrop-blur-[1px] flex flex-col items-center justify-center z-10 gap-1.5 p-4 min-h-[300px]">
          <Loader2 className="w-6 h-6 text-red-600 animate-spin" />
          <span className="text-[11px] font-mono text-slate-600">Rendering Page {pageNumber}...</span>
        </div>
      )}
      <canvas ref={canvasRef} className="block mx-auto max-w-full h-auto" />
      <div className="bg-slate-50 border-t border-slate-200 px-3 py-1.5 flex items-center justify-between text-[11px] font-mono text-slate-600">
        <span className="font-semibold">Page {pageNumber} of {totalPages}</span>
        <span className="text-[10px] text-slate-400">SFGA EMS DIRECTIVE</span>
      </div>
    </div>
  );
}

export default function PdfViewer({
  pdfData,
  fileName = "document.pdf",
  title = "Procedure Document",
  className = "",
  initialZoom = 1.0,
}: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(initialZoom);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [blobUrl, setBlobUrl] = useState<string>("");
  const [viewMode, setViewMode] = useState<"scroll" | "single">("scroll");
  const [useNativeViewer, setUseNativeViewer] = useState<boolean>(false);

  // Helper to convert base64 or URL to Uint8Array for PDF.js and generate Blob URL for mobile viewing
  const getPdfSource = (data: string): Uint8Array | string => {
    if (data.startsWith("data:application/pdf;base64,") || data.startsWith("data:application/octet-stream;base64,")) {
      const base64 = data.split(",")[1];
      const binaryString = window.atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      try {
        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
      } catch (e) {
        console.warn("Blob creation notice:", e);
      }
      return bytes;
    }
    if (data.startsWith("http://") || data.startsWith("https://") || data.startsWith("/")) {
      setBlobUrl(data);
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
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      return bytes;
    } catch {
      setBlobUrl(data);
      return data;
    }
  };

  // Monitor container width for responsive scaling on desktop and mobile phones
  useEffect(() => {
    if (!containerRef.current) return;
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        if (width > 0) setContainerWidth(width);
      }
    };
    handleResize();

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(containerRef.current);
    window.addEventListener("resize", handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
    };
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

  const handleOpenInNewTab = () => {
    const urlToOpen = blobUrl || pdfData;
    if (!urlToOpen) return;
    window.open(urlToOpen, "_blank");
  };

  const handlePrint = () => {
    const urlToOpen = blobUrl || pdfData;
    if (!urlToOpen) return;
    const printWindow = window.open(urlToOpen, "_blank");
    if (printWindow) {
      printWindow.focus();
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = blobUrl || pdfData;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      ref={containerRef}
      className={`bg-slate-900 text-slate-100 rounded-xl overflow-hidden border border-slate-700 shadow-xl flex flex-col ${
        isFullscreen
          ? "fixed inset-0 z-50 rounded-none w-screen h-screen flex flex-col bg-slate-950"
          : className
      }`}
    >
      {/* Top Toolbar - Fully Responsive for Mobile Phones and Desktop */}
      <div className="bg-slate-850 border-b border-slate-700 px-3 py-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
        
        {/* Document Title & File Info */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="bg-red-600/20 text-red-400 p-1.5 rounded-lg border border-red-500/30 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-100 truncate max-w-[150px] sm:max-w-[280px]">
              {title}
            </h4>
            <span className="text-[10px] font-mono text-slate-400 block truncate">
              {fileName} {numPages > 0 ? `• ${numPages} ${numPages === 1 ? "page" : "pages"}` : ""}
            </span>
          </div>
        </div>

        {/* Action Controls - Mobile Accessible */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
          
          {/* View Mode Toggle: Continuous Scroll vs Single Page */}
          {numPages > 1 && !useNativeViewer && (
            <div className="flex bg-slate-800 rounded-lg border border-slate-700 p-0.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => setViewMode("scroll")}
                className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                  viewMode === "scroll" ? "bg-red-600 text-white" : "text-slate-400 hover:text-white"
                }`}
                title="Scroll All Pages"
              >
                <Layers className="w-3 h-3" />
                <span className="hidden sm:inline">All Pages</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("single")}
                className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                  viewMode === "single" ? "bg-red-600 text-white" : "text-slate-400 hover:text-white"
                }`}
                title="Single Page View"
              >
                <File className="w-3 h-3" />
                <span className="hidden sm:inline">Page by Page</span>
              </button>
            </div>
          )}

          {/* Page Navigator for Single Mode */}
          {viewMode === "single" && numPages > 1 && !useNativeViewer && (
            <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 text-xs font-mono px-1 py-0.5 shadow-inner">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={currentPage <= 1 || loading}
                className="p-1 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Previous Page"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <select
                value={currentPage}
                onChange={(e) => setCurrentPage(Number(e.target.value))}
                className="bg-transparent text-[11px] text-slate-200 font-bold px-1 py-0.5 border-none outline-none cursor-pointer"
              >
                {Array.from({ length: numPages }, (_, i) => (
                  <option key={i + 1} value={i + 1} className="bg-slate-800 text-white">
                    {i + 1}/{numPages}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleNextPage}
                disabled={currentPage >= numPages || loading}
                className="p-1 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Next Page"
                aria-label="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Zoom Controls */}
          {!useNativeViewer && (
            <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 text-xs px-1 py-0.5 shadow-inner">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={loading || scale <= 0.5}
                className="p-1 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                title="Zoom Out"
                aria-label="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-1 text-[10px] font-mono text-slate-300 hover:text-white cursor-pointer"
                title="Reset Zoom"
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={loading || scale >= 3.0}
                className="p-1 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                title="Zoom In"
                aria-label="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Rotate Control */}
          {!useNativeViewer && (
            <button
              type="button"
              onClick={handleRotate}
              disabled={loading}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 cursor-pointer text-xs transition-colors"
              title="Rotate Page"
              aria-label="Rotate Page"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Mobile Direct Open in Native Viewer (iOS Safari / Android) */}
          <button
            type="button"
            onClick={handleOpenInNewTab}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-white rounded-lg border border-slate-700 cursor-pointer text-xs transition-colors flex items-center gap-1"
            title="Open in Phone Native Browser/App"
            aria-label="Open PDF in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[10px] font-mono">Open in Tab</span>
          </button>

          {/* Download PDF */}
          <button
            type="button"
            onClick={handleDownload}
            className="px-2 sm:px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold font-mono flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
            title="Download PDF"
            aria-label="Download PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save</span>
          </button>

          {/* Print PDF (Desktop only) */}
          <button
            type="button"
            onClick={handlePrint}
            className="hidden md:flex p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 cursor-pointer text-xs transition-colors"
            title="Print PDF"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Expand / Collapse */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 cursor-pointer text-xs transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Preview"}
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Canvas / PDF Viewport Area with Touch-Friendly Scrolling */}
      <div className="flex-1 bg-slate-950 p-2 sm:p-4 overflow-x-auto overflow-y-auto min-h-[350px] max-h-[750px] relative touch-pan-x touch-pan-y">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 gap-3 min-h-[300px]">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            <span className="text-xs font-mono font-medium">Preparing multi-page PDF for mobile & desktop...</span>
          </div>
        ) : error ? (
          <div className="bg-red-950/60 border border-red-800 p-5 sm:p-6 rounded-xl max-w-md mx-auto text-center space-y-3 my-8">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
            <h5 className="text-sm font-bold text-red-200">Unable to Preview PDF Inline</h5>
            <p className="text-xs text-red-300 leading-relaxed font-mono">{error}</p>
            <div className="pt-2 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={handleOpenInNewTab}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open in Mobile Tab
              </button>
              <button
                type="button"
                onClick={() => setUseNativeViewer(true)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" /> Try Native Mobile Embed
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF
              </button>
            </div>
          </div>
        ) : useNativeViewer && blobUrl ? (
          <div className="w-full h-[600px] bg-slate-900 rounded-lg overflow-hidden border border-slate-800">
            <iframe
              src={blobUrl}
              title={title}
              className="w-full h-full border-none"
            />
          </div>
        ) : pdfDoc ? (
          <div className="flex flex-col items-center justify-center w-full max-w-full">
            {viewMode === "scroll" ? (
              // Continuous Multi-Page Vertical Scroll: Renders all pages sequentially
              <div className="w-full flex flex-col items-center space-y-4 py-2">
                {Array.from({ length: numPages }, (_, idx) => (
                  <PageCanvas
                    key={idx + 1}
                    pdfDoc={pdfDoc}
                    pageNumber={idx + 1}
                    totalPages={numPages}
                    scale={scale}
                    rotation={rotation}
                    containerWidth={containerWidth}
                    isFullscreen={isFullscreen}
                  />
                ))}
              </div>
            ) : (
              // Single Page View: Renders only currentPage
              <div className="w-full flex flex-col items-center py-2">
                <PageCanvas
                  pdfDoc={pdfDoc}
                  pageNumber={currentPage}
                  totalPages={numPages}
                  scale={scale}
                  rotation={rotation}
                  containerWidth={containerWidth}
                  isFullscreen={isFullscreen}
                />
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Bottom Mobile Helper Bar */}
      <div className="bg-slate-900 border-t border-slate-800 px-3 py-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span>
            {viewMode === "scroll"
              ? `All ${numPages || 1} ${numPages === 1 ? "page" : "pages"} loaded (scroll to read)`
              : `Page ${currentPage} of ${numPages || 1}`}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {viewMode === "single" && numPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={currentPage <= 1 || loading}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-bold disabled:opacity-30 cursor-pointer"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={handleNextPage}
                disabled={currentPage >= numPages || loading}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-bold disabled:opacity-30 cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={handleOpenInNewTab}
            className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            <ExternalLink className="w-3 h-3" /> <span>Phone Fullscreen</span>
          </button>
        </div>
      </div>
    </div>
  );
}

