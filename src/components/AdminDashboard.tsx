import React, { useState } from 'react';
import {
  Users,
  BookOpen,
  School,
  GraduationCap,
  UserCheck,
  FileSpreadsheet,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';
import { Guru, Mapel, Kelas, Siswa, AccountWaliKelas, Aduan } from '../types';
import { GoogleSheetsSyncBanner } from './GoogleSheetsSyncBanner';
import { ExcelImportModal } from './ExcelImportModal';
import { ExcelImportType } from '../utils/excelHelper';
import {
  getStoredDeletedGuru,
  getStoredDeletedMapel,
  getStoredDeletedKelas,
  getStoredDeletedSiswa,
  getStoredDeletedWaliKelas,
  getStoredDeletedAduan
} from '../data/storage';
import { RekapAduanTab } from './admin/RekapAduanTab';
import { KelolaGuruTab } from './admin/KelolaGuruTab';
import { KelolaMapelTab } from './admin/KelolaMapelTab';
import { KelolaKelasTab } from './admin/KelolaKelasTab';
import { KelolaMuridTab } from './admin/KelolaMuridTab';
import { KelolaWaliKelasTab } from './admin/KelolaWaliKelasTab';

interface AdminDashboardProps {
  guruList: Guru[];
  mapelList: Mapel[];
  kelasList: Kelas[];
  siswaList: Siswa[];
  waliKelasList: AccountWaliKelas[];
  aduanList: Aduan[];
  onUpdateGuru: (list: Guru[]) => void;
  onUpdateMapel: (list: Mapel[]) => void;
  onUpdateKelas: (list: Kelas[]) => void;
  onUpdateSiswa: (list: Siswa[]) => void;
  onUpdateWaliKelas: (list: AccountWaliKelas[]) => void;
  onDeleteAduan?: (id: string) => void;
  onDeleteMultipleAduan?: (ids: string[]) => void;
  onRestoreAduan?: (restoredItems: Aduan[]) => void;
  onCloseDashboard: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  guruList,
  mapelList,
  kelasList,
  siswaList,
  waliKelasList,
  aduanList,
  onUpdateGuru,
  onUpdateMapel,
  onUpdateKelas,
  onUpdateSiswa,
  onUpdateWaliKelas,
  onDeleteAduan,
  onDeleteMultipleAduan,
  onRestoreAduan,
  onCloseDashboard
}) => {
  const [activeTab, setActiveTab] = useState<'rekap' | 'guru' | 'mapel' | 'kelas' | 'siswa' | 'walikelas'>('rekap');

  // Stored deleted lists for master data and aduan
  const [deletedGuruList, setDeletedGuruList] = useState<Guru[]>(getStoredDeletedGuru);
  const [deletedMapelList, setDeletedMapelList] = useState<Mapel[]>(getStoredDeletedMapel);
  const [deletedKelasList, setDeletedKelasList] = useState<Kelas[]>(getStoredDeletedKelas);
  const [deletedSiswaList, setDeletedSiswaList] = useState<Siswa[]>(getStoredDeletedSiswa);
  const [deletedWaliKelasList, setDeletedWaliKelasList] = useState<AccountWaliKelas[]>(getStoredDeletedWaliKelas);
  const [deletedAduanList, setDeletedAduanList] = useState<Aduan[]>(getStoredDeletedAduan);

  // Global notice toast
  const [notice, setNotice] = useState<string | null>(null);

  // Excel Bulk Import Modal State
  const [excelModalType, setExcelModalType] = useState<ExcelImportType | null>(null);

  // In-App Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'single' | 'bulk' | 'master';
    title: string;
    description: string;
    count?: number;
    onConfirm: () => void;
  } | null>(null);

  const getFormattedDelTimestamp = () => {
    const now = new Date();
    return (
      now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ' ' +
      now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) +
      ' WIB'
    );
  };

  // Bulk Excel Import Handler
  const handleExcelImport = (
    data: any[],
    mode: 'append' | 'replace',
    stats: { newCount: number; duplicateCount: number }
  ) => {
    if (!excelModalType || data.length === 0) return;

    const dupNote =
      stats.duplicateCount > 0 ? ` (${stats.duplicateCount} data duplikat dilewati)` : '';

    if (excelModalType === 'guru') {
      const updated = mode === 'replace' ? (data as Guru[]) : [...guruList, ...(data as Guru[])];
      onUpdateGuru(updated);
      setNotice(`✅ Berhasil ${mode === 'replace' ? 'menimpa seluruh' : 'menambahkan'} ${data.length} data Guru dari Excel.${dupNote}`);
    } else if (excelModalType === 'mapel') {
      const updated = mode === 'replace' ? (data as Mapel[]) : [...mapelList, ...(data as Mapel[])];
      onUpdateMapel(updated);
      setNotice(`✅ Berhasil ${mode === 'replace' ? 'menimpa seluruh' : 'menambahkan'} ${data.length} Mata Pelajaran dari Excel.${dupNote}`);
    } else if (excelModalType === 'kelas') {
      const updated = mode === 'replace' ? (data as Kelas[]) : [...kelasList, ...(data as Kelas[])];
      onUpdateKelas(updated);
      setNotice(`✅ Berhasil ${mode === 'replace' ? 'menimpa seluruh' : 'menambahkan'} ${data.length} Kelas dari Excel.${dupNote}`);
    } else if (excelModalType === 'siswa') {
      const updated = mode === 'replace' ? (data as Siswa[]) : [...siswaList, ...(data as Siswa[])];
      onUpdateSiswa(updated);
      setNotice(`✅ Berhasil ${mode === 'replace' ? 'menimpa seluruh' : 'menambahkan'} ${data.length} data Murid dari Excel.${dupNote}`);
    } else if (excelModalType === 'walikelas') {
      const updated = mode === 'replace' ? (data as AccountWaliKelas[]) : [...waliKelasList, ...(data as AccountWaliKelas[])];
      onUpdateWaliKelas(updated);
      setNotice(`✅ Berhasil ${mode === 'replace' ? 'menimpa seluruh' : 'menambahkan'} ${data.length} Akun Wali Kelas dari Excel.${dupNote}`);
    }

    setTimeout(() => setNotice(null), 6000);
  };

  return (
    <div className="bg-slate-50 border border-slate-300 rounded-xl shadow-2xl p-4 md:p-6 space-y-6">
      {/* Panel Top Nav Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg md:text-xl font-black text-teal-950 uppercase tracking-tight flex items-center gap-2">
            <School className="w-6 h-6 text-teal-700" />
            PANEL KELOLA & REKAP ADMIN SAWAL
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            SMA Negeri 4 Berau &bull; Pengelolaan Master Data & Rekapitulasi Aduan
          </p>
        </div>

        <button
          onClick={onCloseDashboard}
          className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all active:scale-95 shadow-xs"
        >
          KEMBALI KE HALAMAN UTAMA
        </button>
      </div>

      {/* Google Sheets Sync Control Banner */}
      <GoogleSheetsSyncBanner
        aduanList={aduanList}
        waliKelasList={waliKelasList}
        muridList={siswaList}
        guruList={guruList}
        mapelList={mapelList}
        kelasList={kelasList}
      />

      {/* Admin Menu Tabs */}
      <div className="flex flex-wrap gap-2 bg-slate-200/80 p-1.5 rounded-xl border border-slate-300">
        <button
          onClick={() => setActiveTab('rekap')}
          id="tab-rekap-aduan"
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-black transition-all ${
            activeTab === 'rekap'
              ? 'bg-teal-800 text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-300/60'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>REKAP SELURUH ADUAN ({aduanList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('guru')}
          id="tab-kelola-guru"
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-black transition-all ${
            activeTab === 'guru'
              ? 'bg-teal-800 text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-300/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>KELOLA GURU ({guruList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('mapel')}
          id="tab-kelola-mapel"
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-black transition-all ${
            activeTab === 'mapel'
              ? 'bg-teal-800 text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-300/60'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>KELOLA MAPEL ({mapelList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('kelas')}
          id="tab-kelola-kelas"
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-black transition-all ${
            activeTab === 'kelas'
              ? 'bg-teal-800 text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-300/60'
          }`}
        >
          <School className="w-4 h-4" />
          <span>KELOLA KELAS ({kelasList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('siswa')}
          id="tab-kelola-siswa"
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-black transition-all ${
            activeTab === 'siswa'
              ? 'bg-teal-800 text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-300/60'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>KELOLA MURID ({siswaList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('walikelas')}
          id="tab-kelola-walikelas"
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-black transition-all ${
            activeTab === 'walikelas'
              ? 'bg-teal-800 text-white shadow-md'
              : 'text-slate-700 hover:bg-slate-300/60'
          }`}
        >
          <UserCheck className="w-4 h-4 text-amber-300" />
          <span>AKUN WALI KELAS ({waliKelasList.length})</span>
        </button>
      </div>

      {/* Live Notice Notification Toast */}
      {notice && (
        <div className="flex items-center justify-between gap-3 bg-emerald-50 border-2 border-emerald-400 p-3 rounded-xl shadow-xs text-emerald-950 animate-fade-in text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="text-base">⚡</span>
            <span>{notice}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            className="text-emerald-700 hover:text-emerald-950 text-xs px-2 py-0.5 rounded"
          >
            ✕
          </button>
        </div>
      )}

      {/* SUB MENU VIEW BASED ON ACTIVE TAB */}
      {activeTab === 'rekap' && (
        <RekapAduanTab
          aduanList={aduanList}
          kelasList={kelasList}
          deletedAduanList={deletedAduanList}
          onDeleteAduan={onDeleteAduan}
          onDeleteMultipleAduan={onDeleteMultipleAduan}
          onUpdateDeletedAduan={setDeletedAduanList}
          onRestoreAduan={onRestoreAduan}
          setDeleteModal={setDeleteModal}
          setNotice={setNotice}
          getFormattedDelTimestamp={getFormattedDelTimestamp}
        />
      )}

      {activeTab === 'guru' && (
        <KelolaGuruTab
          guruList={guruList}
          mapelList={mapelList}
          deletedGuruList={deletedGuruList}
          onUpdateGuru={onUpdateGuru}
          onUpdateDeletedGuru={setDeletedGuruList}
          onOpenExcelModal={() => setExcelModalType('guru')}
          setDeleteModal={setDeleteModal}
          setNotice={setNotice}
          getFormattedDelTimestamp={getFormattedDelTimestamp}
        />
      )}

      {activeTab === 'mapel' && (
        <KelolaMapelTab
          mapelList={mapelList}
          deletedMapelList={deletedMapelList}
          onUpdateMapel={onUpdateMapel}
          onUpdateDeletedMapel={setDeletedMapelList}
          onOpenExcelModal={() => setExcelModalType('mapel')}
          setDeleteModal={setDeleteModal}
          setNotice={setNotice}
          getFormattedDelTimestamp={getFormattedDelTimestamp}
        />
      )}

      {activeTab === 'kelas' && (
        <KelolaKelasTab
          kelasList={kelasList}
          deletedKelasList={deletedKelasList}
          onUpdateKelas={onUpdateKelas}
          onUpdateDeletedKelas={setDeletedKelasList}
          onOpenExcelModal={() => setExcelModalType('kelas')}
          setDeleteModal={setDeleteModal}
          setNotice={setNotice}
          getFormattedDelTimestamp={getFormattedDelTimestamp}
        />
      )}

      {activeTab === 'siswa' && (
        <KelolaMuridTab
          siswaList={siswaList}
          kelasList={kelasList}
          deletedSiswaList={deletedSiswaList}
          onUpdateSiswa={onUpdateSiswa}
          onUpdateDeletedSiswa={setDeletedSiswaList}
          onOpenExcelModal={() => setExcelModalType('siswa')}
          setDeleteModal={setDeleteModal}
          setNotice={setNotice}
          getFormattedDelTimestamp={getFormattedDelTimestamp}
        />
      )}

      {activeTab === 'walikelas' && (
        <KelolaWaliKelasTab
          waliKelasList={waliKelasList}
          kelasList={kelasList}
          deletedWaliKelasList={deletedWaliKelasList}
          onUpdateWaliKelas={onUpdateWaliKelas}
          onUpdateDeletedWaliKelas={setDeletedWaliKelasList}
          onOpenExcelModal={() => setExcelModalType('walikelas')}
          setDeleteModal={setDeleteModal}
          setNotice={setNotice}
          getFormattedDelTimestamp={getFormattedDelTimestamp}
        />
      )}

      {/* Excel Bulk Import Modal */}
      {excelModalType && (
        <ExcelImportModal
          isOpen={!!excelModalType}
          importType={excelModalType}
          existingData={{
            guru: guruList,
            mapel: mapelList,
            kelas: kelasList,
            siswa: siswaList,
            walikelas: waliKelasList
          }}
          onClose={() => setExcelModalType(null)}
          onImportSuccess={handleExcelImport}
        />
      )}

      {/* In-App Delete Confirmation Modal */}
      {deleteModal && deleteModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-300 space-y-4 animate-scale-up">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-rose-100 text-rose-700 rounded-full shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">
                  {deleteModal.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {deleteModal.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={deleteModal.onConfirm}
                id="btn-confirm-delete-action"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-extrabold rounded-lg shadow transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
