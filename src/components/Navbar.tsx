'use client';

import React, { useState } from 'react';
import { Building2, LogOut, KeyRound, Landmark, Menu, X } from 'lucide-react';

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
  isMobileSidebarOpen?: boolean;
  onToggleMobileSidebar?: () => void;
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
  isMobileSidebarOpen = false,
  onToggleMobileSidebar,
}: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPERADMIN':
        return <span className="px-2.5 py-1 text-[11px] sm:text-xs font-semibold rounded-full bg-[#EB567F] text-white shadow-xs shrink-0">SuperAdmin</span>;
      case 'ADMINISTRADOR':
        return <span className="px-2.5 py-1 text-[11px] sm:text-xs font-semibold rounded-full bg-[#016098] text-white shadow-xs shrink-0">Admin</span>;
      default:
        return <span className="px-2.5 py-1 text-[11px] sm:text-xs font-semibold rounded-full bg-[#39BABD] text-white shadow-xs shrink-0">Lector</span>;
    }
  };

  const filteredBranches = branches.filter((b) => !selectedSectorId || b.sectorId === selectedSectorId);

  return (
    <header className="sticky top-0 z-40 bg-[#016098] text-white shadow-md border-b border-[#014d7a]">
      <div className="w-full px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile Sidebar Toggle + Logo */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {onToggleMobileSidebar && (
              <button
                onClick={onToggleMobileSidebar}
                className="lg:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Abrir Menú de Navegación Árbol"
              >
                {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

            <div className="bg-white p-1 rounded-xl shadow-md flex items-center justify-center border border-white/20 shrink-0">
              <img src="/logo-cmds.png" alt="CMDS Antofagasta" className="h-8 sm:h-9 w-auto object-contain" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-base sm:text-lg tracking-tight text-white block leading-none truncate">
                CMDS <span className="text-[#39BABD] font-normal">Inventario</span>
              </span>
              <span className="text-[10px] sm:text-[11px] text-blue-200 hidden sm:block truncate">
                Empresa CMDS • Educación • Salud • Casa Central
              </span>
            </div>
          </div>

          {/* Right Section: Desktop Selectors & Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Sector Selector (Desktop) */}
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

            {/* Global Branch Selector (Desktop/Tablet) */}
            <div className="hidden md:flex items-center space-x-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
              <Building2 className="w-4 h-4 text-[#39BABD]" />
              <select
                value={selectedBranchId}
                onChange={(e) => onSelectBranch(e.target.value)}
                className="bg-transparent text-xs font-medium text-white focus:outline-none cursor-pointer max-w-[180px] lg:max-w-[220px] truncate"
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
            <div className="flex items-center space-x-2 sm:space-x-3 border-l border-white/20 pl-2 sm:pl-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-white truncate max-w-[130px]">{user?.name}</div>
                <div className="text-[10px] text-blue-200 truncate max-w-[130px]">{user?.email}</div>
              </div>

              {getRoleBadge(user?.role)}

              <button
                onClick={onChangePasswordClick}
                title="Cambiar contraseña"
                className="p-1.5 sm:p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <KeyRound className="w-4 h-4 text-[#F7A517]" />
              </button>

              <button
                onClick={onLogout}
                title="Cerrar sesión"
                className="p-1.5 sm:p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-white transition-colors border border-red-400/30 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>

              {/* Mobile Quick Dropdown Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20"
                title="Filtros rápidos Celular"
              >
                <Landmark className="w-4 h-4 text-[#F7A517]" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Bar for Sector and Branch Filtering on Phones */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-white/15 grid grid-cols-1 gap-2 bg-[#014d7a]/50 p-2 rounded-xl mb-2">
            <div>
              <label className="block text-[10px] text-blue-200 mb-0.5 font-semibold">Sector Corporativo</label>
              <select
                value={selectedSectorId}
                onChange={(e) => {
                  onSelectSector(e.target.value);
                  onSelectBranch('');
                }}
                className="w-full p-2 text-xs font-bold text-slate-900 bg-white rounded-lg outline-none"
              >
                <option value="">
                  {user?.role === 'SUPERADMIN' ? '🏛️ Todos los Sectores' : '🏛️ Todos Mis Sectores'}
                </option>
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    Sector {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-blue-200 mb-0.5 font-semibold">Sucursal / Establecimiento</label>
              <select
                value={selectedBranchId}
                onChange={(e) => onSelectBranch(e.target.value)}
                className="w-full p-2 text-xs font-bold text-slate-900 bg-white rounded-lg outline-none"
              >
                <option value="">
                  {user?.role === 'SUPERADMIN' ? '🏢 Todas las Sucursales' : 'Todas Mis Sucursales'}
                </option>
                {filteredBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    📍 {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

