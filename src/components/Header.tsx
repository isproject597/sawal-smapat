import React from 'react';
import {
  ShieldCheck,
  UserCheck,
  LogOut,
  FileText,
  Search,
  BarChart3,
  LayoutDashboard
} from 'lucide-react';
import { UserSession } from '../types';
import logoSman4 from '../assets/images/sman4_original_logo_1786626221084.jpg';

export type SubMenuType = 'form' | 'pantau' | 'statistik' | 'dashboard';

interface HeaderProps {
  session: UserSession;
  activeSubMenu: SubMenuType;
  onSelectSubMenu: (menu: SubMenuType) => void;
  onOpenWaliKelasLogin: () => void;
  onOpenAdminLogin?: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  activeSubMenu,
  onSelectSubMenu,
  onOpenWaliKelasLogin,
  onLogout
}) => {
  return (
    <header className="bg-gradient-to-r from-teal-900 via-teal-850 to-cyan-950 text-white border-b-4 border-teal-500 shadow-xl shrink-0">
      {/* Top Main Bar */}
      <div className="px-4 md:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Logo Section */}
        <div className="flex items-center gap-3 md:gap-5">
          {/* Logo SMA Negeri 4 Berau */}
          <div className="relative group cursor-pointer" onClick={() => onSelectSubMenu('form')}>
            <div className="h-12 md:h-14 w-auto bg-white rounded-xl flex items-center justify-center border-2 border-teal-300 shadow-md transform transition-transform group-hover:scale-105 overflow-hidden p-1">
              <img
                src={logoSman4}
                alt="Logo SMAN 4 Berau"
                className="h-full w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Pemisah / Vertical Divider */}
          <div className="h-10 w-[2px] bg-teal-400/40 rounded-full"></div>

          {/* Text Header */}
          <div>
            <h1 className="text-base md:text-xl font-black tracking-tight leading-none uppercase text-white flex items-center gap-2">
              SAWAL - SMAN 4 BERAU
            </h1>
            <p className="text-[11px] font-semibold text-teal-200 tracking-wider mt-1 uppercase flex items-center gap-1.5">
              Sistem Aduan Wali Kelas
            </p>
          </div>
        </div>

        {/* Login / Auth Control Buttons */}
        <div className="flex items-center gap-2 md:gap-3 ml-auto">
          {session.role === 'guest' ? (
            <button
              onClick={onOpenWaliKelasLogin}
              id="btn-login-walikelas"
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-3.5 py-2 rounded-lg border border-emerald-400/40 transition-all text-xs font-bold shadow-md hover:shadow-lg active:scale-95"
            >
              <UserCheck className="w-4 h-4 text-emerald-200" />
              <span>LOGIN WALI KELAS</span>
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-teal-950/80 p-1.5 pl-3 rounded-lg border border-teal-400/40">
              <div className="text-right text-xs">
                <span className="block font-bold text-emerald-300 uppercase tracking-wide">
                  {session.role === 'admin' ? 'PENGELOLA / ADMIN' : `WALI KELAS: ${session.kelasAssigned || ''}`}
                </span>
                <span className="block text-[10px] text-teal-200 font-medium truncate max-w-[140px]">
                  {session.nama || session.username || 'User'}
                </span>
              </div>

              <button
                onClick={onLogout}
                id="btn-logout"
                title="Keluar Sesi"
                className="flex items-center gap-1 bg-rose-600/90 hover:bg-rose-500 text-white px-3 py-1.5 rounded text-xs font-bold transition-all shadow-sm active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>LOGOUT</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sub Menu Navigation Bar Directly Below Header Title */}
      <nav className="bg-teal-950/90 border-t border-teal-800/80 px-4 md:px-8 py-1.5 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 md:gap-3 max-w-7xl mx-auto">
          {/* Sub Menu 1: Form Aduan Baru */}
          <button
            onClick={() => onSelectSubMenu('form')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeSubMenu === 'form'
                ? 'bg-emerald-500 text-white shadow-md ring-2 ring-emerald-300/40'
                : 'text-teal-200 hover:text-white hover:bg-teal-900/80'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Form Aduan Baru</span>
          </button>

          {/* Sub Menu 2: Pantau Progres Aduan */}
          <button
            onClick={() => onSelectSubMenu('pantau')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeSubMenu === 'pantau'
                ? 'bg-emerald-500 text-white shadow-md ring-2 ring-emerald-300/40'
                : 'text-teal-200 hover:text-white hover:bg-teal-900/80'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Pantau Progres Aduan</span>
          </button>

          {/* Sub Menu 3: Informasi Statistik Terkini */}
          <button
            onClick={() => onSelectSubMenu('statistik')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeSubMenu === 'statistik'
                ? 'bg-emerald-500 text-white shadow-md ring-2 ring-emerald-300/40'
                : 'text-teal-200 hover:text-white hover:bg-teal-900/80'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Informasi Statistik Terkini</span>
          </button>

          {/* Sub Menu 4 (When Logged In): Dashboard Admin / Wali Kelas */}
          {session.role !== 'guest' && (
            <button
              onClick={() => onSelectSubMenu('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ml-auto ${
                activeSubMenu === 'dashboard'
                  ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300/40'
                  : 'text-amber-300 hover:text-white hover:bg-amber-900/60'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard {session.role === 'admin' ? 'Admin' : 'Wali Kelas'}</span>
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};

