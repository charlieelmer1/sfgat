import React, { useState } from "react";
import { Clock, Megaphone, Sun, Users, Edit3, Save, Check, CloudSun, Wind, Droplets, X, Type, List } from "lucide-react";
import { RosterItem, ParkHours, WeatherData } from "../types";

interface DashboardViewProps {
  userRole: "EMT" | "Supervisor";
  parkHours: ParkHours;
  onUpdateHours: (hours: ParkHours) => void;
  announcement: string;
  onUpdateAnnouncement: (text: string) => void;
  roster: RosterItem[];
  onUpdateRosterItem: (id: string, name: string) => void;
  weatherData: WeatherData;
  onNavigateToTab: (tabId: string) => void;
  staffNamesList?: string[];
}

export default function DashboardView({
  userRole,
  parkHours,
  onUpdateHours,
  announcement,
  onUpdateAnnouncement,
  roster,
  onUpdateRosterItem,
  weatherData,
  onNavigateToTab,
  staffNamesList = [],
}: DashboardViewProps) {
  const isSupervisor = userRole === "Supervisor";

  // Local editing states
  const [isEditingHours, setIsEditingHours] = useState(false);
  const [editedThemeHours, setEditedThemeHours] = useState(parkHours.themePark);
  const [editedWaterHours, setEditedWaterHours] = useState(parkHours.waterPark);

  const [isEditingAnnounce, setIsEditingAnnounce] = useState(false);
  const [editedAnnounce, setEditedAnnounce] = useState(announcement);

  const [editingRosterId, setEditingRosterId] = useState<string | null>(null);
  const [editedRosterName, setEditedRosterName] = useState("");
  const [customInputMode, setCustomInputMode] = useState(false);

  // Sync state when announcement or hours update from Firestore in background
  React.useEffect(() => {
    if (!isEditingAnnounce) {
      setEditedAnnounce(announcement);
    }
  }, [announcement, isEditingAnnounce]);

  React.useEffect(() => {
    if (!isEditingHours) {
      setEditedThemeHours(parkHours.themePark);
      setEditedWaterHours(parkHours.waterPark);
    }
  }, [parkHours, isEditingHours]);

  const handleSaveHours = () => {
    onUpdateHours({
      themePark: editedThemeHours,
      waterPark: editedWaterHours,
    });
    setIsEditingHours(false);
  };

  const handleSaveAnnouncement = () => {
    onUpdateAnnouncement(editedAnnounce);
    setIsEditingAnnounce(false);
  };

  const startEditingRoster = (item: RosterItem) => {
    setEditingRosterId(item.id);
    setEditedRosterName(item.name);
    // If the existing name is not in the staff pool and not empty, open in custom mode
    if (item.name && !staffNamesList.includes(item.name)) {
      setCustomInputMode(true);
    } else {
      setCustomInputMode(false);
    }
  };

  const handleSaveRoster = (id: string, nameToSave?: string) => {
    const finalName = (nameToSave !== undefined ? nameToSave : editedRosterName).trim();
    onUpdateRosterItem(id, finalName);
    setEditingRosterId(null);
    setCustomInputMode(false);
  };

  // Group roster by categories for beautiful layout
  const supervisorRoster = roster.filter(r => r.id === "790" || r.id === "170");
  const emtRoster = roster.filter(r => parseInt(r.id) >= 791 && parseInt(r.id) <= 798);
  const supportRoster = roster.filter(r => r.id.startsWith("EMS"));
  const rescueRoster = roster.filter(r => parseInt(r.id) >= 171 && parseInt(r.id) <= 173);

  const renderRosterItem = (item: RosterItem, badgeColorClass: string) => {
    const isEditing = editingRosterId === item.id;

    return (
      <div
        key={item.id}
        className="bg-slate-50 p-2.5 rounded border border-slate-200 flex items-center justify-between group hover:bg-slate-100/70 transition-colors gap-2"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border shrink-0 ${badgeColorClass}`}>
            {item.id}
          </span>

          {isEditing ? (
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {customInputMode ? (
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <input
                    type="text"
                    value={editedRosterName}
                    onChange={(e) => setEditedRosterName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveRoster(item.id, editedRosterName)}
                    placeholder="Enter custom name..."
                    className="bg-white border-2 border-blue-600 rounded px-2.5 py-1.5 text-xs sm:text-sm text-slate-900 w-full focus:outline-none font-semibold shadow-sm"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setCustomInputMode(false)}
                    className="text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1.5 rounded font-mono shrink-0 cursor-pointer font-bold transition-colors"
                    title="Switch to dropdown list"
                  >
                    <List className="w-3.5 h-3.5 inline" /> List
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <select
                    value={staffNamesList.includes(editedRosterName) ? editedRosterName : (editedRosterName ? "__custom__" : "")}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "__custom__") {
                        setCustomInputMode(true);
                      } else {
                        setEditedRosterName(val);
                        handleSaveRoster(item.id, val);
                      }
                    }}
                    className="bg-white border-2 border-blue-600 rounded px-2.5 py-1.5 text-xs sm:text-sm text-slate-900 w-full focus:outline-none font-semibold shadow-sm cursor-pointer"
                    autoFocus
                  >
                    <option value="">-- Vacant / Open --</option>
                    {staffNamesList.length > 0 ? (
                      <optgroup label="Staff Pool (Select Name)">
                        {staffNamesList.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </optgroup>
                    ) : null}
                    <option value="__custom__">✏️ Type Custom Name...</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setCustomInputMode(true)}
                    className="text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2 py-1.5 rounded font-mono shrink-0 cursor-pointer font-bold transition-colors"
                    title="Type custom name manually"
                  >
                    <Type className="w-3.5 h-3.5 inline" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <span className={`text-xs truncate font-medium ${item.name ? "text-slate-800 font-semibold" : "text-slate-400 italic"}`}>
              {item.name || "Vacant"}
            </span>
          )}
        </div>

        {isSupervisor && (
          <div className="flex items-center gap-1 shrink-0">
            {isEditing ? (
              <>
                <button
                  onClick={() => handleSaveRoster(item.id, editedRosterName)}
                  className="text-emerald-600 hover:text-emerald-700 p-1 cursor-pointer"
                  title="Save assignment"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setEditingRosterId(null);
                    setCustomInputMode(false);
                  }}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  title="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => startEditingRoster(item)}
                className="text-slate-400 hover:text-slate-700 p-1 opacity-50 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Change or select staff member"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded p-6 relative overflow-hidden shadow-sm border-t-4 border-t-blue-900">
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
          <Clock className="w-48 h-48 text-slate-900" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight font-sans">
              Six Flags Great Adventure EMS
            </h2>
            <p className="text-slate-500 text-sm mt-1 font-sans">
              Active Session: <strong className="text-slate-800">{userRole} Access</strong> | Jackson, NJ
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded px-4 py-3 text-right shadow-inner">
            <span className="text-[10px] text-slate-400 font-mono block">CURRENT SHIFT DATE</span>
            <span className="text-sm font-mono font-bold text-slate-700">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Announcements Panel */}
      <div className="bg-white border border-slate-200 rounded p-5 shadow-sm relative border-t-4 border-t-red-600">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-red-500 animate-bounce" />
            <h3 className="font-bold text-slate-850 text-base font-sans">Active Shift Announcement</h3>
          </div>
          {isSupervisor && !isEditingAnnounce && (
            <button
              onClick={() => {
                setEditedAnnounce(announcement);
                setIsEditingAnnounce(true);
              }}
              className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded flex items-center gap-1 cursor-pointer transition-colors font-semibold"
            >
              <Edit3 className="w-3 h-3" /> Edit Announcement
            </button>
          )}
        </div>

        {isEditingAnnounce ? (
          <div className="space-y-3">
            <textarea
              value={editedAnnounce}
              onChange={(e) => setEditedAnnounce(e.target.value)}
              rows={3}
              className="w-full bg-slate-50 border border-slate-300 rounded p-3 text-sm text-slate-800 focus:outline-none focus:border-red-600 font-sans leading-relaxed"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditingAnnounce(false)}
                className="text-xs bg-white text-slate-500 px-3 py-1.5 rounded hover:bg-slate-50 border border-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAnnouncement}
                className="text-xs bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-500 flex items-center gap-1 cursor-pointer font-bold"
              >
                <Save className="w-3.5 h-3.5" /> Save Announcement
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-red-50/40 border border-red-100 p-4 rounded leading-relaxed text-slate-800 text-sm font-medium border-l-4 border-l-red-600 font-sans">
            {announcement || "No announcements active for this shift."}
          </div>
        )}
      </div>

      {/* Hours and Weather Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Park Hours widget */}
        <div className="bg-white border border-slate-200 rounded p-6 flex flex-col justify-between shadow-sm border-t-4 border-t-blue-900">
          <div>
            <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
              <h3 className="font-bold text-slate-850 text-base flex items-center gap-2 font-sans">
                <Clock className="w-5 h-5 text-blue-600" />
                Operational Hours
              </h3>
              {isSupervisor && !isEditingHours && (
                <button
                  onClick={() => {
                    setEditedThemeHours(parkHours.themePark);
                    setEditedWaterHours(parkHours.waterPark);
                    setIsEditingHours(true);
                  }}
                  className="text-xs text-blue-650 hover:text-blue-550 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Hours
                </button>
              )}
            </div>

            {isEditingHours ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1">Theme Park Hours</label>
                  <input
                    type="text"
                    value={editedThemeHours}
                    onChange={(e) => setEditedThemeHours(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1">Water Park Hours</label>
                  <input
                    type="text"
                    value={editedWaterHours}
                    onChange={(e) => setEditedWaterHours(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsEditingHours(false)}
                    className="text-xs bg-white text-slate-500 px-3 py-1.5 rounded hover:bg-slate-50 border border-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveHours}
                    className="text-xs bg-blue-900 text-white px-3 py-1.5 rounded hover:bg-blue-850 flex items-center gap-1 cursor-pointer font-bold"
                  >
                    <Save className="w-3.5 h-3.5" /> Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 border border-slate-200 rounded text-center shadow-inner">
                  <span className="text-xs text-slate-500 uppercase font-mono font-semibold block mb-1">Theme Park Hours</span>
                  <span className="text-base font-bold text-slate-800 font-sans">{parkHours.themePark}</span>
                </div>
                <div className="bg-slate-50 p-4 border border-slate-200 rounded text-center shadow-inner">
                  <span className="text-xs text-slate-500 uppercase font-mono font-semibold block mb-1">Water Park Hours</span>
                  <span className="text-base font-bold text-slate-800 font-sans">{parkHours.waterPark}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mini Weather Insert */}
        <div className="bg-white border border-slate-200 rounded p-6 flex flex-col justify-between shadow-sm border-t-4 border-t-blue-500">
          <div>
            <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
              <h3 className="font-bold text-slate-850 text-base flex items-center gap-2 font-sans">
                <CloudSun className="w-5 h-5 text-amber-500" />
                Current Park Weather (08527)
              </h3>
              <button
                onClick={() => onNavigateToTab("weather")}
                className="text-xs text-blue-600 hover:text-blue-550 font-bold cursor-pointer"
              >
                Full Outlook &rarr;
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-850 font-sans">{weatherData.temp}°F</span>
                  <span className="text-xs text-slate-500">Feels like {weatherData.feelsLike}°F</span>
                </div>
                <span className="text-sm font-bold text-amber-600 block mt-1 font-sans">{weatherData.condition}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded flex items-center gap-1.5 border border-slate-200 text-slate-700 text-xs font-mono shadow-inner">
                <Sun className="w-6 h-6 text-amber-500 animate-spin-slow shrink-0" />
                <div className="text-left leading-tight">
                  <div className="font-bold text-slate-700">UV: Moderate</div>
                  <div className="text-[10px] text-slate-400">Jackson, NJ</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 text-[10px] font-mono">
              <div className="bg-slate-50 p-2 rounded border border-slate-200 flex flex-col items-center shadow-sm">
                <Wind className="w-3.5 h-3.5 text-slate-500 mb-1" />
                <span className="text-slate-400">WIND</span>
                <span className="text-slate-700 font-bold text-center mt-0.5">{weatherData.wind}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-200 flex flex-col items-center shadow-sm">
                <Droplets className="w-3.5 h-3.5 text-slate-500 mb-1" />
                <span className="text-slate-400">HUMIDITY</span>
                <span className="text-slate-700 font-bold mt-0.5">{weatherData.humidity}%</span>
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-200 flex flex-col items-center shadow-sm">
                <CloudSun className="w-3.5 h-3.5 text-slate-500 mb-1" />
                <span className="text-slate-400">PRECIP</span>
                <span className="text-slate-700 font-bold mt-0.5">{weatherData.precipitation}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Roster Panel */}
      <div className="bg-white border border-slate-200 rounded p-6 shadow-sm border-t-4 border-t-blue-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3.5 mb-5">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="font-bold text-slate-850 text-base font-sans">On-Duty EMS Communications Roster</h3>
            </div>
          </div>
          {isSupervisor && staffNamesList.length > 0 && (
            <span className="text-[11px] font-mono text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
              Dropdown Pool: {staffNamesList.length} staff available
            </span>
          )}
        </div>

        {isSupervisor && (
          <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-850 text-xs p-3 rounded leading-relaxed font-sans flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              💡 <strong>Supervisor Mode Active:</strong> Click the edit icon <Edit3 className="w-3 h-3 inline text-amber-700" /> next to any callsign to choose an EMT/Staff member directly from your dropdown list or type a custom name.
            </div>
            <button
              onClick={() => onNavigateToTab("admin")}
              className="text-[11px] text-blue-700 hover:text-blue-900 underline font-semibold cursor-pointer shrink-0"
            >
              Manage Dropdown Names Pool &rarr;
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Supervisors Section */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-mono font-bold tracking-wider text-red-700 border-b border-slate-200 pb-1">
              Command (790 / 170)
            </h4>
            <div className="space-y-2">
              {supervisorRoster.map((item) => renderRosterItem(item, "bg-red-100 text-red-800 border-red-200"))}
            </div>
          </div>

          {/* EMT Patrol Crews Section */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-mono font-bold tracking-wider text-blue-700 border-b border-slate-200 pb-1">
              EMT's TP (791 - 798)
            </h4>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {emtRoster.map((item) => renderRosterItem(item, "bg-blue-100 text-blue-800 border-blue-200"))}
            </div>
          </div>

          {/* Transport / Station Support Section */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-mono font-bold tracking-wider text-emerald-700 border-b border-slate-200 pb-1">
              EMT's TP ADD (EMS2 - EMS5)
            </h4>
            <div className="space-y-2">
              {supportRoster.map((item) => renderRosterItem(item, "bg-emerald-100 text-emerald-800 border-emerald-200"))}
            </div>
          </div>

          {/* Extra EMT support Section */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-mono font-bold tracking-wider text-purple-700 border-b border-slate-200 pb-1">
              EMT's WP (171 - 173)
            </h4>
            <div className="space-y-2">
              {rescueRoster.map((item) => renderRosterItem(item, "bg-purple-100 text-purple-800 border-purple-200"))}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
