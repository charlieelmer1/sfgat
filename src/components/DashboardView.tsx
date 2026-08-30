import React, { useState, useMemo } from "react";
import {
  Clock,
  Megaphone,
  Sun,
  Users,
  Edit3,
  Save,
  Check,
  CloudSun,
  Wind,
  Droplets,
  X,
  Type,
  List,
  Plus,
  Search,
  UserPlus,
  Trash2,
  AlertCircle,
} from "lucide-react";
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
  onUpdateStaffNamesList?: (list: string[]) => void;
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
  onUpdateStaffNamesList,
}: DashboardViewProps) {
  const isSupervisor = userRole === "Supervisor";

  // Local editing states for hours and announcements
  const [isEditingHours, setIsEditingHours] = useState(false);
  const [editedThemeHours, setEditedThemeHours] = useState(parkHours.themePark);
  const [editedWaterHours, setEditedWaterHours] = useState(parkHours.waterPark);

  const [isEditingAnnounce, setIsEditingAnnounce] = useState(false);
  const [editedAnnounce, setEditedAnnounce] = useState(announcement);

  // Active individual item being edited
  const [editingRosterId, setEditingRosterId] = useState<string | null>(null);
  const [editedRosterName, setEditedRosterName] = useState("");
  const [customInputMode, setCustomInputMode] = useState(false);

  // Quick add new staff to dropdown pool modal/drawer
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffNamesInput, setNewStaffNamesInput] = useState("");

  // Search filter for roster
  const [rosterSearch, setRosterSearch] = useState("");

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
    // If the existing name is not in the staff pool and not empty, default to custom mode
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

  const handleClearRosterItem = (id: string) => {
    onUpdateRosterItem(id, "");
    if (editingRosterId === id) {
      setEditingRosterId(null);
    }
  };

  // Quick add staff names to pool handler
  const handleAddStaffToPool = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = newStaffNamesInput.trim();
    if (!raw || !onUpdateStaffNamesList) return;

    const incoming = raw
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const existingLower = new Set(staffNamesList.map((s) => s.toLowerCase()));
    const toAdd: string[] = [];

    for (const name of incoming) {
      if (!existingLower.has(name.toLowerCase())) {
        existingLower.add(name.toLowerCase());
        toAdd.push(name);
      }
    }

    if (toAdd.length > 0) {
      onUpdateStaffNamesList([...staffNamesList, ...toAdd]);
    }

    setNewStaffNamesInput("");
    setShowAddStaffModal(false);
  };

  // Filter roster items based on search query
  const filteredRoster = useMemo(() => {
    if (!rosterSearch.trim()) return roster;
    const q = rosterSearch.toLowerCase().trim();
    return roster.filter(
      (r) => r.id.toLowerCase().includes(q) || r.name.toLowerCase().includes(q)
    );
  }, [roster, rosterSearch]);

  // Group filtered roster by categories
  const supervisorRoster = filteredRoster.filter((r) => r.id === "790" || r.id === "170");
  const emtRoster = filteredRoster.filter((r) => parseInt(r.id) >= 791 && parseInt(r.id) <= 798);
  const supportRoster = filteredRoster.filter((r) => r.id.startsWith("EMS"));
  const rescueRoster = filteredRoster.filter((r) => parseInt(r.id) >= 171 && parseInt(r.id) <= 173);

  // Calculate section occupancy counts
  const getOccupancyBadge = (items: RosterItem[]) => {
    const filled = items.filter((i) => i.name.trim() !== "").length;
    const total = items.length;
    const allFilled = filled === total && total > 0;
    return (
      <span
        className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
          allFilled
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : filled > 0
            ? "bg-blue-50 text-blue-700 border-blue-200"
            : "bg-slate-100 text-slate-500 border-slate-200"
        }`}
      >
        {filled} / {total} Active
      </span>
    );
  };

  const renderRosterItem = (item: RosterItem, badgeColorClass: string) => {
    const isEditing = editingRosterId === item.id;
    const isVacant = !item.name || item.name.trim() === "";
    const isSupervisorUnit = item.id === "790" || item.id === "170";

    return (
      <div
        key={item.id}
        className={`p-4 rounded-xl border transition-all shadow-sm ${
          isEditing
            ? "bg-blue-50/50 border-blue-400 ring-2 ring-blue-400/20 shadow-md"
            : isVacant
            ? "bg-white border-slate-200 hover:border-slate-300 hover:shadow"
            : "bg-white border-slate-200/90 hover:border-blue-300 hover:shadow-md"
        }`}
      >
        <div className="flex flex-col gap-2.5">
          {/* Top Row: Call Sign & Actions */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`text-sm sm:text-base font-mono font-black px-3 py-1 rounded-lg border shadow-xs tracking-wide shrink-0 ${badgeColorClass}`}
              >
                {item.id}
              </span>
              {isSupervisorUnit && (
                <span className="text-[11px] font-mono text-slate-400 font-semibold uppercase">
                  Supervisor
                </span>
              )}
            </div>

            {isSupervisor && !isEditing && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => startEditingRoster(item)}
                  className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-900 border border-blue-200 rounded-lg cursor-pointer transition-colors flex items-center gap-1 shadow-2xs"
                  title="Assign or Change Name"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isVacant ? "Assign" : "Edit"}</span>
                </button>

                {!isVacant && (
                  <button
                    type="button"
                    onClick={() => handleClearRosterItem(item.id)}
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md cursor-pointer transition-colors"
                    title="Clear slot (Make Vacant)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Bottom Area: Name Display OR Expanded Editor */}
          {isEditing ? (
            <div className="mt-1 bg-white p-3 rounded-lg border-2 border-blue-500 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Select Staff for {item.id}:</span>
                <button
                  type="button"
                  onClick={() => setCustomInputMode(!customInputMode)}
                  className="text-blue-700 hover:text-blue-900 underline font-mono text-[11px] cursor-pointer"
                >
                  {customInputMode ? "Switch to Dropdown List" : "Type Custom Name"}
                </button>
              </div>

              {customInputMode ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editedRosterName}
                    onChange={(e) => setEditedRosterName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveRoster(item.id, editedRosterName)}
                    placeholder="Type EMT or Staff Name..."
                    className="w-full bg-white border-2 border-slate-300 focus:border-blue-600 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-semibold shadow-inner"
                    autoFocus
                  />
                </div>
              ) : (
                <select
                  value={
                    staffNamesList.includes(editedRosterName)
                      ? editedRosterName
                      : editedRosterName
                      ? "__custom__"
                      : ""
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "__custom__") {
                      setCustomInputMode(true);
                    } else {
                      setEditedRosterName(val);
                      handleSaveRoster(item.id, val);
                    }
                  }}
                  className="w-full bg-white border-2 border-slate-300 focus:border-blue-600 rounded-lg px-3 py-2.5 text-sm sm:text-base text-slate-900 focus:outline-none font-semibold shadow-inner cursor-pointer"
                  autoFocus
                >
                  <option value="">-- Vacant (No Staff Assigned) --</option>
                  {staffNamesList.length > 0 && (
                    <optgroup label="Available Staff Pool">
                      {staffNamesList.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <option value="__custom__">✏️ Type Custom Name Manually...</option>
                </select>
              )}

              {/* Save & Cancel Controls */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditingRosterId(null);
                    setCustomInputMode(false);
                  }}
                  className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveRoster(item.id, editedRosterName)}
                  className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" /> Save Assignment
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => isSupervisor && startEditingRoster(item)}
              className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                isSupervisor ? "cursor-pointer hover:bg-slate-50" : ""
              }`}
            >
              <span
                className={`text-base sm:text-lg font-extrabold leading-tight tracking-tight ${
                  item.name && item.name.trim() !== ""
                    ? "text-slate-900"
                    : "text-slate-400 italic text-sm font-normal"
                }`}
              >
                {item.name && item.name.trim() !== "" ? item.name : "— Vacant Slot —"}
              </span>

              {isVacant && isSupervisor && (
                <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  + Add Name
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome & Shift Status Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 relative overflow-hidden shadow-sm border-t-4 border-t-blue-900">
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
          <Clock className="w-48 h-48 text-slate-900" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
              Six Flags Great Adventure EMS
            </h2>
            <p className="text-slate-500 text-sm mt-1 font-sans">
              Active Session: <strong className="text-slate-800">{userRole} Access</strong> | Jackson, NJ
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-right shadow-inner">
            <span className="text-[10px] text-slate-400 font-mono block">CURRENT SHIFT DATE</span>
            <span className="text-sm font-mono font-bold text-slate-700">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Announcements Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative border-t-4 border-t-red-600">
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
              className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors font-semibold shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Announcement
            </button>
          )}
        </div>

        {isEditingAnnounce ? (
          <div className="space-y-3">
            <textarea
              value={editedAnnounce}
              onChange={(e) => setEditedAnnounce(e.target.value)}
              rows={3}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:border-red-600 font-sans leading-relaxed shadow-inner"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditingAnnounce(false)}
                className="text-xs bg-white text-slate-500 px-3 py-1.5 rounded-lg hover:bg-slate-50 border border-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAnnouncement}
                className="text-xs bg-red-600 text-white px-3.5 py-1.5 rounded-lg hover:bg-red-500 flex items-center gap-1.5 cursor-pointer font-bold shadow-sm"
              >
                <Save className="w-3.5 h-3.5" /> Save Announcement
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-red-50/40 border border-red-100 p-4 rounded-lg leading-relaxed text-slate-800 text-sm font-medium border-l-4 border-l-red-600 font-sans">
            {announcement || "No announcements active for this shift."}
          </div>
        )}
      </div>

      {/* Operational Hours & Weather Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Park Hours widget */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between shadow-sm border-t-4 border-t-blue-900">
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
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
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
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-600 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1">Water Park Hours</label>
                  <input
                    type="text"
                    value={editedWaterHours}
                    onChange={(e) => setEditedWaterHours(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-600 font-semibold"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsEditingHours(false)}
                    className="text-xs bg-white text-slate-500 px-3 py-1.5 rounded-lg hover:bg-slate-50 border border-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveHours}
                    className="text-xs bg-blue-900 text-white px-3.5 py-1.5 rounded-lg hover:bg-blue-800 flex items-center gap-1 cursor-pointer font-bold shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" /> Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg text-center shadow-inner">
                  <span className="text-xs text-slate-500 uppercase font-mono font-semibold block mb-1">
                    Theme Park Hours
                  </span>
                  <span className="text-base font-bold text-slate-800 font-sans">{parkHours.themePark}</span>
                </div>
                <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg text-center shadow-inner">
                  <span className="text-xs text-slate-500 uppercase font-mono font-semibold block mb-1">
                    Water Park Hours
                  </span>
                  <span className="text-base font-bold text-slate-800 font-sans">{parkHours.waterPark}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Weather Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between shadow-sm border-t-4 border-t-blue-500">
          <div>
            <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
              <h3 className="font-bold text-slate-850 text-base flex items-center gap-2 font-sans">
                <CloudSun className="w-5 h-5 text-amber-500" />
                Current Park Weather (08527)
              </h3>
              <button
                onClick={() => onNavigateToTab("weather")}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
              >
                Full Outlook &rarr;
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-850 font-sans">{weatherData.temp}°F</span>
                  <span className="text-xs text-slate-500 font-medium">Feels like {weatherData.feelsLike}°F</span>
                </div>
                <span className="text-sm font-bold text-amber-600 block mt-1 font-sans">{weatherData.condition}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg flex items-center gap-1.5 border border-slate-200 text-slate-700 text-xs font-mono shadow-inner">
                <Sun className="w-6 h-6 text-amber-500 animate-spin-slow shrink-0" />
                <div className="text-left leading-tight">
                  <div className="font-bold text-slate-700">UV: Moderate</div>
                  <div className="text-[10px] text-slate-400">Jackson, NJ</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 text-[10px] font-mono">
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex flex-col items-center shadow-xs">
                <Wind className="w-3.5 h-3.5 text-slate-500 mb-1" />
                <span className="text-slate-400">WIND</span>
                <span className="text-slate-700 font-bold text-center mt-0.5">{weatherData.wind}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex flex-col items-center shadow-xs">
                <Droplets className="w-3.5 h-3.5 text-slate-500 mb-1" />
                <span className="text-slate-400">HUMIDITY</span>
                <span className="text-slate-700 font-bold mt-0.5">{weatherData.humidity}%</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex flex-col items-center shadow-xs">
                <CloudSun className="w-3.5 h-3.5 text-slate-500 mb-1" />
                <span className="text-slate-400">PRECIP</span>
                <span className="text-slate-700 font-bold mt-0.5">{weatherData.precipitation}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Master On-Duty EMS Communications Roster Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-sm border-t-4 border-t-blue-900 space-y-6">
        {/* Header and Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 text-red-700 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-xl font-sans tracking-tight">
                On-Duty EMS Communications Roster
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Live park assignments across Supervisors, Theme Park, Additional Units, and Water Park
              </p>
            </div>
          </div>

          {/* Quick Roster Search & Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                placeholder="Search Call Sign or Name..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-medium"
              />
              {rosterSearch && (
                <button
                  type="button"
                  onClick={() => setRosterSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {isSupervisor && (
              <button
                type="button"
                onClick={() => setShowAddStaffModal(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold font-sans cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm shrink-0"
                title="Add New Staff Names to Dropdown Pool"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Staff to Pool</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Spacious Roster Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Section 1: Supervisors */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-2xs">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <div>
                  <h4 className="text-sm font-black uppercase font-mono tracking-wide text-red-700">
                    Supervisors
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">790 & 170</span>
                </div>
                {getOccupancyBadge(supervisorRoster)}
              </div>

              <div className="space-y-3">
                {supervisorRoster.length > 0 ? (
                  supervisorRoster.map((item) =>
                    renderRosterItem(item, "bg-red-100 text-red-800 border-red-200")
                  )
                ) : (
                  <div className="text-xs text-slate-400 italic text-center py-4">No matching call signs</div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Theme Park EMTs */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-2xs">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <div>
                  <h4 className="text-sm font-black uppercase font-mono tracking-wide text-blue-700">
                    Theme Park EMTs
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">791 – 798</span>
                </div>
                {getOccupancyBadge(emtRoster)}
              </div>

              <div className="space-y-3">
                {emtRoster.length > 0 ? (
                  emtRoster.map((item) =>
                    renderRosterItem(item, "bg-blue-100 text-blue-800 border-blue-200")
                  )
                ) : (
                  <div className="text-xs text-slate-400 italic text-center py-4">No matching call signs</div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Additional Units */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-2xs">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <div>
                  <h4 className="text-sm font-black uppercase font-mono tracking-wide text-emerald-700">
                    Additional Support
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">EMS2 – EMS5</span>
                </div>
                {getOccupancyBadge(supportRoster)}
              </div>

              <div className="space-y-3">
                {supportRoster.length > 0 ? (
                  supportRoster.map((item) =>
                    renderRosterItem(item, "bg-emerald-100 text-emerald-800 border-emerald-200")
                  )
                ) : (
                  <div className="text-xs text-slate-400 italic text-center py-4">No matching call signs</div>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Water Park EMTs */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-2xs">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <div>
                  <h4 className="text-sm font-black uppercase font-mono tracking-wide text-purple-700">
                    Water Park EMTs
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">171 – 173</span>
                </div>
                {getOccupancyBadge(rescueRoster)}
              </div>

              <div className="space-y-3">
                {rescueRoster.length > 0 ? (
                  rescueRoster.map((item) =>
                    renderRosterItem(item, "bg-purple-100 text-purple-800 border-purple-200")
                  )
                ) : (
                  <div className="text-xs text-slate-400 italic text-center py-4">No matching call signs</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-900">Add Staff Names to Pool</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStaffModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Add EMTs and staff members to your quick dropdown pool. You can enter single names or paste
              multiple names separated by newlines or commas.
            </p>

            <form onSubmit={handleAddStaffToPool} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Staff Names (Single or Multi-line Paste):
                </label>
                <textarea
                  rows={4}
                  value={newStaffNamesInput}
                  onChange={(e) => setNewStaffNamesInput(e.target.value)}
                  placeholder="e.g.&#10;John Smith&#10;Emily Davis&#10;Marcus Rivera"
                  className="w-full bg-slate-50 border-2 border-slate-300 focus:border-emerald-600 rounded-lg p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium shadow-inner"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newStaffNamesInput.trim()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" /> Add Names to Dropdown
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
