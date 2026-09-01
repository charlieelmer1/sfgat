import { generateProcedurePdf } from "./utils/pdfGenerator";

export interface ParkHours {
  themePark: string;
  waterPark: string;
}

export interface RosterItem {
  id: string; // e.g., "790", "EMS2"
  name: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  type?: "procedures" | "direction"; // Only for protocols
  content: string;
  attachmentName?: string;
  attachmentType?: "pdf" | "image" | "text";
  attachmentData?: string; // base64 data URL
  category?: string;
  updatedAt: string;
}

export interface ContactItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  department: string;
  callsign: string;
}

export interface PhoneExtension {
  id: string;
  extension: string;
  department: string;
}

export interface TenCodeItem {
  code: string;
  meaning: string;
  category: "Standard Operations" | "Emergency Signals" | "Status Codes";
}

export interface SignalItem {
  id: string;
  meaning: string;
  priority: "Low" | "Medium" | "High" | "Critical";
}

export interface SupervisorChoice {
  id: string;
  name: string;
  phone: string;
}

export interface DailySchedule {
  sup790: SupervisorChoice;
  sup170: SupervisorChoice;
}

export interface WeeklySchedule {
  [day: string]: DailySchedule; // e.g., "Monday": DailySchedule
}

export interface ParkMapItem {
  id: "operational" | "frightFest";
  title: string;
  imageData?: string; // base64 data URL
  fileName?: string;
  fileSize?: string;
  updatedAt?: string;
  uploadedBy?: string;
}

export interface ParkMapsState {
  operational: ParkMapItem;
  frightFest: ParkMapItem;
}

export const INITIAL_PARK_MAPS: ParkMapsState = {
  operational: {
    id: "operational",
    title: "Operational Map",
    imageData: "",
    fileName: "",
    fileSize: "",
    updatedAt: "",
    uploadedBy: "",
  },
  frightFest: {
    id: "frightFest",
    title: "Fright Fest Map",
    imageData: "",
    fileName: "",
    fileSize: "",
    updatedAt: "",
    uploadedBy: "",
  },
};


export interface HourlyWeather {
  time: string;
  temp: number;
  condition: string;
  precip: number; // probability %
  wind: string;
}

export interface WeatherData {
  zipCode: string;
  location: string;
  condition: string;
  temp: number;
  feelsLike: number;
  wind: string;
  humidity: number;
  cloudCover: number;
  precipitation: string;
  hourly: HourlyWeather[];
}

// Predefined Supervisor choices as requested
export const PREDEFINED_SUPERVISORS: SupervisorChoice[] = [
  { id: "1", name: "Shane Havens", phone: "732-824-2181" },
  { id: "2", name: "Skylar Kohn", phone: "908-216-4926" },
  { id: "3", name: "Lyli D'Armetta", phone: "732-589-1932" },
  { id: "4", name: "Dylan Grebler", phone: "732-598-2556" },
  { id: "5", name: "Madison Prendergast", phone: "908-208-8933" },
];

// Predefined Staff / Personnel pool for callsigns dropdown selection
export const INITIAL_STAFF_NAMES: string[] = [
  "Shane Havens",
  "Skylar Kohn",
  "Lyli D'Armetta",
  "Dylan Grebler",
  "Madison Prendergast",
  "Ryan Miller",
  "Amanda Smith",
  "David Jones",
  "Sarah Conner",
  "Michael Chang",
  "Jessica Williams",
  "James Thompson",
  "Emily Davis",
  "Kyle Anderson",
  "Brianna Scott",
  "Thomas Kelly",
  "Medic 2 Crew (ALS Rescue)",
  "Medic 3 Crew (Station 1)",
  "Main First Aid Dispatcher",
  "Hurricane Harbor Crew",
];

export const INITIAL_PARK_HOURS: ParkHours = {
  themePark: "10:00 AM - 10:00 PM",
  waterPark: "11:00 AM - 6:30 PM",
};

export const INITIAL_ANNOUNCEMENT = "🚨 REMINDER TO ALL CREWS: Keep hydrated! Temperatures are expected to climb to 88°F today. Check on-duty hydration stations at Station 1 and Nitro First Aid. Make sure ALS kit batteries are fully charged for the shift. – Supervisor 790";

export const INITIAL_ROSTER: RosterItem[] = [
  { id: "790", name: "Skylar Kohn" },
  { id: "791", name: "Ryan Miller" },
  { id: "792", name: "Amanda Smith" },
  { id: "793", name: "David Jones" },
  { id: "794", name: "Sarah Conner" },
  { id: "795", name: "Michael Chang" },
  { id: "796", name: "Jessica Williams" },
  { id: "797", name: "James Thompson" },
  { id: "798", name: "Emily Davis" },
  { id: "EMS2", name: "Medic 2 Crew (ALS Rescue)" },
  { id: "EMS3", name: "Medic 3 Crew (Station 1)" },
  { id: "EMS4", name: "Main First Aid Dispatcher" },
  { id: "EMS5", name: "Hurricane Harbor Crew" },
  { id: "170", name: "Shane Havens" },
  { id: "171", name: "Kyle Anderson" },
  { id: "172", name: "Brianna Scott" },
  { id: "173", name: "Thomas Kelly" },
];

export const INITIAL_PROTOCOLS: DocumentItem[] = [
  {
    id: "prot-1",
    title: "Anaphylaxis & Severe Allergic Reactions",
    type: "direction",
    category: "Allergic / Immunological",
    updatedAt: "2026-05-12",
    attachmentName: "SFGA_Directive_Anaphylaxis_Management.pdf",
    attachmentType: "pdf",
    attachmentData: generateProcedurePdf({
      title: "Anaphylaxis & Severe Allergic Reactions",
      type: "direction",
      category: "Allergic / Immunological",
      updatedAt: "2026-05-12",
      content: `Clinical Presentation: Dyspnea, wheezing, stridor, urticaria (hives), pruritus, hypotension, tachycardia, or swelling of the face, lips, or tongue.

Immediate Actions:
1. Assess Airway, Breathing, and Circulation (ABCs).
2. Administer high-flow Oxygen via Non-Rebreather Mask (12-15 L/min).
3. If anaphylaxis is present (involvement of 2 or more body systems, or hypotension/airway swelling):
   - Administer Epinephrine 1:1,000 (0.3 mg IM in lateral thigh) for adults.
   - Administer Epinephrine 1:1,000 (0.15 mg IM) for pediatric patients (<30kg).
4. Monitor vital signs every 5 minutes.
5. Establish IV access en route or on-scene if ALS is present.
6. Administer Albuterol (2.5 mg via nebulizer) if bronchospasm persists.
7. Request ALS intercept if not already on-scene. Do not delay transport.`
    }),
    content: `Clinical Presentation: Dyspnea, wheezing, stridor, urticaria (hives), pruritus, hypotension, tachycardia, or swelling of the face, lips, or tongue.

Immediate Actions:
1. Assess Airway, Breathing, and Circulation (ABCs).
2. Administer high-flow Oxygen via Non-Rebreather Mask (12-15 L/min).
3. If anaphylaxis is present (involvement of 2 or more body systems, or hypotension/airway swelling):
   - Administer Epinephrine 1:1,000 (0.3 mg IM in lateral thigh) for adults.
   - Administer Epinephrine 1:1,000 (0.15 mg IM) for pediatric patients (<30kg).
4. Monitor vital signs every 5 minutes.
5. Establish IV access en route or on-scene if ALS is present.
6. Administer Albuterol (2.5 mg via nebulizer) if bronchospasm persists.
7. Request ALS intercept if not already on-scene. Do not delay transport.`
  },
  {
    id: "prot-2",
    title: "Heat-Related Emergencies & Heat Stroke",
    type: "procedures",
    category: "Environmental",
    updatedAt: "2026-06-01",
    attachmentName: "SFGA_SOP_Heat_Stroke_Cooling.pdf",
    attachmentType: "pdf",
    attachmentData: generateProcedurePdf({
      title: "Heat-Related Emergencies & Heat Stroke",
      type: "procedures",
      category: "Environmental",
      updatedAt: "2026-06-01",
      content: `Six Flags Great Adventure Summer Environmental SOP:
With high ambient temperature and high humidity in the park:

Heat Exhaustion Symptoms: Heavy sweating, pale skin, muscle cramps, fatigue, headache, dizziness, nausea/vomiting. Normal mental status.
Treatment:
1. Move patient to First Aid Station A/C immediately.
2. Remove tight/excess clothing.
3. Apply cool, damp cloths. Spray cool water.
4. Provide active oral hydration (water or electrolyte drinks) if patient is fully conscious and cooperative.

Heat Stroke Symptoms: High body temp (>103°F), hot/dry or heavily sweating skin, altered mental status (confusion, combativeness, lethargy), seizure, coma.
Treatment:
1. Medical Emergency! Request immediate backup and transport.
2. Active Cooling: Apply ice packs to cervical, axillary, and inguinal regions. Fanning with high-velocity air.
3. Administer high-flow Oxygen.
4. Establish IV access (ALS) and administer cool Normal Saline bolus (20 mL/kg up to 1L).
5. Do NOT give anything by mouth.`
    }),
    content: `Six Flags Great Adventure Summer Environmental SOP:
With high ambient temperature and high humidity in the park:

Heat Exhaustion Symptoms: Heavy sweating, pale skin, muscle cramps, fatigue, headache, dizziness, nausea/vomiting. Normal mental status.
Treatment:
1. Move patient to First Aid Station A/C immediately.
2. Remove tight/excess clothing.
3. Apply cool, damp cloths. Spray cool water.
4. Provide active oral hydration (water or electrolyte drinks) if patient is fully conscious and cooperative.

Heat Stroke Symptoms: High body temp (>103°F), hot/dry or heavily sweating skin, altered mental status (confusion, combativeness, lethargy), seizure, coma.
Treatment:
1. Medical Emergency! Request immediate backup and transport.
2. Active Cooling: Apply ice packs to cervical, axillary, and inguinal regions. Fanning with high-velocity air.
3. Administer high-flow Oxygen.
4. Establish IV access (ALS) and administer cool Normal Saline bolus (20 mL/kg up to 1L).
5. Do NOT give anything by mouth.`
  },
  {
    id: "prot-3",
    title: "Traumatic Fractures and Extremity Splinting",
    type: "procedures",
    category: "Trauma",
    updatedAt: "2026-04-10",
    attachmentName: "SFGA_Clinical_Splinting_PMS_Protocol.pdf",
    attachmentType: "pdf",
    attachmentData: generateProcedurePdf({
      title: "Traumatic Fractures and Extremity Splinting",
      type: "procedures",
      category: "Trauma",
      updatedAt: "2026-04-10",
      content: `Standard Splinting Procedure:
1. Expose the injury site. Assess distal sensory, motor, and circulatory function (PMS: Pulse, Motor, Sensory) BEFORE splinting.
2. Cover open wounds with sterile dressings before applying splint.
3. Splint the joint above and below the fracture site.
4. Align severely angulated fractures with gentle traction only if pulse is absent and transport is delayed. If resistance is met, splint in the position of deformity.
5. Immobilize with cardboard splint, SAM splint, or vacuum splint. Ensure not too tight.
6. Re-assess PMS immediately AFTER splinting and document.
7. Apply cold pack to the site to reduce swelling and pain.`
    }),
    content: `Standard Splinting Procedure:
1. Expose the injury site. Assess distal sensory, motor, and circulatory function (PMS: Pulse, Motor, Sensory) BEFORE splinting.
2. Cover open wounds with sterile dressings before applying splint.
3. Splint the joint above and below the fracture site.
4. Align severely angulated fractures with gentle traction only if pulse is absent and transport is delayed. If resistance is met, splint in the position of deformity.
5. Immobilize with cardboard splint, SAM splint, or vacuum splint. Ensure not too tight.
6. Re-assess PMS immediately AFTER splinting and document.
7. Apply cold pack to the site to reduce swelling and pain.`
  }
];

export const INITIAL_SOPS: DocumentItem[] = [
  {
    id: "sop-1",
    title: "Ambulance Staging & Park Gates Ingress",
    category: "Operations",
    updatedAt: "2026-03-20",
    content: `Gate Code / Ingress Instructions for EMS Crews:

1. Primary Gate Access: Use Gate 4 (adjacent to Nitro coaster) for all standard park entries.
2. Dispatch Notification: Always notify Dispatch ('Base') when passing through any gate.
3. Speed Limit: The maximum speed limit inside the park pedestrian areas is 5 MPH. Headlights and warning flashers MUST be on. Sirens must be used with discretion and should be shut down in crowded walkways unless absolutely necessary.
4. Spotter Rule: When backing up any EMS vehicle or driving through high-density queue areas, an on-duty EMT must dismount and act as a rear spotter.
5. Staging Locations:
   - Stage 1: Main First Aid (Behind Board Walk)
   - Stage 2: Hurricane Harbor First Aid (Next to Calypso Wavepool)
   - Stage 3: Safari Outpost Station (West side of park)`
  },
  {
    id: "sop-2",
    title: "Minor Incident Patient Release & Refusal (AMA)",
    category: "Legal / Risk Management",
    updatedAt: "2026-02-15",
    content: `Against Medical Advice (AMA) Release Protocol:

All patients who are evaluated by EMS and refuse medical transport or further treatment must meet the following criteria to sign a refusal form:
1. Patient must be of legal age (or parent/guardian present for minors).
2. Patient must be fully oriented to person, place, time, and event (A&O x 4) and have no signs of cognitive impairment (drugs, alcohol, head trauma).
3. The patient must understand the potential risks of refusing treatment (up to and including death).
4. Clearly document:
   - Full clinical assessment and vital signs.
   - The specific risks explained to the patient.
   - The presence of any family/friends who witnessed the refusal.
   - Obtain patient signature, witness signature, and supervisor sign-off (if high risk).
5. If the patient is a minor with no guardian present, contact Park Supervisor immediately to initiate administrative custody or hold.`
  }
];

export const INITIAL_CONTACTS: ContactItem[] = [
  { id: "c-1", department: "Safety", callsign: "701", name: "Sloane Murray", phone: "732-773-1872" },
  { id: "c-2", department: "Safety", callsign: "781", name: "Shane Havens", phone: "732-824-2181" },
  { id: "c-3", department: "Safety", callsign: "782", name: "Skylar Kohn", phone: "908-216-4926" },
  { id: "c-4", department: "Safety", callsign: "783", name: "Lylli D'Armetta", phone: "609-949-3633" },
  { id: "c-5", department: "Safety", callsign: "784", name: "Dylan Grebler", phone: "732-598-2556" },
  { id: "c-6", department: "Safety", callsign: "785", name: "Madison Prendergast", phone: "908-208-8933" },
  { id: "c-7", department: "Safety", callsign: "5811", name: "Jeff Morse", phone: "856-279-1953" },
  { id: "c-8", department: "Safety", callsign: "5812", name: "John Johnson", phone: "732-614-5948" },
  { id: "c-9", department: "Safety", callsign: "5813", name: "Rob Reillo", phone: "609-414-2542" },
  { id: "c-10", department: "Safety", callsign: "5814", name: "Derek Krum", phone: "609-738-7507" },
  { id: "c-11", department: "Safety", callsign: "787", name: "Joey Parker", phone: "609-949-9633" },
  { id: "c-12", department: "Emergency", callsign: "N/A", name: "Ocean County Dispatch", phone: "732-349-9100" },
  { id: "c-13", department: "Emergency", callsign: "N/A", name: "CSMC ER", phone: "732-294-2787" },
  { id: "c-14", department: "Emergency", callsign: "N/A", name: "Monmouth Med South ER", phone: "732-886-4525" },
  { id: "c-15", department: "Emergency", callsign: "N/A", name: "Jersey Shore UMC", phone: "732-897-2000" },
  { id: "c-16", department: "Emergency", callsign: "N/A", name: "RWJ Hamilton ER", phone: "609-584-6666" },
];

export const INITIAL_EXTENSIONS: PhoneExtension[] = [
  { id: "e-1", extension: "2100", department: "Main First Aid Desk" },
  { id: "e-2", extension: "2105", department: "EMS Supervisor Office (790)" },
  { id: "e-3", extension: "2110", department: "Hurricane Harbor First Aid" },
  { id: "e-4", extension: "3200", department: "Security Operations Desk" },
  { id: "e-5", extension: "3250", department: "Security Front Gate" },
  { id: "e-6", extension: "4100", department: "Park Operations Command" },
  { id: "e-7", extension: "4150", department: "Guest Relations Admin" },
  { id: "e-8", extension: "5500", department: "Ride Maintenance Control" },
  { id: "e-9", extension: "5610", department: "Safari Outpost Care Clinic" },
  { id: "e-10", extension: "6200", department: "Human Resources Office" },
];

export const INITIAL_10_CODES: TenCodeItem[] = [
  { code: "10-1", meaning: "Receiving Poorly", category: "Standard Operations" },
  { code: "10-2", meaning: "Receiving Well", category: "Standard Operations" },
  { code: "10-4", meaning: "Affirmative", category: "Standard Operations" },
  { code: "10-6", meaning: "Busy", category: "Standard Operations" },
  { code: "10-7", meaning: "Out of Service", category: "Status Codes" },
  { code: "10-8", meaning: "In Service", category: "Status Codes" },
  { code: "10-9", meaning: "Repeat", category: "Standard Operations" },
  { code: "10-10", meaning: "Meet At", category: "Standard Operations" },
  { code: "10-12", meaning: "Board of Health", category: "Standard Operations" },
  { code: "10-13", meaning: "Traffic Report", category: "Standard Operations" },
  { code: "10-14", meaning: "Escort / Transport", category: "Standard Operations" },
  { code: "10-15", meaning: "Subject in Custody", category: "Standard Operations" },
  { code: "10-16", meaning: "Trash Pick-Up", category: "Standard Operations" },
  { code: "10-17", meaning: "Guest Concern", category: "Standard Operations" },
  { code: "10-19", meaning: "Return to Security / Medical", category: "Status Codes" },
  { code: "10-20", meaning: "Location", category: "Standard Operations" },
  { code: "10-21", meaning: "Phone Extension", category: "Standard Operations" },
  { code: "10-22", meaning: "Disregard", category: "Standard Operations" },
  { code: "10-23", meaning: "Standby", category: "Status Codes" },
  { code: "10-35", meaning: "Confidential Info", category: "Standard Operations" },
  { code: "10-36", meaning: "Correct Time", category: "Standard Operations" },
  { code: "10-47", meaning: "Alcohol Violation", category: "Emergency Signals" },
  { code: "10-50", meaning: "Stopping Vehicle", category: "Emergency Signals" },
  { code: "10-51", meaning: "Enroute", category: "Status Codes" },
  { code: "10-52", meaning: "ETA", category: "Standard Operations" },
  { code: "10-54", meaning: "Negative", category: "Standard Operations" },
  { code: "10-56", meaning: "Go To / Report", category: "Standard Operations" },
  { code: "10-58", meaning: "Return to Fire Station", category: "Status Codes" },
  { code: "10-81", meaning: "Personal Break", category: "Status Codes" },
  { code: "10-91", meaning: "Unauthorized Radio Traffic", category: "Standard Operations" },
  { code: "10-97", meaning: "Arrived", category: "Status Codes" },
  { code: "10-98", meaning: "Assignment Complete", category: "Status Codes" },
  { code: "10-100", meaning: "Emergency Radio Traffic Only", category: "Emergency Signals" },
];

export const INITIAL_SIGNALS: SignalItem[] = [
  { id: "Signal 0", meaning: "Armed", priority: "Critical" },
  { id: "Signal 0-K", meaning: "Armed w/ Knife", priority: "Critical" },
  { id: "Signal 0-F", meaning: "Armed w/ Firearm", priority: "Critical" },
  { id: "Signal 2", meaning: "Ride OOS w/ Guests", priority: "High" },
  { id: "Signal 2E", meaning: "Ride OOS Urgent", priority: "Critical" },
  { id: "Signal 4", meaning: "Motor Vehicle Accident", priority: "High" },
  { id: "Signal 5", meaning: "Murder", priority: "Critical" },
  { id: "Signal 7", meaning: "Dead on Arrival", priority: "Critical" },
  { id: "Signal 8", meaning: "Missing Person (Adult)", priority: "High" },
  { id: "Signal 9", meaning: "Vehicle Assist", priority: "Low" },
  { id: "Signal 10", meaning: "Stolen Vehicle", priority: "Medium" },
  { id: "Signal 11", meaning: "Abandoned Vehicle", priority: "Low" },
  { id: "Signal 12", meaning: "Reckless Driver", priority: "Medium" },
  { id: "Signal 13", meaning: "Suspicious Vehicle", priority: "Medium" },
  { id: "Signal 13-P", meaning: "Suspicious Person", priority: "Medium" },
  { id: "Signal 13-N", meaning: "Undesirable Person", priority: "Medium" },
  { id: "Signal 15", meaning: "Special Assignment", priority: "Low" },
  { id: "Signal 16", meaning: "Obstruction in Roadway", priority: "Medium" },
  { id: "Signal 17 T", meaning: "Trainer needs Medical Assistance", priority: "High" },
  { id: "Signal 18 Red", meaning: "Dangerous Animal Escape", priority: "Critical" },
  { id: "Signal 18 Green", meaning: "Animal Captured", priority: "Medium" },
  { id: "Signal 20", meaning: "Mentally Ill Person", priority: "Medium" },
  { id: "Signal 21", meaning: "Breaking and Entering", priority: "High" },
  { id: "Signal 22", meaning: "Disturbance", priority: "Medium" },
  { id: "Signal 22-A", meaning: "Fight in Progress", priority: "High" },
  { id: "Signal 23", meaning: "Robbery", priority: "Critical" },
  { id: "Signal 24", meaning: "Theft", priority: "Medium" },
  { id: "Signal 25", meaning: "Fire", priority: "Critical" },
  { id: "Signal 26", meaning: "Drowning", priority: "Critical" },
  { id: "Signal 28", meaning: "Suicide", priority: "Critical" },
  { id: "Signal 29", meaning: "Alarm", priority: "High" },
  { id: "Signal 36", meaning: "Key Assist", priority: "Low" },
  { id: "Signal 37", meaning: "First Aid Request", priority: "High" },
  { id: "Signal 38", meaning: "Guest Assist", priority: "Low" },
  { id: "Signal 39", meaning: "Money Transfer", priority: "Low" },
  { id: "Signal 41", meaning: "Shoplifting", priority: "Medium" },
  { id: "Signal 43", meaning: "Soliciting", priority: "Low" },
  { id: "Signal 47", meaning: "Indecent Exposure", priority: "Medium" },
  { id: "Signal 49", meaning: "Counterfeit Money", priority: "Medium" },
  { id: "Signal 50", meaning: "Motor Assist", priority: "Low" },
  { id: "Signal 51", meaning: "Drunk Driver", priority: "High" },
  { id: "Signal 52", meaning: "Drunk Person", priority: "Medium" },
  { id: "Signal 53", meaning: "Hit & Run", priority: "High" },
  { id: "Signal 55", meaning: "Explosion", priority: "Critical" },
  { id: "Signal 55-A", meaning: "Bomb Threat", priority: "Critical" },
  { id: "Signal 57", meaning: "Hunters", priority: "Medium" },
  { id: "Signal 58", meaning: "Fireworks", priority: "Low" },
  { id: "Signal 61", meaning: "Building Check", priority: "Low" },
  { id: "Signal 66", meaning: "Sexual Offense", priority: "High" },
  { id: "Signal 70", meaning: "Lost Child", priority: "High" },
  { id: "Signal 95", meaning: "Drug Violation", priority: "Medium" },
  { id: "Signal 95-A", meaning: "Drug Transaction", priority: "High" },
  { id: "Signal 96", meaning: "Vicious Animal", priority: "High" },
  { id: "Signal 97", meaning: "Illegal Entry", priority: "Medium" },
  { id: "Signal 999", meaning: "Unit in Distress", priority: "Critical" },
  { id: "Signal 1000", meaning: "CC Alarm", priority: "High" },
  { id: "Signal 2000", meaning: "ATM Alarm", priority: "High" },
  { id: "Signal 3000", meaning: "HH CC Alarm", priority: "High" },
  { id: "Signal 9000", meaning: "Park Evacuation", priority: "Critical" },
  { id: "Signal 10000", meaning: "Housing Evacuation", priority: "Critical" },
];

export const INITIAL_SCHEDULE: WeeklySchedule = {
  "Monday": {
    sup790: PREDEFINED_SUPERVISORS[1], // Skylar Kohn
    sup170: PREDEFINED_SUPERVISORS[0], // Shane Havens
  },
  "Tuesday": {
    sup790: PREDEFINED_SUPERVISORS[2], // Lyli D'Armetta
    sup170: PREDEFINED_SUPERVISORS[1], // Skylar Kohn
  },
  "Wednesday": {
    sup790: PREDEFINED_SUPERVISORS[3], // Dylan Grebler
    sup170: PREDEFINED_SUPERVISORS[2], // Lyli D'Armetta
  },
  "Thursday": {
    sup790: PREDEFINED_SUPERVISORS[4], // Madison Prendergast
    sup170: PREDEFINED_SUPERVISORS[3], // Dylan Grebler
  },
  "Friday": {
    sup790: PREDEFINED_SUPERVISORS[0], // Shane Havens
    sup170: PREDEFINED_SUPERVISORS[4], // Madison Prendergast
  },
  "Saturday": {
    sup790: PREDEFINED_SUPERVISORS[1], // Skylar Kohn
    sup170: PREDEFINED_SUPERVISORS[0], // Shane Havens
  },
  "Sunday": {
    sup790: PREDEFINED_SUPERVISORS[2], // Lyli D'Armetta
    sup170: PREDEFINED_SUPERVISORS[1], // Skylar Kohn
  },
};

export const INITIAL_WEATHER: WeatherData = {
  zipCode: "08527",
  location: "Jackson, NJ",
  condition: "Partly Cloudy",
  temp: 84,
  feelsLike: 89,
  wind: "9 mph SW",
  humidity: 64,
  cloudCover: 35,
  precipitation: "15%",
  hourly: [
    { time: "08:00 AM", temp: 74, condition: "Sunny", precip: 0, wind: "5 mph W" },
    { time: "10:00 AM", temp: 79, condition: "Sunny", precip: 5, wind: "6 mph SW" },
    { time: "12:00 PM", temp: 83, condition: "Partly Cloudy", precip: 10, wind: "8 mph SW" },
    { time: "02:00 PM", temp: 85, condition: "Partly Cloudy", precip: 15, wind: "10 mph SW" },
    { time: "04:00 PM", temp: 84, condition: "Partly Cloudy", precip: 15, wind: "9 mph SW" },
    { time: "06:00 PM", temp: 81, condition: "Partly Cloudy", precip: 10, wind: "7 mph S" },
    { time: "08:00 PM", temp: 77, condition: "Clear", precip: 5, wind: "5 mph S" },
    { time: "10:00 PM", temp: 73, condition: "Clear", precip: 0, wind: "4 mph S" },
  ]
};
