import React, { useState, useRef, useMemo } from "react";
import {
  BookOpen,
  FileText,
  Plus,
  Trash2,
  Edit,
  Search,
  Image,
  Upload,
  Save,
  FileCheck,
  Smartphone,
  AlertCircle,
  Loader2,
  X,
  Tag,
  Filter,
  Database,
  CheckCircle2,
} from "lucide-react";
import { DocumentItem, SOP_CATEGORIES, SopCategory } from "../types";
import PdfViewer from "./PdfViewer";
import DocxViewer from "./DocxViewer";
import { generateProcedurePdf } from "../utils/pdfGenerator";

interface DocumentsViewProps {
  userRole: "EMT" | "Supervisor";
  mode: "protocols" | "sops";
  documents: DocumentItem[];
  onAddDocument: (doc: DocumentItem) => void;
  onUpdateDocument: (doc: DocumentItem) => void;
  onDeleteDocument: (id: string) => void;
}

export default function DocumentsView({
  userRole,
  mode,
  documents,
  onAddDocument,
  onUpdateDocument,
  onDeleteDocument,
}: DocumentsViewProps) {
  const isSupervisor = userRole === "Supervisor";
  const isSopMode = mode === "sops";
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("All");

  // Filter documents based on mode, category (for SOPs), and search term
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      // SOP mode: documents with no type or explicit sops
      // Medical Direction mode: documents with type or part of protocols
      const matchesMode = isSopMode ? !doc.type : doc.type !== undefined;
      if (!matchesMode) return false;

      // Category filter for SOPs
      if (isSopMode && selectedCategoryFilter !== "All") {
        const docCat = doc.category || "Operations";
        if (docCat !== selectedCategoryFilter) {
          return false;
        }
      }

      // Search query match across title, content, and category
      const query = searchTerm.toLowerCase().trim();
      if (!query) return true;

      const titleMatch = doc.title.toLowerCase().includes(query);
      const contentMatch = doc.content.toLowerCase().includes(query);
      const catMatch = doc.category ? doc.category.toLowerCase().includes(query) : false;
      return titleMatch || contentMatch || catMatch;
    });
  }, [documents, isSopMode, selectedCategoryFilter, searchTerm]);

  // Compute category counts for SOP mode
  const categoryCounts = useMemo(() => {
    if (!isSopMode) return {};
    const counts: Record<string, number> = { All: 0 };
    SOP_CATEGORIES.forEach((cat) => {
      counts[cat] = 0;
    });

    documents.forEach((doc) => {
      if (!doc.type) {
        counts["All"] = (counts["All"] || 0) + 1;
        const cat = doc.category || "Operations";
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });

    return counts;
  }, [documents, isSopMode]);

  // Active document selection
  const [selectedDocId, setSelectedDocId] = useState<string | null>(
    filteredDocs.length > 0 ? filteredDocs[0].id : null
  );

  const selectedDoc = filteredDocs.find((doc) => doc.id === selectedDocId) || filteredDocs[0];

  // Document presentation view mode: "brief" (formatted text) vs "doc" (PDF / DOCX canvas viewer)
  const [docDisplayMode, setDocDisplayMode] = useState<"brief" | "doc">("brief");

  // Editor states
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState<SopCategory>("Operations");

  // File upload state for Mobile, iPad, and Desktop (PDF, DOCX, Image, Text)
  const [attachmentName, setAttachmentName] = useState<string>("");
  const [attachmentType, setAttachmentType] = useState<"pdf" | "image" | "text" | "docx" | undefined>(undefined);
  const [attachmentData, setAttachmentData] = useState<string>("");
  const [fileSizeInfo, setFileSizeInfo] = useState<string>("");
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [syncNotification, setSyncNotification] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStartAdd = () => {
    setEditTitle("");
    setEditContent("");
    setEditCategory("Operations");
    setAttachmentName("");
    setAttachmentType(undefined);
    setAttachmentData("");
    setFileSizeInfo("");
    setUploadError(null);
    setIsAdding(true);
    setIsEditing(false);
  };

  const handleStartEdit = (doc: DocumentItem) => {
    setEditTitle(doc.title);
    setEditContent(doc.content);
    setEditCategory((doc.category as SopCategory) || "Operations");
    setAttachmentName(doc.attachmentName || "");
    setAttachmentType(doc.attachmentType);
    setAttachmentData(doc.attachmentData || "");
    setFileSizeInfo(doc.attachmentData ? `${Math.round(doc.attachmentData.length * 0.75 / 1024)} KB` : "");
    setUploadError(null);
    setIsEditing(true);
    setIsAdding(false);
  };

  // Robust file processor for iPadOS / iOS Safari / Android and Desktop
  const processFile = (file: File) => {
    setUploadError(null);
    setIsProcessingFile(true);

    const rawName = file.name || "uploaded_document.docx";
    const lowerName = rawName.toLowerCase();
    
    // Auto-populate title if empty
    if (!editTitle.trim()) {
      const cleanName = rawName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setEditTitle(cleanName);
    }

    setAttachmentName(rawName);

    // Friendly file size
    const sizeInKb = Math.round(file.size / 1024);
    const sizeStr = sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(1)} MB` : `${sizeInKb} KB`;
    setFileSizeInfo(sizeStr);

    // Detect format accurately across iPadOS Files, mobile, and desktop
    const isPdf = lowerName.endsWith(".pdf") || file.type === "application/pdf" || file.type.includes("pdf");
    const isDocx = lowerName.endsWith(".docx") || lowerName.endsWith(".doc") || file.type.includes("wordprocessingml") || file.type.includes("officedocument");
    const isImage = file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|svg|heic|heif)$/i.test(lowerName);

    let detectedType: "pdf" | "image" | "text" | "docx" = "text";
    if (isPdf) {
      detectedType = "pdf";
    } else if (isDocx) {
      detectedType = "docx";
    } else if (isImage) {
      detectedType = "image";
    }
    setAttachmentType(detectedType);

    const reader = new FileReader();

    reader.onerror = () => {
      console.error("FileReader error on iPad/device:", reader.error);
      setUploadError("Could not read file from your device. Please try again.");
      setIsProcessingFile(false);
    };

    reader.onload = (event) => {
      if (event.target?.result) {
        const result = event.target.result as string;
        setAttachmentData(result);
        // If content is empty, add helpful default instructions based on document type
        if (!editContent.trim()) {
          if (detectedType === "pdf") {
            setEditContent(`Refer to the official attached multi-page PDF document (${rawName}) for complete procedures and guidelines.`);
          } else if (detectedType === "docx") {
            setEditContent(`Refer to the official attached Word document (${rawName}) for complete procedures and guidelines.`);
          }
        }
      }
      setIsProcessingFile(false);
    };

    // For PDF, Word .docx, and images, read as Data URL (base64) so binary is preserved
    if (detectedType === "pdf" || detectedType === "image" || detectedType === "docx") {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    const formattedDate = new Date().toISOString().split("T")[0];
    const finalContent = editContent.trim() || `Refer to the attached document: ${attachmentName || editTitle}`;
    const docGroup: "protocols" | "sops" = mode === "protocols" ? "protocols" : "sops";
    const docType: "direction" | "procedures" | "standing" | "sop" = mode === "protocols"
      ? (selectedDoc?.type || "direction")
      : "sop";
    const docCategory = isSopMode ? editCategory : (selectedDoc?.category || "Clinical");

    if (isAdding) {
      const newDoc: DocumentItem = {
        id: `${mode === "protocols" ? "prot" : "sop"}-${Date.now()}`,
        title: editTitle.trim(),
        docGroup,
        type: docType,
        category: docCategory,
        content: finalContent,
        updatedAt: formattedDate,
      };
      if (attachmentName) newDoc.attachmentName = attachmentName;
      if (attachmentType) newDoc.attachmentType = attachmentType;
      if (attachmentData) newDoc.attachmentData = attachmentData;

      onAddDocument(newDoc);
      setSelectedDocId(newDoc.id);
      setIsAdding(false);
      setSyncNotification(`Document "${editTitle.trim()}" saved to cloud database and synced across all devices.`);
      setTimeout(() => setSyncNotification(null), 5000);
    } else if (isEditing && selectedDoc) {
      const updatedDoc: DocumentItem = {
        ...selectedDoc,
        title: editTitle.trim(),
        docGroup: selectedDoc.docGroup || docGroup,
        type: selectedDoc.type || docType,
        category: docCategory,
        content: finalContent,
        updatedAt: formattedDate,
      };
      if (attachmentName) {
        updatedDoc.attachmentName = attachmentName;
      } else {
        delete updatedDoc.attachmentName;
      }
      if (attachmentType) {
        updatedDoc.attachmentType = attachmentType;
      } else {
        delete updatedDoc.attachmentType;
      }
      if (attachmentData) {
        updatedDoc.attachmentData = attachmentData;
      } else {
        delete updatedDoc.attachmentData;
      }

      onUpdateDocument(updatedDoc);
      setIsEditing(false);
      setSyncNotification(`Document "${editTitle.trim()}" updated in cloud database across all devices.`);
      setTimeout(() => setSyncNotification(null), 5000);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to permanently delete this document?")) {
      onDeleteDocument(id);
      setSelectedDocId(null);
      setSyncNotification("Document deleted from cloud database across all devices.");
      setTimeout(() => setSyncNotification(null), 5000);
    }
  };

  const removeAttachment = () => {
    setAttachmentName("");
    setAttachmentType(undefined);
    setAttachmentData("");
    setFileSizeInfo("");
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* Title block - cleaned of previous explanatory subtitles per instructions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center flex-wrap gap-2.5">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-red-600" />
              {mode === "protocols" ? "Medical Direction" : "Standard Operating Procedures (SOPs)"}
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Database className="w-3 h-3 text-emerald-600" />
              Database Synced
            </span>
          </div>
        </div>
        {isSupervisor && !isAdding && !isEditing && (
          <button
            onClick={handleStartAdd}
            className="bg-blue-900 hover:bg-blue-850 active:bg-blue-955 text-white text-xs font-bold px-4 py-2.5 rounded flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add {mode === "protocols" ? "Medical Directive" : "SOP"}
          </button>
        )}
      </div>

      {/* Sync Confirmation Banner */}
      {syncNotification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-md flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{syncNotification}</span>
          </div>
          <button
            onClick={() => setSyncNotification(null)}
            className="text-emerald-600 hover:text-emerald-800 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column - Search, Categories & Listing */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Search Box */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder={`Search ${mode === "protocols" ? "medical direction" : "SOPs"}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
            />
          </div>

          {/* SOP Category Filter Navigation (Only in SOP mode) */}
          {isSopMode && (
            <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-sm space-y-1.5">
              <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-100">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Filter className="w-3 h-3 text-blue-900" /> Categories
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {filteredDocs.length} SOP{filteredDocs.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 pt-0.5">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryFilter("All")}
                  className={`text-[11px] px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
                    selectedCategoryFilter === "All"
                      ? "bg-blue-900 text-white font-bold shadow-sm"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  <span>All</span>
                  <span className={`text-[10px] font-mono px-1 rounded ${selectedCategoryFilter === "All" ? "bg-blue-800 text-white" : "bg-slate-200 text-slate-600"}`}>
                    {categoryCounts["All"] || 0}
                  </span>
                </button>
                {SOP_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategoryFilter === cat;
                  const count = categoryCounts[cat] || 0;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`text-[11px] px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-blue-900 text-white font-bold shadow-sm"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      <span>{cat}</span>
                      <span className={`text-[10px] font-mono px-1 rounded ${isSelected ? "bg-blue-800 text-white" : "bg-slate-200 text-slate-600"}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Catalog Listing */}
          <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
            {filteredDocs.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 border border-slate-200 rounded">
                <span className="text-xs text-slate-400 block">No documents found matching criteria.</span>
              </div>
            ) : (
              filteredDocs.map((doc) => {
                const isSelected = selectedDoc?.id === doc.id;
                const hasPdf = doc.attachmentType === "pdf" && doc.attachmentData;
                const hasDocx = doc.attachmentType === "docx" && doc.attachmentData;
                return (
                  <button
                    key={doc.id}
                    onClick={() => {
                      setSelectedDocId(doc.id);
                      setIsEditing(false);
                      setIsAdding(false);
                    }}
                    className={`w-full text-left p-3.5 rounded border transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? "bg-slate-50 border-blue-900 shadow-inner border-l-4"
                        : "bg-white border-slate-200 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <div className="flex items-center gap-1.5">
                        {isSopMode && doc.category && (
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-blue-50 text-blue-900 border border-blue-200">
                            {doc.category}
                          </span>
                        )}
                        <span className="text-[10px] font-mono font-bold text-slate-500">
                          {doc.updatedAt ? `Updated ${doc.updatedAt}` : "Active"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {hasPdf && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <FileCheck className="w-3 h-3 text-emerald-600" /> PDF
                          </span>
                        )}
                        {hasDocx && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                            <FileText className="w-3 h-3 text-indigo-600" /> Word .DOCX
                          </span>
                        )}
                      </div>
                    </div>
                    <h4 className={`font-bold text-xs line-clamp-2 ${isSelected ? "text-blue-900" : "text-slate-800"}`}>
                      {doc.title}
                    </h4>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column - Reading & Writing Center */}
        <div className="lg:col-span-8">
          
          {/* Add / Edit Form */}
          {isSupervisor && (isAdding || isEditing) ? (
            <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded p-6 space-y-5 shadow-sm border-t-4 border-t-blue-900">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  {isAdding 
                    ? `Draft New ${isSopMode ? "SOP" : "Medical Direction"} Entry` 
                    : `Edit: ${editTitle || "Document"}`}
                </h3>
                <span className="text-[11px] font-mono text-slate-500">
                  iPad & Mobile Upload Enabled
                </span>
              </div>

              {/* Title input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono mb-1.5">
                  Document Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={isSopMode ? "e.g. First Aid Station Opening Procedures" : "e.g. Anaphylaxis & Epinephrine Medical Direction"}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-900 font-medium"
                />
              </div>

              {/* SOP Category Selector (Only in SOP mode) */}
              {isSopMode && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono">
                      SOP Category <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">
                      Select one of the 6 official SOP categories
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SOP_CATEGORIES.map((cat) => {
                      const isSelected = editCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setEditCategory(cat)}
                          className={`p-2.5 rounded-lg text-xs font-semibold text-left transition-all border flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? "bg-blue-900 text-white border-blue-900 shadow-sm"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Tag className={`w-3.5 h-3.5 ${isSelected ? "text-blue-300" : "text-slate-400"}`} />
                            <span>{cat}</span>
                          </div>
                          {isSelected && <span className="w-2 h-2 rounded-full bg-white ml-1.5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Body editor */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono mb-1.5">
                  Guideline / Directives Content
                </label>
                <textarea
                  rows={8}
                  placeholder="Provide precise, step-by-step clinical directions or protocol instructions here..."
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-900 font-mono leading-relaxed"
                />
              </div>

              {/* Advanced Attachment Center - PDF & Word .DOCX Enabled */}
              <div className="border border-slate-200 rounded p-4 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono">
                    Upload Document (.PDF or .DOCX Word)
                  </span>
                  {fileSizeInfo && (
                    <span className="text-[11px] font-mono text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                      Size: {fileSizeInfo}
                    </span>
                  )}
                </div>

                {uploadError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {isProcessingFile ? (
                  <div className="p-8 text-center bg-white border border-slate-200 rounded flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 text-blue-900 animate-spin" />
                    <span className="text-xs font-mono text-slate-600">Reading document from iPad / Device memory...</span>
                  </div>
                ) : attachmentName && attachmentData ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded shadow-sm">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {attachmentType === "docx" ? (
                          <div className="w-8 h-8 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                        ) : attachmentType === "pdf" ? (
                          <div className="w-8 h-8 rounded bg-red-50 border border-red-200 text-red-700 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                        ) : attachmentType === "image" ? (
                          <div className="w-8 h-8 rounded bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                            <Image className="w-5 h-5" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                        )}
                        <div className="truncate">
                          <span className="text-xs text-slate-800 font-bold block truncate">{attachmentName}</span>
                          <span className="text-[10px] text-slate-500 font-mono uppercase">
                            {attachmentType === "docx" 
                              ? "Word Document (.docx) Ready" 
                              : attachmentType === "pdf" 
                              ? "Multi-Page PDF Ready" 
                              : `${attachmentType} file attached`}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeAttachment}
                        className="text-xs text-red-600 hover:text-red-800 px-2.5 py-1 rounded bg-red-50 hover:bg-red-100 transition-colors uppercase font-mono font-bold cursor-pointer flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>

                    {/* Live preview in edit form for PDF */}
                    {attachmentType === "pdf" && (
                      <div className="border border-slate-200 rounded p-2 bg-slate-900">
                        <div className="flex items-center justify-between px-2 py-1 text-[10px] font-mono text-slate-400">
                          <span>Live PDF Preview:</span>
                          <span>Multi-Page Scrollable</span>
                        </div>
                        <PdfViewer
                          pdfData={attachmentData}
                          fileName={attachmentName}
                          title={editTitle || "Uploaded PDF"}
                          className="max-h-[360px]"
                        />
                      </div>
                    )}

                    {/* Live preview in edit form for DOCX */}
                    {attachmentType === "docx" && (
                      <div className="border border-slate-200 rounded p-2 bg-slate-900">
                        <div className="flex items-center justify-between px-2 py-1 text-[10px] font-mono text-slate-400">
                          <span>Live Word (.docx) Preview:</span>
                          <span>Interactive Document Engine</span>
                        </div>
                        <DocxViewer
                          docxData={attachmentData}
                          fileName={attachmentName}
                          title={editTitle || "Uploaded Word Document"}
                          className="max-h-[360px]"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  /* Native iPad and Desktop Touch-Friendly Upload Zone */
                  <div>
                    <input
                      type="file"
                      id="doc-attachment-upload-input"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.doc,application/msword,image/*,.png,.jpg,.jpeg,.heic,text/*,.txt"
                      className="sr-only"
                    />

                    <label
                      htmlFor="doc-attachment-upload-input"
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`block w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                        dragOver 
                          ? "border-blue-900 bg-blue-50/50" 
                          : "border-slate-300 hover:border-blue-700 bg-white hover:bg-slate-50/80 active:bg-blue-50"
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-900 flex items-center justify-center shadow-inner">
                          <Upload className="w-6 h-6" />
                        </div>

                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            Tap to Upload .DOCX or .PDF from iPad, Phone, or Computer
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Supports Microsoft Word (.docx), multi-page PDFs, iCloud Files, and Photos
                          </p>
                        </div>

                        <div className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-bold shadow hover:bg-blue-800 transition-colors">
                          <Smartphone className="w-4 h-4" />
                          <span>Choose .DOCX or .PDF Document</span>
                        </div>

                        <span className="text-[10px] text-slate-400 font-mono mt-1">
                          Accepts .DOCX, .PDF, .JPG, .PNG, .HEIC, .TXT
                        </span>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setIsAdding(false);
                  }}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-600 text-xs cursor-pointer font-bold"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-900 hover:bg-blue-850 active:bg-blue-950 text-white rounded text-xs cursor-pointer font-bold flex items-center gap-1.5 shadow"
                >
                  <Save className="w-4 h-4" /> Save {isSopMode ? "SOP" : "Medical Directive"}
                </button>
              </div>
            </form>
          ) : selectedDoc ? (
            /* Document Reader Pane */
            <div className="bg-white border border-slate-200 rounded p-6 md:p-8 space-y-6 shadow-sm border-t-4 border-t-blue-900">
              
              {/* Header block with badges */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200 pb-5">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {isSopMode && selectedDoc.category && (
                      <span className="bg-blue-50 text-blue-900 text-[10px] px-2.5 py-0.5 rounded font-mono font-bold border border-blue-200 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-blue-700" /> {selectedDoc.category}
                      </span>
                    )}
                    {selectedDoc.attachmentType === "pdf" && (
                      <span className="bg-emerald-50 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-mono font-bold border border-emerald-200 flex items-center gap-1">
                        <FileCheck className="w-3.5 h-3.5 text-emerald-600" /> MULTI-PAGE PDF ATTACHED
                      </span>
                    )}
                    {selectedDoc.attachmentType === "docx" && (
                      <span className="bg-indigo-50 text-indigo-800 text-[10px] px-2 py-0.5 rounded font-mono font-bold border border-indigo-200 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-indigo-600" /> WORD (.DOCX) ATTACHED
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-mono uppercase">
                      {selectedDoc.updatedAt ? `Last Updated: ${selectedDoc.updatedAt}` : "Active"}
                    </span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                    {selectedDoc.title}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono block mt-1 uppercase">
                    Document Registry: {selectedDoc.id}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* View Mode Toggle */}
                  <div className="flex bg-slate-100 p-1 rounded border border-slate-200 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setDocDisplayMode("brief")}
                      className={`px-3 py-1.5 rounded text-center cursor-pointer transition-all ${
                        docDisplayMode === "brief"
                          ? "bg-white text-slate-900 shadow-sm font-bold"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Brief View
                    </button>
                    <button
                      type="button"
                      onClick={() => setDocDisplayMode("doc")}
                      className={`px-3 py-1.5 rounded text-center cursor-pointer transition-all flex items-center gap-1 ${
                        docDisplayMode === "doc"
                          ? "bg-white text-blue-900 shadow-sm font-bold"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {selectedDoc.attachmentType === "docx" ? (
                        <>
                          <FileText className="w-3.5 h-3.5 text-indigo-600" /> Word Preview
                        </>
                      ) : (
                        <>
                          <FileText className="w-3.5 h-3.5 text-red-600" /> Document Viewer
                        </>
                      )}
                    </button>
                  </div>

                  {isSupervisor && (
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => handleStartEdit(selectedDoc)}
                        className="p-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 rounded cursor-pointer transition-colors"
                        title="Edit Entry"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(selectedDoc.id)}
                        className="p-2 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-700 rounded cursor-pointer transition-colors"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Main Content Area: Switch between Brief View and Full Document (PDF / DOCX) Preview */}
              {docDisplayMode === "doc" ? (
                <div className="space-y-3 pt-2">
                  {selectedDoc.attachmentType === "docx" && selectedDoc.attachmentData ? (
                    <DocxViewer
                      docxData={selectedDoc.attachmentData}
                      fileName={selectedDoc.attachmentName || `${selectedDoc.title}.docx`}
                      title={selectedDoc.title}
                    />
                  ) : (
                    <PdfViewer
                      pdfData={
                        selectedDoc.attachmentType === "pdf" && selectedDoc.attachmentData
                          ? selectedDoc.attachmentData
                          : generateProcedurePdf(selectedDoc)
                      }
                      fileName={selectedDoc.attachmentName || `${selectedDoc.title.replace(/\s+/g, "_")}.pdf`}
                      title={selectedDoc.title}
                    />
                  )}
                </div>
              ) : (
                <>
                  {/* Reading Content Pane */}
                  <div className="text-sm text-slate-800 leading-relaxed font-sans whitespace-pre-wrap font-medium">
                    {selectedDoc.content}
                  </div>

                  {/* Render attachments dynamically */}
                  {selectedDoc.attachmentName && (
                    <div className="mt-8 pt-6 border-t border-slate-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-400">
                          Attached Document File:
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          Format: {selectedDoc.attachmentType}
                        </span>
                      </div>
                      
                      {selectedDoc.attachmentType === "docx" && selectedDoc.attachmentData ? (
                        <div className="space-y-3">
                          <DocxViewer
                            docxData={selectedDoc.attachmentData}
                            fileName={selectedDoc.attachmentName}
                            title={selectedDoc.title}
                          />
                        </div>
                      ) : selectedDoc.attachmentType === "pdf" && selectedDoc.attachmentData ? (
                        <div className="space-y-3">
                          <PdfViewer
                            pdfData={selectedDoc.attachmentData}
                            fileName={selectedDoc.attachmentName}
                            title={selectedDoc.title}
                          />
                        </div>
                      ) : selectedDoc.attachmentType === "image" && selectedDoc.attachmentData ? (
                        <div className="bg-slate-50 p-2.5 border border-slate-200 rounded overflow-hidden flex justify-center max-h-[450px]">
                          <img
                            src={selectedDoc.attachmentData}
                            alt={selectedDoc.attachmentName}
                            referrerPolicy="no-referrer"
                            className="rounded object-contain max-w-full h-auto"
                          />
                        </div>
                      ) : selectedDoc.attachmentType === "text" && selectedDoc.attachmentData ? (
                        <div className="bg-slate-50 p-4 border border-slate-200 rounded text-xs font-mono text-slate-700 overflow-x-auto max-h-[300px]">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block mb-2">Embedded Raw Text:</span>
                          {selectedDoc.attachmentData}
                        </div>
                      ) : null}
                    </div>
                  )}
                </>
              )}

            </div>
          ) : (
            <div className="h-[400px] bg-slate-50 border border-slate-200 rounded flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <BookOpen className="w-12 h-12 text-slate-300 mb-2.5" />
              <h4 className="font-bold text-slate-700 text-sm">No Document Selected</h4>
              <p className="text-xs max-w-md mt-1 leading-normal">
                Choose a document from the list on the left or tap "Add" above to create or upload a new document.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
