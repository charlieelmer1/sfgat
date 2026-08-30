import React, { useState, useEffect, useRef } from "react";
import { Shield, LayoutDashboard, BookOpen, FileText, Phone, Hash, Calendar, CloudSun, Calculator, ShieldCheck, LogOut, Menu, X, Clock, Database } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Components
import Login from "./components/Login";
import DashboardView from "./components/DashboardView";
import DocumentsView from "./components/DocumentsView";
import DirectoryView from "./components/DirectoryView";
import CodesView from "./components/CodesView";
import ScheduleView from "./components/ScheduleView";
import WeatherView from "./components/WeatherView";
import MedicalQRF from "./components/MedicalQRF";
import SupervisorAdmin from "./components/SupervisorAdmin";

// Firebase Firestore
import { db, doc, setDoc, onSnapshot, SYSTEM_STATE_COLLECTION, SYSTEM_STATE_DOC } from "./firebase";

// Types & Initial Data
import {
  ParkHours,
  RosterItem,
  DocumentItem,
  ContactItem,
  PhoneExtension,
  TenCodeItem,
  SignalItem,
  WeeklySchedule,
  WeatherData,
  SupervisorChoice,
  PREDEFINED_SUPERVISORS,
  INITIAL_PARK_HOURS,
  INITIAL_ANNOUNCEMENT,
  INITIAL_ROSTER,
  INITIAL_PROTOCOLS,
  INITIAL_SOPS,
  INITIAL_CONTACTS,
  INITIAL_EXTENSIONS,
  INITIAL_10_CODES,
  INITIAL_SIGNALS,
  INITIAL_SCHEDULE,
  INITIAL_WEATHER,
} from "./types";

export default function App() {
  // Polling / Sync guard ref to prevent feedback loops
  const isSyncingRef = useRef(false);

  // Authentication State
  const [userRole, setUserRole] = useState<"EMT" | "Supervisor" | null>(() => {
    const saved = localStorage.getItem("sfga_ems_role");
    return (saved === "EMT" || saved === "Supervisor") ? saved : null;
  });

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Datasets (Initial empty/defaults, hydrated from server on mount)
  const [parkHours, setParkHours] = useState<ParkHours>(INITIAL_PARK_HOURS);
  const [announcement, setAnnouncement] = useState<string>(INITIAL_ANNOUNCEMENT);
  const [roster, setRoster] = useState<RosterItem[]>(INITIAL_ROSTER);
  const [protocols, setProtocols] = useState<DocumentItem[]>(INITIAL_PROTOCOLS);
  const [sops, setSops] = useState<DocumentItem[]>(INITIAL_SOPS);
  const [contacts, setContacts] = useState<ContactItem[]>(INITIAL_CONTACTS);
  const [extensions, setExtensions] = useState<PhoneExtension[]>(INITIAL_EXTENSIONS);
  const [tenCodes, setTenCodes] = useState<TenCodeItem[]>(INITIAL_10_CODES);
  const [signals, setSignals] = useState<SignalItem[]>(INITIAL_SIGNALS);
  const [schedule, setSchedule] = useState<WeeklySchedule>(INITIAL_SCHEDULE);
  const [weatherData, setWeatherData] = useState<WeatherData>(INITIAL_WEATHER);
  const [predefinedSupervisorsList, setPredefinedSupervisorsList] = useState<SupervisorChoice[]>(PREDEFINED_SUPERVISORS);

  const [isLoaded, setIsLoaded] = useState(false);
  const [firestoreConnected, setFirestoreConnected] = useState(false);

  // 1. Primary Real-time Firestore Listener
  useEffect(() => {
    const docRef = doc(db, SYSTEM_STATE_COLLECTION, SYSTEM_STATE_DOC);
    
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        setFirestoreConnected(true);
        if (snapshot.exists()) {
          const data = snapshot.data();
          isSyncingRef.current = true;
          if (data.parkHours) setParkHours(data.parkHours);
          if (data.announcement !== undefined) setAnnouncement(data.announcement);
          if (data.roster) setRoster(data.roster);
          if (data.protocols) setProtocols(data.protocols);
          if (data.sops) setSops(data.sops);
          if (data.contacts) setContacts(data.contacts);
          if (data.extensions) setExtensions(data.extensions);
          if (data.tenCodes) setTenCodes(data.tenCodes);
          if (data.signals) setSignals(data.signals);
          if (data.schedule) setSchedule(data.schedule);
          if (data.weatherData) setWeatherData(data.weatherData);
          if (data.predefinedSupervisorsList) setPredefinedSupervisorsList(data.predefinedSupervisorsList);
          
          setIsLoaded(true);
          setTimeout(() => {
            isSyncingRef.current = false;
          }, 300);
        } else {
          // Document does not exist in Firestore yet: initialize it with default data
          const initialState = {
            parkHours: INITIAL_PARK_HOURS,
            announcement: INITIAL_ANNOUNCEMENT,
            roster: INITIAL_ROSTER,
            protocols: INITIAL_PROTOCOLS,
            sops: INITIAL_SOPS,
            contacts: INITIAL_CONTACTS,
            extensions: INITIAL_EXTENSIONS,
            tenCodes: INITIAL_10_CODES,
            signals: INITIAL_SIGNALS,
            schedule: INITIAL_SCHEDULE,
            weatherData: INITIAL_WEATHER,
            predefinedSupervisorsList: PREDEFINED_SUPERVISORS,
            updatedAt: new Date().toISOString(),
          };
          setDoc(docRef, initialState).catch(console.error);
          setIsLoaded(true);
        }
      },
      (error) => {
        console.warn("Firestore listener error, falling back to REST API & LocalStorage:", error);
        setFirestoreConnected(false);
        // Fallback to server state
        fetch("/api/state?t=" + Date.now(), { cache: "no-store" })
          .then((res) => res.json())
          .then((data) => {
            if (data) {
              if (data.parkHours) setParkHours(data.parkHours);
              if (data.announcement !== undefined) setAnnouncement(data.announcement);
              if (data.roster) setRoster(data.roster);
              if (data.protocols) setProtocols(data.protocols);
              if (data.sops) setSops(data.sops);
              if (data.contacts) setContacts(data.contacts);
              if (data.extensions) setExtensions(data.extensions);
              if (data.tenCodes) setTenCodes(data.tenCodes);
              if (data.signals) setSignals(data.signals);
              if (data.schedule) setSchedule(data.schedule);
              if (data.weatherData) setWeatherData(data.weatherData);
              if (data.predefinedSupervisorsList) setPredefinedSupervisorsList(data.predefinedSupervisorsList);
            }
            setIsLoaded(true);
          })
          .catch(() => {
            setIsLoaded(true);
          });
      }
    );

    return () => unsubscribe();
  }, []);

  // Helper to save state changes to Firestore, Server API, and LocalStorage
  const saveToCloudAndLocal = (key: string, value: any, localKey: string) => {
    try {
      localStorage.setItem(localKey, typeof value === "string" ? value : JSON.stringify(value));
    } catch (e) {
      console.error(e);
    }
    
    if (isSyncingRef.current) return;

    // Save to Firestore
    try {
      const docRef = doc(db, SYSTEM_STATE_COLLECTION, SYSTEM_STATE_DOC);
      setDoc(docRef, { [key]: value, updatedAt: new Date().toISOString() }, { merge: true }).catch(console.error);
    } catch (err) {
      console.warn("Firestore write error:", err);
    }

    // Save to Express server backup
    fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    }).catch(console.error);
  };

  // Sync state changes
  useEffect(() => {
    if (!isLoaded) return;
    saveToCloudAndLocal("parkHours", parkHours, "sfga_ems_hours");
  }, [parkHours, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    saveToCloudAndLocal("announcement", announcement, "sfga_ems_announcement");
  }, [announcement, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    saveToCloudAndLocal("roster", roster, "sfga_ems_roster");
  }, [roster, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    saveToCloudAndLocal("protocols", protocols, "sfga_ems_protocols");
  }, [protocols, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    saveToCloudAndLocal("sops", sops, "sfga_ems_sops");
  }, [sops, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    saveToCloudAndLocal("contacts", contacts, "sfga_ems_contacts");
  }, [contacts, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    saveToCloudAndLocal("extensions", extensions, "sfga_ems_extensions");
  }, [extensions, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    saveToCloudAndLocal("tenCodes", tenCodes, "sfga_ems_tencodes");
  }, [tenCodes, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    saveToCloudAndLocal("signals", signals, "sfga_ems_signals");
  }, [signals, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    saveToCloudAndLocal("schedule", schedule, "sfga_ems_schedule");
  }, [schedule, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    saveToCloudAndLocal("weatherData", weatherData, "sfga_ems_weather");
  }, [weatherData, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    saveToCloudAndLocal("predefinedSupervisorsList", predefinedSupervisorsList, "sfga_ems_predefined_supervisors");
  }, [predefinedSupervisorsList, isLoaded]);

  // Auth Operations
  const handleLoginSuccess = (role: "EMT" | "Supervisor") => {
    setUserRole(role);
    localStorage.setItem("sfga_ems_role", role);
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    setUserRole(null);
    localStorage.removeItem("sfga_ems_role");
  };

  // State mutation operations (Delegated down to views)
  const handleUpdateHours = (hours: ParkHours) => setParkHours(hours);
  const handleUpdateAnnouncement = (text: string) => setAnnouncement(text);
  
  const handleUpdateRosterItem = (id: string, name: string) => {
    setRoster((prev) => prev.map((item) => (item.id === id ? { ...item, name } : item)));
  };

  const handleUpdateWeather = (data: WeatherData) => setWeatherData(data);

  const handleUpdateScheduleDay = (day: string, role: "sup790" | "sup170", supervisor: SupervisorChoice) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [role]: supervisor,
      },
    }));
  };

  const handleUpdatePredefinedSupervisorsList = (list: SupervisorChoice[]) => {
    setPredefinedSupervisorsList(list);
  };

  // Protocols & SOPs Document operations
  const handleAddDocument = (doc: DocumentItem) => {
    if (doc.type) {
      setProtocols((prev) => [doc, ...prev]);
    } else {
      setSops((prev) => [doc, ...prev]);
    }
  };

  const handleUpdateDocument = (doc: DocumentItem) => {
    if (doc.type) {
      setProtocols((prev) => prev.map((item) => (item.id === doc.id ? doc : item)));
    } else {
      setSops((prev) => prev.map((item) => (item.id === doc.id ? doc : item)));
    }
  };

  const handleDeleteDocument = (id: string) => {
    setProtocols((prev) => prev.filter((item) => item.id !== id));
    setSops((prev) => prev.filter((item) => item.id !== id));
  };

  // Contacts operations
  const handleAddContact = (c: ContactItem) => setContacts((prev) => [c, ...prev]);
  const handleUpdateContact = (c: ContactItem) => setContacts((prev) => prev.map((item) => (item.id === c.id ? c : item)));
  const handleDeleteContact = (id: string) => setContacts((prev) => prev.filter((item) => item.id !== id));

  // Extensions operations
  const handleAddExtension = (e: PhoneExtension) => setExtensions((prev) => [e, ...prev]);
  const handleUpdateExtension = (e: PhoneExtension) => setExtensions((prev) => prev.map((item) => (item.id === e.id ? e : item)));
  const handleDeleteExtension = (id: string) => setExtensions((prev) => prev.filter((item) => item.id !== id));

  // 10-Codes operations
  const handleAddTenCode = (tc: TenCodeItem) => setTenCodes((prev) => [...prev, tc].sort((a,b) => a.code.localeCompare(b.code)));
  const handleUpdateTenCode = (tc: TenCodeItem) => setTenCodes((prev) => prev.map((item) => (item.code === tc.code ? tc : item)));
  const handleDeleteTenCode = (codeStr: string) => setTenCodes((prev) => prev.filter((item) => item.code !== codeStr));

  // Signals operations
  const handleAddSignal = (s: SignalItem) => setSignals((prev) => [...prev, s]);
  const handleUpdateSignal = (s: SignalItem) => setSignals((prev) => prev.map((item) => (item.id === s.id ? s : item)));
  const handleDeleteSignal = (id: string) => setSignals((prev) => prev.filter((item) => item.id !== id));

  // Emergency dataset reset
  const handleResetToDefaults = () => {
    const defaultData = {
      parkHours: INITIAL_PARK_HOURS,
      announcement: INITIAL_ANNOUNCEMENT,
      roster: INITIAL_ROSTER,
      protocols: INITIAL_PROTOCOLS,
      sops: INITIAL_SOPS,
      contacts: INITIAL_CONTACTS,
      extensions: INITIAL_EXTENSIONS,
      tenCodes: INITIAL_10_CODES,
      signals: INITIAL_SIGNALS,
      schedule: INITIAL_SCHEDULE,
      weatherData: INITIAL_WEATHER,
      predefinedSupervisorsList: PREDEFINED_SUPERVISORS,
      updatedAt: new Date().toISOString(),
    };

    // Reset Firestore doc
    try {
      const docRef = doc(db, SYSTEM_STATE_COLLECTION, SYSTEM_STATE_DOC);
      setDoc(docRef, defaultData).catch(console.error);
    } catch (e) {
      console.error("Firestore reset error:", e);
    }

    fetch("/api/reset", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setParkHours(INITIAL_PARK_HOURS);
          setAnnouncement(INITIAL_ANNOUNCEMENT);
          setRoster(INITIAL_ROSTER);
          setProtocols(INITIAL_PROTOCOLS);
          setSops(INITIAL_SOPS);
          setContacts(INITIAL_CONTACTS);
          setExtensions(INITIAL_EXTENSIONS);
          setTenCodes(INITIAL_10_CODES);
          setSignals(INITIAL_SIGNALS);
          setSchedule(INITIAL_SCHEDULE);
          setWeatherData(INITIAL_WEATHER);
          setPredefinedSupervisorsList(PREDEFINED_SUPERVISORS);
        }
      })
      .catch((err) => {
        console.error("Failed to reset server state, resetting client-side state only", err);
        setParkHours(INITIAL_PARK_HOURS);
        setAnnouncement(INITIAL_ANNOUNCEMENT);
        setRoster(INITIAL_ROSTER);
        setProtocols(INITIAL_PROTOCOLS);
        setSops(INITIAL_SOPS);
        setContacts(INITIAL_CONTACTS);
        setExtensions(INITIAL_EXTENSIONS);
        setTenCodes(INITIAL_10_CODES);
        setSignals(INITIAL_SIGNALS);
        setSchedule(INITIAL_SCHEDULE);
        setWeatherData(INITIAL_WEATHER);
        setPredefinedSupervisorsList(PREDEFINED_SUPERVISORS);
      });
    localStorage.clear();
  };

  // If not logged in, render Login View
  if (!userRole) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Navigation Items
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "protocols", label: "Medical Protocols", icon: BookOpen },
    { id: "sops", label: "SOP's", icon: FileText },
    { id: "directory", label: "Contacts & Extensions", icon: Phone },
    { id: "codes", label: "10-Codes & Signals", icon: Hash },
    { id: "schedule", label: "Supervisor Schedule", icon: Calendar },
    { id: "weather", label: "Park Weather", icon: CloudSun },
    { id: "qrf", label: "Medical QRF Guide", icon: Calculator },
  ];

  if (userRole === "Supervisor") {
    navItems.push({ id: "admin", label: "Supervisor Panel", icon: ShieldCheck });
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-blue-900 selection:text-white">
      
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-blue-900 border-b-4 border-red-600 px-4 md:px-8 py-3 flex items-center justify-between text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center p-0.5 shadow">
            <div className="w-full h-full bg-red-600 rounded-full flex items-center justify-center font-bold text-white text-lg leading-none">+</div>
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider text-white uppercase leading-none font-sans">
              SFGA EMS <span className="font-normal opacity-75">OPERATIONS</span>
            </h1>
            <span className="text-[10px] text-red-200 font-mono tracking-widest mt-0.5 block">
              JACKSON DIVISION
            </span>
          </div>
        </div>

        {/* Desktop Quick Header Details */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono border-l border-blue-800 pl-6 text-slate-300">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-300" />
            <span>EST: {new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-blue-950/70 px-2.5 py-1 rounded border border-blue-800 text-[11px]">
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span className="flex items-center gap-1 text-slate-200 font-sans font-medium">
              Firestore:
              <span className={`inline-block w-2 h-2 rounded-full ${firestoreConnected ? "bg-green-400 animate-pulse" : "bg-yellow-400"}`} />
              <span className="font-mono text-[10px] text-slate-300">{firestoreConnected ? "Live" : "Connecting"}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-blue-950/50 px-3 py-1 rounded-md border border-blue-800">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="font-bold uppercase text-[10px] tracking-wide text-white">
              {userRole === "Supervisor" ? "790 - Supervisor Access" : "EMT Standard Access"}
            </span>
          </div>
        </div>

        {/* Mobile menu trigger + Logout */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="hidden sm:flex items-center gap-1 bg-red-700 hover:bg-red-800 text-white border border-red-500 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all shadow-sm"
            title="Disconnect Session"
          >
            <LogOut className="w-3.5 h-3.5" /> Disconnect
          </button>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 bg-blue-950/50 border border-blue-800 rounded-lg text-slate-200 hover:text-white md:hidden cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Layout Body */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        
        {/* Sidebar Navigation - Desktop */}
        <aside className="hidden md:block w-64 bg-slate-800 border-r border-slate-700 p-4 space-y-1 shrink-0 text-slate-300">
          <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold block mb-3.5 px-3">
            Navigation
          </span>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded transition-all cursor-pointer text-sm ${
                    isActive
                      ? "bg-slate-700 text-white font-bold border-r-4 border-r-red-600"
                      : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="pt-6 border-t border-slate-700 mt-6 px-3">
            <span className="text-[9px] font-mono text-slate-500 uppercase leading-relaxed block">
              Active Station:
            </span>
            <div className="text-[10px] font-mono text-slate-400 mt-1 uppercase font-bold truncate">
              {userRole === "Supervisor" ? "COMMAND-790" : "PATROL-EMT"}
            </div>
            <button
              onClick={handleLogout}
              className="mt-4 w-full flex sm:hidden items-center justify-center gap-1 bg-red-700 hover:bg-red-800 text-white py-2 rounded text-xs font-bold cursor-pointer"
            >
              <LogOut className="w-3 h-3" /> Disconnect
            </button>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden bg-slate-800 border-b border-slate-700 px-4 py-3 space-y-1 z-30 absolute top-0 left-0 right-0 shadow-2xl text-slate-300"
            >
              <span className="text-[9px] uppercase font-mono tracking-widest text-slate-400 block mb-2 px-2">
                Navigation
              </span>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded transition-all cursor-pointer text-sm ${
                        isActive
                          ? "bg-slate-700 text-white font-bold border-r-4 border-r-red-600"
                          : "text-slate-300 hover:text-white hover:bg-slate-700"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
              <div className="pt-3 border-t border-slate-700 mt-3 flex justify-between items-center px-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Role: {userRole}</span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-[10px] text-white bg-red-700 px-2.5 py-1 rounded font-bold"
                >
                  <LogOut className="w-3 h-3" /> Disconnect
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Pane Area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="min-h-full"
            >
              {activeTab === "dashboard" && (
                <DashboardView
                  userRole={userRole}
                  parkHours={parkHours}
                  onUpdateHours={handleUpdateHours}
                  announcement={announcement}
                  onUpdateAnnouncement={handleUpdateAnnouncement}
                  roster={roster}
                  onUpdateRosterItem={handleUpdateRosterItem}
                  weatherData={weatherData}
                  onNavigateToTab={(tabId) => setActiveTab(tabId)}
                />
              )}

              {activeTab === "protocols" && (
                <DocumentsView
                  userRole={userRole}
                  mode="protocols"
                  documents={protocols}
                  onAddDocument={handleAddDocument}
                  onUpdateDocument={handleUpdateDocument}
                  onDeleteDocument={handleDeleteDocument}
                />
              )}

              {activeTab === "sops" && (
                <DocumentsView
                  userRole={userRole}
                  mode="sops"
                  documents={sops}
                  onAddDocument={handleAddDocument}
                  onUpdateDocument={handleUpdateDocument}
                  onDeleteDocument={handleDeleteDocument}
                />
              )}

              {activeTab === "directory" && (
                <DirectoryView
                  userRole={userRole}
                  contacts={contacts}
                  onAddContact={handleAddContact}
                  onUpdateContact={handleUpdateContact}
                  onDeleteContact={handleDeleteContact}
                  extensions={extensions}
                  onAddExtension={handleAddExtension}
                  onUpdateExtension={handleUpdateExtension}
                  onDeleteExtension={handleDeleteExtension}
                />
              )}

              {activeTab === "codes" && (
                <CodesView
                  userRole={userRole}
                  tenCodes={tenCodes}
                  onAddTenCode={handleAddTenCode}
                  onUpdateTenCode={handleUpdateTenCode}
                  onDeleteTenCode={handleDeleteTenCode}
                  signals={signals}
                  onAddSignal={handleAddSignal}
                  onUpdateSignal={handleUpdateSignal}
                  onDeleteSignal={handleDeleteSignal}
                />
              )}

              {activeTab === "schedule" && (
                <ScheduleView
                  userRole={userRole}
                  schedule={schedule}
                  onUpdateScheduleDay={handleUpdateScheduleDay}
                />
              )}

              {activeTab === "weather" && (
                <WeatherView
                  userRole={userRole}
                  weatherData={weatherData}
                  onUpdateWeather={handleUpdateWeather}
                />
              )}

              {activeTab === "qrf" && <MedicalQRF />}

              {activeTab === "admin" && userRole === "Supervisor" && (
                <SupervisorAdmin
                  parkHours={parkHours}
                  onUpdateHours={handleUpdateHours}
                  announcement={announcement}
                  onUpdateAnnouncement={handleUpdateAnnouncement}
                  roster={roster}
                  protocols={protocols}
                  sops={sops}
                  contacts={contacts}
                  extensions={extensions}
                  tenCodes={tenCodes}
                  signals={signals}
                  predefinedSupervisorsList={predefinedSupervisorsList}
                  onUpdatePredefinedSupervisorsList={handleUpdatePredefinedSupervisorsList}
                  onResetToDefaults={handleResetToDefaults}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

      </div>
    </div>
  );
}
