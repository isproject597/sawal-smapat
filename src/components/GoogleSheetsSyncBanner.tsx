import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Lock,
  Zap,
  Settings,
  Download,
  Key,
  X,
  Code2,
  Copy,
  Check,
  Radio,
  Clock
} from 'lucide-react';
import {
  getStoredSpreadsheetId,
  saveSpreadsheetId,
  getSpreadsheetUrl,
  getStoredDriveFolderId,
  saveDriveFolderId,
  getDriveFolderUrl,
  getStoredWebAppUrl,
  saveWebAppUrl,
  getStoredSheetsToken,
  getStoredClientId,
  saveClientId,
  saveSheetsToken,
  requestGoogleOAuthToken,
  syncAllToGoogleSheets,
  clearSheetsToken,
  exportDataToCsv,
  getStoredLastAutoSync,
  triggerBackgroundAutoSync,
  getGoogleAppsScriptCode
} from '../services/googleSheets';
import {
  saveServerConfig,
  testServerGoogleSheetsConnection,
  forcePushToGoogleSheets
} from '../services/apiSync';
import { Aduan, AccountWaliKelas, Siswa, Guru, Mapel, Kelas } from '../types';

interface GoogleSheetsSyncBannerProps {
  aduanList: Aduan[];
  waliKelasList: AccountWaliKelas[];
  muridList: Siswa[];
  guruList?: Guru[];
  mapelList?: Mapel[];
  kelasList?: Kelas[];
  onSyncComplete?: (message: string) => void;
}

export const GoogleSheetsSyncBanner: React.FC<GoogleSheetsSyncBannerProps> = ({
  aduanList,
  waliKelasList,
  muridList,
  guruList,
  mapelList,
  kelasList,
  onSyncComplete
}) => {
  const [token, setToken] = useState<string | null>(getStoredSheetsToken());
  const [clientId, setClientIdInput] = useState<string>(getStoredClientId());
  const [spreadsheetIdInput, setSpreadsheetIdInput] = useState<string>(getStoredSpreadsheetId());
  const [driveFolderIdInput, setDriveFolderIdInput] = useState<string>(getStoredDriveFolderId());
  const [webAppUrlInput, setWebAppUrlInput] = useState<string>(getStoredWebAppUrl());
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [manualTokenInput, setManualTokenInput] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastAutoSyncTime, setLastAutoSyncTime] = useState<string | null>(getStoredLastAutoSync());
  const [syncStatus, setSyncStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
    details?: string[];
  }>({
    type: 'idle',
    message: ''
  });

  useEffect(() => {
    setToken(getStoredSheetsToken());
    setClientIdInput(getStoredClientId());
    setSpreadsheetIdInput(getStoredSpreadsheetId());
    setDriveFolderIdInput(getStoredDriveFolderId());
    setWebAppUrlInput(getStoredWebAppUrl());
    setLastAutoSyncTime(getStoredLastAutoSync());

    const handleAutoSyncEvent = (e: any) => {
      if (e?.detail?.timestamp) {
        setLastAutoSyncTime(e.detail.timestamp);
      }
    };

    window.addEventListener('sawal_autosync_event', handleAutoSyncEvent);
    return () => {
      window.removeEventListener('sawal_autosync_event', handleAutoSyncEvent);
    };
  }, []);

  const handleSaveSpreadsheetId = () => {
    if (spreadsheetIdInput.trim()) {
      const savedId = saveSpreadsheetId(spreadsheetIdInput);
      setSpreadsheetIdInput(savedId);
      saveServerConfig({ spreadsheetId: savedId }).catch(() => {});
      setSyncStatus({
        type: 'success',
        message: `Google Spreadsheet ID diperbarui: ${savedId}`
      });
      triggerBackgroundAutoSync('all');
    }
  };

  const handleSaveDriveFolderId = () => {
    if (driveFolderIdInput.trim()) {
      const savedFolder = saveDriveFolderId(driveFolderIdInput);
      setDriveFolderIdInput(savedFolder);
      saveServerConfig({ driveFolderId: savedFolder }).catch(() => {});
      setSyncStatus({
        type: 'success',
        message: `Google Drive Folder ID diperbarui: ${savedFolder}`
      });
    }
  };

  const handleSaveWebAppUrl = () => {
    const savedUrl = saveWebAppUrl(webAppUrlInput);
    setWebAppUrlInput(savedUrl);
    saveServerConfig({ webAppUrl: savedUrl }).catch(() => {});
    setSyncStatus({
      type: 'success',
      message: savedUrl
        ? 'Google Apps Script Web App URL berhasil disimpan! Semua perubahan data kini otomatis tersinkron ke semua perangkat & Google Sheets.'
        : 'Google Apps Script Web App URL dikosongkan.'
    });
    if (savedUrl) {
      triggerBackgroundAutoSync('all');
    }
  };

  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const handleTestWebAppConnection = async () => {
    const urlToTest = webAppUrlInput.trim() || getStoredWebAppUrl();
    if (!urlToTest) {
      setSyncStatus({
        type: 'error',
        message: 'Masukkan URL Web App Google Apps Script terlebih dahulu untuk diuji.'
      });
      return;
    }
    setIsTestingConnection(true);
    setSyncStatus({
      type: 'idle',
      message: 'Menguji koneksi ke Google Apps Script Web App...'
    });
    try {
      const res = await testServerGoogleSheetsConnection(urlToTest);
      if (res.success) {
        setSyncStatus({
          type: 'success',
          message: 'Koneksi Berhasil! Google Apps Script Web App aktif dan merespon dengan baik.'
        });
      } else {
        setSyncStatus({
          type: 'error',
          message: res.message || 'Koneksi gagal atau URL Apps Script belum di-deploy dengan akses Anyone.'
        });
      }
    } catch (err: any) {
      setSyncStatus({
        type: 'error',
        message: 'Gagal menguji koneksi: ' + (err.message || 'Network error')
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSaveClientId = () => {
    if (clientId.trim()) {
      saveClientId(clientId.trim());
      setSyncStatus({
        type: 'success',
        message: 'Google OAuth Client ID berhasil disimpan.'
      });
    } else {
      setSyncStatus({
        type: 'error',
        message: 'Masukkan Client ID Google Cloud yang valid.'
      });
    }
  };

  const handleSaveManualToken = () => {
    if (manualTokenInput.trim()) {
      saveSheetsToken(manualTokenInput.trim(), 3600);
      setToken(manualTokenInput.trim());
      setSyncStatus({
        type: 'success',
        message: 'Access Token berhasil disimpan secara manual!'
      });
      setShowConfigModal(false);
      triggerBackgroundAutoSync('all');
    }
  };

  const appsScriptCode = getGoogleAppsScriptCode();

  const handleCopyScript = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleConnectAndSync = async () => {
    setIsSyncing(true);
    setSyncStatus({ type: 'idle', message: 'Menyinkronkan data ke Google Sheets...' });

    try {
      const currentWebApp = getStoredWebAppUrl();
      let activeToken = token;
      const currentClientId = getStoredClientId();

      // If Web App is configured, perform complete Web App sync + Server push
      if (currentWebApp) {
        triggerBackgroundAutoSync('all', {
          aduanList,
          waliKelasList,
          siswaList: muridList,
          guruList,
          mapelList,
          kelasList
        });
        await forcePushToGoogleSheets();
        const now = new Date();
        const formattedTime =
          now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) +
          ', ' +
          now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) +
          ' WIB';
        setLastAutoSyncTime(formattedTime);

        setSyncStatus({
          type: 'success',
          message: 'Data berhasil disinkronkan ke Google Sheets via Web App & Server Hub!'
        });
        if (onSyncComplete) onSyncComplete('Sinkronisasi Google Sheets Berhasil!');
        return;
      }

      if (!activeToken) {
        if (!currentClientId) {
          setShowConfigModal(true);
          setSyncStatus({
            type: 'error',
            message: 'Silakan isi URL Google Apps Script Web App atau Google OAuth Client ID terlebih dahulu di menu Pengaturan.'
          });
          setIsSyncing(false);
          return;
        }

        activeToken = await requestGoogleOAuthToken(currentClientId);
        setToken(activeToken);
      }

      setSyncStatus({ type: 'idle', message: 'Mengirim & menyinkronkan data ke Google Sheets...' });
      const result = await syncAllToGoogleSheets(
        aduanList,
        waliKelasList,
        muridList,
        guruList,
        mapelList,
        kelasList,
        activeToken
      );

      if (result.success) {
        const now = new Date();
        const formattedTime =
          now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) +
          ', ' +
          now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) +
          ' WIB';
        setLastAutoSyncTime(formattedTime);

        setSyncStatus({
          type: 'success',
          message: 'Data berhasil disinkronkan ke Google Sheets!',
          details: result.details
        });
        if (onSyncComplete) onSyncComplete(result.message);
      } else {
        setSyncStatus({
          type: 'error',
          message: result.message || 'Gagal menyinkronkan data ke Google Sheets.',
          details: result.details
        });
      }
    } catch (err: any) {
      const errMsg = err.message || 'Gagal sinkronisasi Google Sheets.';
      if (errMsg.includes('invalid_client') || errMsg.includes('Client ID')) {
        setShowConfigModal(true);
      }
      setSyncStatus({
        type: 'error',
        message: errMsg
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = () => {
    clearSheetsToken();
    setToken(null);
    setSyncStatus({
      type: 'idle',
      message: 'Koneksi Google Sheets telah dilepas.'
    });
  };

  // Export CSV Handlers
  const handleExportAduanCsv = () => {
    const headers = ['ID Aduan', 'Waktu', 'Guru', 'Mapel', 'Kelas', 'Murid', 'Jenis Kesalahan', 'Kronologi', 'Status'];
    const rows = aduanList.map((a) => [
      a.id,
      a.timestampAduan,
      a.namaGuru,
      a.mapel,
      a.kelas,
      a.siswaList.join('; '),
      a.jenisKesalahan + (a.keteranganLainnya ? ` (${a.keteranganLainnya})` : ''),
      a.catatanKronologi || '-',
      a.status
    ]);
    exportDataToCsv('Aduan_Pelanggaran_SMAN4_Berau', headers, rows);
  };

  const handleExportWaliKelasCsv = () => {
    const headers = ['ID', 'Nama Wali Kelas', 'Kelas Binaan', 'Username'];
    const rows = waliKelasList.map((w) => [w.id, w.nama, w.kelasAssigned, w.username]);
    exportDataToCsv('Data_WaliKelas_SMAN4_Berau', headers, rows);
  };

  const handleExportMuridCsv = () => {
    const headers = ['ID', 'NIS', 'Nama Murid', 'Kelas'];
    const rows = muridList.map((m) => [m.id, m.nis, m.nama, m.kelas]);
    exportDataToCsv('Data_Murid_SMAN4_Berau', headers, rows);
  };

  const handleExportGuruCsv = () => {
    const list = guruList || [];
    const headers = ['ID', 'Nama Guru', 'NIP', 'Mata Pelajaran Utama'];
    const rows = list.map((g) => [g.id, g.nama, g.nip || '-', g.mapelUtama || '-']);
    exportDataToCsv('Data_Guru_SMAN4_Berau', headers, rows);
  };

  const handleExportMapelCsv = () => {
    const list = mapelList || [];
    const headers = ['ID', 'Nama Mata Pelajaran', 'Kode Mapel'];
    const rows = list.map((m) => [m.id, m.nama, m.kode || '-']);
    exportDataToCsv('Data_Mapel_SMAN4_Berau', headers, rows);
  };

  return (
    <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white rounded-xl shadow-lg border border-emerald-700/60 p-4 md:p-5 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 -mt-6 -mr-6 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-emerald-500/20 rounded-xl border border-emerald-400/30 text-emerald-300 shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-sm md:text-base tracking-wide text-white flex items-center gap-2">
                Integrasi Data Google Sheets
              </h3>
              
              {/* Pulsing Real-Time Auto Sync Badge */}
              <span className="bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[10px] px-2.5 py-0.5 rounded-full font-black flex items-center gap-1.5 shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                AUTO-SYNC AKTIF
              </span>

              {token ? (
                <span className="bg-teal-500/20 border border-teal-400/40 text-teal-300 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-teal-400" /> OAuth Terhubung
                </span>
              ) : webAppUrlInput ? (
                <span className="bg-teal-500/20 border border-teal-400/40 text-teal-300 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" /> Web App Aktif
                </span>
              ) : null}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              Setiap penambahan, pengeditan, penghapusan (terblok merah), dan pemulihan data <strong>otomatis tersinkronisasi di latar belakang</strong> ke Google Sheets (tab <code>Aduan</code>, <code>Data_Guru</code>, <code>Data_Mapel</code>, <code>Data_Kelas</code>, <code>Data_Murid</code>, <code>Data_WaliKelas</code>).
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href={getSpreadsheetUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-300 hover:text-white underline transition-colors"
              >
                <span>Buka Google Sheets ({getStoredSpreadsheetId().slice(0, 10)}...)</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              {lastAutoSyncTime && (
                <span className="text-[10px] text-emerald-300/90 font-medium flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700/40">
                  <Clock className="w-2.5 h-2.5" /> Auto-sync terakhir: <strong>{lastAutoSyncTime}</strong>
                </span>
              )}

              {/* Unduh CSV offline fallbacks */}
              <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-300">
                <span>Unduh CSV:</span>
                <button
                  onClick={handleExportAduanCsv}
                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded font-semibold flex items-center gap-1 border border-slate-700"
                >
                  <Download className="w-2.5 h-2.5" /> Aduan
                </button>
                <button
                  onClick={handleExportWaliKelasCsv}
                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded font-semibold flex items-center gap-1 border border-slate-700"
                >
                  <Download className="w-2.5 h-2.5" /> Wali Kelas
                </button>
                <button
                  onClick={handleExportMuridCsv}
                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded font-semibold flex items-center gap-1 border border-slate-700"
                >
                  <Download className="w-2.5 h-2.5" /> Murid
                </button>
                <button
                  onClick={handleExportGuruCsv}
                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded font-semibold flex items-center gap-1 border border-slate-700"
                >
                  <Download className="w-2.5 h-2.5" /> Guru
                </button>
                <button
                  onClick={handleExportMapelCsv}
                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded font-semibold flex items-center gap-1 border border-slate-700"
                >
                  <Download className="w-2.5 h-2.5" /> Mapel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto">
          <button
            type="button"
            id="btn-lihat-kode-script"
            onClick={() => setShowScriptModal(true)}
            className="flex-1 md:flex-none px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
            title="Lihat dan salin kode Google Apps Script untuk dipasang di Google Sheets"
          >
            <Code2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Kode Script Web App</span>
          </button>

          <button
            type="button"
            id="btn-pengaturan-koneksi-sheets"
            onClick={() => setShowConfigModal(true)}
            className="flex-1 md:flex-none px-3.5 py-2 bg-teal-800 hover:bg-teal-700 text-teal-100 border border-teal-600/60 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
            title="Buka modal pengaturan Spreadsheet ID, Drive Folder ID, dan Web App URL"
          >
            <Settings className="w-3.5 h-3.5 text-teal-300" />
            <span>Pengaturan & URL Web App</span>
          </button>

          <button
            type="button"
            id="btn-sinkronkan-sekarang"
            onClick={handleConnectAndSync}
            disabled={isSyncing}
            className="w-full md:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 active:scale-95"
            title="Sinkronisasi manual instan seluruh data ke Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
          </button>
        </div>
      </div>

      {/* Direct Inline Web App URL Configuration Bar - Selalu Tampil & Mudah Diakses */}
      <div className="mt-4 pt-3.5 border-t border-emerald-700/50 bg-emerald-950/50 -mx-4 md:-mx-5 -mb-4 md:-mb-5 p-4 md:p-5 rounded-b-xl space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-black tracking-wide text-emerald-200">
              Input URL Google Apps Script Web App:
            </span>
            {webAppUrlInput ? (
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] px-2 py-0.5 rounded-full font-bold">
                ✓ Aktif Tersambung
              </span>
            ) : (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] px-2 py-0.5 rounded-full font-bold">
                ⚠ Belum Diisi
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowScriptModal(true)}
              className="text-[11px] font-bold text-amber-300 hover:text-amber-200 underline flex items-center gap-1 transition-colors"
            >
              <Code2 className="w-3 h-3" />
              <span>Salin Kode Script (doPost)</span>
            </button>
            <span className="text-emerald-700">&bull;</span>
            <button
              type="button"
              onClick={() => setShowConfigModal(true)}
              className="text-[11px] font-bold text-teal-300 hover:text-teal-200 underline flex items-center gap-1 transition-colors"
            >
              <Settings className="w-3 h-3" />
              <span>Pengaturan Lanjutan</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="url"
              id="input-web-app-url-inline"
              value={webAppUrlInput}
              onChange={(e) => setWebAppUrlInput(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="w-full bg-slate-900/90 text-emerald-200 placeholder-slate-500 border border-emerald-600/60 focus:border-emerald-400 rounded-lg px-3 py-2 text-xs font-mono outline-none shadow-inner transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              id="btn-uji-web-app-url"
              onClick={handleTestWebAppConnection}
              disabled={isTestingConnection}
              className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50"
              title="Uji koneksi Web App Google Apps Script"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTestingConnection ? 'animate-spin' : ''}`} />
              <span>{isTestingConnection ? 'Menguji...' : 'Uji Koneksi'}</span>
            </button>
            <button
              type="button"
              id="btn-simpan-web-app-url"
              onClick={handleSaveWebAppUrl}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-md transition-all shrink-0 active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simpan URL</span>
            </button>
          </div>
        </div>

        <p className="text-[11px] text-slate-300 leading-normal">
          Tempelkan URL Web App yang didapat setelah memilih <strong>Deploy &rarr; New deployment &rarr; Web App (Who has access: Anyone)</strong>. URL ini digunakan untuk sinkronisasi otomatis seluruh aduan, data master, foto bukti ke Google Drive, dan penandaan hapus merah di Google Sheets.
        </p>
      </div>

      {/* Sync Status Toast/Notification */}
      {syncStatus.message && (
        <div
          className={`mt-3 p-3 rounded-lg text-xs flex items-start gap-2 ${
            syncStatus.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-200'
              : syncStatus.type === 'error'
              ? 'bg-rose-950/80 border border-rose-500 text-rose-200'
              : 'bg-slate-800/80 border border-slate-600 text-slate-200'
          }`}
        >
          {syncStatus.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : syncStatus.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <RefreshCw className="w-4 h-4 text-slate-400 shrink-0 mt-0.5 animate-spin" />
          )}
          <div className="flex-1">
            <p className="font-semibold">{syncStatus.message}</p>
            {syncStatus.details && (
              <ul className="mt-1 space-y-0.5 text-[11px] opacity-90 list-disc list-inside">
                {syncStatus.details.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            )}
          </div>
          <button
            onClick={() => setSyncStatus({ type: 'idle', message: '' })}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs text-slate-800">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-teal-700" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Pengaturan Koneksi Google Sheets & Drive
                </h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Auto Sync Info Box */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-950 space-y-1">
              <div className="font-extrabold flex items-center gap-1.5 text-emerald-900">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                </span>
                Fitur Auto-Sync Aktif Otomatis
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Aplikasi langsung menyinkronkan setiap perubahan (tambah, ubah status, hapus blok merah, dan pemulihan) secara otomatis ke Google Sheets. Anda tidak perlu repot menekan tombol sinkron manual.
              </p>
            </div>

            {/* Spreadsheet ID Config */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Google Spreadsheet ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={spreadsheetIdInput}
                  onChange={(e) => setSpreadsheetIdInput(e.target.value)}
                  placeholder="ID Spreadsheet atau Link Lengkap"
                  className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono outline-none focus:border-teal-600"
                />
                <button
                  type="button"
                  onClick={handleSaveSpreadsheetId}
                  className="px-3.5 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-lg text-xs"
                >
                  Simpan ID
                </button>
              </div>
              <p className="text-[10px] text-slate-500">
                Bisa memasukkan ID saja atau paste URL lengkap Google Sheets Anda.
              </p>
            </div>

            {/* Google Apps Script Web App URL (Zero-Login Auto-Sync) */}
            <div className="space-y-2 bg-teal-50/70 p-3.5 rounded-xl border border-teal-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Apps Script Web App URL (Auto-Sync Tanpa Login)
                </label>
                <button
                  type="button"
                  onClick={() => setShowScriptModal(true)}
                  className="text-[11px] font-bold text-teal-700 hover:underline flex items-center gap-1"
                >
                  <Code2 className="w-3 h-3" /> Lihat Kode Script
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={webAppUrlInput}
                  onChange={(e) => setWebAppUrlInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 p-2 bg-white border border-teal-300 rounded-lg text-xs font-mono outline-none focus:border-teal-600"
                />
                <button
                  type="button"
                  onClick={handleSaveWebAppUrl}
                  className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg text-xs"
                >
                  Simpan URL
                </button>
              </div>
              <p className="text-[10px] text-teal-800">
                Pasang script Web App agar aduan dari murid/guru dan perubahan master data langsung ter-rekap secara instan.
              </p>
            </div>

            {/* Google Drive Folder ID Config */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Google Drive Folder ID (Penyimpanan Foto Bukti)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={driveFolderIdInput}
                  onChange={(e) => setDriveFolderIdInput(e.target.value)}
                  placeholder="Folder ID Google Drive"
                  className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono outline-none focus:border-teal-600"
                />
                <button
                  type="button"
                  onClick={handleSaveDriveFolderId}
                  className="px-3.5 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-lg text-xs"
                >
                  Simpan Folder
                </button>
              </div>
            </div>

            {/* Google OAuth Client ID Config */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Google Cloud OAuth Client ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  placeholder="...apps.googleusercontent.com"
                  className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono outline-none focus:border-teal-600"
                />
                <button
                  type="button"
                  onClick={handleSaveClientId}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs"
                >
                  Simpan Client ID
                </button>
              </div>
            </div>

            {/* Manual Token Paste */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-teal-600" />
                Input Manual Access Token (Opsional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualTokenInput}
                  onChange={(e) => setManualTokenInput(e.target.value)}
                  placeholder="ya29.a0AfH6SM..."
                  className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveManualToken}
                  className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg text-xs"
                >
                  Terapkan
                </button>
              </div>
            </div>

            {token && (
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> OAuth Token Aktif
                </span>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="text-xs text-rose-600 hover:text-rose-800 font-bold underline"
                >
                  Putuskan Token
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Script Modal */}
      {showScriptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs text-slate-800">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-teal-700" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Kode Google Apps Script Web App
                </h3>
              </div>
              <button
                onClick={() => setShowScriptModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Pasang kode ini pada menu <strong>Ekstensi &rarr; Apps Script</strong> di Google Sheets Anda, lalu klik <strong>Terapkan &rarr; Penerapan Baru (Web App)</strong> dengan akses <em>"Siapa saja" (Anyone)</em>.
            </p>

            <div className="relative">
              <pre className="bg-slate-900 text-emerald-300 p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-72 leading-relaxed">
                {appsScriptCode}
              </pre>
              <button
                type="button"
                onClick={handleCopyScript}
                className="absolute top-3 right-3 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedScript ? 'Tersalin!' : 'Salin Kode'}</span>
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowScriptModal(false)}
                className="px-4 py-2 bg-slate-800 text-white font-bold text-xs rounded-lg hover:bg-slate-900"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleSheetsSyncBanner;
