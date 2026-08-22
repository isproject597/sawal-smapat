import React, { useState } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Search,
  RotateCcw,
  History,
  AlertOctagon,
  Clock,
  Download,
  Upload,
  CheckCircle2,
  Pencil,
  X
} from 'lucide-react';
import { Guru, Mapel } from '../../types';
import { downloadExcelTemplate } from '../../utils/excelHelper';
import { getFullTimestamp } from '../../utils/dateHelper';
import { recordDeletedGuru, saveDeletedGuru } from '../../data/storage';
import { triggerBackgroundAutoSync } from '../../services/googleSheets';

interface KelolaGuruTabProps {
  guruList: Guru[];
  mapelList: Mapel[];
  deletedGuruList: Guru[];
  onUpdateGuru: (list: Guru[]) => void;
  onUpdateDeletedGuru: (list: Guru[]) => void;
  onOpenExcelModal: () => void;
  setDeleteModal: (modal: any) => void;
  setNotice: (msg: string | null) => void;
  getFormattedDelTimestamp: () => string;
}

export const KelolaGuruTab: React.FC<KelolaGuruTabProps> = ({
  guruList,
  mapelList,
  deletedGuruList,
  onUpdateGuru,
  onUpdateDeletedGuru,
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
  const [newNip, setNewNip] = useState('');
  const [newMapel, setNewMapel] = useState('');

  // Edit states
  const [editingGuru, setEditingGuru] = useState<Guru | null>(null);
  const [editNama, setEditNama] = useState('');
  const [editNip, setEditNip] = useState('');
  const [editMapel, setEditMapel] = useState('');

  const startEdit = (g: Guru) => {
    setEditingGuru(g);
    setEditNama(g.nama);
    setEditNip(g.nip || '');
    setEditMapel(g.mapelUtama || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuru || !editNama.trim()) return;

    const trimmedNama = editNama.trim();
    const trimmedNip = editNip.trim() || undefined;
    const selectedMapel = editMapel || undefined;

    // Track detailed field differences (Data Lama -> Data Baru)
    const changes: string[] = [];
    if (editingGuru.nama !== trimmedNama) {
      changes.push(`Nama: "${editingGuru.nama}" ➔ "${trimmedNama}"`);
    }
    if ((editingGuru.nip || '-') !== (trimmedNip || '-')) {
      changes.push(`NIP: "${editingGuru.nip || '-'}" ➔ "${trimmedNip || '-'}"`);
    }
    if ((editingGuru.mapelUtama || '-') !== (selectedMapel || '-')) {
      changes.push(`Mapel: "${editingGuru.mapelUtama || '-'}" ➔ "${selectedMapel || '-'}"`);
    }

    if (changes.length === 0) {
      setEditingGuru(null);
      return;
    }

    const timestamp = getFullTimestamp();
    const newLog = `[${timestamp}] DIEDIT (Admin): ${changes.join(' | ')}`;
    const combinedHistory = editingGuru.editHistory ? `${newLog}\n${editingGuru.editHistory}` : newLog;

    const updatedItem: Guru = {
      ...editingGuru,
      nama: trimmedNama,
      nip: trimmedNip,
      mapelUtama: selectedMapel,
      isEdited: true,
      editedAt: timestamp,
      editedBy: 'Admin',
      editHistory: combinedHistory
    };

    const updatedList = guruList.map((g) => (g.id === editingGuru.id ? updatedItem : g));
    onUpdateGuru(updatedList);
    setEditingGuru(null);
    setNotice(`✅ Data guru "${updatedItem.nama}" berhasil diperbarui. Perubahan & timestamp otomatis terblok kuning di Google Sheets.`);
    setTimeout(() => setNotice(null), 5000);
  };

  // Filtering
  const filteredActive = guruList.filter((g) => {
    const q = search.toLowerCase();
    return (
      g.nama.toLowerCase().includes(q) ||
      (g.nip && g.nip.toLowerCase().includes(q)) ||
      (g.mapelUtama && g.mapelUtama.toLowerCase().includes(q))
    );
  });

  const filteredDeleted = deletedGuruList.filter((g) => {
    const q = search.toLowerCase();
    return (
      g.nama.toLowerCase().includes(q) ||
      (g.nip && g.nip.toLowerCase().includes(q)) ||
      (g.mapelUtama && g.mapelUtama.toLowerCase().includes(q))
    );
  });

  const editedGuruList = guruList.filter((g) => g.isEdited || g.editHistory);
  const filteredEdited = editedGuruList.filter((g) => {
    const q = search.toLowerCase();
    return (
      g.nama.toLowerCase().includes(q) ||
      (g.nip && g.nip.toLowerCase().includes(q)) ||
      (g.mapelUtama && g.mapelUtama.toLowerCase().includes(q)) ||
      (g.editHistory && g.editHistory.toLowerCase().includes(q))
    );
  });

  // Selection logic for Active
  const isAllActiveSelected =
    filteredActive.length > 0 && filteredActive.every((g) => selectedIds.includes(g.id));

  const handleToggleSelectAllActive = () => {
    if (isAllActiveSelected) {
      const activeIdsSet = new Set(filteredActive.map((g) => g.id));
      setSelectedIds((prev) => prev.filter((id) => !activeIdsSet.has(id)));
    } else {
      const newSet = new Set(selectedIds);
      filteredActive.forEach((g) => newSet.add(g.id));
      setSelectedIds(Array.from(newSet));
    }
  };

  const handleToggleSelectActive = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Selection logic for Deleted
  const isAllDeletedSelected =
    filteredDeleted.length > 0 &&
    filteredDeleted.every((g) => selectedDeletedIds.includes(g.id));

  const handleToggleSelectAllDeleted = () => {
    if (isAllDeletedSelected) {
      const delIdsSet = new Set(filteredDeleted.map((g) => g.id));
      setSelectedDeletedIds((prev) => prev.filter((id) => !delIdsSet.has(id)));
    } else {
      const newSet = new Set(selectedDeletedIds);
      filteredDeleted.forEach((g) => newSet.add(g.id));
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
    const newItem: Guru = {
      id: `g_${Date.now()}`,
      nama: newNama.trim(),
      nip: newNip.trim() || undefined,
      mapelUtama: newMapel || undefined
    };
    onUpdateGuru([...guruList, newItem]);
    setNewNama('');
    setNewNip('');
    setNewMapel('');
    setNotice(`✅ Data guru "${newItem.nama}" berhasil ditambahkan.`);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleDeleteSingle = (id: string, nama?: string) => {
    setDeleteModal({
      isOpen: true,
      type: 'master',
      title: 'Hapus Data Guru?',
      description: nama
        ? `Apakah Anda yakin ingin menghapus data guru "${nama}"? Data akan dipindahkan ke Riwayat Terhapus dan otomatis diberi tanda Blok Merah di Google Sheets.`
        : 'Apakah Anda yakin ingin menghapus data guru ini? Data akan dipindahkan ke Riwayat Terhapus dan otomatis diberi tanda Blok Merah di Google Sheets.',
      onConfirm: () => {
        const target = guruList.find((g) => g.id === id);
        if (target) {
          const deletedRecord: Guru = {
            ...target,
            isDeleted: true,
            deletedAt: getFormattedDelTimestamp(),
            deletedBy: 'Admin'
          };
          const updatedDeleted = recordDeletedGuru([deletedRecord]);
          onUpdateDeletedGuru(updatedDeleted);
        }
        const remaining = guruList.filter((g) => g.id !== id);
        onUpdateGuru(remaining);
        setSelectedIds((prev) => prev.filter((item) => item !== id));
        setDeleteModal(null);
        setNotice(`✅ Data guru "${nama || id}" telah dihapus & dicatat di Google Sheets (terblok merah).`);
        setTimeout(() => setNotice(null), 5000);
      }
    });
  };

  const handleDeleteBulk = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    const targets = guruList.filter((g) => selectedIds.includes(g.id));
    const targetNames = targets.map((g) => g.nama).slice(0, 5).join(', ') + (count > 5 ? ` dan ${count - 5} lainnya` : '');

    setDeleteModal({
      isOpen: true,
      type: 'bulk',
      title: `Hapus ${count} Data Guru Terpilih?`,
      description: `Apakah Anda yakin ingin menghapus ${count} data guru (${targetNames})? Seluruh data terpilih akan dipindahkan ke Riwayat Terhapus dan otomatis diberi tanda Blok Merah di Google Sheets.`,
      onConfirm: () => {
        const deletedRecords: Guru[] = targets.map((t) => ({
          ...t,
          isDeleted: true,
          deletedAt: getFormattedDelTimestamp(),
          deletedBy: 'Admin'
        }));
        const updatedDeleted = recordDeletedGuru(deletedRecords);
        onUpdateDeletedGuru(updatedDeleted);

        const remaining = guruList.filter((g) => !selectedIds.includes(g.id));
        onUpdateGuru(remaining);
        setSelectedIds([]);
        setDeleteModal(null);
        setNotice(`✅ ${count} data guru terpilih telah dihapus & dicatat di Google Sheets (terblok merah).`);
        setTimeout(() => setNotice(null), 5000);
      }
    });
  };

  const handleRestoreSingle = (id: string) => {
    const target = deletedGuruList.find((g) => g.id === id);
    if (!target) return;
    const restored: Guru = { ...target, isDeleted: false, deletedAt: undefined, deletedBy: undefined };
    const newDeleted = deletedGuruList.filter((g) => g.id !== id);
    saveDeletedGuru(newDeleted);
    onUpdateDeletedGuru(newDeleted);
    onUpdateGuru([...guruList, restored]);
    setSelectedDeletedIds((prev) => prev.filter((item) => item !== id));
    setNotice(`✅ Data guru "${target.nama}" berhasil dipulihkan.`);
    setTimeout(() => setNotice(null), 5000);
  };

  const handleRestoreBulk = () => {
    if (selectedDeletedIds.length === 0) return;
    const targets = deletedGuruList.filter((g) => selectedDeletedIds.includes(g.id));
    const restoredList: Guru[] = targets.map((t) => ({
      ...t,
      isDeleted: false,
      deletedAt: undefined,
      deletedBy: undefined
    }));
    const newDeleted = deletedGuruList.filter((g) => !selectedDeletedIds.includes(g.id));
    saveDeletedGuru(newDeleted);
    onUpdateDeletedGuru(newDeleted);
    onUpdateGuru([...guruList, ...restoredList]);
    setSelectedDeletedIds([]);
    setNotice(`✅ ${targets.length} data guru berhasil dipulihkan ke daftar aktif.`);
    setTimeout(() => setNotice(null), 5000);
  };

  const handlePermanentDeleteSingle = (id: string, nama?: string) => {
    setDeleteModal({
      isOpen: true,
      type: 'master',
      title: 'Hapus Permanen dari Riwayat?',
      description: `Hapus data guru "${nama || id}" secara permanen dari histori? Tindakan ini tidak dapat dibatalkan.`,
      onConfirm: () => {
        const newDeleted = deletedGuruList.filter((g) => g.id !== id);
        saveDeletedGuru(newDeleted);
        onUpdateDeletedGuru(newDeleted);
        setSelectedDeletedIds((prev) => prev.filter((item) => item !== id));
        triggerBackgroundAutoSync('guru', { guruList, deletedGuruList: newDeleted });
        setDeleteModal(null);
        setNotice(`✅ Data guru "${nama || id}" dihapus permanen dari riwayat.`);
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
      title: `Hapus Permanen ${count} Riwayat Guru?`,
      description: `Hapus ${count} riwayat data guru terpilih secara permanen? Data yang telah dihapus permanen tidak dapat dipulihkan kembali.`,
      onConfirm: () => {
        const newDeleted = deletedGuruList.filter((g) => !selectedDeletedIds.includes(g.id));
        saveDeletedGuru(newDeleted);
        onUpdateDeletedGuru(newDeleted);
        setSelectedDeletedIds([]);
        triggerBackgroundAutoSync('guru', { guruList, deletedGuruList: newDeleted });
        setDeleteModal(null);
        setNotice(`✅ ${count} riwayat data guru berhasil dihapus permanen.`);
        setTimeout(() => setNotice(null), 4000);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Sub-view Navigation: Aktif vs Riwayat */}
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
            <Users className="w-3.5 h-3.5" />
            <span>Guru Aktif ({guruList.length})</span>
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
            {(deletedGuruList.length > 0 || editedGuruList.length > 0) && (
              <span className="bg-amber-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-black">
                {deletedGuruList.length + editedGuruList.length}
              </span>
            )}
          </button>
        </div>

        {viewMode === 'active' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => downloadExcelTemplate('guru')}
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
          {/* Form Tambah Guru */}
          <form onSubmit={handleAdd} className="bg-white p-5 rounded-xl border border-slate-200 space-y-3 shadow-xs h-fit">
            <h3 className="text-xs font-extrabold text-teal-900 uppercase flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-600" /> Tambah Data Guru Manual
            </h3>
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase block">Nama Guru & Gelar *</label>
              <input
                type="text"
                placeholder="Contoh: Budi Santoso, S.Pd."
                value={newNama}
                onChange={(e) => setNewNama(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-xs outline-none focus:border-teal-500"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase block">NIP / NIK Guru</label>
              <input
                type="text"
                placeholder="Contoh: 198203152008011002"
                value={newNip}
                onChange={(e) => setNewNip(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-xs outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase block">Mapel Utama</label>
              <select
                value={newMapel}
                onChange={(e) => setNewMapel(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-xs outline-none focus:border-teal-500"
              >
                <option value="">-- Pilih Mapel --</option>
                {mapelList.map((m) => (
                  <option key={m.id} value={m.nama}>
                    {m.nama}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-2 rounded text-xs uppercase shadow-xs active:scale-95 transition-all"
            >
              Simpan Data Guru
            </button>
          </form>

          {/* Table & Bulk Selection Area */}
          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            {/* Search and stats */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nama guru, NIP, atau mapel..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs outline-none focus:border-teal-500"
                />
              </div>
              <span className="text-xs font-bold text-slate-500">
                Total: {filteredActive.length} dari {guruList.length} guru
              </span>
            </div>

            {/* Bulk Action Banner */}
            {selectedIds.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 bg-rose-50 border-2 border-rose-300 p-3 rounded-xl shadow-xs text-rose-950">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="bg-rose-600 text-white font-black px-2.5 py-0.5 rounded-full text-xs shadow-xs">
                    {selectedIds.length}
                  </span>
                  <span>Data Guru dipilih</span>
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
                    <th className="p-2.5">Nama Guru & Gelar</th>
                    <th className="p-2.5">NIP / NIK</th>
                    <th className="p-2.5">Mapel Utama</th>
                    <th className="p-2.5 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredActive.map((g, idx) => {
                    const isChecked = selectedIds.includes(g.id);
                    return (
                      <tr
                        key={g.id}
                        className={`transition-colors ${isChecked ? 'bg-teal-50' : 'hover:bg-slate-50'}`}
                      >
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelectActive(g.id)}
                            className="w-4 h-4 text-teal-600 rounded cursor-pointer accent-teal-600"
                          />
                        </td>
                        <td className="p-2.5 font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-slate-900">
                          <span>{g.nama}</span>
                        </td>
                        <td className="p-2.5 text-slate-600 font-mono text-[11px]">{g.nip || '-'}</td>
                        <td className="p-2.5">
                          {g.mapelUtama ? (
                            <span className="bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                              {g.mapelUtama}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">-</span>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => startEdit(g)}
                              id={`btn-edit-guru-${g.id}`}
                              className="text-amber-600 hover:text-amber-800 p-1.5 rounded hover:bg-amber-50 transition-colors"
                              title="Edit Data Guru"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSingle(g.id, g.nama)}
                              id={`btn-delete-guru-${g.id}`}
                              className="text-rose-600 hover:text-rose-800 p-1.5 rounded hover:bg-rose-50 transition-colors"
                              title="Hapus Guru (Pindah ke Riwayat & Blok Merah di Sheets)"
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
                      <td colSpan={6} className="p-6 text-center text-xs text-slate-400 italic">
                        {guruList.length === 0 ? 'Belum ada data guru aktif.' : 'Tidak ada guru yang sesuai pencarian.'}
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
              <span>Riwayat Hapus ({deletedGuruList.length})</span>
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
              <span>Riwayat Edit ({editedGuruList.length})</span>
            </button>
          </div>

          {historySubTab === 'deleted' ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-rose-100/70 p-3.5 rounded-lg border border-rose-300 text-rose-900">
                <AlertOctagon className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <strong className="block font-bold">Riwayat Penghapusan Data Guru (Bisa Dipulihkan & Terblok Merah di Google Sheets)</strong>
                  Data di bawah ini telah dihapus dari daftar aktif. Pada Google Sheets (sheet <code>Data_Guru</code>), baris data ini ditandai <strong>BLOK MERAH</strong> dengan status <strong>DIHAPUS</strong> beserta tanggal dan jam penghapusan. Anda dapat memulihkan data kembali ke daftar aktif kapan saja.
                </div>
              </div>

              {/* Search & Stats in Deleted View */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Cari riwayat guru terhapus..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-rose-300 rounded-lg text-xs outline-none focus:border-rose-500"
                  />
                </div>
                <span className="text-xs font-bold text-rose-800">
                  Total Terhapus: {filteredDeleted.length}
                </span>
              </div>

              {/* Bulk Action Banner for Deleted Items */}
              {selectedDeletedIds.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white border-2 border-emerald-400 p-3 rounded-xl shadow-xs text-slate-900">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="bg-emerald-600 text-white font-black px-2.5 py-0.5 rounded-full text-xs shadow-xs">
                      {selectedDeletedIds.length}
                    </span>
                    <span>Riwayat Guru dipilih</span>
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

              {/* Table for Deleted Items with Select All */}
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
                      <th className="p-2.5">Nama Guru</th>
                      <th className="p-2.5">NIP / NIK</th>
                      <th className="p-2.5">Mapel</th>
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
                          <td className="p-2.5 text-slate-600 font-mono text-[11px]">{d.nip || '-'}</td>
                          <td className="p-2.5 text-slate-600">{d.mapelUtama || '-'}</td>
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
                                title="Pulihkan data guru ke daftar aktif"
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
                    {filteredDeleted.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-xs text-slate-400 italic">
                          Tidak ada riwayat guru yang dihapus.
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
                  <strong className="block font-bold">Riwayat Pengeditan Data Guru (Tercatat & Terblok Kuning di Google Sheets)</strong>
                  Data di bawah ini merupakan riwayat guru yang pernah diedit. Pada Google Sheets (sheet <code>Data_Guru</code>), baris data ini ditandai <strong>BLOK KUNING MUDA</strong> dengan status <strong>DIEDIT</strong> beserta tanggal, jam, dan rincian perubahan data lama vs baru.
                </div>
              </div>

              {/* Search in Edited View */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Cari riwayat guru yang diedit..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs outline-none focus:border-amber-500"
                  />
                </div>
                <span className="text-xs font-bold text-amber-800">
                  Total Pernah Diedit: {filteredEdited.length}
                </span>
              </div>

              {/* Table for Edited Items */}
              <div className="overflow-x-auto bg-white border border-amber-200 rounded-lg max-h-96">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-amber-100/70 text-amber-950 text-[10px] font-black uppercase sticky top-0 z-10">
                    <tr>
                      <th className="p-2.5">No</th>
                      <th className="p-2.5">Nama Guru</th>
                      <th className="p-2.5">NIP / NIK</th>
                      <th className="p-2.5">Mapel Utama</th>
                      <th className="p-2.5">Riwayat & Keterangan Perubahan</th>
                      <th className="p-2.5 text-center w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100">
                    {filteredEdited.map((g, idx) => (
                      <tr key={g.id} className="hover:bg-amber-50/50 transition-colors">
                        <td className="p-2.5 font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-slate-900">
                          <span>{g.nama}</span>
                        </td>
                        <td className="p-2.5 text-slate-600 font-mono text-[11px]">{g.nip || '-'}</td>
                        <td className="p-2.5">
                          {g.mapelUtama ? (
                            <span className="bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                              {g.mapelUtama}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">-</span>
                          )}
                        </td>
                        <td className="p-2.5">
                          {g.editHistory ? (
                            <div className="space-y-1">
                              {g.editHistory.split('\n').map((line, lIdx) => (
                                <p key={lIdx} className="text-[11px] text-amber-950 bg-amber-50/80 p-1.5 rounded border border-amber-200 font-mono leading-relaxed">
                                  {line}
                                </p>
                              ))}
                            </div>
                          ) : (
                            <div className="text-[11px] text-amber-900">
                              <span className="font-bold">Diedit pada:</span> {g.editedAt || '-'}
                              {g.editedBy && <span className="text-slate-500 block text-[10px]">Oleh: {g.editedBy}</span>}
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => startEdit(g)}
                            className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded text-xs font-bold transition-colors"
                            title="Edit Data Guru"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredEdited.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-xs text-slate-400 italic">
                          Belum ada riwayat perubahan/pengeditan data guru.
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

      {/* Edit Guru Modal */}
      {editingGuru && (
        <div
          id="modal-edit-guru"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Edit Data Guru</h3>
                  <p className="text-[11px] text-slate-500">Perbarui informasi guru secara manual langsung di sistem.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingGuru(null)}
                id="btn-close-edit-guru"
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Guru & Gelar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  id="input-edit-guru-nama"
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  placeholder="cth. Drs. Budi Santoso, M.Pd"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  NIP / NIK <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <input
                  type="text"
                  id="input-edit-guru-nip"
                  value={editNip}
                  onChange={(e) => setEditNip(e.target.value)}
                  placeholder="cth. 19800101 200501 1 001"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mapel Utama <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <select
                  id="select-edit-guru-mapel"
                  value={editMapel}
                  onChange={(e) => setEditMapel(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 bg-white"
                >
                  <option value="">-- Pilih Mata Pelajaran --</option>
                  {mapelList.map((m) => (
                    <option key={m.id} value={m.nama}>
                      {m.nama} {m.kode ? `(${m.kode})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-5">
                <button
                  type="button"
                  id="btn-cancel-edit-guru"
                  onClick={() => setEditingGuru(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-save-edit-guru"
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
