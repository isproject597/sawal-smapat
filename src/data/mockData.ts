import { Guru, Mapel, Kelas, Siswa, AccountWaliKelas, Aduan } from '../types';

export const INITIAL_GURU: Guru[] = [
  { id: 'g1', nama: 'Budi Santoso, S.Pd.', nip: '198203152008011002', mapelUtama: 'Matematika' },
  { id: 'g2', nama: 'Siti Aminah, M.Pd.', nip: '198507202010012005', mapelUtama: 'Bahasa Indonesia' },
  { id: 'g3', nama: 'Drs. H. Ahmad Dahlan', nip: '197511122002121001', mapelUtama: 'Fisika' },
  { id: 'g4', nama: 'Eka Rahmawati, S.Si.', nip: '199001042014022003', mapelUtama: 'Kimia' },
  { id: 'g5', nama: 'Rahmat Hidayat, S.Pd.', nip: '198809182012011004', mapelUtama: 'Pendidikan Jasmani' },
  { id: 'g6', nama: 'Dewi Lestari, S.S.', nip: '199205302019032008', mapelUtama: 'Bahasa Inggris' },
  { id: 'g7', nama: 'Ir. Agus Wijaya, M.T.', nip: '197904022006041003', mapelUtama: 'Informatika' },
  { id: 'g8', nama: 'Nurhaliza, S.Pd.', nip: '199408112020122015', mapelUtama: 'Biologi' }
];

export const INITIAL_MAPEL: Mapel[] = [
  { id: 'm1', nama: 'Matematika' },
  { id: 'm2', nama: 'Bahasa Indonesia' },
  { id: 'm3', nama: 'Bahasa Inggris' },
  { id: 'm4', nama: 'Fisika' },
  { id: 'm5', nama: 'Kimia' },
  { id: 'm6', nama: 'Biologi' },
  { id: 'm7', nama: 'Informatika' },
  { id: 'm8', nama: 'Pendidikan Jasmani & Kesehatan' },
  { id: 'm9', nama: 'PPKn / Pancasila' },
  { id: 'm10', nama: 'Sejarah Indonesia' }
];

export const INITIAL_KELAS: Kelas[] = [
  { id: 'k1', nama: 'X MIPA 1' },
  { id: 'k2', nama: 'X MIPA 2' },
  { id: 'k3', nama: 'XI MIPA 1' },
  { id: 'k4', nama: 'XI IPS 1' },
  { id: 'k5', nama: 'XII MIPA 1' },
  { id: 'k6', nama: 'XII IPS 1' }
];

export const INITIAL_SISWA: Siswa[] = [
  // X MIPA 1
  { id: 's1', nis: '20261001', nama: 'Ahmad Rizky Pratama', kelas: 'X MIPA 1' },
  { id: 's2', nis: '20261002', nama: 'Anisa Putri Maharani', kelas: 'X MIPA 1' },
  { id: 's3', nis: '20261003', nama: 'Bagas Aditya Nugraha', kelas: 'X MIPA 1' },
  { id: 's4', nis: '20261004', nama: 'Citra Kirana', kelas: 'X MIPA 1' },
  { id: 's5', nis: '20261005', nama: 'Dion Wiyoko', kelas: 'X MIPA 1' },

  // X MIPA 2
  { id: 's6', nis: '20261006', nama: 'Fajar Kurniawan', kelas: 'X MIPA 2' },
  { id: 's7', nis: '20261007', nama: 'Gita Gutawa S.', kelas: 'X MIPA 2' },
  { id: 's8', nis: '20261008', nama: 'Hendra Setiawan', kelas: 'X MIPA 2' },

  // XI MIPA 1
  { id: 's9', nis: '20251001', nama: 'Indah Permatasari', kelas: 'XI MIPA 1' },
  { id: 's10', nis: '20251002', nama: 'Joko Susilo', kelas: 'XI MIPA 1' },
  { id: 's11', nis: '20251003', nama: 'Kevin Sanjaya', kelas: 'XI MIPA 1' },

  // XI IPS 1
  { id: 's12', nis: '20252001', nama: 'Lesti Andryani', kelas: 'XI IPS 1' },
  { id: 's13', nis: '20252002', nama: 'Muhammad Farhan', kelas: 'XI IPS 1' },

  // XII MIPA 1
  { id: 's14', nis: '20241001', nama: 'Nabila Syakieb', kelas: 'XII MIPA 1' },
  { id: 's15', nis: '20241002', nama: 'Oky Lukman', kelas: 'XII MIPA 1' },

  // XII IPS 1
  { id: 's16', nis: '20242001', nama: 'Putri Rahayu', kelas: 'XII IPS 1' },
  { id: 's17', nis: '20242002', nama: 'Rafi Ahmad', kelas: 'XII IPS 1' }
];

export const INITIAL_WALI_KELAS: AccountWaliKelas[] = [
  { id: 'wk1', username: 'walikelas10mipa1', password: 'password123', nama: 'Budi Santoso, S.Pd.', kelasAssigned: 'X MIPA 1' },
  { id: 'wk2', username: 'walikelas10mipa2', password: 'password123', nama: 'Siti Aminah, M.Pd.', kelasAssigned: 'X MIPA 2' },
  { id: 'wk3', username: 'walikelas11mipa1', password: 'password123', nama: 'Drs. H. Ahmad Dahlan', kelasAssigned: 'XI MIPA 1' },
  { id: 'wk4', username: 'walikelas11ips1', password: 'password123', nama: 'Eka Rahmawati, S.Si.', kelasAssigned: 'XI IPS 1' },
  { id: 'wk5', username: 'walikelas12mipa1', password: 'password123', nama: 'Rahmat Hidayat, S.Pd.', kelasAssigned: 'XII MIPA 1' },
  { id: 'wk6', username: 'walikelas12ips1', password: 'password123', nama: 'Dewi Lestari, S.S.', kelasAssigned: 'XII IPS 1' }
];

export const INITIAL_ADUAN: Aduan[] = [
  {
    id: 'ADUAN-20260813-001',
    namaGuru: 'Budi Santoso, S.Pd.',
    mapel: 'Matematika',
    kelas: 'X MIPA 1',
    siswaList: ['Ahmad Rizky Pratama', 'Bagas Aditya Nugraha'],
    jenisKesalahan: 'Terlambat Masuk Kelas',
    keteranganLainnya: 'Terlambat 25 menit saat jam pelajaran pertama matematika',
    catatanKronologi: 'Murid masuk ke kelas setelah bel berbunyi jam 07:45 tanpa surat izin dari piket.',
    fotoBukti: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&auto=format&fit=crop&q=80',
    fotoBuktiList: [
      'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=80'
    ],
    timestampAduan: 'Kamis, 13 Agustus 2026 | 08:15:22 WITA',
    createdAtISO: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    status: 'Dalam Proses',
    tindakLanjutHistory: [
      {
        status: 'Dalam Proses',
        timestamp: 'Kamis, 13 Agustus 2026 | 09:30:10 WITA',
        olehWaliKelas: 'Budi Santoso, S.Pd. (X MIPA 1)',
        keterangan: 'Murid sudah dipanggil ke ruang wali kelas untuk pembinaan awal.'
      }
    ]
  },
  {
    id: 'ADUAN-20260812-002',
    namaGuru: 'Siti Aminah, M.Pd.',
    mapel: 'Bahasa Indonesia',
    kelas: 'X MIPA 1',
    siswaList: ['Dion Wiyoko'],
    jenisKesalahan: 'Tidak Mengerjakan Tugas',
    keteranganLainnya: 'Tidak mengumpulkan tugas resensi buku bab 2',
    catatanKronologi: 'Sudah diperingatkan 2 kali dalam tenggat waktu 3 hari.',
    fotoBukti: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80',
    fotoBuktiList: [
      'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80'
    ],
    timestampAduan: 'Rabu, 12 Agustus 2026 | 10:20:00 WITA',
    createdAtISO: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    status: 'Sudah Ditindak Lanjuti',
    tindakLanjutHistory: [
      {
        status: 'Dalam Proses',
        timestamp: 'Rabu, 12 Agustus 2026 | 11:00:00 WITA',
        olehWaliKelas: 'Budi Santoso, S.Pd. (X MIPA 1)',
        keterangan: 'Wali kelas menghubungi orang tua murid via WhatsApp.'
      },
      {
        status: 'Sudah Ditindak Lanjuti',
        timestamp: 'Rabu, 12 Agustus 2026 | 14:00:00 WITA',
        olehWaliKelas: 'Budi Santoso, S.Pd. (X MIPA 1)',
        keterangan: 'Tugas susulan telah diserahkan dan orang tua sudah menandatangani surat konfirmasi.'
      }
    ]
  },
  {
    id: 'ADUAN-20260813-003',
    namaGuru: 'Drs. H. Ahmad Dahlan',
    mapel: 'Fisika',
    kelas: 'XI MIPA 1',
    siswaList: ['Joko Susilo'],
    jenisKesalahan: 'Bermain HP Saat Jam Pelajaran',
    keteranganLainnya: 'Memainkan game online saat praktikum Fisika',
    catatanKronologi: 'HP disita sementara oleh guru mapel dan diserahkan ke wali kelas.',
    fotoBukti: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=80',
    fotoBuktiList: [
      'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=80'
    ],
    timestampAduan: 'Kamis, 13 Agustus 2026 | 11:10:05 WITA',
    createdAtISO: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    status: 'Belum Ditindak Lanjuti'
  }
];

export const JENIS_KESALAHAN_OPTIONS = [
  'Terlambat Masuk Kelas',
  'Tidak Mengerjakan Tugas / PR',
  'Bermain HP Saat Jam Pelajaran',
  'Meninggalkan Kelas Tanpa Izin (Membolos)',
  'Atribut Seragam Tidak Lengkap / Rapi',
  'Rambut Tidak Rapi / Pewarnaan Rambut',
  'Keributan / Mengganggu Ketertiban Kelas',
  'Indisipliner Saat Upacara / Apel',
  'Perundungan / Bullying (Verbal/Non-Verbal)',
  'Kerusakan Fasilitas Kelas / Sekolah',
  'Lainnya (Tuliskan Keterangan Khusus)'
];
