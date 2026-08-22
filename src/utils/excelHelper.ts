import * as XLSX from 'xlsx';
import { Guru, Mapel, Kelas, Siswa, AccountWaliKelas } from '../types';

export type ExcelImportType = 'guru' | 'mapel' | 'kelas' | 'siswa' | 'walikelas';

export interface TemplateInfo {
  title: string;
  filename: string;
  columns: string[];
  sampleRows: Record<string, string>[];
  notes: string[];
}

export const TEMPLATE_CONFIG: Record<ExcelImportType, TemplateInfo> = {
  guru: {
    title: 'Template Data Guru',
    filename: 'Template_Data_Guru.xlsx',
    columns: ['Nama Guru', 'NIP', 'Mapel Utama'],
    sampleRows: [
      { 'Nama Guru': 'Drs. H. Ahmad Dahlan, M.Pd.', 'NIP': '197501012000031001', 'Mapel Utama': 'Pendidikan Agama Islam' },
      { 'Nama Guru': 'Siti Rahmawati, S.Pd.', 'NIP': '198205122008012005', 'Mapel Utama': 'Matematika' },
      { 'Nama Guru': 'Budi Santoso, S.Pd.', 'NIP': '198810202014021003', 'Mapel Utama': 'Bahasa Indonesia' },
      { 'Nama Guru': 'Dewi Sartika, S.Si.', 'NIP': '199003152019032010', 'Mapel Utama': 'Biologi' }
    ],
    notes: [
      'Kolom "Nama Guru" wajib diisi beserta gelar.',
      'Kolom "NIP" dan "Mapel Utama" bersifat opsional.',
      'Pastikan baris pertama adalah judul kolom persis sesuai template.'
    ]
  },
  mapel: {
    title: 'Template Mata Pelajaran',
    filename: 'Template_Mata_Pelajaran.xlsx',
    columns: ['Nama Mata Pelajaran'],
    sampleRows: [
      { 'Nama Mata Pelajaran': 'Pendidikan Agama & Budi Pekerti' },
      { 'Nama Mata Pelajaran': 'Pendidikan Pancasila' },
      { 'Nama Mata Pelajaran': 'Bahasa Indonesia' },
      { 'Nama Mata Pelajaran': 'Matematika' },
      { 'Nama Mata Pelajaran': 'Bahasa Inggris' },
      { 'Nama Mata Pelajaran': 'Fisika' },
      { 'Nama Mata Pelajaran': 'Kimia' },
      { 'Nama Mata Pelajaran': 'Biologi' },
      { 'Nama Mata Pelajaran': 'Ekonomi' },
      { 'Nama Mata Pelajaran': 'Sosiologi' },
      { 'Nama Mata Pelajaran': 'Geografi' },
      { 'Nama Mata Pelajaran': 'Seni Budaya' },
      { 'Nama Mata Pelajaran': 'PJOK' },
      { 'Nama Mata Pelajaran': 'Informatika' },
      { 'Nama Mata Pelajaran': 'Bimbingan Konseling (BK)' }
    ],
    notes: [
      'Kolom "Nama Mata Pelajaran" wajib diisi.',
      'Dapat mengunggah seluruh daftar mapel kurikulum merdeka sekaligus.'
    ]
  },
  kelas: {
    title: 'Template Data Kelas',
    filename: 'Template_Data_Kelas.xlsx',
    columns: ['Nama Kelas'],
    sampleRows: [
      { 'Nama Kelas': 'X-1' },
      { 'Nama Kelas': 'X-2' },
      { 'Nama Kelas': 'X-3' },
      { 'Nama Kelas': 'XI MIPA 1' },
      { 'Nama Kelas': 'XI MIPA 2' },
      { 'Nama Kelas': 'XI IPS 1' },
      { 'Nama Kelas': 'XI IPS 2' },
      { 'Nama Kelas': 'XII MIPA 1' },
      { 'Nama Kelas': 'XII MIPA 2' },
      { 'Nama Kelas': 'XII IPS 1' }
    ],
    notes: [
      'Kolom "Nama Kelas" wajib diisi.',
      'Gunakan format penamaan standar kelas di sekolah.'
    ]
  },
  siswa: {
    title: 'Template Data Murid',
    filename: 'Template_Data_Murid.xlsx',
    columns: ['Nama Siswa', 'NIS', 'Kelas'],
    sampleRows: [
      { 'Nama Siswa': 'Ahmad Fauzi', 'NIS': '20261001', 'Kelas': 'X-1' },
      { 'Nama Siswa': 'Aulia Putri Lestari', 'NIS': '20261002', 'Kelas': 'X-1' },
      { 'Nama Siswa': 'Bagas Pratama', 'NIS': '20261003', 'Kelas': 'XI MIPA 1' },
      { 'Nama Siswa': 'Cantika Dewi', 'NIS': '20261004', 'Kelas': 'XI MIPA 1' },
      { 'Nama Siswa': 'Dimas Anggara', 'NIS': '20261005', 'Kelas': 'XII IPS 1' }
    ],
    notes: [
      'Semua kolom ("Nama Siswa", "NIS", "Kelas") wajib diisi.',
      'Pastikan penulisan "Kelas" sesuai dengan daftar kelas yang ada di sistem.'
    ]
  },
  walikelas: {
    title: 'Template Akun Wali Kelas',
    filename: 'Template_Akun_Wali_Kelas.xlsx',
    columns: ['Nama Wali Kelas', 'Kelas Tugas', 'Username', 'Password'],
    sampleRows: [
      { 'Nama Wali Kelas': 'Siti Rahmawati, S.Pd.', 'Kelas Tugas': 'X-1', 'Username': 'walix1', 'Password': 'password123' },
      { 'Nama Wali Kelas': 'Budi Santoso, S.Pd.', 'Kelas Tugas': 'X-2', 'Username': 'walix2', 'Password': 'password123' },
      { 'Nama Wali Kelas': 'Drs. H. Ahmad Dahlan, M.Pd.', 'Kelas Tugas': 'XI MIPA 1', 'Username': 'walixi_mipa1', 'Password': 'password123' },
      { 'Nama Wali Kelas': 'Dewi Sartika, S.Si.', 'Kelas Tugas': 'XII IPS 1', 'Username': 'walixii_ips1', 'Password': 'password123' }
    ],
    notes: [
      'Semua kolom wajib diisi.',
      'Username harus unik untuk setiap akun wali kelas.',
      'Password default dapat diganti oleh wali kelas setelah login.'
    ]
  }
};

/**
 * Downloads a ready-to-use .xlsx template file with sample rows
 */
export function downloadExcelTemplate(type: ExcelImportType) {
  const config = TEMPLATE_CONFIG[type];
  const worksheet = XLSX.utils.json_to_sheet(config.sampleRows);
  
  // Set column widths
  const maxCols = config.columns.length;
  worksheet['!cols'] = Array(maxCols).fill({ wch: 28 });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  XLSX.writeFile(workbook, config.filename);
}

/**
 * Downloads an Excel template specifically configured for a specific class (for Wali Kelas)
 */
export function downloadTemplateMuridKelas(kelasName: string) {
  const sampleRows = [
    { 'Nama Siswa': 'Ahmad Fauzi', 'NIS': '20261001', 'Kelas': kelasName },
    { 'Nama Siswa': 'Aulia Putri Lestari', 'NIS': '20261002', 'Kelas': kelasName },
    { 'Nama Siswa': 'Bagas Pratama', 'NIS': '20261003', 'Kelas': kelasName },
    { 'Nama Siswa': 'Cantika Dewi', 'NIS': '20261004', 'Kelas': kelasName }
  ];
  const worksheet = XLSX.utils.json_to_sheet(sampleRows);
  worksheet['!cols'] = [{ wch: 32 }, { wch: 20 }, { wch: 20 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data_Murid');
  const safeName = kelasName.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(workbook, `Template_Data_Murid_Kelas_${safeName}.xlsx`);
}

export interface SkippedDuplicateItem {
  rowNum: number;
  name: string;
  detail: string;
  reason: string;
}

export interface ParseExcelResult<T = any> {
  success: boolean;
  data: T[]; // Only the NEW (non-duplicate) items to import
  rawParsed: T[]; // All parsed valid items from the file
  skippedDuplicates: SkippedDuplicateItem[];
  errors: string[];
  rawRowCount: number;
  totalValidInFile: number;
  newCount: number;
  duplicateCount: number;
}

/**
 * Normalizes text for clean string comparison (lowercase, trimmed, collapsed whitespace)
 */
export function normalizeText(str: string): string {
  return String(str || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Normalizes key for column matching
 */
function normalizeKey(key: string): string {
  return String(key || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Checks if a parsed item is a duplicate of existing data or already seen in current batch
 */
function checkIsDuplicate(
  item: any,
  type: ExcelImportType,
  existingList: any[],
  seenSet: Set<string>
): { isDuplicate: boolean; reason?: string } {
  if (type === 'guru') {
    const guru = item as Guru;
    const nameKey = normalizeText(guru.nama);
    const nipKey = normalizeText(guru.nip || '');
    const mapelKey = normalizeText(guru.mapelUtama || '');

    // Internal batch duplicate check
    const batchKey = `${nameKey}|${nipKey}|${mapelKey}`;
    if (seenSet.has(batchKey)) {
      return { isDuplicate: true, reason: 'Duplikat (data berulang di dalam file Excel yang sama)' };
    }

    // Check against existing guru list in database
    const existingMatch = existingList.find((ex: Guru) => {
      const exName = normalizeText(ex.nama);
      const exNip = normalizeText(ex.nip || '');
      const exMapel = normalizeText(ex.mapelUtama || '');

      // Exact match on all fields
      if (exName === nameKey && exNip === nipKey && exMapel === mapelKey) {
        return true;
      }

      // If NIP is provided and identical, check if same teacher
      if (nipKey && exNip && nipKey === exNip) {
        return true;
      }

      // If exact same name and same mapel (or both have no NIP)
      if (exName === nameKey && (!nipKey || !exNip || nipKey === exNip) && exMapel === mapelKey) {
        return true;
      }

      return false;
    });

    if (existingMatch) {
      return {
        isDuplicate: true,
        reason: `Guru "${guru.nama}" sudah terdaftar di sistem dengan data yang sama.`
      };
    }

    seenSet.add(batchKey);
    return { isDuplicate: false };
  }

  if (type === 'mapel') {
    const mapel = item as Mapel;
    const nameKey = normalizeText(mapel.nama);

    if (seenSet.has(nameKey)) {
      return { isDuplicate: true, reason: 'Duplikat (nama mapel berulang di dalam file Excel)' };
    }

    const existingMatch = existingList.find((ex: Mapel) => normalizeText(ex.nama) === nameKey);
    if (existingMatch) {
      return {
        isDuplicate: true,
        reason: `Mata Pelajaran "${mapel.nama}" sudah ada di sistem.`
      };
    }

    seenSet.add(nameKey);
    return { isDuplicate: false };
  }

  if (type === 'kelas') {
    const kelas = item as Kelas;
    // Normalize kelas name removing spaces & dashes for robust matching (e.g., 'X-1' == 'X 1' == 'X - 1')
    const nameKey = normalizeText(kelas.nama).replace(/[^a-z0-9]/g, '');

    if (seenSet.has(nameKey)) {
      return { isDuplicate: true, reason: 'Duplikat (nama kelas berulang di dalam file Excel)' };
    }

    const existingMatch = existingList.find((ex: Kelas) => {
      const exNameKey = normalizeText(ex.nama).replace(/[^a-z0-9]/g, '');
      return exNameKey === nameKey;
    });

    if (existingMatch) {
      return {
        isDuplicate: true,
        reason: `Kelas "${kelas.nama}" sudah ada di sistem.`
      };
    }

    seenSet.add(nameKey);
    return { isDuplicate: false };
  }

  if (type === 'siswa') {
    const siswa = item as Siswa;
    const nisKey = normalizeText(siswa.nis);
    const nameKey = normalizeText(siswa.nama);
    const kelasKey = normalizeText(siswa.kelas);

    const batchKey = nisKey && !nisKey.startsWith('nis-') ? `nis_${nisKey}` : `name_${nameKey}_${kelasKey}`;
    if (seenSet.has(batchKey)) {
      return { isDuplicate: true, reason: 'Duplikat (data murid berulang di dalam file Excel)' };
    }

    const existingMatch = existingList.find((ex: Siswa) => {
      const exNis = normalizeText(ex.nis);
      const exName = normalizeText(ex.nama);
      const exKelas = normalizeText(ex.kelas);

      if (nisKey && exNis && !nisKey.startsWith('nis-') && nisKey === exNis) {
        return true;
      }
      return exName === nameKey && exKelas === kelasKey;
    });

    if (existingMatch) {
      return {
        isDuplicate: true,
        reason: `Murid "${siswa.nama}" (${siswa.kelas}, NIS: ${siswa.nis}) sudah terdaftar.`
      };
    }

    seenSet.add(batchKey);
    return { isDuplicate: false };
  }

  if (type === 'walikelas') {
    const wk = item as AccountWaliKelas;
    const userKey = normalizeText(wk.username);
    const nameKey = normalizeText(wk.nama);
    const kelasKey = normalizeText(wk.kelasAssigned);

    const batchKey = `${userKey}|${nameKey}|${kelasKey}`;
    if (seenSet.has(batchKey) || seenSet.has(userKey)) {
      return { isDuplicate: true, reason: 'Duplikat (username atau wali kelas berulang di file)' };
    }

    const existingMatch = existingList.find((ex: AccountWaliKelas) => {
      const exUser = normalizeText(ex.username);
      const exName = normalizeText(ex.nama);
      const exKelas = normalizeText(ex.kelasAssigned);

      return exUser === userKey || (exName === nameKey && exKelas === kelasKey);
    });

    if (existingMatch) {
      return {
        isDuplicate: true,
        reason: `Akun Wali Kelas "${wk.nama}" (${wk.kelasAssigned}, username: ${wk.username}) sudah terdaftar di sistem.`
      };
    }

    seenSet.add(batchKey);
    seenSet.add(userKey);
    return { isDuplicate: false };
  }

  return { isDuplicate: false };
}

/**
 * Parse an uploaded Excel/CSV file ArrayBuffer with smart duplicate detection
 */
export async function parseExcelFile(
  file: File,
  type: ExcelImportType,
  existingList: any[] = [],
  fallbackKelas?: string
): Promise<ParseExcelResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return {
        success: false,
        data: [],
        rawParsed: [],
        skippedDuplicates: [],
        errors: ['File Excel tidak memiliki lembar kerja (worksheet).'],
        rawRowCount: 0,
        totalValidInFile: 0,
        newCount: 0,
        duplicateCount: 0
      };
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (!rawRows || rawRows.length === 0) {
      return {
        success: false,
        data: [],
        rawParsed: [],
        skippedDuplicates: [],
        errors: ['Lembar kerja Excel kosong atau tidak memiliki baris data.'],
        rawRowCount: 0,
        totalValidInFile: 0,
        newCount: 0,
        duplicateCount: 0
      };
    }

    const rawParsed: any[] = [];
    const newItems: any[] = [];
    const skippedDuplicates: SkippedDuplicateItem[] = [];
    const errors: string[] = [];
    const seenSet = new Set<string>();
    const now = Date.now();

    rawRows.forEach((row, idx) => {
      const rowNum = idx + 2; // Row index in Excel (1-based + 1 for header)
      const normalizedRow: Record<string, string> = {};

      Object.keys(row).forEach((k) => {
        const normK = normalizeKey(k);
        normalizedRow[normK] = String(row[k] || '').trim();
      });

      if (type === 'guru') {
        const nama =
          normalizedRow['namaguru'] ||
          normalizedRow['nama'] ||
          normalizedRow['namalengkap'] ||
          normalizedRow['guru'] ||
          '';
        const nip = normalizedRow['nip'] || normalizedRow['nik'] || normalizedRow['nuptk'] || '';
        const mapel =
          normalizedRow['mapelutama'] ||
          normalizedRow['mapel'] ||
          normalizedRow['matapelajaran'] ||
          '';

        if (!nama) {
          errors.push(`Baris ${rowNum}: Nama Guru kosong.`);
        } else {
          const item: Guru = {
            id: `g_${now}_${idx}`,
            nama,
            nip: nip || undefined,
            mapelUtama: mapel || undefined
          };
          rawParsed.push(item);

          const dupCheck = checkIsDuplicate(item, type, existingList, seenSet);
          if (dupCheck.isDuplicate) {
            skippedDuplicates.push({
              rowNum,
              name: nama,
              detail: `NIP: ${nip || '-'} | Mapel: ${mapel || '-'}`,
              reason: dupCheck.reason || 'Data sama persis dengan yang sudah ada'
            });
          } else {
            newItems.push(item);
          }
        }
      } else if (type === 'mapel') {
        const nama =
          normalizedRow['namamatapelajaran'] ||
          normalizedRow['matapelajaran'] ||
          normalizedRow['namamapel'] ||
          normalizedRow['mapel'] ||
          normalizedRow['nama'] ||
          '';

        if (!nama) {
          errors.push(`Baris ${rowNum}: Nama Mata Pelajaran kosong.`);
        } else {
          const item: Mapel = {
            id: `m_${now}_${idx}`,
            nama
          };
          rawParsed.push(item);

          const dupCheck = checkIsDuplicate(item, type, existingList, seenSet);
          if (dupCheck.isDuplicate) {
            skippedDuplicates.push({
              rowNum,
              name: nama,
              detail: 'Mata Pelajaran',
              reason: dupCheck.reason || 'Mata pelajaran ini sudah terdaftar'
            });
          } else {
            newItems.push(item);
          }
        }
      } else if (type === 'kelas') {
        const nama =
          normalizedRow['namakelas'] ||
          normalizedRow['kelas'] ||
          normalizedRow['rombel'] ||
          normalizedRow['nama'] ||
          '';

        if (!nama) {
          errors.push(`Baris ${rowNum}: Nama Kelas kosong.`);
        } else {
          const item: Kelas = {
            id: `k_${now}_${idx}`,
            nama
          };
          rawParsed.push(item);

          const dupCheck = checkIsDuplicate(item, type, existingList, seenSet);
          if (dupCheck.isDuplicate) {
            skippedDuplicates.push({
              rowNum,
              name: nama,
              detail: 'Rombongan Belajar',
              reason: dupCheck.reason || 'Kelas ini sudah terdaftar'
            });
          } else {
            newItems.push(item);
          }
        }
      } else if (type === 'siswa') {
        const nama =
          normalizedRow['namasiswa'] ||
          normalizedRow['nama'] ||
          normalizedRow['namalengkap'] ||
          normalizedRow['murid'] ||
          normalizedRow['namamurid'] ||
          '';
        const nis =
          normalizedRow['nis'] ||
          normalizedRow['nisn'] ||
          normalizedRow['nomorinduk'] ||
          `NIS-${idx + 1}`;
        const kelas =
          normalizedRow['kelas'] ||
          normalizedRow['namakelas'] ||
          normalizedRow['rombel'] ||
          fallbackKelas ||
          '';

        if (!nama) {
          errors.push(`Baris ${rowNum}: Nama Siswa kosong.`);
        } else if (!kelas) {
          errors.push(`Baris ${rowNum}: Kelas untuk "${nama}" kosong.`);
        } else {
          const item: Siswa = {
            id: `s_${now}_${idx}`,
            nama,
            nis,
            kelas
          };
          rawParsed.push(item);

          const dupCheck = checkIsDuplicate(item, type, existingList, seenSet);
          if (dupCheck.isDuplicate) {
            skippedDuplicates.push({
              rowNum,
              name: nama,
              detail: `NIS: ${nis} | Kelas: ${kelas}`,
              reason: dupCheck.reason || 'Murid ini sudah terdaftar'
            });
          } else {
            newItems.push(item);
          }
        }
      } else if (type === 'walikelas') {
        const nama =
          normalizedRow['namawalikelas'] ||
          normalizedRow['namawali'] ||
          normalizedRow['nama'] ||
          normalizedRow['walikelas'] ||
          '';
        const kelas =
          normalizedRow['kelastugas'] ||
          normalizedRow['kelas'] ||
          normalizedRow['rombel'] ||
          '';
        const username =
          normalizedRow['username'] ||
          normalizedRow['user'] ||
          normalizedRow['login'] ||
          (nama ? nama.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) : `wali_${idx + 1}`);
        const password =
          normalizedRow['password'] ||
          normalizedRow['pass'] ||
          'password123';

        if (!nama) {
          errors.push(`Baris ${rowNum}: Nama Wali Kelas kosong.`);
        } else if (!kelas) {
          errors.push(`Baris ${rowNum}: Kelas Tugas untuk "${nama}" kosong.`);
        } else {
          const item: AccountWaliKelas = {
            id: `wk_${now}_${idx}`,
            nama,
            kelasAssigned: kelas,
            username,
            password
          };
          rawParsed.push(item);

          const dupCheck = checkIsDuplicate(item, type, existingList, seenSet);
          if (dupCheck.isDuplicate) {
            skippedDuplicates.push({
              rowNum,
              name: nama,
              detail: `Kelas: ${kelas} | User: ${username}`,
              reason: dupCheck.reason || 'Akun wali kelas ini sudah ada'
            });
          } else {
            newItems.push(item);
          }
        }
      }
    });

    return {
      success: rawParsed.length > 0,
      data: newItems,
      rawParsed,
      skippedDuplicates,
      errors,
      rawRowCount: rawRows.length,
      totalValidInFile: rawParsed.length,
      newCount: newItems.length,
      duplicateCount: skippedDuplicates.length
    };
  } catch (err: any) {
    return {
      success: false,
      data: [],
      rawParsed: [],
      skippedDuplicates: [],
      errors: [err.message || 'Gagal membaca file Excel.'],
      rawRowCount: 0,
      totalValidInFile: 0,
      newCount: 0,
      duplicateCount: 0
    };
  }
}
