import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

// Load default initialization datasets from types
import {
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
  PREDEFINED_SUPERVISORS,
  INITIAL_STAFF_NAMES,
  INITIAL_PARK_MAPS,
} from "./src/types";

const DB_FILE = path.join(process.cwd(), "db.json");

function loadDb() {
  if (fs.existsSync(DB_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    } catch (e) {
      console.error("Error reading database file, resetting to defaults...", e);
    }
  }

  const defaultDb = {
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
    staffNamesList: INITIAL_STAFF_NAMES,
    maps: INITIAL_PARK_MAPS,
  };

  saveDb(defaultDb);
  return defaultDb;
}

function saveDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing database file", e);
  }
}

async function startServer() {
  const app = reportExpressErrors(express());
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // Disable caching for all API endpoints
  app.use("/api", (req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    next();
  });

  // API endpoints
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const u = (username || "").trim().toLowerCase();
    const p = (password || "").trim().toLowerCase();

    // Check Supervisor credentials
    const isSupervisorUser =
      u === "790" ||
      u === "supervisor" ||
      u === "super" ||
      u === "admin" ||
      u === "790supervisor" ||
      u === "elmer" ||
      u === "charleselmerbsa@gmail.com";

    const isSupervisorPass =
      p === "790supervisor2026" ||
      p === "elmer" ||
      p === "supervisor2026" ||
      p === "supervisor" ||
      p === "sfga2026" ||
      p === "admin";

    // Check EMT credentials
    const isEmtUser =
      u === "emt" ||
      u === "ems" ||
      u === "patrol" ||
      u === "staff" ||
      u === "user";

    const isEmtPass =
      p === "sfga2026" ||
      p === "sfga" ||
      p === "emt2026" ||
      p === "emt";

    if (isSupervisorUser && isSupervisorPass) {
      return res.json({ success: true, role: "Supervisor" });
    } else if (isEmtUser && isEmtPass) {
      return res.json({ success: true, role: "EMT" });
    } else if (p === "790supervisor2026" || p === "elmer") {
      // If correct supervisor password provided regardless of username format
      return res.json({ success: true, role: "Supervisor" });
    } else if (p === "sfga2026" || (isEmtUser && (p === "sfga2026" || p === "emt"))) {
      // If correct EMT password provided
      return res.json({ success: true, role: "EMT" });
    } else {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials. Use EMT / SFGA2026 for field access or 790 / 790supervisor2026 for supervisor access.",
      });
    }
  });

  app.post("/api/verify-reset", (req, res) => {
    const { password } = req.body;
    const normPass = (password || "").trim();

    if (normPass === "ELMER") {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, error: "❌ ACCESS DENIED: Incorrect supervisor password." });
    }
  });

  app.get("/api/state", (req, res) => {
    res.json(loadDb());
  });

  app.post("/api/state", (req, res) => {
    const currentDb = loadDb();
    const updatedDb = { ...currentDb, ...req.body };
    saveDb(updatedDb);
    res.json({ success: true, state: updatedDb });
  });

  // Dedicated documents API endpoints
  app.get("/api/documents", (req, res) => {
    const currentDb = loadDb();
    res.json({
      protocols: currentDb.protocols || INITIAL_PROTOCOLS,
      sops: currentDb.sops || INITIAL_SOPS,
    });
  });

  app.post("/api/documents", (req, res) => {
    const currentDb = loadDb();
    const { document: docItem, protocols, sops } = req.body;

    if (protocols) {
      currentDb.protocols = protocols;
    }
    if (sops) {
      currentDb.sops = sops;
    }

    if (docItem && docItem.id) {
      if (docItem.type) {
        // Medical Direction protocol
        const existingIndex = (currentDb.protocols || []).findIndex(
          (item: any) => item.id === docItem.id
        );
        if (existingIndex >= 0) {
          currentDb.protocols[existingIndex] = docItem;
        } else {
          currentDb.protocols = [docItem, ...(currentDb.protocols || [])];
        }
      } else {
        // SOP
        const existingIndex = (currentDb.sops || []).findIndex(
          (item: any) => item.id === docItem.id
        );
        if (existingIndex >= 0) {
          currentDb.sops[existingIndex] = docItem;
        } else {
          currentDb.sops = [docItem, ...(currentDb.sops || [])];
        }
      }
    }

    saveDb(currentDb);
    res.json({ success: true, protocols: currentDb.protocols, sops: currentDb.sops });
  });

  app.delete("/api/documents/:id", (req, res) => {
    const { id } = req.params;
    const currentDb = loadDb();
    currentDb.protocols = (currentDb.protocols || []).filter((item: any) => item.id !== id);
    currentDb.sops = (currentDb.sops || []).filter((item: any) => item.id !== id);
    saveDb(currentDb);
    res.json({ success: true, id });
  });

  app.post("/api/reset", (req, res) => {
    const defaultDb = {
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
      staffNamesList: INITIAL_STAFF_NAMES,
      maps: INITIAL_PARK_MAPS,
    };
    saveDb(defaultDb);
    res.json({ success: true, state: defaultDb });
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

function reportExpressErrors(app: any) {
  return app;
}

startServer();
