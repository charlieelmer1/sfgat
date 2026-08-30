import React, { useState } from "react";
import { ShieldCheck, Megaphone, Clock, RefreshCw, Users, BookOpen, Phone, Hash, Save, AlertTriangle, UserCheck, Plus, Trash2, ArrowUpDown, Check, ListFilter } from "lucide-react";
import { ParkHours, SupervisorChoice, PREDEFINED_SUPERVISORS, DocumentItem, RosterItem, ContactItem, PhoneExtension, TenCodeItem, SignalItem, WeeklySchedule, INITIAL_STAFF_NAMES } from "../types";

interface SupervisorAdminProps {
  parkHours: ParkHours;
  onUpdateHours: (hours: ParkHours) => void;
  announcement: string;
  onUpdateAnnouncement: (text: string) => void;
  
  // Counts
  roster: RosterItem[];
  protocols: DocumentItem[];
  sops: DocumentItem[];
  contacts: ContactItem[];
  extensions: PhoneExtension[];
  tenCodes: TenCodeItem[];
  signals: SignalItem[];

  // Roster Supervisor updates
  predefinedSupervisorsList: SupervisorChoice[];
  onUpdatePredefinedSupervisorsList: (list: SupervisorChoice[]) => void;

  // Callsign Staff Pool (Dropdown list for dashboard callsigns)
  staffNamesList: string[];
  onUpdateStaffNamesList: (names: string[]) => void;

  // Emergency reset
  onResetToDefaults: () => void;
}

export default function SupervisorAdmin({
  parkHours,
  onUpdateHours,
  announcement,
  onUpdateAnnouncement,
  roster,
  protocols,
  sops,
  contacts,
  extensions,
  tenCodes,
  signals,
  predefinedSupervisorsList,
  onUpdatePredefinedSupervisorsList,
  staffNamesList,
  onUpdateStaffNamesList,
  onResetToDefaults,
}: SupervisorAdminProps) {
  const [editedThemeHours, setEditedThemeHours] = useState(parkHours.themePark);
  const [editedWaterHours, setEditedWaterHours] = useState(parkHours.waterPark);
  const [editedAnnounce, setEditedAnnounce] = useState(announcement);
  const [hasReset, setHasReset] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Edit predefined supervisors state
  const [localSups, setLocalSups] = useState<SupervisorChoice[]>([...predefinedSupervisorsList]);

  // Edit staff dropdown names pool
  const [localStaff, setLocalStaff] = useState<string[]>([...staffNamesList]);
  const [newStaffInput, setNewStaffInput] = useState("");
  const [bulkInputMode, setBulkInputMode] = useState(false);
  const [staffSavedToast, setStaffSavedToast] = useState(false);
  const [supsSavedToast, setSupsSavedToast] = useState(false);
  const [hoursSavedToast, setHoursSavedToast] = useState(false);

  // Keep state synced with Firestore real-time updates
  React.useEffect(() => {
    setEditedAnnounce(announcement);
  }, [announcement]);

  React.useEffect(() => {
    setEditedThemeHours(parkHours.themePark);
    setEditedWaterHours(parkHours.waterPark);
  }, [parkHours]);

  React.useEffect(() => {
    setLocalSups([...predefinedSupervisorsList]);
  }, [predefinedSupervisorsList]);

  React.useEffect(() => {
    setLocalStaff([...staffNamesList]);
  }, [staffNamesList]);

  const handleUpdateSups = (idx: number, field: "name" | "phone", value: string) => {
    const updated = [...localSups];
    updated[idx] = { ...updated[idx], [field]: value };
    setLocalSups(updated);
  };

  const handleSaveSups = () => {
    onUpdatePredefinedSupervisorsList(localSups);
    setSupsSavedToast(true);
    setTimeout(() => setSupsSavedToast(false), 2500);
  };

  // Staff Pool Operations
  const handleAddStaffName = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const raw = newStaffInput.trim();
    if (!raw) return;

    // Split by newlines or commas in case user pastes multiple names
    const incomingNames = raw
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (incomingNames.length === 0) return;

    // Add unique names not already in pool (case-insensitive check)
    const existingLower = new Set(localStaff.map((s) => s.toLowerCase()));
    const toAdd: string[] = [];

    for (const name of incomingNames) {
      if (!existingLower.has(name.toLowerCase())) {
        existingLower.add(name.toLowerCase());
        toAdd.push(name);
      }
    }

    if (toAdd.length === 0) {
      alert(`The entered name(s) already exist in the dropdown staff pool.`);
      return;
    }

    const updated = [...localStaff, ...toAdd];
    setLocalStaff(updated);
    setNewStaffInput("");
    onUpdateStaffNamesList(updated);
    setStaffSavedToast(true);
    setTimeout(() => setStaffSavedToast(false), 2500);
  };

  const handleUpdateStaffItem = (idx: number, newName: string) => {
    const updated = [...localStaff];
    updated[idx] = newName;
    setLocalStaff(updated);
  };

  const handleDeleteStaffItem = (idx: number) => {
    const removedName = localStaff[idx];
    const updated = localStaff.filter((_, i) => i !== idx);
    setLocalStaff(updated);
    onUpdateStaffNamesList(updated);
    setStaffSavedToast(true);
    setTimeout(() => setStaffSavedToast(false), 2500);
  };

  const handleSortStaffAlphabetical = () => {
    const sorted = [...localStaff].sort((a, b) => a.localeCompare(b));
    setLocalStaff(sorted);
    onUpdateStaffNamesList(sorted);
    setStaffSavedToast(true);
    setTimeout(() => setStaffSavedToast(false), 2500);
  };

  const handleRestoreDefaultStaff = () => {
    if (confirm("Restore the default list of EMS staff names? Custom added names will be merged.")) {
      const merged = Array.from(new Set<string>([...localStaff, ...INITIAL_STAFF_NAMES]));
      setLocalStaff(merged);
      onUpdateStaffNamesList(merged);
      setStaffSavedToast(true);
      setTimeout(() => setStaffSavedToast(false), 2500);
    }
  };

  const handleSaveStaffList = () => {
    const filtered = localStaff.map(s => s.trim()).filter(Boolean);
    const unique = Array.from(new Set<string>(filtered));
    setLocalStaff(unique);
    onUpdateStaffNamesList(unique);
    setStaffSavedToast(true);
    setTimeout(() => setStaffSavedToast(false), 2500);
  };

  const handleSaveHoursAndAnnounce = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateHours({
      themePark: editedThemeHours,
      waterPark: editedWaterHours,
    });
    onUpdateAnnouncement(editedAnnounce);
    setHoursSavedToast(true);
    setTimeout(() => setHoursSavedToast(false), 2500);
  };

  const handleResetSystem = () => {
    setPasswordError("");
    fetch("/api/verify-reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: resetPassword }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.success) {
          if (confirm("🚨 WARNING: This will reset all Medical Protocols, SOPs, Roster, Callsign Staff Pools, Contacts, Extensions, 10-Codes, and Schedules back to their factory defaults. Any customized edits will be overwritten. Continue?")) {
            onResetToDefaults();
            setHasReset(true);
            setResetPassword("");
            setPasswordError("");
            // Refresh local states
            setEditedThemeHours(parkHours.themePark);
            setEditedWaterHours(parkHours.waterPark);
            setEditedAnnounce(announcement);
            setLocalSups([...predefinedSupervisorsList]);
            setLocalStaff([...INITIAL_STAFF_NAMES]);
            setTimeout(() => setHasReset(false), 2000);
          }
        } else {
          setPasswordError(data.error || "❌ ACCESS DENIED: Incorrect supervisor password.");
        }
      })
      .catch((err) => {
        console.error("Password verification failed:", err);
        setPasswordError("❌ Network error. Please try again.");
      });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* Title block */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-red-650" />
          Supervisor Panel
        </h2>
        <p className="text-slate-550 text-sm mt-1">
          Full command control over announcements, operating hours, callsign roster staff pool, schedule pools, and system datasets.
        </p>
      </div>

      {/* Grid of Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-200 p-4 rounded text-center shadow-sm border-t-2 border-t-blue-900">
          <Users className="w-5 h-5 text-red-650 mx-auto mb-1.5" />
          <span className="text-[10px] text-slate-500 font-mono uppercase block font-semibold">Active Roster / Pool</span>
          <span className="text-xl font-bold text-slate-900 font-mono">{roster.length} <span className="text-xs font-normal text-slate-500 font-sans">({localStaff.length} in Pool)</span></span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded text-center shadow-sm border-t-2 border-t-blue-900">
          <BookOpen className="w-5 h-5 text-blue-900 mx-auto mb-1.5" />
          <span className="text-[10px] text-slate-500 font-mono uppercase block font-semibold">Protocols & SOPs</span>
          <span className="text-xl font-bold text-slate-900 font-mono">{protocols.length + sops.length}</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded text-center shadow-sm border-t-2 border-t-blue-900">
          <Phone className="w-5 h-5 text-emerald-700 mx-auto mb-1.5" />
          <span className="text-[10px] text-slate-500 font-mono uppercase block font-semibold">Extensions & Contacts</span>
          <span className="text-xl font-bold text-slate-900 font-mono">{extensions.length + contacts.length}</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded text-center shadow-sm border-t-2 border-t-blue-900">
          <Hash className="w-5 h-5 text-purple-700 mx-auto mb-1.5" />
          <span className="text-[10px] text-slate-500 font-mono uppercase block font-semibold">10-Codes & Signals</span>
          <span className="text-xl font-bold text-slate-900 font-mono">{tenCodes.length + signals.length}</span>
        </div>

      </div>

      {/* Main Administrative Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Shift Settings & Callsign Staff Dropdown Pool */}
        <div className="lg:col-span-7 space-y-6">

          {/* Callsign Staff Pool / Dropdown Names Management (NEW & SYNCED TO FIRESTORE) */}
          <div className="bg-white border border-slate-200 rounded p-6 shadow-sm border-t-4 border-t-emerald-600">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                  Callsign Staff Pool (Dashboard Dropdown Names)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Names created here appear in the dropdown picker for all callsigns on the Dashboard roster.
                </p>
              </div>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono font-bold px-2.5 py-1 rounded shrink-0 self-start sm:self-auto">
                {localStaff.length} Names
              </span>
            </div>

            {/* Add New Name Form (Enlarged and optimized for desktop & mobile) */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 mb-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  Add Staff to Dropdown Pool:
                </label>
                <button
                  type="button"
                  onClick={() => setBulkInputMode(!bulkInputMode)}
                  className="text-[11px] font-mono font-bold text-emerald-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                >
                  {bulkInputMode ? "Single Name Mode" : "Bulk / Multi-Name Paste"}
                </button>
              </div>

              {bulkInputMode ? (
                <form onSubmit={handleAddStaffName} className="space-y-2">
                  <textarea
                    rows={4}
                    value={newStaffInput}
                    onChange={(e) => setNewStaffInput(e.target.value)}
                    placeholder="Paste multiple staff names (separated by new lines or commas)...&#10;e.g.&#10;Jane Smith&#10;Robert Martinez&#10;Alex Morgan"
                    className="w-full bg-white border-2 border-emerald-300 focus:border-emerald-600 rounded-lg p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium shadow-sm transition-all resize-y"
                    autoFocus
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-slate-500 font-mono">
                      Separate each EMT name with a new line or comma
                    </span>
                    <button
                      type="submit"
                      disabled={!newStaffInput.trim()}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs cursor-pointer font-bold flex items-center gap-1.5 transition-colors shadow"
                    >
                      <Plus className="w-4 h-4" /> Add All Names to Pool
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleAddStaffName} className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={newStaffInput}
                      onChange={(e) => setNewStaffInput(e.target.value)}
                      placeholder="Type EMT or Staff Member Name (e.g. John Doe)..."
                      className="w-full bg-white border-2 border-slate-300 focus:border-emerald-600 rounded-lg px-4 py-3 text-sm md:text-base text-slate-900 placeholder-slate-400 focus:outline-none font-semibold shadow-sm transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!newStaffInput.trim()}
                    className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm cursor-pointer font-bold flex items-center justify-center gap-2 shrink-0 transition-colors shadow-md active:scale-[0.99]"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Name to Dropdown</span>
                  </button>
                </form>
              )}
            </div>

            {/* Quick Actions Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded border border-slate-200 text-xs mb-3 font-mono">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSortStaffAlphabetical}
                  className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-200 flex items-center gap-1 cursor-pointer font-medium"
                  title="Sort names alphabetically"
                >
                  <ArrowUpDown className="w-3 h-3 text-slate-500" /> Sort A-Z
                </button>
                <button
                  type="button"
                  onClick={handleRestoreDefaultStaff}
                  className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-200 flex items-center gap-1 cursor-pointer font-medium"
                  title="Merge default roster names"
                >
                  <RefreshCw className="w-3 h-3 text-slate-500" /> Defaults
                </button>
              </div>
              <span className="text-[11px] text-slate-500 font-sans">
                💡 Changes sync automatically to Firebase Firestore.
              </span>
            </div>

            {/* List of Staff Names in Pool */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {localStaff.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 italic bg-slate-50 rounded border border-dashed border-slate-200">
                  No names currently in the dropdown pool. Add staff names above to populate callsign dropdowns.
                </div>
              ) : (
                localStaff.map((staffName, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 bg-slate-50 hover:bg-slate-100/80 p-2 rounded border border-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-[10px] font-mono text-slate-400 w-5 text-right shrink-0">
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        value={staffName}
                        onChange={(e) => handleUpdateStaffItem(idx, e.target.value)}
                        onBlur={handleSaveStaffList}
                        className="bg-white border border-slate-200 hover:border-slate-300 focus:border-emerald-600 rounded px-2.5 py-1.5 text-xs sm:text-sm text-slate-800 font-medium flex-1 focus:outline-none transition-colors"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteStaffItem(idx)}
                      className="text-slate-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                      title="Remove name from dropdown pool"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Save & Feedback Bar */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-500 font-sans">
                {staffSavedToast ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1 animate-fadeIn">
                    <Check className="w-4 h-4 text-emerald-600" /> Synced with Firebase Cloud!
                  </span>
                ) : (
                  <span>Click in any field to edit. Remove with trash button.</span>
                )}
              </span>
              <button
                type="button"
                onClick={handleSaveStaffList}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs cursor-pointer font-bold flex items-center gap-1 shadow-sm transition-colors"
              >
                <Save className="w-4 h-4" /> Save Staff Pool
              </button>
            </div>
          </div>
          
          {/* Operational Settings Form */}
          <form onSubmit={handleSaveHoursAndAnnounce} className="bg-white border border-slate-200 rounded p-6 space-y-5 shadow-sm border-t-4 border-t-blue-900">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2.5 flex items-center gap-1.5">
              <Megaphone className="w-5 h-5 text-red-650" />
              Quick Operational Settings
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider font-mono mb-1.5">
                Active Shift Announcement Banner
              </label>
              <textarea
                value={editedAnnounce}
                onChange={(e) => setEditedAnnounce(e.target.value)}
                rows={4}
                className="w-full bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-900 leading-relaxed font-sans shadow-inner"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider font-mono mb-1.5">
                  Theme Park Hours of Operation
                </label>
                <input
                  type="text"
                  value={editedThemeHours}
                  onChange={(e) => setEditedThemeHours(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-900 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider font-mono mb-1.5">
                  Water Park Hours of Operation
                </label>
                <input
                  type="text"
                  value={editedWaterHours}
                  onChange={(e) => setEditedWaterHours(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-900 font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-500 font-sans">
                {hoursSavedToast && (
                  <span className="text-blue-700 font-bold flex items-center gap-1 animate-fadeIn">
                    <Check className="w-4 h-4 text-blue-600" /> Operational parameters saved!
                  </span>
                )}
              </span>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-900 hover:bg-blue-850 text-white rounded text-xs cursor-pointer font-bold flex items-center gap-1 shadow-sm"
              >
                <Save className="w-4 h-4" /> Save Shift Settings
              </button>
            </div>
          </form>

        </div>

        {/* Right Form Column - Preselected supervisor entries & Factory Reset */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Preselected Supervisor Pool Edit */}
          <div className="bg-white border border-slate-200 rounded p-6 space-y-4 shadow-sm border-t-4 border-t-blue-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <Users className="w-5 h-5 text-blue-900" />
                Preselected Supervisor Pool
              </h3>
              <span className="text-xs font-mono text-slate-400">790/170 Schedule</span>
            </div>
            <p className="text-xs text-slate-550 leading-normal">
              Edit names and phone numbers in the select pool for 790/170 schedule assignments.
            </p>

            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
              {localSups.map((sup, idx) => (
                <div key={sup.id} className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded border border-slate-200">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono font-bold text-slate-500 block">NAME</span>
                    <input
                      type="text"
                      value={sup.name}
                      onChange={(e) => handleUpdateSups(idx, "name", e.target.value)}
                      className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-900 rounded p-1 text-xs text-slate-800 focus:outline-none font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono font-bold text-slate-500 block">PHONE NUMBER</span>
                    <input
                      type="text"
                      value={sup.phone}
                      onChange={(e) => handleUpdateSups(idx, "phone", e.target.value)}
                      className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-900 rounded p-1 text-xs text-slate-800 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                {supsSavedToast && (
                  <span className="text-emerald-700 font-bold flex items-center gap-1 animate-fadeIn">
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Saved!
                  </span>
                )}
              </span>
              <button
                onClick={handleSaveSups}
                className="bg-white hover:bg-slate-50 text-slate-700 text-xs px-3 py-2 rounded border border-slate-200 hover:border-slate-300 cursor-pointer font-bold flex items-center justify-center gap-1"
              >
                <Save className="w-3.5 h-3.5" /> Save Preselected Pool
              </button>
            </div>
          </div>

          {/* Factory Reset Section */}
          <div className="bg-white border border-slate-200 rounded p-6 space-y-3.5 shadow-sm border-t-4 border-t-red-650">
            <h3 className="text-sm uppercase font-mono font-bold tracking-wider text-red-650 flex items-center gap-1.5">
              <AlertTriangle className="w-5 h-5 text-red-650 animate-pulse" />
              Emergency Reset Controls
            </h3>
            <p className="text-xs text-slate-550 leading-relaxed">
              If datasets become corrupted or you wish to purge all custom entries and restore the realistic pre-loaded rosters, phone extension logs, 10-codes, and protocols, trigger a factory reset.
            </p>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                Enter Supervisor Password To Unlock Reset
              </label>
              <input
                type="password"
                value={resetPassword}
                onChange={(e) => {
                  setResetPassword(e.target.value);
                  setPasswordError("");
                }}
                placeholder="Supervisor Reset Password"
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-red-650 font-mono shadow-inner"
              />
              {passwordError && (
                <p className="text-[10px] text-red-600 font-bold font-mono mt-1">{passwordError}</p>
              )}
            </div>

            <button
              onClick={handleResetSystem}
              disabled={hasReset}
              className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-800 text-xs py-2.5 rounded cursor-pointer font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              {hasReset ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> System Restore Completed!
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" /> Reset System datasets
                </>
              )}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
