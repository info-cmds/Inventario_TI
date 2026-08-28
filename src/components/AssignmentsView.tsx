'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Laptop,
  UserCheck,
  Calendar,
  User,
  FileText,
  CheckCircle2,
  Clock,
  Paperclip,
  Download,
  UploadCloud,
  File,
  Trash2,
  Wrench,
  XCircle,
} from 'lucide-react';
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
  userRole?: string;
  selectedSectorId?: string;
  selectedBranchId?: string;
}

export default function AssignmentsView({
  userRole,
  selectedSectorId,
  selectedBranchId,
}: AssignmentsViewProps) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<'all' | 'vigente' | 'finalizada'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Equipment History & Documents Modal State
  const [isEqHistoryModalOpen, setIsEqHistoryModalOpen] = useState(false);
  const [selectedEqHistory, setSelectedEqHistory] = useState<any>(null);
  const [historyActiveTab, setHistoryActiveTab] = useState<'timeline' | 'documents'>('timeline');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docNotes, setDocNotes] = useState('');
  const [docError, setDocError] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);

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

  const handleOpenEquipmentHistory = async (eq: any, initialTab: 'timeline' | 'documents' = 'timeline') => {
    if (!eq) return;
    setHistoryActiveTab(initialTab);
    setSelectedEqHistory(eq);
    setIsEqHistoryModalOpen(true);

    // Fetch freshest equipment data to ensure history_logs and attached_documents are up-to-date
    try {
      const res = await fetch(`/api/equipment/${eq.id}`);
      if (res.ok) {
        const freshEq = await res.json();
        setSelectedEqHistory(freshEq);
      }
    } catch (e) {
      console.error('Error refreshing equipment history:', e);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile || !selectedEqHistory) return;
    setDocError('');
    setUploadingDoc(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;

        const res = await fetch(`/api/equipment/${selectedEqHistory.id}/documents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: docFile.name,
            fileType: docFile.type,
            url: dataUrl,
            sizeBytes: docFile.size,
            notes: docNotes,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al adjuntar documento');

        setSelectedEqHistory(data.equipment);
        // Refresh local assignment equipment references
        setAssignments((prev) =>
          prev.map((a) =>
            a.equipment?.id === data.equipment.id ? { ...a, equipment: data.equipment } : a
          )
        );
        setDocFile(null);
        setDocNotes('');
      };
      reader.readAsDataURL(docFile);
    } catch (err: any) {
      setDocError(err.message);
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!selectedEqHistory || !confirm('¿Está seguro de eliminar este documento adjunto?')) return;
    try {
      const res = await fetch(`/api/equipment/${selectedEqHistory.id}/documents`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar documento');

      setSelectedEqHistory(data.equipment);
      setAssignments((prev) =>
        prev.map((a) =>
          a.equipment?.id === data.equipment.id ? { ...a, equipment: data.equipment } : a
        )
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'disponible':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#39BABD]/15 text-[#39BABD] border border-[#39BABD]/30 flex items-center space-x-1 w-fit">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Disponible</span>
          </span>
        );
      case 'asignado':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#016098]/15 text-[#016098] border border-[#016098]/30 flex items-center space-x-1 w-fit">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Asignado</span>
          </span>
        );
      case 'en_reparacion':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#F7A517]/15 text-[#F7A517] border border-[#F7A517]/30 flex items-center space-x-1 w-fit">
            <Wrench className="w-3.5 h-3.5" />
            <span>En Reparación</span>
          </span>
        );
      case 'dado_de_baja':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#EB567F]/15 text-[#EB567F] border border-[#EB567F]/30 flex items-center space-x-1 w-fit">
            <XCircle className="w-3.5 h-3.5" />
            <span>Dado de Baja</span>
          </span>
        );
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">{st}</span>;
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
            Registro auditable completo de entregas, devoluciones y trazabilidad total de equipos
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
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
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((a) => (
                <tr
                  key={a.id}
                  onDoubleClick={() => handleOpenEquipmentHistory(a.equipment, 'timeline')}
                  className="hover:bg-slate-50 cursor-pointer"
                  title="Doble clic para ver el historial y trazabilidad completa de auditoría de este equipo"
                >
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

                  <td className="py-3 px-4 text-right space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEquipmentHistory(a.equipment, 'timeline');
                      }}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      title="Ver Historial y Trazabilidad de Auditoría Completa del Equipo"
                    >
                      <History className="w-4 h-4 text-indigo-600" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEquipmentHistory(a.equipment, 'documents');
                      }}
                      className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer relative"
                      title="Ver y adjuntar documentos del equipo"
                    >
                      <Paperclip className="w-4 h-4 text-emerald-600" />
                      {(() => {
                        let docs: any[] = [];
                        try {
                          docs = JSON.parse(a.equipment?.attached_documents || '[]');
                        } catch (e) {}
                        return docs.length > 0 ? (
                          <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[9px] font-bold px-1 rounded-full">
                            {docs.length}
                          </span>
                        ) : null;
                      })()}
                    </button>
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

      {/* AUDIT EVENT HISTORY & TRACEABILITY MODAL FOR EQUIPMENT */}
      {isEqHistoryModalOpen && selectedEqHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-100 rounded-xl">
                  <History className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Trazabilidad y Auditoría del Equipo</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Asset Tag: <span className="font-mono font-bold text-[#016098]">{selectedEqHistory.asset_tag}</span> | Serie: <span className="font-mono font-bold">{selectedEqHistory.serial_number}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEqHistoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Equipment Summary Banner */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-900">{selectedEqHistory.type?.name}</span>{' '}
                <span className="text-[#F7A517] font-semibold">{selectedEqHistory.brand?.name ? `(${selectedEqHistory.brand.name})` : ''}</span>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Ubicación: <strong>{selectedEqHistory.branch?.name}</strong> {selectedEqHistory.department?.name ? `(${selectedEqHistory.department.name})` : '(Sin Depto)'}
                </div>
              </div>
              <div>
                {getStatusBadge(selectedEqHistory.status)}
              </div>
            </div>

            {/* Modal Tabs Header: Timeline vs Documents */}
            <div className="flex border-b border-slate-200 space-x-2">
              <button
                type="button"
                onClick={() => setHistoryActiveTab('timeline')}
                className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center space-x-1.5 ${
                  historyActiveTab === 'timeline'
                    ? 'border-[#016098] text-[#016098]'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Historial & Trazabilidad</span>
              </button>

              <button
                type="button"
                onClick={() => setHistoryActiveTab('documents')}
                className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center space-x-1.5 ${
                  historyActiveTab === 'documents'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Paperclip className="w-4 h-4" />
                <span>Documentos Adjuntos</span>
                {(() => {
                  let docs: any[] = [];
                  try {
                    docs = JSON.parse(selectedEqHistory.attached_documents || '[]');
                  } catch (e) {}
                  return (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                      {docs.length}
                    </span>
                  );
                })()}
              </button>
            </div>

            {/* TAB 1: Event Timeline */}
            {historyActiveTab === 'timeline' && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-700 text-xs flex items-center space-x-2">
                  <History className="w-4 h-4 text-[#016098]" />
                  <span>Historial Cronológico de Cambios e Intervenciones</span>
                </h4>

                {(() => {
                  let logs: any[] = [];
                  try {
                    logs = JSON.parse(selectedEqHistory.history_logs || '[]');
                  } catch (e) {}

                  if ((!Array.isArray(logs) || logs.length === 0) && selectedEqHistory.dynamic_values) {
                    try {
                      const dyn = JSON.parse(selectedEqHistory.dynamic_values || '{}');
                      if (Array.isArray(dyn._history_logs)) logs = dyn._history_logs;
                    } catch (e) {}
                  }

                  if (!Array.isArray(logs) || logs.length === 0) {
                    return (
                      <div className="p-6 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-slate-200">
                        Sin eventos de auditoría previa registrados para este equipo.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                      {logs.map((log: any, idx: number) => {
                        const isBaja = log.type === 'BAJA';
                        const isDisponible = log.type === 'DISPONIBLE';
                        const isCreacion = log.type === 'CREACION';
                        const isAsignacion = log.type === 'ASIGNACION';
                        const isDesasignacion = log.type === 'DESASIGNACION';
                        const isMantenimiento = log.type === 'MANTENIMIENTO';
                        const isUpgrade = log.type === 'UPGRADE';

                        return (
                          <div key={log.id || idx} className="relative flex items-start space-x-3 text-xs pl-2">
                            <div
                              className={`w-4 h-4 rounded-full border-2 mt-1 z-10 flex-shrink-0 ${
                                isBaja
                                  ? 'bg-rose-500 border-rose-200'
                                  : isDisponible
                                  ? 'bg-sky-500 border-sky-200'
                                  : isCreacion || isAsignacion
                                  ? 'bg-emerald-500 border-emerald-200'
                                  : isDesasignacion
                                  ? 'bg-amber-500 border-amber-200'
                                  : isMantenimiento || isUpgrade
                                  ? 'bg-amber-500 border-amber-200'
                                  : 'bg-[#016098] border-[#016098]/30'
                              }`}
                            />

                            <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                    isBaja
                                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                      : isDisponible
                                      ? 'bg-sky-100 text-sky-800 border border-sky-300'
                                      : isCreacion
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : isAsignacion
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : isDesasignacion
                                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                      : isMantenimiento || isUpgrade
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                      : 'bg-[#016098]/10 text-[#016098] border border-[#016098]/30'
                                  }`}
                                >
                                  {log.type || 'MODIFICACION'}
                                </span>

                                <span className="text-[10px] text-slate-500 font-mono font-semibold">
                                  🕒 {log.timestamp}
                                </span>
                              </div>

                              <div className="font-semibold text-slate-800 flex items-center justify-between">
                                <div>
                                  👤 Responsable: <strong className="text-[#016098]">{log.userName || 'Sistema'}</strong>
                                  {log.userEmail && <span className="text-[10px] text-slate-500 font-normal"> ({log.userEmail})</span>}
                                </div>
                              </div>

                              {log.details && (
                                <div className="text-[11px] text-slate-700 font-medium mt-0.5">
                                  {log.details}
                                </div>
                              )}

                              {log.reason && (
                                <div className={`p-2 rounded-lg text-[11px] font-bold mt-1 ${
                                  isDesasignacion
                                    ? 'bg-amber-50 border border-amber-300 text-amber-950'
                                    : isBaja
                                    ? 'bg-rose-100/80 border border-rose-300 text-rose-950'
                                    : 'bg-slate-100 border border-slate-300 text-slate-900'
                                }`}>
                                  📝 Motivo / Observación de Desasignación: <span className="font-semibold italic text-slate-900">{log.reason}</span>
                                </div>
                              )}

                              {Array.isArray(log.changes) && log.changes.length > 0 && (
                                <div className="pt-1.5 space-y-1">
                                  <span className="text-[10px] font-bold text-slate-600 block uppercase">Modificaciones Registradas:</span>
                                  <ul className="list-disc list-inside text-slate-700 font-medium space-y-0.5 pl-1">
                                    {log.changes.map((change: string, cIdx: number) => (
                                      <li key={cIdx} className="text-[11px]">
                                        {change}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* TAB 2: Attached Documents */}
            {historyActiveTab === 'documents' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-700 text-xs flex items-center space-x-2">
                    <Paperclip className="w-4 h-4 text-emerald-600" />
                    <span>Documentos Digitales del Equipo (Facturas, Garantías, Manuales, Actas)</span>
                  </h4>
                </div>

                {/* Upload Form */}
                {userRole !== 'LECTOR' && (
                  <form onSubmit={handleUploadDocument} className="bg-emerald-50/50 p-3.5 border border-emerald-200/80 rounded-xl space-y-3">
                    <h5 className="text-xs font-bold text-emerald-900 flex items-center space-x-1.5">
                      <UploadCloud className="w-4 h-4 text-emerald-600" />
                      <span>Adjuntar Nuevo Documento / Archivo</span>
                    </h5>

                    {docError && (
                      <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 text-[11px] rounded-lg font-semibold">
                        {docError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">Seleccionar Archivo (PDF, Imagen, Word, Excel, etc.) *</label>
                        <input
                          type="file"
                          required
                          onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                          className="w-full text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">Notas u Observaciones (Opcional)</label>
                        <input
                          type="text"
                          value={docNotes}
                          onChange={(e) => setDocNotes(e.target.value)}
                          placeholder="Ej: Factura de compra proveedor o póliza de garantía"
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={uploadingDoc || !docFile}
                        className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs disabled:opacity-50 flex items-center space-x-1 cursor-pointer"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>{uploadingDoc ? 'Subiendo...' : 'Adjuntar Documento'}</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* Document List */}
                {(() => {
                  let docs: any[] = [];
                  try {
                    docs = JSON.parse(selectedEqHistory.attached_documents || '[]');
                  } catch (e) {}

                  if (!Array.isArray(docs) || docs.length === 0) {
                    return (
                      <div className="p-6 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-slate-200">
                        No hay documentos ni archivos adjuntos para este equipo.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      {docs.map((doc: any) => {
                        const sizeKb = doc.sizeBytes ? Math.round(doc.sizeBytes / 1024) : 0;
                        const isPdf = doc.name.toLowerCase().endsWith('.pdf') || doc.fileType?.includes('pdf');
                        const isImage = doc.fileType?.includes('image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.name);

                        return (
                          <div key={doc.id} className="p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors flex items-center justify-between gap-3 shadow-2xs">
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className={`p-2.5 rounded-xl flex-shrink-0 ${isPdf ? 'bg-rose-100 text-rose-700' : isImage ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>
                                {isPdf ? <FileText className="w-5 h-5" /> : <File className="w-5 h-5" />}
                              </div>

                              <div className="min-w-0">
                                <h5 className="font-bold text-slate-900 text-xs truncate" title={doc.name}>
                                  {doc.name}
                                </h5>
                                <div className="text-[10px] text-slate-500 flex flex-wrap items-center gap-x-2 mt-0.5 font-medium">
                                  <span>📅 {doc.uploadedAt}</span>
                                  <span>👤 {doc.uploadedByName || 'Usuario'}</span>
                                  {sizeKb > 0 && <span className="font-mono">({sizeKb} KB)</span>}
                                </div>
                                {doc.notes && (
                                  <p className="text-[11px] text-slate-600 italic mt-0.5 truncate">
                                    📝 {doc.notes}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={doc.name}
                                className="px-2.5 py-1 bg-[#016098] hover:bg-[#014d7a] text-white font-bold text-[11px] rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                                title="Ver / Descargar archivo"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Ver / Descargar</span>
                              </a>

                              {userRole !== 'LECTOR' && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Eliminar documento"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsEqHistoryModalOpen(false)}
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
