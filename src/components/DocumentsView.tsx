import React, { useState, useRef } from "react";
import { BookOpen, FileText, Plus, Trash2, Edit, Search, FileDown, Image, Paperclip, Upload, Eye, EyeOff, Save, FileCheck, Smartphone } from "lucide-react";
import { DocumentItem } from "../types";
import PdfViewer from "./PdfViewer";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTypeFilter, setActiveTypeFilter] = useState<"procedures" | "direction">("procedures");

  // Filter documents based on mode and filters
  const filteredDocs = documents.filter((doc) => {
    // Determine if it belongs to this tab
    const isSopMode = mode === "sops";
    const matchesMode = isSopMode 
      ? !doc.type // SOPs do not have a separate sub-type in types, or they're labeled standard
      : doc.type !== undefined;

    if (!matchesMode) return false;

    // Search query match
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchTerm.toLowerCase());

    // Sub-type filter for protocols
    if (mode === "protocols") {
      return matchesSearch && doc.type === activeTypeFilter;
    }

    return matchesSearch;
  });

  // Active document selection
  const [selectedDocId, setSelectedDocId] = useState<string | null>(
    filteredDocs.length > 0 ? filteredDocs[0].id : null
  );

  const selectedDoc = filteredDocs.find((doc) => doc.id === selectedDocId) || filteredDocs[0];

  // Document presentation view mode: "brief" (formatted text) vs "pdf" (interactive PDF canvas viewer)
  const [docDisplayMode, setDocDisplayMode] = useState<"brief" | "pdf">("brief");

  // Editor states
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editType, setEditType] = useState<"procedures" | "direction">("procedures");
  const [editContent, setEditContent] = useState("");
  
  // File upload state
  const [attachmentName, setAttachmentName] = useState<string>("");
  const [attachmentType, setAttachmentType] = useState<"pdf" | "image" | "text" | undefined>(undefined);
  const [attachmentData, setAttachmentData] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStartAdd = () => {
    setEditTitle("");
    setEditCategory(mode === "protocols" ? "Cardiac" : "Operations");
    setEditType("procedures");
    setEditContent("");
    setAttachmentName("");
    setAttachmentType(undefined);
    setAttachmentData("");
    setIsAdding(true);
    setIsEditing(false);
  };

  const handleStartEdit = (doc: DocumentItem) => {
    setEditTitle(doc.title);
    setEditCategory(doc.category || "");
    setEditType(doc.type || "procedures");
    setEditContent(doc.content);
    setAttachmentName(doc.attachmentName || "");
    setAttachmentType(doc.attachmentType);
    setAttachmentData(doc.attachmentData || "");
    setIsEditing(true);
    setIsAdding(false);
  };

  // Process uploaded files to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    setAttachmentName(file.name);
    
    let type: "pdf" | "image" | "text" = "text";
    if (file.type.includes("image")) {
      type = "image";
    } else if (file.type.includes("pdf")) {
      type = "pdf";
    }
    setAttachmentType(type);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAttachmentData(event.target.result as string);
      }
    };

    if (type === "text") {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file); // Holds base64 string for images or PDFs
    }
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
    if (!editTitle.trim() || !editContent.trim()) return;

    const formattedDate = new Date().toISOString().split("T")[0];

    if (isAdding) {
      const newDoc: DocumentItem = {
        id: `doc-${Date.now()}`,
        title: editTitle,
        category: editCategory,
        type: mode === "protocols" ? editType : undefined, // SOPs do not get a subtype
        content: editContent,
        attachmentName: attachmentName || undefined,
        attachmentType: attachmentType,
        attachmentData: attachmentData || undefined,
        updatedAt: formattedDate,
      };
      onAddDocument(newDoc);
      setSelectedDocId(newDoc.id);
      setIsAdding(false);
    } else if (isEditing && selectedDoc) {
      const updatedDoc: DocumentItem = {
        ...selectedDoc,
        title: editTitle,
        category: editCategory,
        type: mode === "protocols" ? editType : undefined,
        content: editContent,
        attachmentName: attachmentName || undefined,
        attachmentType: attachmentType,
        attachmentData: attachmentData || undefined,
        updatedAt: formattedDate,
      };
      onUpdateDocument(updatedDoc);
      setIsEditing(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to permanently delete this document?")) {
      onDeleteDocument(id);
      setSelectedDocId(null);
    }
  };

  const removeAttachment = () => {
    setAttachmentName("");
    setAttachmentType(undefined);
    setAttachmentData("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-red-600" />
            {mode === "protocols" ? "Medical Protocols & Guidelines" : "Standard Operating Procedures (SOPs)"}
          </h2>
        </div>
        {isSupervisor && !isAdding && !isEditing && (
          <button
            onClick={handleStartAdd}
            className="bg-blue-900 hover:bg-blue-850 active:bg-blue-955 text-white text-xs font-bold px-4 py-2.5 rounded flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-4.5 h-4.5" /> Add {mode === "protocols" ? "Protocol" : "SOP"}
          </button>
        )}
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column - Search & Listing */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Search Box */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder={`Search ${mode === "protocols" ? "protocols" : "SOPs"}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
            />
          </div>

          {/* Protocols-only sub-type tabs */}
          {mode === "protocols" && (
            <div className="flex bg-slate-100 p-1 rounded border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => {
                  setActiveTypeFilter("procedures");
                  const firstProc = documents.find(d => d.type === "procedures");
                  if (firstProc) setSelectedDocId(firstProc.id);
                }}
                className={`flex-1 py-1.5 rounded text-center cursor-pointer transition-all ${
                  activeTypeFilter === "procedures" ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                SF Procedures
              </button>
              <button
                onClick={() => {
                  setActiveTypeFilter("direction");
                  const firstDir = documents.find(d => d.type === "direction");
                  if (firstDir) setSelectedDocId(firstDir.id);
                }}
                className={`flex-1 py-1.5 rounded text-center cursor-pointer transition-all ${
                  activeTypeFilter === "direction" ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Med Direction
              </button>
            </div>
          )}

          {/* Catalog Listing */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredDocs.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 border border-slate-200 rounded">
                <span className="text-xs text-slate-400 block">No documents found matching search criteria.</span>
              </div>
            ) : (
              filteredDocs.map((doc) => {
                const isSelected = selectedDoc?.id === doc.id;
                return (
                  <button
                    key={doc.id}
                    onClick={() => {
                      setSelectedDocId(doc.id);
                      setIsEditing(false);
                      setIsAdding(false);
                    }}
                    className={`w-full text-left p-3.5 rounded border transition-all cursor-pointer flex flex-col gap-1 ${
                      isSelected
                        ? "bg-slate-50 border-blue-900 shadow-inner border-l-4"
                        : "bg-white border-slate-200 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {doc.category || "General"}
                      </span>
                      {mode === "protocols" && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                          doc.type === "procedures" 
                            ? "bg-blue-50 text-blue-800 border border-blue-200" 
                            : "bg-purple-50 text-purple-800 border border-purple-200"
                        }`}>
                          {doc.type === "procedures" ? "SF Procedure" : "Medical Direction"}
                        </span>
                      )}
                    </div>
                    <h4 className={`font-bold text-xs mt-1.5 line-clamp-1 ${isSelected ? "text-blue-900" : "text-slate-800"}`}>
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
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2.5">
                {isAdding ? "Draft New Document Entry" : `Edit: ${editTitle}`}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono mb-1.5">
                    Document Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cardiac Arrest Response Guidelines"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono mb-1.5">
                    Clinical Category / Section
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cardiac, Environmental, Trauma"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-900"
                  />
                </div>
              </div>

              {mode === "protocols" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono mb-1.5">
                    Protocol Direction Authority
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="protocolType"
                        checked={editType === "procedures"}
                        onChange={() => setEditType("procedures")}
                        className="accent-blue-900"
                      />
                      Six Flags Procedure
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="protocolType"
                        checked={editType === "direction"}
                        onChange={() => setEditType("direction")}
                        className="accent-blue-900"
                      />
                      Medical Direction (CentraState / Hospital)
                    </label>
                  </div>
                </div>
              )}

              {/* Rich text body editor */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono mb-1.5">
                  Guideline / Clinical Instructions Content
                </label>
                <textarea
                  required
                  rows={10}
                  placeholder="Provide precise, step-by-step clinical directions here..."
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-900 font-mono leading-relaxed"
                />
              </div>

              {/* Advanced Attachment Center */}
              <div className="border border-slate-200 rounded p-4 bg-slate-50">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono block mb-2">
                  Attachments & Media Center (PDFs, Images, Text Files)
                </span>
                
                {attachmentName ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded shadow-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        {attachmentType === "image" ? (
                          <Image className="w-5 h-5 text-amber-500 shrink-0" />
                        ) : (
                          <FileText className="w-5 h-5 text-red-600 shrink-0" />
                        )}
                        <div className="truncate">
                          <span className="text-xs text-slate-800 font-medium block truncate">{attachmentName}</span>
                          <span className="text-[10px] text-slate-400 font-mono uppercase">{attachmentType} file attached</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeAttachment}
                        className="text-xs text-red-600 hover:text-red-800 transition-colors uppercase font-mono font-bold cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>

                    {attachmentType === "pdf" && attachmentData && (
                      <div className="border border-slate-200 rounded p-2 bg-slate-50">
                        <span className="text-[10px] text-slate-500 font-mono uppercase font-bold block mb-1">
                          Live PDF Upload Preview:
                        </span>
                        <PdfViewer
                          pdfData={attachmentData}
                          fileName={attachmentName}
                          title={editTitle || "Uploaded Procedure Attachment"}
                          className="max-h-[350px]"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded p-5 text-center transition-all ${
                      dragOver ? "border-blue-900 bg-blue-50/40" : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <Paperclip className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-700 font-medium">Drag and drop attachment file here, or browse</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">Supports PDF guidelines, reference charts, images or raw notes</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-3 inline-flex items-center gap-1 text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-2 rounded border border-slate-200 cursor-pointer uppercase font-bold"
                    >
                      <Upload className="w-3.5 h-3.5" /> Browse System Files
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*,application/pdf,text/*"
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {/* Action Rows */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setIsAdding(false);
                  }}
                  className="px-4 py-2 bg-white hover:bg-slate-55 border border-slate-200 rounded text-slate-600 text-xs cursor-pointer font-bold"
                >
                  Discard Changes
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-850 text-white rounded text-xs cursor-pointer font-bold flex items-center gap-1"
                >
                  <Save className="w-4 h-4" /> Save {mode === "protocols" ? "Protocol" : "SOP"}
                </button>
              </div>
            </form>
          ) : selectedDoc ? (
            /* Document Reader Pane */
            <div className="bg-white border border-slate-200 rounded p-6 md:p-8 space-y-6 shadow-sm border-t-4 border-t-blue-900">
              
              {/* Header block */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200 pb-5">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="bg-red-50 text-red-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase border border-red-200">
                      {selectedDoc.category || "General"}
                    </span>
                    {mode === "protocols" && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        selectedDoc.type === "procedures" 
                          ? "bg-blue-50 text-blue-800 border border-blue-200" 
                          : "bg-purple-50 text-purple-800 border border-purple-200"
                      }`}>
                        {selectedDoc.type === "procedures" ? "SF Procedure Authority" : "Medical Direction Directive"}
                      </span>
                    )}
                    {selectedDoc.attachmentType === "pdf" && (
                      <span className="bg-emerald-50 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold border border-emerald-200 flex items-center gap-1">
                        <FileCheck className="w-3 h-3 text-emerald-600" /> PDF ATTACHED
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                    {selectedDoc.title}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono block mt-1.5 uppercase">
                    Document Registry: {selectedDoc.id}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* View Mode Toggle: Brief vs PDF Preview */}
                  <div className="flex bg-slate-100 p-1 rounded border border-slate-200 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setDocDisplayMode("brief")}
                      className={`px-3 py-1 rounded text-center cursor-pointer transition-all ${
                        docDisplayMode === "brief"
                          ? "bg-white text-slate-900 shadow-sm font-bold"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Brief View
                    </button>
                    <button
                      type="button"
                      onClick={() => setDocDisplayMode("pdf")}
                      className={`px-3 py-1 rounded text-center cursor-pointer transition-all flex items-center gap-1 ${
                        docDisplayMode === "pdf"
                          ? "bg-white text-blue-900 shadow-sm font-bold"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 text-red-600" /> PDF Preview
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

              {/* Main Content Area: Switch between Brief View and Full PDF Preview */}
              {docDisplayMode === "pdf" ? (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                    <span className="flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                      Mobile & Laptop Optimized PDF Canvas Engine
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {selectedDoc.attachmentName || "Standard Formatted Clinical PDF"}
                    </span>
                  </div>

                  <PdfViewer
                    pdfData={
                      selectedDoc.attachmentType === "pdf" && selectedDoc.attachmentData
                        ? selectedDoc.attachmentData
                        : generateProcedurePdf(selectedDoc)
                    }
                    fileName={selectedDoc.attachmentName || `${selectedDoc.title.replace(/\s+/g, "_")}.pdf`}
                    title={selectedDoc.title}
                  />
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
                          Linked Attachment Document:
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          Format: {selectedDoc.attachmentType}
                        </span>
                      </div>
                      
                      {selectedDoc.attachmentType === "image" && selectedDoc.attachmentData ? (
                        <div className="bg-slate-50 p-2.5 border border-slate-200 rounded overflow-hidden flex justify-center max-h-[450px]">
                          <img
                            src={selectedDoc.attachmentData}
                            alt={selectedDoc.attachmentName}
                            referrerPolicy="no-referrer"
                            className="rounded object-contain max-w-full h-auto"
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
                Choose a document from the catalog list on the left to review precise emergency guidelines or clinical protocols.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
