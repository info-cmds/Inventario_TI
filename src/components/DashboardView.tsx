'use client';

import React, { useState } from 'react';
import {
  Laptop,
  CheckCircle2,
  UserCheck,
  Wrench,
  XCircle,
  Users,
  Building2,
  ArrowUpRight,
  PlusCircle,
  FileSpreadsheet,
  Eye,
  Search,
  Sliders,
  User,
  X,
} from 'lucide-react';
import Pagination from './Pagination';

interface DashboardViewProps {
  metrics: any;
  branchSummaries: any[];
  typeDistribution: any[];
  departmentDistribution?: any[];
  selectedSectorId?: string;
  selectedBranchId?: string;
  onNavigate: (tab: string) => void;
}

export default function DashboardView({
  metrics,
  branchSummaries,
  typeDistribution,
  departmentDistribution = [],
  selectedSectorId,
  selectedBranchId,
  onNavigate,
}: DashboardViewProps) {
  // Modal Detail State
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [modalType, setModalType] = useState<
    'total' | 'disponible' | 'asignado' | 'reparacion' | 'dado_de_baja' | 'employees' | null
  >(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalSubtitle, setModalSubtitle] = useState('');
  const [modalData, setModalData] = useState<any[]>([]);
  const [loadingModalData, setLoadingModalData] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');

  // Pagination states
  const [branchPage, setBranchPage] = useState(1);
  const [branchPageSize, setBranchPageSize] = useState(10);
  const [modalPage, setModalPage] = useState(1);
  const [modalPageSize, setModalPageSize] = useState(10);

  if (!metrics) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Cargando métricas del dashboard...
      </div>
    );
  }

  const statCards = [
    {
      type: 'total' as const,
      label: 'Total Equipos',
      value: metrics.totalEquipment,
      icon: Laptop,
      color: 'bg-[#016098]',
      textColor: 'text-[#016098]',
      borderColor: 'border-[#016098]/30',
      hoverBg: 'hover:border-[#016098] hover:bg-[#016098]/5',
      badge: 'Inventario Global',
    },
    {
      type: 'disponible' as const,
      label: 'Equipos Disponibles',
      value: metrics.disponibleCount,
      icon: CheckCircle2,
      color: 'bg-[#39BABD]',
      textColor: 'text-[#39BABD]',
      borderColor: 'border-[#39BABD]/30',
      hoverBg: 'hover:border-[#39BABD] hover:bg-[#39BABD]/5',
      badge: 'Listos para Asignar',
    },
    {
      type: 'asignado' as const,
      label: 'Equipos Asignados',
      value: metrics.asignadoCount,
      icon: UserCheck,
      color: 'bg-emerald-600',
      textColor: 'text-emerald-600',
      borderColor: 'border-emerald-600/30',
      hoverBg: 'hover:border-emerald-600 hover:bg-emerald-600/5',
      badge: 'En uso activo',
    },
    {
      type: 'reparacion' as const,
      label: 'En Reparación',
      value: metrics.reparacionCount,
      icon: Wrench,
      color: 'bg-[#F7A517]',
      textColor: 'text-[#F7A517]',
      borderColor: 'border-[#F7A517]/30',
      hoverBg: 'hover:border-[#F7A517] hover:bg-[#F7A517]/5',
      badge: 'Servicio Técnico',
    },
    {
      type: 'dado_de_baja' as const,
      label: 'Dados de Baja',
      value: metrics.dadoDeBajaCount,
      icon: XCircle,
      color: 'bg-[#EB567F]',
      textColor: 'text-[#EB567F]',
      borderColor: 'border-[#EB567F]/30',
      hoverBg: 'hover:border-[#EB567F] hover:bg-[#EB567F]/5',
      badge: 'Retirados',
    },
    {
      type: 'employees' as const,
      label: 'Total Funcionarios',
      value: metrics.totalEmployees,
      icon: Users,
      color: 'bg-indigo-600',
      textColor: 'text-indigo-600',
      borderColor: 'border-indigo-600/30',
      hoverBg: 'hover:border-indigo-600 hover:bg-indigo-600/5',
      badge: 'Personal Registrado',
    },
  ];

  const handleOpenCardDetail = async (
    cardType: 'total' | 'disponible' | 'asignado' | 'reparacion' | 'dado_de_baja' | 'employees',
    customBranchId?: string
  ) => {
    setModalType(cardType);
    setModalSearchQuery('');
    setLoadingModalData(true);
    setIsDetailModalOpen(true);

    let title = '';
    let subtitle = '';
    let fetchUrl = '';

    const params = new URLSearchParams();
    const branchToUse = customBranchId || selectedBranchId;
    if (selectedSectorId) params.append('sectorId', selectedSectorId);
    if (branchToUse) params.append('branchId', branchToUse);

    switch (cardType) {
      case 'total':
        title = 'Detalle Completo de Equipos (Inventario Global)';
        subtitle = 'Listado detallado de todos los equipos tecnológicos registrados';
        fetchUrl = `/api/equipment?${params.toString()}`;
        break;
      case 'disponible':
        title = 'Detalle de Equipos Disponibles';
        subtitle = 'Equipos operativos en bodega listos para ser asignados';
        params.append('status', 'disponible');
        fetchUrl = `/api/equipment?${params.toString()}`;
        break;
      case 'asignado':
        title = 'Detalle de Equipos Asignados';
        subtitle = 'Equipos actualmente en uso activo por funcionarios';
        params.append('status', 'asignado');
        fetchUrl = `/api/equipment?${params.toString()}`;
        break;
      case 'reparacion':
        title = 'Detalle de Equipos En Reparación';
        subtitle = 'Equipos en servicio técnico o mantenimiento correctivo';
        params.append('status', 'en_reparacion');
        fetchUrl = `/api/equipment?${params.toString()}`;
        break;
      case 'dado_de_baja':
        title = 'Detalle de Equipos Dados de Baja';
        subtitle = 'Equipos retirados del servicio activo con su respectiva justificación';
        params.append('status', 'dado_de_baja');
        fetchUrl = `/api/equipment?${params.toString()}`;
        break;
      case 'employees':
        title = 'Detalle de Funcionarios';
        subtitle = 'Nómina de funcionarios y sus equipos asignados';
        fetchUrl = `/api/employees?${params.toString()}`;
        break;
    }

    setModalTitle(title);
    setModalSubtitle(subtitle);

    try {
      const res = await fetch(fetchUrl);
      const data = await res.json();
      setModalData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar detalle del dashboard:', err);
      setModalData([]);
    } finally {
      setLoadingModalData(false);
    }
  };

  const handleOpenDepartmentDetail = async (deptId: string, deptName: string) => {
    setModalType('total');
    setModalSearchQuery('');
    setLoadingModalData(true);
    setIsDetailModalOpen(true);
    setModalTitle(`Detalle de Equipos en ${deptName}`);
    setModalSubtitle(`Equipos tecnológicos pertenecientes o asignados al departamento ${deptName}`);

    const params = new URLSearchParams();
    if (selectedSectorId) params.append('sectorId', selectedSectorId);
    if (selectedBranchId) params.append('branchId', selectedBranchId);
    if (deptId) params.append('departmentId', deptId);

    try {
      const res = await fetch(`/api/equipment?${params.toString()}`);
      const data = await res.json();
      setModalData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar detalle por departamento:', err);
      setModalData([]);
    } finally {
      setLoadingModalData(false);
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'disponible':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#39BABD]/15 text-[#39BABD] border border-[#39BABD]/30 flex items-center space-x-1 w-fit">
            <CheckCircle2 className="w-3 h-3" />
            <span>Disponible</span>
          </span>
        );
      case 'asignado':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#016098]/15 text-[#016098] border border-[#016098]/30 flex items-center space-x-1 w-fit">
            <UserCheck className="w-3 h-3" />
            <span>Asignado</span>
          </span>
        );
      case 'en_reparacion':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F7A517]/15 text-[#F7A517] border border-[#F7A517]/30 flex items-center space-x-1 w-fit">
            <Wrench className="w-3 h-3" />
            <span>En Reparación</span>
          </span>
        );
      case 'dado_de_baja':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EB567F]/15 text-[#EB567F] border border-[#EB567F]/30 flex items-center space-x-1 w-fit">
            <XCircle className="w-3 h-3" />
            <span>Dado de Baja</span>
          </span>
        );
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">{st}</span>;
    }
  };

  // Filter modal data in real-time
  const filteredModalData = modalData.filter((item) => {
    if (!modalSearchQuery.trim()) return true;
    const q = modalSearchQuery.toLowerCase();

    if (modalType === 'employees') {
      return (
        (item.full_name || '').toLowerCase().includes(q) ||
        (item.rut_document || '').toLowerCase().includes(q) ||
        (item.email || '').toLowerCase().includes(q) ||
        (item.position || '').toLowerCase().includes(q) ||
        (item.branch?.name || '').toLowerCase().includes(q) ||
        (item.department?.name || '').toLowerCase().includes(q)
      );
    } else {
      const activeEmp = item.assignments?.[0]?.employee;
      let dyn: any = {};
      try {
        dyn = JSON.parse(item.dynamic_values || '{}');
      } catch (e) {}

      return (
        (item.asset_tag || '').toLowerCase().includes(q) ||
        (item.serial_number || '').toLowerCase().includes(q) ||
        (item.type?.name || '').toLowerCase().includes(q) ||
        (item.brand?.name || '').toLowerCase().includes(q) ||
        (item.model?.name || '').toLowerCase().includes(q) ||
        (item.branch?.name || '').toLowerCase().includes(q) ||
        (item.department?.name || '').toLowerCase().includes(q) ||
        (activeEmp?.full_name || '').toLowerCase().includes(q) ||
        (activeEmp?.rut_document || '').toLowerCase().includes(q) ||
        (dyn._decommission_reason || '').toLowerCase().includes(q)
      );
    }
  });

  return (
    <div className="space-y-6">
      {/* Title & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Panel de Control de Inventario</h1>
          <p className="text-xs text-slate-500">Resumen operativo de equipos tecnológicos y funcionarios multi-sucursal</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('equipment')}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#016098] hover:bg-[#014d7a] rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-[#39BABD]" />
            <span>Nuevo Equipo</span>
          </button>

          <button
            onClick={() => onNavigate('employees')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center space-x-1.5 border border-slate-200 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#F7A517]" />
            <span>Importar CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => handleOpenCardDetail(card.type)}
              className={`bg-white p-4 rounded-2xl border ${card.borderColor} ${card.hoverBg} shadow-xs hover:shadow-md transition-all duration-200 relative overflow-hidden group cursor-pointer`}
              title={`Haz clic para ver el detalle de ${card.label}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide group-hover:text-slate-900 transition-colors">
                  {card.label}
                </span>
                <div className={`w-8 h-8 rounded-xl ${card.color} text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <span className={`text-2xl font-extrabold ${card.textColor}`}>{card.value}</span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 group-hover:bg-white px-2 py-0.5 rounded-full transition-colors flex items-center space-x-1 border border-slate-200">
                  <Eye className="w-3 h-3 text-[#016098]" />
                  <span>Ver Detalle</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Branch Summaries & Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Branch Summary Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-[#016098]" />
              <h2 className="font-bold text-slate-800 text-base">Resumen de Equipos por Sucursal</h2>
            </div>
            <button
              onClick={() => onNavigate('branches')}
              className="text-xs font-semibold text-[#016098] hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>Ver todas</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Sucursal</th>
                  <th className="py-2.5 px-3 text-center">Total</th>
                  <th className="py-2.5 px-3 text-center text-[#39BABD]">Disponibles</th>
                  <th className="py-2.5 px-3 text-center text-[#016098]">Asignados</th>
                  <th className="py-2.5 px-3 text-center text-[#F7A517]">En Reparación</th>
                  <th className="py-2.5 px-3 text-center text-[#EB567F]">Dados de Baja</th>
                  <th className="py-2.5 px-3 text-center">Funcionarios</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {branchSummaries
                  .slice((branchPage - 1) * branchPageSize, branchPage * branchPageSize)
                  .map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{b.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{b.code}</div>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-900">
                      <button
                        onClick={() => handleOpenCardDetail('total', b.id)}
                        className="hover:underline text-[#016098] cursor-pointer"
                        title={`Ver total de equipos en ${b.name}`}
                      >
                        {b.totalEquipment}
                      </button>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleOpenCardDetail('disponible', b.id)}
                        className="px-2 py-0.5 rounded-full bg-[#39BABD]/10 text-[#39BABD] font-bold hover:bg-[#39BABD]/20 transition-colors cursor-pointer"
                        title={`Ver equipos disponibles en ${b.name}`}
                      >
                        {b.disponible}
                      </button>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleOpenCardDetail('asignado', b.id)}
                        className="px-2 py-0.5 rounded-full bg-[#016098]/10 text-[#016098] font-bold hover:bg-[#016098]/20 transition-colors cursor-pointer"
                        title={`Ver equipos asignados en ${b.name}`}
                      >
                        {b.asignado}
                      </button>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleOpenCardDetail('reparacion', b.id)}
                        className="px-2 py-0.5 rounded-full bg-[#F7A517]/10 text-[#F7A517] font-bold hover:bg-[#F7A517]/20 transition-colors cursor-pointer"
                        title={`Ver equipos en reparación en ${b.name}`}
                      >
                        {b.enReparacion}
                      </button>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleOpenCardDetail('dado_de_baja', b.id)}
                        className="px-2 py-0.5 rounded-full bg-[#EB567F]/10 text-[#EB567F] font-bold hover:bg-[#EB567F]/20 transition-colors cursor-pointer"
                        title={`Ver equipos dados de baja en ${b.name}`}
                      >
                        {b.dadoDeBaja}
                      </button>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600 font-semibold">
                      <button
                        onClick={() => handleOpenCardDetail('employees', b.id)}
                        className="hover:underline text-indigo-600 font-bold cursor-pointer"
                        title={`Ver funcionarios en ${b.name}`}
                      >
                        {b.totalEmployees}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar for Branch Summary */}
          {branchSummaries.length > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={branchPage}
                totalItems={branchSummaries.length}
                pageSize={branchPageSize}
                onPageChange={setBranchPage}
                onPageSizeChange={setBranchPageSize}
                pageSizeOptions={[5, 10, 15, 25, 50]}
                itemLabel="sucursales"
              />
            </div>
          )}
        </div>

        {/* Right Column: Type & Department Breakdown */}
        <div className="flex flex-col space-y-6">
          {/* Equipment Type Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <h2 className="font-bold text-slate-800 text-base mb-4 flex items-center space-x-2">
                <Laptop className="w-5 h-5 text-[#39BABD]" />
                <span>Distribución por Tipo</span>
              </h2>

              <div className="space-y-3">
                {typeDistribution.map((td, idx) => {
                  const percentage =
                    metrics.totalEquipment > 0 ? Math.round((td.count / metrics.totalEquipment) * 100) : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>{td.name}</span>
                        <span className="text-[#016098]">
                          {td.count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#016098] to-[#39BABD] h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => onNavigate('equipment-types')}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-[#016098] font-semibold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                Configurar Atributos Dinámicos
              </button>
            </div>
          </div>

          {/* Equipment Department Breakdown (Debajo de Distribución por Tipo) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-800 text-base flex items-center space-x-2">
                  <Sliders className="w-5 h-5 text-[#F7A517]" />
                  <span>Distribución por Departamento</span>
                </h2>
                <span className="text-[10px] font-bold text-[#F7A517] bg-[#F7A517]/10 px-2 py-0.5 rounded-full">
                  {departmentDistribution.length} Deptos
                </span>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {departmentDistribution && departmentDistribution.length > 0 ? (
                  departmentDistribution.map((dd, idx) => {
                    const percentage =
                      metrics.totalEquipment > 0 ? Math.round((dd.count / metrics.totalEquipment) * 100) : 0;
                    return (
                      <div
                        key={idx}
                        onClick={() => handleOpenDepartmentDetail(dd.id, dd.name)}
                        className="space-y-1 group cursor-pointer p-1.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
                        title={`Haz clic para ver equipos en ${dd.name}`}
                      >
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span className="group-hover:text-[#016098] transition-colors truncate max-w-[170px]">
                            {dd.name}
                          </span>
                          <span className="text-[#F7A517] font-extrabold">
                            {dd.count} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[#F7A517] to-[#39BABD] h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-slate-400 text-xs italic p-4 text-center">
                    Sin departamentos con equipos en esta selección.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-500 font-semibold">
              <span>Haz clic en un departamento para ver sus equipos</span>
              <Eye className="w-3.5 h-3.5 text-[#F7A517]" />
            </div>
          </div>
        </div>
      </div>

      {/* DASHBOARD CARD DETAIL MODAL */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-slate-800 text-lg">{modalTitle}</h3>
                  <span className="px-2.5 py-0.5 bg-[#016098]/10 text-[#016098] text-xs font-extrabold rounded-full">
                    {filteredModalData.length} registros
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{modalSubtitle}</p>
              </div>

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={modalSearchQuery}
                onChange={(e) => setModalSearchQuery(e.target.value)}
                placeholder={
                  modalType === 'employees'
                    ? 'Buscar por funcionario, RUN, email, cargo, sucursal...'
                    : 'Buscar por Asset Tag, Serie, Tipo, Marca, Modelo, Funcionario, Motivo...'
                }
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none"
              />
            </div>

            {/* Modal Table Content */}
            <div className="flex-1 overflow-y-auto border border-slate-200/80 rounded-xl">
              {loadingModalData ? (
                <div className="p-8 text-center text-slate-500 font-medium text-xs">
                  Cargando detalle de registros...
                </div>
              ) : filteredModalData.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs italic font-medium">
                  No se encontraron registros para los filtros seleccionados.
                </div>
              ) : modalType === 'employees' ? (
                /* EMPLOYEES TABLE */
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Funcionario</th>
                      <th className="py-2.5 px-3">RUN</th>
                      <th className="py-2.5 px-3">Cargo / Contacto</th>
                      <th className="py-2.5 px-3">Sucursal / Depto</th>
                      <th className="py-2.5 px-3">Estado</th>
                      <th className="py-2.5 px-3">Equipos Asignados</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {filteredModalData
                      .slice((modalPage - 1) * modalPageSize, modalPage * modalPageSize)
                      .map((emp) => {
                      const activeAssignedEquipment =
                        emp.assignments?.filter((a: any) => a.fecha_fin === null) || [];

                      return (
                        <tr
                          key={emp.id}
                          className={emp.status === 'INACTIVO' ? 'bg-rose-50/70' : 'hover:bg-slate-50'}
                        >
                          <td className="py-2.5 px-3 font-bold text-slate-900">{emp.full_name}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-700">{emp.rut_document}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-800">{emp.position || 'N/A'}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{emp.email}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-[#016098]">{emp.branch?.name}</div>
                            <div className="text-[10px] text-slate-500 font-bold">
                              {emp.department?.name || 'Sin Depto'}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            {emp.status === 'INACTIVO' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                🔴 INACTIVO
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                🟢 ACTIVO
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {activeAssignedEquipment.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {activeAssignedEquipment.map((ass: any) => (
                                  <span
                                    key={ass.id}
                                    className="px-2 py-0.5 bg-[#016098]/10 text-[#016098] font-bold text-[10px] rounded-md border border-[#016098]/20 flex items-center space-x-1"
                                  >
                                    <Laptop className="w-3 h-3 text-[#39BABD]" />
                                    <span>{ass.equipment?.asset_tag}</span>
                                    {ass.equipment?.type?.name && (
                                      <span className="text-slate-500 font-normal">
                                        ({ass.equipment.type.name})
                                      </span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[10px]">Sin equipos</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                /* EQUIPMENT TABLE */
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Asset Tag / Serie</th>
                      <th className="py-2.5 px-3">Tipo / Marca / Modelo</th>
                      <th className="py-2.5 px-3">Ubicación (Sucursal / Depto)</th>
                      <th className="py-2.5 px-3">Estado</th>
                      <th className="py-2.5 px-3">Funcionario / Información de Baja</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {filteredModalData
                      .slice((modalPage - 1) * modalPageSize, modalPage * modalPageSize)
                      .map((eq) => {
                      const activeAss = eq.assignments?.[0];
                      let dyn: any = {};
                      try {
                        dyn = JSON.parse(eq.dynamic_values || '{}');
                      } catch (e) {}

                      return (
                        <tr
                          key={eq.id}
                          className={
                            eq.status === 'dado_de_baja'
                              ? 'bg-rose-50/50 hover:bg-rose-50/80 transition-colors'
                              : 'hover:bg-slate-50'
                          }
                        >
                          <td className="py-2.5 px-3">
                            <div className="font-mono font-bold text-slate-900">{eq.asset_tag}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              SN: {eq.serial_number}
                            </div>
                          </td>

                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{eq.type?.name}</div>
                            <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                              {eq.brand?.name && (
                                <span className="font-bold text-[#F7A517]">{eq.brand.name}</span>
                              )}
                              {eq.model?.name && (
                                <span className="text-slate-600 font-medium">({eq.model.name})</span>
                              )}
                            </div>
                          </td>

                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-[#016098]">{eq.branch?.name}</div>
                            <div className="text-[10px]">
                              {eq.department?.name ? (
                                <span className="text-slate-600 font-bold">{eq.department.name}</span>
                              ) : (
                                <span className="text-slate-400 italic font-semibold">
                                  Sin Depto Asignado
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-2.5 px-3">{getStatusBadge(eq.status)}</td>

                          <td className="py-2.5 px-3">
                            {eq.status === 'dado_de_baja' ? (
                              <div className="p-2 bg-rose-100/60 border border-rose-200 rounded-lg space-y-0.5">
                                <div className="font-bold text-rose-800 text-[11px]">
                                  ⛔ MOTIVO DE LA BAJA:
                                </div>
                                <div className="text-rose-900 font-medium text-[11px]">
                                  {dyn._decommission_reason || 'Sin motivo especificado'}
                                </div>
                                {dyn._decommission_date && (
                                  <div className="text-[10px] text-rose-700 pt-0.5">
                                    Fecha: {dyn._decommission_date}
                                    {dyn._decommission_by ? ` (${dyn._decommission_by})` : ''}
                                  </div>
                                )}
                              </div>
                            ) : activeAss?.employee ? (
                              <div className="bg-[#016098]/5 border border-[#016098]/20 p-2 rounded-lg">
                                <div className="font-bold text-[#016098] flex items-center space-x-1">
                                  <User className="w-3.5 h-3.5 text-[#016098]" />
                                  <span>{activeAss.employee.full_name}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  RUN: {activeAss.employee.rut_document}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">
                                Sin asignación activa
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination for Modal Data */}
            {filteredModalData.length > 0 && (
              <Pagination
                currentPage={modalPage}
                totalItems={filteredModalData.length}
                pageSize={modalPageSize}
                onPageChange={setModalPage}
                onPageSizeChange={setModalPageSize}
                pageSizeOptions={[5, 10, 15, 25, 50]}
                itemLabel="registros"
              />
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  onNavigate(modalType === 'employees' ? 'employees' : 'equipment');
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#016098] bg-[#016098]/10 hover:bg-[#016098]/20 rounded-xl transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <span>Ir a Gestión Completa de {modalType === 'employees' ? 'Funcionarios' : 'Equipos'}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
