import { Aduan, AccountWaliKelas, Siswa, Guru, Mapel, Kelas, StatusAduan } from '../types';

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
  connectedClients?: number;
  db: Partial<FullDatabasePayload> & { lastUpdated?: string };
  config: ServerConfig;
  timestamp: string;
}

export interface RealTimeEventPayload {
  type: 'init' | 'db_update' | 'ping';
  action?: string;
  connectedClients?: number;
  db?: Partial<FullDatabasePayload> & { lastUpdated?: string };
  config?: ServerConfig;
  timestamp?: string;
  details?: any;
}

/**
 * Real-time SSE Connection Manager for 40+ concurrent devices
 */
export function subscribeToRealTimeEvents(
  onUpdate: (payload: RealTimeEventPayload) => void,
  onStatusChange?: (connected: boolean, clientCount?: number) => void
): () => void {
  let eventSource: EventSource | null = null;
  let isClosed = false;
  let retryTimeout: any = null;

  const connect = () => {
    if (isClosed) return;

    try {
      eventSource = new EventSource('/api/events');

      eventSource.onopen = () => {
        if (onStatusChange) onStatusChange(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const data: RealTimeEventPayload = JSON.parse(event.data);
          if (data && data.db) {
            onUpdate(data);
          }
          if (data && data.connectedClients !== undefined && onStatusChange) {
            onStatusChange(true, data.connectedClients);
          }
        } catch (err) {
          console.warn('[SSE Parse Notice]', err);
        }
      };

      eventSource.onerror = () => {
        if (onStatusChange) onStatusChange(false);
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        // Auto-reconnect after 3 seconds
        if (!isClosed) {
          retryTimeout = setTimeout(connect, 3000);
        }
      };
    } catch (err) {
      if (onStatusChange) onStatusChange(false);
      if (!isClosed) {
        retryTimeout = setTimeout(connect, 4000);
      }
    }
  };

  connect();

  return () => {
    isClosed = true;
    if (retryTimeout) clearTimeout(retryTimeout);
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
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
 * Direct API to update/import students on server
 */
export async function saveSiswaToServer(
  siswaList: Siswa[],
  deletedSiswaList?: Siswa[],
  action: string = 'update_siswa'
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/siswa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siswaList, deletedSiswaList, action })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    console.warn('Failed to save siswa to server:', err);
  }
  return { success: false, message: 'Gagal menyimpan data murid ke server' };
}

/**
 * Direct API to save new aduan on server
 */
export async function saveAduanToServer(
  aduan: Aduan
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/aduan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aduan })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    console.warn('Failed to save aduan to server:', err);
  }
  return { success: false, message: 'Gagal menyimpan aduan ke server' };
}

/**
 * Direct API to update tindak lanjut aduan on server
 */
export async function updateAduanStatusToServer(
  id: string,
  status: StatusAduan,
  keterangan: string,
  olehWaliKelas: string,
  timestamp?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`/api/aduan/${id}/tindaklanjut`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, keterangan, olehWaliKelas, timestamp })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err: any) {
    console.warn('Failed to update aduan status on server:', err);
  }
  return { success: false, message: 'Gagal memperbarui status di server' };
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
