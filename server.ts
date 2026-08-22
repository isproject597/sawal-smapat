import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "database.json");
const CONFIG_FILE = path.join(DATA_DIR, "config.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface AppConfig {
  spreadsheetId: string;
  driveFolderId: string;
  webAppUrl: string;
}

const DEFAULT_CONFIG: AppConfig = {
  spreadsheetId: "1Fo4g48xIbWmzGFfSeY8A_i0Tpwz8-8XONRCqEmP4X5E",
  driveFolderId: "1mAl3vc_Eh35AfRE7Kt5Rv91GV21q0DxC",
  webAppUrl: ""
};

function readConfig(): AppConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, "utf-8");
      return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error("Error reading config file:", err);
  }
  return { ...DEFAULT_CONFIG };
}

function writeConfig(config: AppConfig) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing config file:", err);
  }
}

function readDatabase(): any {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading database file:", err);
  }
  return null;
}

function writeDatabase(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing database file:", err);
  }
}

// Forward data to Google Apps Script Web App asynchronously
async function syncToGoogleAppsScript(webAppUrl: string, payload: any) {
  if (!webAppUrl || !webAppUrl.startsWith("http")) return;

  try {
    const res = await fetch(webAppUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });
    console.log(`Google Apps Script sync response status: ${res.status}`);
  } catch (err) {
    console.warn("Failed to sync to Google Apps Script:", err);
  }
}

async function startServer() {
  const app = express();

  // Increase payload limit for photos and full Excel imports
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // 1. Get Database & Config (Used by Desktop, HP, Tablet)
  app.get("/api/db", (_req, res) => {
    const db = readDatabase();
    const config = readConfig();
    res.json({
      success: true,
      hasData: Boolean(db),
      db: db || {},
      config,
      timestamp: new Date().toISOString()
    });
  });

  // 2. Save Database (Called on upload Excel, edit, add, delete from any device)
  app.post("/api/db", async (req, res) => {
    try {
      const { db, action = "sync_all" } = req.body;
      if (!db) {
        return res.status(400).json({ success: false, message: "No database payload provided" });
      }

      const updatedDb = {
        ...db,
        lastUpdated: new Date().toISOString()
      };
      writeDatabase(updatedDb);

      const config = readConfig();
      if (config.webAppUrl) {
        const payload = {
          action,
          spreadsheetId: config.spreadsheetId,
          driveFolderId: config.driveFolderId,
          timestamp: new Date().toLocaleString("id-ID"),
          aduanList: updatedDb.aduanList || [],
          deletedAduanList: updatedDb.deletedAduanList || [],
          guruList: updatedDb.guruList || [],
          deletedGuruList: updatedDb.deletedGuruList || [],
          mapelList: updatedDb.mapelList || [],
          deletedMapelList: updatedDb.deletedMapelList || [],
          kelasList: updatedDb.kelasList || [],
          deletedKelasList: updatedDb.deletedKelasList || [],
          siswaList: updatedDb.siswaList || [],
          deletedSiswaList: updatedDb.deletedSiswaList || [],
          waliKelasList: updatedDb.waliKelasList || [],
          deletedWaliKelasList: updatedDb.deletedWaliKelasList || []
        };
        // Fire in background without blocking response
        syncToGoogleAppsScript(config.webAppUrl, payload);
      }

      res.json({
        success: true,
        message: "Database tersimpan dan disinkronkan ke seluruh perangkat & cloud.",
        lastUpdated: updatedDb.lastUpdated
      });
    } catch (err: any) {
      console.error("API /api/db error:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 3. Get & Save Global Config (Spreadsheet ID, Drive Folder ID, Web App URL)
  app.get("/api/config", (_req, res) => {
    res.json({ success: true, config: readConfig() });
  });

  app.post("/api/config", async (req, res) => {
    try {
      const { spreadsheetId, driveFolderId, webAppUrl } = req.body;
      const current = readConfig();

      const newConfig: AppConfig = {
        spreadsheetId: spreadsheetId ? String(spreadsheetId).trim() : current.spreadsheetId,
        driveFolderId: driveFolderId ? String(driveFolderId).trim() : current.driveFolderId,
        webAppUrl: webAppUrl !== undefined ? String(webAppUrl).trim() : current.webAppUrl
      };

      writeConfig(newConfig);

      // If webAppUrl is set or changed, push existing DB to Google Sheets immediately
      const db = readDatabase();
      if (newConfig.webAppUrl && db) {
        const payload = {
          action: "sync_all",
          spreadsheetId: newConfig.spreadsheetId,
          driveFolderId: newConfig.driveFolderId,
          timestamp: new Date().toLocaleString("id-ID"),
          aduanList: db.aduanList || [],
          deletedAduanList: db.deletedAduanList || [],
          guruList: db.guruList || [],
          deletedGuruList: db.deletedGuruList || [],
          mapelList: db.mapelList || [],
          deletedMapelList: db.deletedMapelList || [],
          kelasList: db.kelasList || [],
          deletedKelasList: db.deletedKelasList || [],
          siswaList: db.siswaList || [],
          deletedSiswaList: db.deletedSiswaList || [],
          waliKelasList: db.waliKelasList || [],
          deletedWaliKelasList: db.deletedWaliKelasList || []
        };
        syncToGoogleAppsScript(newConfig.webAppUrl, payload);
      }

      res.json({
        success: true,
        message: "Konfigurasi Google Sheets berhasil disimpan secara global untuk seluruh perangkat.",
        config: newConfig
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 4. Test Google Apps Script Web App Connection
  app.post("/api/test-sheets", async (req, res) => {
    try {
      const { url } = req.body;
      const testUrl = url || readConfig().webAppUrl;

      if (!testUrl || !testUrl.startsWith("http")) {
        return res.json({
          success: false,
          message: "Web App URL belum diisi. Masukkan URL Google Apps Script yang diawali https://script.google.com/macros/s/..."
        });
      }

      const response = await fetch(testUrl, { method: "GET" });
      if (response.ok) {
        const text = await response.text();
        let parsed = null;
        try {
          parsed = JSON.parse(text);
        } catch {}

        res.json({
          success: true,
          status: response.status,
          message: "Koneksi Google Apps Script BERHASIL dan Online!",
          details: parsed || text.slice(0, 200)
        });
      } else {
        res.json({
          success: false,
          status: response.status,
          message: `Server Google merespons dengan status ${response.status}. Pastikan deployment diset 'Who has access: Anyone'.`
        });
      }
    } catch (err: any) {
      res.json({
        success: false,
        message: `Gagal terhubung ke Google Apps Script: ${err.message}`
      });
    }
  });

  // 5. Explicit Push All to Google Sheets
  app.post("/api/push-sheets", async (_req, res) => {
    try {
      const config = readConfig();
      const db = readDatabase();

      if (!config.webAppUrl) {
        return res.status(400).json({
          success: false,
          message: "Google Apps Script Web App URL belum dikonfigurasi di menu Admin."
        });
      }

      if (!db) {
        return res.status(400).json({
          success: false,
          message: "Belum ada data lokal/server untuk dikirim."
        });
      }

      const payload = {
        action: "sync_all",
        spreadsheetId: config.spreadsheetId,
        driveFolderId: config.driveFolderId,
        timestamp: new Date().toLocaleString("id-ID"),
        aduanList: db.aduanList || [],
        deletedAduanList: db.deletedAduanList || [],
        guruList: db.guruList || [],
        deletedGuruList: db.deletedGuruList || [],
        mapelList: db.mapelList || [],
        deletedMapelList: db.deletedMapelList || [],
        kelasList: db.kelasList || [],
        deletedKelasList: db.deletedKelasList || [],
        siswaList: db.siswaList || [],
        deletedSiswaList: db.deletedSiswaList || [],
        waliKelasList: db.waliKelasList || [],
        deletedWaliKelasList: db.deletedWaliKelasList || []
      };

      const response = await fetch(config.webAppUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        res.json({
          success: true,
          message: "Seluruh database berhasil dikirim dan tersimpan di Google Sheets & Google Drive!"
        });
      } else {
        res.json({
          success: false,
          message: `Google Sheets merespons status ${response.status}.`
        });
      }
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: `Gagal mengirim ke Google Sheets: ${err.message}`
      });
    }
  });

  // Vite middleware for development vs static for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SAWAL SMAN 4 Berau server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
