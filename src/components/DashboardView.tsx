import React, { useState } from "react";
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
  staffNamesList,
}: DashboardViewProps) {
  const isSupervisor = userRole === "Supervisor";

  // Local editing states for hours and announcements
  const [isEditingHours, setIsEditingHours] = useState(false);
  const [editedThemeHours, setEditedThemeHours] = useState(parkHours.themePark);
  const [editedWaterHours, setEditedWaterHours] = useState(parkHours.waterPark);

  const [isEditingAnnounce, setIsEditingAnnounce] = useState(false);
  const [editedAnnounce, setEditedAnnounce] = useState(announcement);

  // Active individual roster item being edited
  const [editingRosterId, setEditingRosterId] = useState<string | null>(null);
  const [editedRosterName, setEditedRosterName] = useState("");

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
  };

  const handleSaveRoster = (id: string) => {
    onUpdateRosterItem(id, editedRosterName.trim());
    setEditingRosterId(null);
  };

  // Categorized rosters
  const supervisorRoster = roster
    .filter((r) => r.id === "170" || r.id === "790")
    .sort((a, b) => (a.id === "170" ? -1 : 1));
  const emtRoster = roster.filter((r) => parseInt(r.id) >= 791 && parseInt(r.id) <= 798);
  const supportRoster = roster.filter((r) => r.id.startsWith("EMS"));
  const rescueRoster = roster.filter((r) => parseInt(r.id) >= 171 && parseInt(r.id) <= 173);

  const renderRosterItem = (item: RosterItem, badgeColorClass: string) => {
    const isEditing = editingRosterId === item.id;

    return (
      <div
        key={item.id}
        className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors shadow-2xs"
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0 mr-2">
          <span
            className={`text-xs font-mono font-bold px-2 py-0.5 rounded border shrink-0 ${badgeColorClass}`}
          >
            {item.id}
          </span>

          {isEditing ? (
            <div className="flex-1 min-w-0">
              <input
                type="text"
                list="dashboard-staff-datalist"
                value={editedRosterName}
                onChange={(e) => setEditedRosterName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveRoster(item.id)}
                className="w-full bg-slate-50 border border-blue-500 rounded px-2 py-1 text-xs text-slate-900 focus:outline-none font-medium"
                placeholder="Enter EMT Name..."
                autoFocus
              />
              {staffNamesList && staffNamesList.length > 0 && (
                <datalist id="dashboard-staff-datalist">
                  {staffNamesList.map((name, i) => (
                    <option key={i} value={name} />
                  ))}
                </datalist>
              )}
            </div>
          ) : (
            <span
              className={`text-xs truncate font-medium ${
                item.name ? "text-slate-850" : "text-slate-400 italic"
              }`}
            >
              {item.name || "Vacant / Unassigned"}
            </span>
          )}
        </div>

        {isSupervisor && (
          <div className="shrink-0 flex items-center gap-1">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => handleSaveRoster(item.id)}
                  className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded cursor-pointer transition-colors"
                  title="Save"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingRosterId(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded cursor-pointer transition-colors"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => startEditingRoster(item)}
                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer transition-colors"
                title="Edit Assignment"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
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

      {/* Daily Roster Section (Positioned at the top) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm border-t-4 border-t-blue-900 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
          <div className="p-2 bg-red-100 text-red-700 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-xl font-sans tracking-tight">
              Daily Roster
            </h3>
          </div>
        </div>

        {/* 4 Roster Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
          {/* Section 1: Command / Supervisors (170 & 790) */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 flex flex-col justify-start shadow-2xs space-y-3">
            <div className="border-b border-slate-200 pb-2">
              <h4 className="text-xs font-black uppercase font-mono tracking-wide text-red-700">
                Supervisors
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">170 & 790 Supervisors</span>
            </div>
            <div className="space-y-2">
              {supervisorRoster.map((item) =>
                renderRosterItem(item, "bg-red-100 text-red-800 border-red-200")
              )}
            </div>
          </div>

          {/* Section 2: Theme Park EMT Patrols */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 flex flex-col justify-start shadow-2xs space-y-3">
            <div className="border-b border-slate-200 pb-2">
              <h4 className="text-xs font-black uppercase font-mono tracking-wide text-blue-700">
                Theme Park EMT Patrols
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">791 – 798 Theme Park Units</span>
            </div>
            <div className="space-y-2">
              {emtRoster.map((item) =>
                renderRosterItem(item, "bg-blue-100 text-blue-800 border-blue-200")
              )}
            </div>
          </div>

          {/* Section 3: Additional Units */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 flex flex-col justify-start shadow-2xs space-y-3">
            <div className="border-b border-slate-200 pb-2">
              <h4 className="text-xs font-black uppercase font-mono tracking-wide text-emerald-700">
                Additional Units
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">Additional EMS</span>
            </div>
            <div className="space-y-2">
              {supportRoster.map((item) =>
                renderRosterItem(item, "bg-emerald-100 text-emerald-800 border-emerald-200")
              )}
            </div>
          </div>

          {/* Section 4: Water Park EMTs */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 flex flex-col justify-start shadow-2xs space-y-3">
            <div className="border-b border-slate-200 pb-2">
              <h4 className="text-xs font-black uppercase font-mono tracking-wide text-purple-700">
                Water Park EMTs
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">171 – 173 Hurricane Harbor</span>
            </div>
            <div className="space-y-2">
              {rescueRoster.map((item) =>
                renderRosterItem(item, "bg-purple-100 text-purple-800 border-purple-200")
              )}
            </div>
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
    </div>
  );
}
