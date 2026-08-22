import { Guru, Mapel, Kelas, Siswa, AccountWaliKelas, Aduan } from '../types';

export const INITIAL_GURU: Guru[] = [
  {
    id: "g_1786905462944_0",
    nama: "ADE SAPUTRA MARLIANTO, S.Pd.",
    nip: "19940404 202321 1 004",
    mapelUtama: "Pendidikan Pancasila"
  },
  {
    id: "g_1786905462944_1",
    nama: "AGUSTA DANANG WIJAYA, S.Pd.",
    nip: "19900815 202421 1 022",
    mapelUtama: "Geografi"
  },
  {
    id: "g_1786905462944_2",
    nama: "AGUSTA DANANG WIJAYA, S.Pd.",
    nip: "19900815 202421 1 022",
    mapelUtama: "PKWU"
  },
  {
    id: "g_1786905462944_3",
    nama: "AGUSTA DANANG WIJAYA, S.Pd.",
    nip: "19900815 202421 1 022",
    mapelUtama: "Fisika"
  },
  {
    id: "g_1786905462944_4",
    nama: "AHMAD JAILANI, S.Pd.",
    nip: "19900909 202221 1 017",
    mapelUtama: "Bimbingan Konseling"
  },
  {
    id: "g_1786905462944_5",
    nama: "AHMAD SOFYAN, S.Pd.",
    nip: "19750412 200312 1 007",
    mapelUtama: "Pendidikan Pancasila"
  },
  {
    id: "g_1786905462944_6",
    nama: "AKHMAD SAIDILLAH, M.Pd.",
    nip: "19940321 202521 1 020",
    mapelUtama: "Mulok"
  },
  {
    id: "g_1786905462944_7",
    nama: "AKHMAD SAIDILLAH, M.Pd.",
    nip: "19940321 202521 1 020",
    mapelUtama: "Pendidikan Pancasila"
  },
  {
    id: "g_1786905462944_8",
    nama: "ANDI, S.Pd.",
    nip: "-",
    mapelUtama: "Pendidikan Agama Katholik"
  },
  {
    id: "g_1786905462944_9",
    nama: "ASPAWATI, S.Pd.",
    nip: "19901018 202421 2 019",
    mapelUtama: "Sejarah Tingkat Lanjut"
  },
  {
    id: "g_1786905462944_10",
    nama: "AZIS YUNUS, S.Pd.",
    nip: "19800301 200704 1 027",
    mapelUtama: "PJOK"
  },
  {
    id: "g_1786905462944_11",
    nama: "BASTARI SATRIO, S.Pd.",
    nip: "19960908 202321 1 008",
    mapelUtama: "Bahasa Indonesia"
  },
  {
    id: "g_1786905462944_12",
    nama: "DATU HERMANTO, S.Pd., M.Pd.",
    nip: "19671121 199412 1 002",
    mapelUtama: "Bahasa Inggris"
  },
  {
    id: "g_1786905462944_13",
    nama: "DRA. SRI BUDI PRAPTIWI, M.Pd.",
    nip: "19680107 200312 2 003",
    mapelUtama: "Sosiologi"
  },
  {
    id: "g_1786905462944_14",
    nama: "DWI PURNOMO HADINOTO, S.Si.",
    nip: "19860327 201101 1 010",
    mapelUtama: "PJOK"
  },
  {
    id: "g_1786905462944_15",
    nama: "EDY EFFENDY, S.Pd.",
    nip: "19820112 200904 1 003",
    mapelUtama: "Bimbingan Konseling"
  },
  {
    id: "g_1786905462944_16",
    nama: "EDY PURWANTO, S.Pd.",
    nip: "19900227 202221 1 010",
    mapelUtama: "Bimbingan Konseling"
  },
  {
    id: "g_1786905462944_17",
    nama: "EKA MARETHA RAHAYU, S.Pd.",
    nip: "19900315 202221 2 021",
    mapelUtama: "Matematika"
  },
  {
    id: "g_1786905462944_18",
    nama: "EVI SULISTYANINGSIH, M.Pd.",
    nip: "19821031 200502 2 001",
    mapelUtama: "Bahasa Indonesia"
  },
  {
    id: "g_1786905462944_19",
    nama: "FADLANSYAH, S.Pd.",
    nip: "19681215 200312 1 002",
    mapelUtama: "Ekonomi"
  },
  {
    id: "g_1786905462944_20",
    nama: "H. SAMIN, S.Th., M.A.",
    nip: "19821222 202321 1 002",
    mapelUtama: "Pendidikan Agama Islam"
  },
  {
    id: "g_1786905462944_21",
    nama: "HADRIAN, S.Pd.",
    nip: "19720406 200312 1 005",
    mapelUtama: "Matematika"
  },
  {
    id: "g_1786905462944_22",
    nama: "HASNI, S.Si., M.Pd.",
    nip: "19750515 200502 2 010",
    mapelUtama: "Fisika"
  },
  {
    id: "g_1786905462944_23",
    nama: "HASNI, S.Si., M.Pd.",
    nip: "19750515 200502 2 010",
    mapelUtama: "PKWU"
  },
  {
    id: "g_1786905462944_24",
    nama: "HELNIE MEGAWATI, S.Pd., M.Pd.",
    nip: "19770904 200012 2 001",
    mapelUtama: "Bahasa Indonesia"
  },
  {
    id: "g_1786905462944_25",
    nama: "HJ. INDAH KURROTI AINI, M.Pd.",
    nip: "19700902 200502 2 004",
    mapelUtama: "Seni Rupa"
  },
  {
    id: "g_1786905462944_26",
    nama: "HJ. INDAH KURROTI AINI, M.Pd.",
    nip: "19700902 200502 2 004",
    mapelUtama: "Seni Budaya"
  },
  {
    id: "g_1786905462944_27",
    nama: "IHSAN WAHYUDI, S.Pd.",
    nip: "19850724 201101 1 012",
    mapelUtama: "Matematika Tingkat Lanjut"
  },
  {
    id: "g_1786905462944_28",
    nama: "JAEHAN NUMALITA A.T., S.Sos.",
    nip: "19990930 202521 2 046",
    mapelUtama: "Bimbingan Konseling"
  },
  {
    id: "g_1786905462944_29",
    nama: "JONI ARDHI, S.Ag., M.Pd.",
    nip: "19730619 200312 1 006",
    mapelUtama: "Pendidikan Agama Islam"
  },
  {
    id: "g_1786905462944_30",
    nama: "M. R. ADI ISMAIL, S.Kom.",
    nip: "19950410 202521 1 053",
    mapelUtama: "Koding dan Kecerdasan Artifisial (KKA)"
  },
  {
    id: "g_1786905462944_31",
    nama: "MARIATUL KIFTIAH, S.Pd.",
    nip: "19941012 202221 2 013",
    mapelUtama: "PKWU"
  },
  {
    id: "g_1786905462944_32",
    nama: "MAWAR NURANI, S.Pd.",
    nip: "19950128 202012 2 013",
    mapelUtama: "Matematika"
  },
  {
    id: "g_1786905462944_33",
    nama: "MILAN IBRAHIM, S.Pd., M.Pd.",
    nip: "19700508 199903 2 005",
    mapelUtama: "PKWU"
  },
  {
    id: "g_1786905462944_34",
    nama: "MILAN IBRAHIM, S.Pd., M.Pd.",
    nip: "19700508 199903 2 005",
    mapelUtama: "FISIKA"
  },
  {
    id: "g_1786905462944_35",
    nama: "MUHAMMAD DIKI HIDAYAT, S.Pd.",
    nip: "19920806 202421 1 017",
    mapelUtama: "Kimia"
  },
  {
    id: "g_1786905462944_36",
    nama: "MUHAMMAD FAUZAN ADHIM, S.Pd.",
    nip: "20000317 202521 1 013",
    mapelUtama: "Bahasa Indonesia"
  },
  {
    id: "g_1786905462944_37",
    nama: "MUHAMMAD NAIM, S.Ag.",
    nip: "19701015 200312 1 003",
    mapelUtama: "Geografi"
  },
  {
    id: "g_1786905462944_38",
    nama: "NGURAH NYOMAN SARJANA, S.Pd.",
    nip: "-",
    mapelUtama: "Pendidikan Agama Hindhu"
  },
  {
    id: "g_1786905462944_39",
    nama: "NOR LAILA YULIANI, S.Pd.",
    nip: "19910708 202012 2 011",
    mapelUtama: "Sejarah"
  },
  {
    id: "g_1786905462944_40",
    nama: "NOVITA, S.Pd.",
    nip: "19970716 202221 2 003",
    mapelUtama: "Antropolgi"
  },
  {
    id: "g_1786905462944_41",
    nama: "NUR MASHARIYAH, SP, M.Pd.",
    nip: "19780811 200704 2 019",
    mapelUtama: "Biologi"
  },
  {
    id: "g_1786905462944_42",
    nama: "RUCHIL JIHAD, M.Pd.",
    nip: "19680715 199011 1 001",
    mapelUtama: "Ekonomi"
  },
  {
    id: "g_1786905462944_43",
    nama: "SARMI INDARWATI, S.S.",
    nip: "19730930 200701 2 011",
    mapelUtama: "Bahasa Jepang"
  },
  {
    id: "g_1786905462944_44",
    nama: "SENO PUJOSANTOSO, S.Pd., M.Pd.",
    nip: "19671022 199512 1 003",
    mapelUtama: "Biologi"
  },
  {
    id: "g_1786905462944_45",
    nama: "SENO PUJOSANTOSO, S.Pd., M.Pd.",
    nip: "19671022 199512 1 003",
    mapelUtama: "Pendidikan Agama Protestan"
  },
  {
    id: "g_1786905462944_46",
    nama: "SENO PUJOSANTOSO, S.Pd., M.Pd.",
    nip: "19671022 199512 1 003",
    mapelUtama: "Pendidikan Agama Kristen"
  },
  {
    id: "g_1786905462944_47",
    nama: "SURYA DARMA, S.Pd.",
    nip: "19760606 200012 1 002",
    mapelUtama: "Bahasa Inggris"
  },
  {
    id: "g_1786905462944_48",
    nama: "SURYA DARMA, S.Pd.",
    nip: "19760606 200012 1 002",
    mapelUtama: "Bahasa Inggris Tingkat Lanjut"
  },
  {
    id: "g_1786905462944_49",
    nama: "SYAIFUL ADNAN, S.Pd.I.",
    nip: "19750104 201410 1 001",
    mapelUtama: "Pendidikan Agama Islam"
  },
  {
    id: "g_1786905462944_50",
    nama: "TYAS NURHAYATI, M.Pd.",
    nip: "19821030 200904 2 010",
    mapelUtama: "Bahasa Inggris"
  },
  {
    id: "g_1786905462944_51",
    nama: "WAHYU SHOFIAN, S.Kom.",
    nip: "-",
    mapelUtama: "Informatika"
  },
  {
    id: "g_1786905462944_52",
    nama: "YULI PUSPA SARI, S.Pd., M.Pd.",
    nip: "19810707 200502 2 007",
    mapelUtama: "Kimia"
  },
  {
    id: "g_1786905462944_53",
    nama: "ZEIN MUNAJAT ARASY PADIL, S.Pd.",
    nip: "19900715 202521 1 016",
    mapelUtama: "Bahasa Jerman"
  },
  {
    id: "g_1786905462944_54",
    nama: "ZUL BAHRAEN, M.Pd.",
    nip: "19800120 200312 1 004",
    mapelUtama: "Sejarah"
  }
];

export const INITIAL_MAPEL: Mapel[] = [
  { id: "m_1786905485962_0", nama: "Antropologi" },
  { id: "m_1786905485962_1", nama: "Bahasa Indonesia" },
  { id: "m_1786905485962_2", nama: "Bahasa Inggris" },
  { id: "m_1786905485962_3", nama: "Bahasa Inggris Tingkat Lanjut" },
  { id: "m_1786905485962_4", nama: "Bahasa Jepang" },
  { id: "m_1786905485962_5", nama: "Bahasa Jerman" },
  { id: "m_1786905485962_6", nama: "Bimbingan Konseling" },
  { id: "m_1786905485962_7", nama: "Biologi" },
  { id: "m_1786905485962_8", nama: "Ekonomi" },
  { id: "m_1786905485962_9", nama: "Fisika" },
  { id: "m_1786905485962_10", nama: "Geografi" },
  { id: "m_1786905485962_11", nama: "Informatika" },
  { id: "m_1786905485962_12", nama: "Kimia" },
  { id: "m_1786905485962_13", nama: "Koding dan Kecerdasan Artifisial (KKA)" },
  { id: "m_1786905485962_14", nama: "Matematika" },
  { id: "m_1786905485962_15", nama: "Matematika Tingkat Lanjut" },
  { id: "m_1786905485962_16", nama: "Mulok" },
  { id: "m_1786905485962_17", nama: "Pendidikan Agama Hindhu" },
  { id: "m_1786905485962_18", nama: "Pendidikan Agama Islam" },
  { id: "m_1786905485962_19", nama: "Pendidikan Agama Katholik" },
  { id: "m_1786905485962_20", nama: "Pendidikan Agama Kristen" },
  { id: "m_1786905485962_21", nama: "Pendidikan Agama Protestan" },
  { id: "m_1786905485962_22", nama: "Pendidikan Pancasila" },
  { id: "m_1786905485962_23", nama: "PJOK" },
  { id: "m_1786905485962_24", nama: "PKWU" },
  { id: "m_1786905485962_25", nama: "Sejarah" },
  { id: "m_1786905485962_26", nama: "Sejarah Tingkat Lanjut" },
  { id: "m_1786905485962_27", nama: "Seni Budaya" },
  { id: "m_1786905485962_28", nama: "Seni Rupa" },
  { id: "m_1786905485962_29", nama: "Sosiologi" }
];

export const INITIAL_KELAS: Kelas[] = [
  { id: "k_1786905502329_0", nama: "X-1" },
  { id: "k_1786905502329_1", nama: "X-2" },
  { id: "k_1786905502329_2", nama: "X-3" },
  { id: "k_1786905502329_3", nama: "X-4" },
  { id: "k_1786905502329_4", nama: "X-5" },
  { id: "k_1786905502329_5", nama: "X-6" },
  { id: "k_1786905502329_6", nama: "X-7" },
  { id: "k_1786905502329_7", nama: "XI-1" },
  { id: "k_1786905502329_8", nama: "XI-2" },
  { id: "k_1786905502329_9", nama: "XI-3" },
  { id: "k_1786905502329_10", nama: "XI-4" },
  { id: "k_1786905502329_11", nama: "XI-5" },
  { id: "k_1786905502329_12", nama: "XI-6" },
  { id: "k_1786905502329_13", nama: "XII-1" },
  { id: "k_1786905502329_14", nama: "XII-2" },
  { id: "k_1786905502329_15", nama: "XII-3" },
  { id: "k_1786905502329_16", nama: "XII-4" },
  { id: "k_1786905502329_17", nama: "XII-5" },
  { id: "k_1786905502329_18", nama: "XII-6" }
];

export const INITIAL_SISWA: Siswa[] = [
  { id: "s_1786905563901_0", nama: "ALIKA SYERA ADILA", nis: "253315", kelas: "XI-6" },
  { id: "s_1786905563901_1", nama: "ALYA AMIRA PUTRI", nis: "253318", kelas: "XI-6" },
  { id: "s_1786905563901_2", nama: "ANJELI ANISA PUTRI", nis: "253327", kelas: "XI-6" },
  { id: "s_1786905563901_3", nama: "ARBI FERDI SAMUDRA", nis: "253330", kelas: "XI-6" },
  { id: "s_1786905563901_4", nama: "ARYA MUHAMMAD SAPUTRA", nis: "253332", kelas: "XI-6" },
  { id: "s_1786905563901_5", nama: "AULIA PUTRI PERMATASARI", nis: "253335", kelas: "XI-6" },
  { id: "s_1786905563901_6", nama: "AURA ARTHAVIA KASIH", nis: "253337", kelas: "XI-6" },
  { id: "s_1786905563901_7", nama: "FIKA MELATI SUKMA APRIANA", nis: "253367", kelas: "XI-6" },
  { id: "s_1786905563901_8", nama: "IBNU SYAMIL AL-GIFARY", nis: "253376", kelas: "XI-6" },
  { id: "s_1786905563901_9", nama: "IMELDA ALFONSINA ORAILE", nis: "253377", kelas: "XI-6" },
  { id: "s_1786905563901_10", nama: "LENY ANJANI RAMADHANI", nis: "253393", kelas: "XI-6" },
  { id: "s_1786905563901_11", nama: "MEYLINDA SEKAR MUTMAH INNA PUTRI", nis: "253399", kelas: "XI-6" },
  { id: "s_1786905563901_12", nama: "MOH. ALNURWAN", nis: "253400", kelas: "XI-6" },
  { id: "s_1786905563901_13", nama: "MUHAMMAD FATHIR TANGKUMAN", nis: "253415", kelas: "XI-6" },
  { id: "s_1786905563901_14", nama: "MUHAMMAD ADITYA PRATAMA", nis: "253402", kelas: "XI-6" },
  { id: "s_1786905563901_15", nama: "MUHAMMAD ALDI ISHAK SAPUTRA", nis: "253404", kelas: "XI-6" },
  { id: "s_1786905563901_16", nama: "MUHAMMAD ARGAN AL GIFAHRI", nis: "253405", kelas: "XI-6" },
  { id: "s_1786905563901_17", nama: "MUHAMMAD IKHWAN", nis: "253420", kelas: "XI-6" },
  { id: "s_1786905563901_18", nama: "MUHAMMAD REZA AULIA FAJRIANSYAH", nis: "253423", kelas: "XI-6" },
  { id: "s_1786905563901_19", nama: "MUHAMMAD YUSRIL AZZAM AS", nis: "253427", kelas: "XI-6" },
  { id: "s_1786905563901_20", nama: "NINO ISANDA", nis: "253442", kelas: "XI-6" },
  { id: "s_1786905563901_21", nama: "NURSAIBAH", nis: "253452", kelas: "XI-6" },
  { id: "s_1786905563901_22", nama: "RAFLY IQBAL SAYLENDRA", nis: "253461", kelas: "XI-6" },
  { id: "s_1786905563901_23", nama: "SALSABILA PUTRI SYAMIRA", nis: "253477", kelas: "XI-6" },
  { id: "s_1786905563901_24", nama: "WINDA", nis: "253489", kelas: "XI-6" },
  { id: "s_1786905563901_25", nama: "ZOE AZIMAH APRIYANI", nis: "253496", kelas: "XI-6" }
];

export const INITIAL_WALI_KELAS: AccountWaliKelas[] = [
  { id: "wk_1786905582079_0", nama: "ADE SAPUTRA MARLIANTO, S.Pd.", kelasAssigned: "X-1", username: "walas-x1", password: "walasx1" },
  { id: "wk_1786905582079_1", nama: "WAHYU SHOFIAN, S.Kom.", kelasAssigned: "X-2", username: "walas-x2", password: "walasx2" },
  { id: "wk_1786905582079_2", nama: "NOR LAILA YULIANI, S.Pd.", kelasAssigned: "X-3", username: "walas-x3", password: "walasx3" },
  { id: "wk_1786905582079_3", nama: "BASTARI SATRIO, S.Pd.", kelasAssigned: "X-4", username: "walas-x4", password: "walasx4" },
  { id: "wk_1786905582079_4", nama: "MUHAMMAD DIKI HIDAYAT, S.Pd.", kelasAssigned: "X-5", username: "walas-x5", password: "walasx5" },
  { id: "wk_1786905582079_5", nama: "MUHAMMAD FAUZAN ADHIM, S.Pd.", kelasAssigned: "X-6", username: "walas-x6", password: "walasx6" },
  { id: "wk_1786905582079_6", nama: "MAWAR NURANI, S.Pd.", kelasAssigned: "X-7", username: "walas-x7", password: "walasx7" },
  { id: "wk_1786905582079_7", nama: "H. SAMIN, S.Th., M.A.", kelasAssigned: "XI-1", username: "walas-xi1", password: "walasxi1" },
  { id: "wk_1786905582079_8", nama: "MARIATUL KIFTIAH, S.Pd.", kelasAssigned: "XI-2", username: "walas-xi2", password: "walasxi2" },
  { id: "wk_1786905582079_9", nama: "SARMI INDARWATI, S.S.", kelasAssigned: "XI-3", username: "walas-xi3", password: "walasxi3" },
  { id: "wk_1786905582079_10", nama: "TYAS NURHAYATI, M.Pd.", kelasAssigned: "XI-4", username: "walas-xi4", password: "walasxi4" },
  { id: "wk_1786905582079_11", nama: "EKA MARETHA RAHAYU, S.Pd.", kelasAssigned: "XI-5", username: "walas-xi5", password: "walasxi5" },
  { id: "wk_1786905582079_12", nama: "M. R. ADI ISMAIL, S.Kom.", kelasAssigned: "XI-6", username: "walas-xi6", password: "walasxi6" },
  { id: "wk_1786905582079_13", nama: "IHSAN WAHYUDI, S.Pd.", kelasAssigned: "XII-1", username: "walas-xii1", password: "walasxii1" },
  { id: "wk_1786905582079_14", nama: "HASNI, S.Si., M.Pd.", kelasAssigned: "XII-2", username: "walas-xii2", password: "walasxii2" },
  { id: "wk_1786905582079_15", nama: "NUR MASHARIYAH, SP, M.Pd.", kelasAssigned: "XII-3", username: "walas-xii3", password: "walasxii3" },
  { id: "wk_1786905582079_16", nama: "ZUL BAHRAEN, M.Pd.", kelasAssigned: "XII-4", username: "walas-xii4", password: "walasxii4" },
  { id: "wk_1786905582079_17", nama: "ASPAWATI, S.Pd.", kelasAssigned: "XII-5", username: "walas-xii5", password: "walasxii5" },
  { id: "wk_1786905582079_18", nama: "DWI PURNOMO HADINOTO, S.Si.", kelasAssigned: "XII-6", username: "walas-xii6", password: "walasxii6" }
];

export const INITIAL_ADUAN: Aduan[] = [
  {
    id: "ADUAN-20260818-8164HGVL",
    namaGuru: "M. R. ADI ISMAIL, S.Kom.",
    mapel: "Koding dan Kecerdasan Artifisial (KKA)",
    kelas: "XI-6",
    siswaList: ["MUHAMMAD YUSRIL AZZAM AS"],
    jenisKesalahan: "Keributan / Mengganggu Ketertiban Kelas",
    keteranganLainnya: "QQQ",
    fotoBukti: "",
    catatanKronologi: "QQQ",
    timestampAduan: "Selasa, 18 Agustus 2026 | 09.44.37 WITA",
    createdAtISO: "2026-08-18T01:44:38.165Z",
    status: "Sudah Ditindak Lanjuti",
    tindakLanjutHistory: [
      {
        status: "Dalam Proses",
        timestamp: "Selasa, 18 Agustus 2026 | 11.14 WITA",
        olehWaliKelas: "M. R. ADI ISMAIL, S.Kom. (XI-6)",
        keterangan: "Yang bersangkutan sudah ditindaklanjuti."
      },
      {
        status: "Sudah Ditindak Lanjuti",
        timestamp: "Selasa, 18 Agustus 2026 | 11.15 WITA",
        olehWaliKelas: "M. R. ADI ISMAIL, S.Kom. (XI-6)",
        keterangan: "Sudah ditindaklanuti. Daman semua."
      }
    ]
  }
];

export const JENIS_KESALAHAN_OPTIONS = [
  'Terlambat Masuk Kelas',
  'Tidak Mengerjakan Tugas',
  'Bermain HP Saat Jam Pelajaran',
  'Tidur di Kelas',
  'Tidak Memakai Seragam Lengkap',
  'Atribut Seragam Tidak Sesuai',
  'Makan/Minum Saat KBM Berlangsung',
  'Keributan / Mengganggu Ketertiban Kelas',
  'Keluar Kelas Tanpa Izin Guru',
  'Bolos / Tidak Masuk Pelajaran',
  'Bersikap Tidak Sopan Terhadap Guru',
  'Berkelahi / Tindak Kekerasan',
  'Merusak Fasilitas Kelas/Sekolah',
  'Membawa Barang Terlarang',
  'Lainnya (Ketik di Keterangan)'
];
