import { getStoredSheetsToken } from '../services/googleSheets';

const memoryBlobCache = new Map<string, string>();
const DB_NAME = 'sawal_photo_db';
const STORE_NAME = 'photo_cache';

// Open IndexedDB for large image caching
function openDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Store photo (Base64 data URL or Blob) in IndexedDB and memory
 */
export async function cachePhoto(key: string, dataUrl: string): Promise<void> {
  if (!key || !dataUrl) return;
  memoryBlobCache.set(key, dataUrl);
  
  const driveId = extractGoogleDriveId(key);
  if (driveId) {
    memoryBlobCache.set(driveId, dataUrl);
  }

  try {
    const db = await openDB();
    if (!db) return;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(dataUrl, key);
    if (driveId) {
      store.put(dataUrl, driveId);
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Retrieve cached photo by URL or Google Drive ID
 */
export async function getCachedPhoto(key: string): Promise<string | null> {
  if (!key) return null;
  if (memoryBlobCache.has(key)) {
    return memoryBlobCache.get(key) || null;
  }

  const driveId = extractGoogleDriveId(key);
  if (driveId && memoryBlobCache.has(driveId)) {
    return memoryBlobCache.get(driveId) || null;
  }

  try {
    const db = await openDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        if (req.result) {
          memoryBlobCache.set(key, req.result);
          resolve(req.result);
        } else if (driveId) {
          const req2 = store.get(driveId);
          req2.onsuccess = () => {
            if (req2.result) {
              memoryBlobCache.set(driveId, req2.result);
              resolve(req2.result);
            } else {
              resolve(null);
            }
          };
          req2.onerror = () => resolve(null);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Extract Google Drive file ID from any URL or raw string
 */
export function extractGoogleDriveId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  if (trimmed.startsWith('data:image')) return null;

  // Pattern 1: /file/d/([a-zA-Z0-9_-]+)
  const matchFileD = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFileD && matchFileD[1]) return matchFileD[1];

  // Pattern 2: id=([a-zA-Z0-9_-]+)
  const matchIdParam = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchIdParam && matchIdParam[1]) return matchIdParam[1];

  // Pattern 3: /open?id=([a-zA-Z0-9_-]+)
  const matchOpenId = trimmed.match(/\/open\?id=([a-zA-Z0-9_-]+)/);
  if (matchOpenId && matchOpenId[1]) return matchOpenId[1];

  // Pattern 4: /d/([a-zA-Z0-9_-]+)
  const matchD = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (matchD && matchD[1]) return matchD[1];

  // Pattern 5: drive.google.com/thumbnail?id=([a-zA-Z0-9_-]+)
  const matchThumb = trimmed.match(/thumbnail\?id=([a-zA-Z0-9_-]+)/);
  if (matchThumb && matchThumb[1]) return matchThumb[1];

  // Pattern 6: If string is raw Drive File ID (25 to 50 chars of alphanumeric with - and _)
  if (/^[a-zA-Z0-9_-]{25,50}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Convert Google Drive ID to official embeddable iframe URL
 */
export function getDrivePreviewIframeUrl(driveId: string): string {
  return `https://drive.google.com/file/d/${driveId}/preview`;
}

/**
 * Convert Google Drive ID to official browser view link
 */
export function getDriveViewUrl(driveIdOrUrl: string): string {
  const driveId = extractGoogleDriveId(driveIdOrUrl);
  if (driveId) {
    return `https://drive.google.com/file/d/${driveId}/view?usp=sharing`;
  }
  return driveIdOrUrl;
}

/**
 * Cascade list of potential direct image candidates for Google Drive IDs
 */
export function getDriveDirectImageCandidates(driveId: string): string[] {
  return [
    `https://lh3.googleusercontent.com/d/${driveId}=w1600`,
    `https://drive.google.com/thumbnail?id=${driveId}&sz=w1600`,
    `https://lh3.google.com/u/0/d/${driveId}=w1600`,
    `https://drive.google.com/uc?export=view&id=${driveId}`,
    `https://docs.google.com/uc?id=${driveId}&export=download`
  ];
}

/**
 * Attempts to download the Google Drive photo using the active OAuth token
 * and convert to local Blob URL so it renders 100% reliably.
 */
export async function loadDriveImageWithAuth(driveId: string): Promise<string | null> {
  const token = getStoredSheetsToken();
  if (!token) return null;

  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${driveId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (res.ok) {
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      memoryBlobCache.set(driveId, blobUrl);
      return blobUrl;
    }
  } catch (err) {
    console.warn('Failed to load drive photo with auth token:', err);
  }
  return null;
}
