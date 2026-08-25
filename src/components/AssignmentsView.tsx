'use client';

import React, { useState, useEffect } from 'react';
import { History, Search, Laptop, UserCheck, Calendar, User, FileText, CheckCircle2, Clock } from 'lucide-react';
import Pagination from './Pagination';

function formatDateTime(dateVal?: string | Date | null): string {
  if (!dateVal) return '-';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '-';
  const dateStr = d.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeStr = d.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${dateStr} ${timeStr} hrs`;
}

interface AssignmentsViewProps {
  selectedSectorId?: string;
  selectedBranchId?: string;
}

export default function AssignmentsView({
  selectedSectorId,
  selectedBranchId,
}: AssignmentsViewProps) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<'all' | 'vigente' | 'finalizada'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  useEffect(() => {
    loadAssignments();
  }, [selectedSectorId, selectedBranchId]);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedBranchId) {
        params.append('branchId', selectedBranchId);
      } else if (selectedSectorId) {
        params.append('sectorId', selectedSectorId);
      }
      const res = await fetch(`/api/assignments?${params.toString()}`);
      const data = await res.json();
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading assignments history:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = [...assignments]
    .sort(
      (a, b) =>
        new Date(b.createdAt || b.fecha_inicio).getTime() -
        new Date(a.createdAt || a.fecha_inicio).getTime()
    )
    .filter((a) => {
      const isVigente = !a.fecha_fin;
      if (filterState === 'vigente' && !isVigente) return false;
      if (filterState === 'finalizada' && isVigente) return false;

      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        a.equipment?.asset_tag?.toLowerCase().includes(q) ||
        a.equipment?.serial_number?.toLowerCase().includes(q) ||
        a.equipment?.type?.name?.toLowerCase().includes(q) ||
        a.equipment?.brand?.name?.toLowerCase().includes(q) ||
        a.equipment?.model?.name?.toLowerCase().includes(q) ||
        a.employee?.full_name?.toLowerCase().includes(q) ||
        a.employee?.rut_document?.toLowerCase().includes(q) ||
        a.assignedByUser?.name?.toLowerCase().includes(q)
      );
    });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Historial y Trazabilidad de Asignaciones</h1>
          <p className="text-xs text-slate-500">
            Registro auditable completo de entregas y devoluciones de equipos a funcionarios
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por Asset Tag, Serie, Marca, Modelo, Funcionario o Usuario..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none"
          />
        </div>

        <select
          value={filterState}
          onChange={(e) => setFilterState(e.target.value as any)}
          className="w-full sm:w-48 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none font-semibold text-slate-700"
        >
          <option value="all">Todas las Asignaciones</option>
          <option value="vigente">Solo Vigentes</option>
          <option value="finalizada">Solo Finalizadas (Histórico)</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="p-8 text-center text-slate-500 font-medium">Cargando historial de asignaciones...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Equipo (Asset Tag / Marca)</th>
                <th className="py-3 px-4">Funcionario Asignado</th>
                <th className="py-3 px-4">Fecha Inicio</th>
                <th className="py-3 px-4">Fecha Término</th>
                <th className="py-3 px-4">Asignado por</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4">Notas / Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="font-mono font-bold text-[#016098]">{a.equipment?.asset_tag}</div>
                    <div className="text-[10px] text-slate-500 font-semibold">
                      {a.equipment?.type?.name}{' '}
                      {a.equipment?.brand?.name && (
                        <span className="text-[#F7A517]"> - {a.equipment.brand.name}</span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 flex items-center space-x-1.5 flex-wrap gap-1">
                      <span>{a.employee?.full_name}</span>
                      {a.employee?.status === 'INACTIVO' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                          ⛔ INACTIVO
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ✅ ACTIVO
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      RUT: {a.employee?.rut_document} | {a.employee?.branch?.name}
                    </div>
                  </td>

                  <td className="py-3 px-4 font-medium text-slate-800">{formatDateTime(a.fecha_inicio)}</td>

                  <td className="py-3 px-4 font-medium text-slate-800">
                    {a.fecha_fin ? (
                      formatDateTime(a.fecha_fin)
                    ) : (
                      <span className="text-emerald-600 font-bold flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Actualmente Vigente</span>
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">{a.assignedByUser?.name || 'Sistema'}</div>
                    <div className="text-[10px] text-slate-400">{a.assignedByUser?.email}</div>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        !a.fecha_fin ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {!a.fecha_fin ? 'Vigente' : 'Finalizada'}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-xs max-w-xs">
                    {a.notes ? (
                      a.notes.includes('[INACTIVACIÓN FUNCIONARIO]') || a.notes.includes('[REACTIVACIÓN FUNCIONARIO]') ? (
                        <div className="p-1.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 font-semibold text-[11px]">
                          {a.notes}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">{a.notes}</span>
                      )
                    ) : (
                      <span className="text-slate-400 italic">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Bar */}
      {filtered.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="asignaciones"
        />
      )}
    </div>
  );
}
