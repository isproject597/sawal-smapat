import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Plus,
  Trash2,
  Search,
  RotateCcw,
  History,
  AlertOctagon,
  Clock,
  Download,
  Upload,
  Filter,
  Pencil,
  CheckCircle2,
  X,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ArrowUpAZ,
  ArrowDownAZ
} from 'lucide-react';
import { Siswa, Kelas } from '../../types';
import { downloadExcelTemplate } from '../../utils/excelHelper';
import { getFullTimestamp } from '../../utils/dateHelper';
import { recordDeletedSiswa, saveDeletedSiswa } from '../../data/storage';
import { triggerBackgroundAutoSync } from '../../services/googleSheets';

export type SortField = 'nama' | 'nis' | 'kelas' | 'waktu';
export type SortDirection = 'asc' | 'desc';

interface KelolaMuridTabProps {
  siswaList: Siswa[];
  kelasList: Kelas[];
  deletedSiswaList: Siswa[];
  onUpdateSiswa: (list: Siswa[]) => void;
  onUpdateDeletedSiswa: (list: Siswa[]) => void;
  onOpenExcelModal: () => void;
  setDeleteModal: (modal: any) => void;
  setNotice: (msg: string | null) => void;
  getFormattedDelTimestamp: () => string;
}

export const KelolaMuridTab: React.FC<KelolaMuridTabProps> = ({
  siswaList,
  kelasList,
  deletedSiswaList,
  onUpdateSiswa,
  onUpdateDeletedSiswa,
  onOpenExcelModal,
  setDeleteModal,
  setNotice,
  getFormattedDelTimestamp
}) => {
  const [viewMode, setViewMode] = useState<'active' | 'history'>('active');
  const [historySubTab, setHistorySubTab] = useState<'deleted' | 'edited'>('deleted');
  const [search, setSearch] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedDeletedIds, setSelectedDeletedIds] = useState<string[]>([]);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('nama');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Form states (Add)
  const [newNama, setNewNama] = useState('');
  const [newNis, setNewNis] = useState('');
  const [newKelas, setNewKelas] = useState('');

  // Edit states
  const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null);
  const [editNama, setEditNama] = useState('');
  const [editNis, setEditNis] = useState('');
  const [editKelas, setEditKelas] = useState('');

  const startEdit = (s: Siswa) => {
    setEditingSiswa(s);
    setEditNama(s.nama);
    setEditNis(s.nis || '');
    setEditKelas(s.kelas);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSiswa || !editNama.trim() || !editKelas) return;

    const trimmedNama = editNama.trim();
    const trimmedNis = editNis.trim() || undefined;
    const selectedKelas = editKelas;

    // Track detailed field differences
    const changes: string[] = [];
    if (editingSiswa.nama !== trimmedNama) {
      changes.push(`Nama Murid: "${editingSiswa.nama}" ➔ "${trimmedNama}"`);
    }
    if ((editingSiswa.nis || '-') !== (trimmedNis || '-')) {
      changes.push(`NIS: "${editingSiswa.nis || '-'}" ➔ "${trimmedNis || '-'}"`);
    }
    if (editingSiswa.kelas !== selectedKelas) {
      changes.push(`Kelas: "${editingSiswa.kelas}" ➔ "${selectedKelas}"`);
    }

    if (changes.length === 0) {
      setEditingSiswa(null);
      return;
    }

    const timestamp = getFullTimestamp();
    const newLog = `[${timestamp}] DIEDIT (Admin): ${changes.join(' | ')}`;
    const combinedHistory = editingSiswa.editHistory ? `${newLog}\n${editingSiswa.editHistory}` : newLog;

    const updatedItem: Siswa = {
      ...editingSiswa,
      nama: trimmedNama,
      nis: trimmedNis,
      kelas: selectedKelas,
      isEdited: true,
      editedAt: timestamp,
      editedBy: 'Admin',
      editHistory: combinedHistory
    };

    const updatedList = siswaList.map((s) => (s.id === editingSiswa.id ? updatedItem : s));
    onUpdateSiswa(updatedList);
    setEditingSiswa(null);
    setNotice(`✅ Data murid "${updatedItem.nama}" (${updatedItem.kelas}) berhasil diperbarui. Perubahan & timestamp otomatis terblok kuning di Google Sheets.`);
    setTimeout(() => setNotice(null), 5000);
  };

  // Filtering
  const filteredActive = siswaList.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      s.nama.toLowerCase().includes(q) ||
      (s.nis && s.nis.toLowerCase().includes(q)) ||
      s.kelas.toLowerCase().includes(q);
    const matchKelas = !filterKelas || s.kelas === filterKelas;
    return matchSearch && matchKelas;
  });

  const filteredDeleted = deletedSiswaList.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      s.nama.toLowerCase().includes(q) ||
      (s.nis && s.nis.toLowerCase().includes(q)) ||
      s.kelas.toLowerCase().includes(q);
    const matchKelas = !filterKelas || s.kelas === filterKelas;
    return matchSearch && matchKelas;
  });

  const editedSiswaList = siswaList.filter((s) => s.isEdited || s.editHistory);
  const filteredEdited = editedSiswaList.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      s.nama.toLowerCase().includes(q) ||
      (s.nis && s.nis.toLowerCase().includes(q)) ||
      s.kelas.toLowerCase().includes(q) ||
      (s.editHistory && s.editHistory.toLowerCase().includes(q));
    const matchKelas = !filterKelas || s.kelas === filterKelas;
    return matchSearch && matchKelas;
  });

  // Sorting Helper Function
  const sortStudents = (list: Siswa[], field: SortField, dir: SortDirection): Siswa[] => {
    return [...list].sort((a, b) => {
      let comparison = 0;
      if (field === 'nama') {
        comparison = a.nama.localeCompare(b.nama, 'id', { sensitivity: 'base', numeric: true });
      } else if (field === 'nis') {
        const nisA = (a.nis || '').trim();
        const nisB = (b.nis || '').trim();
        if (!nisA && !nisB) comparison = 0;
        else if (!nisA) comparison = 1;
        else if (!nisB) comparison = -1;
        else comparison = nisA.localeCompare(nisB, 'id', { numeric: true });
      } else if (field === 'kelas') {
        comparison = a.kelas.localeCompare(b.kelas, 'id', { numeric: true });
      } else if (field === 'waktu') {
        const timeA = a.editedAt || a.deletedAt || a.id || '';
        const timeB = b.editedAt || b.deletedAt || b.id || '';
        comparison = timeA.localeCompare(timeB);
      }
      return dir === 'asc' ? comparison : -comparison;
    });
  };

  const sortedActive = useMemo(
    () => sortStudents(filteredActive, sortField, sortDirection),
    [filteredActive, sortField, sortDirection]
  );

  const sortedDeleted = useMemo(
    () => sortStudents(filteredDeleted, sortField, sortDirection),
    [filteredDeleted, sortField, sortDirection]
  );

  const sortedEdited = useMemo(
    () => sortStudents(filteredEdited, sortField, sortDirection),
    [filteredEdited, sortField, sortDirection]
  );

  const handleSortToggle = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Active selection
  const isAllActiveSelected =
    sortedActive.length > 0 && sortedActive.every((s) => selectedIds.includes(s.id));

  const handleToggleSelectAllActive = () => {
    if (isAllActiveSelected) {
      const activeIdsSet = new Set(sortedActive.map((s) => s.id));
      setSelectedIds((prev) => prev.filter((id) => !activeIdsSet.has(id)));
    } else {
      const newSet = new Set(selectedIds);
      sortedActive.forEach((s) => newSet.add(s.id));
      setSelectedIds(Array.from(newSet));
    }
  };

  const handleToggleSelectActive = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Deleted selection
  const isAllDeletedSelected =
    sortedDeleted.length > 0 &&
    sortedDeleted.every((s) => selectedDeletedIds.includes(s.id));

  const handleToggleSelectAllDeleted = () => {
    if (isAllDeletedSelected) {
      const delIdsSet = new Set(sortedDeleted.map((s) => s.id));
      setSelectedDeletedIds((prev) => prev.filter((id) => !delIdsSet.has(id)));
    } else {
      const newSet = new Set(selectedDeletedIds);
      sortedDeleted.forEach((s) => newSet.add(s.id));
      setSelectedDeletedIds(Array.from(newSet));
    }
  };

  const handleToggleSelectDeleted = (id: string) => {
    setSelectedDeletedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Actions
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNama.trim() || !newKelas) return;
    const newItem: Siswa = {
      id: `s_${Date.now()}`,
      nama: newNama.trim(),
      nis: newNis.trim() || undefined,
      kelas: newKelas
    };
    onUpdateSiswa([...siswaList, newItem]);
    setNewNama('');
    setNewNis('');
    setNotice(`✅ Murid "${newItem.nama}" (${newItem.kelas}) berhasil ditambahkan.`);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleDeleteSingle = (id: string, nama?: string, kelas?: string) => {
    setDeleteModal({
      isOpen: true,
      type: 'master',
      title: 'Hapus Data Murid?',
      description: nama
        ? `Apakah Anda yakin ingin menghapus data murid "${nama}" (${kelas || '-'})? Data akan dipindahkan ke Riwayat Terhapus dan otomatis diberi tanda Blok Merah di Google Sheets.`
        : 'Apakah Anda yakin ingin menghapus data murid ini? Data akan dipindahkan ke Riwayat Terhapus dan otomatis diberi tanda Blok Merah di Google Sheets.',
      onConfirm: () => {
        const target = siswaList.find((s) => s.id === id);
        if (target) {
          const deletedRecord: Siswa = {
            ...target,
            isDeleted: true,
            deletedAt: getFormattedDelTimestamp(),
            deletedBy: 'Admin'
          };
          const updatedDeleted = recordDeletedSiswa([deletedRecord]);
          onUpdateDeletedSiswa(updatedDeleted);
        }
        const remaining = siswaList.filter((s) => s.id !== id);
        onUpdateSiswa(remaining);
        setSelectedIds((prev) => prev.filter((item) => item !== id));
        setDeleteModal(null);
        setNotice(`✅ Data murid "${nama || id}" telah dihapus & dicatat di Google Sheets (terblok merah).`);
        setTimeout(() => setNotice(null), 5000);
      }
    });
  };

  const handleDeleteBulk = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    const targets = siswaList.filter((s) => selectedIds.includes(s.id));
    const targetNames = targets.map((s) => `${s.nama} (${s.kelas})`).slice(0, 5).join(', ') + (count > 5 ? ` dan ${count - 5} lainnya` : '');

    setDeleteModal({
      isOpen: true,
      type: 'bulk',
      title: `Hapus ${count} Data Murid Terpilih?`,
      description: `Apakah Anda yakin ingin menghapus ${count} data murid (${targetNames})? Seluruh data terpilih akan dipindahkan ke Riwayat Terhapus dan otomatis diberi tanda Blok Merah di Google Sheets.`,
      onConfirm: () => {
        const deletedRecords: Siswa[] = targets.map((t) => ({
          ...t,
          isDeleted: true,
          deletedAt: getFormattedDelTimestamp(),
          deletedBy: 'Admin'
        }));
        const updatedDeleted = recordDeletedSiswa(deletedRecords);
        onUpdateDeletedSiswa(updatedDeleted);

        const remaining = siswaList.filter((s) => !selectedIds.includes(s.id));
        onUpdateSiswa(remaining);
        setSelectedIds([]);
        setDeleteModal(null);
        setNotice(`✅ ${count} data murid terpilih telah dihapus & dicatat di Google Sheets (terblok merah).`);
        setTimeout(() => setNotice(null), 5000);
      }
    });
  };

  const handleRestoreSingle = (id: string) => {
    const target = deletedSiswaList.find((s) => s.id === id);
    if (!target) return;
    const restored: Siswa = { ...target, isDeleted: false, deletedAt: undefined, deletedBy: undefined };
    const newDeleted = deletedSiswaList.filter((s) => s.id !== id);
    saveDeletedSiswa(newDeleted);
    onUpdateDeletedSiswa(newDeleted);
    onUpdateSiswa([...siswaList, restored]);
    setSelectedDeletedIds((prev) => prev.filter((item) => item !== id));
    setNotice(`✅ Murid "${target.nama}" (${target.kelas}) berhasil dipulihkan.`);
    setTimeout(() => setNotice(null), 5000);
  };

  const handleRestoreBulk = () => {
    if (selectedDeletedIds.length === 0) return;
    const targets = deletedSiswaList.filter((s) => selectedDeletedIds.includes(s.id));
    const restoredList: Siswa[] = targets.map((t) => ({
      ...t,
      isDeleted: false,
      deletedAt: undefined,
      deletedBy: undefined
    }));
    const newDeleted = deletedSiswaList.filter((s) => !selectedDeletedIds.includes(s.id));
    saveDeletedSiswa(newDeleted);
    onUpdateDeletedSiswa(newDeleted);
    onUpdateSiswa([...siswaList, ...restoredList]);
    setSelectedDeletedIds([]);
    setNotice(`✅ ${targets.length} data murid berhasil dipulihkan ke daftar aktif.`);
    setTimeout(() => setNotice(null), 5000);
  };

  const handlePermanentDeleteSingle = (id: string, nama?: string) => {
    setDeleteModal({
      isOpen: true,
      type: 'master',
      title: 'Hapus Permanen dari Riwayat?',
      description: `Hapus murid "${nama || id}" secara permanen dari histori? Tindakan ini tidak dapat dibatalkan.`,
      onConfirm: () => {
        const newDeleted = deletedSiswaList.filter((s) => s.id !== id);
        saveDeletedSiswa(newDeleted);
        onUpdateDeletedSiswa(newDeleted);
        setSelectedDeletedIds((prev) => prev.filter((item) => item !== id));
        triggerBackgroundAutoSync('murid', { siswaList, deletedSiswaList: newDeleted });
        setDeleteModal(null);
        setNotice(`✅ Murid "${nama || id}" dihapus permanen dari riwayat.`);
        setTimeout(() => setNotice(null), 4000);
      }
    });
  };

  const handlePermanentDeleteBulk = () => {
    if (selectedDeletedIds.length === 0) return;
    const count = selectedDeletedIds.length;
    setDeleteModal({
      isOpen: true,
      type: 'bulk',
      title: `Hapus Permanen ${count} Riwayat Murid?`,
      description: `Hapus ${count} riwayat murid terpilih secara permanen? Data yang telah dihapus permanen tidak dapat dipulihkan kembali.`,
      onConfirm: () => {
        const newDeleted = deletedSiswaList.filter((s) => !selectedDeletedIds.includes(s.id));
        saveDeletedSiswa(newDeleted);
        onUpdateDeletedSiswa(newDeleted);
        setSelectedDeletedIds([]);
        triggerBackgroundAutoSync('murid', { siswaList, deletedSiswaList: newDeleted });
        setDeleteModal(null);
        setNotice(`✅ ${count} riwayat murid berhasil dihapus permanen.`);
        setTimeout(() => setNotice(null), 4000);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('active')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'active'
                ? 'bg-teal-800 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Murid Aktif ({siswaList.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('history')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'history'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            <History className="w-3.5 h-3.5 text-amber-500" />
            <span>Riwayat</span>
            {(deletedSiswaList.length > 0 || editedSiswaList.length > 0) && (
              <span className="bg-amber-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-black">
                {deletedSiswaList.length + editedSiswaList.length}
              </span>
            )}
          </button>
        </div>

        {viewMode === 'active' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => downloadExcelTemplate('siswa')}
              className="flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-300 transition-colors"
            >
              <Download className="w-3 h-3" /> Template
            </button>
            <button
              type="button"
              onClick={onOpenExcelModal}
              className="flex items-center gap-1 text-[11px] font-black text-emerald-950 bg-emerald-400 hover:bg-emerald-300 px-3 py-1.5 rounded-lg shadow-xs transition-colors"
            >
              <Upload className="w-3 h-3" /> Upload Excel
            </button>
          </div>
        )}
      </div>

      {viewMode === 'active' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Tambah Siswa */}
          <form onSubmit={handleAdd} className="bg-white p-5 rounded-xl border border-slate-200 space-y-3 shadow-xs h-fit">
            <h3 className="text-xs font-extrabold text-teal-900 uppercase flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-600" /> Tambah Murid Manual
            </h3>
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase block">Nama Lengkap Murid *</label>
              <input
                type="text"
                placeholder="Contoh: Ahmad Dahlan"
                value={newNama}
                onChange={(e) => setNewNama(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-xs outline-none focus:border-teal-500"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase block">NIS / NISN Murid</label>
              <input
                type="text"
                placeholder="Contoh: 202410012"
                value={newNis}
                onChange={(e) => setNewNis(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-xs outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase block">Kelas Murid *</label>
              <select
                value={newKelas}
                onChange={(e) => setNewKelas(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-xs outline-none focus:border-teal-500"
                required
              >
                <option value="">-- Pilih Kelas --</option>
                {kelasList.map((k) => (
                  <option key={k.id} value={k.nama}>
                    {k.nama}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-2 rounded text-xs uppercase shadow-xs active:scale-95 transition-all"
            >
              Simpan Murid
            </button>
          </form>

          {/* Table & Bulk Selection Area */}
          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            {/* Filter & Sort toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nama murid, NIS..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs outline-none focus:border-teal-500"
                />
              </div>

              <select
                value={filterKelas}
                onChange={(e) => setFilterKelas(e.target.value)}
                className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs outline-none font-medium"
              >
                <option value="">-- Semua Kelas --</option>
                {kelasList.map((k) => (
                  <option key={k.id} value={k.nama}>
                    {k.nama}
                  </option>
                ))}
              </select>

              {/* Sort controls */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[11px] font-bold text-slate-600">Urut:</span>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as SortField)}
                  aria-label="Pilih kolom pengurutan data murid admin"
                  className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
                >
                  <option value="nama">Nama</option>
                  <option value="nis">NIS</option>
                  <option value="kelas">Kelas</option>
                  <option value="waktu">Waktu</option>
                </select>
              </div>

              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSortDirection('asc')}
                  title="Urutan Menaik (A-Z, 0-9)"
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-all ${
                    sortDirection === 'asc'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ArrowUpAZ className="w-3 h-3" />
                  <span className="text-[10px]">Asc (A-Z)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSortDirection('desc')}
                  title="Urutan Menurun (Z-A, 9-0)"
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-all ${
                    sortDirection === 'desc'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ArrowDownAZ className="w-3 h-3" />
                  <span className="text-[10px]">Desc (Z-A)</span>
                </button>
              </div>

              <span className="text-xs font-bold text-slate-500">
                {sortedActive.length} murid
              </span>
            </div>

            {/* Bulk Action Banner */}
            {selectedIds.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 bg-rose-50 border-2 border-rose-300 p-3 rounded-xl shadow-xs text-rose-950">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="bg-rose-600 text-white font-black px-2.5 py-0.5 rounded-full text-xs shadow-xs">
                    {selectedIds.length}
                  </span>
                  <span>Murid dipilih</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteBulk}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-black rounded-lg flex items-center gap-1.5 shadow-xs transition-all border border-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>HAPUS TERPILIH ({selectedIds.length})</span>
                  </button>
                </div>
              </div>
            )}

            {/* Table with Checkboxes */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-96">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 text-[10px] font-black uppercase sticky top-0 z-10">
                  <tr>
                    <th className="p-2.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllActiveSelected}
                        onChange={handleToggleSelectAllActive}
                        className="w-4 h-4 text-teal-600 rounded cursor-pointer accent-teal-600"
                        title={isAllActiveSelected ? 'Batalkan Pilih Semua' : 'Pilih Semua'}
                      />
                    </th>
                    <th className="p-2.5">No</th>
                    <th
                      className="p-2.5 cursor-pointer select-none hover:bg-slate-200 transition-colors"
                      onClick={() => handleSortToggle('nama')}
                      title="Klik untuk ubah urutan Nama"
                    >
                      <div className="flex items-center gap-1">
                        <span>Nama Murid</span>
                        {sortField === 'nama' ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3 h-3 text-teal-700" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-teal-700" />
                          )
                        ) : (
                          <ArrowUpDown className="w-2.5 h-2.5 text-slate-400" />
                        )}
                      </div>
                    </th>
                    <th
                      className="p-2.5 cursor-pointer select-none hover:bg-slate-200 transition-colors"
                      onClick={() => handleSortToggle('nis')}
                      title="Klik untuk ubah urutan NIS"
                    >
                      <div className="flex items-center gap-1">
                        <span>NIS / NISN</span>
                        {sortField === 'nis' ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3 h-3 text-teal-700" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-teal-700" />
                          )
                        ) : (
                          <ArrowUpDown className="w-2.5 h-2.5 text-slate-400" />
                        )}
                      </div>
                    </th>
                    <th
                      className="p-2.5 cursor-pointer select-none hover:bg-slate-200 transition-colors"
                      onClick={() => handleSortToggle('kelas')}
                      title="Klik untuk ubah urutan Kelas"
                    >
                      <div className="flex items-center gap-1">
                        <span>Kelas</span>
                        {sortField === 'kelas' ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3 h-3 text-teal-700" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-teal-700" />
                          )
                        ) : (
                          <ArrowUpDown className="w-2.5 h-2.5 text-slate-400" />
                        )}
                      </div>
                    </th>
                    <th className="p-2.5 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedActive.map((s, idx) => {
                    const isChecked = selectedIds.includes(s.id);
                    return (
                      <tr
                        key={s.id}
                        className={`transition-colors ${isChecked ? 'bg-teal-50' : 'hover:bg-slate-50'}`}
                      >
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelectActive(s.id)}
                            className="w-4 h-4 text-teal-600 rounded cursor-pointer accent-teal-600"
                          />
                        </td>
                        <td className="p-2.5 font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-slate-900">
                          <span>{s.nama}</span>
                        </td>
                        <td className="p-2.5 text-slate-600 font-mono text-[11px]">{s.nis || '-'}</td>
                        <td className="p-2.5">
                          <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold">
                            {s.kelas}
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => startEdit(s)}
                              id={`btn-edit-murid-${s.id}`}
                              className="text-amber-600 hover:text-amber-800 p-1.5 rounded hover:bg-amber-50 transition-colors"
                              title="Edit Data Murid"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSingle(s.id, s.nama, s.kelas)}
                              id={`btn-delete-murid-${s.id}`}
                              className="text-rose-600 hover:text-rose-800 p-1.5 rounded hover:bg-rose-50 transition-colors"
                              title="Hapus Murid"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {sortedActive.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-xs text-slate-400 italic">
                        {siswaList.length === 0 ? 'Belum ada murid aktif.' : 'Tidak ada murid yang sesuai filter.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Unified History View */
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          {/* Sub-tabs for History: Riwayat Hapus vs Riwayat Edit */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <button
              type="button"
              onClick={() => setHistorySubTab('deleted')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                historySubTab === 'deleted'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Riwayat Hapus ({deletedSiswaList.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setHistorySubTab('edited')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                historySubTab === 'edited'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Riwayat Edit ({editedSiswaList.length})</span>
            </button>
          </div>

          {historySubTab === 'deleted' ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-rose-100/70 p-3.5 rounded-lg border border-rose-300 text-rose-900">
                <AlertOctagon className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <strong className="block font-bold">Riwayat Penghapusan Murid (Bisa Dipulihkan & Terblok Merah di Google Sheets)</strong>
                  Data murid di bawah ini telah dihapus dari daftar aktif. Pada Google Sheets (sheet <code>Data_Murid</code>), baris data ini ditandai <strong>BLOK MERAH</strong> dengan status <strong>DIHAPUS</strong> beserta tanggal dan jam penghapusan. Anda dapat memulihkan data kembali ke daftar aktif kapan saja.
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Cari riwayat murid terhapus..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-rose-300 rounded-lg text-xs outline-none focus:border-rose-500"
                  />
                </div>

                <select
                  value={filterKelas}
                  onChange={(e) => setFilterKelas(e.target.value)}
                  className="p-1.5 bg-white border border-rose-300 rounded-lg text-xs outline-none font-medium text-rose-900"
                >
                  <option value="">-- Semua Kelas --</option>
                  {kelasList.map((k) => (
                    <option key={k.id} value={k.nama}>
                      {k.nama}
                    </option>
                  ))}
                </select>

                {/* Sort controls */}
                <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-rose-200">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-[11px] font-bold text-rose-800">Urut:</span>
                  <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as SortField)}
                    aria-label="Pilih kolom pengurutan data murid terhapus admin"
                    className="bg-transparent text-xs font-bold text-rose-900 outline-none cursor-pointer"
                  >
                    <option value="nama">Nama</option>
                    <option value="nis">NIS</option>
                    <option value="kelas">Kelas</option>
                    <option value="waktu">Waktu Hapus</option>
                  </select>
                </div>

                <div className="flex items-center bg-rose-100 p-0.5 rounded-lg border border-rose-200">
                  <button
                    type="button"
                    onClick={() => setSortDirection('asc')}
                    title="Urutan Menaik (A-Z, 0-9)"
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-all ${
                      sortDirection === 'asc'
                        ? 'bg-rose-700 text-white shadow-xs'
                        : 'text-rose-800 hover:bg-rose-200/60'
                    }`}
                  >
                    <ArrowUpAZ className="w-3 h-3" />
                    <span className="text-[10px]">Asc (A-Z)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortDirection('desc')}
                    title="Urutan Menurun (Z-A, 9-0)"
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-all ${
                      sortDirection === 'desc'
                        ? 'bg-rose-700 text-white shadow-xs'
                        : 'text-rose-800 hover:bg-rose-200/60'
                    }`}
                  >
                    <ArrowDownAZ className="w-3 h-3" />
                    <span className="text-[10px]">Desc (Z-A)</span>
                  </button>
                </div>

                <span className="text-xs font-bold text-rose-800">
                  Total Terhapus: {sortedDeleted.length}
                </span>
              </div>

              {selectedDeletedIds.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white border-2 border-emerald-400 p-3 rounded-xl shadow-xs text-slate-900">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="bg-emerald-600 text-white font-black px-2.5 py-0.5 rounded-full text-xs shadow-xs">
                      {selectedDeletedIds.length}
                    </span>
                    <span>Riwayat Murid dipilih</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDeletedIds([])}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleRestoreBulk}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>PULIHKAN TERPILIH ({selectedDeletedIds.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={handlePermanentDeleteBulk}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>HAPUS PERMANEN ({selectedDeletedIds.length})</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto bg-white border border-rose-200 rounded-lg max-h-96">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-rose-100/70 text-rose-900 text-[10px] font-black uppercase sticky top-0 z-10">
                    <tr>
                      <th className="p-2.5 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={isAllDeletedSelected}
                          onChange={handleToggleSelectAllDeleted}
                          className="w-4 h-4 text-rose-600 rounded cursor-pointer accent-rose-600"
                          title={isAllDeletedSelected ? 'Batalkan Pilih Semua' : 'Pilih Semua'}
                        />
                      </th>
                      <th
                        className="p-2.5 cursor-pointer select-none hover:bg-rose-200/70 transition-colors"
                        onClick={() => handleSortToggle('nama')}
                        title="Klik untuk ubah urutan Nama"
                      >
                        <div className="flex items-center gap-1">
                          <span>Nama Murid</span>
                          {sortField === 'nama' ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3 h-3 text-rose-700" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-rose-700" />
                            )
                          ) : (
                            <ArrowUpDown className="w-2.5 h-2.5 text-rose-400" />
                          )}
                        </div>
                      </th>
                      <th
                        className="p-2.5 cursor-pointer select-none hover:bg-rose-200/70 transition-colors"
                        onClick={() => handleSortToggle('nis')}
                        title="Klik untuk ubah urutan NIS"
                      >
                        <div className="flex items-center gap-1">
                          <span>NIS</span>
                          {sortField === 'nis' ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3 h-3 text-rose-700" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-rose-700" />
                            )
                          ) : (
                            <ArrowUpDown className="w-2.5 h-2.5 text-rose-400" />
                          )}
                        </div>
                      </th>
                      <th
                        className="p-2.5 cursor-pointer select-none hover:bg-rose-200/70 transition-colors"
                        onClick={() => handleSortToggle('kelas')}
                        title="Klik untuk ubah urutan Kelas"
                      >
                        <div className="flex items-center gap-1">
                          <span>Kelas</span>
                          {sortField === 'kelas' ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3 h-3 text-rose-700" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-rose-700" />
                            )
                          ) : (
                            <ArrowUpDown className="w-2.5 h-2.5 text-rose-400" />
                          )}
                        </div>
                      </th>
                      <th
                        className="p-2.5 cursor-pointer select-none hover:bg-rose-200/70 transition-colors"
                        onClick={() => handleSortToggle('waktu')}
                        title="Klik untuk ubah urutan Waktu"
                      >
                        <div className="flex items-center gap-1">
                          <span>Waktu & Info Hapus</span>
                          {sortField === 'waktu' ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3 h-3 text-rose-700" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-rose-700" />
                            )
                          ) : (
                            <ArrowUpDown className="w-2.5 h-2.5 text-rose-400" />
                          )}
                        </div>
                      </th>
                      <th className="p-2.5 text-center w-36">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100">
                    {sortedDeleted.map((d) => {
                      const isChecked = selectedDeletedIds.includes(d.id);
                      return (
                        <tr
                          key={d.id}
                          className={`transition-colors ${isChecked ? 'bg-rose-50' : 'hover:bg-rose-50/50'}`}
                        >
                          <td className="p-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleSelectDeleted(d.id)}
                              className="w-4 h-4 text-rose-600 rounded cursor-pointer accent-rose-600"
                            />
                          </td>
                          <td className="p-2.5">
                            <span className="font-bold text-rose-950 line-through opacity-80 block">{d.nama}</span>
                            <span className="bg-rose-100 text-rose-800 text-[8px] font-black px-1.5 py-0.2 rounded border border-rose-300">
                              DIHAPUS
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-600 font-mono text-[11px]">{d.nis || '-'}</td>
                          <td className="p-2.5 text-slate-600 font-semibold">{d.kelas}</td>
                          <td className="p-2.5">
                            <span className="text-[10px] text-rose-700 font-bold flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {d.deletedAt || 'Terhapus'}
                            </span>
                            <span className="text-[9px] text-slate-400 block">Oleh: {d.deletedBy || 'Admin'}</span>
                          </td>
                          <td className="p-2.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleRestoreSingle(d.id)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold shadow-xs transition-all active:scale-95"
                                title="Pulihkan Murid ke daftar aktif"
                              >
                                <RotateCcw className="w-3 h-3" /> Pulihkan
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePermanentDeleteSingle(d.id, d.nama)}
                                className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-100"
                                title="Hapus permanen dari riwayat"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {sortedDeleted.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-xs text-slate-400 italic">
                          Tidak ada riwayat murid yang dihapus.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Riwayat Edit Sub-tab */
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-amber-50 p-3.5 rounded-lg border border-amber-200 text-amber-900">
                <Pencil className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <strong className="block font-bold">Riwayat Pengeditan Murid (Tercatat & Terblok Kuning di Google Sheets)</strong>
                  Data di bawah ini merupakan riwayat murid yang pernah diedit. Pada Google Sheets (sheet <code>Data_Murid</code>), baris data ini ditandai <strong>BLOK KUNING MUDA</strong> dengan status <strong>DIEDIT</strong> beserta tanggal, jam, dan rincian perubahan.
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Cari riwayat murid yang diedit..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs outline-none focus:border-amber-500"
                  />
                </div>

                <select
                  value={filterKelas}
                  onChange={(e) => setFilterKelas(e.target.value)}
                  className="p-1.5 bg-white border border-amber-300 rounded-lg text-xs outline-none font-medium text-amber-900"
                >
                  <option value="">-- Semua Kelas --</option>
                  {kelasList.map((k) => (
                    <option key={k.id} value={k.nama}>
                      {k.nama}
                    </option>
                  ))}
                </select>

                {/* Sort controls */}
                <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-amber-200">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-[11px] font-bold text-amber-900">Urut:</span>
                  <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as SortField)}
                    aria-label="Pilih kolom pengurutan data murid riwayat edit admin"
                    className="bg-transparent text-xs font-bold text-amber-950 outline-none cursor-pointer"
                  >
                    <option value="nama">Nama</option>
                    <option value="nis">NIS</option>
                    <option value="kelas">Kelas</option>
                    <option value="waktu">Waktu Edit</option>
                  </select>
                </div>

                <div className="flex items-center bg-amber-100 p-0.5 rounded-lg border border-amber-200">
                  <button
                    type="button"
                    onClick={() => setSortDirection('asc')}
                    title="Urutan Menaik (A-Z, 0-9)"
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-all ${
                      sortDirection === 'asc'
                        ? 'bg-amber-700 text-white shadow-xs'
                        : 'text-amber-900 hover:bg-amber-200/60'
                    }`}
                  >
                    <ArrowUpAZ className="w-3 h-3" />
                    <span className="text-[10px]">Asc (A-Z)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortDirection('desc')}
                    title="Urutan Menurun (Z-A, 9-0)"
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-all ${
                      sortDirection === 'desc'
                        ? 'bg-amber-700 text-white shadow-xs'
                        : 'text-amber-900 hover:bg-amber-200/60'
                    }`}
                  >
                    <ArrowDownAZ className="w-3 h-3" />
                    <span className="text-[10px]">Desc (Z-A)</span>
                  </button>
                </div>

                <span className="text-xs font-bold text-amber-800">
                  Total Pernah Diedit: {sortedEdited.length}
                </span>
              </div>

              <div className="overflow-x-auto bg-white border border-amber-200 rounded-lg max-h-96">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-amber-100/70 text-amber-950 text-[10px] font-black uppercase sticky top-0 z-10">
                    <tr>
                      <th className="p-2.5">No</th>
                      <th
                        className="p-2.5 cursor-pointer select-none hover:bg-amber-200/70 transition-colors"
                        onClick={() => handleSortToggle('nama')}
                        title="Klik untuk ubah urutan Nama"
                      >
                        <div className="flex items-center gap-1">
                          <span>Nama Murid</span>
                          {sortField === 'nama' ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3 h-3 text-amber-800" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-amber-800" />
                            )
                          ) : (
                            <ArrowUpDown className="w-2.5 h-2.5 text-amber-400" />
                          )}
                        </div>
                      </th>
                      <th
                        className="p-2.5 cursor-pointer select-none hover:bg-amber-200/70 transition-colors"
                        onClick={() => handleSortToggle('nis')}
                        title="Klik untuk ubah urutan NIS"
                      >
                        <div className="flex items-center gap-1">
                          <span>NIS</span>
                          {sortField === 'nis' ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3 h-3 text-amber-800" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-amber-800" />
                            )
                          ) : (
                            <ArrowUpDown className="w-2.5 h-2.5 text-amber-400" />
                          )}
                        </div>
                      </th>
                      <th
                        className="p-2.5 cursor-pointer select-none hover:bg-amber-200/70 transition-colors"
                        onClick={() => handleSortToggle('kelas')}
                        title="Klik untuk ubah urutan Kelas"
                      >
                        <div className="flex items-center gap-1">
                          <span>Kelas</span>
                          {sortField === 'kelas' ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3 h-3 text-amber-800" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-amber-800" />
                            )
                          ) : (
                            <ArrowUpDown className="w-2.5 h-2.5 text-amber-400" />
                          )}
                        </div>
                      </th>
                      <th
                        className="p-2.5 cursor-pointer select-none hover:bg-amber-200/70 transition-colors"
                        onClick={() => handleSortToggle('waktu')}
                        title="Klik untuk ubah urutan Waktu Edit"
                      >
                        <div className="flex items-center gap-1">
                          <span>Riwayat & Keterangan Perubahan</span>
                          {sortField === 'waktu' ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3 h-3 text-amber-800" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-amber-800" />
                            )
                          ) : (
                            <ArrowUpDown className="w-2.5 h-2.5 text-amber-400" />
                          )}
                        </div>
                      </th>
                      <th className="p-2.5 text-center w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100">
                    {sortedEdited.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-amber-50/50 transition-colors">
                        <td className="p-2.5 font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-slate-900">
                          <span>{s.nama}</span>
                        </td>
                        <td className="p-2.5 text-slate-600 font-mono text-[11px]">{s.nis || '-'}</td>
                        <td className="p-2.5">
                          <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold">
                            {s.kelas}
                          </span>
                        </td>
                        <td className="p-2.5">
                          {s.editHistory ? (
                            <div className="space-y-1">
                              {s.editHistory.split('\n').map((line, lIdx) => (
                                <p key={lIdx} className="text-[11px] text-amber-950 bg-amber-50/80 p-1.5 rounded border border-amber-200 font-mono leading-relaxed">
                                  {line}
                                </p>
                              ))}
                            </div>
                          ) : (
                            <div className="text-[11px] text-amber-900">
                              <span className="font-bold">Diedit pada:</span> {s.editedAt || '-'}
                              {s.editedBy && <span className="text-slate-500 block text-[10px]">Oleh: {s.editedBy}</span>}
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => startEdit(s)}
                            className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded text-xs font-bold transition-colors"
                            title="Edit Data Murid"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                    {sortedEdited.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-xs text-slate-400 italic">
                          Belum ada riwayat perubahan/pengeditan data murid.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Murid Modal */}
      {editingSiswa && (
        <div
          id="modal-edit-murid"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Edit Data Murid</h3>
                  <p className="text-[11px] text-slate-500">Perbarui informasi murid secara manual langsung di sistem.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingSiswa(null)}
                id="btn-close-edit-murid"
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Murid <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  id="input-edit-murid-nama"
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  placeholder="cth. Ahmad Fauzi"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  NIS / NISN <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <input
                  type="text"
                  id="input-edit-murid-nis"
                  value={editNis}
                  onChange={(e) => setEditNis(e.target.value)}
                  placeholder="cth. 12345 / 0051234567"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kelas / Rombel <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  id="select-edit-murid-kelas"
                  value={editKelas}
                  onChange={(e) => setEditKelas(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 bg-white"
                >
                  <option value="">-- Pilih Kelas --</option>
                  {kelasList.map((k) => (
                    <option key={k.id} value={k.nama}>
                      {k.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-5">
                <button
                  type="button"
                  id="btn-cancel-edit-murid"
                  onClick={() => setEditingSiswa(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-save-edit-murid"
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
