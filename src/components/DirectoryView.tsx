import React, { useState } from "react";
import { Phone, Users, Search, Plus, Trash2, Edit3, Save, MessageSquare, Mail, Building } from "lucide-react";
import { ContactItem, PhoneExtension } from "../types";

interface DirectoryViewProps {
  userRole: "EMT" | "Supervisor";
  contacts: ContactItem[];
  onAddContact: (contact: ContactItem) => void;
  onUpdateContact: (contact: ContactItem) => void;
  onDeleteContact: (id: string) => void;
  extensions: PhoneExtension[];
  onAddExtension: (ext: PhoneExtension) => void;
  onUpdateExtension: (ext: PhoneExtension) => void;
  onDeleteExtension: (id: string) => void;
}

export default function DirectoryView({
  userRole,
  contacts,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  extensions,
  onAddExtension,
  onUpdateExtension,
  onDeleteExtension,
}: DirectoryViewProps) {
  const isSupervisor = userRole === "Supervisor";
  const [activeSubTab, setActiveSubTab] = useState<"contacts" | "extensions">("contacts");

  // Search terms
  const [contactSearch, setContactSearch] = useState("");
  const [extensionSearch, setExtensionSearch] = useState("");

  // Editing modal states
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactModalMode, setContactModalMode] = useState<"add" | "edit">("add");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    name: "",
    phone: "",
    email: "",
    department: "",
    callsign: "",
  });

  const [showExtModal, setShowExtModal] = useState(false);
  const [extModalMode, setExtModalMode] = useState<"add" | "edit">("add");
  const [selectedExtId, setSelectedExtId] = useState<string | null>(null);
  const [extForm, setExtForm] = useState({
    extension: "",
    department: "",
  });

  // Filter contacts
  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.phone.toLowerCase().includes(contactSearch.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(contactSearch.toLowerCase())) ||
      c.department.toLowerCase().includes(contactSearch.toLowerCase()) ||
      (c.callsign && c.callsign.toLowerCase().includes(contactSearch.toLowerCase()))
  );

  // Filter extensions by department name
  const filteredExtensions = extensions.filter((e) =>
    e.department.toLowerCase().includes(extensionSearch.toLowerCase()) ||
    e.extension.includes(extensionSearch)
  );

  // Contact actions
  const handleOpenAddContact = () => {
    setContactForm({ name: "", phone: "", email: "", department: "", callsign: "" });
    setContactModalMode("add");
    setShowContactModal(true);
  };

  const handleOpenEditContact = (c: ContactItem) => {
    setSelectedContactId(c.id);
    setContactForm({
      name: c.name,
      phone: c.phone,
      email: c.email || "",
      department: c.department,
      callsign: c.callsign || "",
    });
    setContactModalMode("edit");
    setShowContactModal(true);
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.phone || !contactForm.department) return;

    if (contactModalMode === "add") {
      onAddContact({
        id: `contact-${Date.now()}`,
        ...contactForm,
      });
    } else if (contactModalMode === "edit" && selectedContactId) {
      onUpdateContact({
        id: selectedContactId,
        ...contactForm,
      });
    }
    setShowContactModal(false);
  };

  const handleDeleteContact = (id: string) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      onDeleteContact(id);
    }
  };

  // Extension actions
  const handleOpenAddExt = () => {
    setExtForm({ extension: "", department: "" });
    setExtModalMode("add");
    setShowExtModal(true);
  };

  const handleOpenEditExt = (e: PhoneExtension) => {
    setSelectedExtId(e.id);
    setExtForm({
      extension: e.extension,
      department: e.department,
    });
    setExtModalMode("edit");
    setShowExtModal(true);
  };

  const handleSaveExt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extForm.extension || !extForm.department) return;

    if (extModalMode === "add") {
      onAddExtension({
        id: `ext-${Date.now()}`,
        ...extForm,
      });
    } else if (extModalMode === "edit" && selectedExtId) {
      onUpdateExtension({
        id: selectedExtId,
        ...extForm,
      });
    }
    setShowExtModal(false);
  };

  const handleDeleteExt = (id: string) => {
    if (confirm("Are you sure you want to delete this extension?")) {
      onDeleteExtension(id);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans relative">
      
      {/* Tab Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Phone className="w-6 h-6 text-red-650" />
            Park Communications Directory
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Emergency hotlines, regional medical agencies, and internal park department phone extensions.
          </p>
        </div>

        {/* Directory/Extensions Sub-selector */}
        <div className="flex bg-slate-100 p-1 rounded border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab("contacts")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded cursor-pointer transition-all ${
              activeSubTab === "contacts" ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users className="w-3.5 h-3.5" /> General Contacts
          </button>
          <button
            onClick={() => setActiveSubTab("extensions")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded cursor-pointer transition-all ${
              activeSubTab === "extensions" ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Phone className="w-3.5 h-3.5" /> Park Extensions
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-200 rounded p-6 shadow-sm border-t-4 border-t-blue-900">
        
        {/* TAB 1: GENERAL CONTACTS */}
        {activeSubTab === "contacts" && (
          <div className="space-y-4">
            
            <div className="flex flex-col sm:flex-row justify-between gap-3 items-stretch sm:items-center">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Quick search by name, department, or phone..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-900"
                />
              </div>
              {isSupervisor && (
                <button
                  onClick={handleOpenAddContact}
                  className="bg-blue-900 hover:bg-blue-850 text-white text-xs font-bold px-4 py-2 rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" /> Add Contact
                </button>
              )}
            </div>

            {/* Desktop Table */}
            <div className="overflow-x-auto rounded border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase font-mono tracking-wider font-semibold border-b border-slate-200">
                    <th className="p-4">Department</th>
                    <th className="p-4">Callsign</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Phone #</th>
                    {isSupervisor && <th className="p-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredContacts.length === 0 ? (
                    <tr>
                      <td colSpan={isSupervisor ? 5 : 4} className="text-center p-8 text-slate-400 font-sans">
                        No contacts found matching search terms.
                      </td>
                    </tr>
                  ) : (
                    filteredContacts.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-sans text-slate-500">
                          <span className={`px-2.5 py-1 rounded border text-[10px] uppercase font-mono font-bold tracking-wide ${
                            c.department.toLowerCase() === "emergency"
                              ? "bg-red-50 text-red-750 border-red-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}>
                            {c.department}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-800 text-sm">
                          {c.callsign || "N/A"}
                        </td>
                        <td className="p-4 font-sans font-bold text-slate-850 text-sm">{c.name}</td>
                        <td className="p-4 font-mono text-blue-900 font-bold">
                          <a href={`tel:${c.phone}`} className="hover:text-blue-750 hover:underline flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {c.phone}
                          </a>
                        </td>
                        {isSupervisor && (
                          <td className="p-4 text-right whitespace-nowrap">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditContact(c)}
                                className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteContact(c.id)}
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

        {/* TAB 2: PARK PHONE EXTENSIONS */}
        {activeSubTab === "extensions" && (
          <div className="space-y-4">
            
            <div className="flex flex-col sm:flex-row justify-between gap-3 items-stretch sm:items-center">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Filter extensions by department name..."
                  value={extensionSearch}
                  onChange={(e) => setExtensionSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-900"
                />
              </div>
              {isSupervisor && (
                <button
                  onClick={handleOpenAddExt}
                  className="bg-blue-900 hover:bg-blue-850 text-white text-xs font-bold px-4 py-2 rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" /> Add Extension
                </button>
              )}
            </div>

            {/* Desktop Table */}
            <div className="overflow-x-auto rounded border border-slate-200 max-w-2xl mx-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase font-mono tracking-wider font-semibold border-b border-slate-200">
                    <th className="p-4 w-1/3">Extension</th>
                    <th className="p-4">Department / Desk Location</th>
                    {isSupervisor && <th className="p-4 text-right w-1/4">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                  {filteredExtensions.length === 0 ? (
                    <tr>
                      <td colSpan={isSupervisor ? 3 : 2} className="text-center p-8 text-slate-400 font-sans">
                        No extensions found matching search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredExtensions.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-bold text-slate-800 text-base flex items-center gap-2">
                          <span className="bg-red-50 text-red-800 text-xs font-bold px-2 py-1 rounded border border-red-200">
                            Ext
                          </span>
                          {e.extension}
                        </td>
                        <td className="p-4 font-sans text-slate-700 font-semibold">{e.department}</td>
                        {isSupervisor && (
                          <td className="p-4 text-right whitespace-nowrap">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditExt(e)}
                                className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteExt(e.id)}
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

      {/* CONTACT MODAL */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <form
            onSubmit={handleSaveContact}
            className="bg-white border border-slate-200 rounded w-full max-w-md p-6 space-y-4 shadow-2xl relative"
          >
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2 font-sans">
              <Building className="w-5 h-5 text-red-600" />
              {contactModalMode === "add" ? "Create New Contact" : "Modify Contact"}
            </h3>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">
                  Department Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mutual Aid, Security, Command"
                  value={contactForm.department}
                  onChange={(e) => setContactForm({ ...contactForm, department: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">
                  Callsign (e.g. 701, N/A)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 701 or N/A"
                  value={contactForm.callsign}
                  onChange={(e) => setContactForm({ ...contactForm, callsign: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">
                  Contact Person / Unit Identifier
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sloane Murray"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 732-555-0199"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-900 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="px-3 py-1.5 bg-white text-slate-500 hover:bg-slate-50 border border-slate-200 rounded text-xs cursor-pointer font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-850 text-white rounded text-xs cursor-pointer font-bold flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" /> Save Contact
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EXTENSION MODAL */}
      {showExtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <form
            onSubmit={handleSaveExt}
            className="bg-white border border-slate-200 rounded w-full max-w-sm p-6 space-y-4 shadow-2xl relative"
          >
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2 font-sans">
              <Phone className="w-5 h-5 text-red-650" />
              {extModalMode === "add" ? "Add Phone Extension" : "Modify Extension"}
            </h3>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">
                  Extension Number (4-Digits)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2150"
                  value={extForm.extension}
                  onChange={(e) => setExtForm({ ...extForm, extension: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-900 font-mono text-base font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-1">
                  Department / Desk Location
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ride Ops Control desk"
                  value={extForm.department}
                  onChange={(e) => setExtForm({ ...extForm, department: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-900 font-sans"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowExtModal(false)}
                className="px-3 py-1.5 bg-white text-slate-500 hover:bg-slate-50 border border-slate-200 rounded text-xs cursor-pointer font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-850 text-white rounded text-xs cursor-pointer font-bold flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" /> Save Extension
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
