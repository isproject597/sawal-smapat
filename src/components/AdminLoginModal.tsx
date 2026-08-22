import React, { useState } from 'react';
import { ShieldCheck, X, KeyRound, User } from 'lucide-react';
import { UserSession } from '../types';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: UserSession) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (username.trim() === 'admin' && password === 'admin5758') {
      onLoginSuccess({
        role: 'admin',
        nama: 'Administrator SMAN 4 Berau',
        username: 'admin'
      });
      onClose();
    } else {
      setError('Username atau Password Admin salah!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-teal-600 animate-scaleUp">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-100 rounded-lg text-teal-800">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                Login Pengelola / Admin
              </h3>
              <p className="text-[11px] text-slate-500">Akses Sistem Pengelolaan SAWAL SMAN 4 Berau</p>
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
              Username Admin
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                id="input-admin-username"
                placeholder="Masukkan username admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:border-teal-500 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-600 uppercase mb-1 block">
              Password Admin
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                id="input-admin-password"
                placeholder="Masukkan password admin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:border-teal-500 outline-none"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              id="btn-submit-admin-login"
              className="w-full bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider shadow transition-all active:scale-95"
            >
              MASUK KE DASHBOARD ADMIN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
