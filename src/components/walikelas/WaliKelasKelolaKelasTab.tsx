import React, { useState, useRef, useMemo } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Search,
  RotateCcw,
  History,
  AlertOctagon,
  Download,
  Upload,
  Pencil,
  CheckCircle2,
  X,
  CheckSquare,
  Square,
  FileSpreadsheet,
  FileCheck,
  Sparkles,
  CopyX,
  Layers,
  AlertTriangle,
  RefreshCw,
  Clock,
  ShieldCheck,
  GraduationCap,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowUpAZ,
  ArrowDownAZ,
  SlidersHorizontal
} from 'lucide-react';
import { Siswa, Kelas, UserSession } from '../../types';
import {
  downloadTemplateMuridKelas,
  parseExcelFile,
  SkippedDuplicateItem
} from '../../utils/excelHelper';
import { getFullTimestamp } from '../../utils/dateHelper';
import {
  getStoredDeletedSiswa,
  saveDeletedSiswa,
  recordDeletedSiswa
} from '../../data/storage';
import { triggerBackgroundAutoSync } from '../../services/googleSheets';

interface WaliKelasKelolaKelasTabProps {
  session: UserSession;
  siswaList: Siswa[];
  kelasList?: Kelas[];
  onUpdateSiswa: (list: Siswa[]) => void;
  showNotification: (msg: string) => void;
}

export type SortField = 'nama' | 'nis' | 'waktu';
export type SortDirection = 'asc' | 'desc';

export const WaliKelasKelolaKelasTab: React.FC<WaliKelasKelolaKelasTabProps> = ({
  session,
  siswaList,
  kelasList = [],
  onUpdateSiswa,
  showNotification
}) => {
  const kelasAssigned = session.kelasAssigned || 'Semua Kelas';

  // Deleted siswa state for this session/class
  const [deletedSiswaList, setDeletedSiswaList] = useState<Siswa[]>(getStoredDeletedSiswa);

  // Tab & Sub-tab view state
  const [viewMode, setViewMode] = useState<'active' | 'history'>('active');
  const [historySubTab, setHistorySubTab] = useState<'deleted' | 'edited'>('deleted');

  // Search & Filter
  const [search, setSearch] = useState('');

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('nama');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Bulk Selection States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedDeletedIds, setSelectedDeletedIds] = useState<string[]>([]);

  // Manual Add Student Form States
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [newNama, setNewNama] = useState('');
  const [newNis, setNewNis] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  // Edit Student Modal States
  const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null);
  const [editNama, setEditNama] = useState('');
  const [editNis, setEditNis] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'single' | 'bulk' | 'permanent-single' | 'permanent-bulk';
    targetId?: string;
    targetName?: string;
    targetIds?: string[];
    title: string;
    description: string;
  }>({
    isOpen: false,
    type: 'single',
    title: '',
    description: ''
  });

  // Excel Bulk Import Modal States
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isExcelProcessing, setIsExcelProcessing] = useState(false);
  const [excelNewItems, setExcelNewItems] = useState<Siswa[]>([]);
  const [excelRawParsed, setExcelRawParsed] = useState<Siswa[]>([]);
  const [excelSkippedDuplicates, setExcelSkippedDuplicates] = useState<SkippedDuplicateItem[]>([]);
  const [excelErrors, setExcelErrors] = useState<string[]>([]);
  const [excelActiveTab, setExcelActiveTab] = useState<'new' | 'duplicates'>('new');
  const [excelImportMode, setExcelImportMode] = useState<'append' | 'replace'>('append');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter students belonging to this Wali Kelas
  const myClassStudents = siswaList.filter((s) => {
    if (!session.kelasAssigned) return true;
    return s.kelas.trim().toLowerCase() === session.kelasAssigned.trim().toLowerCase();
  });

  const myClassDeleted = deletedSiswaList.filter((s) => {
    if (!session.kelasAssigned) return true;
    return s.kelas.trim().toLowerCase() === session.kelasAssigned.trim().toLowerCase();
  });

  const myClassEdited = myClassStudents.filter((s) => s.isEdited || s.editHistory);

  // Filtered active list for display
  const filteredActive = myClassStudents.filter((s) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      s.nama.toLowerCase().includes(q) ||
      (s.nis && s.nis.toLowerCase().includes(q)) ||
      s.kelas.toLowerCase().includes(q)
    );
  });

  // Filtered deleted list for display
  const filteredDeleted = myClassDeleted.filter((s) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      s.nama.toLowerCase().includes(q) ||
      (s.nis && s.nis.toLowerCase().includes(q)) ||
      s.kelas.toLowerCase().includes(q)
    );
  });

  // Filtered edited list for display
  const filteredEdited = myClassEdited.filter((s) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      s.nama.toLowerCase().includes(q) ||
      (s.nis && s.nis.toLowerCase().includes(q)) ||
      s.kelas.toLowerCase().includes(q) ||
      (s.editHistory && s.editHistory.toLowerCase().includes(q))
    );
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
      } else if (field === 'waktu') {
        const timeA = a.editedAt || a.deletedAt || a.id || '';
        const timeB = b.editedAt || b.deletedAt || b.id || '';
        comparison = timeA.localeCompare(timeB);
      }
      return dir === 'asc' ? comparison : -comparison;
    });
  };

  // Sorted lists for active, deleted, and edited views
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

  // Active Selection Handlers
  const isAllActiveSelected =
    sortedActive.length > 0 && sortedActive.every((s) => selectedIds.includes(s.id));

  const handleToggleSelectAllActive = () => {
    if (isAllActiveSelected) {
      const activeIds = new Set(sortedActive.map((s) => s.id));
      setSelectedIds((prev) => prev.filter((id) => !activeIds.has(id)));
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

  // Deleted Selection Handlers
  const isAllDeletedSelected =
    sortedDeleted.length > 0 &&
    sortedDeleted.every((s) => selectedDeletedIds.includes(s.id));

  const handleToggleSelectAllDeleted = () => {
    if (isAllDeletedSelected) {
      const delIds = new Set(sortedDeleted.map((s) => s.id));
      setSelectedDeletedIds((prev) => prev.filter((id) => !delIds.has(id)));
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

  // 1. ACTION: ADD STUDENT MANUALLY
  const handleAddStudentManual = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    const trimmedNama = newNama.trim();
    if (!trimmedNama) {
      setAddError('Nama Murid wajib diisi.');
      return;
    }

    const currentKelas = session.kelasAssigned || 'X-1';
    const trimmedNis = newNis.trim() || `NIS-${Date.now().toString().slice(-4)}`;

    // Check duplicate in this class
    const isDuplicate = myClassStudents.some((s) => {
      const sameName = s.nama.trim().toLowerCase() === trimmedNama.toLowerCase();
      const sameNis = s.nis && newNis.trim() && s.nis.trim().toLowerCase() === newNis.trim().toLowerCase();
      return sameName || sameNis;
    });

    if (isDuplicate) {
      setAddError(`Murid dengan Nama "${trimmedNama}" atau NIS "${trimmedNis}" sudah ada di kelas ${currentKelas}.`);
      return;
    }

    const newItem: Siswa = {
      id: `s_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      nama: trimmedNama,
      nis: trimmedNis,
      kelas: currentKelas
    };

    const updatedList = [...siswaList, newItem];
    onUpdateSiswa(updatedList);
    setNewNama('');
    setNewNis('');
    setIsAddFormOpen(false);
    showNotification(`✅ Murid "${newItem.nama}" (${newItem.kelas}) berhasil ditambahkan secara manual.`);
  };

  // 2. ACTION: EDIT STUDENT
  const handleStartEdit = (siswa: Siswa) => {
    setEditingSiswa(siswa);
    setEditNama(siswa.nama);
    setEditNis(siswa.nis || '');
    setEditError(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSiswa) return;
    setEditError(null);

    const trimmedNama = editNama.trim();
    const trimmedNis = editNis.trim() || undefined;

    if (!trimmedNama) {
      setEditError('Nama Murid tidak boleh kosong.');
      return;
    }

    // Check difference
    const changes: string[] = [];
    if (editingSiswa.nama !== trimmedNama) {
      changes.push(`Nama: "${editingSiswa.nama}" ➔ "${trimmedNama}"`);
    }
    if ((editingSiswa.nis || '-') !== (trimmedNis || '-')) {
      changes.push(`NIS: "${editingSiswa.nis || '-'}" ➔ "${trimmedNis || '-'}"`);
    }

    if (changes.length === 0) {
      setEditingSiswa(null);
      return;
    }

    const timestamp = getFullTimestamp();
    const actor = `${session.nama || 'Wali Kelas'} (${session.kelasAssigned || 'Wali Kelas'})`;
    const newLog = `[${timestamp}] DIEDIT (${actor}): ${changes.join(' | ')}`;
    const combinedHistory = editingSiswa.editHistory
      ? `${newLog}\n${editingSiswa.editHistory}`
      : newLog;

    const updatedItem: Siswa = {
      ...editingSiswa,
      nama: trimmedNama,
      nis: trimmedNis,
      isEdited: true,
      editedAt: timestamp,
      editedBy: actor,
      editHistory: combinedHistory
    };

    const updatedList = siswaList.map((s) => (s.id === editingSiswa.id ? updatedItem : s));
    onUpdateSiswa(updatedList);
    setEditingSiswa(null);
    showNotification(
      `✅ Data murid "${updatedItem.nama}" berhasil diperbarui. Perubahan otomatis disinkronkan & terblok kuning di Google Sheets.`
    );
  };

  // 3. ACTION: DELETE SINGLE
  const handleOpenDeleteSingle = (siswa: Siswa) => {
    setDeleteModal({
      isOpen: true,
      type: 'single',
      targetId: siswa.id,
      targetName: siswa.nama,
      title: 'Hapus Data Murid?',
      description: `Apakah Anda yakin ingin menghapus data murid "${siswa.nama}" (NIS: ${siswa.nis || '-'}, Kelas: ${siswa.kelas})? Data akan dipindahkan ke Riwayat Terhapus dan otomatis diberi tanda Blok Merah di Google Sheets.`
    });
  };

  // 4. ACTION: DELETE BULK
  const handleOpenDeleteBulk = () => {
    if (selectedIds.length === 0) return;
    const targets = myClassStudents.filter((s) => selectedIds.includes(s.id));
    const targetNames =
      targets.map((s) => s.nama).slice(0, 4).join(', ') +
      (targets.length > 4 ? ` dan ${targets.length - 4} lainnya` : '');

    setDeleteModal({
      isOpen: true,
      type: 'bulk',
      targetIds: selectedIds,
      title: `Hapus ${selectedIds.length} Murid Terpilih?`,
      description: `Apakah Anda yakin ingin menghapus ${selectedIds.length} murid (${targetNames})? Seluruh data terpilih akan dipindahkan ke Riwayat Terhapus dan otomatis diberi tanda Blok Merah di Google Sheets.`
    });
  };

  // Confirm Delete Handler
  const handleConfirmDelete = () => {
    const timestamp = getFullTimestamp();
    const actor = `${session.nama || 'Wali Kelas'} (${session.kelasAssigned || 'Wali Kelas'})`;

    if (deleteModal.type === 'single' && deleteModal.targetId) {
      const target = siswaList.find((s) => s.id === deleteModal.targetId);
      if (target) {
        const deletedRecord: Siswa = {
          ...target,
          isDeleted: true,
          deletedAt: timestamp,
          deletedBy: actor
        };
        const updatedDeleted = recordDeletedSiswa([deletedRecord]);
        setDeletedSiswaList(updatedDeleted);
      }
      const remaining = siswaList.filter((s) => s.id !== deleteModal.targetId);
      onUpdateSiswa(remaining);
      setSelectedIds((prev) => prev.filter((id) => id !== deleteModal.targetId));
      showNotification(`✅ Murid "${deleteModal.targetName || 'Siswa'}" berhasil dihapus.`);
    } else if (deleteModal.type === 'bulk' && deleteModal.targetIds) {
      const targets = siswaList.filter((s) => deleteModal.targetIds!.includes(s.id));
      const deletedRecords: Siswa[] = targets.map((t) => ({
        ...t,
        isDeleted: true,
        deletedAt: timestamp,
        deletedBy: actor
      }));
      const updatedDeleted = recordDeletedSiswa(deletedRecords);
      setDeletedSiswaList(updatedDeleted);

      const remaining = siswaList.filter((s) => !deleteModal.targetIds!.includes(s.id));
      onUpdateSiswa(remaining);
      setSelectedIds([]);
      showNotification(`✅ ${deleteModal.targetIds.length} murid berhasil dihapus secara massal.`);
    } else if (deleteModal.type === 'permanent-single' && deleteModal.targetId) {
      const newDeleted = deletedSiswaList.filter((s) => s.id !== deleteModal.targetId);
      saveDeletedSiswa(newDeleted);
      setDeletedSiswaList(newDeleted);
      setSelectedDeletedIds((prev) => prev.filter((id) => id !== deleteModal.targetId));
      triggerBackgroundAutoSync('murid', { siswaList, deletedSiswaList: newDeleted });
      showNotification(`✅ Murid "${deleteModal.targetName || 'Siswa'}" dihapus permanen dari riwayat.`);
    } else if (deleteModal.type === 'permanent-bulk' && deleteModal.targetIds) {
      const newDeleted = deletedSiswaList.filter((s) => !deleteModal.targetIds!.includes(s.id));
      saveDeletedSiswa(newDeleted);
      setDeletedSiswaList(newDeleted);
      setSelectedDeletedIds([]);
      triggerBackgroundAutoSync('murid', { siswaList, deletedSiswaList: newDeleted });
      showNotification(`✅ ${deleteModal.targetIds.length} riwayat murid berhasil dihapus permanen.`);
    }

    setDeleteModal({ isOpen: false, type: 'single', title: '', description: '' });
  };

  // 5. ACTION: RESTORE SINGLE
  const handleRestoreSingle = (siswa: Siswa) => {
    const restored: Siswa = {
      ...siswa,
      isDeleted: false,
      deletedAt: undefined,
      deletedBy: undefined
    };
    const newDeleted = deletedSiswaList.filter((s) => s.id !== siswa.id);
    saveDeletedSiswa(newDeleted);
    setDeletedSiswaList(newDeleted);
    onUpdateSiswa([...siswaList, restored]);
    setSelectedDeletedIds((prev) => prev.filter((id) => id !== siswa.id));
    showNotification(`✅ Murid "${siswa.nama}" (${siswa.kelas}) berhasil dipulihkan kembali ke kelas aktif.`);
  };

  // 6. ACTION: RESTORE BULK
  const handleRestoreBulk = () => {
    if (selectedDeletedIds.length === 0) return;
    const targets = myClassDeleted.filter((s) => selectedDeletedIds.includes(s.id));
    const restoredList: Siswa[] = targets.map((t) => ({
      ...t,
      isDeleted: false,
      deletedAt: undefined,
      deletedBy: undefined
    }));
    const newDeleted = deletedSiswaList.filter((s) => !selectedDeletedIds.includes(s.id));
    saveDeletedSiswa(newDeleted);
    setDeletedSiswaList(newDeleted);
    onUpdateSiswa([...siswaList, ...restoredList]);
    setSelectedDeletedIds([]);
    showNotification(`✅ ${targets.length} murid berhasil dipulihkan secara massal ke kelas aktif.`);
  };

  // 7. ACTION: EXCEL IMPORT HANDLERS
  const handleOpenExcelModal = () => {
    setExcelFile(null);
    setExcelNewItems([]);
    setExcelRawParsed([]);
    setExcelSkippedDuplicates([]);
    setExcelErrors([]);
    setExcelActiveTab('new');
    setExcelImportMode('append');
    setIsExcelModalOpen(true);
  };

  const processExcelFile = async (file: File) => {
    setExcelFile(file);
    setIsExcelProcessing(true);
    setExcelErrors([]);

    const result = await parseExcelFile(
      file,
      'siswa',
      siswaList,
      session.kelasAssigned || undefined
    );

    setIsExcelProcessing(false);
    setExcelNewItems(result.data);
    setExcelRawParsed(result.rawParsed);
    setExcelSkippedDuplicates(result.skippedDuplicates);
    setExcelErrors(result.errors);

    if (result.data.length === 0 && result.skippedDuplicates.length > 0) {
      setExcelActiveTab('duplicates');
    } else {
      setExcelActiveTab('new');
    }
  };

  const handleExcelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processExcelFile(file);
    }
  };

  const handleExcelDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processExcelFile(file);
    }
  };

  const handleConfirmExcelImport = () => {
    const targetKelas = session.kelasAssigned || 'X-1';
    let itemsToImport: Siswa[] = [];

    if (excelImportMode === 'append') {
      if (excelNewItems.length === 0) return;
      // Ensure all imported items belong to this Wali Kelas' assigned class
      itemsToImport = excelNewItems.map((item) => ({
        ...item,
        kelas: targetKelas
      }));
      const updatedList = [...siswaList, ...itemsToImport];
      onUpdateSiswa(updatedList);
      showNotification(
        `✅ Berhasil mengimpor ${itemsToImport.length} murid baru ke Kelas ${targetKelas} (${excelSkippedDuplicates.length} duplikat otomatis dilewati).`
      );
    } else {
      // Replace only students of THIS class, keep other classes intact
      if (excelRawParsed.length === 0) return;
      itemsToImport = excelRawParsed.map((item) => ({
        ...item,
        kelas: targetKelas
      }));
      const otherClassStudents = siswaList.filter(
        (s) => s.kelas.trim().toLowerCase() !== targetKelas.trim().toLowerCase()
      );
      const updatedList = [...otherClassStudents, ...itemsToImport];
      onUpdateSiswa(updatedList);
      showNotification(
        `✅ Berhasil menimpa data Kelas ${targetKelas} dengan ${itemsToImport.length} murid dari file Excel.`
      );
    }

    setIsExcelModalOpen(false);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Top Header & Actions Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-emerald-700" />
            <h3 className="text-base md:text-lg font-black text-slate-900 uppercase tracking-tight">
              Manajemen Data Murid &bull; Kelas {kelasAssigned}
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data murid, input manual, impor Excel, pengeditan, serta riwayat penghapusan murid kelas Anda.
          </p>
        </div>

        {/* Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Download Template Button */}
          <button
            type="button"
            onClick={() => downloadTemplateMuridKelas(kelasAssigned)}
            id="btn-download-template-walikelas"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all active:scale-95 border border-slate-300 shadow-xs"
            title="Download Template Excel Resmi untuk Kelas Ini"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Format Excel (.xlsx)</span>
          </button>

          {/* Upload Excel Button */}
          <button
            type="button"
            onClick={handleOpenExcelModal}
            id="btn-upload-excel-walikelas"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow active:scale-95"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Excel (Masal)</span>
          </button>

          {/* Add Manual Student Button */}
          <button
            type="button"
            onClick={() => {
              setIsAddFormOpen(!isAddFormOpen);
              setAddError(null);
            }}
            id="btn-tambah-manual-walikelas"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-bold transition-all shadow active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Murid (Manual)</span>
          </button>
        </div>
      </div>

      {/* Collapsible Manual Add Student Form */}
      {isAddFormOpen && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-500/80 rounded-2xl p-5 shadow-md animate-scaleUp">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-200/80 mb-4">
            <div className="flex items-center gap-2 text-emerald-950 font-black text-sm uppercase">
              <Plus className="w-4 h-4 text-emerald-700" />
              <span>Form Input Manual Identitas Murid</span>
            </div>
            <button
              onClick={() => setIsAddFormOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {addError && (
            <div className="p-2.5 mb-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{addError}</span>
            </div>
          )}

          <form onSubmit={handleAddStudentManual} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Nama Lengkap */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-800 uppercase mb-1">
                  Nama Lengkap Murid <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Muhammad Royan"
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* NIS */}
              <div>
                <label className="block text-[11px] font-bold text-slate-800 uppercase mb-1">
                  NIS / NISN <span className="text-slate-400 text-[10px] lowercase">(opsional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 20261001"
                  value={newNis}
                  onChange={(e) => setNewNis(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-[11px] text-emerald-900 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Kelas Terpilih: <strong>{kelasAssigned}</strong> (Otomatis)</span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddFormOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-simpan-murid-manual"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow active:scale-95 transition-all"
                >
                  Simpan Murid
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Sub-Navigation Tabs: Murid Aktif vs Riwayat */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex bg-slate-200/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode('active')}
            id="tab-murid-aktif-walikelas"
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              viewMode === 'active'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Murid Aktif</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                viewMode === 'active'
                  ? 'bg-emerald-900 text-emerald-100'
                  : 'bg-slate-300 text-slate-700'
              }`}
            >
              {myClassStudents.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('history')}
            id="tab-riwayat-murid-walikelas"
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              viewMode === 'history'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-300/60'
            }`}
          >
            <History className="w-4 h-4 text-teal-400" />
            <span>Riwayat</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                viewMode === 'history'
                  ? 'bg-slate-950 text-teal-300'
                  : 'bg-slate-300 text-slate-700'
              }`}
            >
              {myClassDeleted.length + myClassEdited.length}
            </span>
          </button>
        </div>

        {/* Sub-Tabs for History */}
        {viewMode === 'history' && (
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setHistorySubTab('deleted')}
              id="subtab-riwayat-hapus-walikelas"
              className={`px-3 py-1 rounded-md font-bold transition-all ${
                historySubTab === 'deleted'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Riwayat Hapus ({myClassDeleted.length})
            </button>
            <button
              type="button"
              onClick={() => setHistorySubTab('edited')}
              id="subtab-riwayat-edit-walikelas"
              className={`px-3 py-1 rounded-md font-bold transition-all ${
                historySubTab === 'edited'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Riwayat Edit ({myClassEdited.length})
            </button>
          </div>
        )}
      </div>

      {/* Search, Filter & Sort Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            id="input-search-murid-walikelas"
            placeholder={`Cari nama murid atau NIS di Kelas ${kelasAssigned}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium outline-none focus:border-emerald-600 focus:bg-white transition-all"
          />
        </div>

        {/* Sorting Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sort By Field Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[11px] font-bold text-slate-600">Urutkan:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              id="select-sort-field-walikelas"
              aria-label="Pilih kolom pengurutan data murid"
              className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer pr-1"
            >
              <option value="nama">Nama Murid</option>
              <option value="nis">NIS / NISN</option>
              <option value="waktu">Waktu / Entri</option>
            </select>
          </div>

          {/* Ascending / Descending Toggle Buttons */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setSortDirection('asc')}
              id="btn-sort-asc-walikelas"
              title="Urutan Menaik (A ke Z, 0 ke 9, Terlama)"
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                sortDirection === 'asc'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ArrowUpAZ className="w-3.5 h-3.5" />
              <span className="text-[11px]">Ascending (A-Z)</span>
            </button>

            <button
              type="button"
              onClick={() => setSortDirection('desc')}
              id="btn-sort-desc-walikelas"
              title="Urutan Menurun (Z ke A, 9 ke 0, Terbaru)"
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                sortDirection === 'desc'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ArrowDownAZ className="w-3.5 h-3.5" />
              <span className="text-[11px]">Descending (Z-A)</span>
            </button>
          </div>

          <div className="text-xs font-bold text-slate-600 pl-1">
            Total:{' '}
            <span className="text-emerald-700 font-black">
              {viewMode === 'active'
                ? sortedActive.length
                : historySubTab === 'deleted'
                ? sortedDeleted.length
                : sortedEdited.length}{' '}
              Murid
            </span>
          </div>
        </div>
      </div>

      {/* Bulk Action Toolbar for Active Students */}
      {viewMode === 'active' && selectedIds.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-400 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
            <CheckSquare className="w-4 h-4 text-amber-700" />
            <span>{selectedIds.length} Murid Terpilih</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              id="btn-batal-pilih-murid-active"
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
            >
              Batalkan Pilihan
            </button>
            <button
              type="button"
              onClick={handleOpenDeleteBulk}
              id="btn-hapus-massal-murid-walikelas"
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg flex items-center gap-1.5 shadow transition-all active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>HAPUS ({selectedIds.length}) MURID TERPILIH</span>
            </button>
          </div>
        </div>
      )}

      {/* Bulk Action Toolbar for Deleted Students */}
      {viewMode === 'history' && historySubTab === 'deleted' && selectedDeletedIds.length > 0 && (
        <div className="bg-emerald-50 border-2 border-emerald-400 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
            <CheckSquare className="w-4 h-4 text-emerald-700" />
            <span>{selectedDeletedIds.length} Riwayat Murid Terpilih</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedDeletedIds([])}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
            >
              Batalkan Pilihan
            </button>
            <button
              type="button"
              onClick={handleRestoreBulk}
              id="btn-pulihkan-massal-murid-walikelas"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg flex items-center gap-1.5 shadow transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>PULIHKAN ({selectedDeletedIds.length}) MURID</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setDeleteModal({
                  isOpen: true,
                  type: 'permanent-bulk',
                  targetIds: selectedDeletedIds,
                  title: `Hapus Permanen ${selectedDeletedIds.length} Riwayat?`,
                  description: `Apakah Anda yakin ingin menghapus permanen ${selectedDeletedIds.length} data murid dari riwayat? Tindakan ini tidak dapat dibatalkan.`
                });
              }}
              className="bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow transition-all active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>HAPUS PERMANEN</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW 1: ACTIVE STUDENTS TABLE */}
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
                      className="text-white hover:text-emerald-200 flex items-center justify-center mx-auto"
                      title={isAllActiveSelected ? 'Batalkan Pilih Semua' : 'Pilih Semua'}
                    >
                      {isAllActiveSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-300" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-3 text-center w-12">No.</th>
                  <th
                    className="p-3 w-32 cursor-pointer select-none hover:bg-emerald-800 transition-colors"
                    onClick={() => handleSortToggle('nis')}
                    title="Klik untuk mengubah urutan berdasarkan NIS"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>NIS</span>
                      {sortField === 'nis' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-emerald-300" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-emerald-300" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-emerald-300/50" />
                      )}
                    </div>
                  </th>
                  <th
                    className="p-3 cursor-pointer select-none hover:bg-emerald-800 transition-colors"
                    onClick={() => handleSortToggle('nama')}
                    title="Klik untuk mengubah urutan berdasarkan Nama"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Nama Lengkap Murid</span>
                      {sortField === 'nama' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-emerald-300" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-emerald-300" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-emerald-300/50" />
                      )}
                    </div>
                  </th>
                  <th className="p-3 w-28">Kelas</th>
                  <th className="p-3 text-center w-36">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {sortedActive.map((siswa, idx) => {
                  const isSelected = selectedIds.includes(siswa.id);
                  return (
                    <tr
                      key={siswa.id}
                      className={`${
                        isSelected ? 'bg-amber-50/80' : 'hover:bg-emerald-50/40'
                      } transition-colors`}
                    >
                      {/* Checkbox */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectActive(siswa.id)}
                          className="text-slate-600 hover:text-emerald-700 flex items-center justify-center mx-auto"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </td>

                      {/* No */}
                      <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}.</td>

                      {/* NIS */}
                      <td className="p-3 font-mono">
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-bold border border-slate-200">
                          {siswa.nis || '-'}
                        </span>
                      </td>

                      {/* Nama Murid */}
                      <td className="p-3">
                        <span className="font-bold text-slate-900 text-xs">{siswa.nama}</span>
                      </td>

                      {/* Kelas */}
                      <td className="p-3">
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-extrabold border border-emerald-300">
                          {siswa.kelas}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleStartEdit(siswa)}
                            id={`btn-edit-murid-${siswa.id}`}
                            className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg transition-all border border-amber-300 shadow-xs"
                            title="Edit Data Murid"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteSingle(siswa)}
                            id={`btn-hapus-murid-${siswa.id}`}
                            className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg transition-all border border-rose-300 shadow-xs"
                            title="Hapus Murid ke Riwayat Terhapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {sortedActive.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs text-slate-400 italic">
                      Belum ada data murid di Kelas {kelasAssigned}. Klik "Tambah Murid" atau "Upload Excel" untuk mulai mengisi data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: HISTORY - SUB-TAB DELETED */}
      {viewMode === 'history' && historySubTab === 'deleted' && (
        <div className="bg-white rounded-xl border border-rose-200 overflow-hidden shadow-sm">
          <div className="p-3 bg-rose-50 border-b border-rose-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
              <History className="w-4 h-4 text-rose-600" />
              <span>Daftar Riwayat Murid Terhapus &bull; Kelas {kelasAssigned}</span>
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
                      className="text-white hover:text-rose-200 flex items-center justify-center mx-auto"
                      title={isAllDeletedSelected ? 'Batalkan Pilih Semua' : 'Pilih Semua'}
                    >
                      {isAllDeletedSelected ? (
                        <CheckSquare className="w-4 h-4 text-rose-300" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-3 text-center w-12">No.</th>
                  <th
                    className="p-3 w-32 cursor-pointer select-none hover:bg-rose-800 transition-colors"
                    onClick={() => handleSortToggle('nis')}
                    title="Klik untuk mengubah urutan berdasarkan NIS"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>NIS</span>
                      {sortField === 'nis' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-rose-300" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-rose-300" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-rose-300/50" />
                      )}
                    </div>
                  </th>
                  <th
                    className="p-3 cursor-pointer select-none hover:bg-rose-800 transition-colors"
                    onClick={() => handleSortToggle('nama')}
                    title="Klik untuk mengubah urutan berdasarkan Nama"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Nama Lengkap Murid</span>
                      {sortField === 'nama' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-rose-300" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-rose-300" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-rose-300/50" />
                      )}
                    </div>
                  </th>
                  <th className="p-3 w-28">Kelas</th>
                  <th
                    className="p-3 cursor-pointer select-none hover:bg-rose-800 transition-colors"
                    onClick={() => handleSortToggle('waktu')}
                    title="Klik untuk mengubah urutan waktu hapus"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Waktu & Penghapus</span>
                      {sortField === 'waktu' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-rose-300" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-rose-300" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-rose-300/50" />
                      )}
                    </div>
                  </th>
                  <th className="p-3 text-center w-40">Aksi Pulihkan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100 font-medium">
                {sortedDeleted.map((siswa, idx) => {
                  const isSelected = selectedDeletedIds.includes(siswa.id);
                  return (
                    <tr
                      key={siswa.id}
                      className={`${
                        isSelected ? 'bg-rose-100' : 'bg-rose-50/40 hover:bg-rose-100/70'
                      } transition-colors`}
                    >
                      {/* Checkbox */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectDeleted(siswa.id)}
                          className="text-slate-600 hover:text-rose-700 flex items-center justify-center mx-auto"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-rose-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </td>

                      {/* No */}
                      <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}.</td>

                      {/* NIS */}
                      <td className="p-3 font-mono">
                        <span className="bg-white text-slate-800 px-2 py-0.5 rounded text-[11px] font-bold border border-rose-200">
                          {siswa.nis || '-'}
                        </span>
                      </td>

                      {/* Nama Murid */}
                      <td className="p-3">
                        <span className="font-bold text-slate-900 text-xs">{siswa.nama}</span>
                      </td>

                      {/* Kelas */}
                      <td className="p-3">
                        <span className="bg-white text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold border border-rose-200">
                          {siswa.kelas}
                        </span>
                      </td>

                      {/* Waktu & Penghapus */}
                      <td className="p-3 text-[10px]">
                        <span className="inline-block bg-rose-200 text-rose-900 font-bold px-1.5 py-0.5 rounded mb-0.5">
                          DIHAPUS
                        </span>
                        <div className="text-slate-600">{siswa.deletedAt || '-'}</div>
                        <div className="text-slate-500 italic">Oleh: {siswa.deletedBy || 'Wali Kelas'}</div>
                      </td>

                      {/* Aksi Pulihkan */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleRestoreSingle(siswa)}
                            id={`btn-restore-murid-${siswa.id}`}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-2.5 rounded text-[10px] uppercase tracking-wider shadow flex items-center gap-1 transition-all active:scale-95"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Pulihkan</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setDeleteModal({
                                isOpen: true,
                                type: 'permanent-single',
                                targetId: siswa.id,
                                targetName: siswa.nama,
                                title: 'Hapus Permanen dari Riwayat?',
                                description: `Hapus murid "${siswa.nama}" secara permanen dari histori? Tindakan ini tidak dapat dibatalkan.`
                              });
                            }}
                            className="p-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded border border-rose-300 transition-all"
                            title="Hapus Permanen"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {sortedDeleted.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-xs text-slate-400 italic">
                      Tidak ada riwayat murid yang terhapus untuk Kelas {kelasAssigned}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: HISTORY - SUB-TAB EDITED */}
      {viewMode === 'history' && historySubTab === 'edited' && (
        <div className="bg-white rounded-xl border border-amber-200 overflow-hidden shadow-sm">
          <div className="p-3 bg-amber-50 border-b border-amber-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Daftar Riwayat Murid yang Pernah Diedit &bull; Kelas {kelasAssigned}</span>
            </div>
            <div className="text-[11px] text-amber-800">
              Menampilkan log perubahan audit trail dan waktu pengeditan data murid.
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead className="bg-amber-800 text-white uppercase text-[10px] font-extrabold tracking-wider">
                <tr>
                  <th className="p-3 text-center w-12">No.</th>
                  <th
                    className="p-3 w-32 cursor-pointer select-none hover:bg-amber-700 transition-colors"
                    onClick={() => handleSortToggle('nis')}
                    title="Klik untuk mengubah urutan berdasarkan NIS"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>NIS</span>
                      {sortField === 'nis' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-amber-300" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-amber-300" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-amber-300/50" />
                      )}
                    </div>
                  </th>
                  <th
                    className="p-3 cursor-pointer select-none hover:bg-amber-700 transition-colors"
                    onClick={() => handleSortToggle('nama')}
                    title="Klik untuk mengubah urutan berdasarkan Nama"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Nama Lengkap Murid</span>
                      {sortField === 'nama' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-amber-300" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-amber-300" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-amber-300/50" />
                      )}
                    </div>
                  </th>
                  <th className="p-3 w-28">Kelas</th>
                  <th
                    className="p-3 cursor-pointer select-none hover:bg-amber-700 transition-colors"
                    onClick={() => handleSortToggle('waktu')}
                    title="Klik untuk mengubah urutan waktu edit"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Waktu Terakhir Diedit</span>
                      {sortField === 'waktu' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-amber-300" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-amber-300" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-amber-300/50" />
                      )}
                    </div>
                  </th>
                  <th className="p-3">Rincian Perubahan (Audit Trail)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100 font-medium">
                {sortedEdited.map((siswa, idx) => (
                  <tr key={siswa.id} className="hover:bg-amber-50/50 transition-colors">
                    {/* No */}
                    <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}.</td>

                    {/* NIS */}
                    <td className="p-3 font-mono">
                      <span className="bg-white text-slate-800 px-2 py-0.5 rounded text-[11px] font-bold border border-amber-200">
                        {siswa.nis || '-'}
                      </span>
                    </td>

                    {/* Nama */}
                    <td className="p-3">
                      <span className="font-bold text-slate-900 text-xs">{siswa.nama}</span>
                    </td>

                    {/* Kelas */}
                    <td className="p-3">
                      <span className="bg-white text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-200">
                        {siswa.kelas}
                      </span>
                    </td>

                    {/* Waktu Edit */}
                    <td className="p-3 text-[10px]">
                      <span className="inline-block bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded mb-0.5">
                        DIEDIT
                      </span>
                      <div className="text-slate-700">{siswa.editedAt || '-'}</div>
                      <div className="text-slate-500 italic">Oleh: {siswa.editedBy || 'Wali Kelas'}</div>
                    </td>

                    {/* Rincian Perubahan */}
                    <td className="p-3">
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-950 font-mono whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">
                        {siswa.editHistory || 'Data diperbarui.'}
                      </div>
                    </td>
                  </tr>
                ))}

                {sortedEdited.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs text-slate-400 italic">
                      Belum ada data murid yang pernah diedit di Kelas {kelasAssigned}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT STUDENT MODAL */}
      {editingSiswa && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-emerald-600 animate-scaleUp space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-extrabold text-slate-900 uppercase">
                  Edit Data Murid
                </h3>
              </div>
              <button
                onClick={() => setEditingSiswa(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-800 uppercase block mb-1">
                  Nama Lengkap Murid <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-800 uppercase block mb-1">
                  NIS / NISN
                </label>
                <input
                  type="text"
                  value={editNis}
                  onChange={(e) => setEditNis(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-medium font-mono"
                />
              </div>

              <div className="p-2.5 bg-slate-100 rounded-lg border border-slate-200 text-xs text-slate-600">
                <strong>Kelas:</strong> {editingSiswa.kelas} (Terkunci ke kelas wali kelas)
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSiswa(null)}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2.5 rounded-lg text-xs uppercase"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-simpan-perubahan-murid"
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider shadow"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
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
                id="btn-confirm-delete-murid-walikelas"
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider shadow"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXCEL IMPORT MODAL */}
      {isExcelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 text-slate-800 relative my-8 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    Upload Excel Data Murid &bull; Kelas {kelasAssigned}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Otomatis menyaring duplikasi (hanya murid baru yang diunggah)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExcelModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {/* Template Downloader Bar */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-emerald-700" />
                  <span>Belum punya format Excel?</span>
                </div>
                <button
                  type="button"
                  onClick={() => downloadTemplateMuridKelas(kelasAssigned)}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-all active:scale-95"
                >
                  Unduh Template Kelas {kelasAssigned} (.xlsx)
                </button>
              </div>

              {/* Upload Dropzone */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
                onChange={handleExcelFileChange}
                className="hidden"
                id="excel-file-upload-input-walikelas"
              />

              {!excelFile ? (
                <div
                  onDrop={handleExcelDrop}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-emerald-500 bg-emerald-50 scale-[0.99]'
                      : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 mx-auto flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6 text-emerald-700" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    Tarik & letakkan file Excel di sini, atau{' '}
                    <span className="text-emerald-700 underline font-extrabold">Pilih File dari Komputer</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Mendukung format .xlsx, .xls, dan .csv
                  </p>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 truncate max-w-xs">
                          {excelFile.name}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {(excelFile.size / 1024).toFixed(1)} KB &bull; {excelRawParsed.length} baris terbaca
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setExcelFile(null);
                        setExcelNewItems([]);
                        setExcelRawParsed([]);
                        setExcelSkippedDuplicates([]);
                        setExcelErrors([]);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-xs font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Ganti File
                    </button>
                  </div>

                  {/* Processing Status */}
                  {isExcelProcessing ? (
                    <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-800 flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                      <span>Menganalisis isi Excel murid dan memeriksa duplikasi data...</span>
                    </div>
                  ) : excelRawParsed.length > 0 ? (
                    <div className="space-y-3">
                      {/* Summary Cards */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div
                          className={`p-3 rounded-xl border ${
                            excelNewItems.length > 0
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                              : 'bg-slate-100 border-slate-200 text-slate-500'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Data Baru
                            </span>
                            <span className="text-base font-black px-2 py-0.5 rounded bg-emerald-600 text-white">
                              {excelNewItems.length}
                            </span>
                          </div>
                        </div>

                        <div
                          className={`p-3 rounded-xl border ${
                            excelSkippedDuplicates.length > 0
                              ? 'bg-amber-50 border-amber-300 text-amber-950'
                              : 'bg-slate-100 border-slate-200 text-slate-500'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase flex items-center gap-1">
                              <CopyX className="w-3.5 h-3.5 text-amber-600" /> Duplikat
                            </span>
                            <span className="text-base font-black px-2 py-0.5 rounded bg-amber-500 text-amber-950">
                              {excelSkippedDuplicates.length}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Preview Tabs */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                        <div className="flex border-b border-slate-200 bg-slate-100 text-xs font-bold">
                          <button
                            type="button"
                            onClick={() => setExcelActiveTab('new')}
                            className={`flex-1 py-2 px-3 text-center flex items-center justify-center gap-1.5 transition-colors ${
                              excelActiveTab === 'new'
                                ? 'bg-white text-emerald-800 border-b-2 border-emerald-600 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Data Baru yang Diimpor ({excelNewItems.length})</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setExcelActiveTab('duplicates')}
                            className={`flex-1 py-2 px-3 text-center flex items-center justify-center gap-1.5 transition-colors ${
                              excelActiveTab === 'duplicates'
                                ? 'bg-white text-amber-800 border-b-2 border-amber-500 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <CopyX className="w-3.5 h-3.5 text-amber-600" />
                            <span>Duplikat Dilewati ({excelSkippedDuplicates.length})</span>
                          </button>
                        </div>

                        <div className="max-h-44 overflow-y-auto divide-y divide-slate-100 text-xs">
                          {excelActiveTab === 'new' ? (
                            excelNewItems.length > 0 ? (
                              <table className="w-full text-left text-xs">
                                <tbody className="divide-y divide-slate-100">
                                  {excelNewItems.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-emerald-50/40 text-[11px]">
                                      <td className="p-2 text-slate-400 font-mono w-8">{idx + 1}.</td>
                                      <td className="p-2 font-bold text-slate-900">{item.nama}</td>
                                      <td className="p-2 text-slate-600 font-mono">NIS: {item.nis}</td>
                                      <td className="p-2 text-emerald-800 font-bold">Kelas: {kelasAssigned}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <div className="p-6 text-center text-xs text-slate-500">
                                Tidak ada data murid baru yang siap diimpor dari file ini.
                              </div>
                            )
                          ) : excelSkippedDuplicates.length > 0 ? (
                            <table className="w-full text-left text-xs">
                              <tbody className="divide-y divide-slate-100">
                                {excelSkippedDuplicates.map((dup, idx) => (
                                  <tr key={idx} className="hover:bg-amber-50/40 text-[11px]">
                                    <td className="p-2 text-slate-400 font-mono w-12">Brs {dup.rowNum}</td>
                                    <td className="p-2 font-bold text-slate-800">{dup.name}</td>
                                    <td className="p-2 text-amber-800 text-[10px] italic">{dup.reason}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="p-6 text-center text-xs text-slate-500">
                              Tidak ada data murid duplikat.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {excelErrors.length > 0 && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-900 space-y-1">
                      <p className="font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        Catatan Format:
                      </p>
                      {excelErrors.slice(0, 4).map((err, idx) => (
                        <p key={idx} className="text-[10px] text-rose-800">&bull; {err}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Mode Selector */}
              {excelRawParsed.length > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <label className="text-[11px] font-bold text-slate-700 uppercase block">
                    Mode Penggabungan:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label
                      className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer ${
                        excelImportMode === 'append'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="wkImportMode"
                        value="append"
                        checked={excelImportMode === 'append'}
                        onChange={() => setExcelImportMode('append')}
                        className="mt-0.5 text-emerald-600"
                      />
                      <div>
                        <span className="font-bold text-xs block">Tambahkan Data Baru Saja</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Menambahkan {excelNewItems.length} murid baru ke kelas {kelasAssigned}.
                        </span>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer ${
                        excelImportMode === 'replace'
                          ? 'border-rose-600 bg-rose-50 text-rose-950 ring-1 ring-rose-600'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="wkImportMode"
                        value="replace"
                        checked={excelImportMode === 'replace'}
                        onChange={() => setExcelImportMode('replace')}
                        className="mt-0.5 text-rose-600"
                      />
                      <div>
                        <span className="font-bold text-xs block text-rose-900">Timpa Data Kelas Ini</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Mengganti data murid kelas {kelasAssigned} dengan isi Excel.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsExcelModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={
                  isExcelProcessing ||
                  excelRawParsed.length === 0 ||
                  (excelImportMode === 'append' && excelNewItems.length === 0)
                }
                onClick={handleConfirmExcelImport}
                id="btn-confirm-import-excel-walikelas"
                className={`px-5 py-2 text-xs font-black text-white rounded-lg shadow-md transition-all flex items-center gap-2 ${
                  !isExcelProcessing &&
                  excelRawParsed.length > 0 &&
                  (excelImportMode === 'replace' || excelNewItems.length > 0)
                    ? 'bg-emerald-700 hover:bg-emerald-800 active:scale-95 cursor-pointer'
                    : 'bg-slate-300 cursor-not-allowed text-slate-500 shadow-none'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {excelImportMode === 'append'
                  ? excelNewItems.length > 0
                    ? `Simpan & Impor (${excelNewItems.length} Murid Baru)`
                    : 'Tidak Ada Data Baru'
                  : `Timpa & Simpan (${excelRawParsed.length} Murid)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
