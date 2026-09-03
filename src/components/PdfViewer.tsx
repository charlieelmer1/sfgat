import React, { useEffect, useRef, useState, useMemo } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
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
  File,
  Eye
} from "lucide-react";

// Polyfill Promise.try and Uint8Array.prototype.toHex for older Safari / iPadOS WebKit versions
if (typeof (Promise as any).try !== "function") {
  (Promise as any).try = function (fn: (...args: any[]) => any, ...args: any[]) {
    return new Promise((resolve) => resolve(fn(...args)));
  };
}

if (typeof (Uint8Array.prototype as any).toHex !== "function") {
  (Uint8Array.prototype as any).toHex = function () {
    return Array.from(this)
      .map((b) => (b as number).toString(16).padStart(2, "0"))
      .join("");
  };
}

// Configure PDF.js worker with same-origin bundled asset from Vite
if (typeof window !== "undefined") {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
  } catch (e) {
    console.warn("Could not assign bundled pdfWorker, using CDN fallback:", e);
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";
  }
}

interface PdfViewerProps {
  pdfData: string; // Base64 data URL ("data:application/pdf;base64,..."), raw base64, or URL
  fileName?: string;
  title?: string;
  className?: string;
  initialZoom?: number;
}

interface PageCanvasProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  totalPages: number;
  scale: number;
  rotation: number;
  containerWidth: number;
  isFullscreen: boolean;
  onRenderFail?: () => void;
  key?: React.Key;
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
  onRenderFail,
}: PageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendering, setRendering] = useState(true);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let currentRenderTask: any = null;

    const render = async () => {
      if (!pdfDoc || !canvasRef.current) return;
      try {
        setRendering(true);
        setRenderError(null);
        const page = await pdfDoc.getPage(pageNumber);
        if (cancelled || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d", { willReadFrequently: false });
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

        const renderParams: any = {
          canvasContext: context,
          viewport,
        };
        if (pixelRatio !== 1) {
          renderParams.transform = [pixelRatio, 0, 0, pixelRatio, 0, 0];
        }

        currentRenderTask = page.render(renderParams);
        await currentRenderTask.promise;
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.error(`Error rendering page ${pageNumber}:`, err);
          if (!cancelled) {
            setRenderError(err?.message || "Render failed");
            if (onRenderFail) onRenderFail();
          }
        }
      } finally {
        if (!cancelled) setRendering(false);
      }
    };

    render();
    return () => {
      cancelled = true;
      if (currentRenderTask) {
        try {
          currentRenderTask.cancel();
        } catch {}
      }
    };
  }, [pdfDoc, pageNumber, scale, rotation, containerWidth, isFullscreen, onRenderFail]);

  return (
    <div className="relative bg-white rounded-lg shadow-xl overflow-hidden border border-slate-300 max-w-full my-3 transition-shadow hover:shadow-2xl">
      {rendering && (
        <div className="absolute inset-0 bg-slate-100/75 backdrop-blur-[1px] flex flex-col items-center justify-center z-10 gap-1.5 p-4 min-h-[300px]">
          <Loader2 className="w-6 h-6 text-red-600 animate-spin" />
          <span className="text-[11px] font-mono text-slate-600">Rendering Page {pageNumber}...</span>
        </div>
      )}
      {renderError ? (
        <div className="p-6 text-center text-red-600 bg-red-50 text-xs font-mono">
          Unable to render Page {pageNumber}. Please switch to iPad Native Viewer.
        </div>
      ) : (
        <canvas ref={canvasRef} className="block mx-auto max-w-full h-auto" />
      )}
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
  const [viewMode, setViewMode] = useState<"scroll" | "single" | "native">("scroll");

  // Detect iOS / iPadOS Safari environments
  const isAppleDevice = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  }, []);

  // Stable Blob URL generation with proper cleanup to prevent memory leaks
  useEffect(() => {
    let createdUrl: string | null = null;
    try {
      if (!pdfData) {
        setBlobUrl("");
        return;
      }

      if (pdfData.startsWith("data:application/pdf;base64,") || pdfData.startsWith("data:application/octet-stream;base64,")) {
        const base64 = pdfData.split(",")[1].replace(/\s/g, "");
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/pdf" });
        createdUrl = URL.createObjectURL(blob);
        setBlobUrl(createdUrl);
      } else if (pdfData.startsWith("http://") || pdfData.startsWith("https://") || pdfData.startsWith("/")) {
        setBlobUrl(pdfData);
      } else {
        // Raw base64 string
        const base64 = pdfData.trim().replace(/\s/g, "");
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/pdf" });
        createdUrl = URL.createObjectURL(blob);
        setBlobUrl(createdUrl);
      }
    } catch (err) {
      console.error("Error creating blob URL from pdfData:", err);
      setBlobUrl(pdfData);
    }

    return () => {
      if (createdUrl) {
        try {
          URL.revokeObjectURL(createdUrl);
        } catch {}
      }
    };
  }, [pdfData]);

  // Monitor container width for responsive scaling
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

  // Helper to get binary array for PDF.js parser
  const getPdfSource = (data: string): Uint8Array | string => {
    if (data.startsWith("data:application/pdf;base64,") || data.startsWith("data:application/octet-stream;base64,")) {
      const base64 = data.split(",")[1].replace(/\s/g, "");
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
    // Raw base64
    try {
      const base64 = data.trim().replace(/\s/g, "");
      const binaryString = window.atob(base64);
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

  // Load PDF Document
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    const loadDoc = async () => {
      try {
        const source = getPdfSource(pdfData);
        const loadingTask = pdfjsLib.getDocument(
          typeof source === "string"
            ? { url: source }
            : {
                data: source,
                cMapUrl: "https://unpkg.com/pdfjs-dist@4.10.38/cmaps/",
                cMapPacked: true,
              }
        );
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
          setError(err?.message || "Failed to parse PDF document.");
          setLoading(false);
          // On mobile or iPad if canvas engine fails, automatically offer native embed
          setViewMode("native");
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

  const targetPdfUrl = blobUrl || pdfData;

  return (
    <div
      ref={containerRef}
      className={`bg-slate-900 text-slate-100 rounded-xl overflow-hidden border border-slate-700 shadow-xl flex flex-col ${
        isFullscreen
          ? "fixed inset-0 z-50 rounded-none w-screen h-screen flex flex-col bg-slate-950"
          : className
      }`}
    >
      {/* Top Toolbar - Fully Responsive for Mobile, iPad, and Desktop */}
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

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
          
          {/* View Mode Switcher: Continuous Scroll vs Single Page vs iPad Native Embed */}
          <div className="flex bg-slate-800 rounded-lg border border-slate-700 p-0.5 text-xs font-mono">
            <button
              type="button"
              onClick={() => setViewMode("scroll")}
              className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                viewMode === "scroll" ? "bg-red-600 text-white" : "text-slate-400 hover:text-white"
              }`}
              title="Continuous Multi-Page View"
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
            <button
              type="button"
              onClick={() => setViewMode("native")}
              className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                viewMode === "native" ? "bg-blue-600 text-white font-bold" : "text-slate-400 hover:text-white"
              }`}
              title="iPad Native WebKit Reader"
            >
              <Smartphone className="w-3 h-3" />
              <span>{isAppleDevice ? "iPad Native" : "Embed"}</span>
            </button>
          </div>

          {/* Page Navigator for Single Mode */}
          {viewMode === "single" && numPages > 1 && (
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

          {/* Zoom Controls for Canvas Modes */}
          {viewMode !== "native" && (
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

          {/* Rotate Control for Canvas Modes */}
          {viewMode !== "native" && (
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

          {/* Open in iPad Safari / Native App Tab */}
          <a
            href={targetPdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 bg-blue-900/60 hover:bg-blue-800 text-blue-200 hover:text-white rounded-lg border border-blue-700 cursor-pointer text-xs transition-colors flex items-center gap-1 font-bold"
            title="Open in iPad Safari / Native Tab"
            aria-label="Open PDF in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] font-mono">Safari Tab</span>
          </a>

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

      {/* Main Viewport Area */}
      <div className="flex-1 bg-slate-950 p-2 sm:p-4 overflow-x-auto overflow-y-auto min-h-[400px] max-h-[800px] relative touch-pan-x touch-pan-y">
        {/* Native iPad / WebKit Embed Mode */}
        {viewMode === "native" ? (
          <div className="w-full h-full min-h-[550px] bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex flex-col">
            <div className="bg-slate-850 px-3 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 font-mono">
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                iPad Native WebKit Engine (Pinch-to-zoom & Full Scroll Enabled)
              </span>
              <a
                href={targetPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-blue-400 hover:text-blue-300 underline font-bold flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" /> Open in Safari Fullscreen
              </a>
            </div>
            <div className="flex-1 w-full min-h-[500px]">
              <object
                data={targetPdfUrl}
                type="application/pdf"
                className="w-full h-[650px] rounded-b-lg"
              >
                <iframe
                  src={targetPdfUrl}
                  title={title}
                  className="w-full h-[650px] border-none rounded-b-lg"
                >
                  <div className="p-8 text-center text-slate-300 space-y-3">
                    <p className="text-sm font-semibold">Your browser requires direct PDF opening.</p>
                    <a
                      href={targetPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs"
                    >
                      <ExternalLink className="w-4 h-4" /> Tap to Open in iPad Reader
                    </a>
                  </div>
                </iframe>
              </object>
            </div>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 gap-3 min-h-[350px]">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            <span className="text-xs font-mono font-medium">Preparing multi-page PDF document...</span>
          </div>
        ) : error ? (
          <div className="bg-red-950/60 border border-red-800 p-5 sm:p-6 rounded-xl max-w-md mx-auto text-center space-y-3 my-8">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
            <h5 className="text-sm font-bold text-red-200">Unable to Render with Canvas</h5>
            <p className="text-xs text-red-300 leading-relaxed font-mono">{error}</p>
            <div className="pt-2 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode("native")}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" /> Switch to iPad Native Embed
              </button>
              <a
                href={targetPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open in Safari Tab
              </a>
              <button
                type="button"
                onClick={handleDownload}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF
              </button>
            </div>
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
                    onRenderFail={() => setViewMode("native")}
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
                  onRenderFail={() => setViewMode("native")}
                />
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Bottom Mobile & iPad Helper Bar */}
      <div className="bg-slate-900 border-t border-slate-800 px-3 py-2 flex items-center justify-between text-[11px] text-slate-400 font-mono flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span>
            {viewMode === "native"
              ? `iPad WebKit Native Mode (Apple PDF engine)`
              : viewMode === "scroll"
              ? `All ${numPages || 1} pages loaded (scroll down to read)`
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
          <a
            href={targetPdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            <ExternalLink className="w-3 h-3" /> <span>Open in iPad Safari Tab</span>
          </a>
        </div>
      </div>
    </div>
  );
}
