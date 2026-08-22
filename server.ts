import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import {
  INITIAL_GURU,
  INITIAL_MAPEL,
  INITIAL_KELAS,
  INITIAL_SISWA,
  INITIAL_WALI_KELAS,
  INITIAL_ADUAN
} from "./src/data/mockData";

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "database.json");
const CONFIG_FILE = path.join(DATA_DIR, "config.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface AppConfig {
  spreadsheetId: string;
  driveFolderId: string;
  webAppUrl: string;
}

export const DEFAULT_CONFIG: AppConfig = {
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

// Initial Database Seeding
const INITIAL_DATABASE = {
  aduanList: INITIAL_ADUAN,
  deletedAduanList: [],
  guruList: INITIAL_GURU,
  deletedGuruList: [],
  mapelList: INITIAL_MAPEL,
  deletedMapelList: [],
  kelasList: INITIAL_KELAS,
  deletedKelasList: [],
  siswaList: INITIAL_SISWA,
  deletedSiswaList: [],
  waliKelasList: INITIAL_WALI_KELAS,
  deletedWaliKelasList: [],
  lastUpdated: new Date().toISOString()
};

function readDatabase(): any {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === "object") {
        return {
          aduanList: parsed.aduanList || INITIAL_ADUAN,
          deletedAduanList: parsed.deletedAduanList || [],
          guruList: parsed.guruList || INITIAL_GURU,
          deletedGuruList: parsed.deletedGuruList || [],
          mapelList: parsed.mapelList || INITIAL_MAPEL,
          deletedMapelList: parsed.deletedMapelList || [],
          kelasList: parsed.kelasList || INITIAL_KELAS,
          deletedKelasList: parsed.deletedKelasList || [],
          siswaList: parsed.siswaList || INITIAL_SISWA,
          deletedSiswaList: parsed.deletedSiswaList || [],
          waliKelasList: parsed.waliKelasList || INITIAL_WALI_KELAS,
          deletedWaliKelasList: parsed.deletedWaliKelasList || [],
          lastUpdated: parsed.lastUpdated || new Date().toISOString()
        };
      }
    }
  } catch (err) {
    console.error("Error reading database file:", err);
  }
  // If DB file does not exist yet, seed initial database
  writeDatabase(INITIAL_DATABASE);
  return INITIAL_DATABASE;
}

function writeDatabase(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing database file:", err);
  }
}

// Active Server-Sent Events (SSE) Client Connections
const sseClients = new Set<express.Response>();

function broadcastDatabaseUpdate(action: string, payload?: any) {
  const currentDb = readDatabase();
  const eventPayload = JSON.stringify({
    type: "db_update",
    action,
    db: currentDb,
    timestamp: new Date().toISOString(),
    details: payload
  });

  for (const client of sseClients) {
    try {
      client.write(`data: ${eventPayload}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }

  // Also push to Google Apps Script Web App asynchronously
  const config = readConfig();
  if (config.webAppUrl) {
    const sheetsPayload = {
      action,
      spreadsheetId: config.spreadsheetId,
      driveFolderId: config.driveFolderId,
      timestamp: new Date().toLocaleString("id-ID"),
      aduanList: currentDb.aduanList || [],
      deletedAduanList: currentDb.deletedAduanList || [],
      guruList: currentDb.guruList || [],
      deletedGuruList: currentDb.deletedGuruList || [],
      mapelList: currentDb.mapelList || [],
      deletedMapelList: currentDb.deletedMapelList || [],
      kelasList: currentDb.kelasList || [],
      deletedKelasList: currentDb.deletedKelasList || [],
      siswaList: currentDb.siswaList || [],
      deletedSiswaList: currentDb.deletedSiswaList || [],
      waliKelasList: currentDb.waliKelasList || [],
      deletedWaliKelasList: currentDb.deletedWaliKelasList || []
    };
    syncToGoogleAppsScript(config.webAppUrl, sheetsPayload);
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
    console.log(`[Google Sheets Auto-Sync] Response status: ${res.status} for action "${payload.action}"`);
  } catch (err) {
    console.warn("[Google Sheets Auto-Sync] Error connecting to Web App:", err);
  }
}

async function startServer() {
  const app = express();

  // Ensure DB and Config are seeded on startup
  readDatabase();
  readConfig();

  // Increase payload limit for photos and full Excel imports
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      connectedClients: sseClients.size,
      timestamp: new Date().toISOString()
    });
  });

  // 1. Real-Time Server-Sent Events (SSE) Stream for 40+ concurrent devices
  app.get("/api/events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    sseClients.add(res);

    // Send initial snapshot
    const currentDb = readDatabase();
    res.write(
      `data: ${JSON.stringify({
        type: "init",
        connectedClients: sseClients.size,
        db: currentDb,
        config: readConfig(),
        timestamp: new Date().toISOString()
      })}\n\n`
    );

    // Keep connection alive with ping every 20 seconds
    const pingInterval = setInterval(() => {
      try {
        res.write(`: ping\n\n`);
      } catch {
        clearInterval(pingInterval);
        sseClients.delete(res);
      }
    }, 20000);

    req.on("close", () => {
      clearInterval(pingInterval);
      sseClients.delete(res);
    });
  });

  // 2. Get Database & Config (Used on initial load or manual refresh)
  app.get("/api/db", (_req, res) => {
    const db = readDatabase();
    const config = readConfig();
    res.json({
      success: true,
      hasData: Boolean(db),
      connectedClients: sseClients.size,
      db: db || INITIAL_DATABASE,
      config,
      timestamp: new Date().toISOString()
    });
  });

  // 3. Save / Merge Database (Called on upload Excel, edit, add, delete from any device)
  app.post("/api/db", (req, res) => {
    try {
      const { db, action = "sync_all" } = req.body;
      if (!db) {
        return res.status(400).json({ success: false, message: "No database payload provided" });
      }

      const currentDb = readDatabase() || INITIAL_DATABASE;
      const updatedDb = {
        aduanList: db.aduanList ?? currentDb.aduanList ?? [],
        deletedAduanList: db.deletedAduanList ?? currentDb.deletedAduanList ?? [],
        guruList: db.guruList ?? currentDb.guruList ?? [],
        deletedGuruList: db.deletedGuruList ?? currentDb.deletedGuruList ?? [],
        mapelList: db.mapelList ?? currentDb.mapelList ?? [],
        deletedMapelList: db.deletedMapelList ?? currentDb.deletedMapelList ?? [],
        kelasList: db.kelasList ?? currentDb.kelasList ?? [],
        deletedKelasList: db.deletedKelasList ?? currentDb.deletedKelasList ?? [],
        siswaList: db.siswaList ?? currentDb.siswaList ?? [],
        deletedSiswaList: db.deletedSiswaList ?? currentDb.deletedSiswaList ?? [],
        waliKelasList: db.waliKelasList ?? currentDb.waliKelasList ?? [],
        deletedWaliKelasList: db.deletedWaliKelasList ?? currentDb.deletedWaliKelasList ?? [],
        lastUpdated: new Date().toISOString()
      };

      writeDatabase(updatedDb);
      broadcastDatabaseUpdate(action, { source: "post_db" });

      res.json({
        success: true,
        message: "Database tersimpan dan disinkronkan secara instan ke seluruh perangkat & cloud.",
        lastUpdated: updatedDb.lastUpdated
      });
    } catch (err: any) {
      console.error("API /api/db error:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 4. Specific Endpoint: Add / Update Aduan
  app.post("/api/aduan", (req, res) => {
    try {
      const { aduan } = req.body;
      if (!aduan || !aduan.id) {
        return res.status(400).json({ success: false, message: "Invalid aduan payload" });
      }

      const db = readDatabase();
      const existingList = db.aduanList || [];
      const updatedList = [aduan, ...existingList.filter((a: any) => a.id !== aduan.id)];
      db.aduanList = updatedList;
      db.lastUpdated = new Date().toISOString();

      writeDatabase(db);
      broadcastDatabaseUpdate("tambah_aduan", { aduanId: aduan.id });

      res.json({ success: true, message: "Aduan berhasil disimpan dan disiarkan", aduan });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 5. Specific Endpoint: Update Tindak Lanjut Aduan
  app.patch("/api/aduan/:id/tindaklanjut", (req, res) => {
    try {
      const { id } = req.params;
      const { status, keterangan, olehWaliKelas, timestamp } = req.body;

      const db = readDatabase();
      const list = db.aduanList || [];
      const itemIndex = list.findIndex((a: any) => a.id === id);

      if (itemIndex === -1) {
        return res.status(404).json({ success: false, message: "Aduan tidak ditemukan" });
      }

      const target = list[itemIndex];
      const newHistoryItem = {
        status,
        timestamp: timestamp || new Date().toLocaleString("id-ID"),
        olehWaliKelas,
        keterangan
      };

      const updatedHistory = [...(target.tindakLanjutHistory || []), newHistoryItem];
      list[itemIndex] = {
        ...target,
        status,
        tindakLanjutHistory: updatedHistory
      };

      db.aduanList = list;
      db.lastUpdated = new Date().toISOString();
      writeDatabase(db);

      broadcastDatabaseUpdate("tindak_lanjut_aduan", { aduanId: id, status });

      res.json({ success: true, message: "Tindak lanjut aduan berhasil diperbarui", aduan: list[itemIndex] });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 6. Specific Endpoint: Update Siswa (Bulk / Import / Edit)
  app.post("/api/siswa", (req, res) => {
    try {
      const { siswaList, deletedSiswaList, action = "update_siswa" } = req.body;
      if (!Array.isArray(siswaList)) {
        return res.status(400).json({ success: false, message: "siswaList harus berupa array" });
      }

      const db = readDatabase();
      db.siswaList = siswaList;
      if (deletedSiswaList && Array.isArray(deletedSiswaList)) {
        db.deletedSiswaList = deletedSiswaList;
      }
      db.lastUpdated = new Date().toISOString();

      writeDatabase(db);
      broadcastDatabaseUpdate(action, { count: siswaList.length });

      res.json({
        success: true,
        message: `Data murid berhasil diperbarui (${siswaList.length} murid) dan disiarkan ke semua pengguna.`,
        lastUpdated: db.lastUpdated
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // 7. Get & Save Global Config (Spreadsheet ID, Drive Folder ID, Web App URL)
  app.get("/api/config", (_req, res) => {
    res.json({ success: true, config: readConfig() });
  });

  app.post("/api/config", (req, res) => {
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

  // 8. Test Google Apps Script Web App Connection
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

  // 9. Explicit Push All to Google Sheets
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

