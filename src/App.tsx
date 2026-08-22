/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  getStoredGuru,
  saveGuru,
  getStoredDeletedGuru,
  saveDeletedGuru,
  getStoredMapel,
  saveMapel,
  getStoredDeletedMapel,
  saveDeletedMapel,
  getStoredKelas,
  saveKelas,
  getStoredDeletedKelas,
  saveDeletedKelas,
  getStoredSiswa,
  saveSiswa,
  getStoredDeletedSiswa,
  saveDeletedSiswa,
  getStoredWaliKelas,
  saveWaliKelas,
  getStoredDeletedWaliKelas,
  saveDeletedWaliKelas,
  getStoredAduan,
  saveAduan,
  addAduan,
  getStoredDeletedAduan,
  saveDeletedAduan,
  recordDeletedAduan
} from './data/storage';
import {
  Guru,
  Mapel,
  Kelas,
  Siswa,
  AccountWaliKelas,
  Aduan,
  UserSession,
  StatusAduan
} from './types';
import { Header, SubMenuType } from './components/Header';
import { FormAduan } from './components/FormAduan';
import { PantauProgresCard } from './components/PantauProgresCard';
import { StatistikTerkini } from './components/StatistikTerkini';
import { WaliKelasLoginModal } from './components/WaliKelasLoginModal';
import { AdminDashboard } from './components/AdminDashboard';
import { WaliKelasDashboard } from './components/WaliKelasDashboard';
import {
  appendSingleAduanToSheet,
  syncAduanToGoogleSheet,
  notifyDeleteAduanToGoogleSheets,
  updateAduanStatusInGoogleSheets,
  syncWaliKelasToGoogleSheet,
  syncMuridToGoogleSheet,
  syncGuruToGoogleSheet,
  syncMapelToGoogleSheet,
  syncKelasToGoogleSheet,
  getStoredSheetsToken,
  uploadPhotosToGoogleDrive,
  triggerBackgroundAutoSync,
  fetchCloudData,
  saveSpreadsheetId,
  saveDriveFolderId,
  saveWebAppUrl,
  DRIVE_FOLDER_URL
} from './services/googleSheets';
import {
  fetchServerDatabase,
  syncDatabaseToServer,
  FullDatabasePayload
} from './services/apiSync';
import { cachePhoto } from './utils/photoCache';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  ListFilter,
  Sparkles,
  Info,
  GraduationCap
} from 'lucide-react';

export default function App() {
  // Local storage state
  const [guruList, setGuruList] = useState<Guru[]>(getStoredGuru);
  const [mapelList, setMapelList] = useState<Mapel[]>(getStoredMapel);
  const [kelasList, setKelasList] = useState<Kelas[]>(getStoredKelas);
  const [siswaList, setSiswaList] = useState<Siswa[]>(getStoredSiswa);
  const [waliKelasList, setWaliKelasList] = useState<AccountWaliKelas[]>(getStoredWaliKelas);
  const [aduanList, setAduanList] = useState<Aduan[]>(getStoredAduan);
  const [deletedAduanList, setDeletedAduanList] = useState<Aduan[]>(getStoredDeletedAduan);

  // User session state
  const [session, setSession] = useState<UserSession>({ role: 'guest' });

  // Modal open states
  const [isWaliKelasLoginOpen, setIsWaliKelasLoginOpen] = useState(false);

  // Active sub menu state: 'form' | 'pantau' | 'statistik' | 'dashboard'
  const [activeSubMenu, setActiveSubMenu] = useState<SubMenuType>('form');

  // Central helper to construct current full database payload and sync to backend server
  const broadcastToServer = (overrides?: Partial<FullDatabasePayload>) => {
    const payload: FullDatabasePayload = {
      aduanList: overrides?.aduanList ?? aduanList,
      deletedAduanList: overrides?.deletedAduanList ?? deletedAduanList,
      guruList: overrides?.guruList ?? guruList,
      deletedGuruList: overrides?.deletedGuruList ?? getStoredDeletedGuru(),
      mapelList: overrides?.mapelList ?? mapelList,
      deletedMapelList: overrides?.deletedMapelList ?? getStoredDeletedMapel(),
      kelasList: overrides?.kelasList ?? kelasList,
      deletedKelasList: overrides?.deletedKelasList ?? getStoredDeletedKelas(),
      siswaList: overrides?.siswaList ?? siswaList,
      deletedSiswaList: overrides?.deletedSiswaList ?? getStoredDeletedSiswa(),
      waliKelasList: overrides?.waliKelasList ?? waliKelasList,
      deletedWaliKelasList: overrides?.deletedWaliKelasList ?? getStoredDeletedWaliKelas()
    };
    syncDatabaseToServer(payload).catch((err) => console.warn('Sync to server notice:', err));
  };

  // Real-time Multi-Device Synchronization (Desktop, HP, Tablet, Google Sheets)
  useEffect(() => {
    let isMounted = true;

    const pullLatestData = async () => {
      try {
        // 1. Pull from server database (instant multi-device sync across HP, Desktop, Tablet)
        const serverRes = await fetchServerDatabase();
        if (serverRes && isMounted) {
          if (serverRes.hasData && serverRes.db) {
            const sDb = serverRes.db;
            if (sDb.siswaList && sDb.siswaList.length > 0) {
              setSiswaList(sDb.siswaList);
              saveSiswa(sDb.siswaList);
            }
            if (sDb.guruList && sDb.guruList.length > 0) {
              setGuruList(sDb.guruList);
              saveGuru(sDb.guruList);
            }
            if (sDb.mapelList && sDb.mapelList.length > 0) {
              setMapelList(sDb.mapelList);
              saveMapel(sDb.mapelList);
            }
            if (sDb.kelasList && sDb.kelasList.length > 0) {
              setKelasList(sDb.kelasList);
              saveKelas(sDb.kelasList);
            }
            if (sDb.waliKelasList && sDb.waliKelasList.length > 0) {
              setWaliKelasList(sDb.waliKelasList);
              saveWaliKelas(sDb.waliKelasList);
            }
            if (sDb.aduanList) {
              setAduanList(sDb.aduanList);
              saveAduan(sDb.aduanList);
            }
            if (sDb.deletedAduanList) {
              setDeletedAduanList(sDb.deletedAduanList);
              saveDeletedAduan(sDb.deletedAduanList);
            }
            if (sDb.deletedGuruList) saveDeletedGuru(sDb.deletedGuruList);
            if (sDb.deletedMapelList) saveDeletedMapel(sDb.deletedMapelList);
            if (sDb.deletedKelasList) saveDeletedKelas(sDb.deletedKelasList);
            if (sDb.deletedSiswaList) saveDeletedSiswa(sDb.deletedSiswaList);
            if (sDb.deletedWaliKelasList) saveDeletedWaliKelas(sDb.deletedWaliKelasList);
          } else {
            // First time server initialization: populate server with local state
            broadcastToServer();
          }

          if (serverRes.config) {
            if (serverRes.config.spreadsheetId) saveSpreadsheetId(serverRes.config.spreadsheetId);
            if (serverRes.config.driveFolderId) saveDriveFolderId(serverRes.config.driveFolderId);
            if (serverRes.config.webAppUrl) saveWebAppUrl(serverRes.config.webAppUrl);
          }
        }

        // 2. Fallback check from Google Sheets GViz if available
        const cloud = await fetchCloudData();
        if (cloud.success && cloud.data && isMounted) {
          if (cloud.data.siswaList && cloud.data.siswaList.length > 0) {
            setSiswaList(cloud.data.siswaList);
            saveSiswa(cloud.data.siswaList);
          }
        }
      } catch (err) {
        console.warn('Realtime sync notice:', err);
      }
    };

    // 1. Initial pull on load
    pullLatestData();

    // 2. Pull when user switches back to this tab / unlocks phone
    const handleWindowFocus = () => {
      pullLatestData();
    };
    window.addEventListener('focus', handleWindowFocus);

    // 3. Periodic background sync polling every 4 seconds for instant real-time sync
    const intervalTimer = setInterval(() => {
      pullLatestData();
    }, 4000);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleWindowFocus);
      clearInterval(intervalTimer);
    };
  }, []);

  // Persistence update handlers
  const handleUpdateGuru = (list: Guru[], deletedList?: Guru[]) => {
    setGuruList(list);
    saveGuru(list);
    if (deletedList) saveDeletedGuru(deletedList);
    broadcastToServer({ guruList: list, deletedGuruList: deletedList });
    triggerBackgroundAutoSync('guru', { guruList: list, deletedGuruList: deletedList });
  };

  const handleUpdateMapel = (list: Mapel[], deletedList?: Mapel[]) => {
    setMapelList(list);
    saveMapel(list);
    if (deletedList) saveDeletedMapel(deletedList);
    broadcastToServer({ mapelList: list, deletedMapelList: deletedList });
    triggerBackgroundAutoSync('mapel', { mapelList: list, deletedMapelList: deletedList });
  };

  const handleUpdateKelas = (list: Kelas[], deletedList?: Kelas[]) => {
    setKelasList(list);
    saveKelas(list);
    if (deletedList) saveDeletedKelas(deletedList);
    broadcastToServer({ kelasList: list, deletedKelasList: deletedList });
    triggerBackgroundAutoSync('kelas', { kelasList: list, deletedKelasList: deletedList });
  };

  const handleUpdateSiswa = (list: Siswa[], deletedList?: Siswa[]) => {
    setSiswaList(list);
    saveSiswa(list);
    if (deletedList) saveDeletedSiswa(deletedList);
    broadcastToServer({ siswaList: list, deletedSiswaList: deletedList });
    triggerBackgroundAutoSync('murid', { siswaList: list, deletedSiswaList: deletedList });
  };

  const handleUpdateWaliKelas = (list: AccountWaliKelas[], deletedList?: AccountWaliKelas[]) => {
    setWaliKelasList(list);
    saveWaliKelas(list);
    if (deletedList) saveDeletedWaliKelas(deletedList);
    broadcastToServer({ waliKelasList: list, deletedWaliKelasList: deletedList });
    triggerBackgroundAutoSync('walikelas', { waliKelasList: list, deletedWaliKelasList: deletedList });
  };

  const handleUpdateAduan = (list: Aduan[], deletedList?: Aduan[]) => {
    setAduanList(list);
    saveAduan(list);
    if (deletedList) {
      setDeletedAduanList(deletedList);
      saveDeletedAduan(deletedList);
    }
    broadcastToServer({ aduanList: list, deletedAduanList: deletedList });
    triggerBackgroundAutoSync('aduan', { aduanList: list, deletedAduanList: deletedList });
  };

  // Submit new aduan from public form
  const handleCreateAduan = async (newAduanData: Omit<Aduan, 'id' | 'createdAtISO' | 'status'>) => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const timeSuffix = Date.now().toString().slice(-4);
    const generatedId = `ADUAN-${dateStr}-${timeSuffix}${randomSuffix}`;

    const originalPhotos = newAduanData.fotoBuktiList || (newAduanData.fotoBukti ? [newAduanData.fotoBukti] : []);
    let photos = [...originalPhotos];

    // Cache original photos locally for instant high-speed rendering
    originalPhotos.forEach((photo, idx) => {
      if (photo && (photo.startsWith('data:image') || photo.startsWith('blob:'))) {
        cachePhoto(`${generatedId}_${idx + 1}`, photo);
        cachePhoto(photo, photo);
      }
    });

    const token = getStoredSheetsToken();

    // If Google OAuth Token is active, upload images directly to Google Drive
    if (photos.length > 0 && token) {
      try {
        const uploadedUrls = await uploadPhotosToGoogleDrive(photos, generatedId, token);
        if (uploadedUrls.length > 0 && uploadedUrls.some((u) => u && u.startsWith('http'))) {
          // Link uploaded Drive URLs to local cached Base64
          uploadedUrls.forEach((url, idx) => {
            if (url && originalPhotos[idx]) {
              cachePhoto(url, originalPhotos[idx]);
            }
          });
          photos = uploadedUrls;
        }
      } catch (err) {
        console.warn('Direct Google Drive upload failed, falling back to Web App:', err);
      }
    }

    const finalFotoString = photos.length > 0 ? photos.join('\n') : '-';

    const fullAduan: Aduan = {
      ...newAduanData,
      fotoBukti: finalFotoString,
      fotoBuktiList: photos.length > 0 ? photos : undefined,
      id: generatedId,
      createdAtISO: new Date().toISOString(),
      status: 'Belum Ditindak Lanjuti'
    };

    const updated = addAduan(fullAduan);
    setAduanList(updated);
    broadcastToServer({ aduanList: updated });

    // Auto-sync single aduan (supports Web App URL and OAuth Token)
    await appendSingleAduanToSheet(fullAduan, token || undefined);
    triggerBackgroundAutoSync('aduan', { aduanList: updated });
  };

  // Update status and add follow-up log from Wali Kelas
  const handleUpdateAduanStatus = async (
    aduanId: string,
    newStatus: StatusAduan,
    keterangan: string,
    olehWaliKelas: string
  ) => {
    const now = new Date();
    const timestampStr = `${now.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })} | ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WITA`;

    const updatedList = aduanList.map((ad) => {
      if (ad.id === aduanId) {
        const existingHistory = ad.tindakLanjutHistory || [];
        const newRecord = {
          status: newStatus,
          timestamp: timestampStr,
          olehWaliKelas,
          keterangan
        };
        return {
          ...ad,
          status: newStatus,
          tindakLanjutHistory: [...existingHistory, newRecord]
        };
      }
      return ad;
    });

    setAduanList(updatedList);
    saveAduan(updatedList);
    broadcastToServer({ aduanList: updatedList });

    const token = getStoredSheetsToken();
    await updateAduanStatusInGoogleSheets(
      aduanId,
      newStatus,
      keterangan,
      olehWaliKelas,
      timestampStr,
      updatedList,
      token || undefined
    );
  };

  // Delete single aduan (from Admin or Wali Kelas) with instant automatic Google Sheets sync
  const handleDeleteAduan = async (aduanId: string) => {
    const target = aduanList.find((item) => item.id === aduanId);
    const updated = aduanList.filter((item) => item.id !== aduanId);
    setAduanList(updated);
    saveAduan(updated);

    if (target) {
      const now = new Date();
      const delTimestamp = now.toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' }) + ' WIB';
      const deletedItem: Aduan = {
        ...target,
        isDeleted: true,
        status: 'Dihapus',
        deletedAt: delTimestamp,
        deletedBy: session.nama || 'Wali Kelas / Admin'
      };
      const updatedDel = recordDeletedAduan([deletedItem]);
      setDeletedAduanList(updatedDel);
      broadcastToServer({ aduanList: updated, deletedAduanList: updatedDel });

      const token = getStoredSheetsToken();
      await notifyDeleteAduanToGoogleSheets([deletedItem], updated, token || undefined);
    } else {
      broadcastToServer({ aduanList: updated });
      const token = getStoredSheetsToken();
      if (token) await syncAduanToGoogleSheet(updated, token);
    }
  };

  // Delete multiple aduan (bulk from Admin or Wali Kelas) with instant automatic Google Sheets sync
  const handleDeleteMultipleAduan = async (aduanIds: string[]) => {
    const idSet = new Set(aduanIds);
    const targets = aduanList.filter((item) => idSet.has(item.id));
    const updated = aduanList.filter((item) => !idSet.has(item.id));
    setAduanList(updated);
    saveAduan(updated);

    if (targets.length > 0) {
      const now = new Date();
      const delTimestamp = now.toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' }) + ' WIB';
      const deletedItems: Aduan[] = targets.map((item) => ({
        ...item,
        isDeleted: true,
        status: 'Dihapus',
        deletedAt: delTimestamp,
        deletedBy: session.nama || 'Wali Kelas / Admin'
      }));
      const updatedDel = recordDeletedAduan(deletedItems);
      setDeletedAduanList(updatedDel);
      broadcastToServer({ aduanList: updated, deletedAduanList: updatedDel });

      const token = getStoredSheetsToken();
      await notifyDeleteAduanToGoogleSheets(deletedItems, updated, token || undefined);
    } else {
      broadcastToServer({ aduanList: updated });
      const token = getStoredSheetsToken();
      if (token) await syncAduanToGoogleSheet(updated, token);
    }
  };

  // Restore aduan from history back to active list
  const handleRestoreAduan = async (restoredItems: Aduan[]) => {
    const restoredIds = new Set(restoredItems.map((r) => r.id));
    const updatedActive = [...aduanList, ...restoredItems];
    setAduanList(updatedActive);
    saveAduan(updatedActive);

    const updatedDel = deletedAduanList.filter((d) => !restoredIds.has(d.id));
    setDeletedAduanList(updatedDel);
    saveDeletedAduan(updatedDel);
    broadcastToServer({ aduanList: updatedActive, deletedAduanList: updatedDel });

    const token = getStoredSheetsToken();
    if (token) {
      await syncAduanToGoogleSheet(updatedActive, token, updatedDel);
    }
    triggerBackgroundAutoSync('aduan', { aduanList: updatedActive, deletedAduanList: updatedDel });
  };

  // Login handler
  const handleLoginSuccess = (newSession: UserSession) => {
    setSession(newSession);
    setActiveSubMenu('dashboard');
  };

  const handleLogout = () => {
    setSession({ role: 'guest' });
    setActiveSubMenu('form');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* 1. Header Navigation Component with Sub-Menu */}
      <Header
        session={session}
        activeSubMenu={activeSubMenu}
        onSelectSubMenu={(menu) => setActiveSubMenu(menu)}
        onOpenWaliKelasLogin={() => setIsWaliKelasLoginOpen(true)}
        onLogout={handleLogout}
      />

      {/* Role Banner for Logged-In Users */}
      {session.role !== 'guest' && (
        <div className="bg-teal-900 text-teal-100 px-4 md:px-8 py-1.5 border-b border-teal-700 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>
              Sesi Aktif: <strong className="text-white uppercase">{session.role}</strong> ({session.nama})
            </span>
          </div>
        </div>
      )}

      {/* 2. Main Body Content Area based on Active Sub Menu */}
      <main className="flex-grow p-4 md:p-6 max-w-7xl w-full mx-auto space-y-6">
        {activeSubMenu === 'dashboard' && session.role === 'admin' ? (
          <AdminDashboard
            guruList={guruList}
            mapelList={mapelList}
            kelasList={kelasList}
            siswaList={siswaList}
            waliKelasList={waliKelasList}
            aduanList={aduanList}
            onUpdateGuru={handleUpdateGuru}
            onUpdateMapel={handleUpdateMapel}
            onUpdateKelas={handleUpdateKelas}
            onUpdateSiswa={handleUpdateSiswa}
            onUpdateWaliKelas={handleUpdateWaliKelas}
            onUpdateAduan={handleUpdateAduan}
            onDeleteAduan={handleDeleteAduan}
            onDeleteMultipleAduan={handleDeleteMultipleAduan}
            onRestoreAduan={handleRestoreAduan}
            onCloseDashboard={() => setActiveSubMenu('form')}
          />
        ) : activeSubMenu === 'dashboard' && session.role === 'walikelas' ? (
          <WaliKelasDashboard
            session={session}
            aduanList={aduanList}
            deletedAduanList={deletedAduanList}
            siswaList={siswaList}
            kelasList={kelasList}
            onUpdateSiswa={handleUpdateSiswa}
            onUpdateAduanStatus={handleUpdateAduanStatus}
            onDeleteAduan={handleDeleteAduan}
            onDeleteMultipleAduan={handleDeleteMultipleAduan}
            onRestoreAduan={handleRestoreAduan}
            onCloseDashboard={() => setActiveSubMenu('form')}
          />
        ) : activeSubMenu === 'pantau' ? (
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
            <PantauProgresCard aduanList={aduanList} siswaList={siswaList} />
          </div>
        ) : activeSubMenu === 'statistik' ? (
          <StatistikTerkini aduanList={aduanList} />
        ) : (
          /* DEFAULT FORM ADUAN SUB-MENU */
          <div className="max-w-4xl mx-auto">
            <FormAduan
              guruList={guruList}
              mapelList={mapelList}
              kelasList={kelasList}
              siswaList={siswaList}
              onSubmitAduan={handleCreateAduan}
            />
          </div>
        )}
      </main>

      {/* 3. Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-3 px-4 md:px-8 flex flex-wrap items-center justify-between text-[11px] font-medium shrink-0 gap-2">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-teal-400" />
          <span>&copy; IS Project 2026.</span>
        </div>
        <div>
          <span>SISTEM ADUAN WALI KELAS - SMA NEGERI 4 BERAU v1.0</span>
        </div>
      </footer>

      {/* Wali Kelas / Unified Login Modal */}
      <WaliKelasLoginModal
        isOpen={isWaliKelasLoginOpen}
        onClose={() => setIsWaliKelasLoginOpen(false)}
        waliKelasAccounts={waliKelasList}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
