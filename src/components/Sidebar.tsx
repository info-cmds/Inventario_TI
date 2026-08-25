'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Building,
  Laptop,
  History,
  Users,
  Layers,
  UserCheck,
  ChevronRight,
  ChevronDown,
  HeartPulse,
  GraduationCap,
  Landmark,
  MapPin,
  Settings,
  Folder,
  FolderOpen,
  Building2,
  ListTree,
  Search,
  Monitor,
  Printer,
  Cpu,
  Server,
  HardDrive,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (
    tab: string,
    sectorId?: string,
    subTab?: 'sectors' | 'branches' | 'departments',
    branchId?: string,
    departmentId?: string,
    equipmentTag?: string
  ) => void;
  userRole: string;
  sectors?: any[];
  branches?: any[];
  departments?: any[];
  equipment?: any[];
  onSelectSector?: (sectorId: string) => void;
  onSelectBranch?: (branchId: string) => void;
  selectedSectorId?: string;
  selectedBranchId?: string;
  selectedDepartmentId?: string;
  selectedEquipmentTag?: string;
  branchesSubTab?: 'sectors' | 'branches' | 'departments';
}

export default function Sidebar({
  currentTab,
  onTabChange,
  userRole,
  sectors = [],
  branches = [],
  departments = [],
  equipment = [],
  onSelectSector,
  onSelectBranch,
  selectedSectorId = '',
  selectedBranchId = '',
  selectedDepartmentId = '',
  selectedEquipmentTag = '',
  branchesSubTab = 'branches',
}: SidebarProps) {
  // Local equipment state fallback
  const [localEquipment, setLocalEquipment] = useState<any[]>([]);

  useEffect(() => {
    if (equipment && equipment.length > 0) {
      setLocalEquipment(equipment);
    } else {
      fetch('/api/equipment')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setLocalEquipment(data);
        })
        .catch(() => {});
    }
  }, [equipment]);

  const activeEquipmentList = equipment && equipment.length > 0 ? equipment : localEquipment;

  // State for expanded top-level categories
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'cat-org': true,
    'cat-hardware': true,
    'cat-personal': true,
    'cat-admin': true,
  });

  // State for expanded sector sub-folders
  const [expandedSectors, setExpandedSectors] = useState<Record<string, boolean>>({});

  // State for expanded branch sub-folders
  const [expandedBranchSubfolders, setExpandedBranchSubfolders] = useState<Record<string, boolean>>({});

  // State for expanded individual branch nodes
  const [expandedBranches, setExpandedBranches] = useState<Record<string, boolean>>({});

  // State for expanded department nodes (Level 5 -> Level 6 Assigned Equipment)
  const [expandedDepartments, setExpandedDepartments] = useState<Record<string, boolean>>({});

  // Search filter inside expanded branch lists
  const [branchSearchTexts, setBranchSearchTexts] = useState<Record<string, string>>({});

  // Helpers
  const getSectorBranches = (secId: string) => {
    if (!branches || !secId) return [];
    return branches.filter((b) => b.sectorId === secId).sort((a, b) => a.name.localeCompare(b.name));
  };

  const getBranchDepartments = (bId: string) => {
    if (!departments || !bId) return [];
    return departments.filter((d) => d.branchId === bId).sort((a, b) => a.name.localeCompare(b.name));
  };

  const getDeptEquipment = (dId: string) => {
    if (!activeEquipmentList || !dId) return [];
    return activeEquipmentList.filter((eq) => eq.departmentId === dId);
  };

  const getSectorDeptCount = (secId: string) => {
    if (!departments || !secId) return 0;
    const secBranchIds = new Set(branches.filter((b) => b.sectorId === secId).map((b) => b.id));
    return departments.filter((d) => secBranchIds.has(d.branchId) || d.branch?.sectorId === secId).length;
  };

  const getSectorIcon = (secName: string) => {
    const nameUpper = (secName || '').toUpperCase();
    if (nameUpper.includes('SALUD')) return HeartPulse;
    if (nameUpper.includes('EDUCAC')) return GraduationCap;
    if (nameUpper.includes('CENTRAL') || nameUpper.includes('CASA')) return Landmark;
    return Building2;
  };

  const getSectorBadge = (secName: string) => {
    const nameUpper = (secName || '').toUpperCase();
    if (nameUpper.includes('SALUD')) return 'SALUD';
    if (nameUpper.includes('EDUCAC')) return 'EDU';
    if (nameUpper.includes('CENTRAL') || nameUpper.includes('CASA')) return 'CENTRAL';
    return 'SECTOR';
  };

  const getEquipmentIcon = (typeName: string) => {
    const nameUpper = (typeName || '').toUpperCase();
    if (nameUpper.includes('LAPTOP') || nameUpper.includes('NOTEBOOK')) return Laptop;
    if (nameUpper.includes('MONITOR') || nameUpper.includes('PANTALLA')) return Monitor;
    if (nameUpper.includes('IMPRESORA') || nameUpper.includes('PRINTER')) return Printer;
    if (nameUpper.includes('DESKTOP') || nameUpper.includes('PC') || nameUpper.includes('COMPUTADOR')) return Cpu;
    if (nameUpper.includes('SERVIDOR') || nameUpper.includes('SERVER')) return Server;
    return HardDrive;
  };

  // Auto-expand active sector, branch, and department when selected IDs change
  useEffect(() => {
    if (selectedBranchId) {
      const bObj = branches.find((b) => b.id === selectedBranchId);
      if (bObj && bObj.sectorId) {
        setExpandedCategories((prev) => ({ ...prev, 'cat-org': true }));
        setExpandedSectors((prev) => ({ ...prev, [bObj.sectorId]: true }));
        setExpandedBranchSubfolders((prev) => ({ ...prev, [bObj.sectorId]: true }));
        setExpandedBranches((prev) => ({ ...prev, [selectedBranchId]: true }));
      }
    } else if (selectedSectorId) {
      setExpandedCategories((prev) => ({ ...prev, 'cat-org': true }));
      setExpandedSectors((prev) => ({ ...prev, [selectedSectorId]: true }));
    }
  }, [selectedSectorId, selectedBranchId, branches]);

  // Auto-expand category containing active tab
  useEffect(() => {
    if (['equipment', 'assignments', 'equipment-types'].includes(currentTab)) {
      setExpandedCategories((prev) => ({ ...prev, 'cat-hardware': true }));
    } else if (currentTab === 'employees') {
      setExpandedCategories((prev) => ({ ...prev, 'cat-personal': true }));
    } else if (currentTab === 'users') {
      setExpandedCategories((prev) => ({ ...prev, 'cat-admin': true }));
    } else if (currentTab === 'branches') {
      setExpandedCategories((prev) => ({ ...prev, 'cat-org': true }));
    }
  }, [currentTab]);

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const toggleSector = (secId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedSectors((prev) => ({ ...prev, [secId]: !prev[secId] }));
  };

  const toggleBranchSubfolder = (secId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedBranchSubfolders((prev) => ({ ...prev, [secId]: !prev[secId] }));
  };

  const toggleBranchNode = (bId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedBranches((prev) => ({ ...prev, [bId]: !prev[bId] }));
  };

  const toggleDepartmentNode = (dId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedDepartments((prev) => ({ ...prev, [dId]: !prev[dId] }));
  };

  const expandAll = () => {
    setExpandedCategories({
      'cat-org': true,
      'cat-hardware': true,
      'cat-personal': true,
      'cat-admin': true,
    });
    const allSecs: Record<string, boolean> = {};
    const allBranchSub: Record<string, boolean> = {};
    const allBranchesNode: Record<string, boolean> = {};
    const allDeptsNode: Record<string, boolean> = {};

    sectors.forEach((s) => {
      allSecs[s.id] = true;
      allBranchSub[s.id] = true;
    });
    branches.forEach((b) => {
      allBranchesNode[b.id] = true;
    });
    departments.forEach((d) => {
      allDeptsNode[d.id] = true;
    });

    setExpandedSectors(allSecs);
    setExpandedBranchSubfolders(allBranchSub);
    setExpandedBranches(allBranchesNode);
    setExpandedDepartments(allDeptsNode);
  };

  const collapseAll = () => {
    setExpandedCategories({});
    setExpandedSectors({});
    setExpandedBranchSubfolders({});
    setExpandedBranches({});
    setExpandedDepartments({});
  };

  const handleSubFolderBranchesHeaderClick = (secId: string) => {
    toggleBranchSubfolder(secId);
    if (onSelectSector) onSelectSector(secId);
    if (onSelectBranch) onSelectBranch('');
    onTabChange('branches', secId, 'branches', '', '', '');
  };

  const handleSubFolderDepartmentsClick = (secId: string) => {
    if (onSelectSector) onSelectSector(secId);
    if (onSelectBranch) onSelectBranch('');
    onTabChange('branches', secId, 'departments', '', '', '');
  };

  const handleIndividualBranchClick = (secId: string, branchId: string) => {
    toggleBranchNode(branchId);
    if (onSelectSector) onSelectSector(secId);
    if (onSelectBranch) onSelectBranch(branchId);
    onTabChange('branches', secId, 'branches', branchId, '', '');
  };

  const handleIndividualDeptClick = (secId: string, branchId: string, deptId: string) => {
    if (onSelectSector) onSelectSector(secId);
    if (onSelectBranch) onSelectBranch(branchId);
    onTabChange('equipment', secId, 'branches', branchId, deptId, '');
  };

  const handleEquipmentItemClick = (
    secId: string,
    branchId: string,
    deptId: string,
    eqTag: string
  ) => {
    if (onSelectSector) onSelectSector(secId);
    if (onSelectBranch) onSelectBranch(branchId);
    onTabChange('equipment', secId, 'branches', branchId, deptId, eqTag);
  };

  const handleSectorHeaderClick = (secId: string) => {
    toggleSector(secId);
    if (onSelectSector) onSelectSector(secId);
    if (onSelectBranch) onSelectBranch('');
    onTabChange('branches', secId, 'branches', '', '', '');
  };

  return (
    <aside className="w-full lg:w-64 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex flex-col shrink-0 h-full lg:min-h-[calc(100vh-6rem)] overflow-hidden">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-100 flex flex-col items-center justify-center space-y-2 bg-gradient-to-b from-slate-50 to-white">
        <img src="/logo-cmds.png" alt="CMDS Antofagasta" className="h-10 w-auto object-contain" />
        <div className="flex items-center justify-between w-full pt-1 px-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
            <ListTree className="w-3.5 h-3.5 text-[#016098]" />
            <span>Navegación Árbol</span>
          </span>
          <div className="flex space-x-1">
            <button
              onClick={expandAll}
              className="text-[10px] font-bold text-[#016098] hover:bg-slate-100 px-1.5 py-0.5 rounded-md transition-colors cursor-pointer"
              title="Expandir todas las categorías, sucursales y equipos"
            >
              + Todo
            </button>
            <button
              onClick={collapseAll}
              className="text-[10px] font-bold text-slate-400 hover:bg-slate-100 px-1.5 py-0.5 rounded-md transition-colors cursor-pointer"
              title="Colapsar todo"
            >
              - Todo
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tree Content */}
      <nav className="p-3 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
        {/* Root Node: Dashboard */}
        <div>
          <button
            onClick={() => {
              if (onSelectSector) onSelectSector('');
              if (onSelectBranch) onSelectBranch('');
              onTabChange('dashboard', '', 'branches', '');
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all duration-150 cursor-pointer ${
              currentTab === 'dashboard'
                ? 'bg-[#016098] text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100 hover:text-[#016098]'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <LayoutDashboard
                className={`w-4 h-4 ${currentTab === 'dashboard' ? 'text-[#39BABD]' : 'text-[#016098]'}`}
              />
              <span>Dashboard Principal</span>
            </div>
            {currentTab === 'dashboard' && (
              <span className="w-2 h-2 rounded-full bg-[#39BABD] animate-pulse"></span>
            )}
          </button>
        </div>

        <div className="h-px bg-slate-100 my-2" />

        {/* 1. Category Node: Estructura Organizacional */}
        <div className="space-y-1">
          <button
            onClick={() => toggleCategory('cat-org')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
              currentTab === 'branches' ? 'text-[#016098] bg-[#016098]/5' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center space-x-2">
              {expandedCategories['cat-org'] ? (
                <ChevronDown className="w-3.5 h-3.5 text-[#016098]" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
              {expandedCategories['cat-org'] ? (
                <FolderOpen className="w-4 h-4 text-[#F7A517]" />
              ) : (
                <Folder className="w-4 h-4 text-[#F7A517]" />
              )}
              <span className="truncate">Estructura Organizacional</span>
            </div>
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-500">
              {sectors.length}
            </span>
          </button>

          {/* Level 2 Sub-tree: Sector Folders */}
          {expandedCategories['cat-org'] && (
            <div className="ml-3 pl-2.5 border-l-2 border-slate-200/80 space-y-1.5 py-0.5">
              {sectors.map((sec) => {
                const SecIcon = getSectorIcon(sec.name);
                const badgeText = getSectorBadge(sec.name);
                const isSecExpanded = !!expandedSectors[sec.id];
                const isBranchSubExpanded = !!expandedBranchSubfolders[sec.id];
                const isSecActive = currentTab === 'branches' && selectedSectorId === sec.id;
                const secBranchesList = getSectorBranches(sec.id);
                const dCount = getSectorDeptCount(sec.id);
                const searchText = branchSearchTexts[sec.id] || '';

                // Search by Name AND Code!
                const filteredSectorBranches = secBranchesList.filter((b) => {
                  if (!searchText.trim()) return true;
                  const q = searchText.toLowerCase().trim();
                  const matchName = (b.name || '').toLowerCase().includes(q);
                  const matchCode = (b.code || '').toLowerCase().includes(q);
                  return matchName || matchCode;
                });

                return (
                  <div key={sec.id} className="space-y-1">
                    {/* Sector Sub-Folder Node */}
                    <div
                      onClick={() => handleSectorHeaderClick(sec.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                        isSecActive && !selectedBranchId
                          ? 'bg-[#016098]/10 text-[#016098] border border-[#016098]/20'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-[#016098]'
                      }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <button
                          onClick={(e) => toggleSector(sec.id, e)}
                          className="p-0.5 hover:bg-slate-200/60 rounded cursor-pointer"
                        >
                          {isSecExpanded ? (
                            <ChevronDown className="w-3 h-3 text-[#016098]" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-slate-400" />
                          )}
                        </button>
                        <SecIcon className="w-3.5 h-3.5 text-[#016098] shrink-0" />
                        <span className="truncate">{sec.name}</span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-100 text-slate-500 shrink-0">
                        {badgeText}
                      </span>
                    </div>

                    {/* Level 3 Nested Sub-folders: Sucursales y Departamentos */}
                    {isSecExpanded && (
                      <div className="ml-3.5 pl-2.5 border-l-2 border-slate-200/80 space-y-1 py-0.5">
                        {/* Sub-folder 1: Sucursales (Expandable to Level 4 Branches!) */}
                        <div>
                          <button
                            onClick={() => handleSubFolderBranchesHeaderClick(sec.id)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                              isSecActive && branchesSubTab === 'branches' && !selectedBranchId
                                ? 'bg-[#016098] text-white shadow-xs font-bold'
                                : 'text-slate-700 hover:bg-slate-100 hover:text-[#016098]'
                            }`}
                          >
                            <div className="flex items-center space-x-1.5 min-w-0">
                              <button
                                onClick={(e) => toggleBranchSubfolder(sec.id, e)}
                                className="p-0.5 hover:bg-slate-200/60 rounded cursor-pointer"
                              >
                                {isBranchSubExpanded ? (
                                  <ChevronDown className="w-3 h-3 text-[#016098]" />
                                ) : (
                                  <ChevronRight className="w-3 h-3 text-slate-400" />
                                )}
                              </button>
                              <Building2
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isSecActive && branchesSubTab === 'branches' && !selectedBranchId
                                    ? 'text-[#39BABD]'
                                    : 'text-slate-400'
                                }`}
                              />
                              <span className="truncate">Sucursales</span>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                                isSecActive && branchesSubTab === 'branches' && !selectedBranchId
                                  ? 'bg-white/20 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {secBranchesList.length}
                            </span>
                          </button>

                          {/* Level 4: Actual Individual Branches List (With Name AND Code Search) */}
                          {isBranchSubExpanded && (
                            <div className="ml-3 pl-2 border-l-2 border-[#016098]/30 space-y-1 mt-1 py-1 bg-slate-50/50 rounded-r-xl">
                              {/* Search filter by Name or Code */}
                              {secBranchesList.length > 3 && (
                                <div className="px-2 py-1 relative">
                                  <Search className="w-3 h-3 text-slate-400 absolute left-3.5 top-2.5" />
                                  <input
                                    type="text"
                                    value={searchText}
                                    onChange={(e) =>
                                      setBranchSearchTexts((prev) => ({
                                        ...prev,
                                        [sec.id]: e.target.value,
                                      }))
                                    }
                                    placeholder="Buscar sucursal o código..."
                                    className="w-full pl-7 pr-2 py-1 text-[10px] border border-slate-200 rounded-md outline-none focus:ring-1 focus:ring-[#016098] bg-white font-medium"
                                  />
                                </div>
                              )}

                              <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-0.5 pr-1">
                                {filteredSectorBranches.length > 0 ? (
                                  filteredSectorBranches.map((b) => {
                                    const isBranchSelected = selectedBranchId === b.id;
                                    const branchDepts = getBranchDepartments(b.id);
                                    const isBranchExpanded = !!expandedBranches[b.id];

                                    return (
                                      <div key={b.id} className="space-y-0.5">
                                        {/* Branch Node Header */}
                                        <button
                                          onClick={() => handleIndividualBranchClick(sec.id, b.id)}
                                          className={`w-full flex items-center justify-between px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer text-left ${
                                            isBranchSelected
                                              ? 'bg-[#016098] text-white font-bold shadow-xs'
                                              : 'text-slate-700 hover:bg-slate-200/70 hover:text-[#016098]'
                                          }`}
                                          title={`${b.name} (${b.code})`}
                                        >
                                          <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                                            {branchDepts.length > 0 ? (
                                              <button
                                                onClick={(e) => toggleBranchNode(b.id, e)}
                                                className="p-0.5 hover:bg-black/10 rounded cursor-pointer"
                                              >
                                                {isBranchExpanded ? (
                                                  <ChevronDown className="w-2.5 h-2.5" />
                                                ) : (
                                                  <ChevronRight className="w-2.5 h-2.5" />
                                                )}
                                              </button>
                                            ) : (
                                              <MapPin
                                                className={`w-3 h-3 shrink-0 ${
                                                  isBranchSelected ? 'text-[#39BABD]' : 'text-slate-400'
                                                }`}
                                              />
                                            )}

                                            <span className="truncate flex-1">{b.name}</span>

                                            {/* Branch Code Badge */}
                                            {b.code && (
                                              <span
                                                className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold shrink-0 ${
                                                  isBranchSelected
                                                    ? 'bg-white/20 text-white'
                                                    : 'bg-slate-200 text-slate-600'
                                                }`}
                                              >
                                                {b.code}
                                              </span>
                                            )}
                                          </div>

                                          {/* Departments count badge */}
                                          {branchDepts.length > 0 && (
                                            <span
                                              className={`text-[9px] font-bold px-1 rounded ml-1 shrink-0 ${
                                                isBranchSelected
                                                  ? 'bg-white/20 text-white'
                                                  : 'bg-slate-200 text-slate-600'
                                              }`}
                                            >
                                              {branchDepts.length}
                                            </span>
                                          )}
                                        </button>

                                        {/* Level 5: Departments belonging to this Branch */}
                                        {isBranchExpanded && branchDepts.length > 0 && (
                                          <div className="ml-3 pl-2 border-l border-[#39BABD]/60 space-y-0.5 my-0.5">
                                            {branchDepts.map((d) => {
                                              const deptEquipList = getDeptEquipment(d.id);
                                              const isDeptSelected =
                                                currentTab === 'equipment' && selectedDepartmentId === d.id;

                                              return (
                                                <button
                                                  key={d.id}
                                                  onClick={() => handleIndividualDeptClick(sec.id, b.id, d.id)}
                                                  className={`w-full flex items-center justify-between px-2 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer text-left ${
                                                    isDeptSelected
                                                      ? 'bg-[#016098] text-white font-bold shadow-xs'
                                                      : 'text-slate-700 hover:text-[#016098] hover:bg-slate-100'
                                                  }`}
                                                  title={`Ver equipos asignados al departamento: ${d.name}`}
                                                >
                                                  <div className="flex items-center space-x-1.5 min-w-0">
                                                    <Layers
                                                      className={`w-3 h-3 shrink-0 ${
                                                        isDeptSelected ? 'text-[#39BABD]' : 'text-[#016098]'
                                                      }`}
                                                    />
                                                    <span className="truncate">{d.name}</span>
                                                  </div>
                                                  <span
                                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                                                      isDeptSelected
                                                        ? 'bg-white/20 text-white'
                                                        : 'bg-slate-200 text-slate-700'
                                                    }`}
                                                  >
                                                    {deptEquipList.length} eq.
                                                  </span>
                                                </button>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="px-2 py-1 text-[10px] text-slate-400 italic">
                                    No coincide ningún código o nombre
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Sub-folder 2: Departamentos */}
                        <button
                          onClick={() => handleSubFolderDepartmentsClick(sec.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                            isSecActive && branchesSubTab === 'departments'
                              ? 'bg-[#016098] text-white shadow-xs font-bold'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-[#016098]'
                          }`}
                        >
                          <div className="flex items-center space-x-2 min-w-0">
                            <Layers
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isSecActive && branchesSubTab === 'departments'
                                  ? 'text-[#39BABD]'
                                  : 'text-slate-400'
                              }`}
                            />
                            <span className="truncate">Departamentos</span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                              isSecActive && branchesSubTab === 'departments'
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {dCount}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* General View: All Branches & Depts */}
              <button
                onClick={() => {
                  if (onSelectSector) onSelectSector('');
                  if (onSelectBranch) onSelectBranch('');
                  onTabChange('branches', '', 'branches', '');
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  currentTab === 'branches' && !selectedSectorId && !selectedBranchId
                    ? 'bg-[#016098] text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-[#016098]'
                }`}
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <MapPin
                    className={`w-3.5 h-3.5 shrink-0 ${
                      currentTab === 'branches' && !selectedSectorId && !selectedBranchId
                        ? 'text-[#39BABD]'
                        : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">Todas las Sucursales y Deptos.</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                    currentTab === 'branches' && !selectedSectorId && !selectedBranchId
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {branches.length}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* 2. Category Node: Gestión de Hardware */}
        <div className="space-y-1">
          <button
            onClick={() => toggleCategory('cat-hardware')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
              ['equipment', 'assignments', 'equipment-types'].includes(currentTab)
                ? 'text-[#016098] bg-[#016098]/5'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center space-x-2">
              {expandedCategories['cat-hardware'] ? (
                <ChevronDown className="w-3.5 h-3.5 text-[#016098]" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
              {expandedCategories['cat-hardware'] ? (
                <FolderOpen className="w-4 h-4 text-[#F7A517]" />
              ) : (
                <Folder className="w-4 h-4 text-[#F7A517]" />
              )}
              <span className="truncate">Gestión de Hardware</span>
            </div>
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-500">
              3
            </span>
          </button>

          {expandedCategories['cat-hardware'] && (
            <div className="ml-3 pl-2.5 border-l-2 border-slate-200/80 space-y-1 py-0.5">
              <button
                onClick={() => onTabChange('equipment', '', 'branches', '')}
                className={`w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  currentTab === 'equipment'
                    ? 'bg-[#016098] text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-[#016098]'
                }`}
              >
                <Laptop
                  className={`w-3.5 h-3.5 shrink-0 ${
                    currentTab === 'equipment' ? 'text-[#39BABD]' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">Inventario de Equipos</span>
              </button>

              <button
                onClick={() => onTabChange('assignments', '', 'branches', '')}
                className={`w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  currentTab === 'assignments'
                    ? 'bg-[#016098] text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-[#016098]'
                }`}
              >
                <History
                  className={`w-3.5 h-3.5 shrink-0 ${
                    currentTab === 'assignments' ? 'text-[#39BABD]' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">Asignaciones e Historial</span>
              </button>

              <button
                onClick={() => onTabChange('equipment-types', '', 'branches', '')}
                className={`w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  currentTab === 'equipment-types'
                    ? 'bg-[#016098] text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-[#016098]'
                }`}
              >
                <Layers
                  className={`w-3.5 h-3.5 shrink-0 ${
                    currentTab === 'equipment-types' ? 'text-[#39BABD]' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">Tipos y Atributos</span>
              </button>
            </div>
          )}
        </div>

        {/* 3. Category Node: Gestión de Personal */}
        <div className="space-y-1">
          <button
            onClick={() => toggleCategory('cat-personal')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
              currentTab === 'employees' ? 'text-[#016098] bg-[#016098]/5' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center space-x-2">
              {expandedCategories['cat-personal'] ? (
                <ChevronDown className="w-3.5 h-3.5 text-[#016098]" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
              {expandedCategories['cat-personal'] ? (
                <FolderOpen className="w-4 h-4 text-[#F7A517]" />
              ) : (
                <Folder className="w-4 h-4 text-[#F7A517]" />
              )}
              <span className="truncate">Gestión de Personal</span>
            </div>
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-500">
              1
            </span>
          </button>

          {expandedCategories['cat-personal'] && (
            <div className="ml-3 pl-2.5 border-l-2 border-slate-200/80 space-y-1 py-0.5">
              <button
                onClick={() => onTabChange('employees', '', 'branches', '')}
                className={`w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  currentTab === 'employees'
                    ? 'bg-[#016098] text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-[#016098]'
                }`}
              >
                <Users
                  className={`w-3.5 h-3.5 shrink-0 ${
                    currentTab === 'employees' ? 'text-[#39BABD]' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">Listado de Funcionarios</span>
              </button>
            </div>
          )}
        </div>

        {/* 4. Category Node: Administración (Solo SuperAdmin) */}
        {userRole === 'SUPERADMIN' && (
          <div className="space-y-1">
            <button
              onClick={() => toggleCategory('cat-admin')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                currentTab === 'users' ? 'text-[#016098] bg-[#016098]/5' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                {expandedCategories['cat-admin'] ? (
                  <ChevronDown className="w-3.5 h-3.5 text-[#016098]" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
                {expandedCategories['cat-admin'] ? (
                  <FolderOpen className="w-4 h-4 text-[#F7A517]" />
                ) : (
                  <Folder className="w-4 h-4 text-[#F7A517]" />
                )}
                <span className="truncate">Administración</span>
              </div>
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-500">
                1
              </span>
            </button>

            {expandedCategories['cat-admin'] && (
              <div className="ml-3 pl-2.5 border-l-2 border-slate-200/80 space-y-1 py-0.5">
                <button
                  onClick={() => onTabChange('users', '', 'branches', '')}
                  className={`w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    currentTab === 'users'
                      ? 'bg-[#016098] text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-[#016098]'
                  }`}
                >
                  <UserCheck
                    className={`w-3.5 h-3.5 shrink-0 ${
                      currentTab === 'users' ? 'text-[#39BABD]' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">Gestión de Usuarios</span>
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Brand Footer Info */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/70 text-xs text-slate-500 space-y-1">
        <div className="font-bold text-slate-800 text-[11px] flex items-center justify-between">
          <span>CMDS Sistema v1.0</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500" title="Sistema Activo" />
        </div>
        <div className="text-[10px] text-slate-500 font-medium">Equipos Asignados por Departamento</div>
      </div>
    </aside>
  );
}
