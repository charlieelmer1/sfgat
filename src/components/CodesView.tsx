import React, { useState } from "react";
import { Hash, ListCollapse, Search, Plus, Trash2, Edit3, Save, ArrowUpDown, ShieldAlert, Check } from "lucide-react";
import { TenCodeItem, SignalItem } from "../types";

interface CodesViewProps {
  userRole: "EMT" | "Supervisor";
  tenCodes: TenCodeItem[];
  onAddTenCode: (code: TenCodeItem) => void;
  onUpdateTenCode: (code: TenCodeItem) => void;
  onDeleteTenCode: (codeStr: string) => void;
  signals: SignalItem[];
  onAddSignal: (signal: SignalItem) => void;
  onUpdateSignal: (signal: SignalItem) => void;
  onDeleteSignal: (id: string) => void;
}

export default function CodesView({
  userRole,
  tenCodes,
  onAddTenCode,
  onUpdateTenCode,
  onDeleteTenCode,
  signals,
  onAddSignal,
  onUpdateSignal,
  onDeleteSignal,
}: CodesViewProps) {
  const isSupervisor = userRole === "Supervisor";
  const [activeSubTab, setActiveSubTab] = useState<"10codes" | "signals">("10codes");

  // Search Queries
  const [codeSearch, setCodeSearch] = useState("");
  const [signalSearch, setSignalSearch] = useState("");

  // Sort States for Signals (Numerical by ID, or Alphabetical by Meaning)
  const [signalSortField, setSignalSortField] = useState<"id" | "meaning">("id");
  const [signalSortDir, setSignalSortDir] = useState<"asc" | "desc">("asc");

  // Sort States for 10-Codes (Numerical by Code, or Alphabetical by Meaning)
  const [codeSortField, setCodeSortField] = useState<"code" | "meaning">("code");
  const [codeSortDir, setCodeSortDir] = useState<"asc" | "desc">("asc");

  // Modals / Editors
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeModalMode, setCodeModalMode] = useState<"add" | "edit">("add");
  const [originalCodeStr, setOriginalCodeStr] = useState(""); // for key matching during edits
  const [codeForm, setCodeForm] = useState<TenCodeItem>({
    code: "",
    meaning: "",
    category: "Standard Operations",
  });

  const [showSignalModal, setShowSignalModal] = useState(false);
  const [signalModalMode, setSignalModalMode] = useState<"add" | "edit">("add");
  const [selectedSignalId, setSelectedSignalId] = useState("");
  const [signalForm, setSignalForm] = useState<SignalItem>({
    id: "",
    meaning: "",
    priority: "Medium",
  });

  // Filter 10-Codes
  const filteredCodes = tenCodes.filter(
    (c) =>
      c.code.toLowerCase().includes(codeSearch.toLowerCase()) ||
      c.meaning.toLowerCase().includes(codeSearch.toLowerCase()) ||
      c.category.toLowerCase().includes(codeSearch.toLowerCase())
  );

  // Sorting helper for 10-Codes
  const getSortedCodes = () => {
    return [...filteredCodes].sort((a, b) => {
      let fieldA = a[codeSortField].toLowerCase();
      let fieldB = b[codeSortField].toLowerCase();

      if (codeSortField === "code") {
        const numA = parseInt(a.code.replace(/\D/g, ""));
        const numB = parseInt(b.code.replace(/\D/g, ""));
        if (!isNaN(numA) && !isNaN(numB)) {
          return codeSortDir === "asc" ? numA - numB : numB - numA;
        }
      }

      if (fieldA < fieldB) return codeSortDir === "asc" ? -1 : 1;
      if (fieldA > fieldB) return codeSortDir === "asc" ? 1 : -1;
      return 0;
    });
  };

  const handleToggleCodeSort = (field: "code" | "meaning") => {
    if (codeSortField === field) {
      setCodeSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setCodeSortField(field);
      setCodeSortDir("asc");
    }
  };

  // Sorting helper for Signals
  const getSortedSignals = () => {
    // Filter first
    const queried = signals.filter(
      (s) =>
        s.id.toLowerCase().includes(signalSearch.toLowerCase()) ||
        s.meaning.toLowerCase().includes(signalSearch.toLowerCase())
    );

    // Sort next
    return queried.sort((a, b) => {
      let fieldA = a[signalSortField].toLowerCase();
      let fieldB = b[signalSortField].toLowerCase();

      // For Signal ID, if it has the format "Signal X", sort by the number inside if possible
      if (signalSortField === "id") {
        const numA = parseInt(a.id.replace(/\D/g, ""));
        const numB = parseInt(b.id.replace(/\D/g, ""));
        if (!isNaN(numA) && !isNaN(numB)) {
          return signalSortDir === "asc" ? numA - numB : numB - numA;
        }
      }

      if (fieldA < fieldB) return signalSortDir === "asc" ? -1 : 1;
      if (fieldA > fieldB) return signalSortDir === "asc" ? 1 : -1;
      return 0;
    });
  };

  const handleToggleSignalSort = (field: "id" | "meaning") => {
    if (signalSortField === field) {
      setSignalSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSignalSortField(field);
      setSignalSortDir("asc");
    }
  };

  // 10 Code actions
  const handleOpenAddCode = () => {
    setCodeForm({ code: "", meaning: "", category: "Standard Operations" });
    setCodeModalMode("add");
    setShowCodeModal(true);
  };

  const handleOpenEditCode = (c: TenCodeItem) => {
    setOriginalCodeStr(c.code);
    setCodeForm({ ...c });
    setCodeModalMode("edit");
    setShowCodeModal(true);
  };

  const handleSaveCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeForm.code.trim() || !codeForm.meaning.trim()) return;

    if (codeModalMode === "add") {
      // Check if duplicate
      if (tenCodes.some((tc) => tc.code.toLowerCase() === codeForm.code.toLowerCase())) {
        alert("This 10-Code already exists. Please edit the existing code instead.");
        return;
      }
      onAddTenCode(codeForm);
    } else {
      // If code name changed, delete original and insert new, else update
      if (originalCodeStr !== codeForm.code) {
        onDeleteTenCode(originalCodeStr);
      }
      onUpdateTenCode(codeForm);
    }
    setShowCodeModal(false);
  };

  const handleDeleteCode = (codeStr: string) => {
    if (confirm(`Are you sure you want to delete code ${codeStr}?`)) {
      onDeleteTenCode(codeStr);
    }
  };

  // Signal actions
  const handleOpenAddSignal = () => {
    setSignalForm({ id: "", meaning: "", priority: "Medium" });
    setSignalModalMode("add");
    setShowSignalModal(true);
  };

  const handleOpenEditSignal = (s: SignalItem) => {
    setSelectedSignalId(s.id);
    setSignalForm({ ...s });
    setSignalModalMode("edit");
    setShowSignalModal(true);
  };

  const handleSaveSignal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signalForm.id.trim() || !signalForm.meaning.trim()) return;

    if (signalModalMode === "add") {
      if (signals.some((s) => s.id.toLowerCase() === signalForm.id.toLowerCase())) {
        alert("This Signal identifier already exists.");
        return;
      }
      onAddSignal(signalForm);
    } else {
      if (selectedSignalId !== signalForm.id) {
        onDeleteSignal(selectedSignalId);
      }
      onUpdateSignal(signalForm);
    }
    setShowSignalModal(false);
  };

  const handleDeleteSignal = (id: string) => {
    if (confirm(`Are you sure you want to delete ${id}?`)) {
      onDeleteSignal(id);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans relative">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Hash className="w-6 h-6 text-red-650" />
            Park 10-Codes & Signals Registry
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Standardized operational radiospeak codes and urgent safety signaling systems.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-100 p-1 rounded border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab("10codes")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded cursor-pointer transition-all ${
              activeSubTab === "10codes" ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Hash className="w-3.5 h-3.5" /> 10-Codes List
          </button>
          <button
            onClick={() => setActiveSubTab("signals")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded cursor-pointer transition-all ${
              activeSubTab === "signals" ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <ListCollapse className="w-3.5 h-3.5" /> Security & EMS Signals
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-200 rounded p-6 shadow-sm border-t-4 border-t-blue-900">
        
        {/* SUBTAB 1: 10 CODES */}
        {activeSubTab === "10codes" && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row justify-between gap-3 items-stretch sm:items-center">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Quick search 10-codes or operational meanings..."
                  value={codeSearch}
                  onChange={(e) => setCodeSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-900"
                />
              </div>
              {isSupervisor && (
                <button
                  onClick={handleOpenAddCode}
                  className="bg-blue-900 hover:bg-blue-850 text-white text-xs font-bold px-4 py-2 rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" /> Add 10-Code
                </button>
              )}
            </div>

            {/* Sortable Table */}
            <div className="overflow-x-auto rounded border border-slate-200">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase font-mono tracking-wider font-semibold border-b border-slate-200">
                    <th
                      className="p-4 cursor-pointer hover:bg-slate-100 hover:text-slate-950 transition-colors w-1/4"
                      onClick={() => handleToggleCodeSort("code")}
                    >
                      <div className="flex items-center gap-1 select-none">
                        10-Code
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th
                      className="p-4 cursor-pointer hover:bg-slate-100 hover:text-slate-950 transition-colors"
                      onClick={() => handleToggleCodeSort("meaning")}
                    >
                      <div className="flex items-center gap-1 select-none">
                        Operational Definition / Meaning
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                    {isSupervisor && <th className="p-4 text-right w-1/6">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {getSortedCodes().length === 0 ? (
                    <tr>
                      <td colSpan={isSupervisor ? 3 : 2} className="text-center p-8 text-slate-400">
                        No 10-codes matching criteria.
                      </td>
                    </tr>
                  ) : (
                    getSortedCodes().map((c) => (
                      <tr key={c.code} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-800 text-sm">
                          {c.code}
                        </td>
                        <td className="p-4 font-sans text-slate-700 text-sm font-semibold">{c.meaning}</td>
                        {isSupervisor && (
                          <td className="p-4 text-right whitespace-nowrap">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditCode(c)}
                                className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCode(c.code)}
                                className="p-1.5 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-650 rounded cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBTAB 2: SIGNALS */}
        {activeSubTab === "signals" && (
          <div className="space-y-4">
            
            <div className="flex flex-col sm:flex-row justify-between gap-3 items-stretch sm:items-center">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Quick search signals or meanings..."
                  value={signalSearch}
                  onChange={(e) => setSignalSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-900"
                />
              </div>
              {isSupervisor && (
                <button
                  onClick={handleOpenAddSignal}
                  className="bg-blue-900 hover:bg-blue-850 text-white text-xs font-bold px-4 py-2 rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" /> Add Signal
                </button>
              )}
            </div>

            {/* Sortable Table */}
            <div className="overflow-x-auto rounded border border-slate-200">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase font-mono tracking-wider font-semibold border-b border-slate-200">
                    <th
                      className="p-4 cursor-pointer hover:bg-slate-100 hover:text-slate-950 transition-colors w-1/4"
                      onClick={() => handleToggleSignalSort("id")}
                    >
                      <div className="flex items-center gap-1 select-none">
                        Signal ID
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th
                      className="p-4 cursor-pointer hover:bg-slate-100 hover:text-slate-950 transition-colors"
                      onClick={() => handleToggleSignalSort("meaning")}
                    >
                      <div className="flex items-center gap-1 select-none">
                        Operational Definition / Meaning
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                    {isSupervisor && <th className="p-4 text-right w-1/6">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {getSortedSignals().length === 0 ? (
                    <tr>
                      <td colSpan={isSupervisor ? 3 : 2} className="text-center p-8 text-slate-400">
                        No safety signals matching criteria.
                      </td>
                    </tr>
                  ) : (
                    getSortedSignals().map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-mono font-bold text-slate-800 text-sm">
                          {s.id}
                        </td>
                        <td className="p-4 font-sans text-slate-700 text-sm font-semibold">{s.meaning}</td>
                        {isSupervisor && (
                          <td className="p-4 text-right whitespace-nowrap">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditSignal(s)}
                                className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSignal(s.id)}
                                className="p-1.5 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-650 rounded cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* 10-CODE MODAL */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <form
            onSubmit={handleSaveCode}
            className="bg-white border border-slate-200 rounded w-full max-w-md p-6 space-y-4 shadow-2xl relative animate-in fade-in zoom-in duration-200"
          >
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2 font-sans">
              <Hash className="w-5 h-5 text-red-600" />
              {codeModalMode === "add" ? "Create 10-Code Entry" : "Modify 10-Code"}
            </h3>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">
                  10-Code Identifier
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10-45"
                  value={codeForm.code}
                  onChange={(e) => setCodeForm({ ...codeForm, code: e.target.value.trim() })}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-800 focus:outline-none focus:border-blue-900 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">
                  Radio Transmission Meaning
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Medical Emergency - Patient Encountered"
                  value={codeForm.meaning}
                  onChange={(e) => setCodeForm({ ...codeForm, meaning: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-900 font-sans"
                />
              </div>

              {/* Classification removed */}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowCodeModal(false)}
                className="px-3 py-1.5 bg-white text-slate-500 hover:bg-slate-50 border border-slate-200 rounded text-xs cursor-pointer font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-850 text-white rounded text-xs cursor-pointer font-bold flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" /> Save 10-Code
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SIGNAL MODAL */}
      {showSignalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <form
            onSubmit={handleSaveSignal}
            className="bg-white border border-slate-200 rounded w-full max-w-md p-6 space-y-4 shadow-2xl relative animate-in fade-in zoom-in duration-200"
          >
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2 font-sans">
              <ShieldAlert className="w-5 h-5 text-red-650" />
              {signalModalMode === "add" ? "Create Security Signal" : "Modify Signal"}
            </h3>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">
                  Signal Identifier / Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Signal 30"
                  value={signalForm.id}
                  onChange={(e) => setSignalForm({ ...signalForm, id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-800 focus:outline-none focus:border-blue-900 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">
                  Signal Definition / Action Criteria
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CPR In Progress / Defibrillator Dispatched"
                  value={signalForm.meaning}
                  onChange={(e) => setSignalForm({ ...signalForm, meaning: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-900 font-sans"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowSignalModal(false)}
                className="px-3 py-1.5 bg-white text-slate-500 hover:bg-slate-50 border border-slate-200 rounded text-xs cursor-pointer font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-850 text-white rounded text-xs cursor-pointer font-bold flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" /> Save Signal
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
