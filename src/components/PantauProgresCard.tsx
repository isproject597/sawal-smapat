import React, { useState } from 'react';
import { Search, Eye, CheckCircle2, Clock, AlertTriangle, UserCheck, Shield, ChevronRight, X } from 'lucide-react';
import { Aduan, Siswa } from '../types';
import { PhotoGalleryViewer } from './PhotoGalleryViewer';

interface PantauProgresCardProps {
  aduanList: Aduan[];
  siswaList: Siswa[];
}

export const PantauProgresCard: React.FC<PantauProgresCardProps> = ({ aduanList, siswaList }) => {
  const [namaMurid, setNamaMurid] = useState('');
  const [kelas, setKelas] = useState('');
  const [nisMurid, setNisMurid] = useState('');

  const [searchResult, setSearchResult] = useState<Aduan[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaMurid.trim() && !nisMurid.trim()) {
      alert('Silakan masukkan Nama Lengkap Murid atau NIS Murid.');
      return;
    }

    // Filter aduan matching student name or NIS
    const filtered = aduanList.filter((ad) => {
      const matchSiswa = ad.siswaList.some(
        (nama) => nama.toLowerCase().includes(namaMurid.trim().toLowerCase())
      );
      const matchKelas = !kelas.trim() || ad.kelas.toLowerCase().includes(kelas.trim().toLowerCase());

      // If NIS entered, also check if NIS matches student name list
      let matchNis = true;
      if (nisMurid.trim()) {
        const matchingSiswaByNis = siswaList.filter((s) =>
          s.nis.toLowerCase().includes(nisMurid.trim().toLowerCase())
        );
        matchNis = matchingSiswaByNis.some((s) => ad.siswaList.includes(s.nama));
      }

      return matchSiswa && matchKelas && matchNis;
    });

    setSearchResult(filtered);
    setHasSearched(true);
    setIsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Sudah Ditindak Lanjuti':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-full text-[11px] font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Sudah Ditindak Lanjuti
          </span>
        );
      case 'Dalam Proses':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-1 rounded-full text-[11px] font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            Dalam Proses Tindak Lanjut
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-1 rounded-full text-[11px] font-bold">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Belum Ditindak Lanjuti
          </span>
        );
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border-l-4 border-blue-600 p-5 space-y-4">
        <h3 className="text-blue-950 font-bold uppercase text-xs tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
          <Search className="w-4 h-4 text-blue-600" />
          Pantau Progres Aduan Murid
        </h3>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          Masukkan data murid untuk memantau catatan dan status tindak lanjut oleh Wali Kelas.
        </p>

        <form onSubmit={handleSearch} className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Lengkap Murid</label>
            <input
              type="text"
              id="input-pantau-nama"
              placeholder="Contoh: Ahmad Rizky Pratama"
              value={namaMurid}
              onChange={(e) => setNamaMurid(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex gap-2">
            <div className="w-1/3">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Kelas</label>
              <input
                type="text"
                id="input-pantau-kelas"
                placeholder="X MIPA 1"
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:border-blue-500 outline-none"
              />
            </div>

            <div className="w-2/3">
              <label className="text-[10px] font-bold text-slate-500 uppercase">NIS Murid</label>
              <input
                type="text"
                id="input-pantau-nis"
                placeholder="Contoh: 20261001"
                value={nisMurid}
                onChange={(e) => setNisMurid(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            id="btn-lihat-status"
            className="w-full bg-gradient-to-r from-blue-700 to-teal-700 hover:from-blue-600 hover:to-teal-600 text-white font-bold py-2.5 rounded-lg shadow transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95"
          >
            <Eye className="w-4 h-4" />
            <span>LIHAT STATUS TINDAK LANJUT</span>
          </button>
        </form>
      </div>

      {/* Progress Result Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 uppercase flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                  Hasil Pantauan Progres Aduan
                </h3>
                <p className="text-xs text-slate-500">
                  Data pencarian: <span className="font-semibold text-slate-800">{namaMurid || 'Semua'}</span>{' '}
                  {kelas && `(${kelas})`} {nisMurid && `[NIS: ${nisMurid}]`}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-1">
              {searchResult && searchResult.length > 0 ? (
                searchResult.map((ad, idx) => (
                  <div key={`${ad.id}-${idx}`} className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-3">
                    <div className="flex flex-wrap justify-between items-start gap-2 border-b pb-2">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">{ad.id}</span>
                        <h4 className="text-xs font-bold text-teal-900">
                          {ad.jenisKesalahan}{' '}
                          {ad.keteranganLainnya ? `(${ad.keteranganLainnya})` : ''}
                        </h4>
                        <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                          Murid Terkait: <span className="text-slate-900 font-semibold">{ad.siswaList.join(', ')}</span> | Kelas: {ad.kelas}
                        </p>
                      </div>
                      <div>{getStatusBadge(ad.status)}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Guru Pelapor</span>
                        <span className="font-semibold text-slate-800">{ad.namaGuru}</span> ({ad.mapel})
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Waktu Laporan</span>
                        <span className="font-medium text-slate-800">{ad.timestampAduan}</span>
                      </div>
                    </div>

                    {ad.catatanKronologi && (
                      <div className="text-[11px] bg-amber-50/60 border border-amber-200 p-2.5 rounded-lg text-amber-900">
                        <span className="font-bold text-[10px] uppercase block text-amber-800">Catatan Kronologi Kejadian:</span>
                        {ad.catatanKronologi}
                      </div>
                    )}

                    <PhotoGalleryViewer
                      fotoBukti={ad.fotoBukti}
                      fotoBuktiList={ad.fotoBuktiList}
                      title={`Bukti Foto Aduan (${ad.id})`}
                    />

                    {/* Timeline Tindak Lanjut Wali Kelas */}
                    <div className="space-y-2 pt-1">
                      <span className="text-[10px] font-extrabold text-teal-900 uppercase tracking-wider block">
                        Riwayat Tindak Lanjut Wali Kelas:
                      </span>
                      {ad.tindakLanjutHistory && ad.tindakLanjutHistory.length > 0 ? (
                        <div className="space-y-2 pl-2 border-l-2 border-teal-500">
                          {ad.tindakLanjutHistory.map((tl, idx) => (
                            <div key={idx} className="bg-white p-2.5 rounded border border-teal-100 shadow-sm text-xs space-y-1">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-bold text-teal-800">{tl.olehWaliKelas}</span>
                                <span className="text-slate-400 font-mono">{tl.timestamp}</span>
                              </div>
                              <p className="text-slate-700 font-medium">{tl.keterangan}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic bg-white p-2.5 rounded border border-dashed border-slate-200">
                          Belum ada tindakan atau penjelasan dari Wali Kelas.
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 space-y-2 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <Shield className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700 uppercase">Tidak Ada Data Laporan Ditemukan</p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Tidak ada aduan yang terdaftar dengan nama murid "{namaMurid}" di kelas "{kelas}". Pastikan nama dan kelas diisi dengan tepat.
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsModalOpen(false)}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider"
            >
              Tutup Pantauan
            </button>
          </div>
        </div>
      )}
    </>
  );
};
