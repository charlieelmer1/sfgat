import React, { useState, useEffect } from "react";
import { Calendar, User, Phone, CheckCircle2, ShieldAlert, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { WeeklySchedule, SupervisorChoice, PREDEFINED_SUPERVISORS } from "../types";

interface ScheduleViewProps {
  userRole: "EMT" | "Supervisor";
  schedule: WeeklySchedule;
  onUpdateScheduleDay: (day: string, role: "sup790" | "sup170", supervisor: SupervisorChoice) => void;
}

export default function ScheduleView({ userRole, schedule, onUpdateScheduleDay }: ScheduleViewProps) {
  const isSupervisor = userRole === "Supervisor";
  
  // Date Navigation State - Initialized to July 2026 per current mock timeframe
  const todayDate = new Date();
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(6); // July (0-indexed)
  
  const [selectedDay, setSelectedDay] = useState<number>(19); // Defaults to July 19, 2026

  const monthsList = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysOfWeekLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Helper: Format a specific date to YYYY-MM-DD
  const formatDateKey = (year: number, month: number, day: number) => {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  };

  // Helper: Get weekday name (e.g. "Monday") for fallback matching
  const getWeekdayName = (year: number, month: number, day: number) => {
    const date = new Date(year, month, day);
    return date.toLocaleDateString("en-US", { weekday: "long" });
  };

  // Helper: Resolve schedule for a specific date (explicit date override vs weekly fallback)
  const getDailySchedule = (year: number, month: number, day: number) => {
    const dateKey = formatDateKey(year, month, day);
    const weekday = getWeekdayName(year, month, day);
    return schedule[dateKey] || schedule[weekday] || {
      sup790: PREDEFINED_SUPERVISORS[0],
      sup170: PREDEFINED_SUPERVISORS[1],
    };
  };

  // Get initials for avatar badge
  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleGoToToday = () => {
    // Lock back to July 19, 2026 as the mock operational date
    setCurrentYear(2026);
    setCurrentMonth(6);
    setSelectedDay(19);
  };

  // Keep selectedDay within boundaries of the current month
  useEffect(() => {
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    if (selectedDay > totalDays) {
      setSelectedDay(1);
    }
  }, [currentMonth, currentYear]);

  // Calculations for current month grid
  const firstDayWeekday = new Date(currentYear, currentMonth, 1).getDay();
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const handleSelectSupervisor = (dayNum: number, role: "sup790" | "sup170", supervisorId: string) => {
    const dateKey = formatDateKey(currentYear, currentMonth, dayNum);
    const selectedSup = PREDEFINED_SUPERVISORS.find((s) => s.id === supervisorId);
    if (selectedSup) {
      onUpdateScheduleDay(dateKey, role, selectedSup);
    }
  };

  const activeDaily = getDailySchedule(currentYear, currentMonth, selectedDay);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* Title block */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row justify-between sm:items-end gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-red-650" />
            Supervisor Monthly Schedule
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Assigned administrative on-duty command supervisors for daily operations.
          </p>
        </div>
        
        {/* Month Navigation Panel */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-white border border-slate-200 rounded p-1.5 shadow-sm">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 hover:bg-slate-50 text-slate-600 rounded cursor-pointer transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="text-sm font-bold text-slate-800 px-3 min-w-[120px] text-center font-sans">
            {monthsList[currentMonth]} {currentYear}
          </span>
          
          <button
            onClick={handleNextMonth}
            className="p-1.5 hover:bg-slate-50 text-slate-600 rounded cursor-pointer transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleGoToToday}
            className="ml-2 text-[10px] font-bold text-blue-900 hover:bg-blue-50 px-2 py-1 rounded border border-blue-200 uppercase tracking-wider font-sans cursor-pointer transition-all"
          >
            July 19
          </button>
        </div>
      </div>

      {isSupervisor && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-4 rounded flex items-start gap-2.5 leading-normal shadow-sm">
          <ShieldAlert className="w-5 h-5 text-amber-650 shrink-0 mt-0.5" />
          <div>
            <strong>Supervisor Privileges Active:</strong> Select any day on the calendar grid to review its crew assignments. You can override or assign supervisor shifts for specific calendar dates in the right-side detail pane.
          </div>
        </div>
      )}

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Calendar Grid */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded p-6 shadow-sm">
          
          {/* Weekdays Labels */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
            {daysOfWeekLabels.map(label => (
              <div key={label} className="py-1">{label}</div>
            ))}
          </div>

          {/* Calendar Day Slots */}
          <div className="grid grid-cols-7 gap-2">
            
            {/* Blank offset days */}
            {Array.from({ length: firstDayWeekday }).map((_, idx) => (
              <div key={`blank-${idx}`} className="aspect-square bg-slate-50/40 rounded border border-slate-100/30" />
            ))}

            {/* Actual Month Days */}
            {Array.from({ length: totalDaysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateKey = formatDateKey(currentYear, currentMonth, dayNum);
              const daySchedule = getDailySchedule(currentYear, currentMonth, dayNum);
              const isSelected = selectedDay === dayNum;
              const isTodayDate = currentYear === 2026 && currentMonth === 6 && dayNum === 19; // Locked to Jul 19, 2026 for operations context

              return (
                <button
                  key={`day-${dayNum}`}
                  onClick={() => setSelectedDay(dayNum)}
                  className={`aspect-square p-2 rounded border text-left flex flex-col justify-between transition-all duration-150 relative cursor-pointer overflow-hidden ${
                    isSelected
                      ? "border-blue-900 bg-blue-50/30 ring-2 ring-blue-900/30 shadow-sm"
                      : isTodayDate
                        ? "border-red-400 bg-red-50/40 hover:bg-red-50/60"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-white"
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className={`text-xs font-mono font-bold ${
                      isTodayDate
                        ? "text-red-700 bg-red-100/80 px-1 rounded-sm text-[10px]"
                        : isSelected
                          ? "text-blue-900 font-extrabold"
                          : "text-slate-700"
                    }`}>
                      {dayNum}
                    </span>
                    
                    {isTodayDate && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" title="Active Shift Date" />
                    )}
                  </div>

                  {/* Compact Shift Initials for Quick View */}
                  <div className="hidden sm:flex flex-col gap-0.5 mt-2 text-[9px] w-full font-mono font-semibold">
                    <div className="truncate text-red-700 flex items-center gap-0.5 leading-tight">
                      <span className="text-[8px] opacity-70">790:</span>
                      <span className="truncate">{daySchedule.sup790?.name.split(" ")[1] || daySchedule.sup790?.name}</span>
                    </div>
                    <div className="truncate text-blue-800 flex items-center gap-0.5 leading-tight">
                      <span className="text-[8px] opacity-70">170:</span>
                      <span className="truncate">{daySchedule.sup170?.name.split(" ")[1] || daySchedule.sup170?.name}</span>
                    </div>
                  </div>
                </button>
              );
            })}

          </div>
        </div>

        {/* Right Side: Day Details & Action Panel */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded p-6 shadow-sm border-t-4 border-t-blue-900 space-y-5">
          <div>
            <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 font-bold block">
              Shift Operations Detail
            </span>
            <h3 className="text-base font-extrabold text-slate-900 mt-1 font-sans">
              {getWeekdayName(currentYear, currentMonth, selectedDay)}, {monthsList[currentMonth]} {selectedDay}, {currentYear}
            </h3>
          </div>

          <div className="space-y-4 pt-2 border-t border-slate-100">
            
            {/* Call Sign 790 Section */}
            <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                  CALL SIGN: 790 Themepark
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded bg-red-100 border border-red-200 text-red-700 flex items-center justify-center font-bold font-sans shrink-0">
                  {getInitials(activeDaily.sup790?.name)}
                </div>
                
                <div className="min-w-0 flex-1">
                  {isSupervisor ? (
                    <div className="space-y-1.5">
                      <select
                        value={activeDaily.sup790?.id || ""}
                        onChange={(e) => handleSelectSupervisor(selectedDay, "sup790", e.target.value)}
                        className="w-full bg-white border border-slate-300 hover:border-slate-400 rounded p-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-900 font-sans shadow-sm font-medium"
                      >
                        {PREDEFINED_SUPERVISORS.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      <div className="text-[10px] text-slate-500 pl-1 font-mono">
                        Phone Extension Sync Active
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 truncate">{activeDaily.sup790?.name}</h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">Primary Command Supervisor</p>
                    </div>
                  )}
                </div>
              </div>

              {!isSupervisor && (
                <div className="border-t border-slate-200/60 pt-2 flex justify-between items-center">
                  <span className="text-[9px] text-slate-400 font-mono">EMERGENCY CONTACT</span>
                  <a
                    href={`tel:${activeDaily.sup790?.phone}`}
                    className="text-[10px] font-mono text-blue-900 hover:text-blue-750 font-extrabold flex items-center gap-1 bg-white hover:bg-blue-50/50 px-2 py-1 rounded border border-slate-200"
                  >
                    <Phone className="w-3 h-3 text-blue-700" /> {activeDaily.sup790?.phone}
                  </a>
                </div>
              )}
            </div>

            {/* Call Sign 170 Section */}
            <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                  CALL SIGN: 170 Waterpark
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded bg-blue-100 border border-blue-200 text-blue-800 flex items-center justify-center font-bold font-sans shrink-0">
                  {getInitials(activeDaily.sup170?.name)}
                </div>
                
                <div className="min-w-0 flex-1">
                  {isSupervisor ? (
                    <div className="space-y-1.5">
                      <select
                        value={activeDaily.sup170?.id || ""}
                        onChange={(e) => handleSelectSupervisor(selectedDay, "sup170", e.target.value)}
                        className="w-full bg-white border border-slate-300 hover:border-slate-400 rounded p-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-900 font-sans shadow-sm font-medium"
                      >
                        {PREDEFINED_SUPERVISORS.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      <div className="text-[10px] text-slate-500 pl-1 font-mono">
                        Phone Extension Sync Active
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 truncate">{activeDaily.sup170?.name}</h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">Tactical Support Supervisor</p>
                    </div>
                  )}
                </div>
              </div>

              {!isSupervisor && (
                <div className="border-t border-slate-200/60 pt-2 flex justify-between items-center">
                  <span className="text-[9px] text-slate-400 font-mono">EMERGENCY CONTACT</span>
                  <a
                    href={`tel:${activeDaily.sup170?.phone}`}
                    className="text-[10px] font-mono text-blue-900 hover:text-blue-750 font-extrabold flex items-center gap-1 bg-white hover:bg-blue-50/50 px-2 py-1 rounded border border-slate-200"
                  >
                    <Phone className="w-3 h-3 text-blue-700" /> {activeDaily.sup170?.phone}
                  </a>
                </div>
              )}
            </div>

          </div>

          <div className="bg-slate-50 p-4 rounded border border-slate-200 text-[11px] text-slate-500 leading-relaxed font-sans flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span>This calendar governs active communications routing for dispatcher call signs. Any updates saved will reflect immediately on operational displays.</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
