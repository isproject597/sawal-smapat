import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Trash2,
  Search,
  Printer,
  RotateCcw,
  History,
  AlertOctagon,
  Clock
} from 'lucide-react';
import { Aduan, Kelas } from '../../types';
import { recordDeletedAduan, saveDeletedAduan } from '../../data/storage';
import { triggerBackgroundAutoSync } from '../../services/googleSheets';
import { PhotoGalleryViewer } from '../PhotoGalleryViewer';

interface RekapAduanTabProps {
  aduanList: Aduan[];
  kelasList: Kelas[];
  deletedAduanList: Aduan[];
  onDeleteAduan?: (id: string) => void;
  onDeleteMultipleAduan?: (ids: string[]) => void;
  onUpdateDeletedAduan: (list: Aduan[]) => void;
  onRestoreAduan?: (restoredItems: Aduan[]) => void;
  setDeleteModal: (modal: any) => void;
  setNotice: (msg: string | null) => void;
  getFormattedDelTimestamp: () => string;
}

export const RekapAduanTab: React.FC<RekapAduanTabProps> = ({
  aduanList,
  kelasList,
  deletedAduanList,
  onDeleteAduan,
  onDeleteMultipleAduan,
  onUpdateDeletedAduan,
  onRestoreAduan,
  setDeleteModal,
  setNotice,
  getFormattedDelTimestamp
}) => {
  const [viewMode, setViewMode] = useState<'active' | 'deleted'>('active');
  const [search, setSearch] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedDeletedIds, setSelectedDeletedIds] = useState<string[]>([]);

  // Filtering for Active
  const filteredActive = aduanList.filter((ad) => {
    const q = search.toLowerCase();
    const matchSearch =
      ad.namaGuru.toLowerCase().includes(q) ||
      ad.mapel.toLowerCase().includes(q) ||
      ad.jenisKesalahan.toLowerCase().includes(q) ||
      ad.siswaList.some((s) => s.toLowerCase().includes(q));
    const matchKelas = !filterKelas || ad.kelas === filterKelas;
    const matchStatus = !filterStatus || ad.status === filterStatus;
    return matchSearch && matchKelas && matchStatus;
  });

  // Filtering for Deleted
  const filteredDeleted = deletedAduanList.filter((ad) => {
    const q = search.toLowerCase();
    const matchSearch =
      ad.namaGuru.toLowerCase().includes(q) ||
      ad.mapel.toLowerCase().includes(q) ||
      ad.jenisKesalahan.toLowerCase().includes(q) ||
      ad.siswaList.some((s) => s.toLowerCase().includes(q));
    const matchKelas = !filterKelas || ad.kelas === filterKelas;
    return matchSearch && matchKelas;
  });

  // Active selection
  const isAllActiveSelected =
    filteredActive.length > 0 && filteredActive.every((ad) => selectedIds.includes(ad.id));

  const handleToggleSelectAllActive = () => {
    if (isAllActiveSelected) {
      const activeIdsSet = new Set(filteredActive.map((ad) => ad.id));
      setSelectedIds((prev) => prev.filter((id) => !activeIdsSet.has(id)));
    } else {
      const newSet = new Set(selectedIds);
      filteredActive.forEach((ad) => newSet.add(ad.id));
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
    filteredDeleted.every((ad) => selectedDeletedIds.includes(ad.id));

  const handleToggleSelectAllDeleted = () => {
    if (isAllDeletedSelected) {
      const delIdsSet = new Set(filteredDeleted.map((ad) => ad.id));
      setSelectedDeletedIds((prev) => prev.filter((id) => !delIdsSet.has(id)));
    } else {
      const newSet = new Set(selectedDeletedIds);
      filteredDeleted.forEach((ad) => newSet.add(ad.id));
      setSelectedDeletedIds(Array.from(newSet));
    }
  };

  const handleToggleSelectDeleted = (id: string) => {
    setSelectedDeletedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Sudah Ditindak Lanjuti':
        return (
          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
            Sudah Ditindaklanjuti
          </span>
        );
      case 'Dalam Proses':
        return (
          <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
            Dalam Proses
          </span>
        );
      default:
        return (
          <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
            Belum Ditindaklanjuti
          </span>
        );
    }
  };

  // Delete Handlers
  const handleDeleteSingle = (id: string, aduanInfo?: string) => {
    setDeleteModal({
      isOpen: true,
      type: 'single',
      title: 'Konfirmasi Hapus Aduan',
      description: aduanInfo
        ? `Apakah Anda yakin ingin menghapus aduan "${aduanInfo}" (${id})?`
        : `Apakah Anda yakin ingin menghapus aduan ${id}?`,
      onConfirm: () => {
        if (onDeleteAduan) {
          onDeleteAduan(id);
        }
        setSelectedIds((prev) => prev.filter((item) => item !== id));
        setDeleteModal(null);
        setNotice(`✅ Aduan ${id} telah dihapus & dicatat di Google Sheets.`);
        setTimeout(() => setNotice(null), 5000);
      }
    });
  };

  const handleDeleteBulk = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    setDeleteModal({
      isOpen: true,
      type: 'bulk',
      count,
      title: `Konfirmasi Hapus ${count} Aduan`,
      description: `Apakah Anda yakin ingin menghapus ${count} data aduan yang dipilih?`,
      onConfirm: () => {
        if (onDeleteMultipleAduan) {
          onDeleteMultipleAduan(selectedIds);
        }
        setSelectedIds([]);
        setDeleteModal(null);
        setNotice(`✅ ${count} data aduan terpilih telah dihapus & dicatat di Google Sheets.`);
        setTimeout(() => setNotice(null), 5000);
      }
    });
  };

  const handleRestoreSingle = (id: string) => {
    const target = deletedAduanList.find((ad) => ad.id === id);
    if (!target) return;
    const restored: Aduan = { ...target, isDeleted: false, deletedAt: undefined, deletedBy: undefined };
    const newDeleted = deletedAduanList.filter((ad) => ad.id !== id);
    saveDeletedAduan(newDeleted);
    onUpdateDeletedAduan(newDeleted);
    if (onRestoreAduan) {
      onRestoreAduan([restored]);
    }
    setSelectedDeletedIds((prev) => prev.filter((item) => item !== id));
    setNotice(`✅ Aduan ${target.id} (${target.namaGuru}) berhasil dipulihkan.`);
    setTimeout(() => setNotice(null), 5000);
  };

  const handleRestoreBulk = () => {
    if (selectedDeletedIds.length === 0) return;
    const targets = deletedAduanList.filter((ad) => selectedDeletedIds.includes(ad.id));
    const restoredList: Aduan[] = targets.map((t) => ({
      ...t,
      isDeleted: false,
      deletedAt: undefined,
      deletedBy: undefined
    }));
    const newDeleted = deletedAduanList.filter((ad) => !selectedDeletedIds.includes(ad.id));
    saveDeletedAduan(newDeleted);
    onUpdateDeletedAduan(newDeleted);
    if (onRestoreAduan) {
      onRestoreAduan(restoredList);
    }
    setSelectedDeletedIds([]);
    setNotice(`✅ ${targets.length} data aduan berhasil dipulihkan ke daftar aktif.`);
    setTimeout(() => setNotice(null), 5000);
  };

  const handlePermanentDeleteSingle = (id: string, info?: string) => {
    setDeleteModal({
      isOpen: true,
      type: 'master',
      title: 'Hapus Permanen dari Riwayat?',
      description: `Hapus aduan "${info || id}" secara permanen dari histori? Tindakan ini tidak dapat dibatalkan.`,
      onConfirm: () => {
        const newDeleted = deletedAduanList.filter((ad) => ad.id !== id);
        saveDeletedAduan(newDeleted);
        onUpdateDeletedAduan(newDeleted);
        setSelectedDeletedIds((prev) => prev.filter((item) => item !== id));
        triggerBackgroundAutoSync('aduan', { aduanList, deletedAduanList: newDeleted });
        setDeleteModal(null);
        setNotice(`✅ Aduan ${id} dihapus permanen dari riwayat.`);
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
      title: `Hapus Permanen ${count} Riwayat Aduan?`,
      description: `Hapus ${count} riwayat aduan terpilih secara permanen? Data yang telah dihapus permanen tidak dapat dipulihkan kembali.`,
      onConfirm: () => {
        const newDeleted = deletedAduanList.filter((ad) => !selectedDeletedIds.includes(ad.id));
        saveDeletedAduan(newDeleted);
        onUpdateDeletedAduan(newDeleted);
        setSelectedDeletedIds([]);
        triggerBackgroundAutoSync('aduan', { aduanList, deletedAduanList: newDeleted });
        setDeleteModal(null);
        setNotice(`✅ ${count} riwayat aduan berhasil dihapus permanen.`);
        setTimeout(() => setNotice(null), 4000);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Sub-view Navigation: Aktif vs Riwayat Terhapus */}
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
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Aduan Aktif ({aduanList.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('deleted')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'deleted'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <History className="w-3.5 h-3.5 text-rose-500" />
            <span>Riwayat Terhapus ({deletedAduanList.length})</span>
            {deletedAduanList.length > 0 && (
              <span className="bg-rose-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-black">
                {deletedAduanList.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" /> CETAK / EXPORT
          </button>
        </div>
      </div>

      {viewMode === 'active' ? (
        <>
          {/* Filter and Search Bar */}
          <div className="flex flex-wrap gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari guru, mapel, murid, atau jenis kesalahan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium outline-none focus:border-teal-600"
                />
              </div>

              <select
                value={filterKelas}
                onChange={(e) => setFilterKelas(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium outline-none"
              >
                <option value="">-- Semua Kelas --</option>
                {kelasList.map((k) => (
                  <option key={k.id} value={k.nama}>
                    {k.nama}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium outline-none"
              >
                <option value="">-- Semua Status --</option>
                <option value="Belum Ditindak Lanjuti">Belum Ditindak Lanjuti</option>
                <option value="Dalam Proses">Dalam Proses</option>
                <option value="Sudah Ditindak Lanjuti">Sudah Ditindak Lanjuti</option>
              </select>
            </div>
            <span className="text-xs font-bold text-slate-500">
              Total: {filteredActive.length} dari {aduanList.length} aduan
            </span>
          </div>

          {/* Bulk Action Bar */}
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 bg-rose-50 border-2 border-rose-300 p-3.5 rounded-xl shadow-xs text-rose-950">
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="bg-rose-600 text-white font-black px-2.5 py-0.5 rounded-full text-xs shadow-xs">
                  {selectedIds.length}
                </span>
                <span>Aduan dipilih untuk aksi bersama</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                >
                  Batalkan Pilihan
                </button>
                <button
                  type="button"
                  onClick={handleDeleteBulk}
                  id="btn-bulk-delete-aduan"
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-black rounded-lg flex items-center gap-1.5 shadow-xs transition-all border border-rose-500"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>HAPUS ({selectedIds.length}) ADUAN TERPILIH</span>
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead className="bg-teal-900 text-white uppercase text-[10px] font-extrabold tracking-wider">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllActiveSelected}
                        onChange={handleToggleSelectAllActive}
                        className="w-4 h-4 text-teal-600 rounded cursor-pointer accent-teal-600"
                        title={isAllActiveSelected ? 'Batalkan Pilih Semua' : 'Pilih Semua'}
                      />
                    </th>
                    <th className="p-3">No / ID</th>
                    <th className="p-3">Waktu Aduan</th>
                    <th className="p-3">Guru & Mapel</th>
                    <th className="p-3">Kelas</th>
                    <th className="p-3">Murid Melanggar</th>
                    <th className="p-3">Jenis Kesalahan</th>
                    <th className="p-3">Bukti</th>
                    <th className="p-3">Status & Riwayat</th>
                    <th className="p-3 text-center w-16">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {filteredActive.map((ad, idx) => {
                    const isSelected = selectedIds.includes(ad.id);
                    return (
                      <tr
                        key={`${ad.id}-${idx}`}
                        className={`transition-colors ${
                          isSelected ? 'bg-teal-100/60' : 'hover:bg-teal-50/50'
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectActive(ad.id)}
                            className="w-4 h-4 text-teal-600 rounded cursor-pointer accent-teal-600"
                            title="Pilih aduan ini"
                          />
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-500">
                          {idx + 1}. <br />
                          <span className="text-[9px] text-teal-800">{ad.id}</span>
                        </td>
                        <td className="p-3 font-semibold text-slate-800 min-w-[130px]">
                          {ad.timestampAduan}
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-slate-900 block">{ad.namaGuru}</span>
                          <span className="text-[10px] text-teal-700 font-bold">{ad.mapel}</span>
                        </td>
                        <td className="p-3 font-bold text-blue-900">{ad.kelas}</td>
                        <td className="p-3 min-w-[150px]">
                          <div className="flex flex-wrap gap-1">
                            {ad.siswaList.map((s, i) => (
                              <span
                                key={i}
                                className="bg-slate-100 text-slate-800 text-[10px] px-1.5 py-0.5 rounded border border-slate-200 font-semibold"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 max-w-xs">
                          <span className="font-bold text-slate-900 block">{ad.jenisKesalahan}</span>
                          {ad.keteranganLainnya && (
                            <span className="text-[10px] text-slate-500 italic block">
                              Ket: {ad.keteranganLainnya}
                            </span>
                          )}
                          {ad.catatanKronologi && (
                            <span className="text-[10px] text-amber-800 block mt-1 bg-amber-50 p-1 rounded border border-amber-200">
                              Kronologi: {ad.catatanKronologi}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <PhotoGalleryViewer
                            fotoBukti={ad.fotoBukti}
                            fotoBuktiList={ad.fotoBuktiList}
                            title={`Bukti Foto (${ad.id})`}
                            compact={true}
                          />
                        </td>
                        <td className="p-3 min-w-[180px]">
                          <div className="mb-1">{getStatusBadge(ad.status)}</div>
                          {ad.tindakLanjutHistory && ad.tindakLanjutHistory.length > 0 && (
                            <div className="text-[9px] bg-slate-50 p-1.5 rounded border border-slate-200 text-slate-600 space-y-1">
                              <span className="font-bold text-teal-900 block">Tindak Lanjut Terakhir:</span>
                              <p className="italic">
                                "{ad.tindakLanjutHistory[ad.tindakLanjutHistory.length - 1].keterangan}"
                              </p>
                              <span className="text-[8px] text-slate-400 block font-mono">
                                Oleh: {ad.tindakLanjutHistory[ad.tindakLanjutHistory.length - 1].olehWaliKelas}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteSingle(
                                ad.id,
                                `${ad.namaGuru} (${ad.kelas})`
                              )
                            }
                            id={`btn-delete-aduan-${ad.id}`}
                            className="p-2 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 rounded-lg transition-all shadow-xs flex items-center justify-center mx-auto group"
                            title="Hapus Aduan Ini"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredActive.length === 0 && (
                    <tr>
                      <td colSpan={10} className="p-6 text-center text-xs text-slate-400 italic">
                        Tidak ada aduan yang sesuai filter pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Deleted Aduan View */
        <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-start gap-3 bg-rose-100/70 p-3.5 rounded-lg border border-rose-300 text-rose-900">
            <AlertOctagon className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong className="block font-bold">Riwayat Penghapusan Aduan (Tercatat & Terblok Merah di Google Sheets)</strong>
              Data aduan di bawah ini telah dihapus dari daftar aktif. Pada Google Sheets (sheet <code>Rekap_Aduan</code>), baris data ini ditandai <strong>BLOK MERAH</strong> dengan status <strong>DIHAPUS</strong> beserta tanggal dan jam penghapusan. Anda dapat memilih beberapa atau memulihkan semuanya.
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Cari riwayat aduan terhapus..."
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
                <span>Riwayat Aduan dipilih</span>
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
                  <th className="p-2.5">ID / Guru</th>
                  <th className="p-2.5">Kelas & Murid</th>
                  <th className="p-2.5">Kesalahan</th>
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
                        <span className="font-mono text-[9px] text-rose-700 block">{d.id}</span>
                        <span className="font-bold text-rose-950 line-through opacity-80 block">{d.namaGuru}</span>
                        <span className="bg-rose-100 text-rose-800 text-[8px] font-black px-1.5 py-0.2 rounded border border-rose-300">
                          DIHAPUS
                        </span>
                      </td>
                      <td className="p-2.5">
                        <span className="font-bold text-blue-900 block">{d.kelas}</span>
                        <span className="text-[10px] text-slate-600">{d.siswaList.join(', ')}</span>
                      </td>
                      <td className="p-2.5 text-slate-700 font-medium">
                        {d.jenisKesalahan}
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
                            title="Pulihkan Aduan"
                          >
                            <RotateCcw className="w-3 h-3" /> Pulihkan
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePermanentDeleteSingle(d.id, `${d.namaGuru} (${d.kelas})`)}
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
                      Tidak ada riwayat aduan yang dihapus.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
