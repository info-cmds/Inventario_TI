'use client';

import React from 'react';
import { Building2, LogOut, KeyRound, MonitorCheck, Landmark } from 'lucide-react';

interface NavbarProps {
  user: any;
  sectors: any[];
  branches: any[];
  selectedSectorId: string;
  selectedBranchId: string;
  onSelectSector: (sectorId: string) => void;
  onSelectBranch: (branchId: string) => void;
  onLogout: () => void;
  onChangePasswordClick: () => void;
}

export default function Navbar({
  user,
  sectors,
  branches,
  selectedSectorId,
  selectedBranchId,
  onSelectSector,
  onSelectBranch,
  onLogout,
  onChangePasswordClick,
}: NavbarProps) {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPERADMIN':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-[#EB567F] text-white shadow-xs">SuperAdmin</span>;
      case 'ADMINISTRADOR':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-[#016098] text-white shadow-xs">Administrador</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-[#39BABD] text-white shadow-xs">Lector</span>;
    }
  };

  const filteredBranches = branches.filter((b) => !selectedSectorId || b.sectorId === selectedSectorId);

  return (
    <header className="sticky top-0 z-40 bg-[#016098] text-white shadow-md border-b border-[#014d7a]">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="bg-white p-1.5 rounded-xl shadow-md flex items-center justify-center border border-white/20">
              <img src="/logo-cmds.png" alt="CMDS Antofagasta" className="h-9 w-auto object-contain" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white block leading-none">
                CMDS <span className="text-[#39BABD] font-normal">Inventario</span>
              </span>
              <span className="text-[11px] text-blue-200">Empresa CMDS • Educación • Salud • Casa Central</span>
            </div>
          </div>

          {/* Right Section: Sector & Branch Selectors */}
          <div className="flex items-center space-x-3">
            {/* Sector Selector */}
            <div className="hidden lg:flex items-center space-x-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
              <Landmark className="w-4 h-4 text-[#F7A517]" />
              <select
                value={selectedSectorId}
                onChange={(e) => {
                  onSelectSector(e.target.value);
                  onSelectBranch('');
                }}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
              >
                <option value="" className="text-slate-900">
                  {user?.role === 'SUPERADMIN' ? '🏛️ Todos los Sectores' : '🏛️ Todos Mis Sectores'}
                </option>
                {sectors.map((s) => (
                  <option key={s.id} value={s.id} className="text-slate-900">
                    Sector {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Global Branch Selector */}
            <div className="hidden md:flex items-center space-x-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
              <Building2 className="w-4 h-4 text-[#39BABD]" />
              <select
                value={selectedBranchId}
                onChange={(e) => onSelectBranch(e.target.value)}
                className="bg-transparent text-xs font-medium text-white focus:outline-none cursor-pointer max-w-[200px] truncate"
              >
                <option value="" className="text-slate-900">
                  {user?.role === 'SUPERADMIN' ? '🏢 Todas las Sucursales' : 'Todas Mis Sucursales'}
                </option>
                {filteredBranches.map((b) => (
                  <option key={b.id} value={b.id} className="text-slate-900">
                    📍 {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            {/* User Info & Actions */}
            <div className="flex items-center space-x-3 border-l border-white/20 pl-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-white">{user?.name}</div>
                <div className="text-[10px] text-blue-200">{user?.email}</div>
              </div>

              {getRoleBadge(user?.role)}

              <button
                onClick={onChangePasswordClick}
                title="Cambiar contraseña"
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <KeyRound className="w-4 h-4 text-[#F7A517]" />
              </button>

              <button
                onClick={onLogout}
                title="Cerrar sesión"
                className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-white transition-colors border border-red-400/30"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
