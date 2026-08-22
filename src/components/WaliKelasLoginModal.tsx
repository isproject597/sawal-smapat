import React, { useState } from 'react';
import { UserCheck, X, KeyRound, User, Lock } from 'lucide-react';
import { AccountWaliKelas, UserSession } from '../types';

interface WaliKelasLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  waliKelasAccounts: AccountWaliKelas[];
  onLoginSuccess: (session: UserSession) => void;
}

export const WaliKelasLoginModal: React.FC<WaliKelasLoginModalProps> = ({
  isOpen,
  onClose,
  waliKelasAccounts,
  onLoginSuccess
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUser = username.trim();

    // Check if Admin credentials
    if (trimmedUser.toLowerCase() === 'admin' && password === 'admin5758') {
      onLoginSuccess({
        role: 'admin',
        nama: 'Administrator SMAN 4 Berau',
        username: 'admin'
      });
      onClose();
      return;
    }

    // Check if Wali Kelas credentials
    const found = waliKelasAccounts.find(
      (wk) => wk.username.toLowerCase() === trimmedUser.toLowerCase() && wk.password === password
    );

    if (found) {
      onLoginSuccess({
        role: 'walikelas',
        nama: found.nama,
        username: found.username,
        kelasAssigned: found.kelasAssigned
      });
      onClose();
    } else {
      setError('Username atau Password tidak sesuai!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-emerald-600 animate-scaleUp">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-800">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                Login Wali Kelas
              </h3>
              <p className="text-[11px] text-slate-500">Masuk untuk Menindaklanjuti Aduan Siswa</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase mb-1 block">
              Username Wali Kelas
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                id="input-walikelas-username"
                placeholder="Contoh: walikelas10mipa1"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:border-emerald-500 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase mb-1 block">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                id="input-walikelas-password"
                placeholder="Masukkan password akun Anda"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:border-emerald-500 outline-none"
                required
              />
            </div>
          </div>

          <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-lg text-[11px] text-teal-800 space-y-1">
            <span className="font-bold block uppercase text-[10px] text-teal-900">Petunjuk Login Wali Kelas:</span>
            <span>Gunakan username & password yang dibuatkan oleh Admin SMAN 4 Berau.</span>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              id="btn-submit-walikelas-login"
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider shadow transition-all active:scale-95"
            >
              MASUK PORTAL WALI KELAS
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
