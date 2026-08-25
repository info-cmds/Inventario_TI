'use client';

import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Edit2, Trash2, KeyRound, ShieldAlert, Building2, CheckCircle2, Layers, X, Filter } from 'lucide-react';
import Pagination from './Pagination';

interface UsersViewProps {
  branches: any[];
  departments: any[];
}

interface PermissionItem {
  branchId: string;
  departmentId?: string | null;
}

export default function UsersView({ branches, departments }: UsersViewProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'SUPERADMIN' | 'ADMINISTRADOR' | 'LECTOR'>('ADMINISTRADOR');
  const [status, setStatus] = useState<'ACTIVO' | 'INACTIVO'>('ACTIVO');
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [resetPassword, setResetPassword] = useState(false);

  // Multi-permission state with Sector Filter
  const [permissionList, setPermissionList] = useState<PermissionItem[]>([]);
  const [addSectorId, setAddSectorId] = useState('');
  const [addBranchId, setAddBranchId] = useState('');
  const [addDeptId, setAddDeptId] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [allBranches, setAllBranches] = useState<any[]>([]);
  const [allDepartments, setAllDepartments] = useState<any[]>([]);

  const PROTECTED_EMAILS = ['ppizarro@cmds.cl', 'cgonzalezo@cmds.cl'];

  useEffect(() => {
    loadUsers();
    loadSectors();
    loadAllBranches();
    loadAllDepartments();
  }, []);

  const loadAllBranches = async () => {
    try {
      const res = await fetch('/api/branches');
      const data = await res.json();
      setAllBranches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading all branches:', err);
    }
  };

  const loadAllDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      setAllDepartments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading all departments:', err);
    }
  };

  const activeBranches = allBranches.length > 0 ? allBranches : branches;
  const activeDepartments = allDepartments.length > 0 ? allDepartments : departments;

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
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

  const handleOpenModal = (user?: any) => {
    setError('');
    setSuccess('');
    setAddSectorId('');
    const defaultBranch = activeBranches[0]?.id || '';
    setAddBranchId(defaultBranch);
    setAddDeptId('');

    if (user) {
      setEditingUser(user);
      setEmail(user.email);
      setName(user.name);
      setRole(user.role);
      setStatus(user.status || 'ACTIVO');
      setMustChangePassword(user.must_change_password ?? true);
      setResetPassword(false);
      const perms = (user.permissions || []).map((p: any) => ({
        branchId: p.branchId,
        departmentId: p.departmentId || null,
      }));
      setPermissionList(perms);
    } else {
      setEditingUser(null);
      setEmail('');
      setName('');
      setRole('ADMINISTRADOR');
      setStatus('ACTIVO');
      setMustChangePassword(true);
      setResetPassword(false);
      setPermissionList([]);
    }
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (u: any) => {
    if (PROTECTED_EMAILS.includes(u.email.toLowerCase())) {
      alert('Las cuentas de superadministrador principal (ppizarro@cmds.cl y cgonzalezo@cmds.cl) están protegidas y no pueden ser desactivadas.');
      return;
    }

    const newStatus = u.status === 'INACTIVO' ? 'ACTIVO' : 'INACTIVO';
    const actionText = newStatus === 'INACTIVO' ? 'desactivar' : 'activar';
    if (!confirm(`¿Está seguro de ${actionText} la cuenta del usuario '${u.name}'?`)) return;

    try {
      const res = await fetch(`/api/users/${u.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cambiar estado del usuario');
      loadUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleMustChangePassword = async (u: any) => {
    const newValue = !u.must_change_password;
    const actionText = newValue
      ? "exigir cambio de clave obligatorio en el próximo inicio de sesión"
      : "marcar como clave normal";
    if (!confirm(`¿Está seguro de ${actionText} para '${u.name}'?`)) return;

    try {
      const res = await fetch(`/api/users/${u.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ must_change_password: newValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar preferencia de clave');
      loadUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddAllBranchesInSector = () => {
    const targetBranches = activeBranches.filter(
      (b) => !addSectorId || b.sectorId === addSectorId || b.sector?.id === addSectorId
    );

    if (targetBranches.length === 0) return;

    const newPerms = [...permissionList];
    let addedCount = 0;

    for (const b of targetBranches) {
      const exists = newPerms.some((p) => p.branchId === b.id && !p.departmentId);
      if (!exists) {
        newPerms.push({ branchId: b.id, departmentId: null });
        addedCount++;
      }
    }

    setPermissionList(newPerms);
    if (addedCount === 0) {
      setError('Todas las sucursales de este sector ya se encontraban asignadas');
    } else {
      setError('');
    }
  };

  const handleAddPermission = () => {
    if (!addBranchId) return;

    // Check if permission combination already exists
    const exists = permissionList.some(
      (p) => p.branchId === addBranchId && (p.departmentId || null) === (addDeptId || null)
    );

    if (exists) {
      setError('Este permiso de sucursal/departamento ya está agregado en la lista');
      return;
    }

    setError('');
    setPermissionList([...permissionList, { branchId: addBranchId, departmentId: addDeptId || null }]);
  };

  const handleRemovePermission = (index: number) => {
    const updated = permissionList.filter((_, idx) => idx !== index);
    setPermissionList(updated);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (role !== 'SUPERADMIN' && permissionList.length === 0) {
      setError('Debe asignar al menos una sucursal o área al usuario (o seleccionar rol SUPERADMIN)');
      return;
    }

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          role,
          status,
          must_change_password: mustChangePassword,
          resetPassword,
          branchPermissions: role === 'SUPERADMIN' ? [] : permissionList,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar usuario');

      setSuccess(`Usuario ${editingUser ? 'actualizado' : 'creado'} correctamente.`);
      setIsModalOpen(false);
      loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (u: any) => {
    if (PROTECTED_EMAILS.includes(u.email.toLowerCase())) {
      alert('Las cuentas de superadministrador principal (ppizarro@cmds.cl y cgonzalezo@cmds.cl) están protegidas y no pueden ser eliminadas.');
      return;
    }

    if (!confirm(`¿Está seguro de eliminar el usuario '${u.name}' del sistema?`)) return;
    try {
      const res = await fetch(`/api/users/${u.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar usuario');
      loadUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filtered branches depending on selected sector in modal
  const modalFilteredBranches = activeBranches.filter(
    (b) => !addSectorId || b.sectorId === addSectorId || b.sector?.id === addSectorId
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Gestión de Usuarios, Estado de Cuentas y Permisos</h1>
          <p className="text-xs text-slate-500">
            Administra accesos corporativos, desactivación de cuentas y cambio obligatorio de clave en primer login
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 text-xs font-bold text-white bg-[#016098] hover:bg-[#014d7a] rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#39BABD]" />
          <span>Nuevo Usuario / Admin</span>
        </button>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Users Table */}
      {loading ? (
        <div className="p-8 text-center text-slate-500 font-medium">Cargando usuarios del sistema...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Nombre Completo</th>
                <th className="py-3 px-4">Correo Electrónico</th>
                <th className="py-3 px-4">Rol en el Sistema</th>
                <th className="py-3 px-4">Estado Cuenta</th>
                <th className="py-3 px-4">Sucursales y Departamentos Asignados</th>
                <th className="py-3 px-4 text-center">Estado Clave</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {users
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((u) => {
                  const isProtected = PROTECTED_EMAILS.includes(u.email.toLowerCase());
                  const isInactive = u.status === 'INACTIVO';

                  return (
                    <tr
                      key={u.id}
                      className={isInactive ? 'bg-rose-50/40 hover:bg-rose-50/60' : 'hover:bg-slate-50'}
                    >
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center space-x-1.5">
                          <span>{u.name}</span>
                          {isProtected && (
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200"
                              title="Cuenta de Superadmin principal protegida contra desactivación y eliminación"
                            >
                              🛡️ Protegido
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-[#016098]">{u.email}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.role === 'SUPERADMIN'
                              ? 'bg-[#EB567F]/15 text-[#EB567F]'
                              : u.role === 'ADMINISTRADOR'
                              ? 'bg-[#016098]/15 text-[#016098]'
                              : 'bg-[#39BABD]/15 text-[#39BABD]'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isInactive
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {isInactive ? 'Desactivada' : 'Activa'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {u.role === 'SUPERADMIN' ? (
                          <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg text-xs">
                            Acceso Global Total (Todas las Sucursales)
                          </span>
                        ) : u.permissions && u.permissions.length > 0 ? (
                          <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                            {u.permissions.map((p: any, idx: number) => (
                              <div
                                key={idx}
                                className="inline-flex items-center space-x-1 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg text-[11px] mr-1.5 mb-1"
                              >
                                {p.sectorName && (
                                  <span className="font-bold text-[#F7A517]">
                                    [{p.sectorName}]
                                  </span>
                                )}
                                <span className="font-bold text-[#016098]">{p.branchName}</span>
                                <span className="text-slate-400">|</span>
                                <span className="font-medium text-slate-700">{p.departmentName}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Sin sucursal asignada</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleMustChangePassword(u)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                            u.must_change_password
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                          }`}
                          title="Haz clic para alternar obligación de cambio de clave en primer login"
                        >
                          {u.must_change_password ? '🔑 Cambio Obligatorio' : '✓ Normal'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        {/* Status Toggle Button (Activar / Desactivar) */}
                        {!isProtected && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`p-1.5 rounded-lg font-bold text-[10px] transition-colors ${
                              isInactive
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            }`}
                            title={isInactive ? 'Activar cuenta de usuario' : 'Desactivar cuenta de usuario'}
                          >
                            {isInactive ? 'Activar' : 'Desactivar'}
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenModal(u)}
                          className="p-1.5 text-slate-500 hover:text-[#016098] hover:bg-slate-100 rounded-lg cursor-pointer"
                          title="Editar usuario y permisos"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {!isProtected && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
      {users.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={users.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="usuarios"
        />
      )}

      {/* User Form Modal with Multi-Permission Manager and Sector Filter */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-slate-800 text-lg">
              {editingUser ? 'Editar Usuario y Permisos Multi-Sucursal' : 'Nuevo Usuario'}
            </h3>

            {error && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl font-semibold">{error}</div>}

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Gonzalo Ramírez"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico (Login)</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rol de Usuario</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none font-semibold text-slate-800"
                  >
                    <option value="SUPERADMIN">SUPERADMIN (Acceso Total)</option>
                    <option value="ADMINISTRADOR">ADMINISTRADOR (Gestor)</option>
                    <option value="LECTOR">LECTOR (Solo Lectura)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Estado de la Cuenta</label>
                  <select
                    value={status}
                    disabled={editingUser && PROTECTED_EMAILS.includes(editingUser.email.toLowerCase())}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none font-bold text-slate-800 disabled:opacity-50"
                  >
                    <option value="ACTIVO">ACTIVA (Permite Login)</option>
                    <option value="INACTIVO">DESACTIVADA (Bloquea Login)</option>
                  </select>
                </div>
              </div>

              {role !== 'SUPERADMIN' && (
                <div className="space-y-3 bg-slate-50 p-4 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                      <Filter className="w-3.5 h-3.5 text-[#016098]" />
                      <span>Filtro de Sector y Asignación Múltiple</span>
                    </label>
                    <span className="text-[10px] font-bold text-[#016098] bg-[#016098]/10 px-2 py-0.5 rounded-full">
                      {permissionList.length} asignadas
                    </span>
                  </div>

                  {/* 1. Sector Filter Dropdown & Quick Batch Sector Assignment */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-bold text-slate-600">
                        1. Filtrar por Sector:
                      </label>
                      <button
                        type="button"
                        onClick={handleAddAllBranchesInSector}
                        className="text-[10px] font-bold text-[#016098] hover:text-[#014d7a] bg-[#016098]/10 hover:bg-[#016098]/20 px-2 py-0.5 rounded-lg border border-[#016098]/20 transition-colors flex items-center space-x-1 cursor-pointer"
                        title="Asignar automáticamente todas las sucursales de este sector"
                      >
                        <span>⚡ Asignar Todas las Sucursales del Sector</span>
                      </button>
                    </div>
                    <select
                      value={addSectorId}
                      onChange={(e) => {
                        const secId = e.target.value;
                        setAddSectorId(secId);
                        const filtered = activeBranches.filter((b) => !secId || b.sectorId === secId || b.sector?.id === secId);
                        setAddBranchId(filtered[0]?.id || '');
                        setAddDeptId('');
                      }}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white font-bold text-[#F7A517]"
                    >
                      <option value="">Todos los Sectores (Educación, Salud, Casa Central)</option>
                      {sectors.map((s) => (
                        <option key={s.id} value={s.id}>
                          Sector {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Branch & Department Selection */}
                  <div className="grid grid-cols-5 gap-2 items-end">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                        2. Sucursal ({modalFilteredBranches.length}):
                      </label>
                      <select
                        value={addBranchId}
                        onChange={(e) => {
                          setAddBranchId(e.target.value);
                          setAddDeptId('');
                        }}
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white font-medium"
                      >
                        {modalFilteredBranches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                        3. Departamento:
                      </label>
                      <select
                        value={addDeptId}
                        onChange={(e) => setAddDeptId(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white font-medium"
                      >
                        <option value="">Todas las Áreas</option>
                        {activeDepartments
                          .filter((d) => d.branchId === addBranchId)
                          .map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddPermission}
                      className="col-span-1 py-1.5 px-2 bg-[#016098] hover:bg-[#014d7a] text-white font-bold rounded-lg text-xs flex items-center justify-center space-x-1"
                      title="Agregar asignación"
                    >
                      <Plus className="w-4 h-4 text-[#39BABD]" />
                      <span>Añadir</span>
                    </button>
                  </div>

                  {/* Assigned Permissions List */}
                  {permissionList.length > 0 ? (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pt-2 border-t border-slate-200">
                      {permissionList.map((p, idx) => {
                        const bObj = activeBranches.find((b) => b.id === p.branchId);
                        const dObj = activeDepartments.find((d) => d.id === p.departmentId);
                        const secName = bObj?.sector?.name || '';
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs shadow-2xs"
                          >
                            <div className="flex items-center space-x-1.5">
                              {secName && (
                                <span className="font-bold text-[#F7A517] bg-[#F7A517]/10 px-1.5 py-0.5 rounded-md text-[10px]">
                                  {secName}
                                </span>
                              )}
                              <strong className="text-slate-800">{bObj?.name || p.branchId}</strong>
                              <span className="text-slate-400">|</span>
                              <span className="font-semibold text-slate-600">
                                {dObj?.name || 'Todas las áreas'}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemovePermission(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50"
                              title="Quitar esta asignación"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic text-center py-2">
                      No ha asignado sucursales. Seleccione sector, sucursal y presione 'Añadir'.
                    </p>
                  )}
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={mustChangePassword}
                    onChange={(e) => setMustChangePassword(e.target.checked)}
                    className="rounded text-[#016098] focus:ring-[#016098]"
                  />
                  <span>🔑 Obligar al usuario a cambiar su contraseña en su próximo inicio de sesión</span>
                </label>

                {editingUser && (
                  <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-amber-800">
                    <input
                      type="checkbox"
                      checked={resetPassword}
                      onChange={(e) => setResetPassword(e.target.checked)}
                      className="rounded text-[#016098]"
                    />
                    <span>Restablecer contraseña a 'admin123' (y forzar cambio al login)</span>
                  </label>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#016098] hover:bg-[#014d7a] rounded-xl"
                >
                  Guardar Permisos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
