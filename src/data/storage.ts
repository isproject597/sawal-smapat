import { Guru, Mapel, Kelas, Siswa, AccountWaliKelas, Aduan } from '../types';
import {
  INITIAL_GURU,
  INITIAL_MAPEL,
  INITIAL_KELAS,
  INITIAL_SISWA,
  INITIAL_WALI_KELAS,
  INITIAL_ADUAN
} from './mockData';

const KEYS = {
  GURU: 'sawal_guru_list',
  MAPEL: 'sawal_mapel_list',
  KELAS: 'sawal_kelas_list',
  SISWA: 'sawal_siswa_list',
  WALI_KELAS: 'sawal_walikelas_list',
  ADUAN: 'sawal_aduan_list',
  DELETED_ADUAN: 'sawal_deleted_aduan_list',
  DELETED_GURU: 'sawal_deleted_guru_list',
  DELETED_MAPEL: 'sawal_deleted_mapel_list',
  DELETED_KELAS: 'sawal_deleted_kelas_list',
  DELETED_SISWA: 'sawal_deleted_siswa_list',
  DELETED_WALI_KELAS: 'sawal_deleted_walikelas_list'
};

export function getStoredGuru(): Guru[] {
  const data = localStorage.getItem(KEYS.GURU);
  if (!data) {
    localStorage.setItem(KEYS.GURU, JSON.stringify(INITIAL_GURU));
    return INITIAL_GURU;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_GURU;
  }
}

export function saveGuru(list: Guru[]) {
  localStorage.setItem(KEYS.GURU, JSON.stringify(list));
}

export function getStoredMapel(): Mapel[] {
  const data = localStorage.getItem(KEYS.MAPEL);
  if (!data) {
    localStorage.setItem(KEYS.MAPEL, JSON.stringify(INITIAL_MAPEL));
    return INITIAL_MAPEL;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_MAPEL;
  }
}

export function saveMapel(list: Mapel[]) {
  localStorage.setItem(KEYS.MAPEL, JSON.stringify(list));
}

export function getStoredKelas(): Kelas[] {
  const data = localStorage.getItem(KEYS.KELAS);
  if (!data) {
    localStorage.setItem(KEYS.KELAS, JSON.stringify(INITIAL_KELAS));
    return INITIAL_KELAS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_KELAS;
  }
}

export function saveKelas(list: Kelas[]) {
  localStorage.setItem(KEYS.KELAS, JSON.stringify(list));
}

export function getStoredSiswa(): Siswa[] {
  const data = localStorage.getItem(KEYS.SISWA);
  if (!data) {
    localStorage.setItem(KEYS.SISWA, JSON.stringify(INITIAL_SISWA));
    return INITIAL_SISWA;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_SISWA;
  }
}

export function saveSiswa(list: Siswa[]) {
  localStorage.setItem(KEYS.SISWA, JSON.stringify(list));
}

export function getStoredWaliKelas(): AccountWaliKelas[] {
  const data = localStorage.getItem(KEYS.WALI_KELAS);
  if (!data) {
    localStorage.setItem(KEYS.WALI_KELAS, JSON.stringify(INITIAL_WALI_KELAS));
    return INITIAL_WALI_KELAS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_WALI_KELAS;
  }
}

export function saveWaliKelas(list: AccountWaliKelas[]) {
  localStorage.setItem(KEYS.WALI_KELAS, JSON.stringify(list));
}

export function getStoredAduan(): Aduan[] {
  const data = localStorage.getItem(KEYS.ADUAN);
  if (!data) {
    localStorage.setItem(KEYS.ADUAN, JSON.stringify(INITIAL_ADUAN));
    return INITIAL_ADUAN;
  }
  try {
    const parsed: Aduan[] = JSON.parse(data);
    if (!Array.isArray(parsed)) return INITIAL_ADUAN;

    // Deduplicate by ID and ensure every item has a unique ID, backfill mock photos if missing
    const seenIds = new Set<string>();
    const sanitized: Aduan[] = [];

    parsed.forEach((item, index) => {
      let validId = item.id;
      if (!validId || seenIds.has(validId)) {
        validId = `${item.id || 'ADUAN'}-${Date.now()}-${index}-${Math.floor(Math.random() * 10000)}`;
        item.id = validId;
      }
      seenIds.add(validId);

      // Backfill photo from INITIAL_ADUAN if missing
      const matchingInit = INITIAL_ADUAN.find((init) => init.id === item.id);
      if (matchingInit && matchingInit.fotoBukti && (!item.fotoBukti || item.fotoBukti === '-')) {
        item.fotoBukti = matchingInit.fotoBukti;
        item.fotoBuktiList = matchingInit.fotoBuktiList;
      }

      sanitized.push(item);
    });

    // If duplicates were resolved, save sanitized version back
    if (sanitized.length !== parsed.length || JSON.stringify(sanitized) !== data) {
      localStorage.setItem(KEYS.ADUAN, JSON.stringify(sanitized));
    }

    return sanitized;
  } catch {
    return INITIAL_ADUAN;
  }
}

export function saveAduan(list: Aduan[]) {
  // Deduplicate before saving
  const seenIds = new Set<string>();
  const sanitized: Aduan[] = [];

  list.forEach((item, index) => {
    let validId = item.id;
    if (!validId || seenIds.has(validId)) {
      validId = `${item.id || 'ADUAN'}-${Date.now()}-${index}-${Math.floor(Math.random() * 10000)}`;
      item.id = validId;
    }
    seenIds.add(validId);
    sanitized.push(item);
  });

  localStorage.setItem(KEYS.ADUAN, JSON.stringify(sanitized));
}

export function addAduan(newAduan: Aduan): Aduan[] {
  const current = getStoredAduan();
  // Filter out any duplicate if same ID somehow exists
  const filtered = current.filter((item) => item.id !== newAduan.id);
  const updated = [newAduan, ...filtered];
  saveAduan(updated);
  return updated;
}

export function getStoredDeletedAduan(): Aduan[] {
  const data = localStorage.getItem(KEYS.DELETED_ADUAN);
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDeletedAduan(list: Aduan[]) {
  localStorage.setItem(KEYS.DELETED_ADUAN, JSON.stringify(list));
}

export function recordDeletedAduan(deletedItems: Aduan[]): Aduan[] {
  const currentDeleted = getStoredDeletedAduan();
  const deletedIds = new Set(deletedItems.map((d) => d.id));
  const filteredOld = currentDeleted.filter((d) => !deletedIds.has(d.id));
  const updated = [...deletedItems, ...filteredOld];
  saveDeletedAduan(updated);
  return updated;
}

// ---------------- GURU DELETED ----------------
export function getStoredDeletedGuru(): Guru[] {
  const data = localStorage.getItem(KEYS.DELETED_GURU);
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDeletedGuru(list: Guru[]) {
  localStorage.setItem(KEYS.DELETED_GURU, JSON.stringify(list));
}

export function recordDeletedGuru(deletedItems: Guru[]): Guru[] {
  const currentDeleted = getStoredDeletedGuru();
  const deletedIds = new Set(deletedItems.map((d) => d.id));
  const filteredOld = currentDeleted.filter((d) => !deletedIds.has(d.id));
  const updated = [...deletedItems, ...filteredOld];
  saveDeletedGuru(updated);
  return updated;
}

// ---------------- MAPEL DELETED ----------------
export function getStoredDeletedMapel(): Mapel[] {
  const data = localStorage.getItem(KEYS.DELETED_MAPEL);
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDeletedMapel(list: Mapel[]) {
  localStorage.setItem(KEYS.DELETED_MAPEL, JSON.stringify(list));
}

export function recordDeletedMapel(deletedItems: Mapel[]): Mapel[] {
  const currentDeleted = getStoredDeletedMapel();
  const deletedIds = new Set(deletedItems.map((d) => d.id));
  const filteredOld = currentDeleted.filter((d) => !deletedIds.has(d.id));
  const updated = [...deletedItems, ...filteredOld];
  saveDeletedMapel(updated);
  return updated;
}

// ---------------- KELAS DELETED ----------------
export function getStoredDeletedKelas(): Kelas[] {
  const data = localStorage.getItem(KEYS.DELETED_KELAS);
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDeletedKelas(list: Kelas[]) {
  localStorage.setItem(KEYS.DELETED_KELAS, JSON.stringify(list));
}

export function recordDeletedKelas(deletedItems: Kelas[]): Kelas[] {
  const currentDeleted = getStoredDeletedKelas();
  const deletedIds = new Set(deletedItems.map((d) => d.id));
  const filteredOld = currentDeleted.filter((d) => !deletedIds.has(d.id));
  const updated = [...deletedItems, ...filteredOld];
  saveDeletedKelas(updated);
  return updated;
}

// ---------------- SISWA DELETED ----------------
export function getStoredDeletedSiswa(): Siswa[] {
  const data = localStorage.getItem(KEYS.DELETED_SISWA);
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDeletedSiswa(list: Siswa[]) {
  localStorage.setItem(KEYS.DELETED_SISWA, JSON.stringify(list));
}

export function recordDeletedSiswa(deletedItems: Siswa[]): Siswa[] {
  const currentDeleted = getStoredDeletedSiswa();
  const deletedIds = new Set(deletedItems.map((d) => d.id));
  const filteredOld = currentDeleted.filter((d) => !deletedIds.has(d.id));
  const updated = [...deletedItems, ...filteredOld];
  saveDeletedSiswa(updated);
  return updated;
}

// ---------------- WALI KELAS DELETED ----------------
export function getStoredDeletedWaliKelas(): AccountWaliKelas[] {
  const data = localStorage.getItem(KEYS.DELETED_WALI_KELAS);
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDeletedWaliKelas(list: AccountWaliKelas[]) {
  localStorage.setItem(KEYS.DELETED_WALI_KELAS, JSON.stringify(list));
}

export function recordDeletedWaliKelas(deletedItems: AccountWaliKelas[]): AccountWaliKelas[] {
  const currentDeleted = getStoredDeletedWaliKelas();
  const deletedIds = new Set(deletedItems.map((d) => d.id));
  const filteredOld = currentDeleted.filter((d) => !deletedIds.has(d.id));
  const updated = [...deletedItems, ...filteredOld];
  saveDeletedWaliKelas(updated);
  return updated;
}

