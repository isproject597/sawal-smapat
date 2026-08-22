import React from 'react';
import {
  BarChart3,
  ListFilter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  PieChart,
  GraduationCap,
  Info,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { Aduan } from '../types';

interface StatistikTerkiniProps {
  aduanList: Aduan[];
}

export const StatistikTerkini: React.FC<StatistikTerkiniProps> = ({ aduanList }) => {
  const total = aduanList.length;
  const totalBelum = aduanList.filter((a) => a.status === 'Belum Ditindak Lanjuti').length;
  const totalProses = aduanList.filter((a) => a.status === 'Dalam Proses').length;
  const totalSelesai = aduanList.filter((a) => a.status === 'Sudah Ditindak Lanjuti').length;

  const persenSelesai = total > 0 ? Math.round((totalSelesai / total) * 100) : 0;
  const persenProses = total > 0 ? Math.round((totalProses / total) * 100) : 0;
  const persenBelum = total > 0 ? Math.round((totalBelum / total) * 100) : 0;

  // Kategori counts
  const totalRingan = aduanList.filter((a) => a.kategori === 'Ringan').length;
  const totalSedang = aduanList.filter((a) => a.kategori === 'Sedang').length;
  const totalBerat = aduanList.filter((a) => a.kategori === 'Berat').length;

  // Kelas counts
  const kelasMap: Record<string, number> = {};
  aduanList.forEach((a) => {
    if (a.kelas) {
      kelasMap[a.kelas] = (kelasMap[a.kelas] || 0) + 1;
    }
  });

  const sortedKelas = Object.entries(kelasMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Banner Title Header */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-cyan-900 text-white rounded-2xl p-6 shadow-xl border border-teal-700 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              <TrendingUp className="w-3.5 h-3.5" /> Data Real-time SMAN 4 Berau
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2.5">
              <BarChart3 className="w-7 h-7 text-emerald-400" />
              Informasi Statistik Terkini
            </h2>
            <p className="text-teal-200 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              Ringkasan rekapitulasi aduan, tingkat penanganan wali kelas, serta statistik kedisiplinan murid SMAN 4 Berau.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 rounded-lg text-emerald-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] text-teal-200 uppercase font-bold">Tingkat Penanganan</div>
              <div className="text-2xl font-black text-emerald-300">{persenSelesai}% <span className="text-xs font-normal text-white">Tuntas</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Main Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Aduan */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Total Aduan Masuk</span>
            <div className="p-2 bg-teal-50 text-teal-700 rounded-lg">
              <ListFilter className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-800">{total}</div>
          <p className="text-[11px] text-slate-500 mt-1">Seluruh laporan aduan yang terekap</p>
        </div>

        {/* Belum Ditindak Lanjuti */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-rose-200 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-rose-600 tracking-wider">Belum Ditindak</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-600">{totalBelum}</div>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Menunggu respons wali kelas</span>
            <span className="font-bold text-rose-600">{persenBelum}%</span>
          </div>
        </div>

        {/* Dalam Proses */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-amber-200 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-amber-600 tracking-wider">Dalam Proses</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600">{totalProses}</div>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Sedang ditangani/bimbingan</span>
            <span className="font-bold text-amber-600">{persenProses}%</span>
          </div>
        </div>

        {/* Sudah Ditindak Lanjuti */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-emerald-200 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-emerald-700 tracking-wider">Sudah Selesai</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600">{totalSelesai}</div>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Telah tuntas ditindaklanjuti</span>
            <span className="font-bold text-emerald-600">{persenSelesai}%</span>
          </div>
        </div>
      </div>

      {/* Progress & Category Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Penanganan */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-2 border-b border-slate-100 pb-3">
            <PieChart className="w-4 h-4 text-teal-700" />
            Status & Progress Penanganan Aduan
          </h3>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-emerald-700">Sudah Ditindak Lanjuti ({totalSelesai})</span>
                <span className="text-emerald-700">{persenSelesai}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${persenSelesai}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-amber-600">Dalam Proses Penanganan ({totalProses})</span>
                <span className="text-amber-600">{persenProses}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${persenProses}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-rose-600">Belum Ditindak Lanjuti ({totalBelum})</span>
                <span className="text-rose-600">{persenBelum}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${persenBelum}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-2 italic">
            <Info className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Persentase dihitung secara otomatis berdasarkan total laporan aduan yang masuk.</span>
          </div>
        </div>

        {/* Breakdown Kategori Pelanggaran */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-2 border-b border-slate-100 pb-3">
            <ListFilter className="w-4 h-4 text-teal-700" />
            Distribusi Tingkat Pelanggaran
          </h3>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">Ringan</span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block">{totalRingan}</span>
              <span className="text-[10px] text-emerald-600 font-medium">Laporan</span>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl">
              <span className="text-[10px] font-bold text-amber-800 uppercase block">Sedang</span>
              <span className="text-2xl font-black text-amber-700 mt-1 block">{totalSedang}</span>
              <span className="text-[10px] text-amber-600 font-medium">Laporan</span>
            </div>

            <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl">
              <span className="text-[10px] font-bold text-rose-800 uppercase block">Berat</span>
              <span className="text-2xl font-black text-rose-700 mt-1 block">{totalBerat}</span>
              <span className="text-[10px] text-rose-600 font-medium">Laporan</span>
            </div>
          </div>

          {/* Top Kelas */}
          {sortedKelas.length > 0 && (
            <div className="pt-2">
              <div className="text-xs font-bold text-slate-700 mb-2">Kelas dengan Pelaporan Terbanyak:</div>
              <div className="flex flex-wrap gap-2">
                {sortedKelas.map(([k, count]) => (
                  <span
                    key={k}
                    className="bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                  >
                    <span className="font-bold text-teal-800">{k}:</span>
                    <span className="bg-teal-700 text-white px-1.5 py-0.2 rounded text-[10px] font-bold">
                      {count} aduan
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info Box */}
      <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-teal-100 p-5 rounded-2xl border border-teal-800 flex items-center gap-4 shadow-sm">
        <div className="p-3 bg-teal-800/80 rounded-xl text-teal-300 shrink-0">
          <GraduationCap className="w-8 h-8" />
        </div>
        <div className="text-xs leading-relaxed">
          <h4 className="font-bold text-white text-sm">Transparansi & Kedisiplinan SMA Negeri 4 Berau</h4>
          <p className="mt-0.5 text-teal-200/90">
            Sistem SAWAL mendukung sinergi antara Guru Mata Pelajaran, Wali Kelas, dan Tim Kedisiplinan Sekolah untuk menciptakan lingkungan belajar yang kondusif, transparan, dan berkarakter.
          </p>
        </div>
      </div>
    </div>
  );
};
