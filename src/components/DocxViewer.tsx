import React, { useEffect, useRef, useState } from "react";
import { renderAsync } from "docx-preview";
import {
  FileText,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Loader2,
  AlertCircle,
  ExternalLink,
  Printer,
} from "lucide-react";

interface DocxViewerProps {
  docxData: string; // Base64 data URL or raw base64
  fileName?: string;
  title?: string;
  className?: string;
}

export default function DocxViewer({
  docxData,
  fileName = "document.docx",
  title = "Word Document",
  className = "",
}: DocxViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  // Convert base64 to ArrayBuffer and create Blob URL
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    try {
      const cleanBase64 = docxData.includes("base64,")
        ? docxData.split("base64,")[1]
        : docxData;
      
      const binaryString = window.atob(cleanBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);

      if (containerRef.current) {
        containerRef.current.innerHTML = "";
        renderAsync(bytes.buffer, containerRef.current, undefined, {
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          breakPages: true,
          className: "docx-document",
        })
          .then(() => {
            if (active) {
              setLoading(false);
            }
          })
          .catch((err) => {
            console.error("Error rendering docx with docx-preview:", err);
            if (active) {
              setError("Failed to render Word document preview. You can still download and view the original file.");
              setLoading(false);
            }
          });
      }

      return () => {
        active = false;
        URL.revokeObjectURL(url);
      };
    } catch (err: any) {
      console.error("Docx parsing error:", err);
      if (active) {
        setError("Invalid or corrupted Word document data.");
        setLoading(false);
      }
    }
  }, [docxData]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.15, 2.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.15, 0.6));
  };

  const handleResetZoom = () => {
    setScale(1);
  };

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName.endsWith(".docx") ? fileName : `${fileName}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`flex flex-col bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-xl ${className}`}>
      {/* Top Control Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-850 border-b border-slate-700/80 text-white flex-wrap gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 bg-blue-600/20 text-blue-400 rounded border border-blue-500/30 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="truncate">
            <h4 className="text-xs font-bold text-slate-100 truncate">{title}</h4>
            <span className="text-[10px] text-slate-400 font-mono block truncate">
              {fileName} • Word (.docx)
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded cursor-pointer transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-slate-300 select-none">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded cursor-pointer transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-white rounded cursor-pointer transition-colors"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Download Word Document */}
          <button
            type="button"
            onClick={handleDownload}
            className="p-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg border border-blue-600 cursor-pointer text-xs transition-colors flex items-center gap-1 font-bold shadow-sm"
            title="Download Word Document"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Download</span>
          </button>

          {/* Native Safari / Fullscreen Direct Tab */}
          {blobUrl && (
            <a
              href={blobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-white rounded-lg border border-slate-700 cursor-pointer text-xs transition-colors flex items-center gap-1"
              title="Open File in New Tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Main Document Body */}
      <div className="relative min-h-[420px] max-h-[750px] overflow-auto bg-slate-800/80 p-4 md:p-6 flex flex-col items-center">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 z-20 gap-3">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            <span className="text-xs font-mono text-slate-300">Rendering Word Document (.docx)...</span>
          </div>
        )}

        {error && (
          <div className="my-auto max-w-md bg-red-950/80 border border-red-800/60 p-5 rounded-xl text-center space-y-3 shadow-lg">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
            <div className="text-xs text-red-200">{error}</div>
            {blobUrl && (
              <button
                type="button"
                onClick={handleDownload}
                className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Download .docx File
              </button>
            )}
          </div>
        )}

        {/* docx-preview wrapper with scale transform */}
        <div
          className="w-full flex justify-center transition-transform origin-top"
          style={{ transform: `scale(${scale})` }}
        >
          <div
            ref={containerRef}
            className="bg-white text-slate-900 shadow-2xl rounded-sm p-4 sm:p-8 max-w-[850px] w-full min-h-[600px] overflow-x-auto docx-content-container"
          />
        </div>
      </div>

      {/* Footer Status */}
      <div className="px-4 py-2 bg-slate-850 border-t border-slate-700/80 text-[11px] text-slate-400 font-mono flex items-center justify-between">
        <span>Word Document Viewer</span>
        <span>Office Open XML (.docx)</span>
      </div>
    </div>
  );
}
