import React, { useState } from "react";
import { ShieldCheck, Megaphone, Clock, RefreshCw, Users, BookOpen, Phone, Hash, Save, AlertTriangle } from "lucide-react";
import { ParkHours, SupervisorChoice, PREDEFINED_SUPERVISORS, DocumentItem, RosterItem, ContactItem, PhoneExtension, TenCodeItem, SignalItem, WeeklySchedule } from "../types";

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

  const handleUpdateSups = (idx: number, field: "name" | "phone", value: string) => {
    const updated = [...localSups];
    updated[idx] = { ...updated[idx], [field]: value };
    setLocalSups(updated);
  };

  const handleSaveSups = () => {
    onUpdatePredefinedSupervisorsList(localSups);
    alert("Preselected Supervisor list updated successfully!");
  };

  const handleSaveHoursAndAnnounce = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateHours({
      themePark: editedThemeHours,
      waterPark: editedWaterHours,
    });
    onUpdateAnnouncement(editedAnnounce);
    alert("Operational parameters updated successfully!");
  };

  const handleResetSystem = () => {
    if (resetPassword !== "ELMER") {
      setPasswordError("❌ ACCESS DENIED: Incorrect supervisor password.");
      return;
    }

    if (confirm("🚨 WARNING: This will reset all Medical Protocols, SOPs, Roster, Contacts, Extensions, 10-Codes, and Schedules back to their factory defaults. Any customized edits will be overwritten. Continue?")) {
      onResetToDefaults();
      setHasReset(true);
      setResetPassword("");
      setPasswordError("");
      // Refresh local states
      setEditedThemeHours(parkHours.themePark);
      setEditedWaterHours(parkHours.waterPark);
      setEditedAnnounce(announcement);
      setLocalSups([...predefinedSupervisorsList]);
      setTimeout(() => setHasReset(false), 2000);
    }
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
          Full command control over announcements, operating hours, schedule pools, and system datasets.
        </p>
      </div>

      {/* Grid of Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-200 p-4 rounded text-center shadow-sm border-t-2 border-t-blue-900">
          <Users className="w-5 h-5 text-red-650 mx-auto mb-1.5" />
          <span className="text-[10px] text-slate-500 font-mono uppercase block font-semibold">Active Roster</span>
          <span className="text-xl font-bold text-slate-900 font-mono">{roster.length}</span>
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

      {/* Form Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Form Column */}
        <form onSubmit={handleSaveHoursAndAnnounce} className="lg:col-span-7 bg-white border border-slate-200 rounded p-6 space-y-5 shadow-sm border-t-4 border-t-blue-900">
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

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-900 hover:bg-blue-850 text-white rounded text-xs cursor-pointer font-bold flex items-center gap-1 shadow-sm"
            >
              <Save className="w-4 h-4" /> Save Shift Settings
            </button>
          </div>
        </form>

        {/* Right Form Column - Preselected supervisor entries */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Preselected Supervisor Pool Edit */}
          <div className="bg-white border border-slate-200 rounded p-6 space-y-4 shadow-sm border-t-4 border-t-blue-900">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Users className="w-5 h-5 text-blue-900" />
              Preselected Supervisor Pool
            </h3>
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
                      className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-900 rounded p-1 text-xs text-slate-800 focus:outline-none"
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

            <button
              onClick={handleSaveSups}
              className="w-full bg-white hover:bg-slate-50 text-slate-700 text-xs py-2 rounded border border-slate-200 hover:border-slate-300 cursor-pointer font-bold flex items-center justify-center gap-1"
            >
              <Save className="w-3.5 h-3.5" /> Save Preselected Pool
            </button>
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
