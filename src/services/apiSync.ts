import { Aduan, AccountWaliKelas, Siswa, Guru, Mapel, Kelas } from '../types';

export interface FullDatabasePayload {
  aduanList: Aduan[];
  deletedAduanList: Aduan[];
  guruList: Guru[];
  deletedGuruList: Guru[];
  mapelList: Mapel[];
  deletedMapelList: Mapel[];
  kelasList: Kelas[];
  deletedKelasList: Kelas[];
  siswaList: Siswa[];
  deletedSiswaList: Siswa[];
  waliKelasList: AccountWaliKelas[];
  deletedWaliKelasList: AccountWaliKelas[];
}

export interface ServerConfig {
  spreadsheetId: string;
  driveFolderId: string;
  webAppUrl: string;
}

export interface ServerDbResponse {
  success: boolean;
  hasData: boolean;
  db: Partial<FullDatabasePayload> & { lastUpdated?: string };
  config: ServerConfig;
  timestamp: string;
}

/**
 * Fetch centralized database and configuration from server
 */
export async function fetchServerDatabase(): Promise<ServerDbResponse | null> {
  try {
    const res = await fetch('/api/db', { method: 'GET' });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Could not fetch server database:', err);
  }
  return null;
}

/**
 * Save centralized database to server (broadcasted to all devices & Google Sheets)
 */
export async function syncDatabaseToServer(
  data: FullDatabasePayload,
  action: string = 'sync_all'
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ db: data, action })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    console.warn('Failed to sync database to server:', err);
    return { success: false, message: err.message || 'Gagal terhubung ke server' };
  }
  return { success: false, message: 'Gagal menyimpan ke server' };
}

/**
 * Save global configuration (Spreadsheet ID, Drive Folder ID, Web App URL)
 */
export async function saveServerConfig(
  config: Partial<ServerConfig>
): Promise<{ success: boolean; message: string; config?: ServerConfig }> {
  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal menyimpan konfigurasi' };
  }
  return { success: false, message: 'Gagal memperbarui konfigurasi server' };
}

/**
 * Test Google Apps Script Web App connection from server
 */
export async function testServerGoogleSheetsConnection(
  url?: string
): Promise<{ success: boolean; status?: number; message: string; details?: any }> {
  try {
    const res = await fetch('/api/test-sheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal menguji koneksi' };
  }
  return { success: false, message: 'Gagal memanggil endpoint test-sheets' };
}

/**
 * Push all database directly to Google Sheets now
 */
export async function forcePushToGoogleSheets(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/push-sheets', { method: 'POST' });
    if (res.ok) {
      return await res.json();
    }
    const errJson = await res.json();
    return { success: false, message: errJson.message || 'Gagal push ke Google Sheets' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Koneksi error' };
  }
}
