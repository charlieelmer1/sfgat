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
    const normUser = (username || "").trim();
    const normPass = (password || "").trim();

    if (normUser === "EMT" && normPass === "SFGA2026") {
      res.json({ success: true, role: "EMT" });
    } else if (normUser === "790" && normPass === "790supervisor2026") {
      res.json({ success: true, role: "Supervisor" });
    } else {
      res.status(401).json({ success: false, error: "Invalid username or password. Please verify credentials." });
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
