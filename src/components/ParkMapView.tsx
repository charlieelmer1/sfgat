import React, { useState, useRef, useEffect } from "react";
import {
  Map,
  Compass,
  Ghost,
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Download,
  Trash2,
  FileImage,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  Move,
  Eye,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ParkMapsState, ParkMapItem } from "../types";

interface ParkMapViewProps {
  userRole: "EMT" | "Supervisor";
  maps: ParkMapsState;
  onUpdateMap: (mapId: "operational" | "frightFest", mapItem: ParkMapItem) => void;
  activeSection?: "operational" | "frightFest";
  onSectionChange?: (section: "operational" | "frightFest") => void;
}

export default function ParkMapView({
  userRole,
  maps,
  onUpdateMap,
  activeSection = "operational",
  onSectionChange,
}: ParkMapViewProps) {
  const [currentSection, setCurrentSection] = useState<"operational" | "frightFest">(activeSection);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Synchronize internal currentSection with external prop if it changes
  useEffect(() => {
    if (activeSection && activeSection !== currentSection) {
      setCurrentSection(activeSection);
      resetView();
    }
  }, [activeSection]);

  const handleSelectSection = (section: "operational" | "frightFest") => {
    setCurrentSection(section);
    if (onSectionChange) {
      onSectionChange(section);
    }
    resetView();
  };

  const currentMap = maps[currentSection] || {
    id: currentSection,
    title: currentSection === "operational" ? "Operational Map" : "Fright Fest Map",
    imageData: "",
    fileName: "",
    fileSize: "",
    updatedAt: "",
  };

  const resetView = () => {
    setZoom(1);
    setRotation(0);
    setPanPosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 4.0));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  // File Upload Handlers
  const processFile = (file: File) => {
    setUploadError(null);
    setUploadSuccess(null);

    // Validate image format
    if (!file.type.startsWith("image/")) {
      setUploadError("Invalid file format. Please upload a .png (or valid image) file.");
      return;
    }

    const fileSizeFormatted =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${(file.size / 1024).toFixed(1)} KB`;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        const updatedItem: ParkMapItem = {
          id: currentSection,
          title: currentSection === "operational" ? "Operational Map" : "Fright Fest Map",
          imageData: result,
          fileName: file.name,
          fileSize: fileSizeFormatted,
          updatedAt: new Date().toISOString(),
          uploadedBy: userRole === "Supervisor" ? "Supervisor 790" : "EMT Crew",
        };

        onUpdateMap(currentSection, updatedItem);
        setUploadSuccess(`Successfully uploaded ${file.name}`);
        resetView();
        setTimeout(() => setUploadSuccess(null), 4000);
      }
    };
    reader.onerror = () => {
      setUploadError("Failed to read image file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRemoveMap = () => {
    if (window.confirm(`Are you sure you want to remove the current ${currentMap.title}?`)) {
      const clearedItem: ParkMapItem = {
        id: currentSection,
        title: currentSection === "operational" ? "Operational Map" : "Fright Fest Map",
        imageData: "",
        fileName: "",
        fileSize: "",
        updatedAt: "",
      };
      onUpdateMap(currentSection, clearedItem);
      resetView();
    }
  };

  const handleDownload = () => {
    if (!currentMap.imageData) return;
    const link = document.createElement("a");
    link.href = currentMap.imageData;
    link.download = currentMap.fileName || `${currentSection}-map.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Mouse Pan & Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!currentMap.imageData) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch Pan Handlers for Mobile Screens
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!currentMap.imageData || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - panPosition.x, y: touch.clientY - panPosition.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPanPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => setIsDragging(false);

  return (
    <div
      ref={containerRef}
      className={`space-y-6 ${
        isFullscreen
          ? "fixed inset-0 z-50 bg-slate-950 p-4 md:p-6 flex flex-col space-y-4 overflow-hidden"
          : ""
      }`}
    >
      {/* Hidden file input for PNG upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Top Header & Sub-Section Navigation Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm border-t-4 border-t-blue-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-900 rounded-xl shrink-0">
            <Map className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Park Maps
            </h2>
          </div>
        </div>

        {/* 2 Sub-Sections Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => handleSelectSection("operational")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentSection === "operational"
                ? "bg-blue-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
          >
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>Operational Map</span>
            {maps.operational?.imageData && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Map PNG loaded" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSelectSection("frightFest")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentSection === "frightFest"
                ? "bg-purple-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
          >
            <Ghost className="w-4 h-4 text-amber-400" />
            <span>Fright Fest Map</span>
            {maps.frightFest?.imageData && (
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Map PNG loaded" />
            )}
          </button>
        </div>
      </div>

      {/* Upload Messages */}
      <AnimatePresence>
        {uploadError && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between text-xs font-medium"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{uploadError}</span>
            </div>
            <button
              onClick={() => setUploadError(null)}
              className="text-red-500 hover:text-red-800 font-bold ml-2 cursor-pointer"
            >
              Dismiss
            </button>
          </motion.div>
        )}

        {uploadSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between text-xs font-medium"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
            <button
              onClick={() => setUploadSuccess(null)}
              className="text-emerald-600 hover:text-emerald-900 font-bold ml-2 cursor-pointer"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Map Viewer Card */}
      <div className="bg-slate-900 text-slate-100 rounded-xl overflow-hidden border border-slate-700 shadow-xl flex flex-col flex-1 min-h-[480px]">
        {/* Controls Toolbar */}
        <div className="bg-slate-850 border-b border-slate-700 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Active Map Title & File Info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`p-2 rounded-lg border shrink-0 ${
                currentSection === "operational"
                  ? "bg-blue-600/20 text-blue-400 border-blue-500/30"
                  : "bg-purple-600/20 text-purple-400 border-purple-500/30"
              }`}
            >
              {currentSection === "operational" ? (
                <Compass className="w-4 h-4" />
              ) : (
                <Ghost className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-slate-100 truncate">
                {currentMap.title}
              </h3>
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                {currentMap.imageData ? (
                  <>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> .PNG Loaded
                    </span>
                    {currentMap.fileName && <span>&bull; {currentMap.fileName}</span>}
                    {currentMap.fileSize && <span>({currentMap.fileSize})</span>}
                  </>
                ) : (
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Pending .PNG Upload
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {currentMap.imageData && (
              <>
                {/* Zoom Controls */}
                <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 text-xs px-1 py-0.5 shadow-inner">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.5}
                    className="p-1.5 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                    title="Zoom Out (-)"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={resetView}
                    className="px-2 text-[11px] font-mono text-slate-300 hover:text-white cursor-pointer font-bold"
                    title="Reset Zoom & Pan"
                  >
                    {Math.round(zoom * 100)}%
                  </button>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    disabled={zoom >= 4.0}
                    className="p-1.5 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                    title="Zoom In (+)"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Rotate Button */}
                <button
                  type="button"
                  onClick={handleRotate}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 cursor-pointer text-xs transition-colors"
                  title="Rotate 90° Clockwise"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>

                {/* Download Button */}
                <button
                  type="button"
                  onClick={handleDownload}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 cursor-pointer text-xs transition-colors"
                  title="Download .PNG Map"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {/* Upload / Replace PNG Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm ${
                currentMap.imageData
                  ? "bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
              title="Upload high-res PNG file"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{currentMap.imageData ? "Replace .PNG" : "Upload .PNG"}</span>
            </button>

            {/* Remove Map Button (if uploaded) */}
            {currentMap.imageData && (
              <button
                type="button"
                onClick={handleRemoveMap}
                className="p-2 bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-300 rounded-lg border border-slate-700 cursor-pointer text-xs transition-colors"
                title="Remove current map"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Fullscreen Mode */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 cursor-pointer text-xs transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Viewport Area */}
        <div
          ref={imageContainerRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`flex-1 bg-slate-950 relative overflow-hidden flex items-center justify-center min-h-[400px] select-none ${
            currentMap.imageData ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
          } ${isDragOver ? "ring-2 ring-blue-500 bg-slate-900" : ""}`}
        >
          {currentMap.imageData ? (
            <div
              style={{
                transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: "center center",
                transition: isDragging ? "none" : "transform 0.15s ease-out",
              }}
              className="max-w-full max-h-full flex items-center justify-center p-4 pointer-events-none"
            >
              <img
                src={currentMap.imageData}
                alt={currentMap.title}
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl border border-slate-700 pointer-events-auto"
                draggable={false}
              />
            </div>
          ) : (
            /* Upload Empty State */
            <div className="p-8 max-w-lg text-center space-y-4 my-auto">
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer group ${
                  isDragOver
                    ? "border-blue-400 bg-blue-950/40"
                    : "border-slate-700 hover:border-blue-500 bg-slate-900/50 hover:bg-slate-900"
                }`}
              >
                <div className="w-16 h-16 rounded-full bg-slate-800 group-hover:bg-blue-900/50 flex items-center justify-center mx-auto text-slate-400 group-hover:text-blue-400 transition-colors border border-slate-700 mb-4">
                  <FileImage className="w-8 h-8" />
                </div>
                <h4 className="text-base font-extrabold text-slate-200 group-hover:text-white">
                  Add {currentMap.title} (.PNG)
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  Drag and drop your high-resolution <strong className="text-slate-300">.PNG</strong> park map here, or click to browse files on your device.
                </p>
                <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 group-hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md">
                  <Upload className="w-4 h-4" />
                  <span>Select .PNG File</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 font-mono">
                <Info className="w-3.5 h-3.5" />
                <span>Uploaded maps will be instantly saved and accessible to all on-duty EMTs.</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Helper Bar */}
        <div className="bg-slate-900 border-t border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Move className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>
              {currentMap.imageData
                ? "Click & drag to pan around map • Use +/- to zoom"
                : "No file uploaded yet"}
            </span>
          </div>
          {currentMap.updatedAt && (
            <div className="flex items-center gap-1.5 text-slate-400">
              <span>Last Updated:</span>
              <strong className="text-slate-300">
                {new Date(currentMap.updatedAt).toLocaleDateString()} at{" "}
                {new Date(currentMap.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
