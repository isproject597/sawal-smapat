import React, { useState } from 'react';
import {
  School,
  Plus,
  Trash2,
  Search,
  RotateCcw,
  History,
  AlertOctagon,
  Clock,
  Download,
  Upload,
  Pencil,
  CheckCircle2,
  X
} from 'lucide-react';
import { Kelas } from '../../types';
import { downloadExcelTemplate } from '../../utils/excelHelper';
import { getFullTimestamp } from '../../utils/dateHelper';
import { recordDeletedKelas, saveDeletedKelas } from '../../data/storage';
import { triggerBackgroundAutoSync } from '../../services/googleSheets';

interface KelolaKelasTabProps {
  kelasList: Kelas[];
  deletedKelasList: Kelas[];
  onUpdateKelas: (list: Kelas[]) => void;
  onUpdateDeletedKelas: (list: Kelas[]) => void;
  onOpenExcelModal: () => void;
  setDeleteModal: (modal: any) => void;
  setNotice: (msg: string | null) => void;
  getFormattedDelTimestamp: () => string;
}

export const KelolaKelasTab: React.FC<KelolaKelasTabProps> = ({
  kelasList,
  deletedKelasList,
  onUpdateKelas,
  onUpdateDeletedKelas,
  onOpenExcelModal,
  setDeleteModal,
  setNotice,
  getFormattedDelTimestamp
}) => {
  const [viewMode, setViewMode] = useState<'active' | 'history'>('active');
  const [historySubTab, setHistorySubTab] = useState<'deleted' | 'edited'>('deleted');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedDeletedIds, setSelectedDeletedIds] = useState<string[]>([]);

  // Form states (Add)
  const [newNama, setNewNama] = useState('');

  // Edit states
  const [editingKelas, setEditingKelas] = useState<Kelas | null>(null);
  const [editNama, setEditNama] = useState('');

  const startEdit = (k: Kelas) => {
    setEditingKelas(k);
    setEditNama(k.nama);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKelas || !editNama.trim()) return;

    const formattedNama = editNama.trim().toUpperCase();

    // Track detailed field differences
    const changes: string[] = [];
    if (editingKelas.nama !== formattedNama) {
      changes.push(`Nama Kelas: "${editingKelas.nama}" ➔ "${formattedNama}"`);
    }

    if (changes.length === 0) {
      setEditingKelas(null);
      return;
    }

    const timestamp = getFullTimestamp();
    const newLog = `[${timestamp}] DIEDIT (Admin): ${changes.join(' | ')}`;
    const combinedHistory = editingKelas.editHistory ? `${newLog}\n${editingKelas.editHistory}` : newLog;

    const updatedItem: Kelas = {
      ...editingKelas,
      nama: formattedNama,
      isEdited: true,
      editedAt: timestamp,
      editedBy: 'Admin',
      editHistory: combinedHistory
    };

    const updatedList = kelasList.map((k) => (k.id === editingKelas.id ? updatedItem : k));
    onUpdateKelas(updatedList);
    setEditingKelas(null);
    setNotice(`✅ Data kelas berhasil diubah menjadi "${updatedItem.nama}". Perubahan & timestamp otomatis terblok kuning di Google Sheets.`);
    setTimeout(() => setNotice(null), 5000);
  };

  // Filtering
  const filteredActive = kelasList.filter((k) =>
    k.nama.toLowerCase().includes(search.toLowerCase())
  );

  const filteredDeleted = deletedKelasList.filter((k) =>
    k.nama.toLowerCase().includes(search.toLowerCase())
  );

  const editedKelasList = kelasList.filter((k) => k.isEdited || k.editHistory);
  const filteredEdited = editedKelasList.filter((k) => {
    const q = search.toLowerCase();
    return (
      k.nama.toLowerCase().includes(q) ||
      (k.editHistory && k.editHistory.toLowerCase().includes(q))
    );
  });

  // Active selection
  const isAllActiveSelected =
    filteredActive.length > 0 && filteredActive.every((k) => selectedIds.includes(k.id));

  const handleToggleSelectAllActive = () => {
    if (isAllActiveSelected) {
      const activeIdsSet = new Set(filteredActive.map((k) => k.id));
      setSelectedIds((prev) => prev.filter((id) => !activeIdsSet.has(id)));
    } else {
      const newSet = new Set(selectedIds);
      filteredActive.forEach((k) => newSet.add(k.id));
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
    filteredDeleted.length > 0 &&
    filteredDeleted.every((k) => selectedDeletedIds.includes(k.id));

  const handleToggleSelectAllDeleted = () => {
    if (isAllDeletedSelected) {
      const delIdsSet = new Set(filteredDeleted.map((k) => k.id));
      setSelectedDeletedIds((prev) => prev.filter((id) => !delIdsSet.has(id)));
    } else {
      const newSet = new Set(selectedDeletedIds);
      filteredDeleted.forEach((k) => newSet.add(k.id));
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
    if (!newNama.trim()) return;
    const newItem: Kelas = {
      id: `k_${Date.now()}`,
      nama: newNama.trim().toUpperCase()
    };
    onUpdateKelas([...kelasList, newItem]);
    setNewNama('');
    setNotice(`✅ Kelas "${newItem.nama}" berhasil ditambahkan.`);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleDeleteSingle = (id: string, nama?: string) => {
    setDeleteModal({
      isOpen: true,
      type: 'master',
      title: 'Hapus Kelas?',
      description: nama
        ? `Apakah Anda yakin ingin menghapus kelas "${nama}"? Data akan dipindahkan ke Riwayat Terhapus dan otomatis diberi tanda Blok Merah di Google Sheets.`
        : 'Apakah Anda yakin ingin menghapus kelas ini? Data akan dipindahkan ke Riwayat Terhapus dan otomatis diberi tanda Blok Merah di Google Sheets.',
      onConfirm: () => {
        const target = kelasList.find((k) => k.id === id);
        if (target) {
          const deletedRecord: Kelas = {
            ...target,
            isDeleted: true,
            deletedAt: getFormattedDelTimestamp(),
            deletedBy: 'Admin'
          };
          const updatedDeleted = recordDeletedKelas([deletedRecord]);
          onUpdateDeletedKelas(updatedDeleted);
        }
        const remaining = kelasList.filter((k) => k.id !== id);
        onUpdateKelas(remaining);
        setSelectedIds((prev) => prev.filter((item) => item !== id));
        setDeleteModal(null);
        setNotice(`✅ Kelas "${nama || id}" telah dihapus & dicatat di Google Sheets (terblok merah).`);
        setTimeout(() => setNotice(null), 5000);
      }
    });
  };

  const handleDeleteBulk = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    const targets = kelasList.filter((k) => selectedIds.includes(k.id));
    const targetNames = targets.map((k) => k.nama).slice(0, 5).join(', ') + (count > 5 ? ` dan ${count - 5} lainnya` : '');

    setDeleteModal({
      isOpen: true,
      type: 'bulk',
      title: `Hapus ${count} Kelas Terpilih?`,
      description: `Apakah Anda yakin ingin menghapus ${count} kelas (${targetNames})? Seluruh data terpilih akan dipindahkan ke Riwayat Terhapus dan otomatis diberi tanda Blok Merah di Google Sheets.`,
      onConfirm: () => {
        const deletedRecords: Kelas[] = targets.map((t) => ({
          ...t,
          isDeleted: true,
          deletedAt: getFormattedDelTimestamp(),
          deletedBy: 'Admin'
        }));
        const updatedDeleted = recordDeletedKelas(deletedRecords);
        onUpdateDeletedKelas(updatedDeleted);

        const remaining = kelasList.filter((k) => !selectedIds.includes(k.id));
        onUpdateKelas(remaining);
        setSelectedIds([]);
        setDeleteModal(null);
        setNotice(`✅ ${count} kelas terpilih telah dihapus & dicatat di Google Sheets (terblok merah).`);
        setTimeout(() => setNotice(null), 5000);
      }
    });
  };

  const handleRestoreSingle = (id: string) => {
    const target = deletedKelasList.find((k) => k.id === id);
    if (!target) return;
    const restored: Kelas = { ...target, isDeleted: false, deletedAt: undefined, deletedBy: undefined };
    const newDeleted = deletedKelasList.filter((k) => k.id !== id);
    saveDeletedKelas(newDeleted);
    onUpdateDeletedKelas(newDeleted);
    onUpdateKelas([...kelasList, restored]);
    setSelectedDeletedIds((prev) => prev.filter((item) => item !== id));
    setNotice(`✅ Kelas "${target.nama}" berhasil dipulihkan.`);
    setTimeout(() => setNotice(null), 5000);
  };

  const handleRestoreBulk = () => {
    if (selectedDeletedIds.length === 0) return;
    const targets = deletedKelasList.filter((k) => selectedDeletedIds.includes(k.id));
    const restoredList: Kelas[] = targets.map((t) => ({
      ...t,
      isDeleted: false,
      deletedAt: undefined,
      deletedBy: undefined
    }));
    const newDeleted = deletedKelasList.filter((k) => !selectedDeletedIds.includes(k.id));
    saveDeletedKelas(newDeleted);
    onUpdateDeletedKelas(newDeleted);
    onUpdateKelas([...kelasList, ...restoredList]);
    setSelectedDeletedIds([]);
    setNotice(`✅ ${targets.length} kelas berhasil dipulihkan ke daftar aktif.`);
    setTimeout(() => setNotice(null), 5000);
  };

  const handlePermanentDeleteSingle = (id: string, nama?: string) => {
    setDeleteModal({
      isOpen: true,
      type: 'master',
      title: 'Hapus Permanen dari Riwayat?',
      description: `Hapus kelas "${nama || id}" secara permanen dari histori? Tindakan ini tidak dapat dibatalkan.`,
      onConfirm: () => {
        const newDeleted = deletedKelasList.filter((k) => k.id !== id);
        saveDeletedKelas(newDeleted);
        onUpdateDeletedKelas(newDeleted);
        setSelectedDeletedIds((prev) => prev.filter((item) => item !== id));
        triggerBackgroundAutoSync('kelas', { kelasList, deletedKelasList: newDeleted });
        setDeleteModal(null);
        setNotice(`✅ Kelas "${nama || id}" dihapus permanen dari riwayat.`);
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
      title: `Hapus Permanen ${count} Riwayat Kelas?`,
      description: `Hapus ${count} riwayat kelas terpilih secara permanen? Data yang telah dihapus permanen tidak dapat dipulihkan kembali.`,
      onConfirm: () => {
        const newDeleted = deletedKelasList.filter((k) => !selectedDeletedIds.includes(k.id));
        saveDeletedKelas(newDeleted);
        onUpdateDeletedKelas(newDeleted);
        setSelectedDeletedIds([]);
        triggerBackgroundAutoSync('kelas', { kelasList, deletedKelasList: newDeleted });
        setDeleteModal(null);
        setNotice(`✅ ${count} riwayat kelas berhasil dihapus permanen.`);
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
            <School className="w-3.5 h-3.5" />
            <span>Kelas Aktif ({kelasList.length})</span>
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
            {(deletedKelasList.length > 0 || editedKelasList.length > 0) && (
              <span className="bg-amber-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-black">
                {deletedKelasList.length + editedKelasList.length}
              </span>
            )}
          </button>
        </div>

        {viewMode === 'active' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => downloadExcelTemplate('kelas')}
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
          {/* Form Tambah Kelas */}
          <form onSubmit={handleAdd} className="bg-white p-5 rounded-xl border border-slate-200 space-y-3 shadow-xs h-fit">
            <h3 className="text-xs font-extrabold text-teal-900 uppercase flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-600" /> Tambah Kelas Manual
            </h3>
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase block">Nama Kelas *</label>
              <input
                type="text"
                placeholder="Contoh: X IPS 2"
                value={newNama}
                onChange={(e) => setNewNama(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-xs outline-none focus:border-teal-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-2 rounded text-xs uppercase shadow-xs active:scale-95 transition-all"
            >
              Simpan Kelas
            </button>
          </form>

          {/* Table & Bulk Selection Area */}
          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nama kelas..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs outline-none focus:border-teal-500"
                />
              </div>
              <span className="text-xs font-bold text-slate-500">
                Total: {filteredActive.length} dari {kelasList.length} kelas
              </span>
            </div>

            {/* Bulk Action Banner */}
            {selectedIds.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 bg-rose-50 border-2 border-rose-300 p-3 rounded-xl shadow-xs text-rose-950">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="bg-rose-600 text-white font-black px-2.5 py-0.5 rounded-full text-xs shadow-xs">
                    {selectedIds.length}
                  </span>
                  <span>Kelas dipilih</span>
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
                    <th className="p-2.5">Nama Kelas / Rombel</th>
                    <th className="p-2.5 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredActive.map((k, idx) => {
                    const isChecked = selectedIds.includes(k.id);
                    return (
                      <tr
                        key={k.id}
                        className={`transition-colors ${isChecked ? 'bg-teal-50' : 'hover:bg-slate-50'}`}
                      >
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelectActive(k.id)}
                            className="w-4 h-4 text-teal-600 rounded cursor-pointer accent-teal-600"
                          />
                        </td>
                        <td className="p-2.5 font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-teal-900">
                          <span>{k.nama}</span>
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => startEdit(k)}
                              id={`btn-edit-kelas-${k.id}`}
                              className="text-amber-600 hover:text-amber-800 p-1.5 rounded hover:bg-amber-50 transition-colors"
                              title="Edit Kelas"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSingle(k.id, k.nama)}
                              id={`btn-delete-kelas-${k.id}`}
                              className="text-rose-600 hover:text-rose-800 p-1.5 rounded hover:bg-rose-50 transition-colors"
                              title="Hapus Kelas"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredActive.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-xs text-slate-400 italic">
                        {kelasList.length === 0 ? 'Belum ada kelas aktif.' : 'Tidak ada kelas yang sesuai pencarian.'}
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
              <span>Riwayat Hapus ({deletedKelasList.length})</span>
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
              <span>Riwayat Edit ({editedKelasList.length})</span>
            </button>
          </div>

          {historySubTab === 'deleted' ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-rose-100/70 p-3.5 rounded-lg border border-rose-300 text-rose-900">
                <AlertOctagon className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <strong className="block font-bold">Riwayat Penghapusan Kelas (Bisa Dipulihkan & Terblok Merah di Google Sheets)</strong>
                  Data kelas di bawah ini telah dihapus dari daftar aktif. Pada Google Sheets (sheet <code>Data_Kelas</code>), baris data ini ditandai <strong>BLOK MERAH</strong> dengan status <strong>DIHAPUS</strong> beserta tanggal dan jam penghapusan. Anda dapat memulihkan data kembali ke daftar aktif kapan saja.
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Cari riwayat kelas terhapus..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-rose-300 rounded-lg text-xs outline-none focus:border-rose-500"
                  />
                </div>
                <span className="text-xs font-bold text-rose-800">
                  Total Terhapus: {filteredDeleted.length}
                </span>
              </div>

              {selectedDeletedIds.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white border-2 border-emerald-400 p-3 rounded-xl shadow-xs text-slate-900">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="bg-emerald-600 text-white font-black px-2.5 py-0.5 rounded-full text-xs shadow-xs">
                      {selectedDeletedIds.length}
                    </span>
                    <span>Riwayat Kelas dipilih</span>
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
                      <th className="p-2.5">Nama Kelas</th>
                      <th className="p-2.5">Waktu & Info Hapus</th>
                      <th className="p-2.5 text-center w-36">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100">
                    {filteredDeleted.map((d) => {
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
                                title="Pulihkan Kelas ke daftar aktif"
                              >
                                <RotateCcw className="w-3.5 h-3.5" /> Pulihkan
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
                    {filteredDeleted.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-xs text-slate-400 italic">
                          Tidak ada riwayat kelas yang dihapus.
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
                  <strong className="block font-bold">Riwayat Pengeditan Kelas (Tercatat & Terblok Kuning di Google Sheets)</strong>
                  Data di bawah ini merupakan riwayat kelas yang pernah diedit. Pada Google Sheets (sheet <code>Data_Kelas</code>), baris data ini ditandai <strong>BLOK KUNING MUDA</strong> dengan status <strong>DIEDIT</strong> beserta tanggal, jam, dan rincian perubahan.
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Cari riwayat kelas yang diedit..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs outline-none focus:border-amber-500"
                  />
                </div>
                <span className="text-xs font-bold text-amber-800">
                  Total Pernah Diedit: {filteredEdited.length}
                </span>
              </div>

              <div className="overflow-x-auto bg-white border border-amber-200 rounded-lg max-h-96">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-amber-100/70 text-amber-950 text-[10px] font-black uppercase sticky top-0 z-10">
                    <tr>
                      <th className="p-2.5">No</th>
                      <th className="p-2.5">Nama Kelas / Rombel</th>
                      <th className="p-2.5">Riwayat & Keterangan Perubahan</th>
                      <th className="p-2.5 text-center w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100">
                    {filteredEdited.map((k, idx) => (
                      <tr key={k.id} className="hover:bg-amber-50/50 transition-colors">
                        <td className="p-2.5 font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-teal-900">
                          <span>{k.nama}</span>
                        </td>
                        <td className="p-2.5">
                          {k.editHistory ? (
                            <div className="space-y-1">
                              {k.editHistory.split('\n').map((line, lIdx) => (
                                <p key={lIdx} className="text-[11px] text-amber-950 bg-amber-50/80 p-1.5 rounded border border-amber-200 font-mono leading-relaxed">
                                  {line}
                                </p>
                              ))}
                            </div>
                          ) : (
                            <div className="text-[11px] text-amber-900">
                              <span className="font-bold">Diedit pada:</span> {k.editedAt || '-'}
                              {k.editedBy && <span className="text-slate-500 block text-[10px]">Oleh: {k.editedBy}</span>}
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => startEdit(k)}
                            className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded text-xs font-bold transition-colors"
                            title="Edit Kelas"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredEdited.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-xs text-slate-400 italic">
                          Belum ada riwayat perubahan/pengeditan kelas.
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

      {/* Edit Kelas Modal */}
      {editingKelas && (
        <div
          id="modal-edit-kelas"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Edit Data Kelas</h3>
                  <p className="text-[11px] text-slate-500">Perbarui nama kelas/rombel secara manual langsung di sistem.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingKelas(null)}
                id="btn-close-edit-kelas"
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Kelas / Rombel <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  id="input-edit-kelas-nama"
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  placeholder="cth. X MIPA 1, XI IPS 2, XII BAHASA"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 uppercase"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-5">
                <button
                  type="button"
                  id="btn-cancel-edit-kelas"
                  onClick={() => setEditingKelas(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-save-edit-kelas"
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
