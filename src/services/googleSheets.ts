import { Aduan, AccountWaliKelas, Siswa, Guru, Mapel, Kelas, StatusAduan } from '../types';
import {
  getStoredAduan,
  getStoredDeletedAduan,
  getStoredGuru,
  getStoredDeletedGuru,
  getStoredMapel,
  getStoredDeletedMapel,
  getStoredKelas,
  getStoredDeletedKelas,
  getStoredSiswa,
  getStoredDeletedSiswa,
  getStoredWaliKelas,
  getStoredDeletedWaliKelas
} from '../data/storage';

export const DEFAULT_SPREADSHEET_ID = '1Fo4g48xIbWmzGFfSeY8A_i0Tpwz8-8XONRCqEmP4X5E';
const SPREADSHEET_ID_KEY = 'sawal_google_spreadsheet_id';

export function getStoredSpreadsheetId(): string {
  const stored = localStorage.getItem(SPREADSHEET_ID_KEY);
  if (!stored || stored === '1BIG3fq1AEIh2U8d6Uq39zxABQcGUoE_YMTqtYwaYdkA') {
    localStorage.setItem(SPREADSHEET_ID_KEY, DEFAULT_SPREADSHEET_ID);
    return DEFAULT_SPREADSHEET_ID;
  }
  return stored;
}

export function saveSpreadsheetId(id: string): string {
  let cleanId = id.trim();
  const match = cleanId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    cleanId = match[1];
  }
  if (!cleanId) cleanId = DEFAULT_SPREADSHEET_ID;
  localStorage.setItem(SPREADSHEET_ID_KEY, cleanId);
  return cleanId;
}

export function getSpreadsheetUrl(): string {
  const id = getStoredSpreadsheetId();
  return `https://docs.google.com/spreadsheets/d/${id}/edit?usp=sharing`;
}

export const SPREADSHEET_ID = getStoredSpreadsheetId();
export const SPREADSHEET_URL = getSpreadsheetUrl();

export const DEFAULT_DRIVE_FOLDER_ID = '1mAl3vc_Eh35AfRE7Kt5Rv91GV21q0DxC';
const DRIVE_FOLDER_ID_KEY = 'sawal_google_drive_folder_id';

export function getStoredDriveFolderId(): string {
  const stored = localStorage.getItem(DRIVE_FOLDER_ID_KEY);
  if (!stored) {
    localStorage.setItem(DRIVE_FOLDER_ID_KEY, DEFAULT_DRIVE_FOLDER_ID);
    return DEFAULT_DRIVE_FOLDER_ID;
  }
  return stored;
}

export function saveDriveFolderId(id: string): string {
  let cleanId = id.trim();
  const match = cleanId.match(/\/folders\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    cleanId = match[1];
  }
  if (!cleanId) cleanId = DEFAULT_DRIVE_FOLDER_ID;
  localStorage.setItem(DRIVE_FOLDER_ID_KEY, cleanId);
  return cleanId;
}

export function getDriveFolderUrl(): string {
  const folderId = getStoredDriveFolderId();
  return `https://drive.google.com/drive/folders/${folderId}?usp=sharing`;
}

export const DRIVE_FOLDER_ID = getStoredDriveFolderId();
export const DRIVE_FOLDER_URL = getDriveFolderUrl();

const WEB_APP_URL_KEY = 'sawal_google_web_app_url';

export function getStoredWebAppUrl(): string {
  return localStorage.getItem(WEB_APP_URL_KEY) || '';
}

export function saveWebAppUrl(url: string): string {
  const cleanUrl = url.trim();
  localStorage.setItem(WEB_APP_URL_KEY, cleanUrl);
  return cleanUrl;
}

const TOKEN_KEY = 'sawal_google_sheets_token';
const EXPIRES_KEY = 'sawal_google_sheets_token_expires';

function dataURLtoBlob(dataurl: string): { blob: Blob; mime: string } {
  try {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return { blob: new Blob([u8arr], { type: mime }), mime };
  } catch {
    return { blob: new Blob([]), mime: 'image/jpeg' };
  }
}

/**
 * Upload image (base64 data URL) to Google Drive folder
 */
export async function uploadPhotoToGoogleDrive(
  base64Data: string,
  fileName: string,
  accessToken?: string
): Promise<string> {
  if (!base64Data) return '-';
  if (base64Data.startsWith('http://') || base64Data.startsWith('https://')) {
    return base64Data;
  }

  const token = accessToken || getStoredSheetsToken();
  if (!token) {
    // Preserve base64Data when not logged in with token
    return base64Data;
  }

  try {
    if (!base64Data.startsWith('data:image')) {
      return base64Data;
    }

    const { blob } = dataURLtoBlob(base64Data);
    if (blob.size === 0) return base64Data;

    const folderId = getStoredDriveFolderId();

    // Attempt 1: Upload into specific parent DRIVE_FOLDER_ID
    const metadataWithParent = {
      name: `${fileName}.jpg`,
      parents: [folderId]
    };

    const formDataWithParent = new FormData();
    formDataWithParent.append(
      'metadata',
      new Blob([JSON.stringify(metadataWithParent)], { type: 'application/json' })
    );
    formDataWithParent.append('file', blob);

    let res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formDataWithParent
    });

    // Attempt 2: If parent folder upload fails (403/404), upload directly to user's Drive root
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      if (res.status === 403 || errText.includes('insufficientPermissions') || errText.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT')) {
        console.warn('Google Drive API permission denied (insufficient scopes). Clearing stale token.');
        clearSheetsToken();
      } else {
        console.warn('Google Drive Upload with parent folder failed (status', res.status, errText, '), trying root drive...');
      }

      const metadataNoParent = { name: `${fileName}.jpg` };
      const formDataNoParent = new FormData();
      formDataNoParent.append(
        'metadata',
        new Blob([JSON.stringify(metadataNoParent)], { type: 'application/json' })
      );
      formDataNoParent.append('file', blob);

      res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formDataNoParent
      });
    }

    if (res.ok) {
      const data = await res.json();
      if (data.id) {
        // Grant reader permissions so anyone with the link can view
        fetch(`https://www.googleapis.com/drive/v3/files/${data.id}/permissions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ role: 'reader', type: 'anyone' })
        }).catch(() => {});

        return `https://drive.google.com/file/d/${data.id}/view`;
      }
    } else {
      const errText = await res.text().catch(() => '');
      if (res.status === 403 || errText.includes('insufficientPermissions') || errText.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT')) {
        console.warn('Google Drive API scope permission denied. Clearing token.');
        clearSheetsToken();
      } else {
        console.error('Google Drive Upload Failed:', res.status, errText);
      }
    }
  } catch (err) {
    console.warn('Gagal upload file ke Google Drive API:', err);
  }

  return base64Data;
}

/**
 * Upload multiple images to Google Drive and return array of links
 */
export async function uploadPhotosToGoogleDrive(
  photos: string[],
  aduanId: string,
  accessToken?: string
): Promise<string[]> {
  if (!photos || photos.length === 0) return [];
  const results: string[] = [];

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    if (!photo || photo === '-') continue;
    if (photo.startsWith('http://') || photo.startsWith('https://')) {
      results.push(photo);
      continue;
    }

    const fileName = `Aduan_${aduanId}_foto${i + 1}`;
    try {
      const uploaded = await uploadPhotoToGoogleDrive(photo, fileName, accessToken);
      if (uploaded && uploaded.startsWith('http')) {
        results.push(uploaded);
      } else {
        results.push(getDriveFolderUrl());
      }
    } catch {
      results.push(getDriveFolderUrl());
    }
  }

  return results;
}

export function getStoredSheetsToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const expires = localStorage.getItem(EXPIRES_KEY);
  if (!token || !expires) return null;
  if (Date.now() > parseInt(expires, 10)) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRES_KEY);
    return null;
  }
  return token;
}

export function saveSheetsToken(token: string, expiresInSeconds: number = 3600) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EXPIRES_KEY, (Date.now() + expiresInSeconds * 1000).toString());
}

export function clearSheetsToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRES_KEY);
}

const CLIENT_ID_KEY = 'sawal_google_client_id';
export const DEFAULT_CLIENT_ID = '111128116224-o716fpvpedjdlefk71o95p3hfiionbbp.apps.googleusercontent.com';

export function getStoredClientId(): string {
  const stored = localStorage.getItem(CLIENT_ID_KEY);
  if (!stored) {
    localStorage.setItem(CLIENT_ID_KEY, DEFAULT_CLIENT_ID);
    return DEFAULT_CLIENT_ID;
  }
  return stored;
}

export function saveClientId(clientId: string) {
  localStorage.setItem(CLIENT_ID_KEY, clientId.trim());
}

/**
 * Request Google OAuth token via Google Identity Services (GSI)
 */
export function requestGoogleOAuthToken(providedClientId?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Check if google accounts script is loaded
    if (typeof window === 'undefined' || !(window as any).google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services (GSI) SDK belum siap. Silakan muat ulang halaman.'));
      return;
    }

    const clientId = providedClientId || getStoredClientId();
    if (!clientId) {
      reject(new Error('Google OAuth Client ID belum diatur. Silakan masukkan Client ID dari Google Cloud Console.'));
      return;
    }

    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive',
        callback: (response: any) => {
          if (response.error) {
            reject(new Error(`OAuth Error: ${response.error}`));
            return;
          }
          if (response.access_token) {
            const expiresIn = response.expires_in ? parseInt(response.expires_in, 10) : 3600;
            saveSheetsToken(response.access_token, expiresIn);
            resolve(response.access_token);
          } else {
            reject(new Error('Gagal mendapatkan access token Google.'));
          }
        }
      });
      client.requestAccessToken({ prompt: 'consent' });
    } catch (err: any) {
      reject(err);
    }
  });
}

/**
 * Ensure sheets tabs exist (Aduan, Data_WaliKelas, Data_Murid, Data_Guru, Data_Mapel, Data_Kelas)
 */
async function ensureSheetTabsExist(token: string) {
  const sheetId = getStoredSpreadsheetId();
  try {
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    if (!metaRes.ok) return;

    const meta = await metaRes.json();
    const existingTitles: string[] = meta.sheets?.map((s: any) => s.properties?.title) || [];

    const requiredTabs = ['Aduan', 'Data_WaliKelas', 'Data_Murid', 'Data_Guru', 'Data_Mapel', 'Data_Kelas'];
    const missingTabs = requiredTabs.filter((t) => !existingTitles.includes(t));

    if (missingTabs.length > 0) {
      const requests = missingTabs.map((title) => ({
        addSheet: {
          properties: { title }
        }
      }));

      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ requests })
        }
      );
    }
  } catch (err) {
    console.warn('Tab verification warning:', err);
  }
}

/**
 * Automatically format sheet with colors:
 * - Reset Data Rows (Row 1 to 500): White background #FFFFFF, dark slate text, normal weight
 * - Header (Row 0): Dark Teal #0F766E, White bold text, centered
 * - Active Rows:
 *     - Edited Rows (isEdited = true): Soft Yellow #FEF9C3 background, Dark Amber #854D0E bold text
 *     - Normal Rows: White background #FFFFFF, dark slate text
 * - Deleted Rows: Soft Red #FEE2E2 background, Dark Red #991B1B bold text
 */
async function formatSheetRowsWithDeletions(
  token: string,
  sheetId: string,
  tabTitle: string,
  colCount: number,
  activeItemsOrCount: any[] | number,
  deletedRowCount: number
) {
  try {
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!metaRes.ok) return;
    const meta = await metaRes.json();
    const sheetObj = meta.sheets?.find((s: any) => s.properties?.title === tabTitle);
    if (!sheetObj) return;
    const sheetNumericId = sheetObj.properties.sheetId;

    const requests: any[] = [];

    // 0. Reset all data rows (Row 1 to 500) to clean white & normal text first
    requests.push({
      repeatCell: {
        range: {
          sheetId: sheetNumericId,
          startRowIndex: 1,
          endRowIndex: 500,
          startColumnIndex: 0,
          endColumnIndex: colCount
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
            textFormat: {
              foregroundColor: { red: 0.12, green: 0.16, blue: 0.22 },
              bold: false
            }
          }
        },
        fields: 'userEnteredFormat.backgroundColor,userEnteredFormat.textFormat'
      }
    });

    // 1. Header Row (Row 0): Dark Teal #0F766E, White Bold Text, Centered
    requests.push({
      repeatCell: {
        range: {
          sheetId: sheetNumericId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: colCount
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.06, green: 0.46, blue: 0.43 }, // #0F766E Dark Teal
            textFormat: {
              foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
              bold: true,
              fontSize: 10
            },
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE'
          }
        },
        fields: 'userEnteredFormat.backgroundColor,userEnteredFormat.textFormat,userEnteredFormat.horizontalAlignment,userEnteredFormat.verticalAlignment'
      }
    });

    const activeCount = Array.isArray(activeItemsOrCount) ? activeItemsOrCount.length : activeItemsOrCount;

    // 2. Active Rows styling (Apply Soft Yellow to edited rows)
    if (Array.isArray(activeItemsOrCount)) {
      activeItemsOrCount.forEach((item, index) => {
        const rowIndex = 1 + index;
        const isEdited = !!(item && (item.isEdited || item.status === 'DIEDIT'));
        if (isEdited) {
          requests.push({
            repeatCell: {
              range: {
                sheetId: sheetNumericId,
                startRowIndex: rowIndex,
                endRowIndex: rowIndex + 1,
                startColumnIndex: 0,
                endColumnIndex: colCount
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.996, green: 0.976, blue: 0.765 }, // #FEF9C3 Soft Yellow
                  textFormat: {
                    foregroundColor: { red: 0.52, green: 0.30, blue: 0.05 }, // #854D0E Amber Dark
                    bold: true
                  }
                }
              },
              fields: 'userEnteredFormat.backgroundColor,userEnteredFormat.textFormat'
            }
          });
        }
      });
    }

    // 3. Deleted Rows (Row 1 + activeCount to 1 + activeCount + deletedRowCount): Soft Red #FEE2E2 & Dark Red #991B1B bold text
    if (deletedRowCount > 0) {
      requests.push({
        repeatCell: {
          range: {
            sheetId: sheetNumericId,
            startRowIndex: 1 + activeCount,
            endRowIndex: 1 + activeCount + deletedRowCount,
            startColumnIndex: 0,
            endColumnIndex: colCount
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.996, green: 0.886, blue: 0.886 }, // #FEE2E2 Soft Red
              textFormat: {
                foregroundColor: { red: 0.60, green: 0.11, blue: 0.11 }, // #991B1B Dark Red
                bold: true
              }
            }
          },
          fields: 'userEnteredFormat.backgroundColor,userEnteredFormat.textFormat'
        }
      });
    }

    if (requests.length > 0) {
      const resp = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ requests })
        }
      );
      if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        console.warn(`Formatting ${tabTitle} batchUpdate warning (${resp.status}):`, errText);
      }
    }
  } catch (err) {
    console.warn(`Formatting ${tabTitle} sheet error:`, err);
  }
}

function cleanCellString(val: any): string {
  if (val === null || val === undefined) return '-';
  const str = String(val);
  if (str.startsWith('data:image')) {
    return getDriveFolderUrl();
  }
  if (str.length > 10000) {
    return str.substring(0, 10000) + '... (data dipotong karena batas sel Google Sheets)';
  }
  return str;
}

/**
 * Automatically format Aduan sheet with colors:
 * - Header (Row 0): Dark Teal #0F766E, White Bold Text
 * - 'Dalam Proses' Rows: Soft Yellow #FEF9C3 background, Dark Amber #854D0E text
 * - 'Sudah Ditindak Lanjuti' Rows: Soft Green #DCFCE7 background, Dark Green #166534 text
 * - 'Belum Ditindak Lanjuti' / default Rows: White background #FFFFFF, dark slate text
 * - Deleted Rows: Soft Red #FEE2E2 background, Dark Red #991B1B bold text
 */
async function formatAduanSheetRows(
  token: string,
  sheetId: string,
  activeItems: Aduan[],
  deletedRowCount: number
) {
  try {
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!metaRes.ok) return;
    const meta = await metaRes.json();
    const aduanSheet = meta.sheets?.find((s: any) => s.properties?.title === 'Aduan');
    if (!aduanSheet) return;
    const aduanSheetNumericId = aduanSheet.properties.sheetId;

    const requests: any[] = [];

    // 0. Reset all data rows (Row 1 to 1000) to clean white & normal text first
    requests.push({
      repeatCell: {
        range: {
          sheetId: aduanSheetNumericId,
          startRowIndex: 1,
          endRowIndex: 1000,
          startColumnIndex: 0,
          endColumnIndex: 11
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
            textFormat: {
              foregroundColor: { red: 0.12, green: 0.16, blue: 0.22 },
              bold: false
            }
          }
        },
        fields: 'userEnteredFormat.backgroundColor,userEnteredFormat.textFormat'
      }
    });

    // 1. Header Row (Row 0): Dark Teal #0F766E, White Bold Text
    requests.push({
      repeatCell: {
        range: {
          sheetId: aduanSheetNumericId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 11
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.06, green: 0.46, blue: 0.43 },
            textFormat: {
              foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
              bold: true,
              fontSize: 10
            },
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE'
          }
        },
        fields: 'userEnteredFormat.backgroundColor,userEnteredFormat.textFormat,userEnteredFormat.horizontalAlignment,userEnteredFormat.verticalAlignment'
      }
    });

    // 2. Active Rows (Row 1 to 1 + activeItems.length) styled according to individual status
    activeItems.forEach((item, index) => {
      const rowIndex = 1 + index;
      let bgColor = { red: 1.0, green: 1.0, blue: 1.0 }; // Default white
      let fgColor = { red: 0.12, green: 0.16, blue: 0.22 }; // Default dark slate
      let isBold = false;

      if (item.status === 'Dalam Proses') {
        // Kuning Soft #FEF9C3, Teks Amber Gelap #854D0E
        bgColor = { red: 0.996, green: 0.976, blue: 0.765 };
        fgColor = { red: 0.52, green: 0.30, blue: 0.05 };
        isBold = true;
      } else if (item.status === 'Sudah Ditindak Lanjuti') {
        // Hijau Soft #DCFCE7, Teks Hijau Tua #166534
        bgColor = { red: 0.863, green: 0.988, blue: 0.906 };
        fgColor = { red: 0.09, green: 0.39, blue: 0.20 };
        isBold = true;
      } else if (item.isEdited) {
        // Diedit: Kuning Soft #FEF9C3, Teks Dark Amber #854D0E
        bgColor = { red: 0.996, green: 0.976, blue: 0.765 };
        fgColor = { red: 0.52, green: 0.30, blue: 0.05 };
        isBold = true;
      }

      if (item.status === 'Dalam Proses' || item.status === 'Sudah Ditindak Lanjuti' || item.isEdited) {
        requests.push({
          repeatCell: {
            range: {
              sheetId: aduanSheetNumericId,
              startRowIndex: rowIndex,
              endRowIndex: rowIndex + 1,
              startColumnIndex: 0,
              endColumnIndex: 11
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: bgColor,
                textFormat: {
                  foregroundColor: fgColor,
                  bold: isBold
                }
              }
            },
            fields: 'userEnteredFormat.backgroundColor,userEnteredFormat.textFormat'
          }
        });
      }
    });

    // 3. Deleted Rows (Row 1 + activeItems.length to 1 + activeItems.length + deletedRowCount):
    // TERBLOK MERAH: Soft Red background #FEE2E2 with dark red bold text #991B1B
    if (deletedRowCount > 0) {
      requests.push({
        repeatCell: {
          range: {
            sheetId: aduanSheetNumericId,
            startRowIndex: 1 + activeItems.length,
            endRowIndex: 1 + activeItems.length + deletedRowCount,
            startColumnIndex: 0,
            endColumnIndex: 11
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.996, green: 0.886, blue: 0.886 }, // #FEE2E2 Soft Red
              textFormat: {
                foregroundColor: { red: 0.60, green: 0.11, blue: 0.11 }, // #991B1B Dark Red
                bold: true
              }
            }
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat)'
        }
      });
    }

    if (requests.length > 0) {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ requests })
        }
      );
    }
  } catch (err) {
    console.warn('Formatting Aduan sheet error:', err);
  }
}

/**
 * Sync entire Aduan list to 'Aduan' sheet, including deleted history blocked in red
 */
export async function syncAduanToGoogleSheet(
  aduanList: Aduan[],
  accessToken?: string,
  customDeletedList?: Aduan[]
): Promise<{ success: boolean; message: string }> {
  const token = accessToken || getStoredSheetsToken();
  if (!token) {
    return { success: false, message: 'Belum terhubung ke Google Sheets. Silakan hubungkan akun Google.' };
  }

  await ensureSheetTabsExist(token);
  const sheetId = getStoredSpreadsheetId();

  const headers = [
    'ID Aduan',
    'Tanggal & Waktu Aduan',
    'Nama Guru Pelapor',
    'Mata Pelajaran',
    'Kelas',
    'Murid Melanggar',
    'Jenis Kesalahan',
    'Bukti Foto / Link Drive',
    'Catatan / Kronologi',
    'Status Terbaru',
    'Riwayat Tindak Lanjut'
  ];

  // Active items (excluding any flagged as deleted)
  const activeItems = aduanList.filter((a) => !a.isDeleted);
  // Deleted history items
  const deletedItems = customDeletedList || getStoredDeletedAduan() || [];

  // 1. Process Active Rows
  const activeRows = await Promise.all(
    activeItems.map(async (a) => {
      const historyStr = a.tindakLanjutHistory
        ? a.tindakLanjutHistory
            .map((h) => `[${h.timestamp}] (${h.status}) - ${h.olehWaliKelas}: ${h.keterangan}`)
            .join('\n')
        : '-';

      // Collect all photos from fotoBuktiList or fotoBukti
      let photosToProcess: string[] = [];
      if (a.fotoBuktiList && a.fotoBuktiList.length > 0) {
        photosToProcess = a.fotoBuktiList;
      } else if (a.fotoBukti && a.fotoBukti !== '-') {
        photosToProcess = a.fotoBukti.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
      }

      let fotoLink = '-';
      if (photosToProcess.length > 0) {
        try {
          const uploadedUrls = await uploadPhotosToGoogleDrive(photosToProcess, a.id, token);
          if (uploadedUrls.length > 0) {
            fotoLink = uploadedUrls.join('\n');
            a.fotoBukti = fotoLink;
            a.fotoBuktiList = uploadedUrls;
          } else {
            fotoLink = getDriveFolderUrl();
          }
        } catch {
          fotoLink = getDriveFolderUrl();
        }
      }

      return [
        a.id,
        a.timestampAduan,
        a.namaGuru,
        a.mapel,
        a.kelas,
        a.siswaList.join(', '),
        a.jenisKesalahan + (a.keteranganLainnya ? ` (${a.keteranganLainnya})` : ''),
        fotoLink,
        a.catatanKronologi || '-',
        a.status,
        historyStr
      ].map(cleanCellString);
    })
  );

  // 2. Process Deleted Rows (Marked as DIHAPUS with deletion timestamp in history)
  const deletedRows = deletedItems.map((d) => {
    const delTimestamp = d.deletedAt || new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' }) + ' WIB';
    const delBy = d.deletedBy || 'Admin';

    let historyStr = d.tindakLanjutHistory
      ? d.tindakLanjutHistory
          .map((h) => `[${h.timestamp}] (${h.status}) - ${h.olehWaliKelas}: ${h.keterangan}`)
          .join('\n')
      : '';

    const deletionLog = `[${delTimestamp}] (DIHAPUS) - Dihapus oleh ${delBy} dari Web Rekap Aduan`;
    const fullHistory = historyStr ? `${deletionLog}\n${historyStr}` : deletionLog;

    let fotoLink = '-';
    if (d.fotoBuktiList && d.fotoBuktiList.length > 0) {
      fotoLink = d.fotoBuktiList.filter(p => p && p.startsWith('http')).join('\n') || '-';
    } else if (d.fotoBukti && d.fotoBukti !== '-') {
      fotoLink = d.fotoBukti.split(/\r?\n/).filter(p => p.startsWith('http')).join('\n') || '-';
    }

    return [
      d.id,
      d.timestampAduan,
      d.namaGuru,
      d.mapel,
      d.kelas,
      d.siswaList ? d.siswaList.join(', ') : '-',
      d.jenisKesalahan + (d.keteranganLainnya ? ` (${d.keteranganLainnya})` : ''),
      fotoLink,
      d.catatanKronologi || '-',
      'DIHAPUS',
      fullHistory
    ].map(cleanCellString);
  });

  const values = [headers, ...activeRows, ...deletedRows];

  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Aduan!A1:Z2000?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      }
    );

    if (!res.ok) {
      if (res.status === 403) {
        throw new Error(`Akses Ditolak (HTTP 403): Akun Google yang terhubung tidak memiliki hak Edit ke Spreadsheet ID (${sheetId}). Silakan pastikan Spreadsheet dibuka akses Edit-nya atau gunakan ID milik Anda.`);
      }
      if (res.status === 404) {
        throw new Error(`Spreadsheet Tidak Ditemukan (HTTP 404): Periksa kembali Spreadsheet ID (${sheetId}) di Pengaturan.`);
      }
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Gagal memperbarui sheet Aduan (${res.status})`);
    }

    // Apply color highlights: Deleted rows blocked in Soft Red, 'Dalam Proses' in Soft Yellow, 'Sudah Ditindak Lanjuti' in Soft Green, Header in Dark Teal
    await formatAduanSheetRows(token, sheetId, activeItems, deletedRows.length);

    return {
      success: true,
      message: `Berhasil sinkron ${activeRows.length} Aduan aktif dan ${deletedRows.length} histori aduan terhapus (terblok merah) ke Google Sheets.`
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal sinkron data Aduan.' };
  }
}

/**
 * Update Aduan Status and Follow-up History directly to Google Sheets with color styling (Yellow for 'Dalam Proses', Green for 'Sudah Ditindak Lanjuti')
 */
export async function updateAduanStatusInGoogleSheets(
  aduanId: string,
  newStatus: StatusAduan,
  keterangan: string,
  olehWaliKelas: string,
  timestampStr: string,
  fullUpdatedList: Aduan[],
  accessToken?: string
): Promise<{ success: boolean; message: string }> {
  // 1. Post to Web App URL (instant, non-blocking)
  const webAppUrl = getStoredWebAppUrl();
  if (webAppUrl) {
    try {
      fetch(webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'update_status',
          id: aduanId,
          newStatus,
          keterangan,
          olehWaliKelas,
          timestamp: timestampStr,
          spreadsheetId: getStoredSpreadsheetId()
        })
      }).catch((err) => console.warn('Web App update_status error:', err));
    } catch (e) {
      console.warn('Web App post error:', e);
    }
  }

  // 2. Also trigger background auto-sync for full table and direct OAuth formatting
  triggerBackgroundAutoSync('aduan', { aduanList: fullUpdatedList });

  const token = accessToken || getStoredSheetsToken();
  if (token) {
    try {
      await syncAduanToGoogleSheet(fullUpdatedList, token);
    } catch (e) {
      console.warn('OAuth sync on status update error:', e);
    }
  }

  return {
    success: true,
    message: `Status aduan diperbarui menjadi "${newStatus}" & otomatis tersinkron ke Google Sheets dengan tanda warna.`
  };
}

/**
 * Notify deletion of Aduan to Google Sheets instantly (Web App + Direct Google Sheets API)
 */
export async function notifyDeleteAduanToGoogleSheets(
  deletedAduanList: Aduan[],
  activeAduanList: Aduan[],
  accessToken?: string
): Promise<{ success: boolean; message: string }> {
  let webAppSuccess = false;
  let oAuthSuccess = false;

  // 1. If Web App URL is configured, send deletion event immediately (instant without token required)
  const webAppUrl = getStoredWebAppUrl();
  if (webAppUrl && deletedAduanList.length > 0) {
    try {
      const itemsPayload = deletedAduanList.map((item) => ({
        id: item.id,
        deletedAt: item.deletedAt || new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' }) + ' WIB',
        deletedBy: item.deletedBy || 'Admin'
      }));

      // Send payload with text/plain to ensure standard CORS bypass in Google Apps Script
      await fetch(webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'delete_multiple',
          items: itemsPayload,
          spreadsheetId: getStoredSpreadsheetId()
        })
      });
      webAppSuccess = true;
    } catch (e) {
      console.warn('POST penghapusan ke Apps Script Web App gagal:', e);
    }
  }

  // 2. If OAuth Token is active, run full sync with red block formatting immediately
  const token = accessToken || getStoredSheetsToken();
  if (token) {
    try {
      const syncRes = await syncAduanToGoogleSheet(activeAduanList, token);
      oAuthSuccess = syncRes.success;
    } catch (e) {
      console.warn('OAuth sync aduan error:', e);
    }
  }

  if (webAppSuccess || oAuthSuccess) {
    return {
      success: true,
      message: `Data aduan otomatis diperbarui di Google Sheets (Terblok Merah & Tercatat Timestamp).`
    };
  }

  return {
    success: true,
    message: `Data aduan dihapus di sistem lokal.`
  };
}

/**
 * Sync entire Wali Kelas list to 'Data_WaliKelas' sheet including deleted history
 */
export async function syncWaliKelasToGoogleSheet(
  waliKelasList: AccountWaliKelas[],
  accessToken?: string,
  customDeletedList?: AccountWaliKelas[]
): Promise<{ success: boolean; message: string }> {
  const token = accessToken || getStoredSheetsToken();
  if (!token) {
    return { success: false, message: 'Belum terhubung ke Google Sheets.' };
  }

  await ensureSheetTabsExist(token);
  const sheetId = getStoredSpreadsheetId();

  const headers = ['ID', 'Nama Lengkap Wali Kelas', 'Kelas Binaan', 'Username Login', 'Status', 'Riwayat & Keterangan Perubahan'];

  const activeItems = waliKelasList.filter((wk) => !wk.isDeleted);
  const deletedItems = customDeletedList || getStoredDeletedWaliKelas() || [];

  const activeRows = activeItems.map((wk) => {
    const status = wk.isEdited ? 'DIEDIT' : 'AKTIF';
    const history = wk.editHistory
      ? wk.editHistory
      : (wk.isEdited ? `[${wk.editedAt || ''}] DIEDIT oleh ${wk.editedBy || 'Admin'}` : '-');
    return [
      wk.id,
      wk.nama,
      wk.kelasAssigned,
      wk.username,
      status,
      history
    ].map(cleanCellString);
  });

  const deletedRows = deletedItems.map((d) => {
    const history = d.deletedAt
      ? `[${d.deletedAt}] (DIHAPUS) - Dihapus oleh ${d.deletedBy || 'Admin'}${d.editHistory ? '\n' + d.editHistory : ''}`
      : 'DIHAPUS';
    return [
      d.id,
      d.nama,
      d.kelasAssigned,
      d.username,
      'DIHAPUS',
      history
    ].map(cleanCellString);
  });

  const values = [headers, ...activeRows, ...deletedRows];

  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Data_WaliKelas!A1:Z500?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      }
    );

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Gagal memperbarui sheet Data_WaliKelas (${res.status})`);
    }

    await formatSheetRowsWithDeletions(token, sheetId, 'Data_WaliKelas', 6, activeItems, deletedRows.length);

    return {
      success: true,
      message: `Berhasil sinkron ${activeRows.length} Wali Kelas aktif & ${deletedRows.length} histori terhapus ke sheet Data_WaliKelas.`
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal sinkron data Wali Kelas.' };
  }
}

/**
 * Sync entire Murid list to 'Data_Murid' sheet including deleted history
 */
export async function syncMuridToGoogleSheet(
  muridList: Siswa[],
  accessToken?: string,
  customDeletedList?: Siswa[]
): Promise<{ success: boolean; message: string }> {
  const token = accessToken || getStoredSheetsToken();
  if (!token) {
    return { success: false, message: 'Belum terhubung ke Google Sheets.' };
  }

  await ensureSheetTabsExist(token);
  const sheetId = getStoredSpreadsheetId();

  const headers = ['ID', 'NIS', 'Nama Lengkap Murid', 'Kelas', 'Status', 'Riwayat & Keterangan Perubahan'];

  const activeItems = muridList.filter((m) => !m.isDeleted);
  const deletedItems = customDeletedList || getStoredDeletedSiswa() || [];

  const activeRows = activeItems.map((m) => {
    const status = m.isEdited ? 'DIEDIT' : 'AKTIF';
    const history = m.editHistory
      ? m.editHistory
      : (m.isEdited ? `[${m.editedAt || ''}] DIEDIT oleh ${m.editedBy || 'Admin'}` : '-');
    return [
      m.id,
      m.nis || '-',
      m.nama,
      m.kelas,
      status,
      history
    ].map(cleanCellString);
  });

  const deletedRows = deletedItems.map((d) => {
    const history = d.deletedAt
      ? `[${d.deletedAt}] (DIHAPUS) - Dihapus oleh ${d.deletedBy || 'Admin'}${d.editHistory ? '\n' + d.editHistory : ''}`
      : 'DIHAPUS';
    return [
      d.id,
      d.nis || '-',
      d.nama,
      d.kelas,
      'DIHAPUS',
      history
    ].map(cleanCellString);
  });

  const values = [headers, ...activeRows, ...deletedRows];

  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Data_Murid!A1:Z2000?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      }
    );

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Gagal memperbarui sheet Data_Murid (${res.status})`);
    }

    await formatSheetRowsWithDeletions(token, sheetId, 'Data_Murid', 6, activeItems, deletedRows.length);

    return {
      success: true,
      message: `Berhasil sinkron ${activeRows.length} data Murid aktif & ${deletedRows.length} histori terhapus ke sheet Data_Murid.`
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal sinkron data Murid.' };
  }
}

/**
 * Sync entire Guru list to 'Data_Guru' sheet including deleted history
 */
export async function syncGuruToGoogleSheet(
  guruList: Guru[],
  accessToken?: string,
  customDeletedList?: Guru[]
): Promise<{ success: boolean; message: string }> {
  const token = accessToken || getStoredSheetsToken();
  if (!token) {
    return { success: false, message: 'Belum terhubung ke Google Sheets.' };
  }

  await ensureSheetTabsExist(token);
  const sheetId = getStoredSpreadsheetId();

  const headers = ['ID', 'Nama Lengkap Guru', 'NIP', 'Mata Pelajaran Utama', 'Status', 'Riwayat & Keterangan Perubahan'];

  const activeItems = guruList.filter((g) => !g.isDeleted);
  const deletedItems = customDeletedList || getStoredDeletedGuru() || [];

  const activeRows = activeItems.map((g) => {
    const status = g.isEdited ? 'DIEDIT' : 'AKTIF';
    const history = g.editHistory
      ? g.editHistory
      : (g.isEdited ? `[${g.editedAt || ''}] DIEDIT oleh ${g.editedBy || 'Admin'}` : '-');
    return [
      g.id,
      g.nama,
      g.nip || '-',
      g.mapelUtama || '-',
      status,
      history
    ].map(cleanCellString);
  });

  const deletedRows = deletedItems.map((d) => {
    const history = d.deletedAt
      ? `[${d.deletedAt}] (DIHAPUS) - Dihapus oleh ${d.deletedBy || 'Admin'}${d.editHistory ? '\n' + d.editHistory : ''}`
      : 'DIHAPUS';
    return [
      d.id,
      d.nama,
      d.nip || '-',
      d.mapelUtama || '-',
      'DIHAPUS',
      history
    ].map(cleanCellString);
  });

  const values = [headers, ...activeRows, ...deletedRows];

  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Data_Guru!A1:Z500?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      }
    );

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Gagal memperbarui sheet Data_Guru (${res.status})`);
    }

    await formatSheetRowsWithDeletions(token, sheetId, 'Data_Guru', 6, activeItems, deletedRows.length);

    return {
      success: true,
      message: `Berhasil sinkron ${activeRows.length} data Guru aktif & ${deletedRows.length} histori terhapus ke sheet Data_Guru.`
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal sinkron data Guru.' };
  }
}

/**
 * Sync entire Mapel list to 'Data_Mapel' sheet including deleted history
 */
export async function syncMapelToGoogleSheet(
  mapelList: Mapel[],
  accessToken?: string,
  customDeletedList?: Mapel[]
): Promise<{ success: boolean; message: string }> {
  const token = accessToken || getStoredSheetsToken();
  if (!token) {
    return { success: false, message: 'Belum terhubung ke Google Sheets.' };
  }

  await ensureSheetTabsExist(token);
  const sheetId = getStoredSpreadsheetId();

  const headers = ['ID', 'Nama Mata Pelajaran', 'Kode Mapel', 'Status', 'Riwayat & Keterangan Perubahan'];

  const activeItems = mapelList.filter((m) => !m.isDeleted);
  const deletedItems = customDeletedList || getStoredDeletedMapel() || [];

  const activeRows = activeItems.map((m) => {
    const status = m.isEdited ? 'DIEDIT' : 'AKTIF';
    const history = m.editHistory
      ? m.editHistory
      : (m.isEdited ? `[${m.editedAt || ''}] DIEDIT oleh ${m.editedBy || 'Admin'}` : '-');
    return [
      m.id,
      m.nama,
      m.kode || '-',
      status,
      history
    ].map(cleanCellString);
  });

  const deletedRows = deletedItems.map((d) => {
    const history = d.deletedAt
      ? `[${d.deletedAt}] (DIHAPUS) - Dihapus oleh ${d.deletedBy || 'Admin'}${d.editHistory ? '\n' + d.editHistory : ''}`
      : 'DIHAPUS';
    return [
      d.id,
      d.nama,
      d.kode || '-',
      'DIHAPUS',
      history
    ].map(cleanCellString);
  });

  const values = [headers, ...activeRows, ...deletedRows];

  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Data_Mapel!A1:Z500?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      }
    );

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Gagal memperbarui sheet Data_Mapel (${res.status})`);
    }

    await formatSheetRowsWithDeletions(token, sheetId, 'Data_Mapel', 5, activeItems, deletedRows.length);

    return {
      success: true,
      message: `Berhasil sinkron ${activeRows.length} data Mapel aktif & ${deletedRows.length} histori terhapus ke sheet Data_Mapel.`
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal sinkron data Mapel.' };
  }
}

/**
 * Sync entire Kelas list to 'Data_Kelas' sheet including deleted history
 */
export async function syncKelasToGoogleSheet(
  kelasList: Kelas[],
  accessToken?: string,
  customDeletedList?: Kelas[]
): Promise<{ success: boolean; message: string }> {
  const token = accessToken || getStoredSheetsToken();
  if (!token) {
    return { success: false, message: 'Belum terhubung ke Google Sheets.' };
  }

  await ensureSheetTabsExist(token);
  const sheetId = getStoredSpreadsheetId();

  const headers = ['ID', 'Nama Kelas / Rombel', 'Status', 'Riwayat & Keterangan Perubahan'];

  const activeItems = kelasList.filter((k) => !k.isDeleted);
  const deletedItems = customDeletedList || getStoredDeletedKelas() || [];

  const activeRows = activeItems.map((k) => {
    const status = k.isEdited ? 'DIEDIT' : 'AKTIF';
    const history = k.editHistory
      ? k.editHistory
      : (k.isEdited ? `[${k.editedAt || ''}] DIEDIT oleh ${k.editedBy || 'Admin'}` : '-');
    return [
      k.id,
      k.nama,
      status,
      history
    ].map(cleanCellString);
  });

  const deletedRows = deletedItems.map((d) => {
    const history = d.deletedAt
      ? `[${d.deletedAt}] (DIHAPUS) - Dihapus oleh ${d.deletedBy || 'Admin'}${d.editHistory ? '\n' + d.editHistory : ''}`
      : 'DIHAPUS';
    return [
      d.id,
      d.nama,
      'DIHAPUS',
      history
    ].map(cleanCellString);
  });

  const values = [headers, ...activeRows, ...deletedRows];

  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Data_Kelas!A1:Z500?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      }
    );

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Gagal memperbarui sheet Data_Kelas (${res.status})`);
    }

    await formatSheetRowsWithDeletions(token, sheetId, 'Data_Kelas', 4, activeItems, deletedRows.length);

    return {
      success: true,
      message: `Berhasil sinkron ${activeRows.length} data Kelas aktif & ${deletedRows.length} histori terhapus ke sheet Data_Kelas.`
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal sinkron data Kelas.' };
  }
}

/**
 * Perform complete sync for all master & transaction sheets:
 * Aduan, Data_WaliKelas, Data_Murid, Data_Guru, Data_Mapel, and Data_Kelas
 */
export async function syncAllToGoogleSheets(
  aduanList: Aduan[],
  waliKelasList: AccountWaliKelas[],
  muridList: Siswa[],
  guruList?: Guru[],
  mapelList?: Mapel[],
  kelasList?: Kelas[],
  accessToken?: string
): Promise<{ success: boolean; message: string; details?: string[] }> {
  const token = accessToken || getStoredSheetsToken();
  if (!token) {
    return { success: false, message: 'Belum terhubung ke Google Sheets.' };
  }

  const effectiveGuru = guruList || getStoredGuru();
  const effectiveMapel = mapelList || getStoredMapel();
  const effectiveKelas = kelasList || getStoredKelas();

  const resAduan = await syncAduanToGoogleSheet(aduanList, token);
  const resWK = await syncWaliKelasToGoogleSheet(waliKelasList, token);
  const resMurid = await syncMuridToGoogleSheet(muridList, token);
  const resGuru = await syncGuruToGoogleSheet(effectiveGuru, token);
  const resMapel = await syncMapelToGoogleSheet(effectiveMapel, token);
  const resKelas = await syncKelasToGoogleSheet(effectiveKelas, token);

  const details = [
    resAduan.message,
    resWK.message,
    resMurid.message,
    resGuru.message,
    resMapel.message,
    resKelas.message
  ];
  const allSuccess =
    resAduan.success &&
    resWK.success &&
    resMurid.success &&
    resGuru.success &&
    resMapel.success &&
    resKelas.success;

  return {
    success: allSuccess,
    message: allSuccess
      ? 'Semua data (Aduan, Data_WaliKelas, Data_Murid, Data_Guru, Data_Mapel, Data_Kelas) berhasil disinkronkan ke Google Sheets!'
      : 'Beberapa sheet gagal diperbarui.',
    details
  };
}

/**
 * Append single new Aduan row to 'Aduan' sheet
 */
export async function appendSingleAduanToSheet(
  aduan: Aduan,
  accessToken?: string
): Promise<{ success: boolean; message: string }> {
  // 1. Try sending to Google Apps Script Web App URL first (if configured, works automatically without user login)
  const webAppUrl = getStoredWebAppUrl();
  const photosList = aduan.fotoBuktiList && aduan.fotoBuktiList.length > 0
    ? aduan.fotoBuktiList
    : (aduan.fotoBukti && aduan.fotoBukti !== '-' ? aduan.fotoBukti.split(/\r?\n/).map(s => s.trim()).filter(Boolean) : []);

  if (webAppUrl) {
    try {
      const payload = {
        id: aduan.id,
        timestampAduan: aduan.timestampAduan,
        namaGuru: aduan.namaGuru,
        mapel: aduan.mapel,
        kelas: aduan.kelas,
        siswaList: aduan.siswaList,
        jenisKesalahan: aduan.jenisKesalahan,
        keteranganLainnya: aduan.keteranganLainnya || '',
        fotoBukti: photosList.join('\n') || '',
        fotoBuktiList: photosList,
        catatanKronologi: aduan.catatanKronologi || '-',
        status: aduan.status || 'Belum Ditindak Lanjuti',
        spreadsheetId: getStoredSpreadsheetId(),
        driveFolderId: getStoredDriveFolderId()
      };

      await fetch(webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      return {
        success: true,
        message: 'Aduan berhasil dikirim & otomatis ter-rekap ke Google Sheets / Drive via Web App!'
      };
    } catch (e) {
      console.warn('POST ke Apps Script Web App gagal, mencoba OAuth Token API...', e);
    }
  }

  // 2. Fallback to Direct Google OAuth Token API
  const token = accessToken || getStoredSheetsToken();
  if (!token) {
    return {
      success: false,
      message: 'Aduan tersimpan di sistem lokal. Hubungkan Google Sheets / Apps Script Web App di menu Admin untuk sinkronisasi otomatis.'
    };
  }

  await ensureSheetTabsExist(token);
  const sheetId = getStoredSpreadsheetId();

  let fotoLink = '-';
  if (photosList.length > 0) {
    try {
      const uploadedUrls = await uploadPhotosToGoogleDrive(photosList, aduan.id, token);
      if (uploadedUrls.length > 0) {
        fotoLink = uploadedUrls.join('\n');
        aduan.fotoBukti = fotoLink;
        aduan.fotoBuktiList = uploadedUrls;
      } else {
        fotoLink = getDriveFolderUrl();
      }
    } catch {
      fotoLink = getDriveFolderUrl();
    }
  }

  const row = [
    aduan.id,
    aduan.timestampAduan,
    aduan.namaGuru,
    aduan.mapel,
    aduan.kelas,
    aduan.siswaList.join(', '),
    aduan.jenisKesalahan + (aduan.keteranganLainnya ? ` (${aduan.keteranganLainnya})` : ''),
    fotoLink,
    aduan.catatanKronologi || '-',
    aduan.status,
    '-'
  ].map(cleanCellString);

  try {
    let res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Aduan!A:K:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: [row] })
      }
    );

    if (!res.ok && res.status === 400) {
      console.warn('Append to tab Aduan failed (HTTP 400), trying default range A:K...');
      res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:K:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ values: [row] })
        }
      );
    }

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        clearSheetsToken();
      }
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error?.message || `Google Sheets append failed (${res.status})`);
    }

    return { success: true, message: 'Aduan berhasil dikirim & otomatis masuk ke Google Sheets!' };
  } catch (err: any) {
    console.error('appendSingleAduanToSheet error:', err);
    return { success: false, message: err.message || 'Gagal append aduan ke Google Sheets.' };
  }
}

const LAST_AUTOSYNC_KEY = 'sawal_last_autosync_time';

export function getStoredLastAutoSync(): string | null {
  return localStorage.getItem(LAST_AUTOSYNC_KEY);
}

export function saveStoredLastAutoSync(timestamp: string) {
  localStorage.setItem(LAST_AUTOSYNC_KEY, timestamp);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('sawal_autosync_event', {
        detail: { timestamp, status: 'synced' }
      })
    );
  }
}

/**
 * Trigger background automatic synchronization for changes (add, delete, restore, edit, import)
 * Works silently via Google Apps Script Web App and/or Google Sheets OAuth API.
 */
export async function triggerBackgroundAutoSync(
  category: 'all' | 'aduan' | 'guru' | 'mapel' | 'kelas' | 'murid' | 'walikelas' = 'all',
  customData?: {
    aduanList?: Aduan[];
    deletedAduanList?: Aduan[];
    guruList?: Guru[];
    deletedGuruList?: Guru[];
    mapelList?: Mapel[];
    deletedMapelList?: Mapel[];
    kelasList?: Kelas[];
    deletedKelasList?: Kelas[];
    siswaList?: Siswa[];
    deletedSiswaList?: Siswa[];
    waliKelasList?: AccountWaliKelas[];
    deletedWaliKelasList?: AccountWaliKelas[];
  }
): Promise<{ success: boolean; message: string }> {
  const token = getStoredSheetsToken();
  const webAppUrl = getStoredWebAppUrl();
  const spreadsheetId = getStoredSpreadsheetId();

  // If neither Web App URL nor Token is configured, we keep data safely local
  if (!token && !webAppUrl) {
    return {
      success: false,
      message: 'Perubahan tersimpan lokal. Masukkan Web App URL atau Token untuk auto-sinkron ke Google Sheets.'
    };
  }

  const now = new Date();
  const formattedTime =
    now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) +
    ', ' +
    now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
    ' WIB';

  // 1. Try sending via Apps Script Web App in background (non-blocking, works for all users)
  if (webAppUrl) {
    try {
      const payload: any = {
        action: 'sync_all',
        spreadsheetId,
        driveFolderId: getStoredDriveFolderId(),
        timestamp: formattedTime,
        category,
        aduanList: customData?.aduanList || getStoredAduan(),
        deletedAduanList: customData?.deletedAduanList || getStoredDeletedAduan(),
        guruList: customData?.guruList || getStoredGuru(),
        deletedGuruList: customData?.deletedGuruList || getStoredDeletedGuru(),
        mapelList: customData?.mapelList || getStoredMapel(),
        deletedMapelList: customData?.deletedMapelList || getStoredDeletedMapel(),
        kelasList: customData?.kelasList || getStoredKelas(),
        deletedKelasList: customData?.deletedKelasList || getStoredDeletedKelas(),
        siswaList: customData?.siswaList || getStoredSiswa(),
        deletedSiswaList: customData?.deletedSiswaList || getStoredDeletedSiswa(),
        waliKelasList: customData?.waliKelasList || getStoredWaliKelas(),
        deletedWaliKelasList: customData?.deletedWaliKelasList || getStoredDeletedWaliKelas()
      };

      fetch(webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      }).catch((err) => console.warn('Background Web App auto-sync warning:', err));
    } catch (e) {
      console.warn('Apps Script background auto-sync error:', e);
    }
  }

  // 2. If OAuth Token is active, run direct Google Sheets API sync
  if (token) {
    try {
      if (category === 'all') {
        const ad = customData?.aduanList || getStoredAduan();
        const wk = customData?.waliKelasList || getStoredWaliKelas();
        const mr = customData?.siswaList || getStoredSiswa();
        const gr = customData?.guruList || getStoredGuru();
        const mp = customData?.mapelList || getStoredMapel();
        const kl = customData?.kelasList || getStoredKelas();
        await syncAllToGoogleSheets(ad, wk, mr, gr, mp, kl, token);
      } else if (category === 'aduan') {
        await syncAduanToGoogleSheet(customData?.aduanList || getStoredAduan(), token, customData?.deletedAduanList);
      } else if (category === 'guru') {
        await syncGuruToGoogleSheet(customData?.guruList || getStoredGuru(), token, customData?.deletedGuruList);
      } else if (category === 'mapel') {
        await syncMapelToGoogleSheet(customData?.mapelList || getStoredMapel(), token, customData?.deletedMapelList);
      } else if (category === 'kelas') {
        await syncKelasToGoogleSheet(customData?.kelasList || getStoredKelas(), token, customData?.deletedKelasList);
      } else if (category === 'murid') {
        await syncMuridToGoogleSheet(customData?.siswaList || getStoredSiswa(), token, customData?.deletedSiswaList);
      } else if (category === 'walikelas') {
        await syncWaliKelasToGoogleSheet(customData?.waliKelasList || getStoredWaliKelas(), token, customData?.deletedWaliKelasList);
      }
    } catch (err) {
      console.warn('OAuth direct auto-sync error:', err);
    }
  }

  saveStoredLastAutoSync(formattedTime);
  return { success: true, message: `Otomatis tersinkron (${formattedTime})` };
}

/**
 * Export data to CSV file download
 */
export function exportDataToCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escapeCsv = (str: any) => {
    if (str === null || str === undefined) return '""';
    const cellStr = String(str).replace(/"/g, '""');
    return `"${cellStr}"`;
  };

  const csvContent = [
    headers.map(escapeCsv).join(','),
    ...rows.map((row) => row.map(escapeCsv).join(','))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
