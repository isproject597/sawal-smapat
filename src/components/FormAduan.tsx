import React, { useState, useEffect } from 'react';
import { Send, FileText, CheckCircle2, Clock, AlertCircle, Users, Check, ChevronDown } from 'lucide-react';
import { Guru, Mapel, Kelas, Siswa, Aduan } from '../types';
import { JENIS_KESALAHAN_OPTIONS } from '../data/mockData';
import { getStoredSheetsToken } from '../services/googleSheets';
import { CameraUploader } from './CameraUploader';

interface FormAduanProps {
  guruList: Guru[];
  mapelList: Mapel[];
  kelasList: Kelas[];
  siswaList: Siswa[];
  onSubmitAduan: (aduan: Omit<Aduan, 'id' | 'createdAtISO' | 'status'>) => void;
}

export const FormAduan: React.FC<FormAduanProps> = ({
  guruList,
  mapelList,
  kelasList,
  siswaList,
  onSubmitAduan
}) => {
  // Form State
  const [namaGuru, setNamaGuru] = useState('');
  const [mapel, setMapel] = useState('');
  const [kelas, setKelas] = useState('');
  const [selectedSiswaList, setSelectedSiswaList] = useState<string[]>([]);
  const [jenisKesalahan, setJenisKesalahan] = useState('');
  const [keteranganLainnya, setKeteranganLainnya] = useState('');
  const [fotoBuktiList, setFotoBuktiList] = useState<string[]>([]);
  const [catatanKronologi, setCatatanKronologi] = useState('');

  // Dropdown student multi-select search state
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  // Real-time Indonesian Clock state
  const [currentTimestamp, setCurrentTimestamp] = useState('');

  // Form submission feedback modal
  const [submittedAduanId, setSubmittedAduanId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Update real-time Indonesian timestamp
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hari = now.toLocaleDateString('id-ID', { weekday: 'long' });
      const tanggal = now.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      const jam = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setCurrentTimestamp(`${hari}, ${tanggal} | ${jam} WITA`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter available students based on selected class
  const filteredSiswa = siswaList.filter((s) => !kelas || s.kelas === kelas);

  // When class changes, filter out students no longer in the list
  const handleKelasChange = (newKelas: string) => {
    setKelas(newKelas);
    setSelectedSiswaList([]);
  };

  // Toggle student selection
  const toggleStudentSelection = (nama: string) => {
    if (selectedSiswaList.includes(nama)) {
      setSelectedSiswaList(selectedSiswaList.filter((item) => item !== nama));
    } else {
      setSelectedSiswaList([...selectedSiswaList, nama]);
    }
  };

  const handleSelectAllSiswa = () => {
    const allNames = filteredSiswa.map((s) => s.nama);
    if (selectedSiswaList.length === allNames.length) {
      setSelectedSiswaList([]);
    } else {
      setSelectedSiswaList(allNames);
    }
  };

  // When Guru changes, optionally pre-fill Mapel if guru has mapelUtama
  const handleGuruChange = (guruNama: string) => {
    setNamaGuru(guruNama);
    const foundGuru = guruList.find((g) => g.nama === guruNama);
    if (foundGuru && foundGuru.mapelUtama) {
      const matchingMapel = mapelList.find((m) => m.nama === foundGuru.mapelUtama);
      if (matchingMapel) {
        setMapel(matchingMapel.nama);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!namaGuru) {
      setFormError('Nama Guru wajib dipilih.');
      return;
    }
    if (!mapel) {
      setFormError('Mata Pelajaran wajib dipilih.');
      return;
    }
    if (!kelas) {
      setFormError('Kelas yang diajar wajib dipilih.');
      return;
    }
    if (selectedSiswaList.length === 0) {
      setFormError('Pilih sekurang-kurangnya 1 (satu) nama murid.');
      return;
    }
    if (!jenisKesalahan) {
      setFormError('Jenis Kesalahan wajib dipilih.');
      return;
    }
    if (jenisKesalahan.startsWith('Lainnya') && !keteranganLainnya.trim()) {
      setFormError('Keterangan khusus untuk opsi "Lainnya" wajib diisi.');
      return;
    }

    // Submit payload
    const fotoBuktiString = fotoBuktiList.length > 0 ? fotoBuktiList.join('\n') : undefined;
    const aduanData = {
      namaGuru,
      mapel,
      kelas,
      siswaList: selectedSiswaList,
      jenisKesalahan,
      keteranganLainnya: keteranganLainnya.trim() || undefined,
      fotoBukti: fotoBuktiString,
      fotoBuktiList: fotoBuktiList.length > 0 ? fotoBuktiList : undefined,
      catatanKronologi: catatanKronologi.trim() || undefined,
      timestampAduan: currentTimestamp
    };

    onSubmitAduan(aduanData);

    // Reset Form
    const generatedCode = `ADUAN-${Date.now().toString().slice(-6)}`;
    setSubmittedAduanId(generatedCode);
    setNamaGuru('');
    setMapel('');
    setKelas('');
    setSelectedSiswaList([]);
    setJenisKesalahan('');
    setKeteranganLainnya('');
    setFotoBuktiList([]);
    setCatatanKronologi('');
  };

  return (
    <section className="bg-white rounded-xl shadow-xl border border-slate-200 flex flex-col overflow-hidden">
      {/* Form Header */}
      <div className="p-4 md:p-5 bg-gradient-to-r from-teal-50 via-cyan-50 to-white border-b border-slate-200 flex flex-wrap justify-between items-center gap-3">
        <h2 className="text-teal-900 font-extrabold flex items-center gap-2 uppercase tracking-wide text-sm md:text-base">
          <FileText className="w-5 h-5 text-teal-600" />
          Form Input Aduan Pelanggaran Murid
        </h2>

        {/* Real-Time Timestamp Display */}
        <div className="flex items-center gap-2 bg-teal-100/90 text-teal-900 px-3 py-1.5 rounded-full border border-teal-300 shadow-sm text-xs font-mono font-bold">
          <Clock className="w-3.5 h-3.5 text-teal-700 animate-spin" style={{ animationDuration: '6s' }} />
          <span>{currentTimestamp || 'Memuat waktu...'}</span>
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
        {formError && (
          <div className="p-3 bg-rose-50 border-l-4 border-rose-500 rounded text-rose-800 text-xs font-semibold flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. Nama Guru */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
              Nama Guru <span className="text-rose-500">*</span>
            </label>
            <select
              id="select-nama-guru"
              value={namaGuru}
              onChange={(e) => handleGuruChange(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-xs md:text-sm text-slate-800 font-medium transition-all"
              required
            >
              <option value="">-- Pilih Nama Guru --</option>
              {guruList.map((g) => (
                <option key={g.id} value={g.nama}>
                  {g.nama} {g.mapelUtama ? `(${g.mapelUtama})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Mapel yang diampu */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
              Mata Pelajaran <span className="text-rose-500">*</span>
            </label>
            <select
              id="select-mapel"
              value={mapel}
              onChange={(e) => setMapel(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-xs md:text-sm text-slate-800 font-medium transition-all"
              required
            >
              <option value="">-- Pilih Mata Pelajaran --</option>
              {mapelList.map((m) => (
                <option key={m.id} value={m.nama}>
                  {m.nama}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Kelas yang diajar */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
              Kelas yang Diajar <span className="text-rose-500">*</span>
            </label>
            <select
              id="select-kelas"
              value={kelas}
              onChange={(e) => handleKelasChange(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-xs md:text-sm text-slate-800 font-medium transition-all"
              required
            >
              <option value="">-- Pilih Kelas --</option>
              {kelasList.map((k) => (
                <option key={k.id} value={k.nama}>
                  {k.nama}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Nama Murid (Multi-Select) */}
          <div className="space-y-1 relative">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
              <span>
                Nama Murid <span className="text-rose-500">*</span> (Dapat memilih &gt; 1)
              </span>
              {selectedSiswaList.length > 0 && (
                <span className="bg-teal-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {selectedSiswaList.length} Dipilih
                </span>
              )}
            </label>

            {/* Custom Multi-select Trigger Box */}
            <div
              onClick={() => setIsStudentDropdownOpen(!isStudentDropdownOpen)}
              id="trigger-select-siswa"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs md:text-sm text-slate-800 cursor-pointer flex items-center justify-between min-h-[42px] hover:border-teal-500 transition-all"
            >
              {selectedSiswaList.length === 0 ? (
                <span className="text-slate-400 font-normal">
                  {kelas ? `Pilih murid dari kelas ${kelas}...` : 'Pilih kelas terlebih dahulu...'}
                </span>
              ) : (
                <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto pr-1">
                  {selectedSiswaList.map((nama) => (
                    <span
                      key={nama}
                      className="bg-teal-700 text-white text-[11px] px-2 py-0.5 rounded flex items-center gap-1 font-semibold"
                    >
                      {nama}
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStudentSelection(nama);
                        }}
                        className="hover:text-rose-200 cursor-pointer ml-1 font-bold"
                      >
                        ×
                      </span>
                    </span>
                  ))}
                </div>
              )}
              <ChevronDown className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
            </div>

            {/* Dropdown Multi-Select Menu */}
            {isStudentDropdownOpen && (
              <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-xl p-3 max-h-60 overflow-y-auto space-y-2">
                <div className="flex items-center justify-between border-b pb-2">
                  <input
                    type="text"
                    placeholder="Cari nama murid..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="p-1.5 bg-slate-100 border border-slate-300 rounded text-xs w-2/3 outline-none focus:border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={handleSelectAllSiswa}
                    className="text-[11px] font-bold text-teal-700 hover:text-teal-900 underline"
                  >
                    {selectedSiswaList.length === filteredSiswa.length ? 'Batal Semua' : 'Pilih Semua'}
                  </button>
                </div>

                <div className="space-y-1">
                  {filteredSiswa
                    .filter((s) => s.nama.toLowerCase().includes(studentSearch.toLowerCase()))
                    .map((siswa) => {
                      const isSelected = selectedSiswaList.includes(siswa.nama);
                      return (
                        <div
                          key={siswa.id}
                          onClick={() => toggleStudentSelection(siswa.nama)}
                          className={`flex items-center justify-between p-2 rounded cursor-pointer text-xs font-medium transition-colors ${
                            isSelected ? 'bg-teal-100 text-teal-900 font-bold' : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <span>
                            {siswa.nama} <span className="text-slate-400 text-[10px]">({siswa.nis})</span>
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-teal-700 font-bold" />}
                        </div>
                      );
                    })}
                  {filteredSiswa.length === 0 && (
                    <div className="p-3 text-center text-xs text-slate-400 italic">
                      Tidak ada data murid. Silakan pilih kelas atau tambahkan murid di menu Admin.
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsStudentDropdownOpen(false)}
                  className="w-full mt-2 bg-teal-800 text-white font-bold text-xs py-1.5 rounded hover:bg-teal-900"
                >
                  Selesai Memilih
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 5. Jenis Kesalahan */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
            Jenis Kesalahan / Pelanggaran <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <select
              id="select-jenis-kesalahan"
              value={jenisKesalahan}
              onChange={(e) => setJenisKesalahan(e.target.value)}
              className="md:col-span-2 p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-xs md:text-sm text-slate-800 font-medium transition-all"
              required
            >
              <option value="">-- Pilih Jenis Kesalahan --</option>
              {JENIS_KESALAHAN_OPTIONS.map((opt, idx) => (
                <option key={idx} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            <input
              type="text"
              id="input-keterangan-lainnya"
              placeholder="Ket. Tambahan / Rincian Kesalahan..."
              value={keteranganLainnya}
              onChange={(e) => setKeteranganLainnya(e.target.value)}
              className="p-2.5 bg-white border border-slate-300 rounded-lg text-xs md:text-sm outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* 6 & 7: Lampiran Bukti Foto / Kamera & Catatan Kronologi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
              <span>Lampiran Bukti Foto / Kamera</span>
              <span className="text-[10px] text-slate-400 font-normal italic">(Opsional)</span>
            </label>
            <CameraUploader values={fotoBuktiList} onChange={setFotoBuktiList} />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
              <span>Catatan Tambahan / Kronologi Singkat</span>
              <span className="text-[10px] text-slate-400 font-normal italic">(Opsional)</span>
            </label>
            <textarea
              id="textarea-kronologi"
              rows={3}
              placeholder="Ketikkan kronologi kejadian atau catatan penting untuk wali kelas..."
              value={catatanKronologi}
              onChange={(e) => setCatatanKronologi(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs md:text-sm outline-none focus:ring-2 focus:ring-teal-500 resize-none h-28"
            ></textarea>
          </div>
        </div>

        {/* 8. Button Submit: KIRIM ADUAN */}
        <div className="pt-2">
          <button
            type="submit"
            id="btn-kirim-aduan"
            className="w-full bg-gradient-to-r from-teal-700 via-teal-800 to-cyan-800 hover:from-teal-600 hover:to-cyan-700 text-white font-black py-3.5 px-6 rounded-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-3 tracking-widest text-sm md:text-base uppercase transition-all transform active:scale-98 border border-teal-400/30"
          >
            <Send className="w-5 h-5 text-emerald-300" />
            <span>KIRIM ADUAN SEKARANG</span>
          </button>
        </div>
      </form>

      {/* Success Modal Notification */}
      {submittedAduanId && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-2xl border-2 border-emerald-500 animate-scaleUp">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 uppercase">Aduan Berhasil Dikirim & Terekap!</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Laporan pengaduan telah tersimpan ke sistem SAWAL SMAN 4 Berau dan terekap di portal Pantau Progres Aduan Murid serta Google Sheets.
            </p>

            <div className="my-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-left text-xs space-y-1.5">
              <p className="font-bold text-emerald-900 flex items-center justify-between">
                <span>Waktu Pelaporan:</span>
                <span className="font-normal text-slate-700">{currentTimestamp}</span>
              </p>
            </div>

            <button
              onClick={() => setSubmittedAduanId(null)}
              className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-2.5 rounded-lg transition-colors text-xs uppercase tracking-wider shadow-md"
            >
              Tutup & Buat Aduan Baru
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
