import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  X,
  FileCheck,
  HelpCircle,
  Layers,
  RefreshCw,
  Info,
  ShieldCheck,
  CopyX,
  Sparkles
} from 'lucide-react';
import {
  ExcelImportType,
  TEMPLATE_CONFIG,
  downloadExcelTemplate,
  parseExcelFile,
  SkippedDuplicateItem
} from '../utils/excelHelper';

interface ExcelImportModalProps {
  isOpen: boolean;
  type: ExcelImportType;
  onClose: () => void;
  onImport: (data: any[], mode: 'append' | 'replace', stats: { newCount: number; duplicateCount: number }) => void;
  currentCount: number;
  existingList: any[];
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  type,
  onClose,
  onImport,
  currentCount,
  existingList
}) => {
  const config = TEMPLATE_CONFIG[type];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newItems, setNewItems] = useState<any[]>([]);
  const [rawParsed, setRawParsed] = useState<any[]>([]);
  const [skippedDuplicates, setSkippedDuplicates] = useState<SkippedDuplicateItem[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [rawRowCount, setRawRowCount] = useState(0);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'new' | 'duplicates'>('new');

  if (!isOpen) return null;

  const handleReset = () => {
    setSelectedFile(null);
    setNewItems([]);
    setRawParsed([]);
    setSkippedDuplicates([]);
    setParseErrors([]);
    setRawRowCount(0);
    setActiveTab('new');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFile = async (file: File) => {
    setSelectedFile(file);
    setIsProcessing(true);
    setParseErrors([]);

    const result = await parseExcelFile(file, type, existingList);
    setIsProcessing(false);
    setRawRowCount(result.rawRowCount);
    setNewItems(result.data);
    setRawParsed(result.rawParsed);
    setSkippedDuplicates(result.skippedDuplicates);
    setParseErrors(result.errors);

    // If no new items but there are duplicates, switch preview to duplicate tab automatically
    if (result.data.length === 0 && result.skippedDuplicates.length > 0) {
      setActiveTab('duplicates');
    } else {
      setActiveTab('new');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleConfirmImport = () => {
    if (importMode === 'append') {
      if (newItems.length === 0) return;
      onImport(newItems, 'append', { newCount: newItems.length, duplicateCount: skippedDuplicates.length });
    } else {
      // In replace mode, use all unique rows from Excel file
      if (rawParsed.length === 0) return;
      onImport(rawParsed, 'replace', { newCount: rawParsed.length, duplicateCount: skippedDuplicates.length });
    }
    handleReset();
    onClose();
  };

  const totalValid = rawParsed.length;
  const newCount = newItems.length;
  const duplicateCount = skippedDuplicates.length;
  const isAllDuplicate = totalValid > 0 && newCount === 0 && duplicateCount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 text-slate-800 relative my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 leading-tight flex items-center gap-2">
                Upload Data Masal: {config.title.replace('Template ', '')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dilengkapi proteksi anti-duplikasi otomatis (hanya data baru yang disimpan)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Section 1: Template Downloader & Anti-Duplication Rule Notice */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
                <HelpCircle className="w-4 h-4 text-emerald-700" />
                <span>Format Kolom & Aturan Duplikasi:</span>
              </div>
              <button
                type="button"
                onClick={() => downloadExcelTemplate(type)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-lg text-xs font-bold shadow-xs transition-all"
                title="Download Template Excel Resmi"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh Format Template Excel (.xlsx)
              </button>
            </div>

            {/* Smart Rule Badge */}
            <div className="bg-white/90 border border-emerald-300 rounded-lg p-2.5 flex items-start gap-2 text-[11px] text-emerald-900 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-950 block">Aturan Penyaringan Duplikasi Aktif:</strong>
                <span>
                  Jika data di file Excel sudah ada di sistem dan tidak memiliki perubahan, data tersebut akan <strong>dilewati secara otomatis</strong> dan sistem hanya akan mengunggah baris data yang benar-benar baru.
                </span>
              </div>
            </div>

            {/* Sample Table Preview */}
            <div className="overflow-x-auto rounded-lg border border-emerald-300/80 bg-white shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-emerald-800 text-white font-bold text-[11px]">
                    {config.columns.map((col, idx) => (
                      <th key={idx} className="p-2 border-r border-emerald-700 last:border-r-0">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-100 text-slate-700 text-[11px]">
                  {config.sampleRows.slice(0, 2).map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-emerald-50/50">
                      {config.columns.map((col, cIdx) => (
                        <td key={cIdx} className="p-2 border-r border-emerald-100 last:border-r-0 font-medium">
                          {row[col] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Upload Area */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
              onChange={handleFileChange}
              className="hidden"
              id="excel-file-upload-input"
            />

            {!selectedFile ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
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
                        {selectedFile.name}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB &bull; {rawRowCount} baris data ditemukan
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Ganti File
                  </button>
                </div>

                {/* Parsing Status Feedback */}
                {isProcessing ? (
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-800 flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                    <span>Menganalisis isi Excel dan memeriksa duplikasi data...</span>
                  </div>
                ) : totalValid > 0 ? (
                  <div className="space-y-3">
                    {/* Status Stats Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* New items card */}
                      <div className={`p-3 rounded-xl border transition-all ${
                        newCount > 0
                          ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                          : 'bg-slate-100 border-slate-200 text-slate-500'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Data Baru
                          </span>
                          <span className={`text-base font-black px-2 py-0.5 rounded-md ${
                            newCount > 0 ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                          }`}>
                            {newCount}
                          </span>
                        </div>
                        <p className="text-[10px] mt-1 text-slate-600 leading-tight">
                          {newCount > 0
                            ? 'Belum ada di sistem, akan ditambahkan.'
                            : 'Tidak ada data baru yang ditemukan.'}
                        </p>
                      </div>

                      {/* Duplicates card */}
                      <div className={`p-3 rounded-xl border transition-all ${
                        duplicateCount > 0
                          ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                          : 'bg-slate-100 border-slate-200 text-slate-500'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <CopyX className="w-3.5 h-3.5 text-amber-600" /> Duplikat / Sama
                          </span>
                          <span className={`text-base font-black px-2 py-0.5 rounded-md ${
                            duplicateCount > 0 ? 'bg-amber-500 text-amber-950' : 'bg-slate-300 text-slate-700'
                          }`}>
                            {duplicateCount}
                          </span>
                        </div>
                        <p className="text-[10px] mt-1 text-slate-600 leading-tight">
                          {duplicateCount > 0
                            ? 'Sudah ada di database, otomatis dilewati.'
                            : 'Tidak ada data duplikat.'}
                        </p>
                      </div>
                    </div>

                    {/* All duplicates alert */}
                    {isAllDuplicate && (
                      <div className="p-3.5 bg-amber-100/80 border border-amber-300 rounded-xl text-xs text-amber-950 space-y-1">
                        <div className="flex items-center gap-2 font-black text-amber-900">
                          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                          <span>Semua data dalam file Excel sudah terdaftar di sistem!</span>
                        </div>
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                          Tidak ada data baru atau perubahan yang ditemukan. Sistem memblokir unggahan duplikat agar data database sekolah tetap rapi dan tidak ganda.
                        </p>
                      </div>
                    )}

                    {/* Preview Tabs */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                      <div className="flex border-b border-slate-200 bg-slate-100 text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setActiveTab('new')}
                          className={`flex-1 py-2 px-3 text-center flex items-center justify-center gap-1.5 transition-colors ${
                            activeTab === 'new'
                              ? 'bg-white text-emerald-800 border-b-2 border-emerald-600 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Data Baru yang Diimpor ({newCount})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('duplicates')}
                          className={`flex-1 py-2 px-3 text-center flex items-center justify-center gap-1.5 transition-colors ${
                            activeTab === 'duplicates'
                              ? 'bg-white text-amber-800 border-b-2 border-amber-500 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <CopyX className="w-3.5 h-3.5 text-amber-600" />
                          <span>Data Duplikat Dilewati ({duplicateCount})</span>
                        </button>
                      </div>

                      <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
                        {activeTab === 'new' ? (
                          newItems.length > 0 ? (
                            <table className="w-full text-left text-xs">
                              <tbody className="divide-y divide-slate-100">
                                {newItems.map((item, idx) => (
                                  <tr key={idx} className="hover:bg-emerald-50/40 text-[11px]">
                                    <td className="p-2 text-slate-400 font-mono w-8">{idx + 1}.</td>
                                    <td className="p-2 font-bold text-slate-900">
                                      <div className="flex items-center gap-1.5">
                                        <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded font-black uppercase">
                                          BARU
                                        </span>
                                        <span>{item.nama}</span>
                                      </div>
                                    </td>
                                    <td className="p-2 text-slate-600">
                                      {type === 'guru' && `NIP: ${item.nip || '-'} | Mapel: ${item.mapelUtama || '-'}`}
                                      {type === 'mapel' && item.nama}
                                      {type === 'kelas' && `Kelas: ${item.nama}`}
                                      {type === 'siswa' && `NIS: ${item.nis} | Kelas: ${item.kelas}`}
                                      {type === 'walikelas' && `Kelas: ${item.kelasAssigned} | User: ${item.username}`}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="p-6 text-center text-xs text-slate-500">
                              Tidak ada data baru yang siap diimpor dari file ini.
                            </div>
                          )
                        ) : (
                          skippedDuplicates.length > 0 ? (
                            <table className="w-full text-left text-xs">
                              <tbody className="divide-y divide-slate-100">
                                {skippedDuplicates.map((dup, idx) => (
                                  <tr key={idx} className="hover:bg-amber-50/40 text-[11px]">
                                    <td className="p-2 text-slate-400 font-mono w-12">Brs {dup.rowNum}</td>
                                    <td className="p-2 font-bold text-slate-800">
                                      <div className="flex items-center gap-1.5">
                                        <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                                          DILEWATI
                                        </span>
                                        <span>{dup.name}</span>
                                      </div>
                                      <span className="text-[10px] text-slate-500 block font-normal mt-0.5">{dup.detail}</span>
                                    </td>
                                    <td className="p-2 text-amber-800 text-[10px] font-medium italic">
                                      {dup.reason}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="p-6 text-center text-xs text-slate-500">
                              Tidak ada data duplikat yang terdeteksi. Seluruh data di file adalah data baru.
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Tidak ada baris data valid yang dapat dibaca. Pastikan nama kolom sesuai format template.</span>
                  </div>
                )}

                {/* Error Log if any rows had format issues */}
                {parseErrors.length > 0 && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-900 space-y-1 max-h-28 overflow-y-auto">
                    <p className="font-bold flex items-center gap-1 text-rose-950">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      Catatan Format Tidak Lengkap ({parseErrors.length} baris tidak terbaca):
                    </p>
                    {parseErrors.slice(0, 5).map((err, idx) => (
                      <p key={idx} className="text-[10px] text-rose-800">&bull; {err}</p>
                    ))}
                    {parseErrors.length > 5 && (
                      <p className="text-[10px] text-rose-700 italic">...dan {parseErrors.length - 5} baris lainnya.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 3: Import Mode Selector */}
          {totalValid > 0 && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="text-[11px] font-bold text-slate-700 uppercase block">
                Pilih Mode Penggabungan Data:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    importMode === 'append'
                      ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 ring-1 ring-emerald-600'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-xs block flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-emerald-700" /> Tambahkan Data Baru Saja (Rekomendasi)
                    </span>
                    <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                      Hanya menambahkan <strong>{newCount} data baru</strong>, melewati {duplicateCount} duplikat, dan mempertahankan {currentCount} data yang ada.
                    </span>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    importMode === 'replace'
                      ? 'border-rose-600 bg-rose-50/50 text-rose-950 ring-1 ring-rose-600'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span className="font-bold text-xs block flex items-center gap-1 text-rose-900">
                      <RefreshCw className="w-3.5 h-3.5 text-rose-700" /> Timpa Seluruh Data Master
                    </span>
                    <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                      Menghapus {currentCount} data lama dan menggantikannya dengan {rawParsed.length} data dari file Excel.
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
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={
              isProcessing ||
              totalValid === 0 ||
              (importMode === 'append' && newCount === 0)
            }
            onClick={handleConfirmImport}
            className={`px-5 py-2 text-xs font-black text-white rounded-lg shadow-md transition-all flex items-center gap-2 ${
              !isProcessing && totalValid > 0 && (importMode === 'replace' || newCount > 0)
                ? 'bg-emerald-700 hover:bg-emerald-800 active:scale-95 cursor-pointer'
                : 'bg-slate-300 cursor-not-allowed text-slate-500 shadow-none'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {importMode === 'append'
              ? newCount > 0
                ? `Simpan & Impor (${newCount} Data Baru)`
                : 'Tidak Ada Data Baru (0 Data)'
              : `Timpa & Simpan (${rawParsed.length} Data)`}
          </button>
        </div>
      </div>
    </div>
  );
};
