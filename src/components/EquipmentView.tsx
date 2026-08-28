'use client';

import React, { useState, useEffect } from 'react';
import {
  Laptop,
  Plus,
  Search,
  Filter,
  UserCheck,
  UserX,
  Edit2,
  Trash2,
  Eye,
  Sliders,
  CheckCircle2,
  Wrench,
  XCircle,
  Building2,
  Clock,
  Layers,
  Tag,
  Cpu,
  User,
  AlertTriangle,
  Zap,
  ShieldCheck,
  TrendingUp,
  Activity,
  FileText,
  History,
  Paperclip,
  Download,
  File,
  UploadCloud,
} from 'lucide-react';
import { DynamicAttributeDef } from '@/types';
import Pagination from './Pagination';

export function formatIPAddress(input: string): string {
  if (!input) return '';

  const cleaned = input.replace(/[^0-9.]/g, '');
  if (!cleaned) return '';

  if (cleaned.includes('.')) {
    const parts = cleaned.split('.');
    const validParts = parts.slice(0, 4).map((p) => {
      if (!p) return '';
      const num = parseInt(p, 10);
      if (!isNaN(num) && num > 255) return '255';
      return p.slice(0, 3);
    });
    return validParts.join('.');
  }

  const digits = cleaned;
  if (digits.length === 6 && digits.startsWith('10')) {
    return `10.${digits.slice(2, 4)}.${digits.slice(4, 5)}.${digits.slice(5, 6)}`;
  }

  const octets: string[] = [];
  let i = 0;

  while (i < digits.length && octets.length < 4) {
    const rem = digits.length - i;
    const isLastOctet = octets.length === 3;

    if (isLastOctet) {
      let octet = digits.slice(i, i + 3);
      const num = parseInt(octet, 10);
      if (!isNaN(num) && num > 255) octet = '255';
      octets.push(octet);
      i += octet.length;
    } else {
      const candidate3 = digits.slice(i, i + 3);
      const num3 = parseInt(candidate3, 10);
      const reqOctetsLeft = 4 - octets.length;

      if (candidate3.length === 3 && num3 <= 255) {
        if (num3 >= 100) {
          octets.push(candidate3);
          i += 3;
        } else if (rem <= reqOctetsLeft) {
          const octet = digits.slice(i, i + 1);
          octets.push(octet);
          i += 1;
        } else {
          const octet = candidate3.slice(0, 2);
          octets.push(octet);
          i += 2;
        }
      } else if (candidate3.length === 3 && num3 > 255) {
        const octet = digits.slice(i, i + 2);
        octets.push(octet);
        i += 2;
      } else {
        if (rem <= reqOctetsLeft) {
          const octet = digits.slice(i, i + 1);
          octets.push(octet);
          i += 1;
        } else {
          const octet = candidate3;
          octets.push(octet);
          i += candidate3.length;
        }
      }
    }
  }

  return octets.join('.');
}

interface EquipmentViewProps {
  userRole: string;
  branches: any[];
  selectedSectorId?: string;
  selectedBranchId: string;
  initialSearchQuery?: string;
  initialDepartmentId?: string;
}

export default function EquipmentView({
  userRole,
  branches,
  selectedSectorId,
  selectedBranchId,
  initialSearchQuery = '',
  initialDepartmentId = '',
}: EquipmentViewProps) {
  const [equipment, setEquipment] = useState<any[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [filterTypeId, setFilterTypeId] = useState('');
  const [filterBrandId, setFilterBrandId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDepartmentId, setFilterDepartmentId] = useState(initialDepartmentId);

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  useEffect(() => {
    if (initialDepartmentId !== undefined) {
      setFilterDepartmentId(initialDepartmentId);
    }
  }, [initialDepartmentId]);

  // Modals
  const [isEqModalOpen, setIsEqModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [editingEq, setEditingEq] = useState<any>(null);
  const [selectedEq, setSelectedEq] = useState<any>(null);

  // Upgrade Modal State
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeEq, setUpgradeEq] = useState<any>(null);
  const [upgradeCategory, setUpgradeCategory] = useState('Ampliación de RAM');
  const [upgradeDescription, setUpgradeDescription] = useState('');
  const [upgradeComponent, setUpgradeComponent] = useState('');
  const [upgradeCost, setUpgradeCost] = useState('');
  const [savingUpgrade, setSavingUpgrade] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');

  // Maintenance Modal State
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [maintenanceEq, setMaintenanceEq] = useState<any>(null);
  const [maintenanceType, setMaintenanceType] = useState('Preventiva');
  const [maintenanceDescription, setMaintenanceDescription] = useState('');
  const [maintenanceNotes, setMaintenanceNotes] = useState('');
  const [nextServiceDate, setNextServiceDate] = useState('');
  const [savingMaintenance, setSavingMaintenance] = useState(false);
  const [maintenanceError, setMaintenanceError] = useState('');

  // Form Fields
  const [assetTag, setAssetTag] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [typeId, setTypeId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [modelId, setModelId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [vlan, setVlan] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [status, setStatus] = useState('disponible');
  const [dynamicValues, setDynamicValues] = useState<Record<string, any>>({});

  // Employee search state inside equipment modal when status === 'asignado'
  const [assignedEmployeeId, setAssignedEmployeeId] = useState('');
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');

  // Standalone Assignment modal form state
  const [assignEmployeeId, setAssignEmployeeId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [assignSearchQuery, setAssignSearchQuery] = useState('');
  const [assignFilterSectorId, setAssignFilterSectorId] = useState('');
  const [assignFilterBranchId, setAssignFilterBranchId] = useState('');
  const [assignFilterDepartmentId, setAssignFilterDepartmentId] = useState('');

  // Decommission Modal State (Dar de baja)
  const [isDecommissionModalOpen, setIsDecommissionModalOpen] = useState(false);
  const [decommissionEq, setDecommissionEq] = useState<any>(null);
  const [decommissionReason, setDecommissionReason] = useState('');
  const [decommissionError, setDecommissionError] = useState('');

  // Equipment Audit History & Documents Modal State
  const [isEqHistoryModalOpen, setIsEqHistoryModalOpen] = useState(false);
  const [selectedEqHistory, setSelectedEqHistory] = useState<any>(null);
  const [historyActiveTab, setHistoryActiveTab] = useState<'timeline' | 'documents'>('timeline');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docNotes, setDocNotes] = useState('');
  const [docError, setDocError] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const [error, setError] = useState('');

  // Batch Registration Modal state
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchTypeId, setBatchTypeId] = useState('');
  const [batchBrandId, setBatchBrandId] = useState('');
  const [batchModelId, setBatchModelId] = useState('');
  const [batchBranchId, setBatchBranchId] = useState('');
  const [batchDepartmentId, setBatchDepartmentId] = useState('');
  const [batchStatus, setBatchStatus] = useState('disponible');
  const [batchDynamicValues, setBatchDynamicValues] = useState<Record<string, any>>({});
  const [batchRows, setBatchRows] = useState<{ asset_tag: string; serial_number: string }[]>([
    { asset_tag: '', serial_number: '' },
    { asset_tag: '', serial_number: '' },
    { asset_tag: '', serial_number: '' },
  ]);
  const [batchPasteText, setBatchPasteText] = useState('');
  const [batchTab, setBatchTab] = useState<'rows' | 'paste'>('rows');
  const [batchError, setBatchError] = useState('');
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  // Batch Result Modal state
  const [isBatchResultModalOpen, setIsBatchResultModalOpen] = useState(false);
  const [batchResultData, setBatchResultData] = useState<{
    createdCount: number;
    skippedCount: number;
    createdItems: any[];
    skippedItems: any[];
    message: string;
  } | null>(null);

  const handleOpenBatchModal = () => {
    setBatchError('');
    const defaultType = equipmentTypes[0]?.id || '';
    setBatchTypeId(defaultType);
    setBatchBrandId('');
    setBatchModelId('');
    const defaultBranch = selectedBranchId || branches[0]?.id || '';
    setBatchBranchId(defaultBranch);
    setBatchDepartmentId('');
    setBatchStatus('disponible');
    setBatchDynamicValues({});
    setBatchRows([
      { asset_tag: '', serial_number: '' },
      { asset_tag: '', serial_number: '' },
      { asset_tag: '', serial_number: '' },
    ]);
    setBatchPasteText('');
    setBatchTab('rows');
    setIsBatchModalOpen(true);
  };

  const handleAddBatchRows = (count: number) => {
    const newRows = Array.from({ length: count }, () => ({ asset_tag: '', serial_number: '' }));
    setBatchRows((prev) => [...prev, ...newRows]);
  };

  const handleRemoveBatchRow = (index: number) => {
    if (batchRows.length <= 1) return;
    setBatchRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBatchRowChange = (index: number, field: 'asset_tag' | 'serial_number', val: string) => {
    setBatchRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val.toUpperCase() };
      return copy;
    });
  };

  const handleProcessPasteText = () => {
    if (!batchPasteText.trim()) return;
    const lines = batchPasteText.split('\n');
    const parsedRows: { asset_tag: string; serial_number: string }[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const parts = trimmed.split(/[,;\t|]+/).map((p) => p.trim().toUpperCase());
      if (parts.length >= 2) {
        parsedRows.push({ asset_tag: parts[0], serial_number: parts[1] });
      } else if (parts.length === 1 && parts[0]) {
        parsedRows.push({ asset_tag: parts[0], serial_number: '' });
      }
    }

    if (parsedRows.length > 0) {
      setBatchRows(parsedRows);
      setBatchTab('rows');
    }
  };

  const handleSaveBatchEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setBatchError('');

    const itemsToSubmit = batchRows
      .map((r) => ({
        asset_tag: r.asset_tag.trim().toUpperCase(),
        serial_number: r.serial_number.trim().toUpperCase(),
      }))
      .filter((r) => r.asset_tag || r.serial_number);

    if (itemsToSubmit.length === 0) {
      setBatchError('Debe ingresar al menos un equipo con Asset Tag y Número de Serie.');
      return;
    }

    setBatchSubmitting(true);
    try {
      const res = await fetch('/api/equipment/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          typeId: batchTypeId,
          brandId: batchBrandId || null,
          modelId: batchModelId || null,
          branchId: batchBranchId,
          departmentId: batchDepartmentId || null,
          status: batchStatus,
          dynamic_values: JSON.stringify(batchDynamicValues),
          items: itemsToSubmit,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar equipos por lote');

      setIsBatchModalOpen(false);
      loadEquipment();

      setBatchResultData({
        createdCount: data.createdCount || 0,
        skippedCount: data.skippedCount || 0,
        createdItems: data.createdItems || [],
        skippedItems: data.skippedItems || [],
        message: data.message,
      });
      setIsBatchResultModalOpen(true);
    } catch (err: any) {
      setBatchError(err.message);
    } finally {
      setBatchSubmitting(false);
    }
  };

  const handleOpenUpgradeModal = (eq: any) => {
    setUpgradeEq(eq);
    setUpgradeCategory('Ampliación de RAM');
    setUpgradeDescription('');
    setUpgradeComponent('');
    setUpgradeCost('');
    setUpgradeError('');
    setIsUpgradeModalOpen(true);
  };

  const handleOpenMaintenanceModal = (eq: any) => {
    setMaintenanceEq(eq);
    setMaintenanceType('Preventiva');
    setMaintenanceDescription('');
    setMaintenanceNotes('');
    setNextServiceDate('');
    setMaintenanceError('');
    setIsMaintenanceModalOpen(true);
  };

  const handleSaveUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upgradeEq || !upgradeDescription.trim()) return;
    setSavingUpgrade(true);
    setUpgradeError('');

    try {
      const res = await fetch(`/api/equipment/${upgradeEq.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newUpgrade: {
            category: upgradeCategory,
            description: upgradeDescription.trim(),
            component: upgradeComponent.trim(),
            cost: upgradeCost.trim(),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar upgrade');

      setIsUpgradeModalOpen(false);
      loadEquipment();
      if (selectedEq && selectedEq.id === upgradeEq.id) {
        setSelectedEq(data);
      }
      alert('¡Éxito! Upgrade registrado correctamente en la trazabilidad del equipo.');
    } catch (err: any) {
      setUpgradeError(err.message);
    } finally {
      setSavingUpgrade(false);
    }
  };

  const handleSaveMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintenanceEq || !maintenanceDescription.trim()) return;
    setSavingMaintenance(true);
    setMaintenanceError('');

    try {
      const res = await fetch(`/api/equipment/${maintenanceEq.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newMaintenance: {
            maintenanceType,
            description: maintenanceDescription.trim(),
            technicianNotes: maintenanceNotes.trim(),
            nextServiceDate,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar mantención');

      setIsMaintenanceModalOpen(false);
      loadEquipment();
      if (selectedEq && selectedEq.id === maintenanceEq.id) {
        setSelectedEq(data);
      }
      alert('¡Éxito! Mantención registrada correctamente en la trazabilidad del equipo.');
    } catch (err: any) {
      setMaintenanceError(err.message);
    } finally {
      setSavingMaintenance(false);
    }
  };

  const batchSelectedType = equipmentTypes.find((t) => t.id === batchTypeId);
  let batchDynamicDefs: DynamicAttributeDef[] = [];
  if (batchSelectedType && batchSelectedType.dynamic_attributes) {
    try {
      batchDynamicDefs = JSON.parse(batchSelectedType.dynamic_attributes);
    } catch (e) {
      batchDynamicDefs = [];
    }
  }

  const batchFilteredModelsForBrand = models.filter((m) => {
    if (batchBrandId && m.brandId !== batchBrandId) return false;
    if (batchTypeId && m.typeId && m.typeId !== batchTypeId) return false;
    return true;
  });

  useEffect(() => {
    if (initialDepartmentId !== undefined) {
      setFilterDepartmentId(initialDepartmentId);
    }
  }, [initialDepartmentId]);

  useEffect(() => {
    if (filterDepartmentId && departments.length > 0) {
      const deptObj = departments.find((d) => d.id === filterDepartmentId);
      if (deptObj) {
        if (selectedBranchId && deptObj.branchId !== selectedBranchId) {
          setFilterDepartmentId('');
        }
      }
    }
  }, [selectedBranchId, selectedSectorId, departments]);

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce search input by 250ms to prevent flooding API on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load static catalogs ONCE on mount
  useEffect(() => {
    loadTypes();
    loadBrands();
    loadModels();
    loadDepartments();
    loadEmployees();
  }, []);

  // Re-fetch equipment ONLY when filters or debounced search query changes
  useEffect(() => {
    setCurrentPage(1);
    loadEquipment();
  }, [selectedSectorId, selectedBranchId, debouncedSearchQuery, filterTypeId, filterBrandId, filterStatus, filterDepartmentId]);

  const loadEquipment = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (filterDepartmentId) {
        params.append('departmentId', filterDepartmentId);
        const deptObj = departments.find((d) => d.id === filterDepartmentId);
        if (deptObj && deptObj.branchId) {
          params.append('branchId', deptObj.branchId);
        } else if (selectedBranchId) {
          params.append('branchId', selectedBranchId);
        }
      } else {
        if (selectedBranchId) {
          params.append('branchId', selectedBranchId);
        } else if (selectedSectorId) {
          params.append('sectorId', selectedSectorId);
        }
      }

      if (filterTypeId) params.append('typeId', filterTypeId);
      if (filterBrandId) params.append('brandId', filterBrandId);
      if (filterStatus) params.append('status', filterStatus);
      if (debouncedSearchQuery) params.append('query', debouncedSearchQuery);

      const res = await fetch(`/api/equipment?${params.toString()}`);
      const data = await res.json();
      setEquipment(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading equipment:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTypes = async () => {
    try {
      const res = await fetch('/api/equipment-types');
      const data = await res.json();
      setEquipmentTypes(Array.isArray(data) ? data : []);
    } catch (e) {}
  };

  const loadBrands = async () => {
    try {
      const res = await fetch('/api/brands');
      const data = await res.json();
      setBrands(Array.isArray(data) ? data : []);
    } catch (e) {}
  };

  const loadModels = async () => {
    try {
      const res = await fetch('/api/models');
      const data = await res.json();
      setModels(Array.isArray(data) ? data : []);
    } catch (e) {}
  };

  const loadDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      setDepartments(Array.isArray(data) ? data : []);
    } catch (e) {}
  };

  const loadEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (e) {}
  };

  const currentTypeObj = equipmentTypes.find((t) => t.id === typeId);
  let currentAttrDefs: DynamicAttributeDef[] = [];
  if (currentTypeObj) {
    try {
      currentAttrDefs = JSON.parse(currentTypeObj.dynamic_attributes || '[]');
    } catch (e) {}
  }

  const filteredModelsForBrand = models.filter((m) => {
    const matchesBrand = !brandId || m.brandId === brandId;
    const matchesType = !typeId || !m.typeId || m.typeId === typeId;
    return matchesBrand && matchesType;
  });

  // Filter employees for assignment inside the modal
  const filteredEmployeesForModal = employees.filter((emp) => {
    const matchesBranch = !branchId || emp.branchId === branchId;
    const matchesStatus = emp.status === 'ACTIVO';
    const q = employeeSearchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      emp.full_name.toLowerCase().includes(q) ||
      emp.rut_document.toLowerCase().includes(q) ||
      emp.position.toLowerCase().includes(q);

    return matchesBranch && matchesStatus && matchesSearch;
  });

  const autoFillDynamicSpecs = (
    newModelId?: string,
    newBrandId?: string,
    newTypeId?: string,
    initialValues: Record<string, any> = {}
  ) => {
    const targetTypeId = newTypeId || typeId;
    const targetModelId = newModelId !== undefined ? newModelId : modelId;
    const targetBrandId = newBrandId !== undefined ? newBrandId : brandId;

    const tObj = equipmentTypes.find((t) => t.id === targetTypeId);
    if (!tObj) {
      setDynamicValues({});
      return {};
    }

    let attrDefs: DynamicAttributeDef[] = [];
    try {
      attrDefs = JSON.parse(tObj.dynamic_attributes || '[]');
    } catch (e) {
      setDynamicValues({});
      return {};
    }

    const mObj = models.find((m) => m.id === targetModelId);
    const bObj = brands.find((b) => b.id === targetBrandId);

    // Build fresh values scoped strictly to defined attrDefs for this EquipmentType!
    const freshValues: Record<string, any> = {};

    let parsedSpecs: any = {};
    if (mObj?.specs) {
      try {
        parsedSpecs = JSON.parse(mObj.specs || '{}');
      } catch (e) {}
    }

    attrDefs.forEach((attr) => {
      // Preserve explicit initial user value if present
      if (initialValues[attr.key] !== undefined && initialValues[attr.key] !== null) {
        freshValues[attr.key] = initialValues[attr.key];
        return;
      }

      const keyLower = attr.key.toLowerCase();
      const labelLower = attr.label.toLowerCase();

      // RAM Autofill ONLY if model explicitly defines RAM
      const isRamKey = keyLower.includes('ram') || labelLower.includes('ram') || keyLower.includes('memoria');
      if (isRamKey) {
        const val = mObj?.ram || parsedSpecs.ram;
        if (val) freshValues[attr.key] = val;
        return;
      }

      // Procesador Autofill ONLY if model explicitly defines processor
      const isCpuKey =
        keyLower.includes('procesador') ||
        labelLower.includes('procesador') ||
        keyLower.includes('processor') ||
        keyLower.includes('cpu');
      if (isCpuKey) {
        const val = mObj?.processor || parsedSpecs.processor;
        if (val) freshValues[attr.key] = val;
        return;
      }

      // Almacenamiento / Disco Autofill ONLY if model explicitly defines storage
      const isStorageKey =
        keyLower.includes('almacenamiento') ||
        labelLower.includes('almacenamiento') ||
        keyLower.includes('disco') ||
        labelLower.includes('disco') ||
        keyLower.includes('storage') ||
        keyLower.includes('ssd') ||
        keyLower.includes('hdd');
      if (isStorageKey) {
        const val = mObj?.storage || parsedSpecs.storage;
        if (val) freshValues[attr.key] = val;
        return;
      }

      // Tipo de Tinta / Tóner
      const isInkKey = keyLower.includes('tinta') || labelLower.includes('tinta') || keyLower.includes('toner') || keyLower.includes('ink');
      if (isInkKey && parsedSpecs.ink_type) {
        freshValues[attr.key] = parsedSpecs.ink_type;
        return;
      }

      // Puerto de Red
      const isNetKey = keyLower.includes('red') || labelLower.includes('red') || keyLower.includes('network') || keyLower.includes('puerto_red');
      if (isNetKey && parsedSpecs.network_port) {
        freshValues[attr.key] = parsedSpecs.network_port;
        return;
      }

      // Tamaño de Pantalla
      const isScreenKey = keyLower.includes('pantalla') || labelLower.includes('pantalla') || keyLower.includes('screen') || keyLower.includes('inches');
      if (isScreenKey && parsedSpecs.screen_size) {
        freshValues[attr.key] = parsedSpecs.screen_size;
        return;
      }

      // Lúmenes
      const isLumensKey = keyLower.includes('lumen') || labelLower.includes('lúmen') || labelLower.includes('lumen') || keyLower.includes('brillo');
      if (isLumensKey && parsedSpecs.lumens) {
        freshValues[attr.key] = parsedSpecs.lumens;
        return;
      }

      // Resolución
      const isResKey = keyLower.includes('resolucion') || labelLower.includes('resolución') || labelLower.includes('resolucion') || keyLower.includes('resolution');
      if (isResKey && parsedSpecs.resolution) {
        freshValues[attr.key] = parsedSpecs.resolution;
        return;
      }
    });

    // Preserve internal system metadata keys starting with '_' (e.g. _decommission_reason, _upgrades, _maintenances)
    Object.keys(initialValues).forEach((k) => {
      if (k.startsWith('_')) {
        freshValues[k] = initialValues[k];
      }
    });

    setDynamicValues(freshValues);
    return freshValues;
  };

  const handleOpenEqModal = (eq?: any) => {
    setError('');
    setEmployeeSearchQuery('');
    setAssignmentNotes('');
    if (eq) {
      setEditingEq(eq);
      setAssetTag(eq.asset_tag);
      setSerialNumber(eq.serial_number);
      setTypeId(eq.typeId);
      setBrandId(eq.brandId || '');
      setModelId(eq.modelId || '');
      setBranchId(eq.branchId);
      setStatus(eq.status || 'disponible');
      const activeAss = eq.assignments?.[0];
      setAssignedEmployeeId(activeAss?.employeeId || '');
      setDepartmentId(eq.departmentId || activeAss?.employee?.departmentId || '');

      let parsedDynValues: Record<string, any> = {};
      try {
        parsedDynValues = JSON.parse(eq.dynamic_values || '{}');
      } catch (e) {
        parsedDynValues = {};
      }

      setDynamicValues(parsedDynValues);
      setDecommissionReason(parsedDynValues._decommission_reason || '');
      setVlan(eq.vlan || eq.department?.vlan || '');
      setIpAddress(eq.ip_address || '');

      // Auto-fill/sync any missing spec like Almacenamiento from model upon opening edit modal
      setTimeout(() => {
        autoFillDynamicSpecs(eq.modelId || '', eq.brandId || '', eq.typeId, parsedDynValues);
      }, 0);
    } else {
      setEditingEq(null);
      setAssetTag('');
      setSerialNumber('');
      const defaultType = equipmentTypes[0]?.id || '';
      setTypeId(defaultType);
      setBrandId('');
      setModelId('');
      const defaultBranch = selectedBranchId || branches[0]?.id || '';
      setBranchId(defaultBranch);
      setDepartmentId('');
      setStatus('disponible');
      setAssignedEmployeeId('');
      setDynamicValues({});
      setDecommissionReason('');
      setVlan('');
      setIpAddress('');
    }
    setIsEqModalOpen(true);
  };

  const handleSaveEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (status === 'asignado' && !assignedEmployeeId) {
      setError('Debe seleccionar un funcionario para registrar o cambiar el estado a Asignado.');
      return;
    }

    if (status === 'dado_de_baja' && (!decommissionReason || !decommissionReason.trim())) {
      setError('Debe ingresar obligatoriamente una descripción o motivo del por qué el equipo es dado de baja.');
      return;
    }

    if (status === 'asignado' && assignedEmployeeId) {
      const selectedEmp = employees.find((x) => x.id === assignedEmployeeId);
      if (selectedEmp) {
        const empBranchId = selectedEmp.branchId;
        const empDeptId = selectedEmp.departmentId || '';

        if (branchId !== empBranchId || (departmentId || '') !== empDeptId) {
          const empBranchName = selectedEmp.branch?.name || 'Sucursal origen';
          const empDeptName = selectedEmp.department?.name || 'Sin Depto';
          const chosenBranchName = branches.find((b) => b.id === branchId)?.name || 'Sucursal elegida';
          const chosenDeptName = departments.find((d) => d.id === departmentId)?.name || 'Sin Depto';

          const confirmChange = confirm(
            `⚠️ ADVERTENCIA DE UBICACIÓN DIVERGENTE:\n\n` +
              `El funcionario seleccionado (${selectedEmp.full_name}) pertenece a:\n` +
              `• ${empBranchName} - ${empDeptName}\n\n` +
              `Pero el equipo se está asignando a:\n` +
              `• ${chosenBranchName} - ${chosenDeptName}\n\n` +
              `¿Desea transferir automáticamente al funcionario a la nueva ubicación del equipo?`
          );

          if (!confirmChange) {
            return;
          }
        }
      }
    }

    try {
      const url = editingEq ? `/api/equipment/${editingEq.id}` : '/api/equipment';
      const method = editingEq ? 'PUT' : 'POST';

      const finalDyn = {
        ...dynamicValues,
        ...(status === 'dado_de_baja' ? { _decommission_reason: decommissionReason.trim() } : {}),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_tag: assetTag,
          serial_number: serialNumber,
          typeId,
          brandId: brandId || null,
          modelId: modelId || null,
          branchId,
          departmentId: departmentId || null,
          vlan: vlan ? vlan.trim() : null,
          ip_address: ipAddress ? formatIPAddress(ipAddress).trim() : null,
          status,
          assignedEmployeeId: status === 'asignado' ? assignedEmployeeId : null,
          assignmentNotes,
          decommissionReason: decommissionReason.trim(),
          dynamic_values: JSON.stringify(finalDyn),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar equipo');

      setIsEqModalOpen(false);
      loadEquipment();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleOpenDecommissionModal = (eq: any) => {
    setDecommissionEq(eq);
    let parsedDyn: any = {};
    try {
      parsedDyn = JSON.parse(eq.dynamic_values || '{}');
    } catch (e) {}
    setDecommissionReason(parsedDyn._decommission_reason || '');
    setDecommissionError('');
    setIsDecommissionModalOpen(true);
  };

  const handleRunDecommission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decommissionEq) return;
    if (!decommissionReason || !decommissionReason.trim()) {
      setDecommissionError('Debe ingresar obligatoriamente una descripción o motivo del por qué se da de baja el equipo.');
      return;
    }

    try {
      const res = await fetch(`/api/equipment/${decommissionEq.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: decommissionReason.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al dar de baja el equipo');

      setIsDecommissionModalOpen(false);
      loadEquipment();
    } catch (err: any) {
      setDecommissionError(err.message);
    }
  };

  // Standalone Assignment Modal
  const handleOpenAssignModal = (eq: any) => {
    setSelectedEq(eq);
    setAssignEmployeeId('');
    setAssignNotes('');
    setAssignSearchQuery('');
    setAssignFilterSectorId(eq.branch?.sectorId || selectedSectorId || '');
    setAssignFilterBranchId(eq.branchId || '');
    setAssignFilterDepartmentId(eq.departmentId || '');
    setIsAssignModalOpen(true);
  };

  const filteredEmployeesForAssignModal = employees.filter((emp) => {
    if (emp.status !== 'ACTIVO') return false;
    if (assignFilterBranchId && emp.branchId !== assignFilterBranchId) return false;
    if (assignFilterSectorId && emp.branch?.sectorId && emp.branch.sectorId !== assignFilterSectorId) return false;
    if (assignFilterDepartmentId && emp.departmentId !== assignFilterDepartmentId) return false;

    if (assignSearchQuery.trim()) {
      const q = assignSearchQuery.toLowerCase().trim();
      const nameMatch = (emp.full_name || '').toLowerCase().includes(q);
      const rutMatch = (emp.rut_document || '').toLowerCase().includes(q);
      const posMatch = (emp.position || '').toLowerCase().includes(q);
      return nameMatch || rutMatch || posMatch;
    }
    return true;
  });

  const handleRunAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEq || !assignEmployeeId) return;
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentId: selectedEq.id,
          employeeId: assignEmployeeId,
          notes: assignNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al asignar equipo');

      setIsAssignModalOpen(false);
      loadEquipment();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRunUnassign = async (eq: any) => {
    if (!confirm(`¿Desea desasignar el equipo ${eq.asset_tag}?`)) return;
    try {
      const res = await fetch('/api/assignments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipmentId: eq.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al desasignar equipo');

      loadEquipment();
    } catch (err: any) {
      alert(err.message);
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
        setEquipment((prev) => prev.map((eq) => (eq.id === data.equipment.id ? data.equipment : eq)));
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
      setEquipment((prev) => prev.map((eq) => (eq.id === data.equipment.id ? data.equipment : eq)));
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Inventario Tecnológico de Equipos</h1>
          <p className="text-xs text-slate-500">Gestión de activos de hardware, marcas, modelos y asignación inmediata</p>
        </div>

        {userRole !== 'LECTOR' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleOpenBatchModal()}
              className="px-3.5 py-2 text-xs font-bold text-white bg-[#39BABD] hover:bg-[#2fa4a7] rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Layers className="w-4 h-4 text-white" />
              <span>Registrar por Lote</span>
            </button>
            <button
              onClick={() => handleOpenEqModal()}
              className="px-4 py-2 text-xs font-bold text-white bg-[#016098] hover:bg-[#014d7a] rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#39BABD]" />
              <span>Registrar Nuevo Equipo</span>
            </button>
          </div>
        )}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por Asset Tag, Serie, RUT, Funcionario, Marca, Modelo, Tipo..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer p-0.5"
              title="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>

        <select
          value={filterTypeId}
          onChange={(e) => setFilterTypeId(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none font-semibold text-slate-800"
        >
          <option value="">Todos los Tipos</option>
          {equipmentTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <select
          value={filterBrandId}
          onChange={(e) => setFilterBrandId(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#F7A517] outline-none font-semibold text-slate-700"
        >
          <option value="">Todas las Marcas</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none font-semibold text-slate-700"
        >
          <option value="">Todos los Estados</option>
          <option value="disponible">Disponible</option>
          <option value="asignado">Asignado</option>
          <option value="en_reparacion">En Reparación</option>
          <option value="dado_de_baja">Dado de Baja</option>
        </select>

        <select
          value={filterDepartmentId}
          onChange={(e) => setFilterDepartmentId(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none font-semibold text-slate-700 max-w-xs truncate"
        >
          <option value="">Todos los Departamentos</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} {d.branch?.name ? `(${d.branch.name})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Active Department Filter Banner */}
      {filterDepartmentId && (
        <div className="p-3 bg-[#016098]/10 border border-[#016098]/30 rounded-xl text-xs font-bold text-[#016098] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-[#016098]" />
            <span>
              Filtrando equipos asignados al departamento:{' '}
              <u className="font-extrabold text-slate-900">
                {departments.find((d) => d.id === filterDepartmentId)?.name || 'Seleccionado'}
              </u>{' '}
              ({equipment.filter((e) => e.departmentId === filterDepartmentId).length} equipos encontrados)
            </span>
          </div>
          <button
            onClick={() => setFilterDepartmentId('')}
            className="px-2.5 py-1 text-[11px] bg-white border border-[#016098]/30 text-[#016098] hover:bg-slate-100 rounded-lg cursor-pointer transition-colors shadow-2xs"
          >
            Limpiar filtro
          </button>
        </div>
      )}

      {/* Equipment Grid / Table */}
      {loading ? (
        <div className="p-8 text-center text-slate-500 font-medium">Cargando inventario de equipos...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Asset Tag / Serie</th>
                <th className="py-3 px-4">Tipo & Marca / Modelo</th>
                <th className="py-3 px-4">Sucursal & Depto</th>
                <th className="py-3 px-4">Estado Actual</th>
                <th className="py-3 px-4">Funcionario Asignado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {equipment
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((eq) => {
                const activeAssignment = eq.assignments?.[0];
                return (
                  <tr
                    key={eq.id}
                    onDoubleClick={() => {
                      setSelectedEqHistory(eq);
                      setHistoryActiveTab('timeline');
                      setIsEqHistoryModalOpen(true);
                    }}
                    className={
                      eq.status === 'dado_de_baja'
                        ? 'bg-rose-50/40 hover:bg-rose-50/70 transition-colors cursor-pointer'
                        : 'hover:bg-slate-50 cursor-pointer'
                    }
                    title="Doble clic para ver el historial y trazabilidad completa de auditoría de este equipo"
                  >
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">{eq.asset_tag}</div>
                      <div className="text-[10px] text-slate-400 font-mono">SN: {eq.serial_number}</div>
                      {(eq.vlan || eq.ip_address || eq.department?.vlan) && (
                        <div className="text-[10px] text-slate-500 font-mono flex flex-wrap items-center gap-1 mt-1">
                          {(eq.vlan || eq.department?.vlan) && (
                            <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold border border-indigo-200" title="VLAN del equipo / departamento">
                              VLAN: {eq.vlan || eq.department?.vlan}
                            </span>
                          )}
                          {eq.ip_address && (
                            <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono font-semibold" title="Dirección IP">
                              IP: {eq.ip_address}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{eq.type?.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                        {eq.brand?.name && (
                          <span className="font-bold text-[#F7A517]">{eq.brand.name}</span>
                        )}
                        {eq.model?.name && (
                          <span className="text-slate-600 font-medium"> ({eq.model.name})</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#016098]">{eq.branch?.name}</div>
                      <div className="text-[10px]">
                        {eq.department?.name ? (
                          <span className="text-slate-600 font-bold">{eq.department.name}</span>
                        ) : activeAssignment?.employee?.department?.name ? (
                          <span className="text-slate-600 font-bold">{activeAssignment.employee.department.name}</span>
                        ) : (
                          <span className="text-slate-400 italic font-semibold">Sin Depto Asignado</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {getStatusBadge(eq.status)}
                      {eq.status === 'dado_de_baja' && (() => {
                        let dyn: any = {};
                        try { dyn = JSON.parse(eq.dynamic_values || '{}'); } catch(e) {}
                        return dyn._decommission_reason ? (
                          <div className="text-[10px] text-rose-700 font-semibold italic mt-1 max-w-[180px] line-clamp-2" title={dyn._decommission_reason}>
                            Motivo: {dyn._decommission_reason}
                          </div>
                        ) : null;
                      })()}
                    </td>

                    <td className="py-3 px-4">
                      {activeAssignment ? (
                        <div className="bg-[#016098]/5 border border-[#016098]/20 p-2.5 rounded-xl">
                          <div className="font-bold text-[#016098] flex items-center space-x-1">
                            <User className="w-3.5 h-3.5 text-[#016098]" />
                            <span>{activeAssignment.employee?.full_name}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            RUN: {activeAssignment.employee?.rut_document}
                          </div>
                          <div className="text-[10px] font-semibold text-slate-600 mt-0.5">
                            {activeAssignment.employee?.department?.name ? (
                              <span className="text-slate-700 font-bold">Depto: {activeAssignment.employee.department.name}</span>
                            ) : (
                              <span className="text-slate-400 italic font-semibold">Sin Depto Asignado</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Sin asignación activa</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => {
                          setSelectedEq(eq);
                          setIsDetailModalOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-[#016098] hover:bg-slate-100 rounded-lg"
                        title="Ver especificaciones y detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          setSelectedEqHistory(eq);
                          setHistoryActiveTab('timeline');
                          setIsEqHistoryModalOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Ver Historial y Trazabilidad de Auditoría Completa"
                      >
                        <History className="w-4 h-4 text-indigo-600" />
                      </button>

                      <button
                        onClick={() => {
                          setSelectedEqHistory(eq);
                          setHistoryActiveTab('documents');
                          setIsEqHistoryModalOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer relative"
                        title="Ver y adjuntar documentos (Facturas, Garantías, Manuales)"
                      >
                        <Paperclip className="w-4 h-4 text-emerald-600" />
                        {(() => {
                          let docs: any[] = [];
                          try { docs = JSON.parse(eq.attached_documents || '[]'); } catch(e){}
                          return docs.length > 0 ? (
                            <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[9px] font-bold px-1 rounded-full">
                              {docs.length}
                            </span>
                          ) : null;
                        })()}
                      </button>

                      {userRole !== 'LECTOR' && (
                        <>
                          {eq.status === 'disponible' && (
                            <button
                              onClick={() => handleOpenAssignModal(eq)}
                              className="px-2.5 py-1 bg-[#016098] text-white font-bold text-[11px] rounded-lg hover:bg-[#014d7a] transition-colors inline-flex items-center space-x-1"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-[#39BABD]" />
                              <span>Asignar</span>
                            </button>
                          )}

                          {eq.status === 'asignado' && (
                            <button
                              onClick={() => handleRunUnassign(eq)}
                              className="px-2 py-1 bg-amber-100 text-amber-800 font-bold text-[11px] rounded-lg hover:bg-amber-200 transition-colors inline-flex items-center space-x-1"
                              title="Desasignar equipo"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>Desasignar</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEqModal(eq)}
                            className="p-1.5 text-slate-500 hover:text-[#016098] hover:bg-slate-100 rounded-lg"
                            title="Editar equipo"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenDecommissionModal(eq)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Dar de baja equipo (No se elimina del sistema)"
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
      {equipment.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={equipment.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="equipos"
        />
      )}

      {/* Equipment Form Modal with Integrated Employee Search for Assigned Status */}
      {isEqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-slate-800 text-lg">
              {editingEq ? 'Editar Equipo' : 'Registrar Nuevo Equipo'}
            </h3>

            {error && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl">{error}</div>}

            <form onSubmit={handleSaveEquipment} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Asset Tag (Único)</label>
                  <input
                    type="text"
                    required
                    value={assetTag}
                    onChange={(e) => setAssetTag(e.target.value)}
                    placeholder="AST-SCL-010"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Número de Serie</label>
                  <input
                    type="text"
                    required
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="SN-123456"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Equipo</label>
                <select
                  value={typeId}
                  onChange={(e) => {
                    const newTId = e.target.value;
                    setTypeId(newTId);
                    setDynamicValues({});
                    autoFillDynamicSpecs(modelId, brandId, newTId);
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none font-semibold text-slate-800"
                >
                  {equipmentTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Marca (Editable)</label>
                  <select
                    value={brandId}
                    onChange={(e) => {
                      const newBId = e.target.value;
                      setBrandId(newBId);
                      setModelId('');
                      autoFillDynamicSpecs('', newBId, typeId);
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#F7A517] outline-none font-semibold text-[#F7A517]"
                  >
                    <option value="">Sin Especificar</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Modelo (Editable)</label>
                  <select
                    value={modelId}
                    onChange={(e) => {
                      const newMId = e.target.value;
                      setModelId(newMId);
                      autoFillDynamicSpecs(newMId, brandId, typeId);
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#39BABD] outline-none font-semibold text-slate-700"
                  >
                    <option value="">Sin Especificar</option>
                    {filteredModelsForBrand.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 1. SUCURSAL Y DEPARTAMENTO */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sucursal</label>
                  <select
                    value={branchId}
                    onChange={(e) => {
                      setBranchId(e.target.value);
                      const depts = departments.filter((d) => d.branchId === e.target.value);
                      setDepartmentId(depts[0]?.id || '');
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Departamento</label>
                  <select
                    value={departmentId}
                    onChange={(e) => {
                      const newDeptId = e.target.value;
                      setDepartmentId(newDeptId);
                      if (newDeptId) {
                        const selectedDeptObj = departments.find((d) => d.id === newDeptId);
                        if (selectedDeptObj && selectedDeptObj.vlan) {
                          setVlan(selectedDeptObj.vlan);
                        }
                      }
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none"
                  >
                    <option value="">Sin Depto Asignado</option>
                    {departments
                      .filter((d) => d.branchId === branchId)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} {d.vlan ? `(VLAN: ${d.vlan})` : ''}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* 2. ESTADO OPERATIVO (Ubicado DEBAJO de Sucursal y Departamento) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Estado Operativo</label>
                <select
                  value={status}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    setStatus(newStatus);
                    if (newStatus === 'asignado' && assignedEmployeeId) {
                      const emp = employees.find((x) => x.id === assignedEmployeeId);
                      if (emp) {
                        setBranchId(emp.branchId);
                        const empDeptId = emp.departmentId || '';
                        setDepartmentId(empDeptId);
                        if (empDeptId) {
                          const selectedDeptObj = departments.find((d) => d.id === empDeptId);
                          if (selectedDeptObj && selectedDeptObj.vlan) {
                            setVlan(selectedDeptObj.vlan);
                          }
                        }
                      }
                    }
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none font-bold text-slate-800"
                >
                  <option value="disponible">Disponible</option>
                  <option value="asignado">Asignado</option>
                  <option value="en_reparacion">En Reparación</option>
                  <option value="dado_de_baja">Dado de Baja</option>
                </select>
              </div>

              {/* 3. NÚMERO DE VLAN Y DIRECCIÓN IP (Ubicados DEBAJO del Estado Operativo) */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Número de VLAN (Opcional)</span>
                    {departmentId && departments.find((d) => d.id === departmentId)?.vlan && (
                      <span className="text-[9px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded" title="VLAN heredada automáticamente del departamento">
                        Auto: Depto
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={vlan}
                    onChange={(e) => setVlan(e.target.value)}
                    placeholder="Ej: VLAN 100"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none font-medium bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Dirección IP (Opcional)</span>
                    <span className="text-[9px] text-[#016098] font-bold bg-[#016098]/10 px-1.5 py-0.5 rounded" title="Aplica formato IP automático al escribir o al salir del campo">
                      Máscara Auto IP
                    </span>
                  </label>
                  <input
                    type="text"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value.replace(/[^0-9.]/g, ''))}
                    onBlur={() => {
                      if (ipAddress) {
                        setIpAddress(formatIPAddress(ipAddress));
                      }
                    }}
                    onPaste={(e) => {
                      const pasted = e.clipboardData.getData('text');
                      if (pasted) {
                        setIpAddress(formatIPAddress(pasted));
                        e.preventDefault();
                      }
                    }}
                    placeholder="Ej: 19216818019 ➔ 192.168.180.19"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none font-mono bg-white"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1 font-medium">
                    💡 Ingrese la IP con o sin puntos (ej: <code>19216818019</code> se formateará automáticamente a <code>192.168.180.19</code>).
                  </span>
                </div>
              </div>

              {/* MOTIVO DE BAJA WHEN STATUS IS DADO_DE_BAJA */}
              {status === 'dado_de_baja' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5">
                  <label className="block text-xs font-bold text-rose-800 flex items-center space-x-1">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Motivo / Descripción de la Baja (Obligatorio) *</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={decommissionReason}
                    onChange={(e) => setDecommissionReason(e.target.value)}
                    placeholder="Ej: Falla irreparable en tarjeta madre, pantalla rota sin repuesto, obsolescencia..."
                    className="w-full p-2.5 text-xs border border-rose-300 rounded-lg outline-none bg-white font-medium focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              )}

              {/* INTEGRATED EMPLOYEE SEARCH & SELECTOR WHEN STATUS IS ASIGNADO */}
              {status === 'asignado' && (
                <div className="p-4 bg-[#016098]/5 border border-[#016098]/30 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#016098] flex items-center space-x-1.5">
                      <UserCheck className="w-4 h-4 text-[#39BABD]" />
                      <span>Búsqueda de Funcionario para Asignación Directa</span>
                    </label>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={employeeSearchQuery}
                      onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                      placeholder="Buscar por Nombre o RUT..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white"
                    />
                  </div>

                  <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg bg-white divide-y divide-slate-100">
                    {filteredEmployeesForModal.length > 0 ? (
                      filteredEmployeesForModal.map((emp) => {
                        const isSelected = assignedEmployeeId === emp.id;
                        return (
                          <div
                            key={emp.id}
                            onClick={() => {
                              setAssignedEmployeeId(emp.id);
                              // Auto-take employee's Branch & Department
                              setBranchId(emp.branchId);
                              setDepartmentId(emp.departmentId || '');
                            }}
                            className={`p-2 cursor-pointer transition-colors flex items-center justify-between text-xs ${
                              isSelected ? 'bg-[#016098]/10 font-bold text-[#016098]' : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div>
                              <div>{emp.full_name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                RUT: {emp.rut_document} | {emp.position} | {emp.branch?.name}
                              </div>
                            </div>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-[#016098]" />}
                          </div>
                        );
                      })
                    ) : (
                      <p className="p-3 text-xs text-slate-400 italic text-center">
                        No se encontraron funcionarios activos.
                      </p>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      value={assignmentNotes}
                      onChange={(e) => setAssignmentNotes(e.target.value)}
                      placeholder="Observaciones de entrega (ej: Incluye cargador y mochila)..."
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Warning Banner if Location Differs from Selected Employee */}
              {status === 'asignado' && assignedEmployeeId && (() => {
                const selectedEmp = employees.find((e) => e.id === assignedEmployeeId);
                if (!selectedEmp) return null;
                const isLocationDifferent = branchId !== selectedEmp.branchId || (departmentId || '') !== (selectedEmp.departmentId || '');
                if (!isLocationDifferent) return null;

                const empBranchName = selectedEmp.branch?.name || 'Sucursal Origen';
                const empDeptName = selectedEmp.department?.name || 'Sin Depto';
                const chosenBranchName = branches.find((b) => b.id === branchId)?.name || '';
                const chosenDeptName = departments.find((d) => d.id === departmentId)?.name || 'Sin Depto';

                return (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs font-medium space-y-1">
                    <div className="flex items-center space-x-1.5 font-bold text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>⚠️ Advertencia: Ubicación del equipo modificada manualmente</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      La sucursal/departamento seleccionada (<strong>{chosenBranchName}</strong> - <em>{chosenDeptName}</em>) difiere de la ubicación del funcionario asignado (<strong>{selectedEmp.full_name}</strong>: {empBranchName} - {empDeptName}). Se solicitará confirmación al guardar.
                    </p>
                  </div>
                );
              })()}

              {/* Dynamic Attributes Inputs */}
              {currentAttrDefs.length > 0 && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <Sliders className="w-4 h-4 text-[#39BABD]" />
                    <span>Especificaciones del Tipo ({currentTypeObj?.name})</span>
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    {currentAttrDefs.map((attr) => (
                      <div key={attr.key}>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">{attr.label}</label>
                        {attr.type === 'boolean' ? (
                          <select
                            value={dynamicValues[attr.key] ? 'true' : 'false'}
                            onChange={(e) =>
                              setDynamicValues({ ...dynamicValues, [attr.key]: e.target.value === 'true' })
                            }
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white font-medium"
                          >
                            <option value="true">Sí</option>
                            <option value="false">No</option>
                          </select>
                        ) : attr.type === 'select' && attr.options && attr.options.length > 0 ? (
                          <select
                            value={dynamicValues[attr.key] ?? ''}
                            onChange={(e) =>
                              setDynamicValues({ ...dynamicValues, [attr.key]: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white font-semibold text-slate-800"
                          >
                            <option value="">Seleccionar...</option>
                            {attr.options.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={attr.type === 'number' ? 'number' : 'text'}
                            value={dynamicValues[attr.key] ?? ''}
                            onChange={(e) =>
                              setDynamicValues({ ...dynamicValues, [attr.key]: e.target.value })
                            }
                            placeholder={attr.label}
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white font-semibold text-slate-800"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEqModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#016098] hover:bg-[#014d7a] rounded-xl shadow-xs"
                >
                  Guardar Equipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Equipment Detail Modal */}
      {isDetailModalOpen && selectedEq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-[#016098] bg-[#016098]/10 px-2 py-0.5 rounded-md">
                  {selectedEq.asset_tag}
                </span>
                <h3 className="font-bold text-slate-800 text-lg mt-1">{selectedEq.type?.name}</h3>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* DECOMMISSION CALLOUT BOX */}
              {selectedEq.status === 'dado_de_baja' && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center space-x-1.5 text-rose-800 font-bold">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>EQUIPO DADO DE BAJA DEL SISTEMA</span>
                  </div>
                  <p className="text-rose-900 font-medium pt-1">
                    <strong>Motivo / Descripción de la Baja:</strong>{' '}
                    {JSON.parse(selectedEq.dynamic_values || '{}')._decommission_reason || 'Sin motivo especificado'}
                  </p>
                  {JSON.parse(selectedEq.dynamic_values || '{}')._decommission_date && (
                    <p className="text-[11px] text-rose-700">
                      Fecha de baja: {JSON.parse(selectedEq.dynamic_values || '{}')._decommission_date}
                      {JSON.parse(selectedEq.dynamic_values || '{}')._decommission_by
                        ? ` (Registrado por: ${JSON.parse(selectedEq.dynamic_values || '{}')._decommission_by})`
                        : ''}
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[10px]">Número de Serie</span>
                  <span className="font-bold font-mono text-slate-800">{selectedEq.serial_number}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Marca / Modelo</span>
                  <span className="font-bold text-[#F7A517]">
                    {selectedEq.brand?.name || 'N/A'}{' '}
                    {selectedEq.model?.name ? `(${selectedEq.model.name})` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Sucursal</span>
                  <span className="font-bold text-[#016098]">{selectedEq.branch?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Departamento</span>
                  <span className="font-bold text-slate-700">
                    {selectedEq.department?.name || <span className="text-slate-400 italic font-semibold">Sin Depto Asignado</span>}
                  </span>
                </div>
              </div>

              {/* Active Assigned Employee Card */}
              {selectedEq.assignments?.[0]?.employee && (
                <div className="p-3 bg-[#016098]/10 border border-[#016098]/30 rounded-xl">
                  <span className="text-[10px] font-bold text-[#016098] uppercase block mb-1">
                    Funcionario Asignado Actualmente:
                  </span>
                  <div className="font-bold text-slate-900 text-sm">
                    {selectedEq.assignments[0].employee.full_name}
                  </div>
                  <div className="text-slate-600 text-xs font-mono">
                    RUT: {selectedEq.assignments[0].employee.rut_document} | Cargo:{' '}
                    {selectedEq.assignments[0].employee.position}
                  </div>
                </div>
              )}

              {/* Dynamic Values */}
              <div>
                <h4 className="font-bold text-slate-700 mb-1.5 flex items-center space-x-1">
                  <Sliders className="w-3.5 h-3.5 text-[#39BABD]" />
                  <span>Especificaciones Técnicas</span>
                </h4>
                {selectedEq.dynamic_values && selectedEq.dynamic_values !== '{}' ? (() => {
                  let parsedValues: Record<string, any> = {};
                  try { parsedValues = JSON.parse(selectedEq.dynamic_values || '{}'); } catch (e) {}

                  let typeAttrDefs: DynamicAttributeDef[] = [];
                  try { typeAttrDefs = JSON.parse(selectedEq.type?.dynamic_attributes || '[]'); } catch (e) {}

                  const labelMap: Record<string, string> = {};
                  typeAttrDefs.forEach((def) => {
                    labelMap[def.key] = def.label;
                  });

                  const filteredEntries = Object.entries(parsedValues).filter(([k]) => !k.startsWith('_'));

                  if (filteredEntries.length === 0) {
                    return <p className="text-slate-400 italic text-xs">Sin especificaciones registradas.</p>;
                  }

                  return (
                    <div className="grid grid-cols-2 gap-2 border border-slate-200 p-3 rounded-xl bg-white">
                      {filteredEntries.map(([k, v]) => {
                        const displayLabel = labelMap[k] || k.replace(/_/g, ' ').toUpperCase();
                        const displayVal = typeof v === 'boolean' ? (v ? 'Sí' : 'No') : String(v);
                        return (
                          <div key={k}>
                            <span className="text-slate-400 text-[10px] block font-bold uppercase">{displayLabel}</span>
                            <span className="font-bold text-slate-800 text-xs">{displayVal}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })() : (
                  <p className="text-slate-400 italic text-xs">Sin especificaciones registradas.</p>
                )}
              </div>

              {/* Upgrades Section */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Upgrades Tecnológicos Realizados</span>
                  </h4>
                  {userRole !== 'LECTOR' && (
                    <button
                      onClick={() => handleOpenUpgradeModal(selectedEq)}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] rounded-lg shadow-xs flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Registrar Upgrade</span>
                    </button>
                  )}
                </div>

                {(() => {
                  let dyn: any = {};
                  try { dyn = JSON.parse(selectedEq.dynamic_values || '{}'); } catch(e) {}
                  const upgrades: any[] = Array.isArray(dyn._upgrades) ? dyn._upgrades : [];

                  if (upgrades.length === 0) {
                    return (
                      <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                        No se registraron upgrades previos para este equipo.
                      </p>
                    );
                  }

                  return (
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-amber-200/80 rounded-xl p-2.5 bg-amber-50/30 divide-y divide-amber-200">
                      {upgrades.map((upg: any) => (
                        <div key={upg.id} className="pt-2 first:pt-0 space-y-1 text-xs">
                          <div className="flex justify-between items-center font-bold text-amber-900">
                            <span className="px-2 py-0.5 bg-amber-100 border border-amber-300 rounded-md text-[10px]">
                              {upg.category}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">🕒 {upg.timestamp}</span>
                          </div>
                          <div className="font-bold text-slate-900">{upg.description}</div>
                          {upg.component && (
                            <div className="text-[11px] text-slate-600 font-medium">Componente: {upg.component}</div>
                          )}
                          <div className="text-[10px] text-[#016098] font-bold pt-0.5">
                            👤 Realizado por: <strong>{upg.userName}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Maintenances Section */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>Mantenciones Realizadas al Equipo</span>
                  </h4>
                  {userRole !== 'LECTOR' && (
                    <button
                      onClick={() => handleOpenMaintenanceModal(selectedEq)}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg shadow-xs flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Registrar Mantención</span>
                    </button>
                  )}
                </div>

                {(() => {
                  let dyn: any = {};
                  try { dyn = JSON.parse(selectedEq.dynamic_values || '{}'); } catch(e) {}
                  const mnts: any[] = Array.isArray(dyn._maintenances) ? dyn._maintenances : [];

                  if (mnts.length === 0) {
                    return (
                      <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                        No se registraron mantenciones previas para este equipo.
                      </p>
                    );
                  }

                  return (
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-indigo-200/80 rounded-xl p-2.5 bg-indigo-50/30 divide-y divide-indigo-200">
                      {mnts.map((m: any) => (
                        <div key={m.id} className="pt-2 first:pt-0 space-y-1 text-xs">
                          <div className="flex justify-between items-center font-bold text-indigo-900">
                            <span className="px-2 py-0.5 bg-indigo-100 border border-indigo-300 rounded-md text-[10px]">
                              {m.maintenanceType}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">🕒 {m.timestamp}</span>
                          </div>
                          <div className="font-bold text-slate-900">{m.description}</div>
                          {m.technicianNotes && (
                            <div className="text-[11px] text-slate-600 italic">Notas: {m.technicianNotes}</div>
                          )}
                          <div className="text-[10px] text-[#016098] font-bold pt-0.5">
                            👤 Realizado por: <strong>{m.userName}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="flex justify-end pt-2">
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

      {/* Decommission Equipment Modal (Dar de Baja) */}
      {isDecommissionModalOpen && decommissionEq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-2xl">
                <XCircle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Dar de Baja Equipo</h3>
                <p className="text-xs text-slate-500">
                  Asset Tag: <strong className="font-mono text-slate-800">{decommissionEq.asset_tag}</strong> ({decommissionEq.type?.name || 'Equipo'})
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs space-y-1">
              <p>⚠️ <strong>Atención:</strong> Los equipos <strong>no son eliminados del sistema</strong>.</p>
              <p>Pasará a estado <strong>"Dado de Baja"</strong> y se liberará de cualquier funcionario asignado, conservando el registro e historial.</p>
            </div>

            {decommissionError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl font-semibold">
                {decommissionError}
              </div>
            )}

            <form onSubmit={handleRunDecommission} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motivo / Descripción de la Baja *
                </label>
                <textarea
                  required
                  rows={3}
                  value={decommissionReason}
                  onChange={(e) => setDecommissionReason(e.target.value)}
                  placeholder="Ej: Falla irreversible en tarjeta madre, pantalla rota sin repuestos, obsolescencia..."
                  className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none font-medium"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDecommissionModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
                >
                  Confirmar Dar de Baja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Standalone Assignment Modal */}
      {isAssignModalOpen && selectedEq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-[#016098]/10 rounded-xl text-[#016098]">
                  <UserCheck className="w-5 h-5 text-[#39BABD]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Asignar Equipo a Funcionario</h3>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-xs font-mono font-bold text-[#016098] bg-[#016098]/10 px-2 py-0.5 rounded-md">
                      {selectedEq.asset_tag}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {selectedEq.type?.name} {selectedEq.brand?.name ? `(${selectedEq.brand.name})` : ''}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRunAssignment} className="space-y-4">
              {/* Equipment Summary Callout */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block text-[10px]">Número de Serie</span>
                  <span className="font-mono font-bold text-slate-800">{selectedEq.serial_number || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Ubicación Actual del Equipo</span>
                  <span className="font-bold text-[#016098]">
                    {selectedEq.branch?.name} {selectedEq.department?.name ? `(${selectedEq.department.name})` : ''}
                  </span>
                </div>
              </div>

              {/* Filters Section for Finding Employee */}
              <div className="p-3.5 bg-[#016098]/5 border border-[#016098]/20 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#016098] flex items-center space-x-1.5">
                    <Search className="w-3.5 h-3.5 text-[#39BABD]" />
                    <span>Filtros y Búsqueda de Funcionarios</span>
                  </label>
                  <span className="text-[10px] font-bold text-slate-500">
                    {filteredEmployeesForAssignModal.length} funcionarios encontrados
                  </span>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={assignSearchQuery}
                    onChange={(e) => setAssignSearchQuery(e.target.value)}
                    placeholder="Buscar por Nombre, RUT / RUN o Cargo..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl outline-none bg-white focus:ring-2 focus:ring-[#016098] font-medium"
                  />
                  {assignSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setAssignSearchQuery('')}
                      className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600 font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filter Slices: Sector, Branch, Department */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Sector</label>
                    <select
                      value={assignFilterSectorId}
                      onChange={(e) => {
                        setAssignFilterSectorId(e.target.value);
                        setAssignFilterBranchId('');
                        setAssignFilterDepartmentId('');
                      }}
                      className="w-full px-2 py-1 text-[11px] border border-slate-300 rounded-lg outline-none bg-white font-medium text-slate-800"
                    >
                      <option value="">Todos los Sectores</option>
                      {branches
                        .map((b) => b.sector)
                        .filter((sec, idx, self) => sec && self.findIndex((s) => s?.id === sec?.id) === idx)
                        .map((sec) => (
                          <option key={sec.id} value={sec.id}>
                            {sec.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Sucursal</label>
                    <select
                      value={assignFilterBranchId}
                      onChange={(e) => {
                        setAssignFilterBranchId(e.target.value);
                        setAssignFilterDepartmentId('');
                      }}
                      className="w-full px-2 py-1 text-[11px] border border-slate-300 rounded-lg outline-none bg-white font-medium text-slate-800"
                    >
                      <option value="">Todas las Sucursales</option>
                      {branches
                        .filter((b) => !assignFilterSectorId || b.sectorId === assignFilterSectorId)
                        .map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.code})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Departamento</label>
                    <select
                      value={assignFilterDepartmentId}
                      onChange={(e) => setAssignFilterDepartmentId(e.target.value)}
                      className="w-full px-2 py-1 text-[11px] border border-slate-300 rounded-lg outline-none bg-white font-medium text-slate-800"
                    >
                      <option value="">Todos los Deptos.</option>
                      {departments
                        .filter((d) => !assignFilterBranchId || d.branchId === assignFilterBranchId)
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Employee Selection List */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Seleccionar Funcionario *
                </label>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl bg-white divide-y divide-slate-100">
                  {filteredEmployeesForAssignModal.length > 0 ? (
                    filteredEmployeesForAssignModal.map((emp) => {
                      const isSelected = assignEmployeeId === emp.id;
                      return (
                        <div
                          key={emp.id}
                          onClick={() => setAssignEmployeeId(emp.id)}
                          className={`p-2.5 cursor-pointer transition-colors flex items-center justify-between text-xs ${
                            isSelected
                              ? 'bg-[#016098]/10 font-bold text-[#016098] border-l-4 border-[#016098]'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                              <span>{emp.full_name}</span>
                              <span className="text-[10px] font-mono text-slate-500 font-normal">
                                ({emp.rut_document})
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              Cargo: <strong className="text-slate-700">{emp.position}</strong>
                            </div>
                            <div className="text-[10px] text-[#016098] font-semibold">
                              📍 {emp.branch?.name} {emp.department?.name ? `(${emp.department.name})` : '(Sin Depto)'}
                            </div>
                          </div>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-[#016098] shrink-0" />}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-400 italic">
                      No se encontraron funcionarios activos que coincidan con la búsqueda.
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Employee Info Card */}
              {assignEmployeeId && (() => {
                const selEmp = employees.find((e) => e.id === assignEmployeeId);
                if (!selEmp) return null;
                return (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1 text-emerald-950 font-medium">
                    <div className="font-bold text-emerald-900 flex items-center space-x-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Funcionario Seleccionado: {selEmp.full_name}</span>
                    </div>
                    <p className="text-[11px] text-emerald-800">
                      RUT: {selEmp.rut_document} | Cargo: {selEmp.position}
                    </p>
                    <p className="text-[10px] text-emerald-700 font-semibold pt-0.5">
                      💡 El equipo actualizará automáticamente su ubicación a: <strong>{selEmp.branch?.name}</strong> {selEmp.department?.name ? `(${selEmp.department.name})` : ''}.
                    </p>
                  </div>
                );
              })()}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observaciones / Notas de Entrega (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="Ej: Entrega de equipo en buen estado con cargador, bolso y mouse..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none font-medium bg-white"
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
                  disabled={!assignEmployeeId}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#016098] hover:bg-[#014d7a] rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  Confirmar Asignación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Equipment Registration Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-[#39BABD]/10 rounded-xl text-[#39BABD]">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Registrar Equipos por Lote</h3>
                  <p className="text-xs text-slate-500">Mismas características técnicas y ubicación, múltiples series / tags</p>
                </div>
              </div>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {batchError && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl font-medium">{batchError}</div>}

            <form onSubmit={handleSaveBatchEquipment} className="space-y-4">
              {/* Section 1: Características Compartidas */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-3">
                <h4 className="text-xs font-bold text-[#016098] uppercase tracking-wider flex items-center space-x-1.5">
                  <Sliders className="w-4 h-4 text-[#39BABD]" />
                  <span>1. Características Compartidas del Lote</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Equipo *</label>
                    <select
                      value={batchTypeId}
                      onChange={(e) => {
                        setBatchTypeId(e.target.value);
                        setBatchDynamicValues({});
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none font-semibold"
                    >
                      {equipmentTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Marca</label>
                      <select
                        value={batchBrandId}
                        onChange={(e) => {
                          setBatchBrandId(e.target.value);
                          setBatchModelId('');
                        }}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#F7A517] outline-none font-semibold text-[#F7A517]"
                      >
                        <option value="">Sin Especificar</option>
                        {brands.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Modelo</label>
                      <select
                        value={batchModelId}
                        onChange={(e) => setBatchModelId(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#39BABD] outline-none font-semibold"
                      >
                        <option value="">Sin Especificar</option>
                        {batchFilteredModelsForBrand.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Sucursal Ubicación *</label>
                    <select
                      value={batchBranchId}
                      onChange={(e) => {
                        setBatchBranchId(e.target.value);
                        setBatchDepartmentId('');
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Departamento</label>
                    <select
                      value={batchDepartmentId}
                      onChange={(e) => setBatchDepartmentId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none"
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
                  </div>
                </div>

                {/* Dynamic Attributes for Batch */}
                {batchDynamicDefs.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/80 space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 block">Especificaciones Técnicas Compartidas</span>
                    <div className="grid grid-cols-2 gap-2">
                      {batchDynamicDefs.map((attr) => (
                        <div key={attr.key}>
                          <label className="block text-[11px] text-slate-600 mb-0.5 font-medium">{attr.label}</label>
                          <input
                            type="text"
                            value={batchDynamicValues[attr.key] || ''}
                            onChange={(e) =>
                              setBatchDynamicValues({
                                ...batchDynamicValues,
                                [attr.key]: e.target.value.toUpperCase(),
                              })
                            }
                            placeholder={attr.label}
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none uppercase font-mono bg-white"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2: Lista de Equipos a Crear */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                    <Tag className="w-4 h-4 text-[#016098]" />
                    <span>2. Identificadores de Equipos del Lote ({batchRows.filter(r => r.asset_tag || r.serial_number).length} Válidos)</span>
                  </h4>

                  <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setBatchTab('rows')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        batchTab === 'rows' ? 'bg-white text-[#016098] shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Filas ({batchRows.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setBatchTab('paste')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        batchTab === 'paste' ? 'bg-white text-[#016098] shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Pegar Masivo
                    </button>
                  </div>
                </div>

                {batchTab === 'rows' ? (
                  <div className="space-y-2">
                    <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                      {batchRows.map((row, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <span className="text-[11px] font-mono font-bold text-slate-400 w-6 text-right">#{idx + 1}</span>
                          <input
                            type="text"
                            value={row.asset_tag}
                            onChange={(e) => handleBatchRowChange(idx, 'asset_tag', e.target.value)}
                            placeholder="Asset Tag (ej: CMDS400)"
                            className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none font-mono uppercase"
                          />
                          <input
                            type="text"
                            value={row.serial_number}
                            onChange={(e) => handleBatchRowChange(idx, 'serial_number', e.target.value)}
                            placeholder="Nº Serie (ej: SN-123456)"
                            className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none font-mono uppercase"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveBatchRow(idx)}
                            disabled={batchRows.length <= 1}
                            className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded-lg cursor-pointer"
                            title="Eliminar fila"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleAddBatchRows(1)}
                        className="px-3 py-1.5 text-xs font-bold text-[#016098] bg-[#016098]/10 hover:bg-[#016098]/20 rounded-xl cursor-pointer"
                      >
                        + 1 Fila
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddBatchRows(5)}
                        className="px-3 py-1.5 text-xs font-bold text-[#016098] bg-[#016098]/10 hover:bg-[#016098]/20 rounded-xl cursor-pointer"
                      >
                        + 5 Filas
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddBatchRows(10)}
                        className="px-3 py-1.5 text-xs font-bold text-[#016098] bg-[#016098]/10 hover:bg-[#016098]/20 rounded-xl cursor-pointer"
                      >
                        + 10 Filas
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-500">
                      Pegue las líneas separadas por coma, tabulación o punto y coma (Formato: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">AssetTag, Serie</code>):
                    </p>
                    <textarea
                      rows={5}
                      value={batchPasteText}
                      onChange={(e) => setBatchPasteText(e.target.value)}
                      placeholder={`CMDS401, MXL90001\nCMDS402, MXL90002\nCMDS403, MXL90003`}
                      className="w-full p-3 text-xs border border-slate-300 rounded-xl font-mono outline-none uppercase focus:ring-2 focus:ring-[#016098]"
                    />
                    <button
                      type="button"
                      onClick={handleProcessPasteText}
                      className="px-4 py-2 text-xs font-bold text-white bg-[#016098] hover:bg-[#014d7a] rounded-xl cursor-pointer"
                    >
                      Cargar Filas desde Texto
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={batchSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#39BABD] hover:bg-[#2fa4a7] rounded-xl shadow-xs disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>{batchSubmitting ? 'Guardando Lote...' : 'Crear Equipos por Lote'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Result Modal */}
      {isBatchResultModalOpen && batchResultData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-[#39BABD]/10 rounded-xl text-[#39BABD]">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Resultado del Registro por Lote</h3>
                  <p className="text-xs text-slate-500">Resumen de carga de activos en el inventario</p>
                </div>
              </div>
              <button
                onClick={() => setIsBatchResultModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Summary Stat Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <span className="text-2xl font-black text-emerald-700 block">{batchResultData.createdCount}</span>
                <span className="text-[11px] font-bold text-emerald-800 uppercase">Equipos Creados</span>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                <span className="text-2xl font-black text-amber-700 block">{batchResultData.skippedCount}</span>
                <span className="text-[11px] font-bold text-amber-800 uppercase">Equipos Omitidos</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-medium bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              {batchResultData.message}
            </p>

            {/* Skipped Items Alert & Detail Table */}
            {batchResultData.skippedCount > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-amber-800 flex items-center space-x-1.5 bg-amber-100/70 p-2 rounded-lg">
                  <XCircle className="w-4 h-4 text-amber-600" />
                  <span>Detalle de Equipos NO Cargados (Ya Existían en la Plataforma):</span>
                </h4>

                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Asset Tag</th>
                        <th className="py-2 px-3">Nº Serie</th>
                        <th className="py-2 px-3">Motivo Omisión</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {batchResultData.skippedItems.map((item, idx) => (
                        <tr key={idx} className="bg-amber-50/40 hover:bg-amber-50">
                          <td className="py-2 px-3 font-mono font-bold text-slate-900">{item.asset_tag}</td>
                          <td className="py-2 px-3 font-mono text-slate-700">{item.serial_number}</td>
                          <td className="py-2 px-3 text-[11px] text-amber-700 font-medium">{item.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBatchResultModalOpen(false)}
                className="px-5 py-2 text-xs font-bold text-white bg-[#016098] hover:bg-[#014d7a] rounded-xl shadow-xs cursor-pointer"
              >
                Entendido / Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGISTRAR UPGRADE MODAL */}
      {isUpgradeModalOpen && upgradeEq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Registrar Upgrade a Equipo</h3>
                  <p className="text-xs text-slate-500">
                    Asset Tag: <strong className="font-mono text-slate-900">{upgradeEq.asset_tag}</strong> ({upgradeEq.type?.name})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUpgradeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {upgradeError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold">
                {upgradeError}
              </div>
            )}

            <form onSubmit={handleSaveUpgrade} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Categoría del Upgrade *</label>
                <select
                  value={upgradeCategory}
                  onChange={(e) => setUpgradeCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-bold text-slate-800"
                >
                  <option value="Ampliación de RAM">Ampliación de Memoria RAM</option>
                  <option value="Cambio / Upgrade de Almacenamiento (SSD/HDD)">Cambio / Upgrade de Almacenamiento (SSD/HDD)</option>
                  <option value="Actualización de Procesador (CPU)">Actualización de Procesador (CPU)</option>
                  <option value="Adición / Upgrade de Tarjeta de Video (GPU)">Adición / Upgrade de Tarjeta de Video (GPU)</option>
                  <option value="Reemplazo / Upgrade de Batería">Reemplazo / Upgrade de Batería</option>
                  <option value="Cambio / Upgrade de Pantalla">Cambio / Upgrade de Pantalla</option>
                  <option value="Mejora de Conectividad / Red">Mejora de Conectividad / Red</option>
                  <option value="Otro Upgrade Hardware/Software">Otro Upgrade Hardware/Software</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción Detallada del Upgrade *</label>
                <textarea
                  required
                  rows={3}
                  value={upgradeDescription}
                  onChange={(e) => setUpgradeDescription(e.target.value)}
                  placeholder="Ej: Se instalaron 2 módulos Corsair Vengeance DDR4 de 16GB (32GB Total) a 3200MHz..."
                  className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Componente Instalado (Opcional)</label>
                  <input
                    type="text"
                    value={upgradeComponent}
                    onChange={(e) => setUpgradeComponent(e.target.value)}
                    placeholder="Ej: Kingston NV2 1TB NVMe"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Costo / Presupuesto (Opcional)</label>
                  <input
                    type="text"
                    value={upgradeCost}
                    onChange={(e) => setUpgradeCost(e.target.value)}
                    placeholder="Ej: $65.000 CLP"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 font-medium">
                💡 El registro guardará automáticamente la fecha y la identidad del usuario responsable de realizar el upgrade.
              </div>

              <div className="flex justify-end space-x-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUpgradeModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingUpgrade}
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-xs disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>{savingUpgrade ? 'Guardando...' : 'Registrar Upgrade'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTRAR MANTENCIÓN MODAL */}
      {isMaintenanceModalOpen && maintenanceEq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Registrar Mantención a Equipo</h3>
                  <p className="text-xs text-slate-500">
                    Asset Tag: <strong className="font-mono text-slate-900">{maintenanceEq.asset_tag}</strong> ({maintenanceEq.type?.name})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMaintenanceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {maintenanceError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold">
                {maintenanceError}
              </div>
            )}

            <form onSubmit={handleSaveMaintenance} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Mantención *</label>
                <select
                  value={maintenanceType}
                  onChange={(e) => setMaintenanceType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800"
                >
                  <option value="Preventiva">Mantención Preventiva (Limpieza & Ajustes)</option>
                  <option value="Correctiva">Mantención Correctiva (Reparación de Falla)</option>
                  <option value="Limpieza Interna y Pasta Térmica">Limpieza Interna y Pasta Térmica</option>
                  <option value="Servicio Técnico Externo">Servicio Técnico Externo / Garantía</option>
                  <option value="Formateo y Reinstalación de SO">Formateo y Reinstalación de SO</option>
                  <option value="Cambio de Kit / Consumibles">Cambio de Kit / Consumibles (Impresoras)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción de la Mantención Realizada *</label>
                <textarea
                  required
                  rows={3}
                  value={maintenanceDescription}
                  onChange={(e) => setMaintenanceDescription(e.target.value)}
                  placeholder="Ej: Se realizó limpieza con aire comprimido, reemplazo de pasta térmica Arctic MX-4 y revisión del ventilador..."
                  className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notas del Técnico / Observaciones (Opcional)</label>
                <input
                  type="text"
                  value={maintenanceNotes}
                  onChange={(e) => setMaintenanceNotes(e.target.value)}
                  placeholder="Ej: Equipo quedó operando a 45°C en reposo. Se sugiere próxima mantención en 6 meses."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 font-medium">
                💡 El registro guardará automáticamente la fecha y la identidad del técnico/usuario que ejecutó la mantención.
              </div>

              <div className="flex justify-end space-x-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMaintenanceModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingMaintenance}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>{savingMaintenance ? 'Guardando...' : 'Registrar Mantención'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AUDIT EVENT HISTORY MODAL FOR EQUIPMENT */}
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
                  try { docs = JSON.parse(selectedEqHistory.attached_documents || '[]'); } catch(e){}
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

                // Fallback check in dynamic_values
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
