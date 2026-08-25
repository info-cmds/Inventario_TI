'use client';

import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Building2,
  Plus,
  Edit2,
  Trash2,
  FolderPlus,
  Layers,
  CheckCircle2,
  ArrowRight,
  List,
  LayoutGrid,
  Search,
  AlertTriangle,
  ArrowRightLeft,
  Users,
} from 'lucide-react';
import Pagination from './Pagination';

interface BranchesViewProps {
  userRole: string;
  onNavigateToEmployees?: (sectorId?: string, branchId?: string) => void;
  selectedSectorId?: string;
  selectedBranchId?: string;
  activeSubTab?: 'sectors' | 'branches' | 'departments';
}

export default function BranchesView({
  userRole,
  onNavigateToEmployees,
  selectedSectorId,
  selectedBranchId,
  activeSubTab,
}: BranchesViewProps) {
  const [sectors, setSectors] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sectors' | 'branches' | 'departments'>(
    activeSubTab || 'branches'
  );
  const [filterSectorId, setFilterSectorId] = useState(selectedSectorId || '');
  const [filterBranchId, setFilterBranchId] = useState(selectedBranchId || '');
  const [branchSearchQuery, setBranchSearchQuery] = useState('');
  const [branchViewMode, setBranchViewMode] = useState<'list' | 'cards'>('list');

  useEffect(() => {
    if (selectedSectorId !== undefined) {
      setFilterSectorId(selectedSectorId);
    }
  }, [selectedSectorId]);

  useEffect(() => {
    if (selectedBranchId !== undefined) {
      setFilterBranchId(selectedBranchId);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    if (activeSubTab) {
      setActiveTab(activeSubTab);
    }
  }, [activeSubTab]);

  // Pagination states
  const [branchPage, setBranchPage] = useState(1);
  const [branchPageSize, setBranchPageSize] = useState(15);
  const [deptPage, setDeptPage] = useState(1);
  const [deptPageSize, setDeptPageSize] = useState(15);

  // Modals state
  const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isDeleteDeptModalOpen, setIsDeleteDeptModalOpen] = useState(false);

  const [editingSector, setEditingSector] = useState<any>(null);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [deptToDelete, setDeptToDelete] = useState<any>(null);

  // Transfer & Delete Dept State
  const [targetDeptIdForTransfer, setTargetDeptIdForTransfer] = useState('');
  const [deptEmpCount, setDeptEmpCount] = useState(0);
  const [deptEquipCount, setDeptEquipCount] = useState(0);

  // Form fields
  const [sectorName, setSectorName] = useState('');
  const [sectorDesc, setSectorDesc] = useState('');

  const [branchName, setBranchName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [branchSectorId, setBranchSectorId] = useState('');
  const [branchStatus, setBranchStatus] = useState('ACTIVA');

  const [deptName, setDeptName] = useState('');
  const [deptBranchId, setDeptBranchId] = useState('');
  const [deptVlan, setDeptVlan] = useState('');

  // Department Employees Modal State
  const [isDeptEmpModalOpen, setIsDeptEmpModalOpen] = useState(false);
  const [selectedDeptForEmployees, setSelectedDeptForEmployees] = useState<any>(null);
  const [deptEmployees, setDeptEmployees] = useState<any[]>([]);
  const [loadingDeptEmp, setLoadingDeptEmp] = useState(false);
  const [deptEmpSearchQuery, setDeptEmpSearchQuery] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, [filterSectorId, filterBranchId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const branchUrl = filterSectorId ? `/api/branches?sectorId=${filterSectorId}` : '/api/branches';
      const deptUrl = filterBranchId
        ? `/api/departments?branchId=${filterBranchId}`
        : filterSectorId
        ? `/api/departments?sectorId=${filterSectorId}`
        : '/api/departments';

      const [resS, resB, resD] = await Promise.all([
        fetch('/api/sectors'),
        fetch(branchUrl),
        fetch(deptUrl),
      ]);
      const dataS = await resS.json();
      const dataB = await resB.json();
      const dataD = await resD.json();
      setSectors(Array.isArray(dataS) ? dataS : []);
      setBranches(Array.isArray(dataB) ? dataB : []);
      setDepartments(Array.isArray(dataD) ? dataD : []);
    } catch (err) {
      console.error('Error loading org structure:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeptEmployeesModal = async (dept: any) => {
    setSelectedDeptForEmployees(dept);
    setIsDeptEmpModalOpen(true);
    setLoadingDeptEmp(true);
    setDeptEmpSearchQuery('');
    try {
      const res = await fetch(`/api/employees?departmentId=${dept.id}`);
      const data = await res.json();
      setDeptEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching department employees:', err);
    } finally {
      setLoadingDeptEmp(false);
    }
  };

  const handleSelectSectorBranches = (sectorId: string) => {
    setFilterSectorId(sectorId);
    setFilterBranchId('');
    setActiveTab('branches');
    setBranchViewMode('list');
  };

  const handleSelectSectorDepartments = (sectorId: string) => {
    setFilterSectorId(sectorId);
    setFilterBranchId('');
    setActiveTab('departments');
  };

  const handleSelectBranchDepartments = (branchId: string) => {
    setFilterBranchId(branchId);
    const targetBranch = branches.find((b) => b.id === branchId);
    if (targetBranch && targetBranch.sectorId) {
      setFilterSectorId(targetBranch.sectorId);
    }
    setActiveTab('departments');
  };

  const handleOpenSectorModal = (sec?: any) => {
    setError('');
    if (sec) {
      setEditingSector(sec);
      setSectorName(sec.name);
      setSectorDesc(sec.description || '');
    } else {
      setEditingSector(null);
      setSectorName('');
      setSectorDesc('');
    }
    setIsSectorModalOpen(true);
  };

  const handleSaveSector = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const url = editingSector ? `/api/sectors/${editingSector.id}` : '/api/sectors';
      const method = editingSector ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: sectorName, description: sectorDesc }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar sector');

      setSuccess(`Sector ${editingSector ? 'actualizado' : 'creado'} correctamente.`);
      setIsSectorModalOpen(false);
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleOpenBranchModal = (branch?: any) => {
    setError('');
    if (branch) {
      setEditingBranch(branch);
      setBranchName(branch.name);
      setBranchCode(branch.code);
      setBranchSectorId(branch.sectorId);
      setBranchStatus(branch.status);
    } else {
      setEditingBranch(null);
      setBranchName('');
      setBranchCode('');
      setBranchSectorId(filterSectorId || sectors[0]?.id || '');
      setBranchStatus('ACTIVA');
    }
    setIsBranchModalOpen(true);
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const url = editingBranch ? `/api/branches/${editingBranch.id}` : '/api/branches';
      const method = editingBranch ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: branchName, code: branchCode, sectorId: branchSectorId, status: branchStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar sucursal');

      setSuccess(`Sucursal ${editingBranch ? 'actualizada' : 'creada'} correctamente.`);
      setIsBranchModalOpen(false);
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteBranch = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta sucursal?')) return;
    try {
      const res = await fetch(`/api/branches/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenDeptModal = (dept?: any) => {
    setError('');
    if (dept) {
      setEditingDept(dept);
      setDeptName(dept.name);
      setDeptBranchId(dept.branchId);
      setDeptVlan(dept.vlan || '');
    } else {
      setEditingDept(null);
      setDeptName('');
      setDeptBranchId(filterBranchId || branches[0]?.id || '');
      setDeptVlan('');
    }
    setIsDeptModalOpen(true);
  };

  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const url = editingDept ? `/api/departments/${editingDept.id}` : '/api/departments';
      const method = editingDept ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: deptName, branchId: deptBranchId, vlan: deptVlan }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar departamento');

      setSuccess(`Departamento ${editingDept ? 'actualizado' : 'creado'} correctamente.`);
      setIsDeptModalOpen(false);
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Open Delete Department Modal
  const handleOpenDeleteDeptModal = (dept: any) => {
    setError('');
    setDeptToDelete(dept);

    const empCount = dept._count?.employees || 0;
    const equipCount = dept._count?.equipment || 0;
    setDeptEmpCount(empCount);
    setDeptEquipCount(equipCount);

    // Find candidate department for transfer
    const otherDepts = departments.filter((d) => d.id !== dept.id);
    const candidateSameBranch = otherDepts.find((d) => d.branchId === dept.branchId);
    setTargetDeptIdForTransfer(candidateSameBranch ? candidateSameBranch.id : otherDepts[0]?.id || '');

    setIsDeleteDeptModalOpen(true);
  };

  // Confirm Department Deletion & Transfer
  const handleConfirmDeleteDept = async () => {
    if (!deptToDelete) return;
    setError('');

    const hasAssigned = deptEmpCount > 0 || deptEquipCount > 0;
    if (hasAssigned && !targetDeptIdForTransfer) {
      setError('Debe seleccionar un departamento de destino para transferir los registros asignados.');
      return;
    }

    try {
      const queryParam = targetDeptIdForTransfer ? `?targetDepartmentId=${targetDeptIdForTransfer}` : '';
      const res = await fetch(`/api/departments/${deptToDelete.id}${queryParam}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar departamento');

      setSuccess(data.message || 'Departamento eliminado correctamente.');
      setIsDeleteDeptModalOpen(false);
      setDeptToDelete(null);
      loadData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const selectedSectorObj = sectors.find((s) => s.id === filterSectorId);

  // Filter branches by local search query inside the view
  const filteredBranches = branches.filter((b) => {
    if (!branchSearchQuery.trim()) return true;
    const q = branchSearchQuery.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.code.toLowerCase().includes(q) ||
      (b.sector?.name && b.sector.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Estructura Organizacional Corporativa</h1>
          <p className="text-xs text-slate-500">
            Jerarquía: Sectores (Educación, Salud, Casa Central) → Sucursales → Departamentos
          </p>
        </div>

        {userRole !== 'LECTOR' && (
          <div className="flex items-center space-x-2">
            {activeTab === 'sectors' && (
              <button
                onClick={() => handleOpenSectorModal()}
                className="px-4 py-2 text-xs font-bold text-white bg-[#F7A517] hover:bg-[#d98f12] rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>Nuevo Sector</span>
              </button>
            )}

            {activeTab === 'branches' && (
              <button
                onClick={() => handleOpenBranchModal()}
                className="px-4 py-2 text-xs font-bold text-white bg-[#016098] hover:bg-[#014d7a] rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4 text-[#39BABD]" />
                <span>Nueva Sucursal</span>
              </button>
            )}

            {activeTab === 'departments' && (
              <button
                onClick={() => handleOpenDeptModal()}
                className="px-4 py-2 text-xs font-bold text-white bg-[#39BABD] hover:bg-[#2fa4a7] rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
              >
                <FolderPlus className="w-4 h-4 text-white" />
                <span>Nuevo Departamento</span>
              </button>
            )}
          </div>
        )}
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-4">
        <button
          onClick={() => setActiveTab('sectors')}
          className={`py-2.5 px-4 font-bold text-xs border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'sectors'
              ? 'border-[#F7A517] text-[#F7A517]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>Sectores ({sectors.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('branches')}
          className={`py-2.5 px-4 font-bold text-xs border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'branches'
              ? 'border-[#016098] text-[#016098]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Sucursales ({branches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('departments')}
          className={`py-2.5 px-4 font-bold text-xs border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === 'departments'
              ? 'border-[#39BABD] text-[#39BABD]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Departamentos ({departments.length})</span>
        </button>
      </div>

      {/* Filter by Sector & Branch Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 text-xs shadow-xs">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="font-bold text-slate-700 whitespace-nowrap">Filtrar por Sector:</span>
          <button
            onClick={() => {
              setFilterSectorId('');
              setFilterBranchId('');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
              !filterSectorId && !filterBranchId
                ? 'bg-[#016098] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Ver Todos
          </button>

          {sectors.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setFilterSectorId(s.id);
                setFilterBranchId('');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                filterSectorId === s.id && !filterBranchId
                  ? 'bg-[#016098] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>Sector {s.name}</span>
            </button>
          ))}
        </div>

        {/* Branch Filter Selector */}
        <div className="flex items-center space-x-2 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
          <span className="font-bold text-slate-700 whitespace-nowrap">Filtrar por Sucursal:</span>
          <select
            value={filterBranchId}
            onChange={(e) => {
              const bId = e.target.value;
              setFilterBranchId(bId);
              if (bId) {
                const bObj = branches.find((b) => b.id === bId);
                if (bObj?.sectorId) setFilterSectorId(bObj.sectorId);
                setActiveTab('departments');
              }
            }}
            className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-xl outline-none bg-white text-[#016098] focus:ring-2 focus:ring-[#016098] max-w-[220px] truncate"
          >
            <option value="">Todas las Sucursales ({branches.length})</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-8 text-center text-slate-500 font-medium">Cargando estructura organizacional...</div>
      ) : activeTab === 'sectors' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sectors.map((sec) => {
            const branchCount = sec._count?.branches || sec.branches?.length || 0;
            return (
              <div
                key={sec.id}
                onDoubleClick={() => handleSelectSectorBranches(sec.id)}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer select-none hover:border-[#F7A517]/60"
                title="Doble clic para ver las sucursales de este sector"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-[#F7A517]/10 rounded-2xl">
                        <Landmark className="w-6 h-6 text-[#F7A517]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">
                          Sector {sec.name}
                        </h3>
                        <span className="text-xs font-bold text-[#016098] block">
                          {branchCount} {branchCount === 1 ? 'sucursal' : 'sucursales'}
                        </span>
                      </div>
                    </div>

                    {userRole !== 'LECTOR' && (
                      <button
                        onClick={() => handleOpenSectorModal(sec)}
                        className="p-1.5 text-slate-400 hover:text-[#016098] hover:bg-slate-100 rounded-lg"
                        title="Editar sector"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 mt-3">{sec.description}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
                  <button
                    onClick={() => handleSelectSectorBranches(sec.id)}
                    className="w-full py-2 px-3 bg-slate-50 hover:bg-[#016098]/10 text-slate-700 hover:text-[#016098] rounded-xl text-xs font-bold transition-all flex items-center justify-between group"
                  >
                    <span>Ver Sucursales Asociadas</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#016098] group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={() => handleSelectSectorDepartments(sec.id)}
                    className="w-full py-2 px-3 bg-slate-50 hover:bg-[#39BABD]/10 text-slate-700 hover:text-[#39BABD] rounded-xl text-xs font-bold transition-all flex items-center justify-between group"
                  >
                    <span>Ver Departamentos Asociados</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#39BABD] group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : activeTab === 'branches' ? (
        <div className="space-y-4">
          {/* Controls Bar for Branches: Search & View Mode Toggle */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={branchSearchQuery}
                onChange={(e) => setBranchSearchQuery(e.target.value)}
                placeholder="Buscar sucursal por código, nombre o sector..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-600">
                {selectedSectorObj
                  ? `Sector ${selectedSectorObj.name} (${filteredBranches.length})`
                  : `Todas las Sucursales (${filteredBranches.length})`}
              </span>

              <div className="flex border border-slate-200 rounded-xl overflow-hidden p-0.5 bg-slate-50">
                <button
                  onClick={() => setBranchViewMode('list')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                    branchViewMode === 'list'
                      ? 'bg-[#016098] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                  title="Vista de Lista Ordenada"
                >
                  <List className="w-4 h-4" />
                  <span className="hidden md:inline">Lista</span>
                </button>
                <button
                  onClick={() => setBranchViewMode('cards')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                    branchViewMode === 'cards'
                      ? 'bg-[#016098] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                  title="Vista de Tarjetas / Cuadrícula"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden md:inline">Tarjetas</span>
                </button>
              </div>
            </div>
          </div>

          {/* Render Branches according to selected view mode */}
          {branchViewMode === 'list' ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
              {filteredBranches.length > 0 ? (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Código</th>
                      <th className="py-3 px-4">Nombre de la Sucursal</th>
                      <th className="py-3 px-4">Sector Pertenece</th>
                      <th className="py-3 px-4 text-center">Estado</th>
                      <th className="py-3 px-4 text-center">Funcionarios</th>
                      <th className="py-3 px-4 text-center">Equipos</th>
                      {userRole !== 'LECTOR' && <th className="py-3 px-4 text-right">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredBranches
                      .slice((branchPage - 1) * branchPageSize, branchPage * branchPageSize)
                      .map((b) => (
                      <tr
                        key={b.id}
                        onDoubleClick={() => handleSelectBranchDepartments(b.id)}
                        className="hover:bg-[#016098]/5 cursor-pointer select-none transition-colors"
                        title="Doble clic para ver los departamentos de esta sucursal"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-[#016098] uppercase">
                          {b.code}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">{b.name}</td>
                        <td className="py-3 px-4 font-bold text-[#F7A517]">
                          Sector {b.sector?.name}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              b.status === 'ACTIVA'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800">
                          {b._count?.employees || 0}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800">
                          {b._count?.equipment || 0}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleSelectBranchDepartments(b.id)}
                            className="px-2.5 py-1 text-[11px] font-bold text-[#016098] hover:text-white bg-[#016098]/10 hover:bg-[#016098] rounded-lg transition-colors inline-flex items-center space-x-1"
                            title="Ver departamentos pertenecientes a esta sucursal"
                          >
                            <Layers className="w-3.5 h-3.5" />
                            <span>Ver Departamentos ({b._count?.departments || 0})</span>
                          </button>

                          {userRole !== 'LECTOR' && (
                            <>
                              <button
                                onClick={() => handleOpenBranchModal(b)}
                                className="p-1.5 text-slate-500 hover:text-[#016098] hover:bg-slate-100 rounded-lg"
                                title="Editar sucursal"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {userRole === 'SUPERADMIN' && (
                                <button
                                  onClick={() => handleDeleteBranch(b.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                  title="Eliminar sucursal"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <p className="font-semibold">No se encontraron sucursales para el filtro seleccionado.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-1">
              {filteredBranches
                .slice((branchPage - 1) * branchPageSize, branchPage * branchPageSize)
                .map((b) => (
                <div
                  key={b.id}
                  onDoubleClick={() => handleSelectBranchDepartments(b.id)}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer select-none hover:border-[#016098]/40"
                  title="Doble clic para ver los departamentos de esta sucursal"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold bg-[#016098]/10 text-[#016098] px-2 py-0.5 rounded-md uppercase">
                        {b.code}
                      </span>
                      <h3 className="font-bold text-slate-800 text-base mt-1">{b.name}</h3>
                      <div className="text-[11px] font-bold text-[#F7A517]">Sector {b.sector?.name}</div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        b.status === 'ACTIVA' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Funcionarios</span>
                      <span className="font-bold text-slate-800">{b._count?.employees || 0}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Equipos</span>
                      <span className="font-bold text-slate-800">{b._count?.equipment || 0}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectBranchDepartments(b.id)}
                    className="w-full py-2 px-3 bg-slate-50 hover:bg-[#016098]/10 text-slate-700 hover:text-[#016098] rounded-xl text-xs font-bold transition-all flex items-center justify-between group mt-3"
                  >
                    <span>Ver Departamentos ({b._count?.departments || 0})</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#016098] group-hover:translate-x-1 transition-transform" />
                  </button>

                  {userRole !== 'LECTOR' && (
                    <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end space-x-2">
                      <button
                        onClick={() => handleOpenBranchModal(b)}
                        className="p-1.5 text-slate-500 hover:text-[#016098] hover:bg-slate-100 rounded-lg"
                        title="Editar sucursal"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {userRole === 'SUPERADMIN' && (
                        <button
                          onClick={() => handleDeleteBranch(b.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                          title="Eliminar sucursal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination Bar for Branches */}
          {filteredBranches.length > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={branchPage}
                totalItems={filteredBranches.length}
                pageSize={branchPageSize}
                onPageChange={setBranchPage}
                onPageSizeChange={setBranchPageSize}
                itemLabel="sucursales"
              />
            </div>
          )}
        </div>
      ) : (
        /* DEPARTMENTS TAB WITH DELETE & REASSIGNMENT OPTIONS */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700">
              {filterBranchId
                ? `📍 Departamentos pertenecientes a la Sucursal: ${branches.find((b) => b.id === filterBranchId)?.name || ''} (${branches.find((b) => b.id === filterBranchId)?.code || ''})`
                : selectedSectorObj
                ? `🏛️ Departamentos asociados al Sector ${selectedSectorObj.name}`
                : '🏢 Todos los Departamentos del Sistema'}{' '}
              <span className="text-[#016098] font-bold">({departments.length})</span>
            </span>

            {filterBranchId && (
              <button
                onClick={() => setFilterBranchId('')}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-colors self-start sm:self-auto cursor-pointer"
              >
                ✖ Ver todas las sucursales
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
            {departments.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Nombre Departamento</th>
                    <th className="py-3 px-4">Sucursal Asociada</th>
                    <th className="py-3 px-4">Sector</th>
                    <th className="py-3 px-4 text-center">Funcionarios</th>
                    <th className="py-3 px-4 text-center">Equipos</th>
                    {userRole !== 'LECTOR' && <th className="py-3 px-4 text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {departments
                    .slice((deptPage - 1) * deptPageSize, deptPage * deptPageSize)
                    .map((d) => (
                    <tr
                      key={d.id}
                      onDoubleClick={() => handleOpenDeptEmployeesModal(d)}
                      className="hover:bg-[#39BABD]/5 cursor-pointer select-none transition-colors"
                      title="Doble clic para ver los funcionarios de este departamento"
                    >
                      <td className="py-3 px-4 font-bold text-slate-900">{d.name}</td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="font-semibold text-[#016098]">{d.branch?.name}</span> ({d.branch?.code})
                      </td>
                      <td className="py-3 px-4 font-bold text-[#F7A517]">
                        Sector {d.branch?.sector?.name || 'Corporativo'}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          (d._count?.employees || 0) > 0 ? 'bg-[#016098]/10 text-[#016098]' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {d._count?.employees || 0}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          (d._count?.equipment || 0) > 0 ? 'bg-[#39BABD]/10 text-[#39BABD]' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {d._count?.equipment || 0}
                        </span>
                      </td>
                      {userRole !== 'LECTOR' && (
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenDeptModal(d)}
                            className="p-1.5 text-slate-500 hover:text-[#016098] hover:bg-slate-100 rounded-lg"
                            title="Editar departamento"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteDeptModal(d)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Eliminar departamento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-slate-500">
                <p className="font-semibold">
                  {selectedSectorObj
                    ? `No existen departamentos asociados al Sector ${selectedSectorObj.name}.`
                    : 'No existen departamentos registrados.'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Puedes agregar departamentos específicos seleccionando 'Nuevo Departamento'.
                </p>
              </div>
            )}

            {departments.length > 0 && (
              <div className="mt-4">
                <Pagination
                  currentPage={deptPage}
                  totalItems={departments.length}
                  pageSize={deptPageSize}
                  onPageChange={setDeptPage}
                  onPageSizeChange={setDeptPageSize}
                  itemLabel="departamentos"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sector Modal */}
      {isSectorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-lg">
              {editingSector ? 'Editar Sector' : 'Nuevo Sector Organizacional'}
            </h3>

            {error && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl">{error}</div>}

            <form onSubmit={handleSaveSector} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Sector</label>
                <input
                  type="text"
                  required
                  value={sectorName}
                  onChange={(e) => setSectorName(e.target.value)}
                  placeholder="Ej: Educación, Salud, Casa Central"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#F7A517] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción</label>
                <input
                  type="text"
                  value={sectorDesc}
                  onChange={(e) => setSectorDesc(e.target.value)}
                  placeholder="Ej: Recintos escolares, liceos y colegios"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#F7A517] outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSectorModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#F7A517] hover:bg-[#d98f12] rounded-xl"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Branch Modal */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-lg">
              {editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}
            </h3>

            {error && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl">{error}</div>}

            <form onSubmit={handleSaveBranch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sector Perteneciente</label>
                <select
                  required
                  value={branchSectorId}
                  onChange={(e) => setBranchSectorId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none font-bold text-slate-800"
                >
                  {sectors.map((s) => (
                    <option key={s.id} value={s.id}>
                      Sector {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Código Único (Ej: ESC-01, CCC-01)</label>
                <input
                  type="text"
                  required
                  value={branchCode}
                  onChange={(e) => setBranchCode(e.target.value.toUpperCase())}
                  placeholder="Ej: ESC-01"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none font-mono uppercase font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre de la Sucursal</label>
                <input
                  type="text"
                  required
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="Ej: Escuela D-73 José Papic"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Estado de Operación</label>
                <select
                  value={branchStatus}
                  onChange={(e) => setBranchStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none font-bold"
                >
                  <option value="ACTIVA">ACTIVA</option>
                  <option value="INACTIVA">INACTIVA</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBranchModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#016098] hover:bg-[#014d7a] rounded-xl"
                >
                  Guardar Sucursal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dept Edit Modal */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-lg">
              {editingDept ? 'Editar Departamento' : 'Nuevo Departamento'}
            </h3>

            {error && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl">{error}</div>}

            <form onSubmit={handleSaveDept} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sucursal Asociada</label>
                <select
                  value={deptBranchId}
                  onChange={(e) => setDeptBranchId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#39BABD] outline-none font-bold text-slate-800"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Departamento</label>
                <input
                  type="text"
                  required
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value.toUpperCase())}
                  placeholder="Ej: DIRECCIÓN, UTP, OBRAS, DAF, PLANIFICACIÓN"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#39BABD] outline-none font-bold uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Número de VLAN Asignada (Opcional)
                </label>
                <input
                  type="text"
                  value={deptVlan}
                  onChange={(e) => setDeptVlan(e.target.value)}
                  placeholder="Ej: VLAN 100, 10.50.0.0/24"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none font-medium"
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  Los equipos asociados a este departamento heredarán automáticamente esta VLAN.
                </span>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#39BABD] hover:bg-[#2fa4a7] rounded-xl"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Department Modal with Employee Reassignment Selector */}
      {isDeleteDeptModalOpen && deptToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Eliminar Departamento</h3>
                <span className="text-xs text-slate-500 block font-semibold">{deptToDelete.name}</span>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {(deptEmpCount > 0 || deptEquipCount > 0) ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
                <div className="flex items-start space-x-2 text-amber-800 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>
                    El departamento "{deptToDelete.name}" actualmente tiene {deptEmpCount} funcionario(s) {deptEquipCount > 0 ? `y ${deptEquipCount} equipo(s)` : ''} asignado(s).
                  </span>
                </div>

                <p className="text-xs text-amber-700">
                  Para no dejar a los funcionarios sin departamento, seleccione a qué departamento se transferirán automáticamente antes de eliminar:
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center space-x-1.5">
                    <ArrowRightLeft className="w-4 h-4 text-[#016098]" />
                    <span>Departamento de Destino:</span>
                  </label>
                  <select
                    value={targetDeptIdForTransfer}
                    onChange={(e) => setTargetDeptIdForTransfer(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none font-bold text-[#016098] bg-white"
                  >
                    {departments
                      .filter((d) => d.id !== deptToDelete.id)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} — Sucursal {d.branch?.name} ({d.branch?.code})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600">
                ¿Está seguro de eliminar el departamento <strong>{deptToDelete.name}</strong>? Esta acción no se puede deshacer.
              </p>
            )}

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteDeptModalOpen(false);
                  setDeptToDelete(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDept}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
              >
                {(deptEmpCount > 0 || deptEquipCount > 0) ? 'Reasignar y Eliminar Departamento' : 'Confirmar Eliminación'}
              </button>
            </div>
          </div>
        </div>
      )}
      {isDeptEmpModalOpen && selectedDeptForEmployees && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-[#016098]/10 rounded-xl">
                  <Users className="w-6 h-6 text-[#016098]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">
                    Funcionarios del Departamento: {selectedDeptForEmployees.name}
                  </h3>
                  <span className="text-xs text-slate-500 font-semibold block">
                    Sucursal {selectedDeptForEmployees.branch?.name} ({selectedDeptForEmployees.branch?.code}) — Sector {selectedDeptForEmployees.branch?.sector?.name || 'Corporativo'}
                  </span>
                </div>
              </div>

              <span className="text-xs font-bold text-[#016098] bg-[#016098]/10 px-3 py-1 rounded-full">
                {deptEmployees.length} funcionario(s)
              </span>
            </div>

            {/* Filter Search inside Modal */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={deptEmpSearchQuery}
                onChange={(e) => setDeptEmpSearchQuery(e.target.value)}
                placeholder="Buscar por RUN, nombre, cargo o correo..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none"
              />
            </div>

            {/* Table of Employees */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
              {loadingDeptEmp ? (
                <div className="p-8 text-center text-slate-500 font-medium">Cargando funcionarios del departamento...</div>
              ) : deptEmployees.length > 0 ? (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">RUN</th>
                      <th className="py-2.5 px-3">Nombre Completo</th>
                      <th className="py-2.5 px-3">Cargo / Función</th>
                      <th className="py-2.5 px-3">Correo</th>
                      <th className="py-2.5 px-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {deptEmployees
                      .filter((e) => {
                        if (!deptEmpSearchQuery.trim()) return true;
                        const q = deptEmpSearchQuery.toLowerCase();
                        return (
                          e.rut_document.toLowerCase().includes(q) ||
                          e.full_name.toLowerCase().includes(q) ||
                          (e.position && e.position.toLowerCase().includes(q)) ||
                          (e.email && e.email.toLowerCase().includes(q))
                        );
                      })
                      .map((emp) => (
                        <tr key={emp.id} className={emp.status === 'INACTIVO' ? 'bg-rose-50/50 hover:bg-rose-50' : 'hover:bg-slate-50'}>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#016098]">{emp.rut_document}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{emp.full_name}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-600">{emp.position || 'FUNCIONARIO'}</td>
                          <td className="py-2.5 px-3 text-slate-500">{emp.email || '-'}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                emp.status === 'ACTIVO' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {emp.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-slate-500 font-semibold">
                  No hay funcionarios asignados a este departamento.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              {onNavigateToEmployees ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsDeptEmpModalOpen(false);
                    onNavigateToEmployees(selectedDeptForEmployees.branch?.sectorId, selectedDeptForEmployees.branchId);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#016098] hover:bg-[#014d7a] rounded-xl flex items-center space-x-1.5 cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>Ir al Módulo de Funcionarios</span>
                </button>
              ) : (
                <div></div>
              )}

              <button
                type="button"
                onClick={() => setIsDeptEmpModalOpen(false)}
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
