import { Aduan, AccountWaliKelas, Siswa, Guru, Mapel, Kelas, StatusAduan } from '../types';
import {
  getStoredAduan,
  getStoredDeletedAduan,
  getStoredGuru,
  getStoredDeletedGuru,
  getStoredMapel,
  getStoredDeletedMapel,
  getStoredKelas,
  getStoredDeletedKelas,
  getStoredSiswa,
  getStoredDeletedSiswa,
  getStoredWaliKelas,
  getStoredDeletedWaliKelas
} from '../data/storage';

export const DEFAULT_SPREADSHEET_ID = '1Fo4g48xIbWmzGFfSeY8A_i0Tpwz8-8XONRCqEmP4X5E';
const SPREADSHEET_ID_KEY = 'sawal_google_spreadsheet_id';

export function getStoredSpreadsheetId(): string {
  const stored = localStorage.getItem(SPREADSHEET_ID_KEY);
  if (!stored || stored === '1BIG3fq1AEIh2U8d6Uq39zxABQcGUoE_YMTqtYwaYdkA') {
    localStorage.setItem(SPREADSHEET_ID_KEY, DEFAULT_SPREADSHEET_ID);
    return DEFAULT_SPREADSHEET_ID;
  }
  return stored;
}

export function saveSpreadsheetId(id: string): string {
  let cleanId = id.trim();
  const match = cleanId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    cleanId = match[1];
  }
  if (!cleanId) cleanId = DEFAULT_SPREADSHEET_ID;
  localStorage.setItem(SPREADSHEET_ID_KEY, cleanId);
  return cleanId;
}

export function getSpreadsheetUrl(): string {
  const id = getStoredSpreadsheetId();
  return `https://docs.google.com/spreadsheets/d/${id}/edit?usp=sharing`;
}

export const SPREADSHEET_ID = getStoredSpreadsheetId();
export const SPREADSHEET_URL = getSpreadsheetUrl();

export const DEFAULT_DRIVE_FOLDER_ID = '1mAl3vc_Eh35AfRE7Kt5Rv91GV21q0DxC';
const DRIVE_FOLDER_ID_KEY = 'sawal_google_drive_folder_id';

export function getStoredDriveFolderId(): string {
  const stored = localStorage.getItem(DRIVE_FOLDER_ID_KEY);
  if (!stored) {
    localStorage.setItem(DRIVE_FOLDER_ID_KEY, DEFAULT_DRIVE_FOLDER_ID);
    return DEFAULT_DRIVE_FOLDER_ID;
  }
  return stored;
}

export function saveDriveFolderId(id: string): string {
  let cleanId = id.trim();
  const match = cleanId.match(/\/folders\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    cleanId = match[1];
  }
  if (!cleanId) cleanId = DEFAULT_DRIVE_FOLDER_ID;
  localStorage.setItem(DRIVE_FOLDER_ID_KEY, cleanId);
  return cleanId;
}

export function getDriveFolderUrl(): string {
  const folderId = getStoredDriveFolderId();
  return `https://drive.google.com/drive/folders/${folderId}?usp=sharing`;
}

export const DRIVE_FOLDER_ID = getStoredDriveFolderId();
export const DRIVE_FOLDER_URL = getDriveFolderUrl();

const WEB_APP_URL_KEY = 'sawal_google_web_app_url';

export function getStoredWebAppUrl(): string {
  return localStorage.getItem(WEB_APP_URL_KEY) || '';
}

export function saveWebAppUrl(url: string): string {
  const cleanUrl = url.trim();
  localStorage.setItem(WEB_APP_URL_KEY, cleanUrl);
  return cleanUrl;
}

/**
 * Returns full Google Apps Script backend code for Web App deployment
 */
export function getGoogleAppsScriptCode(): string {
  const spreadsheetId = getStoredSpreadsheetId();
  const driveFolderId = getStoredDriveFolderId();

  return `// =========================================================================
// SCRIPT GOOGLE APPS SCRIPT: SAWAL - SMAN 4 BERAU
// Database Otomatis & Real-Time Multi-Device (Desktop, HP, Tablet)
// =========================================================================

function doGet(e) {
  try {
    var spreadsheetId = "${spreadsheetId}";
    var ss = spreadsheetId ? SpreadsheetApp.openById(spreadsheetId) : SpreadsheetApp.getActiveSpreadsheet();

    function readSheetAsJson(sheetName) {
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) return [];
      var dataRange = sheet.getDataRange();
      var values = dataRange.getValues();
      if (values.length <= 1) return [];
      var headers = values[0];
      var list = [];
      for (var r = 1; r < values.length; r++) {
        var row = values[r];
        var item = {};
        for (var c = 0; c < headers.length; c++) {
          var h = String(headers[c]).trim();
          item[h] = row[c];
        }
        item._row = r + 1;
        list.push(item);
      }
      return list;
    }

    var result = {
      status: "online",
      spreadsheetId: spreadsheetId,
      timestamp: new Date().toISOString(),
      aduan: readSheetAsJson("Aduan"),
      guru: readSheetAsJson("Data_Guru"),
      mapel: readSheetAsJson("Data_Mapel"),
      kelas: readSheetAsJson("Data_Kelas"),
      murid: readSheetAsJson("Data_Murid"),
      waliKelas: readSheetAsJson("Data_WaliKelas")
    };

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var spreadsheetId = (data.spreadsheetId || "${spreadsheetId}").trim();
    var driveFolderId = (data.driveFolderId || "${driveFolderId}").trim();
    var ss = spreadsheetId ? SpreadsheetApp.openById(spreadsheetId) : SpreadsheetApp.getActiveSpreadsheet();

    // Helper: Simpan foto Base64 langsung ke Google Drive
    function saveBase64ToDrive(photoStr, aduanId, index) {
      if (!photoStr || photoStr === "-") return "-";
      var str = String(photoStr).trim();
      if (str.indexOf("http://") === 0 || str.indexOf("https://") === 0) {
        return str;
      }
      if (str.indexOf("data:image") === 0) {
        try {
          var parts = str.split(",");
          if (parts.length < 2) return "-";
          var mimeMatch = parts[0].match(/:(.*?);/);
          var mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
          var cleanBase64 = parts[1].replace(/[\\r\\n\\s]/g, "");
          var fileBlob = Utilities.newBlob(Utilities.base64Decode(cleanBase64), mime, "Aduan_" + (aduanId || "Foto") + "_foto" + (index + 1) + ".jpg");

          var folder = null;
          if (driveFolderId && driveFolderId.length > 5 && driveFolderId.indexOf("SAMPLE") === -1) {
            try {
              folder = DriveApp.getFolderById(driveFolderId);
            } catch(eFolder) {
              folder = null;
            }
          }

          var createdFile = folder ? folder.createFile(fileBlob) : DriveApp.createFile(fileBlob);
          try {
            createdFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          } catch(eShare) {}

          return createdFile.getUrl();
        } catch(errUpload) {
          return driveFolderId ? "https://drive.google.com/drive/folders/" + driveFolderId : "-";
        }
      }
      return "-";
    }

    // Helper: Proses list foto menjadi URL Drive
    function processPhotosList(item) {
      var photos = [];
      if (item.fotoBuktiList && Array.isArray(item.fotoBuktiList) && item.fotoBuktiList.length > 0) {
        photos = item.fotoBuktiList;
      } else if (item.fotoBukti && item.fotoBukti !== "-") {
        photos = String(item.fotoBukti).split("\\n");
      }
      var links = [];
      for (var p = 0; p < photos.length; p++) {
        var savedLink = saveBase64ToDrive(photos[p], item.id || "Foto", p);
        if (savedLink && savedLink !== "-") {
          links.push(savedLink);
        }
      }
      return links.length > 0 ? links.join("\\n") : "-";
    }

    // 1. FITUR SINKRONISASI OTOMATIS SELURUH DATA / TABEL (SYNC ALL)
    if (data.action === "sync_all" || data.action === "sync_table") {
      function syncTab(sheetName, headers, activeItems, deletedItems, formatRowFn) {
        var sheet = ss.getSheetByName(sheetName);
        if (!sheet) {
          sheet = ss.insertSheet(sheetName);
        }
        sheet.clear();

        var rows = [headers];
        var activeRowsCount = activeItems ? activeItems.length : 0;
        var deletedRowsCount = deletedItems ? deletedItems.length : 0;

        if (activeItems) {
          for (var i = 0; i < activeItems.length; i++) {
            rows.push(formatRowFn(activeItems[i], false));
          }
        }
        if (deletedItems) {
          for (var j = 0; j < deletedItems.length; j++) {
            rows.push(formatRowFn(deletedItems[j], true));
          }
        }

        if (rows.length > 0) {
          sheet.getRange(1, 1, rows.length, headers.length).setValues(rows);

          // Header: Dark Teal (#0F766E), Teks Putih Tebal
          sheet.getRange(1, 1, 1, headers.length)
            .setBackground("#0F766E")
            .setFontColor("#FFFFFF")
            .setFontWeight("bold")
            .setHorizontalAlignment("center");

          // Format Baris Aktif
          if (activeRowsCount > 0) {
            if (sheetName === "Aduan" && activeItems) {
              for (var a = 0; a < activeItems.length; a++) {
                var itm = activeItems[a];
                var rowIdx = 2 + a;
                if (itm.status === "Dalam Proses") {
                  sheet.getRange(rowIdx, 1, 1, headers.length)
                    .setBackground("#FEF9C3")
                    .setFontColor("#854D0E")
                    .setFontWeight("bold");
                } else if (itm.status === "Sudah Ditindak Lanjuti") {
                  sheet.getRange(rowIdx, 1, 1, headers.length)
                    .setBackground("#DCFCE7")
                    .setFontColor("#166534")
                    .setFontWeight("bold");
                } else if (itm.isEdited) {
                  sheet.getRange(rowIdx, 1, 1, headers.length)
                    .setBackground("#FEF9C3")
                    .setFontColor("#854D0E")
                    .setFontWeight("bold");
                } else {
                  sheet.getRange(rowIdx, 1, 1, headers.length)
                    .setBackground("#FFFFFF")
                    .setFontColor("#1E293B")
                    .setFontWeight("normal");
                }
              }
            } else if (activeItems) {
              for (var m = 0; m < activeItems.length; m++) {
                var mItem = activeItems[m];
                var mRowIdx = 2 + m;
                if (mItem && (mItem.isEdited || mItem.status === "DIEDIT")) {
                  sheet.getRange(mRowIdx, 1, 1, headers.length)
                    .setBackground("#FEF9C3")
                    .setFontColor("#854D0E")
                    .setFontWeight("bold");
                } else {
                  sheet.getRange(mRowIdx, 1, 1, headers.length)
                    .setBackground("#FFFFFF")
                    .setFontColor("#1E293B")
                    .setFontWeight("normal");
                }
              }
            }
          }

          // Format Baris Dihapus: Terblok Merah Muda (#FEE2E2), Teks Merah Gelap Tebal (#991B1B)
          if (deletedRowsCount > 0) {
            sheet.getRange(2 + activeRowsCount, 1, deletedRowsCount, headers.length)
              .setBackground("#FEE2E2")
              .setFontColor("#991B1B")
              .setFontWeight("bold");
          }
        }
      }

      // Sync Aduan
      if (data.aduanList || data.deletedAduanList) {
        syncTab("Aduan",
          ["ID Aduan", "Tanggal & Waktu Aduan", "Nama Guru Pelapor", "Mata Pelajaran", "Kelas", "Murid Melanggar", "Jenis Kesalahan", "Bukti Foto / Link Drive", "Catatan / Kronologi", "Status Terbaru", "Riwayat Tindak Lanjut"],
          data.aduanList, data.deletedAduanList,
          function(item, isDel) {
            var hist = item.tindakLanjutHistory ? item.tindakLanjutHistory.map(function(h){ return "[" + h.timestamp + "] (" + h.status + ") - " + h.olehWaliKelas + ": " + h.keterangan; }).join("\\n") : "-";
            if (isDel) {
              var delNote = "[" + (item.deletedAt || new Date().toLocaleString("id-ID")) + "] (DIHAPUS) - Dihapus oleh " + (item.deletedBy || "Admin");
              hist = hist !== "-" ? delNote + "\\n" + hist : delNote;
            } else if (item.isEdited && item.editHistory) {
              hist = hist !== "-" ? item.editHistory + "\\n" + hist : item.editHistory;
            }
            var fotoCell = processPhotosList(item);
            return [
              item.id || "",
              item.timestampAduan || "",
              item.namaGuru || "",
              item.mapel || "",
              item.kelas || "",
              Array.isArray(item.siswaList) ? item.siswaList.join(", ") : (item.siswaList || "-"),
              (item.jenisKesalahan || "") + (item.keteranganLainnya ? " (" + item.keteranganLainnya + ")" : ""),
              fotoCell,
              item.catatanKronologi || "-",
              isDel ? "DIHAPUS" : (item.status || "Belum Ditindak Lanjuti"),
              hist
            ];
          }
        );
      }

      // Sync Data_Guru
      if (data.guruList || data.deletedGuruList) {
        syncTab("Data_Guru",
          ["ID", "Nama Lengkap Guru", "NIP", "Mata Pelajaran Utama", "Status", "Riwayat & Keterangan Perubahan"],
          data.guruList, data.deletedGuruList,
          function(g, isDel) {
            var status = isDel ? "DIHAPUS" : (g.isEdited ? "DIEDIT" : "AKTIF");
            var history = isDel
              ? ("[" + (g.deletedAt || new Date().toLocaleString("id-ID")) + "] (DIHAPUS) - Dihapus oleh " + (g.deletedBy || "Admin") + (g.editHistory ? "\\n" + g.editHistory : ""))
              : (g.editHistory || (g.isEdited ? "[" + (g.editedAt || "") + "] DIEDIT oleh " + (g.editedBy || "Admin") : "-"));
            return [g.id || "", g.nama || "", g.nip || "-", g.mapelUtama || "-", status, history];
          }
        );
      }

      // Sync Data_Mapel
      if (data.mapelList || data.deletedMapelList) {
        syncTab("Data_Mapel",
          ["ID", "Nama Mata Pelajaran", "Kode Mapel", "Status", "Riwayat & Keterangan Perubahan"],
          data.mapelList, data.deletedMapelList,
          function(m, isDel) {
            var status = isDel ? "DIHAPUS" : (m.isEdited ? "DIEDIT" : "AKTIF");
            var history = isDel
              ? ("[" + (m.deletedAt || new Date().toLocaleString("id-ID")) + "] (DIHAPUS) - Dihapus oleh " + (m.deletedBy || "Admin") + (m.editHistory ? "\\n" + m.editHistory : ""))
              : (m.editHistory || (m.isEdited ? "[" + (m.editedAt || "") + "] DIEDIT oleh " + (m.editedBy || "Admin") : "-"));
            return [m.id || "", m.nama || "", m.kode || "-", status, history];
          }
        );
      }

      // Sync Data_Kelas
      if (data.kelasList || data.deletedKelasList) {
        syncTab("Data_Kelas",
          ["ID", "Nama Kelas / Rombel", "Status", "Riwayat & Keterangan Perubahan"],
          data.kelasList, data.deletedKelasList,
          function(k, isDel) {
            var status = isDel ? "DIHAPUS" : (k.isEdited ? "DIEDIT" : "AKTIF");
            var history = isDel
              ? ("[" + (k.deletedAt || new Date().toLocaleString("id-ID")) + "] (DIHAPUS) - Dihapus oleh " + (k.deletedBy || "Admin") + (k.editHistory ? "\\n" + k.editHistory : ""))
              : (k.editHistory || (k.isEdited ? "[" + (k.editedAt || "") + "] DIEDIT oleh " + (k.editedBy || "Admin") : "-"));
            return [k.id || "", k.nama || "", status, history];
          }
        );
      }

      // Sync Data_Murid
      if (data.siswaList || data.deletedSiswaList) {
        syncTab("Data_Murid",
          ["ID", "NIS", "Nama Lengkap Murid", "Kelas", "Status", "Riwayat & Keterangan Perubahan"],
          data.siswaList, data.deletedSiswaList,
          function(s, isDel) {
            var status = isDel ? "DIHAPUS" : (s.isEdited ? "DIEDIT" : "AKTIF");
            var history = isDel
              ? ("[" + (s.deletedAt || new Date().toLocaleString("id-ID")) + "] (DIHAPUS) - Dihapus oleh " + (s.deletedBy || "Admin") + (s.editHistory ? "\\n" + s.editHistory : ""))
              : (s.editHistory || (s.isEdited ? "[" + (s.editedAt || "") + "] DIEDIT oleh " + (s.editedBy || "Admin") : "-"));
            return [s.id || "", s.nis || "-", s.nama || "", s.kelas || "", status, history];
          }
        );
      }

      // Sync Data_WaliKelas
      if (data.waliKelasList || data.deletedWaliKelasList) {
        syncTab("Data_WaliKelas",
          ["ID", "Nama Lengkap Wali Kelas", "Kelas Binaan", "Username Login", "Status", "Riwayat & Keterangan Perubahan"],
          data.waliKelasList, data.deletedWaliKelasList,
          function(w, isDel) {
            var status = isDel ? "DIHAPUS" : (w.isEdited ? "DIEDIT" : "AKTIF");
            var history = isDel
              ? ("[" + (w.deletedAt || new Date().toLocaleString("id-ID")) + "] (DIHAPUS) - Dihapus oleh " + (w.deletedBy || "Admin") + (w.editHistory ? "\\n" + w.editHistory : ""))
              : (w.editHistory || (w.isEdited ? "[" + (w.editedAt || "") + "] DIEDIT oleh " + (w.editedBy || "Admin") : "-"));
            return [w.id || "", w.nama || "", w.kelasAssigned || "", w.username || "", status, history];
          }
        );
      }

      return ContentService.createTextOutput(JSON.stringify({ result: "success", message: "Sinkronisasi otomatis berhasil!" })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. FITUR UPDATE STATUS TINDAK LANJUT
    if (data.action === "update_status") {
      var sheetAduanStatus = ss.getSheetByName("Aduan");
      if (sheetAduanStatus) {
        var dataRangeStatus = sheetAduanStatus.getDataRange();
        var valuesStatus = dataRangeStatus.getValues();
        for (var rowIdx = 1; rowIdx < valuesStatus.length; rowIdx++) {
          if (String(valuesStatus[rowIdx][0]).trim() === String(data.id).trim()) {
            var targetRow = rowIdx + 1;
            sheetAduanStatus.getRange(targetRow, 10).setValue(data.newStatus);

            var existingHistory = valuesStatus[rowIdx][10] ? String(valuesStatus[rowIdx][10]) : "";
            var logEntry = "[" + (data.timestamp || new Date().toLocaleString("id-ID")) + "] (" + data.newStatus + ") - " + data.olehWaliKelas + ": " + data.keterangan;
            var combinedHistory = (existingHistory && existingHistory !== "-") ? logEntry + "\\n" + existingHistory : logEntry;
            sheetAduanStatus.getRange(targetRow, 11).setValue(combinedHistory);

            var rowRangeStyle = sheetAduanStatus.getRange(targetRow, 1, 1, valuesStatus[rowIdx].length);
            if (data.newStatus === "Dalam Proses") {
              rowRangeStyle.setBackground("#FEF9C3").setFontColor("#854D0E").setFontWeight("bold");
            } else if (data.newStatus === "Sudah Ditindak Lanjuti") {
              rowRangeStyle.setBackground("#DCFCE7").setFontColor("#166534").setFontWeight("bold");
            } else {
              rowRangeStyle.setBackground("#FFFFFF").setFontColor("#1E293B").setFontWeight("normal");
            }
            break;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({
        result: "success",
        message: "Status tindak lanjut (" + data.newStatus + ") berhasil diperbarui di Google Sheets!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. FITUR EDIT MASTER DATA ATAU ADUAN
    if (data.action === "edit") {
      var targetSheetName = data.sheetName || "Data_Guru";
      var sheetEdit = ss.getSheetByName(targetSheetName);
      if (sheetEdit) {
        var dataRangeEdit = sheetEdit.getDataRange();
        var valuesEdit = dataRangeEdit.getValues();
        for (var eIdx = 1; eIdx < valuesEdit.length; eIdx++) {
          if (String(valuesEdit[eIdx][0]).trim() === String(data.id).trim()) {
            var targetRow = eIdx + 1;
            var statusCol = valuesEdit[eIdx].length - 1;
            var historyCol = valuesEdit[eIdx].length;
            sheetEdit.getRange(targetRow, statusCol).setValue("DIEDIT");

            var existingHistory = valuesEdit[eIdx][historyCol - 1] ? String(valuesEdit[eIdx][historyCol - 1]) : "";
            var logEntry = data.editHistory || ("[" + (data.timestamp || new Date().toLocaleString("id-ID")) + "] DIEDIT oleh " + (data.editedBy || "Admin"));
            var combinedHistory = (existingHistory && existingHistory !== "-") ? logEntry + "\\n" + existingHistory : logEntry;
            sheetEdit.getRange(targetRow, historyCol).setValue(combinedHistory);

            sheetEdit.getRange(targetRow, 1, 1, valuesEdit[eIdx].length)
              .setBackground("#FEF9C3")
              .setFontColor("#854D0E")
              .setFontWeight("bold");
            break;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({
        result: "success",
        message: "Data berhasil diedit dan terblok kuning di Google Sheets!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 4. FITUR HAPUS / BLOK MERAH
    if (data.action === "delete" || data.action === "delete_multiple" || data.isDeleted) {
      var targetSheetName = data.sheetName || "Aduan";
      var sheet = ss.getSheetByName(targetSheetName) || ss.getSheets()[0];
      var itemsToDelete = data.items || [{ id: data.id, deletedAt: data.deletedAt, deletedBy: data.deletedBy }];
      var dataRange = sheet.getDataRange();
      var values = dataRange.getValues();
      var deleteMap = {};
      for (var k = 0; k < itemsToDelete.length; k++) {
        deleteMap[String(itemsToDelete[k].id).trim()] = itemsToDelete[k];
      }

      for (var i = 1; i < values.length; i++) {
        var rowId = String(values[i][0]).trim();
        if (deleteMap[rowId]) {
          var rowNumber = i + 1;
          var itemInfo = deleteMap[rowId];
          var timestampHapus = itemInfo.deletedAt || new Date().toLocaleString("id-ID");
          var deletedBy = itemInfo.deletedBy || "Admin";

          if (targetSheetName === "Aduan") {
            sheet.getRange(rowNumber, 10).setValue("DIHAPUS");
            sheet.getRange(rowNumber, 11).setValue("[" + timestampHapus + "] (DIHAPUS) - Dihapus oleh " + deletedBy + " dari Web");
          } else {
            sheet.getRange(rowNumber, values[i].length - 1).setValue("DIHAPUS");
            sheet.getRange(rowNumber, values[i].length).setValue("[" + timestampHapus + "] Dihapus oleh " + deletedBy);
          }

          sheet.getRange(rowNumber, 1, 1, values[i].length)
            .setBackground("#FEE2E2")
            .setFontColor("#991B1B")
            .setFontWeight("bold");
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        result: "success",
        message: "Data berhasil ditandai DIHAPUS dan terblok merah di Google Sheets!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 5. FITUR TAMBAH ADUAN BARU
    var sheetAduan = ss.getSheetByName("Aduan");
    if (!sheetAduan) {
      sheetAduan = ss.insertSheet("Aduan");
      sheetAduan.appendRow(["ID Aduan", "Tanggal & Waktu Aduan", "Nama Guru Pelapor", "Mata Pelajaran", "Kelas", "Murid Melanggar", "Jenis Kesalahan", "Bukti Foto / Link Drive", "Catatan / Kronologi", "Status Terbaru", "Riwayat Tindak Lanjut"]);
      sheetAduan.getRange(1, 1, 1, 11).setBackground("#0F766E").setFontColor("#FFFFFF").setFontWeight("bold").setHorizontalAlignment("center");
    }

    var fotoUrl = processPhotosList(data);
    var siswaStr = Array.isArray(data.siswaList) ? data.siswaList.join(", ") : (data.siswaList || "-");
    var ketStr = (data.jenisKesalahan || "") + (data.keteranganLainnya ? " (" + data.keteranganLainnya + ")" : "");

    sheetAduan.appendRow([
      data.id || "",
      data.timestampAduan || new Date().toLocaleString("id-ID"),
      data.namaGuru || "",
      data.mapel || "",
      data.kelas || "",
      siswaStr,
      ketStr,
      fotoUrl,
      data.catatanKronologi || "-",
      data.status || "Belum Ditindak Lanjuti",
      "-"
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      result: "success",
      message: "Aduan & bukti foto berhasil disimpan ke Google Drive dan Google Sheets!",
      photoLinks: fotoUrl
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ result: "error", message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}`;
}

const TOKEN_KEY = 'sawal_google_sheets_token';
const EXPIRES_KEY = 'sawal_google_sheets_token_expires';

function dataURLtoBlob(dataurl: string): { blob: Blob; mime: string } {
  try {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return { blob: new Blob([u8arr], { type: mime }), mime };
  } catch {
    return { blob: new Blob([]), mime: 'image/jpeg' };
  }
}

/**
 * Upload image (base64 data URL) to Google Drive folder
 */
export async function uploadPhotoToGoogleDrive(
  base64Data: string,
  fileName: string,
  accessToken?: string
): Promise<string> {
  if (!base64Data) return '-';
  if (base64Data.startsWith('http://') || base64Data.startsWith('https://')) {
    return base64Data;
  }

  const token = accessToken || getStoredSheetsToken();
  if (!token) {
    // Preserve base64Data when not logged in with token
    return base64Data;
  }

  try {
    if (!base64Data.startsWith('data:image')) {
      return base64Data;
    }

    const { blob } = dataURLtoBlob(base64Data);
    if (blob.size === 0) return base64Data;

    const folderId = getStoredDriveFolderId();

    // Attempt 1: Upload into specific parent DRIVE_FOLDER_ID
    const metadataWithParent = {
      name: `${fileName}.jpg`,
      parents: [folderId]
    };

    const formDataWithParent = new FormData();
    formDataWithParent.append(
      'metadata',
      new Blob([JSON.stringify(metadataWithParent)], { type: 'application/json' })
    );
    formDataWithParent.append('file', blob);

    let res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formDataWithParent
    });

    // Attempt 2: If parent folder upload fails (403/404), upload directly to user's Drive root
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      if (res.status === 403 || errText.includes('insufficientPermissions') || errText.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT')) {
        console.warn('Google Drive API permission denied (insufficient scopes). Clearing stale token.');
        clearSheetsToken();
      } else {
        console.warn('Google Drive Upload with parent folder failed (status', res.status, errText, '), trying root drive...');
      }

      const metadataNoParent = { name: `${fileName}.jpg` };
      const formDataNoParent = new FormData();
      formDataNoParent.append(
        'metadata',
        new Blob([JSON.stringify(metadataNoParent)], { type: 'application/json' })
      );
      formDataNoParent.append('file', blob);

      res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formDataNoParent
      });
    }

    if (res.ok) {
      const data = await res.json();
      if (data.id) {
        // Grant reader permissions so anyone with the link can view
        fetch(`https://www.googleapis.com/drive/v3/files/${data.id}/permissions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ role: 'reader', type: 'anyone' })
        }).catch(() => {});

        return `https://drive.google.com/file/d/${data.id}/view`;
      }
    } else {
      const errText = await res.text().catch(() => '');
      if (res.status === 403 || errText.includes('insufficientPermissions') || errText.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT')) {
        console.warn('Google Drive API scope permission denied. Clearing token.');
        clearSheetsToken();
      } else {
        console.error('Google Drive Upload Failed:', res.status, errText);
      }
    }
  } catch (err) {
    console.warn('Gagal upload file ke Google Drive API:', err);
  }

  return base64Data;
}

/**
 * Upload multiple images to Google Drive and return array of links
 */
export async function uploadPhotosToGoogleDrive(
  photos: string[],
  aduanId: string,
  accessToken?: string
): Promise<string[]> {
  if (!photos || photos.length === 0) return [];
  const results: string[] = [];

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    if (!photo || photo === '-') continue;
    if (photo.startsWith('http://') || photo.startsWith('https://')) {
      results.push(photo);
      continue;
    }

    const fileName = `Aduan_${aduanId}_foto${i + 1}`;
    try {
      const uploaded = await uploadPhotoToGoogleDrive(photo, fileName, accessToken);
      if (uploaded && uploaded.startsWith('http')) {
        results.push(uploaded);
      } else {
        results.push(getDriveFolderUrl());
      }
    } catch {
      results.push(getDriveFolderUrl());
    }
  }

  return results;
}

export function getStoredSheetsToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const expires = localStorage.getItem(EXPIRES_KEY);
  if (!token || !expires) return null;
  if (Date.now() > parseInt(expires, 10)) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRES_KEY);
    return null;
  }
  return token;
}

export function saveSheetsToken(token: string, expiresInSeconds: number = 3600) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EXPIRES_KEY, (Date.now() + expiresInSeconds * 1000).toString());
}

export function clearSheetsToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRES_KEY);
}

const CLIENT_ID_KEY = 'sawal_google_client_id';
export const DEFAULT_CLIENT_ID = '111128116224-o716fpvpedjdlefk71o95p3hfiionbbp.apps.googleusercontent.com';

export function getStoredClientId(): string {
  const stored = localStorage.getItem(CLIENT_ID_KEY);
  if (!stored) {
    localStorage.setItem(CLIENT_ID_KEY, DEFAULT_CLIENT_ID);
    return DEFAULT_CLIENT_ID;
  }
  return stored;
}

export function saveClientId(clientId: string) {
  localStorage.setItem(CLIENT_ID_KEY, clientId.trim());
}

/**
 * Request Google OAuth token via Google Identity Services (GSI)
 */
export function requestGoogleOAuthToken(providedClientId?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Check if google accounts script is loaded
    if (typeof window === 'undefined' || !(window as any).google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services (GSI) SDK belum siap. Silakan muat ulang halaman.'));
      return;
    }

    const clientId = providedClientId || getStoredClientId();
    if (!clientId) {
      reject(new Error('Google OAuth Client ID belum diatur. Silakan masukkan Client ID dari Google Cloud Console.'));
      return;
    }

    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive',
        callback: (response: any) => {
          if (response.error) {
            reject(new Error(`OAuth Error: ${response.error}`));
            return;
          }
          if (response.access_token) {
            const expiresIn = response.expires_in ? parseInt(response.expires_in, 10) : 3600;
            saveSheetsToken(response.access_token, expiresIn);
            resolve(response.access_token);
          } else {
            reject(new Error('Gagal mendapatkan access token Google.'));
          }
        }
      });
      client.requestAccessToken({ prompt: 'consent' });
    } catch (err: any) {
      reject(err);
    }
  });
}

/**
 * Ensure sheets tabs exist (Aduan, Data_WaliKelas, Data_Murid, Data_Guru, Data_Mapel, Data_Kelas)
 */
async function ensureSheetTabsExist(token: string) {
  const sheetId = getStoredSpreadsheetId();
  try {
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    if (!metaRes.ok) return;

    const meta = await metaRes.json();
    const existingTitles: string[] = meta.sheets?.map((s: any) => s.properties?.title) || [];

    const requiredTabs = ['Aduan', 'Data_WaliKelas', 'Data_Murid', 'Data_Guru', 'Data_Mapel', 'Data_Kelas'];
    const missingTabs = requiredTabs.filter((t) => !existingTitles.includes(t));

    if (missingTabs.length > 0) {
      const requests = missingTabs.map((title) => ({
        addSheet: {
          properties: { title }
        }
      }));

      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ requests })
        }
      );
    }
  } catch (err) {
    console.warn('Tab verification warning:', err);
  }
}

/**
 * Automatically format sheet with colors:
 * - Reset Data Rows (Row 1 to 500): White background #FFFFFF, dark slate text, normal weight
 * - Header (Row 0): Dark Teal #0F766E, White bold text, centered
 * - Active Rows:
 *     - Edited Rows (isEdited = true): Soft Yellow #FEF9C3 background, Dark Amber #854D0E bold text
 *     - Normal Rows: White background #FFFFFF, dark slate text
 * - Deleted Rows: Soft Red #FEE2E2 background, Dark Red #991B1B bold text
 */
async function formatSheetRowsWithDeletions(
  token: string,
  sheetId: string,
  tabTitle: string,
  colCount: number,
  activeItemsOrCount: any[] | number,
  deletedRowCount: number
) {
  try {
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!metaRes.ok) return;
    const meta = await metaRes.json();
    const sheetObj = meta.sheets?.find((s: any) => s.properties?.title === tabTitle);
    if (!sheetObj) return;
    const sheetNumericId = sheetObj.properties.sheetId;

    const requests: any[] = [];

    // 0. Reset all data rows (Row 1 to 500) to clean white & normal text first
    requests.push({
      repeatCell: {
        range: {
          sheetId: sheetNumericId,
          startRowIndex: 1,
          endRowIndex: 500,
          startColumnIndex: 0,
          endColumnIndex: colCount
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
            textFormat: {
              foregroundColor: { red: 0.12, green: 0.16, blue: 0.22 },
              bold: false
            }
          }
        },
        fields: 'userEnteredFormat.backgroundColor,userEnteredFormat.textFormat'
      }
    });

    // 1. Header Row (Row 0): Dark Teal #0F766E, White Bold Text, Centered
    requests.push({
      repeatCell: {
        range: {
          sheetId: sheetNumericId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: colCount
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.06, green: 0.46, blue: 0.43 }, // #0F766E Dark Teal
            textFormat: {
              foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
              bold: true,
              fontSize: 10
            },
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE'
          }
        },
        fields: 'userEnteredFormat.backgroundColor,userEnteredFormat.textFormat,userEnteredFormat.horizontalAlignment,userEnteredFormat.verticalAlignment'
      }
    });

    const activeCount = Array.isArray(activeItemsOrCount) ? activeItemsOrCount.length : activeItemsOrCount;

    // 2. Active Rows styling (Apply Soft Yellow to edited rows)
    if (Array.isArray(activeItemsOrCount)) {
      activeItemsOrCount.forEach((item, index) => {
        const rowIndex = 1 + index;
        const isEdited = !!(item && (item.isEdited || item.status === 'DIEDIT'));
        if (isEdited) {
          requests.push({
            repeatCell: {
              range: {
                sheetId: sheetNumericId,
                startRowIndex: rowIndex,
                endRowIndex: rowIndex + 1,
                startColumnIndex: 0,
                endColumnIndex: colCount
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.996, green: 0.976, blue: 0.765 }, // #FEF9C3 Soft Yellow
                  textFormat: {
                    foregroundColor: { red: 0.52, green: 0.30, blue: 0.05 }, // #854D0E Amber Dark
                    bold: true
                  }
                }
              },
              fields: 'userEnteredFormat.backgroundColor,userEnteredFormat.textFormat'
            }
          });
        }
      });
    }

    // 3. Deleted Rows (Row 1 + activeCount to 1 + activeCount + deletedRowCount): Soft Red #FEE2E2 & Dark Red #991B1B bold text
    if (deletedRowCount > 0) {
      requests.push({
        repeatCell: {
          range: {
            sheetId: sheetNumericId,
            startRowIndex: 1 + activeCount,
            endRowIndex: 1 + activeCount + deletedRowCount,
            startColumnIndex: 0,
            endColumnIndex: colCount
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.996, green: 0.886, blue: 0.886 }, // #FEE2E2 Soft Red
              textFormat: {
                foregroundColor: { red: 0.60, green: 0.11, blue: 0.11 }, // #991B1B Dark Red
                bold: true
              }
            }
          },
          fields: 'userEnteredFormat.backgroundColor,userEnteredFormat.textFormat'
        }
      });
    }

    if (requests.length > 0) {
      const resp = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ requests })
        }
      );
      if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        console.warn(`Formatting ${tabTitle} batchUpdate warning (${resp.status}):`, errText);
      }
    }
  } catch (err) {
    console.warn(`Formatting ${tabTitle} sheet error:`, err);
  }
}

function cleanCellString(val: any): string {
  if (val === null || val === undefined) return '-';
  const str = String(val);
  if (str.startsWith('data:image')) {
    return getDriveFolderUrl();
  }
  if (str.length > 10000) {
    return str.substring(0, 10000) + '... (data dipotong karena batas sel Google Sheets)';
  }
  return str;
}

/**
 * Automatically format Aduan sheet with colors:
 * - Header (Row 0): Dark Teal #0F766E, White Bold Text
 * - 'Dalam Proses' Rows: Soft Yellow #FEF9C3 background, Dark Amber #854D0E text
 * - 'Sudah Ditindak Lanjuti' Rows: Soft Green #DCFCE7 background, Dark Green #166534 text
 * - 'Belum Ditindak Lanjuti' / default Rows: White background #FFFFFF, dark slate text
 * - Deleted Rows: Soft Red #FEE2E2 background, Dark Red #991B1B bold text
 */
async function formatAduanSheetRows(
  token: string,
  sheetId: string,
  activeItems: Aduan[],
  deletedRowCount: number
) {
  try {
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!metaRes.ok) return;
    const meta = await metaRes.json();
    const aduanSheet = meta.sheets?.find((s: any) => s.properties?.title === 'Aduan');
    if (!aduanSheet) return;
    const aduanSheetNumericId = aduanSheet.properties.sheetId;

    const requests: any[] = [];

    // 0. Reset all data rows (Row 1 to 1000) to clean white & normal text first
    requests.push({
      repeatCell: {
        range: {
          sheetId: aduanSheetNumericId,
          startRowIndex: 1,
          endRowIndex: 1000,
          startColumnIndex: 0,
          endColumnIndex: 11
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
            textFormat: {
              foregroundColor: { red: 0.12, green: 0.16, blue: 0.22 },
              bold: false
            }
          }
        },
        fields: 'userEnteredFormat.backgroundColor,userEnteredFormat.textFormat'
      }
    });

    // 1. Header Row (Row 0): Dark Teal #0F766E, White Bold Text
    requests.push({
      repeatCell: {
        range: {
          sheetId: aduanSheetNumericId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 11
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.06, green: 0.46, blue: 0.43 },
            textFormat: {
              foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
              bold: true,
              fontSize: 10
            },
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE'
          }
        },
        fields: 'userEnteredFormat.backgroundColor,userEnteredFormat.textFormat,userEnteredFormat.horizontalAlignment,userEnteredFormat.verticalAlignment'
      }
    });

    // 2. Active Rows (Row 1 to 1 + activeItems.length) styled according to individual status
    activeItems.forEach((item, index) => {
      const rowIndex = 1 + index;
      let bgColor = { red: 1.0, green: 1.0, blue: 1.0 }; // Default white
      let fgColor = { red: 0.12, green: 0.16, blue: 0.22 }; // Default dark slate
      let isBold = false;

      if (item.status === 'Dalam Proses') {
        // Kuning Soft #FEF9C3, Teks Amber Gelap #854D0E
        bgColor = { red: 0.996, green: 0.976, blue: 0.765 };
        fgColor = { red: 0.52, green: 0.30, blue: 0.05 };
        isBold = true;
      } else if (item.status === 'Sudah Ditindak Lanjuti') {
        // Hijau Soft #DCFCE7, Teks Hijau Tua #166534
        bgColor = { red: 0.863, green: 0.988, blue: 0.906 };
        fgColor = { red: 0.09, green: 0.39, blue: 0.20 };
        isBold = true;
      } else if (item.isEdited) {
        // Diedit: Kuning Soft #FEF9C3, Teks Dark Amber #854D0E
        bgColor = { red: 0.996, green: 0.976, blue: 0.765 };
        fgColor = { red: 0.52, green: 0.30, blue: 0.05 };
        isBold = true;
      }

      if (item.status === 'Dalam Proses' || item.status === 'Sudah Ditindak Lanjuti' || item.isEdited) {
        requests.push({
          repeatCell: {
            range: {
              sheetId: aduanSheetNumericId,
              startRowIndex: rowIndex,
              endRowIndex: rowIndex + 1,
              startColumnIndex: 0,
              endColumnIndex: 11
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: bgColor,
                textFormat: {
                  foregroundColor: fgColor,
                  bold: isBold
                }
              }
            },
            fields: 'userEnteredFormat.backgroundColor,userEnteredFormat.textFormat'
          }
        });
      }
    });

    // 3. Deleted Rows (Row 1 + activeItems.length to 1 + activeItems.length + deletedRowCount):
    // TERBLOK MERAH: Soft Red background #FEE2E2 with dark red bold text #991B1B
    if (deletedRowCount > 0) {
      requests.push({
        repeatCell: {
          range: {
            sheetId: aduanSheetNumericId,
            startRowIndex: 1 + activeItems.length,
            endRowIndex: 1 + activeItems.length + deletedRowCount,
            startColumnIndex: 0,
            endColumnIndex: 11
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.996, green: 0.886, blue: 0.886 }, // #FEE2E2 Soft Red
              textFormat: {
                foregroundColor: { red: 0.60, green: 0.11, blue: 0.11 }, // #991B1B Dark Red
                bold: true
              }
            }
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat)'
        }
      });
    }

    if (requests.length > 0) {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ requests })
        }
      );
    }
  } catch (err) {
    console.warn('Formatting Aduan sheet error:', err);
  }
}

/**
 * Sync entire Aduan list to 'Aduan' sheet, including deleted history blocked in red
 */
export async function syncAduanToGoogleSheet(
  aduanList: Aduan[],
  accessToken?: string,
  customDeletedList?: Aduan[]
): Promise<{ success: boolean; message: string }> {
  const token = accessToken || getStoredSheetsToken();
  if (!token) {
    return { success: false, message: 'Belum terhubung ke Google Sheets. Silakan hubungkan akun Google.' };
  }

  await ensureSheetTabsExist(token);
  const sheetId = getStoredSpreadsheetId();

  const headers = [
    'ID Aduan',
    'Tanggal & Waktu Aduan',
    'Nama Guru Pelapor',
    'Mata Pelajaran',
    'Kelas',
    'Murid Melanggar',
    'Jenis Kesalahan',
    'Bukti Foto / Link Drive',
    'Catatan / Kronologi',
    'Status Terbaru',
    'Riwayat Tindak Lanjut'
  ];

  // Active items (excluding any flagged as deleted)
  const activeItems = aduanList.filter((a) => !a.isDeleted);
  // Deleted history items
  const deletedItems = customDeletedList || getStoredDeletedAduan() || [];

  // 1. Process Active Rows
  const activeRows = await Promise.all(
    activeItems.map(async (a) => {
      const historyStr = a.tindakLanjutHistory
        ? a.tindakLanjutHistory
            .map((h) => `[${h.timestamp}] (${h.status}) - ${h.olehWaliKelas}: ${h.keterangan}`)
            .join('\n')
        : '-';

      // Collect all photos from fotoBuktiList or fotoBukti
      let photosToProcess: string[] = [];
      if (a.fotoBuktiList && a.fotoBuktiList.length > 0) {
        photosToProcess = a.fotoBuktiList;
      } else if (a.fotoBukti && a.fotoBukti !== '-') {
        photosToProcess = a.fotoBukti.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
      }

      let fotoLink = '-';
      if (photosToProcess.length > 0) {
        try {
          const uploadedUrls = await uploadPhotosToGoogleDrive(photosToProcess, a.id, token);
          if (uploadedUrls.length > 0) {
            fotoLink = uploadedUrls.join('\n');
            a.fotoBukti = fotoLink;
            a.fotoBuktiList = uploadedUrls;
          } else {
            fotoLink = getDriveFolderUrl();
          }
        } catch {
          fotoLink = getDriveFolderUrl();
        }
      }

      return [
        a.id,
        a.timestampAduan,
        a.namaGuru,
        a.mapel,
        a.kelas,
        a.siswaList.join(', '),
        a.jenisKesalahan + (a.keteranganLainnya ? ` (${a.keteranganLainnya})` : ''),
        fotoLink,
        a.catatanKronologi || '-',
        a.status,
        historyStr
      ].map(cleanCellString);
    })
  );

  // 2. Process Deleted Rows (Marked as DIHAPUS with deletion timestamp in history)
  const deletedRows = deletedItems.map((d) => {
    const delTimestamp = d.deletedAt || new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' }) + ' WIB';
    const delBy = d.deletedBy || 'Admin';

    let historyStr = d.tindakLanjutHistory
      ? d.tindakLanjutHistory
          .map((h) => `[${h.timestamp}] (${h.status}) - ${h.olehWaliKelas}: ${h.keterangan}`)
          .join('\n')
      : '';

    const deletionLog = `[${delTimestamp}] (DIHAPUS) - Dihapus oleh ${delBy} dari Web Rekap Aduan`;
    const fullHistory = historyStr ? `${deletionLog}\n${historyStr}` : deletionLog;

    let fotoLink = '-';
    if (d.fotoBuktiList && d.fotoBuktiList.length > 0) {
      fotoLink = d.fotoBuktiList.filter(p => p && p.startsWith('http')).join('\n') || '-';
    } else if (d.fotoBukti && d.fotoBukti !== '-') {
      fotoLink = d.fotoBukti.split(/\r?\n/).filter(p => p.startsWith('http')).join('\n') || '-';
    }

    return [
      d.id,
      d.timestampAduan,
      d.namaGuru,
      d.mapel,
      d.kelas,
      d.siswaList ? d.siswaList.join(', ') : '-',
      d.jenisKesalahan + (d.keteranganLainnya ? ` (${d.keteranganLainnya})` : ''),
      fotoLink,
      d.catatanKronologi || '-',
      'DIHAPUS',
      fullHistory
    ].map(cleanCellString);
  });

  const values = [headers, ...activeRows, ...deletedRows];

  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Aduan!A1:Z2000?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      }
    );

    if (!res.ok) {
      if (res.status === 403) {
        throw new Error(`Akses Ditolak (HTTP 403): Akun Google yang terhubung tidak memiliki hak Edit ke Spreadsheet ID (${sheetId}). Silakan pastikan Spreadsheet dibuka akses Edit-nya atau gunakan ID milik Anda.`);
      }
      if (res.status === 404) {
        throw new Error(`Spreadsheet Tidak Ditemukan (HTTP 404): Periksa kembali Spreadsheet ID (${sheetId}) di Pengaturan.`);
      }
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Gagal memperbarui sheet Aduan (${res.status})`);
    }

    // Apply color highlights: Deleted rows blocked in Soft Red, 'Dalam Proses' in Soft Yellow, 'Sudah Ditindak Lanjuti' in Soft Green, Header in Dark Teal
    await formatAduanSheetRows(token, sheetId, activeItems, deletedRows.length);

    return {
      success: true,
      message: `Berhasil sinkron ${activeRows.length} Aduan aktif dan ${deletedRows.length} histori aduan terhapus (terblok merah) ke Google Sheets.`
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal sinkron data Aduan.' };
  }
}

/**
 * Update Aduan Status and Follow-up History directly to Google Sheets with color styling (Yellow for 'Dalam Proses', Green for 'Sudah Ditindak Lanjuti')
 */
export async function updateAduanStatusInGoogleSheets(
  aduanId: string,
  newStatus: StatusAduan,
  keterangan: string,
  olehWaliKelas: string,
  timestampStr: string,
  fullUpdatedList: Aduan[],
  accessToken?: string
): Promise<{ success: boolean; message: string }> {
  // 1. Post to Web App URL (instant, non-blocking)
  const webAppUrl = getStoredWebAppUrl();
  if (webAppUrl) {
    try {
      fetch(webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'update_status',
          id: aduanId,
          newStatus,
          keterangan,
          olehWaliKelas,
          timestamp: timestampStr,
          spreadsheetId: getStoredSpreadsheetId()
        })
      }).catch((err) => console.warn('Web App update_status error:', err));
    } catch (e) {
      console.warn('Web App post error:', e);
    }
  }

  // 2. Also trigger background auto-sync for full table and direct OAuth formatting
  triggerBackgroundAutoSync('aduan', { aduanList: fullUpdatedList });

  const token = accessToken || getStoredSheetsToken();
  if (token) {
    try {
      await syncAduanToGoogleSheet(fullUpdatedList, token);
    } catch (e) {
      console.warn('OAuth sync on status update error:', e);
    }
  }

  return {
    success: true,
    message: `Status aduan diperbarui menjadi "${newStatus}" & otomatis tersinkron ke Google Sheets dengan tanda warna.`
  };
}

/**
 * Notify deletion of Aduan to Google Sheets instantly (Web App + Direct Google Sheets API)
 */
export async function notifyDeleteAduanToGoogleSheets(
  deletedAduanList: Aduan[],
  activeAduanList: Aduan[],
  accessToken?: string
): Promise<{ success: boolean; message: string }> {
  let webAppSuccess = false;
  let oAuthSuccess = false;

  // 1. If Web App URL is configured, send deletion event immediately (instant without token required)
  const webAppUrl = getStoredWebAppUrl();
  if (webAppUrl && deletedAduanList.length > 0) {
    try {
      const itemsPayload = deletedAduanList.map((item) => ({
        id: item.id,
        deletedAt: item.deletedAt || new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' }) + ' WIB',
        deletedBy: item.deletedBy || 'Admin'
      }));

      // Send payload with text/plain to ensure standard CORS bypass in Google Apps Script
      await fetch(webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'delete_multiple',
          items: itemsPayload,
          spreadsheetId: getStoredSpreadsheetId()
        })
      });
      webAppSuccess = true;
    } catch (e) {
      console.warn('POST penghapusan ke Apps Script Web App gagal:', e);
    }
  }

  // 2. If OAuth Token is active, run full sync with red block formatting immediately
  const token = accessToken || getStoredSheetsToken();
  if (token) {
    try {
      const syncRes = await syncAduanToGoogleSheet(activeAduanList, token, deletedAduanList);
      oAuthSuccess = syncRes.success;
    } catch (e) {
      console.warn('OAuth sync aduan error:', e);
    }
  }

  // 3. Always dispatch background auto sync to keep all sheets, localStorage and state in perfect parity
  triggerBackgroundAutoSync('aduan', { aduanList: activeAduanList, deletedAduanList });

  if (webAppSuccess || oAuthSuccess) {
    return {
      success: true,
      message: `Data aduan otomatis diperbarui di Google Sheets (Terblok Merah & Tercatat Timestamp).`
    };
  }

  return {
    success: true,
    message: `Data aduan dihapus di sistem lokal.`
  };
}

/**
 * Sync entire Wali Kelas list to 'Data_WaliKelas' sheet including deleted history
 */
export async function syncWaliKelasToGoogleSheet(
  waliKelasList: AccountWaliKelas[],
  accessToken?: string,
  customDeletedList?: AccountWaliKelas[]
): Promise<{ success: boolean; message: string }> {
  const token = accessToken || getStoredSheetsToken();
  if (!token) {
    return { success: false, message: 'Belum terhubung ke Google Sheets.' };
  }

  await ensureSheetTabsExist(token);
  const sheetId = getStoredSpreadsheetId();

  const headers = ['ID', 'Nama Lengkap Wali Kelas', 'Kelas Binaan', 'Username Login', 'Status', 'Riwayat & Keterangan Perubahan'];

  const activeItems = waliKelasList.filter((wk) => !wk.isDeleted);
  const deletedItems = customDeletedList || getStoredDeletedWaliKelas() || [];

  const activeRows = activeItems.map((wk) => {
    const status = wk.isEdited ? 'DIEDIT' : 'AKTIF';
    const history = wk.editHistory
      ? wk.editHistory
      : (wk.isEdited ? `[${wk.editedAt || ''}] DIEDIT oleh ${wk.editedBy || 'Admin'}` : '-');
    return [
      wk.id,
      wk.nama,
      wk.kelasAssigned,
      wk.username,
      status,
      history
    ].map(cleanCellString);
  });

  const deletedRows = deletedItems.map((d) => {
    const history = d.deletedAt
      ? `[${d.deletedAt}] (DIHAPUS) - Dihapus oleh ${d.deletedBy || 'Admin'}${d.editHistory ? '\n' + d.editHistory : ''}`
      : 'DIHAPUS';
    return [
      d.id,
      d.nama,
      d.kelasAssigned,
      d.username,
      'DIHAPUS',
      history
    ].map(cleanCellString);
  });

  const values = [headers, ...activeRows, ...deletedRows];

  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Data_WaliKelas!A1:Z500?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      }
    );

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Gagal memperbarui sheet Data_WaliKelas (${res.status})`);
    }

    await formatSheetRowsWithDeletions(token, sheetId, 'Data_WaliKelas', 6, activeItems, deletedRows.length);

    return {
      success: true,
      message: `Berhasil sinkron ${activeRows.length} Wali Kelas aktif & ${deletedRows.length} histori terhapus ke sheet Data_WaliKelas.`
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal sinkron data Wali Kelas.' };
  }
}

/**
 * Sync entire Murid list to 'Data_Murid' sheet including deleted history
 */
export async function syncMuridToGoogleSheet(
  muridList: Siswa[],
  accessToken?: string,
  customDeletedList?: Siswa[]
): Promise<{ success: boolean; message: string }> {
  const token = accessToken || getStoredSheetsToken();
  if (!token) {
    return { success: false, message: 'Belum terhubung ke Google Sheets.' };
  }

  await ensureSheetTabsExist(token);
  const sheetId = getStoredSpreadsheetId();

  const headers = ['ID', 'NIS', 'Nama Lengkap Murid', 'Kelas', 'Status', 'Riwayat & Keterangan Perubahan'];

  const activeItems = muridList.filter((m) => !m.isDeleted);
  const deletedItems = customDeletedList || getStoredDeletedSiswa() || [];

  const activeRows = activeItems.map((m) => {
    const status = m.isEdited ? 'DIEDIT' : 'AKTIF';
    const history = m.editHistory
      ? m.editHistory
      : (m.isEdited ? `[${m.editedAt || ''}] DIEDIT oleh ${m.editedBy || 'Admin'}` : '-');
    return [
      m.id,
      m.nis || '-',
      m.nama,
      m.kelas,
      status,
      history
    ].map(cleanCellString);
  });

  const deletedRows = deletedItems.map((d) => {
    const history = d.deletedAt
      ? `[${d.deletedAt}] (DIHAPUS) - Dihapus oleh ${d.deletedBy || 'Admin'}${d.editHistory ? '\n' + d.editHistory : ''}`
      : 'DIHAPUS';
    return [
      d.id,
      d.nis || '-',
      d.nama,
      d.kelas,
      'DIHAPUS',
      history
    ].map(cleanCellString);
  });

  const values = [headers, ...activeRows, ...deletedRows];

  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Data_Murid!A1:Z2000?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      }
    );

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Gagal memperbarui sheet Data_Murid (${res.status})`);
    }

    await formatSheetRowsWithDeletions(token, sheetId, 'Data_Murid', 6, activeItems, deletedRows.length);

    return {
      success: true,
      message: `Berhasil sinkron ${activeRows.length} data Murid aktif & ${deletedRows.length} histori terhapus ke sheet Data_Murid.`
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal sinkron data Murid.' };
  }
}

/**
 * Sync entire Guru list to 'Data_Guru' sheet including deleted history
 */
export async function syncGuruToGoogleSheet(
  guruList: Guru[],
  accessToken?: string,
  customDeletedList?: Guru[]
): Promise<{ success: boolean; message: string }> {
  const token = accessToken || getStoredSheetsToken();
  if (!token) {
    return { success: false, message: 'Belum terhubung ke Google Sheets.' };
  }

  await ensureSheetTabsExist(token);
  const sheetId = getStoredSpreadsheetId();

  const headers = ['ID', 'Nama Lengkap Guru', 'NIP', 'Mata Pelajaran Utama', 'Status', 'Riwayat & Keterangan Perubahan'];

  const activeItems = guruList.filter((g) => !g.isDeleted);
  const deletedItems = customDeletedList || getStoredDeletedGuru() || [];

  const activeRows = activeItems.map((g) => {
    const status = g.isEdited ? 'DIEDIT' : 'AKTIF';
    const history = g.editHistory
      ? g.editHistory
      : (g.isEdited ? `[${g.editedAt || ''}] DIEDIT oleh ${g.editedBy || 'Admin'}` : '-');
    return [
      g.id,
      g.nama,
      g.nip || '-',
      g.mapelUtama || '-',
      status,
      history
    ].map(cleanCellString);
  });

  const deletedRows = deletedItems.map((d) => {
    const history = d.deletedAt
      ? `[${d.deletedAt}] (DIHAPUS) - Dihapus oleh ${d.deletedBy || 'Admin'}${d.editHistory ? '\n' + d.editHistory : ''}`
      : 'DIHAPUS';
    return [
      d.id,
      d.nama,
      d.nip || '-',
      d.mapelUtama || '-',
      'DIHAPUS',
      history
    ].map(cleanCellString);
  });

  const values = [headers, ...activeRows, ...deletedRows];

  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Data_Guru!A1:Z500?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      }
    );

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Gagal memperbarui sheet Data_Guru (${res.status})`);
    }

    await formatSheetRowsWithDeletions(token, sheetId, 'Data_Guru', 6, activeItems, deletedRows.length);

    return {
      success: true,
      message: `Berhasil sinkron ${activeRows.length} data Guru aktif & ${deletedRows.length} histori terhapus ke sheet Data_Guru.`
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal sinkron data Guru.' };
  }
}

/**
 * Sync entire Mapel list to 'Data_Mapel' sheet including deleted history
 */
export async function syncMapelToGoogleSheet(
  mapelList: Mapel[],
  accessToken?: string,
  customDeletedList?: Mapel[]
): Promise<{ success: boolean; message: string }> {
  const token = accessToken || getStoredSheetsToken();
  if (!token) {
    return { success: false, message: 'Belum terhubung ke Google Sheets.' };
  }

  await ensureSheetTabsExist(token);
  const sheetId = getStoredSpreadsheetId();

  const headers = ['ID', 'Nama Mata Pelajaran', 'Kode Mapel', 'Status', 'Riwayat & Keterangan Perubahan'];

  const activeItems = mapelList.filter((m) => !m.isDeleted);
  const deletedItems = customDeletedList || getStoredDeletedMapel() || [];

  const activeRows = activeItems.map((m) => {
    const status = m.isEdited ? 'DIEDIT' : 'AKTIF';
    const history = m.editHistory
      ? m.editHistory
      : (m.isEdited ? `[${m.editedAt || ''}] DIEDIT oleh ${m.editedBy || 'Admin'}` : '-');
    return [
      m.id,
      m.nama,
      m.kode || '-',
      status,
      history
    ].map(cleanCellString);
  });

  const deletedRows = deletedItems.map((d) => {
    const history = d.deletedAt
      ? `[${d.deletedAt}] (DIHAPUS) - Dihapus oleh ${d.deletedBy || 'Admin'}${d.editHistory ? '\n' + d.editHistory : ''}`
      : 'DIHAPUS';
    return [
      d.id,
      d.nama,
      d.kode || '-',
      'DIHAPUS',
      history
    ].map(cleanCellString);
  });

  const values = [headers, ...activeRows, ...deletedRows];

  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Data_Mapel!A1:Z500?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      }
    );

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Gagal memperbarui sheet Data_Mapel (${res.status})`);
    }

    await formatSheetRowsWithDeletions(token, sheetId, 'Data_Mapel', 5, activeItems, deletedRows.length);

    return {
      success: true,
      message: `Berhasil sinkron ${activeRows.length} data Mapel aktif & ${deletedRows.length} histori terhapus ke sheet Data_Mapel.`
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal sinkron data Mapel.' };
  }
}

/**
 * Sync entire Kelas list to 'Data_Kelas' sheet including deleted history
 */
export async function syncKelasToGoogleSheet(
  kelasList: Kelas[],
  accessToken?: string,
  customDeletedList?: Kelas[]
): Promise<{ success: boolean; message: string }> {
  const token = accessToken || getStoredSheetsToken();
  if (!token) {
    return { success: false, message: 'Belum terhubung ke Google Sheets.' };
  }

  await ensureSheetTabsExist(token);
  const sheetId = getStoredSpreadsheetId();

  const headers = ['ID', 'Nama Kelas / Rombel', 'Status', 'Riwayat & Keterangan Perubahan'];

  const activeItems = kelasList.filter((k) => !k.isDeleted);
  const deletedItems = customDeletedList || getStoredDeletedKelas() || [];

  const activeRows = activeItems.map((k) => {
    const status = k.isEdited ? 'DIEDIT' : 'AKTIF';
    const history = k.editHistory
      ? k.editHistory
      : (k.isEdited ? `[${k.editedAt || ''}] DIEDIT oleh ${k.editedBy || 'Admin'}` : '-');
    return [
      k.id,
      k.nama,
      status,
      history
    ].map(cleanCellString);
  });

  const deletedRows = deletedItems.map((d) => {
    const history = d.deletedAt
      ? `[${d.deletedAt}] (DIHAPUS) - Dihapus oleh ${d.deletedBy || 'Admin'}${d.editHistory ? '\n' + d.editHistory : ''}`
      : 'DIHAPUS';
    return [
      d.id,
      d.nama,
      'DIHAPUS',
      history
    ].map(cleanCellString);
  });

  const values = [headers, ...activeRows, ...deletedRows];

  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Data_Kelas!A1:Z500?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      }
    );

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Gagal memperbarui sheet Data_Kelas (${res.status})`);
    }

    await formatSheetRowsWithDeletions(token, sheetId, 'Data_Kelas', 4, activeItems, deletedRows.length);

    return {
      success: true,
      message: `Berhasil sinkron ${activeRows.length} data Kelas aktif & ${deletedRows.length} histori terhapus ke sheet Data_Kelas.`
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal sinkron data Kelas.' };
  }
}

/**
 * Perform complete sync for all master & transaction sheets:
 * Aduan, Data_WaliKelas, Data_Murid, Data_Guru, Data_Mapel, and Data_Kelas
 */
export async function syncAllToGoogleSheets(
  aduanList: Aduan[],
  waliKelasList: AccountWaliKelas[],
  muridList: Siswa[],
  guruList?: Guru[],
  mapelList?: Mapel[],
  kelasList?: Kelas[],
  accessToken?: string
): Promise<{ success: boolean; message: string; details?: string[] }> {
  const token = accessToken || getStoredSheetsToken();
  if (!token) {
    return { success: false, message: 'Belum terhubung ke Google Sheets.' };
  }

  const effectiveGuru = guruList || getStoredGuru();
  const effectiveMapel = mapelList || getStoredMapel();
  const effectiveKelas = kelasList || getStoredKelas();

  const resAduan = await syncAduanToGoogleSheet(aduanList, token);
  const resWK = await syncWaliKelasToGoogleSheet(waliKelasList, token);
  const resMurid = await syncMuridToGoogleSheet(muridList, token);
  const resGuru = await syncGuruToGoogleSheet(effectiveGuru, token);
  const resMapel = await syncMapelToGoogleSheet(effectiveMapel, token);
  const resKelas = await syncKelasToGoogleSheet(effectiveKelas, token);

  const details = [
    resAduan.message,
    resWK.message,
    resMurid.message,
    resGuru.message,
    resMapel.message,
    resKelas.message
  ];
  const allSuccess =
    resAduan.success &&
    resWK.success &&
    resMurid.success &&
    resGuru.success &&
    resMapel.success &&
    resKelas.success;

  return {
    success: allSuccess,
    message: allSuccess
      ? 'Semua data (Aduan, Data_WaliKelas, Data_Murid, Data_Guru, Data_Mapel, Data_Kelas) berhasil disinkronkan ke Google Sheets!'
      : 'Beberapa sheet gagal diperbarui.',
    details
  };
}

/**
 * Append single new Aduan row to 'Aduan' sheet
 */
export async function appendSingleAduanToSheet(
  aduan: Aduan,
  accessToken?: string
): Promise<{ success: boolean; message: string }> {
  // 1. Try sending to Google Apps Script Web App URL first (if configured, works automatically without user login)
  const webAppUrl = getStoredWebAppUrl();
  const photosList = aduan.fotoBuktiList && aduan.fotoBuktiList.length > 0
    ? aduan.fotoBuktiList
    : (aduan.fotoBukti && aduan.fotoBukti !== '-' ? aduan.fotoBukti.split(/\r?\n/).map(s => s.trim()).filter(Boolean) : []);

  if (webAppUrl) {
    try {
      const payload = {
        id: aduan.id,
        timestampAduan: aduan.timestampAduan,
        namaGuru: aduan.namaGuru,
        mapel: aduan.mapel,
        kelas: aduan.kelas,
        siswaList: aduan.siswaList,
        jenisKesalahan: aduan.jenisKesalahan,
        keteranganLainnya: aduan.keteranganLainnya || '',
        fotoBukti: photosList.join('\n') || '',
        fotoBuktiList: photosList,
        catatanKronologi: aduan.catatanKronologi || '-',
        status: aduan.status || 'Belum Ditindak Lanjuti',
        spreadsheetId: getStoredSpreadsheetId(),
        driveFolderId: getStoredDriveFolderId()
      };

      await fetch(webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      return {
        success: true,
        message: 'Aduan berhasil dikirim & otomatis ter-rekap ke Google Sheets / Drive via Web App!'
      };
    } catch (e) {
      console.warn('POST ke Apps Script Web App gagal, mencoba OAuth Token API...', e);
    }
  }

  // 2. Fallback to Direct Google OAuth Token API
  const token = accessToken || getStoredSheetsToken();
  if (!token) {
    return {
      success: false,
      message: 'Aduan tersimpan di sistem lokal. Hubungkan Google Sheets / Apps Script Web App di menu Admin untuk sinkronisasi otomatis.'
    };
  }

  await ensureSheetTabsExist(token);
  const sheetId = getStoredSpreadsheetId();

  let fotoLink = '-';
  if (photosList.length > 0) {
    try {
      const uploadedUrls = await uploadPhotosToGoogleDrive(photosList, aduan.id, token);
      if (uploadedUrls.length > 0) {
        fotoLink = uploadedUrls.join('\n');
        aduan.fotoBukti = fotoLink;
        aduan.fotoBuktiList = uploadedUrls;
      } else {
        fotoLink = getDriveFolderUrl();
      }
    } catch {
      fotoLink = getDriveFolderUrl();
    }
  }

  const row = [
    aduan.id,
    aduan.timestampAduan,
    aduan.namaGuru,
    aduan.mapel,
    aduan.kelas,
    aduan.siswaList.join(', '),
    aduan.jenisKesalahan + (aduan.keteranganLainnya ? ` (${aduan.keteranganLainnya})` : ''),
    fotoLink,
    aduan.catatanKronologi || '-',
    aduan.status,
    '-'
  ].map(cleanCellString);

  try {
    let res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Aduan!A:K:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values: [row] })
      }
    );

    if (!res.ok && res.status === 400) {
      console.warn('Append to tab Aduan failed (HTTP 400), trying default range A:K...');
      res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:K:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ values: [row] })
        }
      );
    }

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        clearSheetsToken();
      }
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error?.message || `Google Sheets append failed (${res.status})`);
    }

    return { success: true, message: 'Aduan berhasil dikirim & otomatis masuk ke Google Sheets!' };
  } catch (err: any) {
    console.error('appendSingleAduanToSheet error:', err);
    return { success: false, message: err.message || 'Gagal append aduan ke Google Sheets.' };
  }
}

const LAST_AUTOSYNC_KEY = 'sawal_last_autosync_time';

export function getStoredLastAutoSync(): string | null {
  return localStorage.getItem(LAST_AUTOSYNC_KEY);
}

export function saveStoredLastAutoSync(timestamp: string) {
  localStorage.setItem(LAST_AUTOSYNC_KEY, timestamp);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('sawal_autosync_event', {
        detail: { timestamp, status: 'synced' }
      })
    );
  }
}

export interface CloudFetchResult {
  success: boolean;
  source: 'webapp' | 'gviz' | 'none';
  message: string;
  data?: {
    aduanList?: Aduan[];
    deletedAduanList?: Aduan[];
    guruList?: Guru[];
    deletedGuruList?: Guru[];
    mapelList?: Mapel[];
    deletedMapelList?: Mapel[];
    kelasList?: Kelas[];
    deletedKelasList?: Kelas[];
    siswaList?: Siswa[];
    deletedSiswaList?: Siswa[];
    waliKelasList?: AccountWaliKelas[];
    deletedWaliKelasList?: AccountWaliKelas[];
  };
}

/**
 * Fetch latest real-time database from Google Cloud (Apps Script Web App or Google Sheets GViz)
 */
export async function fetchCloudData(): Promise<CloudFetchResult> {
  const webAppUrl = getStoredWebAppUrl();
  const spreadsheetId = getStoredSpreadsheetId();

  // 1. Try Google Apps Script Web App (Fastest & most complete, returns all tables)
  if (webAppUrl) {
    try {
      const res = await fetch(webAppUrl, { method: 'GET' });
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'online' || json.murid || json.guru || json.aduan) {
          const parsedData: CloudFetchResult['data'] = {};

          // Murid
          if (Array.isArray(json.murid) && json.murid.length > 0) {
            const activeSiswa: Siswa[] = [];
            const deletedSiswa: Siswa[] = [];
            json.murid.forEach((row: any, idx: number) => {
              const id = String(row['ID'] || `murid_${idx + 1}`).trim();
              const nama = String(row['Nama Lengkap Murid'] || row['Nama Murid'] || row['Nama Siswa'] || '').trim();
              const nis = String(row['NIS'] || '').trim();
              const kelas = String(row['Kelas'] || '').trim();
              const status = String(row['Status'] || 'AKTIF').trim();
              const history = String(row['Riwayat & Keterangan Perubahan'] || '-').trim();

              if (!nama) return;

              const isDeleted = status.toUpperCase().includes('HAPUS');
              const isEdited = status.toUpperCase().includes('EDIT');

              const item: Siswa = {
                id,
                nama,
                nis,
                kelas,
                isEdited,
                isDeleted,
                editHistory: history !== '-' ? history : undefined
              };

              if (isDeleted) {
                deletedSiswa.push(item);
              } else {
                activeSiswa.push(item);
              }
            });

            if (activeSiswa.length > 0 || deletedSiswa.length > 0) {
              parsedData.siswaList = activeSiswa;
              parsedData.deletedSiswaList = deletedSiswa;
            }
          }

          // Guru
          if (Array.isArray(json.guru) && json.guru.length > 0) {
            const activeGuru: Guru[] = [];
            const deletedGuru: Guru[] = [];
            json.guru.forEach((row: any, idx: number) => {
              const id = String(row['ID'] || `guru_${idx + 1}`).trim();
              const nama = String(row['Nama Lengkap Guru'] || row['Nama Guru'] || '').trim();
              const nip = String(row['NIP'] || '-').trim();
              const mapelUtama = String(row['Mata Pelajaran Utama'] || row['Mapel'] || '-').trim();
              const status = String(row['Status'] || 'AKTIF').trim();
              const history = String(row['Riwayat & Keterangan Perubahan'] || '-').trim();

              if (!nama) return;
              const isDeleted = status.toUpperCase().includes('HAPUS');
              const isEdited = status.toUpperCase().includes('EDIT');

              const item: Guru = {
                id,
                nama,
                nip,
                mapelUtama,
                isEdited,
                isDeleted,
                editHistory: history !== '-' ? history : undefined
              };
              if (isDeleted) deletedGuru.push(item);
              else activeGuru.push(item);
            });
            if (activeGuru.length > 0 || deletedGuru.length > 0) {
              parsedData.guruList = activeGuru;
              parsedData.deletedGuruList = deletedGuru;
            }
          }

          // Mapel
          if (Array.isArray(json.mapel) && json.mapel.length > 0) {
            const activeMapel: Mapel[] = [];
            const deletedMapel: Mapel[] = [];
            json.mapel.forEach((row: any, idx: number) => {
              const id = String(row['ID'] || `mapel_${idx + 1}`).trim();
              const nama = String(row['Nama Mata Pelajaran'] || row['Mata Pelajaran'] || '').trim();
              const kode = String(row['Kode Mapel'] || '-').trim();
              const status = String(row['Status'] || 'AKTIF').trim();
              const history = String(row['Riwayat & Keterangan Perubahan'] || '-').trim();

              if (!nama) return;
              const isDeleted = status.toUpperCase().includes('HAPUS');
              const isEdited = status.toUpperCase().includes('EDIT');

              const item: Mapel = {
                id,
                nama,
                kode,
                isEdited,
                isDeleted,
                editHistory: history !== '-' ? history : undefined
              };
              if (isDeleted) deletedMapel.push(item);
              else activeMapel.push(item);
            });
            if (activeMapel.length > 0 || deletedMapel.length > 0) {
              parsedData.mapelList = activeMapel;
              parsedData.deletedMapelList = deletedMapel;
            }
          }

          // Kelas
          if (Array.isArray(json.kelas) && json.kelas.length > 0) {
            const activeKelas: Kelas[] = [];
            const deletedKelas: Kelas[] = [];
            json.kelas.forEach((row: any, idx: number) => {
              const id = String(row['ID'] || `kelas_${idx + 1}`).trim();
              const nama = String(row['Nama Kelas / Rombel'] || row['Kelas'] || '').trim();
              const status = String(row['Status'] || 'AKTIF').trim();
              const history = String(row['Riwayat & Keterangan Perubahan'] || '-').trim();

              if (!nama) return;
              const isDeleted = status.toUpperCase().includes('HAPUS');
              const isEdited = status.toUpperCase().includes('EDIT');

              const item: Kelas = {
                id,
                nama,
                isEdited,
                isDeleted,
                editHistory: history !== '-' ? history : undefined
              };
              if (isDeleted) deletedKelas.push(item);
              else activeKelas.push(item);
            });
            if (activeKelas.length > 0 || deletedKelas.length > 0) {
              parsedData.kelasList = activeKelas;
              parsedData.deletedKelasList = deletedKelas;
            }
          }

          // Wali Kelas
          if (Array.isArray(json.waliKelas) && json.waliKelas.length > 0) {
            const activeWK: AccountWaliKelas[] = [];
            const deletedWK: AccountWaliKelas[] = [];
            json.waliKelas.forEach((row: any, idx: number) => {
              const id = String(row['ID'] || `wk_${idx + 1}`).trim();
              const nama = String(row['Nama Lengkap Wali Kelas'] || row['Nama Wali Kelas'] || '').trim();
              const kelasAssigned = String(row['Kelas Binaan'] || row['Kelas'] || '').trim();
              const username = String(row['Username Login'] || row['Username'] || '').trim();
              const status = String(row['Status'] || 'AKTIF').trim();
              const history = String(row['Riwayat & Keterangan Perubahan'] || '-').trim();

              if (!username) return;
              const isDeleted = status.toUpperCase().includes('HAPUS');
              const isEdited = status.toUpperCase().includes('EDIT');

              const item: AccountWaliKelas = {
                id,
                nama,
                kelasAssigned,
                username,
                password: String(row['Password'] || 'walikelas123'),
                isEdited,
                isDeleted,
                editHistory: history !== '-' ? history : undefined
              };
              if (isDeleted) deletedWK.push(item);
              else activeWK.push(item);
            });
            if (activeWK.length > 0 || deletedWK.length > 0) {
              parsedData.waliKelasList = activeWK;
              parsedData.deletedWaliKelasList = deletedWK;
            }
          }

          // Aduan
          if (Array.isArray(json.aduan) && json.aduan.length > 0) {
            const activeAduan: Aduan[] = [];
            const deletedAduan: Aduan[] = [];
            json.aduan.forEach((row: any, idx: number) => {
              const id = String(row['ID Aduan'] || row['ID'] || `aduan_${idx + 1}`).trim();
              const timestampAduan = String(row['Tanggal & Waktu Aduan'] || row['Tanggal'] || '').trim();
              const namaGuru = String(row['Nama Guru Pelapor'] || row['Nama Guru'] || '').trim();
              const mapel = String(row['Mata Pelajaran'] || '').trim();
              const kelas = String(row['Kelas'] || '').trim();
              const muridRaw = String(row['Murid Melanggar'] || row['Nama Siswa'] || row['Nama Murid'] || '').trim();
              const jenisKesalahan = String(row['Jenis Kesalahan'] || '').trim();
              const fotoBukti = String(row['Bukti Foto / Link Drive'] || row['Foto'] || '-').trim();
              const catatanKronologi = String(row['Catatan / Kronologi'] || '-').trim();
              const status = (row['Status Terbaru'] || row['Status'] || 'Belum Ditindak Lanjuti') as StatusAduan;
              const riwayatRaw = String(row['Riwayat Tindak Lanjut'] || '-').trim();

              if (!id) return;
              const isDeleted = status === ('DIHAPUS' as any);

              const siswaList = muridRaw ? muridRaw.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
              const fotoBuktiList = fotoBukti && fotoBukti !== '-' ? fotoBukti.split('\n').map((f: string) => f.trim()).filter(Boolean) : [];

              const item: Aduan = {
                id,
                timestampAduan,
                createdAtISO: String(row['CreatedAtISO'] || new Date().toISOString()),
                namaGuru,
                mapel,
                kelas,
                siswaList,
                jenisKesalahan,
                fotoBukti,
                fotoBuktiList,
                catatanKronologi,
                status: isDeleted ? 'Belum Ditindak Lanjuti' : status,
                isDeleted
              };

              if (isDeleted) deletedAduan.push(item);
              else activeAduan.push(item);
            });
            if (activeAduan.length > 0 || deletedAduan.length > 0) {
              parsedData.aduanList = activeAduan;
              parsedData.deletedAduanList = deletedAduan;
            }
          }

          return {
            success: true,
            source: 'webapp',
            message: 'Berhasil memuat data real-time dari Google Sheets Web App.',
            data: parsedData
          };
        }
      }
    } catch (e) {
      console.warn('Gagal fetch data dari Web App:', e);
    }
  }

  // 2. Fallback: Try Public GViz query for ALL tabs if spreadsheet is shared publicly
  try {
    const fetchTabViaGviz = async (tabName: string) => {
      try {
        const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(tabName)}`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const text = await res.text();
        const match = text.match(/google\.visualization\.Query\.setResponse\((.*)\);/);
        if (match && match[1]) {
          return JSON.parse(match[1]);
        }
      } catch {
        return null;
      }
      return null;
    };

    const [gvizMurid, gvizGuru, gvizMapel, gvizKelas, gvizWaliKelas, gvizAduan] = await Promise.all([
      fetchTabViaGviz('Data_Murid'),
      fetchTabViaGviz('Data_Guru'),
      fetchTabViaGviz('Data_Mapel'),
      fetchTabViaGviz('Data_Kelas'),
      fetchTabViaGviz('Data_WaliKelas'),
      fetchTabViaGviz('Aduan')
    ]);

    const parsedData: CloudFetchResult['data'] = {};
    let hasAnyData = false;

    // Parse Data_Murid from GViz
    if (gvizMurid?.table?.rows && Array.isArray(gvizMurid.table.rows)) {
      const activeSiswa: Siswa[] = [];
      const deletedSiswa: Siswa[] = [];
      gvizMurid.table.rows.forEach((r: any, idx: number) => {
        const c = r.c || [];
        const id = c[0]?.v ? String(c[0].v).trim() : `murid_${idx + 1}`;
        const nis = c[1]?.v ? String(c[1].v).trim() : '';
        const nama = c[2]?.v ? String(c[2].v).trim() : '';
        const kelas = c[3]?.v ? String(c[3].v).trim() : '';
        const status = c[4]?.v ? String(c[4].v).trim() : 'AKTIF';
        const history = c[5]?.v ? String(c[5].v).trim() : '-';

        if (!nama) return;
        const isDeleted = status.toUpperCase().includes('HAPUS');
        const isEdited = status.toUpperCase().includes('EDIT');

        const item: Siswa = {
          id,
          nama,
          nis,
          kelas,
          isEdited,
          isDeleted,
          editHistory: history !== '-' ? history : undefined
        };
        if (isDeleted) deletedSiswa.push(item);
        else activeSiswa.push(item);
      });
      if (activeSiswa.length > 0 || deletedSiswa.length > 0) {
        parsedData.siswaList = activeSiswa;
        parsedData.deletedSiswaList = deletedSiswa;
        hasAnyData = true;
      }
    }

    // Parse Data_Guru from GViz
    if (gvizGuru?.table?.rows && Array.isArray(gvizGuru.table.rows)) {
      const activeGuru: Guru[] = [];
      const deletedGuru: Guru[] = [];
      gvizGuru.table.rows.forEach((r: any, idx: number) => {
        const c = r.c || [];
        const id = c[0]?.v ? String(c[0].v).trim() : `guru_${idx + 1}`;
        const nama = c[1]?.v ? String(c[1].v).trim() : '';
        const nip = c[2]?.v ? String(c[2].v).trim() : '-';
        const mapelUtama = c[3]?.v ? String(c[3].v).trim() : '-';
        const status = c[4]?.v ? String(c[4].v).trim() : 'AKTIF';
        const history = c[5]?.v ? String(c[5].v).trim() : '-';

        if (!nama) return;
        const isDeleted = status.toUpperCase().includes('HAPUS');
        const isEdited = status.toUpperCase().includes('EDIT');

        const item: Guru = {
          id,
          nama,
          nip,
          mapelUtama,
          isEdited,
          isDeleted,
          editHistory: history !== '-' ? history : undefined
        };
        if (isDeleted) deletedGuru.push(item);
        else activeGuru.push(item);
      });
      if (activeGuru.length > 0 || deletedGuru.length > 0) {
        parsedData.guruList = activeGuru;
        parsedData.deletedGuruList = deletedGuru;
        hasAnyData = true;
      }
    }

    // Parse Data_Mapel from GViz
    if (gvizMapel?.table?.rows && Array.isArray(gvizMapel.table.rows)) {
      const activeMapel: Mapel[] = [];
      const deletedMapel: Mapel[] = [];
      gvizMapel.table.rows.forEach((r: any, idx: number) => {
        const c = r.c || [];
        const id = c[0]?.v ? String(c[0].v).trim() : `mapel_${idx + 1}`;
        const nama = c[1]?.v ? String(c[1].v).trim() : '';
        const kode = c[2]?.v ? String(c[2].v).trim() : '-';
        const status = c[3]?.v ? String(c[3].v).trim() : 'AKTIF';
        const history = c[4]?.v ? String(c[4].v).trim() : '-';

        if (!nama) return;
        const isDeleted = status.toUpperCase().includes('HAPUS');
        const isEdited = status.toUpperCase().includes('EDIT');

        const item: Mapel = {
          id,
          nama,
          kode,
          isEdited,
          isDeleted,
          editHistory: history !== '-' ? history : undefined
        };
        if (isDeleted) deletedMapel.push(item);
        else activeMapel.push(item);
      });
      if (activeMapel.length > 0 || deletedMapel.length > 0) {
        parsedData.mapelList = activeMapel;
        parsedData.deletedMapelList = deletedMapel;
        hasAnyData = true;
      }
    }

    // Parse Data_Kelas from GViz
    if (gvizKelas?.table?.rows && Array.isArray(gvizKelas.table.rows)) {
      const activeKelas: Kelas[] = [];
      const deletedKelas: Kelas[] = [];
      gvizKelas.table.rows.forEach((r: any, idx: number) => {
        const c = r.c || [];
        const id = c[0]?.v ? String(c[0].v).trim() : `kelas_${idx + 1}`;
        const nama = c[1]?.v ? String(c[1].v).trim() : '';
        const status = c[2]?.v ? String(c[2].v).trim() : 'AKTIF';
        const history = c[3]?.v ? String(c[3].v).trim() : '-';

        if (!nama) return;
        const isDeleted = status.toUpperCase().includes('HAPUS');
        const isEdited = status.toUpperCase().includes('EDIT');

        const item: Kelas = {
          id,
          nama,
          isEdited,
          isDeleted,
          editHistory: history !== '-' ? history : undefined
        };
        if (isDeleted) deletedKelas.push(item);
        else activeKelas.push(item);
      });
      if (activeKelas.length > 0 || deletedKelas.length > 0) {
        parsedData.kelasList = activeKelas;
        parsedData.deletedKelasList = deletedKelas;
        hasAnyData = true;
      }
    }

    // Parse Data_WaliKelas from GViz
    if (gvizWaliKelas?.table?.rows && Array.isArray(gvizWaliKelas.table.rows)) {
      const activeWK: AccountWaliKelas[] = [];
      const deletedWK: AccountWaliKelas[] = [];
      gvizWaliKelas.table.rows.forEach((r: any, idx: number) => {
        const c = r.c || [];
        const id = c[0]?.v ? String(c[0].v).trim() : `wk_${idx + 1}`;
        const nama = c[1]?.v ? String(c[1].v).trim() : '';
        const kelasAssigned = c[2]?.v ? String(c[2].v).trim() : '';
        const username = c[3]?.v ? String(c[3].v).trim() : '';
        const password = c[4]?.v ? String(c[4].v).trim() : 'walikelas123';
        const status = c[5]?.v ? String(c[5].v).trim() : 'AKTIF';
        const history = c[6]?.v ? String(c[6].v).trim() : '-';

        if (!username) return;
        const isDeleted = status.toUpperCase().includes('HAPUS');
        const isEdited = status.toUpperCase().includes('EDIT');

        const item: AccountWaliKelas = {
          id,
          nama,
          kelasAssigned,
          username,
          password,
          isEdited,
          isDeleted,
          editHistory: history !== '-' ? history : undefined
        };
        if (isDeleted) deletedWK.push(item);
        else activeWK.push(item);
      });
      if (activeWK.length > 0 || deletedWK.length > 0) {
        parsedData.waliKelasList = activeWK;
        parsedData.deletedWaliKelasList = deletedWK;
        hasAnyData = true;
      }
    }

    // Parse Aduan from GViz
    if (gvizAduan?.table?.rows && Array.isArray(gvizAduan.table.rows)) {
      const activeAduan: Aduan[] = [];
      const deletedAduan: Aduan[] = [];
      gvizAduan.table.rows.forEach((r: any, idx: number) => {
        const c = r.c || [];
        const id = c[0]?.v ? String(c[0].v).trim() : `aduan_${idx + 1}`;
        const timestampAduan = c[1]?.v ? String(c[1].v).trim() : '';
        const namaGuru = c[2]?.v ? String(c[2].v).trim() : '';
        const mapel = c[3]?.v ? String(c[3].v).trim() : '';
        const kelas = c[4]?.v ? String(c[4].v).trim() : '';
        const muridRaw = c[5]?.v ? String(c[5].v).trim() : '';
        const jenisKesalahan = c[6]?.v ? String(c[6].v).trim() : '';
        const fotoBukti = c[7]?.v ? String(c[7].v).trim() : '-';
        const catatanKronologi = c[8]?.v ? String(c[8].v).trim() : '-';
        const status = (c[9]?.v ? String(c[9].v).trim() : 'Belum Ditindak Lanjuti') as StatusAduan;

        if (!id) return;
        const isDeleted = status === ('DIHAPUS' as any);
        const siswaList = muridRaw ? muridRaw.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
        const fotoBuktiList = fotoBukti && fotoBukti !== '-' ? fotoBukti.split('\n').map((f: string) => f.trim()).filter(Boolean) : [];

        const item: Aduan = {
          id,
          timestampAduan,
          createdAtISO: new Date().toISOString(),
          namaGuru,
          mapel,
          kelas,
          siswaList,
          jenisKesalahan,
          fotoBukti,
          fotoBuktiList,
          catatanKronologi,
          status: isDeleted ? 'Belum Ditindak Lanjuti' : status,
          isDeleted
        };

        if (isDeleted) deletedAduan.push(item);
        else activeAduan.push(item);
      });
      if (activeAduan.length > 0 || deletedAduan.length > 0) {
        parsedData.aduanList = activeAduan;
        parsedData.deletedAduanList = deletedAduan;
        hasAnyData = true;
      }
    }

    if (hasAnyData) {
      return {
        success: true,
        source: 'gviz',
        message: 'Berhasil memuat data terkini dari Google Sheets GViz.',
        data: parsedData
      };
    }
  } catch (errGViz) {
    console.warn('GViz multi-tab fetch fallback error:', errGViz);
  }

  return {
    success: false,
    source: 'none',
    message: 'Belum ada Web App URL atau Google Spreadsheet belum dibagikan publik.'
  };
}

/**
 * Force push all current local database into Google Sheets & Drive
 */
export async function pushAllLocalDataToCloud(): Promise<{ success: boolean; message: string }> {
  const customData = {
    aduanList: getStoredAduan(),
    deletedAduanList: getStoredDeletedAduan(),
    guruList: getStoredGuru(),
    deletedGuruList: getStoredDeletedGuru(),
    mapelList: getStoredMapel(),
    deletedMapelList: getStoredDeletedMapel(),
    kelasList: getStoredKelas(),
    deletedKelasList: getStoredDeletedKelas(),
    siswaList: getStoredSiswa(),
    deletedSiswaList: getStoredDeletedSiswa(),
    waliKelasList: getStoredWaliKelas(),
    deletedWaliKelasList: getStoredDeletedWaliKelas()
  };

  return await triggerBackgroundAutoSync('all', customData);
}

/**
 * Trigger background automatic synchronization for changes (add, delete, restore, edit, import)
 * Works silently via Google Apps Script Web App and/or Google Sheets OAuth API.
 */
export async function triggerBackgroundAutoSync(
  category: 'all' | 'aduan' | 'guru' | 'mapel' | 'kelas' | 'murid' | 'walikelas' = 'all',
  customData?: {
    aduanList?: Aduan[];
    deletedAduanList?: Aduan[];
    guruList?: Guru[];
    deletedGuruList?: Guru[];
    mapelList?: Mapel[];
    deletedMapelList?: Mapel[];
    kelasList?: Kelas[];
    deletedKelasList?: Kelas[];
    siswaList?: Siswa[];
    deletedSiswaList?: Siswa[];
    waliKelasList?: AccountWaliKelas[];
    deletedWaliKelasList?: AccountWaliKelas[];
  }
): Promise<{ success: boolean; message: string }> {
  const token = getStoredSheetsToken();
  const webAppUrl = getStoredWebAppUrl();
  const spreadsheetId = getStoredSpreadsheetId();

  // If neither Web App URL nor Token is configured, we keep data safely local
  if (!token && !webAppUrl) {
    return {
      success: false,
      message: 'Perubahan tersimpan lokal. Masukkan Web App URL atau Token untuk auto-sinkron ke Google Sheets.'
    };
  }

  const now = new Date();
  const formattedTime =
    now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) +
    ', ' +
    now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
    ' WIB';

  // 1. Try sending via Apps Script Web App in background (non-blocking, works for all users)
  if (webAppUrl) {
    try {
      const payload: any = {
        action: 'sync_all',
        spreadsheetId,
        driveFolderId: getStoredDriveFolderId(),
        timestamp: formattedTime,
        category,
        aduanList: customData?.aduanList || getStoredAduan(),
        deletedAduanList: customData?.deletedAduanList || getStoredDeletedAduan(),
        guruList: customData?.guruList || getStoredGuru(),
        deletedGuruList: customData?.deletedGuruList || getStoredDeletedGuru(),
        mapelList: customData?.mapelList || getStoredMapel(),
        deletedMapelList: customData?.deletedMapelList || getStoredDeletedMapel(),
        kelasList: customData?.kelasList || getStoredKelas(),
        deletedKelasList: customData?.deletedKelasList || getStoredDeletedKelas(),
        siswaList: customData?.siswaList || getStoredSiswa(),
        deletedSiswaList: customData?.deletedSiswaList || getStoredDeletedSiswa(),
        waliKelasList: customData?.waliKelasList || getStoredWaliKelas(),
        deletedWaliKelasList: customData?.deletedWaliKelasList || getStoredDeletedWaliKelas()
      };

      fetch(webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      }).catch((err) => console.warn('Background Web App auto-sync warning:', err));
    } catch (e) {
      console.warn('Apps Script background auto-sync error:', e);
    }
  }

  // 2. If OAuth Token is active, run direct Google Sheets API sync
  if (token) {
    try {
      if (category === 'all') {
        const ad = customData?.aduanList || getStoredAduan();
        const wk = customData?.waliKelasList || getStoredWaliKelas();
        const mr = customData?.siswaList || getStoredSiswa();
        const gr = customData?.guruList || getStoredGuru();
        const mp = customData?.mapelList || getStoredMapel();
        const kl = customData?.kelasList || getStoredKelas();
        await syncAllToGoogleSheets(ad, wk, mr, gr, mp, kl, token);
      } else if (category === 'aduan') {
        await syncAduanToGoogleSheet(customData?.aduanList || getStoredAduan(), token, customData?.deletedAduanList);
      } else if (category === 'guru') {
        await syncGuruToGoogleSheet(customData?.guruList || getStoredGuru(), token, customData?.deletedGuruList);
      } else if (category === 'mapel') {
        await syncMapelToGoogleSheet(customData?.mapelList || getStoredMapel(), token, customData?.deletedMapelList);
      } else if (category === 'kelas') {
        await syncKelasToGoogleSheet(customData?.kelasList || getStoredKelas(), token, customData?.deletedKelasList);
      } else if (category === 'murid') {
        await syncMuridToGoogleSheet(customData?.siswaList || getStoredSiswa(), token, customData?.deletedSiswaList);
      } else if (category === 'walikelas') {
        await syncWaliKelasToGoogleSheet(customData?.waliKelasList || getStoredWaliKelas(), token, customData?.deletedWaliKelasList);
      }
    } catch (err) {
      console.warn('OAuth direct auto-sync error:', err);
    }
  }

  saveStoredLastAutoSync(formattedTime);
  return { success: true, message: `Otomatis tersinkron (${formattedTime})` };
}

/**
 * Export data to CSV file download
 */
export function exportDataToCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escapeCsv = (str: any) => {
    if (str === null || str === undefined) return '""';
    const cellStr = String(str).replace(/"/g, '""');
    return `"${cellStr}"`;
  };

  const csvContent = [
    headers.map(escapeCsv).join(','),
    ...rows.map((row) => row.map(escapeCsv).join(','))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
