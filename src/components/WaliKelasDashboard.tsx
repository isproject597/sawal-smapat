import React, { useState } from 'react';
import {
  UserCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  X,
  FileText,
  Filter,
  Search,
  MessageSquare,
  Trash2,
  RotateCcw,
  History,
  CheckSquare,
  Square,
  AlertOctagon,
  Eye,
  Check,
  GraduationCap
} from 'lucide-react';
import { Aduan, StatusAduan, UserSession, Siswa, Kelas } from '../types';
import { PhotoGalleryViewer } from './PhotoGalleryViewer';
import { WaliKelasKelolaKelasTab } from './walikelas/WaliKelasKelolaKelasTab';

interface WaliKelasDashboardProps {
  session: UserSession;
  aduanList: Aduan[];
  deletedAduanList?: Aduan[];
  siswaList?: Siswa[];
  kelasList?: Kelas[];
  onUpdateSiswa?: (list: Siswa[], deletedList?: Siswa[]) => void;
  onUpdateAduanStatus: (
    aduanId: string,
    newStatus: StatusAduan,
    keterangan: string,
    olehWaliKelas: string
  ) => void;
  onDeleteAduan?: (aduanId: string) => void;
  onDeleteMultipleAduan?: (aduanIds: string[]) => void;
  onRestoreAduan?: (restoredItems: Aduan[]) => void;
  onCloseDashboard: () => void;
}

export const WaliKelasDashboard: React.FC<WaliKelasDashboardProps> = ({
  session,
  aduanList,
  deletedAduanList = [],
  siswaList = [],
  kelasList = [],
  onUpdateSiswa = () => {},
  onUpdateAduanStatus,
  onDeleteAduan,
  onDeleteMultipleAduan,
  onRestoreAduan,
  onCloseDashboard
}) => {
  // Main Sub-Menu: Aduan vs Kelola Kelas
  const [mainSubMenu, setMainSubMenu] = useState<'aduan' | 'kelola_kelas'>('aduan');

  const [viewMode, setViewMode] = useState<'active' | 'deleted'>('active');
  const [filterMode, setFilterMode] = useState<'assigned' | 'all'>('assigned');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Bulk Selection States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedDeletedIds, setSelectedDeletedIds] = useState<string[]>([]);

  // Follow-up modal state
  const [selectedAduan, setSelectedAduan] = useState<Aduan | null>(null);
  const [targetStatus, setTargetStatus] = useState<StatusAduan>('Dalam Proses');
  const [keteranganTindakLanjut, setKeteranganTindakLanjut] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  // Deletion modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'single' | 'bulk';
    id?: string;
    title: string;
    description: string;
    targetIds?: string[];
  }>({
    isOpen: false,
    type: 'single',
    title: '',
    description: ''
  });

  // Success Notification banner
  const [notice, setNotice] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4500);
  };

  const kelasWali = session.kelasAssigned || '';

  // Active Aduan Filtered List
  const displayedActiveList = aduanList.filter((ad) => {
    if (filterMode === 'assigned' && kelasWali) {
      if (ad.kelas.toLowerCase() !== kelasWali.toLowerCase()) return false;
    }

    if (statusFilter && ad.status !== statusFilter) return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        ad.id.toLowerCase().includes(term) ||
        ad.namaGuru.toLowerCase().includes(term) ||
        ad.mapel.toLowerCase().includes(term) ||
        ad.jenisKesalahan.toLowerCase().includes(term) ||
        ad.siswaList.some((s) => s.toLowerCase().includes(term));
      if (!matchSearch) return false;
    }

    return true;
  });

  // Deleted Aduan Filtered List
  const displayedDeletedList = deletedAduanList.filter((ad) => {
    if (filterMode === 'assigned' && kelasWali) {
      if (ad.kelas.toLowerCase() !== kelasWali.toLowerCase()) return false;
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        ad.id.toLowerCase().includes(term) ||
        ad.namaGuru.toLowerCase().includes(term) ||
        ad.mapel.toLowerCase().includes(term) ||
        ad.jenisKesalahan.toLowerCase().includes(term) ||
        ad.siswaList.some((s) => s.toLowerCase().includes(term));
      if (!matchSearch) return false;
    }

    return true;
  });

  // Active Selection Handlers
  const isAllActiveSelected =
    displayedActiveList.length > 0 &&
    displayedActiveList.every((ad) => selectedIds.includes(ad.id));

  const handleToggleSelectAllActive = () => {
    if (isAllActiveSelected) {
      const activeIdsSet = new Set(displayedActiveList.map((ad) => ad.id));
      setSelectedIds((prev) => prev.filter((id) => !activeIdsSet.has(id)));
    } else {
      const newSet = new Set(selectedIds);
      displayedActiveList.forEach((ad) => newSet.add(ad.id));
      setSelectedIds(Array.from(newSet));
    }
  };

  const handleToggleSelectActive = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Deleted Selection Handlers
  const isAllDeletedSelected =
    displayedDeletedList.length > 0 &&
    displayedDeletedList.every((ad) => selectedDeletedIds.includes(ad.id));

  const handleToggleSelectAllDeleted = () => {
    if (isAllDeletedSelected) {
      const delIdsSet = new Set(displayedDeletedList.map((ad) => ad.id));
      setSelectedDeletedIds((prev) => prev.filter((id) => !delIdsSet.has(id)));
    } else {
      const newSet = new Set(selectedDeletedIds);
      displayedDeletedList.forEach((ad) => newSet.add(ad.id));
      setSelectedDeletedIds(Array.from(newSet));
    }
  };

  const handleToggleSelectDeleted = (id: string) => {
    setSelectedDeletedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Open Follow-up modal
  const handleOpenActionModal = (aduan: Aduan, status: StatusAduan) => {
    setSelectedAduan(aduan);
    setTargetStatus(status);
    setKeteranganTindakLanjut('');
    setActionError(null);
  };

  // Confirm Follow-up
  const handleConfirmTindakLanjut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keteranganTindakLanjut.trim()) {
      setActionError('Kolom Keterangan Tindak Lanjut WAJIB diisi oleh Wali Kelas.');
      return;
    }

    if (selectedAduan) {
      const namaWali = `${session.nama || 'Wali Kelas'} (${session.kelasAssigned || 'SMAN 4 Berau'})`;
      onUpdateAduanStatus(
        selectedAduan.id,
        targetStatus,
        keteranganTindakLanjut.trim(),
        namaWali
      );
      showNotification(
        `Tindak Lanjut (${targetStatus}) berhasil disimpan! Baris di Google Sheets otomatis berubah warna ${
          targetStatus === 'Dalam Proses' ? 'Kuning' : 'Hijau'
        }.`
      );
      setSelectedAduan(null);
    }
  };

  // Single Delete Trigger
  const handleOpenDeleteSingleModal = (aduan: Aduan) => {
    setDeleteModal({
      isOpen: true,
      type: 'single',
      id: aduan.id,
      title: 'Konfirmasi Hapus Aduan',
      description: `Apakah Anda yakin ingin menghapus aduan "${aduan.jenisKesalahan}" (${aduan.siswaList.join(', ')})?`
    });
  };

  // Bulk Delete Trigger
  const handleOpenDeleteBulkModal = () => {
    if (selectedIds.length === 0) return;
    setDeleteModal({
      isOpen: true,
      type: 'bulk',
      targetIds: selectedIds,
      title: `Konfirmasi Hapus ${selectedIds.length} Aduan`,
      description: `Apakah Anda yakin ingin menghapus ${selectedIds.length} aduan terpilih?`
    });
  };

  // Confirm Deletion
  const handleConfirmDelete = () => {
    if (deleteModal.type === 'single' && deleteModal.id) {
      if (onDeleteAduan) {
        onDeleteAduan(deleteModal.id);
      }
      setSelectedIds((prev) => prev.filter((id) => id !== deleteModal.id));
      showNotification(`Aduan (${deleteModal.id}) berhasil dihapus dan dipindahkan ke Riwayat Terhapus.`);
    } else if (deleteModal.type === 'bulk' && deleteModal.targetIds) {
      if (onDeleteMultipleAduan) {
        onDeleteMultipleAduan(deleteModal.targetIds);
      }
      setSelectedIds([]);
      showNotification(`${deleteModal.targetIds.length} aduan berhasil dihapus secara massal ke Riwayat Terhapus.`);
    }
    setDeleteModal({ isOpen: false, type: 'single', title: '', description: '' });
  };

  // Single Restore Handler
  const handleRestoreSingle = (aduan: Aduan) => {
    if (onRestoreAduan) {
      const restoredItem: Aduan = {
        ...aduan,
        isDeleted: false,
        status: aduan.status === 'Dihapus' ? 'Belum Ditindak Lanjuti' : aduan.status
      };
      onRestoreAduan([restoredItem]);
      setSelectedDeletedIds((prev) => prev.filter((id) => id !== aduan.id));
      showNotification(`Aduan (${aduan.id}) berhasil dipulihkan kembali ke Aduan Aktif.`);
    }
  };

  // Bulk Restore Handler
  const handleRestoreBulk = () => {
    if (selectedDeletedIds.length === 0 || !onRestoreAduan) return;
    const itemsToRestore = displayedDeletedList
      .filter((ad) => selectedDeletedIds.includes(ad.id))
      .map((ad) => ({
        ...ad,
        isDeleted: false,
        status: (ad.status === 'Dihapus' ? 'Belum Ditindak Lanjuti' : ad.status) as StatusAduan
      }));

    onRestoreAduan(itemsToRestore);
    setSelectedDeletedIds([]);
    showNotification(`${itemsToRestore.length} aduan berhasil dipulihkan secara massal ke Aduan Aktif.`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Sudah Ditindak Lanjuti':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-full text-[11px] font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Sudah Ditindak Lanjuti
          </span>
        );
      case 'Dalam Proses':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-1 rounded-full text-[11px] font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            Dalam Proses
          </span>
        );
      case 'Dihapus':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-1 rounded-full text-[11px] font-bold">
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            DIHAPUS
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Belum Ditindak Lanjuti
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-300 rounded-xl shadow-2xl p-4 md:p-6 space-y-6">
      {/* Notice Banner */}
      {notice && (
        <div className="bg-emerald-50 border-2 border-emerald-500 text-emerald-900 px-4 py-3 rounded-xl flex items-center justify-between shadow-md animate-fadeIn">
          <div className="flex items-center gap-2 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Dashboard Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg md:text-xl font-black text-teal-950 uppercase tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-emerald-600" />
            PORTAL WALI KELAS - SAWAL SMAN 4 BERAU
          </h2>
          <p className="text-xs text-slate-600 font-medium mt-0.5">
            Selamat datang, <strong className="text-teal-900">{session.nama}</strong> &bull; Wali Kelas{' '}
            <span className="bg-emerald-700 text-white font-bold px-2 py-0.5 rounded text-[11px]">
              {session.kelasAssigned || 'Semua Kelas'}
            </span>
          </p>
        </div>

        <button
          onClick={onCloseDashboard}
          id="btn-kembali-form-walikelas"
          className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow"
        >
          KEMBALI KE FORM ADUAN
        </button>
      </div>

      {/* Main Sub-Menu Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setMainSubMenu('aduan')}
            id="submenu-aduan-walikelas"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all tracking-tight uppercase shadow-xs ${
              mainSubMenu === 'aduan'
                ? 'bg-teal-900 text-white shadow-md'
                : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4 text-teal-300" />
            <span>1. Aduan & Laporan Murid</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                mainSubMenu === 'aduan'
                  ? 'bg-teal-950 text-teal-200'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {displayedActiveList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMainSubMenu('kelola_kelas')}
            id="submenu-kelola-kelas-walikelas"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition-all tracking-tight uppercase shadow-xs ${
              mainSubMenu === 'kelola_kelas'
                ? 'bg-emerald-800 text-white shadow-md'
                : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-emerald-300" />
            <span>2. Kelola Kelas ({session.kelasAssigned || 'Semua Kelas'})</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                mainSubMenu === 'kelola_kelas'
                  ? 'bg-emerald-950 text-emerald-200'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {
                siswaList.filter(
                  (s) =>
                    !session.kelasAssigned ||
                    s.kelas.trim().toLowerCase() === session.kelasAssigned.trim().toLowerCase()
                ).length
              }
            </span>
          </button>
        </div>

        <div className="text-[11px] font-bold text-slate-500 hidden sm:block">
          Modul Wali Kelas SMA Negeri 4 Berau
        </div>
      </div>

      {mainSubMenu === 'kelola_kelas' ? (
        <WaliKelasKelolaKelasTab
          session={session}
          siswaList={siswaList}
          kelasList={kelasList}
          onUpdateSiswa={onUpdateSiswa}
          showNotification={showNotification}
        />
      ) : (
        <>
          {/* Navigation Tabs (Aduan Aktif vs Riwayat Terhapus) */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex bg-slate-200/80 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('active')}
                id="tab-aduan-aktif-walikelas"
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  viewMode === 'active'
                    ? 'bg-emerald-700 text-white shadow-md'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Aduan Aktif</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    viewMode === 'active' ? 'bg-emerald-900 text-emerald-100' : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {displayedActiveList.length}
                </span>
              </button>

              <button
                onClick={() => setViewMode('deleted')}
                id="tab-riwayat-terhapus-walikelas"
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  viewMode === 'deleted'
                    ? 'bg-rose-700 text-white shadow-md'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Riwayat Terhapus</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    viewMode === 'deleted' ? 'bg-rose-900 text-rose-100' : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {displayedDeletedList.length}
                </span>
              </button>
            </div>
          </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {session.kelasAssigned && (
            <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-2 rounded-lg text-xs font-bold shrink-0 shadow-xs">
              <span>Kelas {session.kelasAssigned}</span>
            </div>
          )}

          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              id="input-search-walikelas"
              placeholder="Cari guru, murid, jenis pelanggaran, atau ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium outline-none focus:border-emerald-600"
            />
          </div>

          {viewMode === 'active' && (
            <select
              value={statusFilter}
              id="select-status-filter-walikelas"
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium outline-none"
            >
              <option value="">-- Semua Status --</option>
              <option value="Belum Ditindak Lanjuti">Belum Ditindak Lanjuti</option>
              <option value="Dalam Proses">Dalam Proses</option>
              <option value="Sudah Ditindak Lanjuti">Sudah Ditindak Lanjuti</option>
            </select>
          )}
        </div>

        <div className="text-xs font-bold text-slate-600">
          Total: <span className="text-emerald-700 font-extrabold">
            {viewMode === 'active' ? displayedActiveList.length : displayedDeletedList.length} Laporan
          </span>
        </div>
      </div>

      {/* Bulk Action Toolbar for Active Items */}
      {viewMode === 'active' && selectedIds.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-400 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
            <CheckSquare className="w-4 h-4 text-amber-700" />
            <span>{selectedIds.length} Aduan Terpilih</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              id="btn-batalkan-pilihan-active"
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
            >
              Batalkan Pilihan
            </button>
            <button
              onClick={handleOpenDeleteBulkModal}
              id="btn-hapus-massal-walikelas"
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg flex items-center gap-1.5 shadow transition-all active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>HAPUS ({selectedIds.length}) ADUAN TERPILIH</span>
            </button>
          </div>
        </div>
      )}

      {/* Bulk Action Toolbar for Deleted Items */}
      {viewMode === 'deleted' && selectedDeletedIds.length > 0 && (
        <div className="bg-emerald-50 border-2 border-emerald-400 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
            <CheckSquare className="w-4 h-4 text-emerald-700" />
            <span>{selectedDeletedIds.length} Aduan Terhapus Terpilih</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDeletedIds([])}
              id="btn-batalkan-pilihan-deleted"
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
            >
              Batalkan Pilihan
            </button>
            <button
              onClick={handleRestoreBulk}
              id="btn-pulihkan-massal-walikelas"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg flex items-center gap-1.5 shadow transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>PULIHKAN ({selectedDeletedIds.length}) ADUAN</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW 1: ACTIVE ADUAN TABLE */}
      {viewMode === 'active' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead className="bg-emerald-900 text-white uppercase text-[10px] font-extrabold tracking-wider">
                <tr>
                  <th className="p-3 text-center w-10">
                    <button
                      type="button"
                      onClick={handleToggleSelectAllActive}
                      className="text-white hover:text-emerald-200 flex items-center justify-center"
                      title={isAllActiveSelected ? 'Batalkan Pilih Semua' : 'Pilih Semua'}
                    >
                      {isAllActiveSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-300" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-3">ID / Tanggal</th>
                  <th className="p-3">Guru & Mapel</th>
                  <th className="p-3">Kelas</th>
                  <th className="p-3">Murid Melanggar</th>
                  <th className="p-3">Jenis Kesalahan & Kronologi</th>
                  <th className="p-3">Status Saat Ini</th>
                  <th className="p-3 text-center min-w-[210px]">Aksi Tindak Lanjut & Hapus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {displayedActiveList.map((ad, idx) => {
                  const isSelected = selectedIds.includes(ad.id);
                  const isDalamProses = ad.status === 'Dalam Proses';
                  const isSelesai = ad.status === 'Sudah Ditindak Lanjuti';

                  let rowBgClass = 'hover:bg-emerald-50/40';
                  if (isSelected) {
                    rowBgClass = 'bg-amber-50/80';
                  } else if (isDalamProses) {
                    rowBgClass = 'bg-amber-50/40 hover:bg-amber-50/70';
                  } else if (isSelesai) {
                    rowBgClass = 'bg-emerald-50/40 hover:bg-emerald-50/70';
                  }

                  return (
                    <tr key={`${ad.id}-${idx}`} className={`${rowBgClass} transition-colors`}>
                      {/* Checkbox */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectActive(ad.id)}
                          className="text-slate-600 hover:text-emerald-700 flex items-center justify-center"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </td>

                      {/* ID / Tanggal */}
                      <td className="p-3 font-mono">
                        <span className="font-bold text-teal-900 block text-[10px]">{ad.id}</span>
                        <span className="text-slate-500 text-[10px]">{ad.timestampAduan}</span>
                      </td>

                      {/* Guru & Mapel */}
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{ad.namaGuru}</span>
                        <span className="text-[10px] text-teal-700 font-bold">{ad.mapel}</span>
                      </td>

                      {/* Kelas */}
                      <td className="p-3 font-black text-blue-900">{ad.kelas}</td>

                      {/* Siswa */}
                      <td className="p-3 min-w-[150px]">
                        <div className="flex flex-wrap gap-1">
                          {ad.siswaList.map((s, i) => (
                            <span
                              key={i}
                              className="bg-slate-100 text-slate-800 text-[10px] px-1.5 py-0.5 rounded border border-slate-200 font-bold"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Kesalahan & Foto */}
                      <td className="p-3 max-w-sm">
                        <span className="font-bold text-slate-900 block">{ad.jenisKesalahan}</span>
                        {ad.keteranganLainnya && (
                          <span className="text-[10px] text-slate-600 block italic">
                            Ket: {ad.keteranganLainnya}
                          </span>
                        )}
                        {ad.catatanKronologi && (
                          <div className="text-[10px] text-amber-900 bg-amber-50 p-1.5 rounded mt-1 border border-amber-200">
                            <strong>Kronologi:</strong> {ad.catatanKronologi}
                          </div>
                        )}
                        <div className="mt-1.5">
                          <PhotoGalleryViewer
                            fotoBukti={ad.fotoBukti}
                            fotoBuktiList={ad.fotoBuktiList}
                            title={`Bukti Foto (${ad.id})`}
                            compact={true}
                          />
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3 min-w-[160px]">
                        <div className="mb-1">{getStatusBadge(ad.status)}</div>
                        {ad.tindakLanjutHistory && ad.tindakLanjutHistory.length > 0 && (
                          <div className="text-[9px] bg-slate-50 p-2 rounded border border-slate-200 mt-1 space-y-1">
                            <span className="font-bold text-teal-900 block">Riwayat Tindakan:</span>
                            {ad.tindakLanjutHistory.map((tl, i) => (
                              <div key={i} className="border-b border-slate-200 pb-1 last:border-none">
                                <span className="font-semibold text-slate-800">{tl.olehWaliKelas}</span> ({tl.timestamp}):
                                <p className="italic text-slate-600">"{tl.keterangan}"</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="p-3 text-center min-w-[210px]">
                        <div className="flex flex-col gap-1.5 justify-center">
                          {/* Proses Tindak Lanjut Button */}
                          <button
                            onClick={() => handleOpenActionModal(ad, 'Dalam Proses')}
                            id={`btn-proses-${ad.id}`}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-1.5 px-3 rounded text-[10px] uppercase tracking-wide shadow flex items-center justify-center gap-1 transition-all active:scale-95"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            PROSES TINDAK LANJUT
                          </button>

                          {/* Sudah Ditindak Lanjuti Button */}
                          <button
                            onClick={() => handleOpenActionModal(ad, 'Sudah Ditindak Lanjuti')}
                            id={`btn-selesai-${ad.id}`}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded text-[10px] uppercase tracking-wide shadow flex items-center justify-center gap-1 transition-all active:scale-95"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            SUDAH DITINDAK LANJUTI
                          </button>

                          {/* Hapus Button */}
                          <button
                            onClick={() => handleOpenDeleteSingleModal(ad)}
                            id={`btn-hapus-aduan-${ad.id}`}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold py-1 px-2.5 rounded text-[10px] uppercase tracking-wide flex items-center justify-center gap-1 transition-all active:scale-95"
                            title="Hapus Aduan ke Riwayat Terhapus"
                          >
                            <Trash2 className="w-3 h-3 text-rose-600" />
                            HAPUS ADUAN
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {displayedActiveList.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-xs text-slate-400 italic">
                      Belum ada aduan aktif yang terdaftar untuk filter ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: DELETED ADUAN TABLE (RIWAYAT TERHAPUS) */}
      {viewMode === 'deleted' && (
        <div className="bg-white rounded-xl border border-rose-200 overflow-hidden shadow-sm">
          <div className="p-3 bg-rose-50 border-b border-rose-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
              <History className="w-4 h-4 text-rose-600" />
              <span>Daftar Riwayat Aduan Terhapus</span>
            </div>
            <div className="text-[11px] text-rose-700">
              Data yang dihapus tersimpan di sini dan dapat dipulihkan kapan saja.
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead className="bg-rose-900 text-white uppercase text-[10px] font-extrabold tracking-wider">
                <tr>
                  <th className="p-3 text-center w-10">
                    <button
                      type="button"
                      onClick={handleToggleSelectAllDeleted}
                      className="text-white hover:text-rose-200 flex items-center justify-center"
                      title={isAllDeletedSelected ? 'Batalkan Pilih Semua' : 'Pilih Semua'}
                    >
                      {isAllDeletedSelected ? (
                        <CheckSquare className="w-4 h-4 text-rose-300" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-3">ID / Tanggal</th>
                  <th className="p-3">Guru & Mapel</th>
                  <th className="p-3">Kelas</th>
                  <th className="p-3">Murid Melanggar</th>
                  <th className="p-3">Jenis Kesalahan</th>
                  <th className="p-3">Waktu & Pembuat Hapus</th>
                  <th className="p-3 text-center min-w-[140px]">Aksi Pulihkan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100 font-medium">
                {displayedDeletedList.map((ad, idx) => {
                  const isSelected = selectedDeletedIds.includes(ad.id);
                  return (
                    <tr
                      key={`${ad.id}-${idx}`}
                      className={`${
                        isSelected ? 'bg-rose-100' : 'bg-rose-50/50 hover:bg-rose-100/70'
                      } transition-colors`}
                    >
                      {/* Checkbox */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectDeleted(ad.id)}
                          className="text-slate-600 hover:text-rose-700 flex items-center justify-center"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-rose-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </td>

                      {/* ID / Tanggal */}
                      <td className="p-3 font-mono">
                        <span className="font-bold text-rose-950 block text-[10px]">{ad.id}</span>
                        <span className="text-slate-500 text-[10px]">{ad.timestampAduan}</span>
                      </td>

                      {/* Guru & Mapel */}
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{ad.namaGuru}</span>
                        <span className="text-[10px] text-teal-700 font-bold">{ad.mapel}</span>
                      </td>

                      {/* Kelas */}
                      <td className="p-3 font-black text-blue-900">{ad.kelas}</td>

                      {/* Siswa */}
                      <td className="p-3 min-w-[140px]">
                        <div className="flex flex-wrap gap-1">
                          {ad.siswaList.map((s, i) => (
                            <span
                              key={i}
                              className="bg-white text-slate-800 text-[10px] px-1.5 py-0.5 rounded border border-rose-200 font-bold"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Kesalahan */}
                      <td className="p-3 max-w-xs">
                        <span className="font-bold text-slate-900 block">{ad.jenisKesalahan}</span>
                        {ad.keteranganLainnya && (
                          <span className="text-[10px] text-slate-600 block italic">
                            Ket: {ad.keteranganLainnya}
                          </span>
                        )}
                        <div className="mt-1">
                          <PhotoGalleryViewer
                            fotoBukti={ad.fotoBukti}
                            fotoBuktiList={ad.fotoBuktiList}
                            title={`Bukti Foto (${ad.id})`}
                            compact={true}
                          />
                        </div>
                      </td>

                      {/* Waktu Hapus */}
                      <td className="p-3 text-[10px]">
                        <span className="inline-block bg-rose-200 text-rose-900 font-bold px-2 py-0.5 rounded mb-1">
                          DIHAPUS
                        </span>
                        <div className="text-slate-600">
                          {ad.deletedAt || 'Waktu Hapus Tidak Tercatat'}
                        </div>
                        <div className="text-slate-500 italic">
                          Oleh: <strong>{ad.deletedBy || 'Wali Kelas / Admin'}</strong>
                        </div>
                      </td>

                      {/* Restore Action */}
                      <td className="p-3 text-center min-w-[140px]">
                        <button
                          onClick={() => handleRestoreSingle(ad)}
                          id={`btn-restore-${ad.id}`}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded text-[10px] uppercase tracking-wide shadow flex items-center justify-center gap-1 transition-all active:scale-95 mx-auto"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          PULIHKAN
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {displayedDeletedList.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-xs text-slate-400 italic">
                      Tidak ada riwayat aduan yang terhapus untuk filter ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tindak Lanjut Action Modal (Wajib Keterangan + Auto Timestamp) */}
      {selectedAduan && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border-2 border-emerald-600 animate-scaleUp space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-extrabold text-slate-900 uppercase">
                  Form Tindak Lanjut Wali Kelas
                </h3>
              </div>
              <button
                onClick={() => setSelectedAduan(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <p className="font-bold text-teal-900">
                Aduan ID: <span className="font-mono text-slate-700">{selectedAduan.id}</span>
              </p>
              <p>
                <strong>Murid Melanggar:</strong> {selectedAduan.siswaList.join(', ')} ({selectedAduan.kelas})
              </p>
              <p>
                <strong>Kesalahan:</strong> {selectedAduan.jenisKesalahan}
              </p>
            </div>

            {/* Target Status Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-800 uppercase block">
                Pilih Status Tindak Lanjut:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetStatus('Dalam Proses')}
                  id="btn-select-status-proses"
                  className={`p-2.5 rounded-lg border-2 text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    targetStatus === 'Dalam Proses'
                      ? 'bg-amber-100 border-amber-500 text-amber-900 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Dalam Proses (Kuning)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetStatus('Sudah Ditindak Lanjuti')}
                  id="btn-select-status-selesai"
                  className={`p-2.5 rounded-lg border-2 text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    targetStatus === 'Sudah Ditindak Lanjuti'
                      ? 'bg-emerald-100 border-emerald-500 text-emerald-900 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Selesai (Hijau)</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleConfirmTindakLanjut} className="space-y-3">
              {actionError && (
                <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded">
                  {actionError}
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-800 uppercase block mb-1">
                  Keterangan & Hasil Tindak Lanjut <span className="text-rose-600">* WAJIB DIISI</span>
                </label>
                <textarea
                  id="textarea-keterangan-walikelas"
                  rows={4}
                  placeholder="Tuliskan detail pembinaan, pemanggilan orang tua, sanksi, atau solusi yang telah/sedang dilakukan..."
                  value={keteranganTindakLanjut}
                  onChange={(e) => setKeteranganTindakLanjut(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  required
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAduan(null)}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2.5 rounded-lg text-xs uppercase"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-confirm-tindaklanjut"
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider shadow"
                >
                  Simpan & Sinkron ke Sheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Single & Bulk) */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-rose-600 animate-scaleUp space-y-4">
            <div className="flex items-center justify-between border-b pb-3 text-rose-600">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-6 h-6 text-rose-600" />
                <h3 className="text-sm font-extrabold text-slate-900 uppercase">
                  {deleteModal.title}
                </h3>
              </div>
              <button
                onClick={() => setDeleteModal({ isOpen: false, type: 'single', title: '', description: '' })}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {deleteModal.description}
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, type: 'single', title: '', description: '' })}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2.5 rounded-lg text-xs uppercase"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                id="btn-confirm-delete-walikelas"
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider shadow"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
