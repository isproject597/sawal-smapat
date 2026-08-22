export interface Guru {
  id: string;
  nama: string;
  nip?: string;
  mapelUtama?: string;
  isEdited?: boolean;
  editedAt?: string;
  editedBy?: string;
  editHistory?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export interface Mapel {
  id: string;
  nama: string;
  kode?: string;
  isEdited?: boolean;
  editedAt?: string;
  editedBy?: string;
  editHistory?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export interface Kelas {
  id: string;
  nama: string; // e.g. "X MIPA 1", "XI IPS 2"
  waliKelasId?: string;
  isEdited?: boolean;
  editedAt?: string;
  editedBy?: string;
  editHistory?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export interface Siswa {
  id: string;
  nis: string;
  nama: string;
  kelas: string;
  isEdited?: boolean;
  editedAt?: string;
  editedBy?: string;
  editHistory?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export interface AccountWaliKelas {
  id: string;
  username: string;
  password: string;
  nama: string;
  kelasAssigned: string; // e.g. "X MIPA 1"
  isEdited?: boolean;
  editedAt?: string;
  editedBy?: string;
  editHistory?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export type StatusAduan = 'Belum Ditindak Lanjuti' | 'Dalam Proses' | 'Sudah Ditindak Lanjuti' | 'Dihapus';

export interface TindakLanjutRecord {
  status: StatusAduan;
  timestamp: string;
  olehWaliKelas: string;
  keterangan: string;
}

export interface Aduan {
  id: string;
  namaGuru: string;
  mapel: string;
  kelas: string;
  siswaList: string[]; // List of student names or IDs
  jenisKesalahan: string;
  keteranganLainnya?: string;
  fotoBukti?: string; // Single string or newline-separated URLs / Base64 for backwards compatibility
  fotoBuktiList?: string[]; // Array of Base64 strings or Google Drive URLs (supports multiple photos)
  catatanKronologi?: string;
  timestampAduan: string; // Auto-generated string e.g. "Kamis, 13 Agustus 2026 | 14:35 WIB"
  createdAtISO: string;
  status: StatusAduan;
  tindakLanjutHistory?: TindakLanjutRecord[];
  isEdited?: boolean;
  editedAt?: string;
  editedBy?: string;
  editHistory?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export type UserRole = 'guest' | 'admin' | 'walikelas';

export interface UserSession {
  role: UserRole;
  nama?: string;
  nipNik?: string;
  username?: string;
  kelasAssigned?: string;
}
