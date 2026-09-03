'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  FileSpreadsheet,
  Search,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  History,
  UploadCloud,
  AlertTriangle,
  Laptop,
  Tag,
  Building2,
  X,
  UserX,
  Calendar,
} from 'lucide-react';
import { CSVImportRow, CSVImportResult } from '@/types';
import Pagination from './Pagination';

interface EmployeesViewProps {
  userRole: string;
  branches: any[];
  selectedSectorId?: string;
  selectedBranchId: string;
}

export function calculateRUNVerificationDigit(rutBody: string): string {
  const cleanBody = rutBody.replace(/[^0-9]/g, '');
  if (!cleanBody) return '';

  let sum = 0;
  let multiplier = 2;

  for (let i = cleanBody.length - 1; i >= 0; i--) {
    sum += parseInt(cleanBody.charAt(i), 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  if (remainder === 11) return '0';
  if (remainder === 10) return 'K';
  return remainder.toString();
}

export function formatDateTime(dateVal?: string | Date | null): string {
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

export default function EmployeesView({
  userRole,
  branches,
  selectedSectorId,
  selectedBranchId,
}: EmployeesViewProps) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartmentId, setFilterDepartmentId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Modals state
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  const [editingEmp, setEditingEmp] = useState<any>(null);
  const [selectedEmpDetail, setSelectedEmpDetail] = useState<any>(null);
  const [selectedEmpHistory, setSelectedEmpHistory] = useState<any>(null);
  const [isEmpHistoryModalOpen, setIsEmpHistoryModalOpen] = useState(false);

  // Decommission Employee Modal State (Dar de baja funcionario)
  const [isDecommissionEmpModalOpen, setIsDecommissionEmpModalOpen] = useState(false);
  const [decommissionEmp, setDecommissionEmp] = useState<any>(null);
  const [decommissionEmpReason, setDecommissionEmpReason] = useState('');
  const [decommissionEmpError, setDecommissionEmpError] = useState('');
  const [decommissionEmpSaving, setDecommissionEmpSaving] = useState(false);

  // Separated RUT fields (Cuerpo and Dígito Verificador separated)
  const [rutBody, setRutBody] = useState('');
  const [rutDv, setRutDv] = useState('');

  const [names, setNames] = useState('');
  const [paternalSurname, setPaternalSurname] = useState('');
  const [maternalSurname, setMaternalSurname] = useState('');
  const [email, setEmail] = useState('');
  const [position, setPosition] = useState('');
  const [empSectorId, setEmpSectorId] = useState('');
  const [empBranchId, setEmpBranchId] = useState('');
  const [empDeptId, setEmpDeptId] = useState('');
  const [empStatus, setEmpStatus] = useState('ACTIVO');

  // CSV Import State
  const [csvRawText, setCsvRawText] = useState('');
  const [csvParsedRows, setCsvParsedRows] = useState<CSVImportRow[]>([]);
  const [csvReport, setCsvReport] = useState<CSVImportResult | null>(null);
  const [importing, setImporting] = useState(false);

  const [error, setError] = useState('');

  // Bulk Department Assignment state
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [isBatchDeptModalOpen, setIsBatchDeptModalOpen] = useState(false);
  const [batchBranchId, setBatchBranchId] = useState('');
  const [batchDeptId, setBatchDeptId] = useState('');
  const [batchSaving, setBatchSaving] = useState(false);
  const [batchError, setBatchError] = useState('');

  const toggleSelectAll = () => {
    if (selectedEmpIds.length === employees.length) {
      setSelectedEmpIds([]);
    } else {
      setSelectedEmpIds(employees.map((e) => e.id));
    }
  };

  const toggleSelectEmp = (id: string) => {
    setSelectedEmpIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleOpenBatchDeptModal = () => {
    if (selectedEmpIds.length === 0) return;
    setBatchError('');
    const firstEmp = employees.find((e) => selectedEmpIds.includes(e.id));
    const bId = firstEmp?.branchId || selectedBranchId || branches[0]?.id || '';
    setBatchBranchId(bId);
    setBatchDeptId('');
    setIsBatchDeptModalOpen(true);
  };

  const handleRunBatchDeptAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmpIds.length === 0) return;
    setBatchSaving(true);
    setBatchError('');

    try {
      const res = await fetch('/api/employees/batch-department', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeIds: selectedEmpIds,
          branchId: batchBranchId || undefined,
          departmentId: batchDeptId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al asignar departamento en lote');

      setIsBatchDeptModalOpen(false);
      setSelectedEmpIds([]);
      loadEmployees();
      alert(`¡Éxito! ${data.message || 'Departamento asignado a los funcionarios seleccionados.'}`);
    } catch (err: any) {
      setBatchError(err.message);
    } finally {
      setBatchSaving(false);
    }
  };

  // Standalone Assignment modal state inside EmployeesView
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningEmp, setAssigningEmp] = useState<any>(null);
  const [availableEquipment, setAvailableEquipment] = useState<any[]>([]);
  const [selectedEqIdForEmp, setSelectedEqIdForEmp] = useState('');
  const [eqSearchQueryForEmp, setEqSearchQueryForEmp] = useState('');
  const [assignNotesForEmp, setAssignNotesForEmp] = useState('');
  const [assigningLoading, setAssigningLoading] = useState(false);
  const [assigningError, setAssigningError] = useState('');

  const handleOpenAssignModalForEmp = async (emp: any) => {
    setAssigningEmp(emp);
    setAssigningError('');
    setSelectedEqIdForEmp('');
    setEqSearchQueryForEmp('');
    setAssignNotesForEmp('');
    setIsAssignModalOpen(true);

    try {
      const res = await fetch('/api/equipment?status=disponible');
      const data = await res.json();
      setAvailableEquipment(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error fetching available equipment:', e);
    }
  };

  const handleRunAssignmentForEmp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningEmp || !selectedEqIdForEmp) return;
    setAssigningError('');
    setAssigningLoading(true);

    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentId: selectedEqIdForEmp,
          employeeId: assigningEmp.id,
          notes: assignNotesForEmp,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al asignar equipo');

      setIsAssignModalOpen(false);
      if (isDetailModalOpen) setIsDetailModalOpen(false);
      loadEmployees();
      alert(`¡Éxito! Equipo con Asset Tag '${data.assignment?.equipment?.asset_tag || 'asignado'}' asignado a ${assigningEmp.full_name}. Se han actualizado la sucursal y departamento del equipo a los parámetros del funcionario.`);
    } catch (err: any) {
      setAssigningError(err.message);
    } finally {
      setAssigningLoading(false);
    }
  };

  const filteredAvailableEquipment = availableEquipment.filter((eq) => {
    if (!eqSearchQueryForEmp.trim()) return true;
    const q = eqSearchQueryForEmp.trim().toUpperCase();
    return (
      eq.asset_tag?.toUpperCase().includes(q) ||
      eq.serial_number?.toUpperCase().includes(q) ||
      eq.type?.name?.toUpperCase().includes(q) ||
      eq.brand?.name?.toUpperCase().includes(q) ||
      eq.model?.name?.toUpperCase().includes(q)
    );
  });

  const [allBranches, setAllBranches] = useState<any[]>([]);

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce search query input by 250ms to prevent flooding API on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load static catalogs ONCE on mount
  useEffect(() => {
    loadDepartments();
    loadSectors();
    loadAllBranches();
  }, []);

  // Re-fetch employees ONLY when sector, branch, department or debounced search query changes
  useEffect(() => {
    setCurrentPage(1);
    loadEmployees();
  }, [selectedSectorId, selectedBranchId, filterDepartmentId, debouncedSearchQuery]);

  const loadAllBranches = async () => {
    try {
      const res = await fetch('/api/branches');
      const data = await res.json();
      setAllBranches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading all branches:', err);
    }
  };

  const branchesList = allBranches.length > 0 ? allBranches : branches;

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedBranchId) {
        params.append('branchId', selectedBranchId);
      } else if (selectedSectorId) {
        params.append('sectorId', selectedSectorId);
      }
      if (filterDepartmentId) params.append('departmentId', filterDepartmentId);
      if (debouncedSearchQuery) params.append('query', debouncedSearchQuery);

      const res = await fetch(`/api/employees?${params.toString()}`);
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      setDepartments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading departments:', err);
    }
  };

  const loadSectors = async () => {
    try {
      const res = await fetch('/api/sectors');
      const data = await res.json();
      setSectors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading sectors:', err);
    }
  };

  const filteredDeptsForBranch = departments.filter(
    (d) => !empBranchId || d.branchId === empBranchId
  );

  const handleTextOnlyChange = (val: string, setter: (v: string) => void) => {
    const cleanText = val.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    setter(cleanText.toUpperCase());
  };

  const handleOpenEmpModal = (emp?: any) => {
    setError('');
    if (emp) {
      setEditingEmp(emp);
      const rutStr = emp.rut_document || '';
      if (rutStr.includes('-')) {
        const parts = rutStr.split('-');
        setRutBody(parts[0] || '');
        setRutDv(parts[1] || '');
      } else if (rutStr.length > 1) {
        setRutBody(rutStr.slice(0, -1));
        setRutDv(rutStr.slice(-1));
      } else {
        setRutBody(rutStr);
        setRutDv('');
      }

      setNames(emp.names || emp.full_name || '');
      setPaternalSurname(emp.paternal_surname || '');
      setMaternalSurname(emp.maternal_surname || '');
      setEmail(emp.email);
      setPosition(emp.position);
      const currentBranch = branchesList.find((b) => b.id === emp.branchId);
      const secId = currentBranch?.sectorId || currentBranch?.sector?.id || emp.branch?.sectorId || emp.branch?.sector?.id || '';
      setEmpSectorId(secId);
      setEmpBranchId(emp.branchId);
      setEmpDeptId(emp.departmentId);
      setEmpStatus(emp.status);
    } else {
      setEditingEmp(null);
      setRutBody('');
      setRutDv('');
      setNames('');
      setPaternalSurname('');
      setMaternalSurname('');
      setEmail('');
      setPosition('');
      const currentBranch = branchesList.find((b) => b.id === selectedBranchId) || branchesList[0];
      const secId = currentBranch?.sectorId || currentBranch?.sector?.id || sectors[0]?.id || '';
      setEmpSectorId(secId);
      setEmpBranchId(currentBranch?.id || '');
      const depts = departments.filter((d) => d.branchId === currentBranch?.id);
      setEmpDeptId(depts[0]?.id || '');
      setEmpStatus('ACTIVO');
    }
    setIsEmpModalOpen(true);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanBody = rutBody.trim().replace(/\D/g, '').slice(0, 8);
    const cleanDv = rutDv.trim().toUpperCase().slice(0, 1);

    if (!cleanBody || !cleanDv) {
      setError('Debe ingresar tanto el número de RUT como el dígito verificador.');
      return;
    }

    const fullRutDocument = `${cleanBody}-${cleanDv}`;

    try {
      const url = editingEmp ? `/api/employees/${editingEmp.id}` : '/api/employees';
      const method = editingEmp ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rut_document: fullRutDocument,
          names,
          paternal_surname: paternalSurname,
          maternal_surname: maternalSurname,
          email,
          position,
          branchId: empBranchId,
          departmentId: empDeptId,
          status: empStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar funcionario');

      setIsEmpModalOpen(false);
      loadEmployees();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleOpenDecommissionEmpModal = (emp: any) => {
    setDecommissionEmp(emp);
    setDecommissionEmpReason('');
    setDecommissionEmpError('');
    setIsDecommissionEmpModalOpen(true);
  };

  const handleConfirmDecommissionEmp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decommissionEmp || !decommissionEmpReason.trim()) return;
    setDecommissionEmpSaving(true);
    setDecommissionEmpError('');

    try {
      const res = await fetch(`/api/employees/${decommissionEmp.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: decommissionEmpReason.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al dar de baja funcionario');

      setIsDecommissionEmpModalOpen(false);
      loadEmployees();
      alert(`¡Éxito! El funcionario ${decommissionEmp.full_name} fue dado de baja. Se registró la autoría completa (usuario, fecha/hora) y el motivo justificado en la trazabilidad.`);
    } catch (err: any) {
      setDecommissionEmpError(err.message);
    } finally {
      setDecommissionEmpSaving(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('¿Está seguro de deshabilitar este funcionario? No se eliminará permanentemente de la base de datos, sino que pasará a estado INACTIVO registrando la trazabilidad en el historial.')) return;
    try {
      const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al deshabilitar');
      loadEmployees();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // CSV Parsing
  const handleCsvTextChange = (text: string) => {
    setCsvRawText(text);
    setCsvReport(null);
    parseCsv(text);
  };

  const parseCsv = (text: string) => {
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) {
      setCsvParsedRows([]);
      return;
    }

    const hasHeader = lines[0].toLowerCase().includes('rut') || lines[0].toLowerCase().includes('nombre');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const rows: CSVImportRow[] = dataLines.map((line) => {
      const cols = line.split(/[,;\t]/).map((c) => c.trim().replace(/^["']|["']$/g, ''));
      return {
        rut_document: cols[0] || '',
        full_name: cols[1] || '',
        email: cols[2] || '',
        position: cols[3] || 'Funcionario',
        branch_code_or_name: cols[4] || '',
        department_name: cols[5] || '',
      };
    });

    setCsvParsedRows(rows);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleCsvTextChange(content);
    };
    reader.readAsText(file);
  };

  const handleRunImport = async () => {
    if (csvParsedRows.length === 0) return;
    setImporting(true);
    setCsvReport(null);
    try {
      const res = await fetch('/api/employees/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: csvParsedRows }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al importar CSV');

      setCsvReport(data.report);
      loadEmployees();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setImporting(false);
    }
  };

  const departmentStats = React.useMemo(() => {
    const counts: { [key: string]: { name: string; count: number; deptId: string } } = {};
    let totalCount = 0;

    employees.forEach((emp) => {
      totalCount += 1;
      const deptName = emp.department?.name || 'Sin Depto Asignado';
      const deptId = emp.departmentId || 'unassigned';
      if (!counts[deptName]) {
        counts[deptName] = { name: deptName, count: 0, deptId };
      }
      counts[deptName].count += 1;
    });

    const sorted = Object.values(counts).sort((a, b) => b.count - a.count);
    return { sorted, totalCount };
  }, [employees]);

  return (
    <div className="space-y-6">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Gestión de Funcionarios</h1>
          <p className="text-xs text-slate-500">
            Administra el personal activo con campos independientes para Número de RUN y Dígito Verificador
          </p>
        </div>

        {userRole !== 'LECTOR' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setCsvRawText('');
                setCsvParsedRows([]);
                setCsvReport(null);
                setIsCsvModalOpen(true);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center space-x-1.5 border border-slate-200"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#F7A517]" />
              <span>Importación Masiva CSV</span>
            </button>

            <button
              onClick={() => handleOpenEmpModal()}
              className="px-4 py-2 text-xs font-bold text-white bg-[#016098] hover:bg-[#014d7a] rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4 text-[#39BABD]" />
              <span>Nuevo Funcionario</span>
            </button>
          </div>
        )}
      </div>

      {/* Main 2-Column Grid: Left (75%) Table & Left Controls, Right (25%) Department Distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left Column (xl:col-span-3) */}
        <div className="xl:col-span-3 space-y-6">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por RUN, Nombre completo, Email o Cargo..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none"
              />
            </div>

            <div className="w-full md:w-48">
              <select
                value={filterDepartmentId}
                onChange={(e) => setFilterDepartmentId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none font-semibold text-slate-800"
              >
                <option value="">Todos los Departamentos</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.branch?.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedEmpIds.length > 0 && (
            <div className="bg-[#016098]/10 border border-[#016098]/30 p-3 rounded-2xl flex items-center justify-between shadow-xs">
              <div className="flex items-center space-x-2 text-[#016098] font-bold text-xs">
                <span>🏷️</span>
                <span>{selectedEmpIds.length} funcionario(s) seleccionado(s)</span>
              </div>
              <div className="flex items-center space-x-2">
                {userRole !== 'LECTOR' && (
                  <button
                    onClick={handleOpenBatchDeptModal}
                    className="px-3.5 py-1.5 bg-[#016098] hover:bg-[#014d7a] text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Building2 className="w-4 h-4 text-[#39BABD]" />
                    <span>Asignar Departamento en Lote</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedEmpIds([])}
                  className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Deseleccionar
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="p-8 text-center text-slate-500 font-medium">Cargando funcionarios...</div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={employees.length > 0 && selectedEmpIds.length === employees.length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-slate-300 text-[#016098] focus:ring-[#016098] cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4">RUN / Documento</th>
                    <th className="py-3 px-4">Nombre Completo</th>
                    <th className="py-3 px-4">Sector Asignado</th>
                    <th className="py-3 px-4">Sucursal & Departamento</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4">Equipos Asignados Actuales</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {employees
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((emp) => {
                    const isInactive = emp.status === 'INACTIVO';
                    const activeAssignments = emp.assignments?.filter((a: any) => !a.fecha_fin) || [];
                    return (
                      <tr
                        key={emp.id}
                        className={
                          isInactive
                            ? 'bg-rose-100/70 hover:bg-rose-100/90 border-l-4 border-l-rose-600 transition-colors'
                            : 'hover:bg-slate-50'
                        }
                      >
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedEmpIds.includes(emp.id)}
                            onChange={() => toggleSelectEmp(emp.id)}
                            className="w-4 h-4 rounded border-slate-300 text-[#016098] focus:ring-[#016098] cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{emp.rut_document}</td>
                        <td className="py-3 px-4">
                          <div className={`font-bold ${isInactive ? 'text-rose-950 font-extrabold' : 'text-slate-900'}`}>
                            {emp.full_name}
                          </div>
                          <div className="text-[10px] text-slate-500 flex flex-wrap items-center gap-x-1">
                            <span>{emp.email ? emp.email : <span className="italic text-slate-400">Sin correo</span>}</span>
                            {emp.createdAt && (
                              <span className="text-[9px] text-slate-400 font-medium" title={`Fecha de Creación: ${formatDateTime(emp.createdAt)}`}>
                                • Creado: {formatDateTime(emp.createdAt).split(' ')[0]}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {emp.branch?.sector?.name?.toUpperCase().includes('EDUCAC') ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#016098]/10 text-[#016098] border border-[#016098]/30 inline-flex items-center space-x-1">
                              <span>🏛️</span>
                              <span>Educación</span>
                            </span>
                          ) : emp.branch?.sector?.name?.toUpperCase().includes('SALUD') ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center space-x-1">
                              <span>🏥</span>
                              <span>Salud</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300 inline-flex items-center space-x-1">
                              <span>🏢</span>
                              <span>{emp.branch?.sector?.name || 'Casa Central'}</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#016098]">{emp.branch?.name}</div>
                          <div className="text-[11px] font-medium text-slate-700">
                            {emp.department?.name || <span className="text-slate-400 italic font-semibold">Sin Depto Asignado</span>}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isInactive ? (
                            <div className="flex flex-col items-center">
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-600 text-white border border-rose-700 inline-flex items-center space-x-1 shadow-xs">
                                <span>⛔</span>
                                <span>DADO DE BAJA</span>
                              </span>
                              {(() => {
                                let logs: any[] = [];
                                try { logs = JSON.parse(emp.history_logs || '[]'); } catch(e) {}
                                const bajaLog = logs.find((l: any) => l.type === 'BAJA');
                                if (!bajaLog) return null;
                                return (
                                  <div className="mt-1.5 text-[10px] text-rose-950 bg-rose-200/90 p-1.5 rounded-lg border border-rose-300 text-left w-full space-y-0.5 font-medium shadow-2xs">
                                    <div className="font-bold text-rose-900 flex items-center space-x-1">
                                      <span>👤 Dado de baja por:</span>
                                      <span className="text-slate-900">{bajaLog.userName || 'Sistema'}</span>
                                    </div>
                                    {bajaLog.timestamp && (
                                      <div className="text-[9px] text-slate-700 font-mono">
                                        🕒 {bajaLog.timestamp}
                                      </div>
                                    )}
                                    {bajaLog.reason && (
                                      <div className="text-[10px] text-rose-900 font-semibold italic line-clamp-2" title={bajaLog.reason}>
                                        Motivo: {bajaLog.reason}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center space-x-1">
                              <span>✅</span>
                              <span>ACTIVO</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {activeAssignments.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {activeAssignments.map((a: any) => (
                                <span
                                  key={a.id}
                                  className="px-2 py-1 bg-[#016098]/10 border border-[#016098]/30 rounded-lg text-[11px] font-bold text-[#016098] flex items-center space-x-1"
                                  title={`${a.equipment?.type?.name} SN: ${a.equipment?.serial_number}`}
                                >
                                  <Laptop className="w-3 h-3" />
                                  <span>{a.equipment?.asset_tag}</span>
                                  <span className="text-slate-500 font-normal text-[10px]">
                                    ({a.equipment?.type?.name})
                                  </span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[#94a3b8] italic">Sin equipos asignados</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right space-x-1">
                          {/* Event History Button */}
                          <button
                            onClick={() => {
                              setSelectedEmpHistory(emp);
                              setIsEmpHistoryModalOpen(true);
                            }}
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg cursor-pointer"
                            title="Ver Trazabilidad y Eventos del Funcionario (Quién y qué se modificó)"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedEmpDetail(emp);
                              setIsDetailModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-[#016098] hover:bg-slate-100 rounded-lg cursor-pointer"
                            title="Ver detalle e historial de equipos"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {userRole !== 'LECTOR' && (
                            <>
                              <button
                                onClick={() => handleOpenAssignModalForEmp(emp)}
                                className="px-2.5 py-1 bg-[#016098] text-white font-bold text-[11px] rounded-lg hover:bg-[#014d7a] transition-colors inline-flex items-center space-x-1 cursor-pointer"
                                title="Asignar equipo por Asset Tag a este funcionario"
                              >
                                <Laptop className="w-3.5 h-3.5 text-[#39BABD]" />
                                <span>Asignar</span>
                              </button>
                              <button
                                onClick={() => handleOpenEmpModal(emp)}
                                className="p-1.5 text-slate-500 hover:text-[#016098] hover:bg-slate-100 rounded-lg cursor-pointer"
                                title="Editar funcionario"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenDecommissionEmpModal(emp)}
                                className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-100 rounded-lg cursor-pointer"
                                title="Dar de baja funcionario (Pasar a INACTIVO con justificación)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Bar */}
          {employees.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={employees.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemLabel="funcionarios"
            />
          )}
        </div>

        {/* Right Column: Idea 1 - Distribución por Departamento (xl:col-span-1) */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 sticky top-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-[#016098]" />
                <h2 className="font-bold text-slate-800 text-sm">Distribución por Departamento</h2>
              </div>
              <span className="text-[11px] font-extrabold text-[#016098] bg-[#016098]/10 px-2.5 py-0.5 rounded-full border border-[#016098]/20">
                {departmentStats.sorted.length} Áreas
              </span>
            </div>

            <p className="text-[11px] text-slate-500 font-medium">
              Haz clic en cualquier área para filtrar la tabla de funcionarios:
            </p>

            {filterDepartmentId && (
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-xs font-semibold text-amber-900 shadow-2xs">
                <span className="truncate max-w-[150px]">Filtro activo</span>
                <button
                  onClick={() => setFilterDepartmentId('')}
                  className="px-2 py-1 bg-amber-200 hover:bg-amber-300 rounded-lg text-[10px] font-extrabold text-amber-950 transition-colors cursor-pointer"
                >
                  Limpiar Filtro
                </button>
              </div>
            )}

            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {departmentStats.sorted.map((dept, idx) => {
                const percentage =
                  departmentStats.totalCount > 0
                    ? Math.round((dept.count / departmentStats.totalCount) * 100)
                    : 0;
                const isSelected = filterDepartmentId === dept.deptId && dept.deptId !== 'unassigned';

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (dept.deptId !== 'unassigned') {
                        setFilterDepartmentId(filterDepartmentId === dept.deptId ? '' : dept.deptId);
                      }
                    }}
                    className={`space-y-1.5 p-2.5 rounded-xl transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#016098]/10 border-[#016098] shadow-xs'
                        : 'hover:bg-slate-50 border-slate-100 hover:border-slate-200'
                    }`}
                    title={`Clic para ${isSelected ? 'quitar filtro' : 'filtrar tabla por'} ${dept.name}`}
                  >
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-800 truncate max-w-[150px]" title={dept.name}>
                        {dept.name}
                      </span>
                      <span className="text-[#016098] font-extrabold text-[11px]">
                        {dept.count} <span className="text-slate-400 font-semibold">({percentage}%)</span>
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
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
        </div>
      </div>

      {/* Employee Form Modal with SEPARATED RUT BODY AND DV FIELDS */}
      {isEmpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-slate-800 text-lg">
              {editingEmp ? 'Editar Funcionario' : 'Nuevo Funcionario'}
            </h3>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveEmployee} className="space-y-3">
              {/* SEPARATED RUN INPUT FIELDS WITH AUTO-CALCULATED DV */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>RUN Funcionario (Número y DV) *</span>
                  <span className="text-[10px] text-[#39BABD] font-bold">✨ DV Autocalculado</span>
                </label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      required
                      maxLength={8}
                      value={rutBody}
                      onChange={(e) => {
                        const cleanVal = e.target.value.replace(/\D/g, '');
                        setRutBody(cleanVal);
                        if (cleanVal.length >= 6) {
                          setRutDv(calculateRUNVerificationDigit(cleanVal));
                        }
                      }}
                      placeholder="Ej: 16468798"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none font-mono uppercase"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Cuerpo del RUN (sin puntos)</span>
                  </div>

                  <span className="text-slate-400 font-bold text-lg mb-4">-</span>

                  <div className="w-20">
                    <input
                      type="text"
                      maxLength={1}
                      value={rutDv}
                      onChange={(e) => setRutDv(e.target.value.replace(/[^0-9kK]/g, '').toUpperCase())}
                      placeholder="8"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none font-mono uppercase text-center font-bold text-[#016098] bg-slate-50"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block text-center">DV</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombres (Solo texto)</label>
                <input
                  type="text"
                  required
                  value={names}
                  onChange={(e) => handleTextOnlyChange(e.target.value, setNames)}
                  placeholder="Ej: CARLOS ALBERTO"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none font-bold uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Apellido Paterno (Solo texto)</label>
                  <input
                    type="text"
                    required
                    value={paternalSurname}
                    onChange={(e) => handleTextOnlyChange(e.target.value, setPaternalSurname)}
                    placeholder="Ej: MENDOZA"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Apellido Materno (Solo texto)</label>
                  <input
                    type="text"
                    value={maternalSurname}
                    onChange={(e) => handleTextOnlyChange(e.target.value, setMaternalSurname)}
                    placeholder="Ej: ROJAS"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none font-bold uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico (Opcional)</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toUpperCase())}
                  placeholder="CARLOS.MENDOZA@CMDS.CL (OPCIONAL)"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none font-bold uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cargo / Puesto</label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value.toUpperCase())}
                  placeholder="Ej: ESPECIALISTA TI"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none font-bold uppercase"
                />
              </div>

              {/* Sector Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Sector Asignado *</span>
                  {userRole !== 'SUPERADMIN' ? (
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-bold border border-amber-200">
                      🔒 Solo SuperAdmin puede cambiar el Sector
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold border border-emerald-200">
                      ✏️ Edición de Sector Habilitada (SuperAdmin)
                    </span>
                  )}
                </label>
                <select
                  disabled={userRole !== 'SUPERADMIN'}
                  value={empSectorId}
                  onChange={(e) => {
                    const newSecId = e.target.value;
                    setEmpSectorId(newSecId);
                    const filteredBranchesForSec = branchesList.filter(
                      (b) => !newSecId || b.sectorId === newSecId || b.sector?.id === newSecId
                    );
                    const newBranchId = filteredBranchesForSec[0]?.id || '';
                    setEmpBranchId(newBranchId);
                    const newDepts = departments.filter((d) => d.branchId === newBranchId);
                    setEmpDeptId(newDepts[0]?.id || '');
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none font-bold text-[#016098] disabled:bg-slate-100 disabled:text-slate-500 cursor-pointer"
                >
                  <option value="">-- Seleccionar Sector --</option>
                  {sectors.map((s) => (
                    <option key={s.id} value={s.id}>
                      Sector {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sucursal / Establecimiento</label>
                  <select
                    value={empBranchId}
                    onChange={(e) => {
                      setEmpBranchId(e.target.value);
                      const depts = departments.filter((d) => d.branchId === e.target.value);
                      setEmpDeptId(depts[0]?.id || '');
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none"
                  >
                    {branchesList
                      .filter((b) => !empSectorId || b.sectorId === empSectorId || b.sector?.id === empSectorId)
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Departamento (Opcional)</label>
                  <select
                    value={empDeptId}
                    onChange={(e) => setEmpDeptId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none"
                  >
                    <option value="">General / Administración</option>
                    {filteredDeptsForBranch.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Estado</label>
                <select
                  value={empStatus}
                  onChange={(e) => setEmpStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none"
                >
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="INACTIVO">INACTIVO</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEmpModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#016098] hover:bg-[#014d7a] rounded-xl shadow-xs transition-all"
                >
                  Guardar Funcionario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
              <div className="p-2 bg-[#F7A517]/10 rounded-xl">
                <FileSpreadsheet className="w-6 h-6 text-[#F7A517]" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Importación Masiva de Funcionarios en CSV</h3>
                <p className="text-xs text-slate-500">Formato: RUT, Nombre Completo, Email, Cargo, Sucursal, Departamento</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Cargar Archivo CSV o Pegar Texto</label>
                <label className="cursor-pointer text-xs font-bold text-[#016098] hover:underline flex items-center space-x-1">
                  <UploadCloud className="w-4 h-4" />
                  <span>Subir archivo .csv</span>
                  <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <textarea
                rows={5}
                value={csvRawText}
                onChange={(e) => handleCsvTextChange(e.target.value)}
                placeholder="RUT,Nombre Completo,Email,Cargo,Sucursal,Departamento&#10;16468798-8,Gonzalo Perez,gonzalo@empresa.com,Analista,A-12,General"
                className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none"
              />
            </div>

            {csvParsedRows.length > 0 && !csvReport && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 flex justify-between">
                  <span>Previsualización ({csvParsedRows.length} registros detectados)</span>
                  <span className="text-[#39BABD]">Listo para procesar</span>
                </div>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                      <tr>
                        <th className="p-2">RUN</th>
                        <th className="p-2">Nombre</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Cargo</th>
                        <th className="p-2">Sucursal</th>
                        <th className="p-2">Depto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {csvParsedRows.map((r, i) => (
                        <tr key={i}>
                          <td className="p-2 font-mono">{r.rut_document}</td>
                          <td className="p-2">{r.full_name}</td>
                          <td className="p-2">{r.email}</td>
                          <td className="p-2">{r.position}</td>
                          <td className="p-2">{r.branch_code_or_name}</td>
                          <td className="p-2">{r.department_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {csvReport && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 max-h-[60vh] overflow-y-auto">
                <h4 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Resultado Detallado de la Importación Masiva</span>
                </h4>

                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-2.5 bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold rounded-xl">
                    ✅ Creados: {csvReport.createdCount}
                  </div>
                  <div className="p-2.5 bg-amber-100 border border-amber-300 text-amber-900 font-bold rounded-xl">
                    ⚠️ Omitidos (Existentes): {csvReport.omittedCount}
                  </div>
                  <div className="p-2.5 bg-rose-100 border border-rose-300 text-rose-900 font-bold rounded-xl">
                    ❌ Fallidos (Errores): {csvReport.failedCount}
                  </div>
                </div>

                {/* Display Failed Items Breakdown with Causa Exacta del Error */}
                {csvReport.failed && csvReport.failed.length > 0 && (
                  <div className="space-y-2 border border-rose-200 bg-rose-50/70 rounded-xl p-3">
                    <div className="font-bold text-rose-800 text-xs flex items-center space-x-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Registros Fallidos y Causa Específica del Error ({csvReport.failed.length})</span>
                    </div>
                    <div className="max-h-48 overflow-y-auto divide-y divide-rose-200 border border-rose-200 rounded-lg bg-white">
                      {csvReport.failed.map((f: any, idx: number) => (
                        <div key={idx} className="p-2.5 text-xs space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold font-mono text-rose-900">{f.rut}</span>
                            <span className="font-semibold text-slate-700">{f.name}</span>
                          </div>
                          <div className="text-[11px] text-rose-700 font-medium bg-rose-50 p-1.5 rounded-md border border-rose-200">
                            🚫 {f.error}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Display Omitted Items Breakdown */}
                {csvReport.omitted && csvReport.omitted.length > 0 && (
                  <div className="space-y-2 border border-amber-200 bg-amber-50/70 rounded-xl p-3">
                    <div className="font-bold text-amber-800 text-xs flex items-center space-x-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Registros Omitidos por Duplicidad ({csvReport.omitted.length})</span>
                    </div>
                    <div className="max-h-40 overflow-y-auto divide-y divide-amber-200 border border-amber-200 rounded-lg bg-white">
                      {csvReport.omitted.map((o: any, idx: number) => (
                        <div key={idx} className="p-2.5 text-xs space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold font-mono text-amber-900">{o.rut}</span>
                            <span className="font-semibold text-slate-700">{o.name}</span>
                          </div>
                          <div className="text-[11px] text-amber-800 font-medium bg-amber-50 p-1.5 rounded-md border border-amber-200">
                            ⚠️ {o.reason}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCsvModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cerrar
              </button>

              {csvParsedRows.length > 0 && !csvReport && (
                <button
                  type="button"
                  onClick={handleRunImport}
                  disabled={importing}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#016098] hover:bg-[#014d7a] rounded-xl flex items-center space-x-2"
                >
                  <span>{importing ? 'Procesando...' : 'Iniciar Importación'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Employee Detail Modal */}
      {isDetailModalOpen && selectedEmpDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{selectedEmpDetail.full_name}</h3>
                <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2">
                  <span>RUN: <strong className="font-mono">{selectedEmpDetail.rut_document}</strong></span>
                  <span>|</span>
                  <span>{selectedEmpDetail.position}</span>
                  <span>|</span>
                  <span>{selectedEmpDetail.branch?.name}</span>
                  {selectedEmpDetail.createdAt && (
                    <>
                      <span>|</span>
                      <span className="font-semibold text-emerald-800 flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-emerald-600 inline" />
                        <span>Fecha Creación: {formatDateTime(selectedEmpDetail.createdAt)}</span>
                      </span>
                    </>
                  )}
                </p>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-slate-700 text-xs flex items-center space-x-2">
                <History className="w-4 h-4 text-[#016098]" />
                <span>Equipos Asignados e Historial Completo</span>
              </h4>

              {selectedEmpDetail.assignments && selectedEmpDetail.assignments.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Asset Tag</th>
                        <th className="p-2.5">Tipo & Marca / Modelo</th>
                        <th className="p-2.5">Serie</th>
                        <th className="p-2.5">Fecha Asignación</th>
                        <th className="p-2.5">Fecha Término</th>
                        <th className="p-2.5 text-center">Estado</th>
                        <th className="p-2.5">Notas / Trazabilidad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[...selectedEmpDetail.assignments]
                        .sort((a: any, b: any) => new Date(b.createdAt || b.fecha_inicio).getTime() - new Date(a.createdAt || a.fecha_inicio).getTime())
                        .map((a: any) => (
                        <tr key={a.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold font-mono text-[#016098]">{a.equipment?.asset_tag}</td>
                          <td className="p-2.5 font-medium">
                            <div>{a.equipment?.type?.name}</div>
                            {a.equipment?.brand?.name && (
                              <div className="text-[10px] text-[#F7A517] font-semibold">
                                {a.equipment.brand.name} {a.equipment?.model?.name ? `(${a.equipment.model.name})` : ''}
                              </div>
                            )}
                          </td>
                          <td className="p-2.5 font-mono text-slate-500">{a.equipment?.serial_number}</td>
                          <td className="p-2.5 font-medium text-slate-800">{formatDateTime(a.fecha_inicio)}</td>
                          <td className="p-2.5 font-medium text-slate-800">
                            {a.fecha_fin ? formatDateTime(a.fecha_fin) : <span className="text-emerald-700 font-bold">Actualmente Vigente</span>}
                          </td>
                          <td className="p-2.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                !a.fecha_fin
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {!a.fecha_fin ? 'Vigente' : 'Finalizada'}
                            </span>
                          </td>
                          <td className="p-2.5 text-xs max-w-xs">
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
              ) : (
                <p className="text-xs text-slate-500 italic p-4 text-center bg-slate-50 rounded-xl">
                  Este funcionario no registra historial de equipos asignados.
                </p>
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              {userRole !== 'LECTOR' && (
                <button
                  type="button"
                  onClick={() => handleOpenAssignModalForEmp(selectedEmpDetail)}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-[#016098] hover:bg-[#014d7a] rounded-xl flex items-center space-x-1.5 cursor-pointer"
                >
                  <Laptop className="w-4 h-4 text-[#39BABD]" />
                  <span>+ Asignar Equipo por Asset Tag</span>
                </button>
              )}
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Equipment Modal inside Employees Module */}
      {isAssignModalOpen && assigningEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Asignar Equipo por Asset Tag</h3>
                <p className="text-xs text-slate-500">
                  Seleccione un equipo disponible para asignarlo a <strong className="text-[#016098]">{assigningEmp.full_name}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {assigningError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold">
                {assigningError}
              </div>
            )}

            <form onSubmit={handleRunAssignmentForEmp} className="space-y-4">
              {/* Employee Summary Card */}
              <div className="p-3 bg-[#016098]/5 border border-[#016098]/20 rounded-xl space-y-1 text-xs">
                <div className="font-bold text-[#016098] text-sm">{assigningEmp.full_name}</div>
                <div className="text-slate-600">RUN: <span className="font-mono font-bold">{assigningEmp.rut_document}</span> | Cargo: {assigningEmp.position}</div>
                <div className="text-slate-500 font-medium">
                  Ubicación Destino: <strong className="text-slate-800">{assigningEmp.branch?.name}</strong> {assigningEmp.department?.name ? `(${assigningEmp.department.name})` : '(Sin Depto Asignado)'}
                </div>
                <div className="text-[10px] text-[#39BABD] font-semibold mt-1">
                  ⚡ Al confirmar, la sucursal y departamento del equipo se actualizarán automáticamente a los de este funcionario.
                </div>
              </div>

              {/* Asset Tag Search & Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Búsqueda y Selección de Equipo Disponible (Asset Tag) *
                </label>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={eqSearchQueryForEmp}
                    onChange={(e) => setEqSearchQueryForEmp(e.target.value)}
                    placeholder="Escriba Asset Tag, Serie, Tipo o Marca..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none font-mono uppercase"
                  />
                </div>

                <div className="border border-slate-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {filteredAvailableEquipment.length > 0 ? (
                    filteredAvailableEquipment.map((eq) => {
                      const isSelected = selectedEqIdForEmp === eq.id;
                      return (
                        <div
                          key={eq.id}
                          onClick={() => setSelectedEqIdForEmp(eq.id)}
                          className={`p-3 text-xs cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-[#016098]/10 border-l-4 border-l-[#016098]'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold font-mono text-[#016098] text-xs bg-[#016098]/10 px-2 py-0.5 rounded-md">
                                {eq.asset_tag}
                              </span>
                              <span className="font-bold text-slate-800">{eq.type?.name}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1">
                              Serie: <span className="font-mono">{eq.serial_number}</span> | Marca: {eq.brand?.name || 'N/A'} {eq.model?.name ? `(${eq.model.name})` : ''}
                            </div>
                          </div>

                          <div className="text-right">
                            {isSelected ? (
                              <span className="px-2.5 py-1 bg-[#016098] text-white font-bold text-[10px] rounded-full">
                                Seleccionado
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-semibold">Seleccionar</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500 italic">
                      No se encontraron equipos en estado Disponible que coincidan con la búsqueda.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Observaciones de la Asignación</label>
                <textarea
                  rows={2}
                  value={assignNotesForEmp}
                  onChange={(e) => setAssignNotesForEmp(e.target.value)}
                  placeholder="Ej: Entrega de equipo asignado desde el módulo de funcionarios..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!selectedEqIdForEmp || assigningLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#016098] hover:bg-[#014d7a] rounded-xl shadow-xs disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>{assigningLoading ? 'Asignando...' : 'Confirmar Asignación de Equipo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BATCH DEPARTMENT ASSIGNMENT MODAL */}
      {isBatchDeptModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-[#016098]/10 rounded-xl">
                  <Building2 className="w-5 h-5 text-[#016098]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Asignar Departamento en Lote</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedEmpIds.length} funcionario(s) seleccionado(s)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBatchDeptModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {batchError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-xl text-xs font-semibold border border-red-200">
                {batchError}
              </div>
            )}

            <form onSubmit={handleRunBatchDeptAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sucursal / Establecimiento</label>
                <select
                  value={batchBranchId}
                  onChange={(e) => {
                    setBatchBranchId(e.target.value);
                    setBatchDeptId('');
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none font-medium"
                >
                  {branchesList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nuevo Departamento para Seleccionados</label>
                <select
                  value={batchDeptId}
                  onChange={(e) => setBatchDeptId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none font-bold text-[#016098]"
                >
                  <option value="">Sin Depto Asignado</option>
                  {departments
                    .filter((d) => d.branchId === batchBranchId)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1.5 italic font-medium">
                  💡 Los equipos activos asignados a estos funcionarios actualizarán automáticamente su departamento para mantenerse sincronizados.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBatchDeptModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={batchSaving}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#016098] hover:bg-[#014d7a] rounded-xl shadow-xs disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>{batchSaving ? 'Guardando...' : `Aplicar a ${selectedEmpIds.length} Funcionarios`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AUDIT EVENT HISTORY MODAL (QUIÉN Y QUÉ SE MODIFICÓ) */}
      {isEmpHistoryModalOpen && selectedEmpHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-100 rounded-xl">
                  <History className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Trazabilidad y Eventos del Funcionario</h3>
                  <div className="text-xs text-slate-500 font-medium space-y-0.5">
                    <div>
                      {selectedEmpHistory.full_name} | RUN: <span className="font-mono font-bold">{selectedEmpHistory.rut_document}</span>
                    </div>
                    {selectedEmpHistory.createdAt && (
                      <div className="inline-flex items-center text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px] font-semibold mt-0.5">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-emerald-600 inline" />
                        <span>Fecha de Creación: <strong className="text-slate-900">{formatDateTime(selectedEmpHistory.createdAt)}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsEmpHistoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Event Timeline */}
            <div className="space-y-3">
              {(() => {
                let logs: any[] = [];
                try {
                  logs = JSON.parse(selectedEmpHistory.history_logs || '[]');
                } catch (e) {}

                if (!Array.isArray(logs)) logs = [];

                // Guarantee inclusion of creation date in history events
                const hasCreationLog = logs.some((l: any) => l.type === 'CREACION');
                if (!hasCreationLog && selectedEmpHistory.createdAt) {
                  const formattedCreation = formatDateTime(selectedEmpHistory.createdAt);
                  logs.push({
                    id: 'evt-created-at-' + selectedEmpHistory.id,
                    timestamp: formattedCreation,
                    userId: 'system',
                    userName: 'Sistema / Registro Inicial',
                    type: 'CREACION',
                    details: `Registro de creación del funcionario en el sistema`,
                    changes: [
                      `Fecha de Creación del Funcionario: ${formattedCreation}`,
                      `RUN: ${selectedEmpHistory.rut_document}`,
                      `Nombre: ${selectedEmpHistory.full_name}`,
                      `Cargo: ${selectedEmpHistory.position || 'FUNCIONARIO'}`,
                    ],
                  });
                }

                if (logs.length === 0) {
                  return (
                    <div className="p-6 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-slate-200">
                      Sin eventos registrados en la trazabilidad de este funcionario.
                    </div>
                  );
                }

                return (
                  <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                    {logs.map((log: any, idx: number) => {
                      const isBaja = log.type === 'BAJA';
                      const isCreacion = log.type === 'CREACION';
                      const isReactivacion = log.type === 'REACTIVACION';
                      const isAsignacion = log.type === 'ASIGNACION';
                      const isDesasignacion = log.type === 'DESASIGNACION';

                      return (
                        <div key={log.id || idx} className="relative flex items-start space-x-3 text-xs pl-2">
                          <div
                            className={`w-4 h-4 rounded-full border-2 mt-1 z-10 flex-shrink-0 ${
                              isBaja
                                ? 'bg-rose-500 border-rose-200'
                                : isCreacion || isReactivacion || isAsignacion
                                ? 'bg-emerald-500 border-emerald-200'
                                : isDesasignacion
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
                                    : isCreacion || isReactivacion || isAsignacion
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : isDesasignacion
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
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

                            {log.reason && (
                              <div className="p-2 bg-rose-100/80 border border-rose-300 rounded-lg text-[11px] text-rose-950 font-bold mt-1">
                                📝 Motivo Justificado de Baja: <span className="font-semibold italic text-slate-900">{log.reason}</span>
                              </div>
                            )}

                            {log.details && (
                              <div className="text-slate-600 text-[11px] font-medium">{log.details}</div>
                            )}

                            {log.changes && Array.isArray(log.changes) && log.changes.length > 0 && (
                              <div className="pt-1 space-y-1 border-t border-slate-200/60 mt-1">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                  Detalle de Cambios Realizados:
                                </div>
                                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-700 font-medium">
                                  {log.changes.map((ch: string, cIdx: number) => (
                                    <li key={cIdx} className="truncate">
                                      {ch}
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

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsEmpHistoryModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DECOMMISSION EMPLOYEE MODAL (DAR DE BAJA FUNCIONARIO CON AUTORÍA) */}
      {isDecommissionEmpModalOpen && decommissionEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-2xl">
                <UserX className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Dar de Baja a Funcionario</h3>
                <p className="text-xs text-slate-500 font-medium">
                  <strong>{decommissionEmp.full_name}</strong> (RUN: <span className="font-mono">{decommissionEmp.rut_document}</span>)
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs space-y-1">
              <p>⚠️ <strong>Atención de Políticas:</strong> Los funcionarios <strong>no son eliminados de la base de datos</strong>.</p>
              <p>Pasará a estado <strong>"INACTIVO (Dado de Baja)"</strong>, liberando sus equipos asignados y registrando en la trazabilidad: <strong>quién ejecutó la baja, fecha/hora exacta y motivo justificado</strong>.</p>
            </div>

            {decommissionEmpError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold">
                {decommissionEmpError}
              </div>
            )}

            <form onSubmit={handleConfirmDecommissionEmp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motivo / Justificación de la Baja *
                </label>
                <textarea
                  required
                  rows={3}
                  value={decommissionEmpReason}
                  onChange={(e) => setDecommissionEmpReason(e.target.value)}
                  placeholder="Ej: Desvinculación laboral por término de contrato, renuncia voluntaria, jubilación, traslado..."
                  className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none font-medium"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDecommissionEmpModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={decommissionEmpSaving}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {decommissionEmpSaving ? 'Procesando...' : 'Confirmar Dar de Baja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
