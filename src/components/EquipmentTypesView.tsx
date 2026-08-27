'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Settings,
  PlusCircle,
  CheckCircle2,
  Sliders,
  Tag,
  Cpu,
  Check,
  Search,
  Filter,
  X,
  AlertTriangle,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import { DynamicAttributeDef } from '@/types';
import Pagination from './Pagination';

interface EquipmentTypesViewProps {
  userRole: string;
  sectors?: any[];
  selectedSectorId?: string;
}

export default function EquipmentTypesView({
  userRole,
  sectors = [],
  selectedSectorId = '',
}: EquipmentTypesViewProps) {
  const [activeTab, setActiveTab] = useState<'types' | 'brands' | 'models'>('types');
  const [types, setTypes] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & dropdown filters inside tabs
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('');

  // Target Sector Selection for SuperAdmin Multi-Sector Propagation
  const [targetSectorIds, setTargetSectorIds] = useState<string[]>(['ALL']);

  // SuperAdmin Warning Confirmation Alert Modal State
  const [isConfirmAlertOpen, setIsConfirmAlertOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    actionName: string;
    callback: () => Promise<void>;
  } | null>(null);

  // Equipment Type Modal State
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);
  const [typeName, setTypeName] = useState('');
  const [typeDescription, setTypeDescription] = useState('');
  const [attributes, setAttributes] = useState<DynamicAttributeDef[]>([]);
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);

  const [attrKey, setAttrKey] = useState('');
  const [attrLabel, setAttrLabel] = useState('');
  const [attrType, setAttrType] = useState<'text' | 'number' | 'select' | 'boolean'>('text');
  const [attrOptions, setAttrOptions] = useState('');

  // Brand Modal State
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any>(null);
  const [brandName, setBrandName] = useState('');

  // Model Modal State
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<any>(null);
  const [modelName, setModelName] = useState('');
  const [modelBrandId, setModelBrandId] = useState('');
  const [modelTypeId, setModelTypeId] = useState('');
  const [modelRam, setModelRam] = useState('');
  const [modelProcessor, setModelProcessor] = useState('');
  const [modelStorage, setModelStorage] = useState('');
  const [modelInkType, setModelInkType] = useState('');
  const [modelNetworkPort, setModelNetworkPort] = useState('');
  const [modelScreenSize, setModelScreenSize] = useState('');
  const [modelLumens, setModelLumens] = useState('');
  const [modelResolution, setModelResolution] = useState('');

  // Brand Models Modal State (Doble clic en Marcas)
  const [isBrandModelsModalOpen, setIsBrandModelsModalOpen] = useState(false);
  const [selectedBrandModal, setSelectedBrandModal] = useState<any>(null);
  const [brandModelsSearchQuery, setBrandModelsSearchQuery] = useState('');

  // Type Models Modal State (Clic en Modelos dentro de Tipos)
  const [isTypeModelsModalOpen, setIsTypeModelsModalOpen] = useState(false);
  const [selectedTypeModal, setSelectedTypeModal] = useState<any>(null);

  // Pagination states
  const [typesPage, setTypesPage] = useState(1);
  const [typesPageSize, setTypesPageSize] = useState(12);
  const [brandsPage, setBrandsPage] = useState(1);
  const [brandsPageSize, setBrandsPageSize] = useState(12);
  const [modelsPage, setModelsPage] = useState(1);
  const [modelsPageSize, setModelsPageSize] = useState(15);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleOpenBrandModelsModal = (brand: any) => {
    setSelectedBrandModal(brand);
    setBrandModelsSearchQuery('');
    setIsBrandModelsModalOpen(true);
  };

  const handleOpenTypeModelsModal = (type: any) => {
    setSelectedTypeModal(type);
    setIsTypeModelsModalOpen(true);
  };

  useEffect(() => {
    setTypesPage(1);
    setBrandsPage(1);
    setModelsPage(1);
  }, [searchQuery, selectedBrandFilter, selectedTypeFilter]);

  useEffect(() => {
    loadAllData();
  }, [selectedSectorId]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const queryParam = selectedSectorId ? `?sectorId=${selectedSectorId}` : '';
      const [resT, resB, resM] = await Promise.all([
        fetch(`/api/equipment-types${queryParam}`),
        fetch(`/api/brands${queryParam}`),
        fetch(`/api/models${queryParam}`),
      ]);
      const dataT = await resT.json();
      const dataB = await resB.json();
      const dataM = await resM.json();

      setTypes(Array.isArray(dataT) ? dataT : []);
      setBrands(Array.isArray(dataB) ? dataB : []);
      setModels(Array.isArray(dataM) ? dataM : []);
    } catch (err) {
      console.error('Error loading catalog data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger Confirmation Alert for SuperAdmin
  const triggerSuperAdminConfirm = (actionName: string, callback: () => Promise<void>) => {
    if (userRole === 'SUPERADMIN') {
      setPendingAction({ actionName, callback });
      setIsConfirmAlertOpen(true);
    } else {
      callback();
    }
  };

  // --- TYPE HANDLERS ---
  const handleOpenTypeModal = (type?: any) => {
    setError('');
    setTargetSectorIds(selectedSectorId ? [selectedSectorId] : ['ALL']);

    if (type) {
      setEditingType(type);
      setTypeName(type.name);
      setTypeDescription(type.description || '');
      if (type.sectorId) setTargetSectorIds([type.sectorId]);
      try {
        setAttributes(JSON.parse(type.dynamic_attributes || '[]'));
      } catch (e) {
        setAttributes([]);
      }
      try {
        setSelectedBrandIds(JSON.parse(type.associated_brands || '[]'));
      } catch (e) {
        setSelectedBrandIds([]);
      }
    } else {
      setEditingType(null);
      setTypeName('');
      setTypeDescription('');
      setAttributes([]);
      setSelectedBrandIds([]);
    }
    setAttrKey('');
    setAttrLabel('');
    setAttrType('text');
    setAttrOptions('');
    setIsTypeModalOpen(true);
  };

  const toggleBrandAssociation = (brandId: string) => {
    if (selectedBrandIds.includes(brandId)) {
      setSelectedBrandIds(selectedBrandIds.filter((bId) => bId !== brandId));
    } else {
      setSelectedBrandIds([...selectedBrandIds, brandId]);
    }
  };

  const handleAddAttribute = () => {
    if (!attrLabel || !attrLabel.trim()) return;
    const rawKey = attrKey.trim() || attrLabel.trim();
    const cleanKey = rawKey.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_');
    if (attributes.some((a) => a.key === cleanKey)) {
      alert('Ya existe un atributo con esta clave o nombre.');
      return;
    }

    const optionsArray =
      attrType === 'select'
        ? attrOptions.split(',').map((o) => o.trim()).filter(Boolean)
        : undefined;

    setAttributes([
      ...attributes,
      {
        key: cleanKey,
        label: attrLabel.trim(),
        type: attrType,
        ...(optionsArray && optionsArray.length > 0 ? { options: optionsArray } : {}),
      },
    ]);

    setAttrKey('');
    setAttrLabel('');
    setAttrType('text');
    setAttrOptions('');
  };

  const handleRemoveAttribute = (key: string) => {
    setAttributes(attributes.filter((a) => a.key !== key));
  };

  const performSaveType = async () => {
    try {
      const url = editingType ? `/api/equipment-types/${editingType.id}` : '/api/equipment-types';
      const method = editingType ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: typeName,
          description: typeDescription,
          dynamic_attributes: JSON.stringify(attributes),
          associated_brands: JSON.stringify(selectedBrandIds),
          targetSectorIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar tipo de equipo');

      setSuccess(`Tipo de equipo ${editingType ? 'actualizado' : 'creado'} correctamente.`);
      setIsTypeModalOpen(false);
      loadAllData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSaveTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    triggerSuperAdminConfirm(
      `${editingType ? 'Actualizar' : 'Crear'} Tipo de Equipo "${typeName}"`,
      performSaveType
    );
  };

  const handleDeleteType = (id: string, name: string) => {
    triggerSuperAdminConfirm(`Eliminar Tipo de Equipo "${name}"`, async () => {
      try {
        const res = await fetch(`/api/equipment-types/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al eliminar');
        loadAllData();
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  // --- BRAND HANDLERS ---
  const handleOpenBrandModal = (brand?: any) => {
    setError('');
    setTargetSectorIds(selectedSectorId ? [selectedSectorId] : ['ALL']);

    if (brand) {
      setEditingBrand(brand);
      setBrandName(brand.name);
      if (brand.sectorId) setTargetSectorIds([brand.sectorId]);
    } else {
      setEditingBrand(null);
      setBrandName('');
    }
    setIsBrandModalOpen(true);
  };

  const performSaveBrand = async () => {
    try {
      const url = editingBrand ? `/api/brands/${editingBrand.id}` : '/api/brands';
      const method = editingBrand ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: brandName, targetSectorIds }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar marca');

      setSuccess(`Marca ${editingBrand ? 'actualizada' : 'creada'} correctamente.`);
      setIsBrandModalOpen(false);
      loadAllData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSaveBrandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    triggerSuperAdminConfirm(
      `${editingBrand ? 'Actualizar' : 'Crear'} Marca "${brandName}"`,
      performSaveBrand
    );
  };

  const handleDeleteBrand = (id: string, name: string) => {
    triggerSuperAdminConfirm(`Eliminar Marca "${name}"`, async () => {
      try {
        const res = await fetch(`/api/brands/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al eliminar marca');
        loadAllData();
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  // --- MODEL HANDLERS ---
  const handleOpenModelModal = (model?: any) => {
    setError('');
    setTargetSectorIds(selectedSectorId ? [selectedSectorId] : ['ALL']);

    if (model) {
      setEditingModel(model);
      setModelName(model.name);
      setModelBrandId(model.brandId);
      setModelTypeId(model.typeId || '');
      setModelRam(model.ram || '');
      setModelProcessor(model.processor || '');
      setModelStorage(model.storage || '');
      if (model.sectorId) setTargetSectorIds([model.sectorId]);

      let parsedSpecs: any = {};
      try {
        parsedSpecs = JSON.parse(model.specs || '{}');
      } catch (e) {}

      setModelInkType(parsedSpecs.ink_type || '');
      setModelNetworkPort(parsedSpecs.network_port || '');
      setModelScreenSize(parsedSpecs.screen_size || '');
      setModelLumens(parsedSpecs.lumens || '');
      setModelResolution(parsedSpecs.resolution || '');
      if (parsedSpecs.ram && !model.ram) setModelRam(parsedSpecs.ram);
      if (parsedSpecs.processor && !model.processor) setModelProcessor(parsedSpecs.processor);
      if (parsedSpecs.storage && !model.storage) setModelStorage(parsedSpecs.storage);
    } else {
      setEditingModel(null);
      setModelName('');
      setModelBrandId(selectedBrandFilter || brands[0]?.id || '');
      setModelTypeId(selectedTypeFilter || types[0]?.id || '');
      setModelRam('');
      setModelProcessor('');
      setModelStorage('');
      setModelInkType('');
      setModelNetworkPort('');
      setModelScreenSize('');
      setModelLumens('');
      setModelResolution('');
    }
    setIsModelModalOpen(true);
  };

  const performSaveModel = async () => {
    try {
      const url = editingModel ? `/api/models/${editingModel.id}` : '/api/models';
      const method = editingModel ? 'PUT' : 'POST';

      const specsObj: Record<string, any> = {};
      if (modelRam) specsObj.ram = modelRam;
      if (modelProcessor) specsObj.processor = modelProcessor;
      if (modelStorage) specsObj.storage = modelStorage;
      if (modelInkType) specsObj.ink_type = modelInkType;
      if (modelNetworkPort) specsObj.network_port = modelNetworkPort;
      if (modelScreenSize) specsObj.screen_size = modelScreenSize;
      if (modelLumens) specsObj.lumens = modelLumens;
      if (modelResolution) specsObj.resolution = modelResolution;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: modelName,
          brandId: modelBrandId,
          typeId: modelTypeId || null,
          ram: modelRam || null,
          processor: modelProcessor || null,
          storage: modelStorage || null,
          specs: JSON.stringify(specsObj),
          targetSectorIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar modelo');

      setSuccess(`Modelo ${editingModel ? 'actualizado' : 'creado'} correctamente.`);
      setIsModelModalOpen(false);
      loadAllData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSaveModelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!modelName.trim()) {
      setError('El nombre del modelo es obligatorio.');
      return;
    }
    if (!modelBrandId) {
      setError('Debe seleccionar una marca perteneciente para el modelo.');
      return;
    }
    triggerSuperAdminConfirm(
      `${editingModel ? 'Actualizar' : 'Crear'} Modelo "${modelName.trim().toUpperCase()}"`,
      performSaveModel
    );
  };

  const handleDeleteModel = (id: string, name: string) => {
    triggerSuperAdminConfirm(`Eliminar Modelo "${name}"`, async () => {
      try {
        const res = await fetch(`/api/models/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al eliminar modelo');
        loadAllData();
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  // Filtered Lists
  const filteredTypes = types.filter((t) => {
    const q = searchQuery.toLowerCase();
    return !q || t.name.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q);
  });

  const filteredBrands = brands.filter((b) => {
    const q = searchQuery.toLowerCase();
    return !q || b.name.toLowerCase().includes(q);
  });

  const filteredModels = models.filter((m) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || m.name.toLowerCase().includes(q) || (m.brand?.name || '').toLowerCase().includes(q);
    const matchesBrand = !selectedBrandFilter || m.brandId === selectedBrandFilter;
    const matchesType = !selectedTypeFilter || m.typeId === selectedTypeFilter;
    return matchesSearch && matchesBrand && matchesType;
  });

  // Render Sector Target Selection Component inside Modals for SuperAdmin
  const renderSectorTargetSelector = () => {
    if (userRole !== 'SUPERADMIN') {
      return (
        <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs font-semibold text-blue-800 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Los cambios realizados afectarán únicamente a su sector asignado.</span>
        </div>
      );
    }

    return (
      <div className="p-3 bg-[#016098]/5 border border-[#016098]/20 rounded-xl space-y-2">
        <label className="block text-xs font-bold text-slate-800 flex items-center space-x-1.5">
          <Building2 className="w-4 h-4 text-[#016098]" />
          <span>Sectores Destino donde se Aplicará el Cambio:</span>
        </label>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => setTargetSectorIds(['ALL'])}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              targetSectorIds.includes('ALL')
                ? 'bg-[#016098] text-white border-[#016098] shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            🌐 Todos los Sectores (Global)
          </button>

          {sectors.map((sec) => {
            const isSelected = targetSectorIds.includes(sec.id) && !targetSectorIds.includes('ALL');
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => {
                  let next = targetSectorIds.filter((id) => id !== 'ALL');
                  if (isSelected) {
                    next = next.filter((id) => id !== sec.id);
                  } else {
                    next.push(sec.id);
                  }
                  if (next.length === 0) next = ['ALL'];
                  setTargetSectorIds(next);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-[#016098] text-white border-[#016098] shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                🏢 {sec.name}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPagination = (
    currentPage: number,
    pageSize: number,
    totalItems: number,
    onPageChange: (page: number) => void,
    onPageSizeChange: (size: number) => void
  ) => {
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white border border-slate-200/80 rounded-2xl text-xs text-slate-600 font-semibold shadow-xs">
        <div className="flex items-center space-x-2">
          <span>Mostrando <span className="font-bold text-slate-900">{startItem} - {endItem}</span> de <span className="font-bold text-slate-900">{totalItems}</span> registros</span>
          <span className="text-slate-300">|</span>
          <label className="flex items-center space-x-1">
            <span>Mostrar:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="px-2 py-1 border border-slate-300 rounded-lg outline-none font-bold text-slate-800 focus:ring-1 focus:ring-[#016098]"
            >
              <option value={15}>15 por pág.</option>
              <option value={30}>30 por pág.</option>
              <option value={50}>50 por pág.</option>
              <option value={1000}>Mostrar Todos</option>
            </select>
          </label>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent font-bold cursor-pointer transition-colors"
          >
            ← Anterior
          </button>
          
          <span className="px-3 py-1.5 font-bold text-[#016098] bg-[#016098]/10 rounded-lg">
            Pág. {currentPage} de {totalPages}
          </span>

          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent font-bold cursor-pointer transition-colors"
          >
            Siguiente →
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Sliders className="w-6 h-6 text-[#016098]" />
            <span>Gestión de Catálogos y Tipos de Equipos</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Administre marcas, tipos de hardware, atributos dinámicos y modelos por sector organizativo.
          </p>
        </div>

        {userRole !== 'LECTOR' && (
          <div className="flex space-x-2">
            {activeTab === 'types' && (
              <button
                onClick={() => handleOpenTypeModal()}
                className="px-4 py-2 text-xs font-bold text-white bg-[#016098] hover:bg-[#014d7a] rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#39BABD]" />
                <span>Nuevo Tipo</span>
              </button>
            )}
            {activeTab === 'brands' && (
              <button
                onClick={() => handleOpenBrandModal()}
                className="px-4 py-2 text-xs font-bold text-white bg-[#F7A517] hover:bg-[#d98f12] rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>Nueva Marca</span>
              </button>
            )}
            {activeTab === 'models' && (
              <button
                onClick={() => handleOpenModelModal()}
                className="px-4 py-2 text-xs font-bold text-white bg-[#39BABD] hover:bg-[#2fa4a7] rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>Nuevo Modelo</span>
              </button>
            )}
          </div>
        )}
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-xs rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Tabs Header */}
      <div className="flex border-b border-slate-200 bg-white px-4 pt-2 rounded-t-2xl">
        <button
          onClick={() => {
            setActiveTab('types');
            setSearchQuery('');
          }}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'types'
              ? 'border-[#016098] text-[#016098]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Tipos & Atributos ({types.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('brands');
            setSearchQuery('');
          }}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'brands'
              ? 'border-[#F7A517] text-[#F7A517]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Marcas ({brands.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('models');
            setSearchQuery('');
          }}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'models'
              ? 'border-[#39BABD] text-[#39BABD]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Modelos ({models.length})</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-b-2xl border-x border-b border-slate-200/80 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder={`Buscar en ${activeTab === 'types' ? 'tipos' : activeTab === 'brands' ? 'marcas' : 'modelos'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none"
          />
        </div>

        {activeTab === 'models' && (
          <>
            <select
              value={selectedBrandFilter}
              onChange={(e) => setSelectedBrandFilter(e.target.value)}
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
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none font-semibold text-slate-700"
            >
              <option value="">Todos los Tipos</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* TAB 1: TYPES LIST */}
      {activeTab === 'types' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTypes
            .slice((typesPage - 1) * typesPageSize, typesPage * typesPageSize)
            .map((type) => {
              let attrs: DynamicAttributeDef[] = [];
              try {
                attrs = JSON.parse(type.dynamic_attributes || '[]');
              } catch (e) {}

              return (
                <div
                  key={type.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{type.name}</h3>
                        {type.sector ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-[#016098]/10 text-[#016098] border border-[#016098]/20">
                            🏢 Sector: {type.sector.name}
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600">
                            🌐 Catálogo Global
                          </span>
                        )}
                      </div>

                      {userRole !== 'LECTOR' && (
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleOpenTypeModal(type)}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-[#016098] rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteType(type.id, type.name)}
                            className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2">
                      {type.description || 'Sin descripción'}
                    </p>

                    <div className="pt-2 border-t border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Atributos Personalizados ({attrs.length})
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {attrs.map((attr) => (
                          <span
                            key={attr.key}
                            className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold"
                          >
                            {attr.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex justify-between items-center">
                    <span>Equipos: <strong className="text-slate-800">{type._count?.equipment || 0}</strong></span>
                    <button
                      type="button"
                      onClick={() => handleOpenTypeModelsModal(type)}
                      className="px-2.5 py-1 bg-[#016098]/10 hover:bg-[#016098]/20 text-[#016098] font-bold rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                      title="Ver todos los modelos de este tipo de equipo"
                    >
                      <Cpu className="w-3.5 h-3.5 text-[#016098]" />
                      <span>Modelos ({models.filter((m) => m.typeId === type.id).length})</span>
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Pagination for Types */}
      {activeTab === 'types' && filteredTypes.length > 0 && (
        renderPagination(typesPage, typesPageSize, filteredTypes.length, setTypesPage, setTypesPageSize)
      )}

      {/* TAB 2: BRANDS LIST */}
      {activeTab === 'brands' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredBrands
            .slice((brandsPage - 1) * brandsPageSize, brandsPage * brandsPageSize)
            .map((brand) => (
              <div
                key={brand.id}
                onDoubleClick={() => handleOpenBrandModelsModal(brand)}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 hover:border-[#F7A517] transition-all cursor-pointer group"
                title="Doble clic para ver los modelos asignados"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 min-w-0">
                    <Tag className="w-4 h-4 text-[#F7A517] shrink-0" />
                    <h3 className="font-bold text-slate-900 text-sm truncate">{brand.name}</h3>
                  </div>

                  {userRole !== 'LECTOR' && (
                    <div className="flex space-x-1 opacity-80 group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenBrandModal(brand);
                        }}
                        className="p-1 hover:bg-slate-100 text-slate-500 hover:text-[#F7A517] rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBrand(brand.id, brand.name);
                        }}
                        className="p-1 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  {brand.sector ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-[#016098]/10 text-[#016098] border border-[#016098]/20">
                      🏢 {brand.sector.name}
                    </span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600">
                      🌐 Global
                    </span>
                  )}
                  <span className="font-bold text-[#F7A517]">{brand._count?.models || 0} modelos</span>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Pagination for Brands */}
      {activeTab === 'brands' && filteredBrands.length > 0 && (
        renderPagination(brandsPage, brandsPageSize, filteredBrands.length, setBrandsPage, setBrandsPageSize)
      )}

      {/* TAB 3: MODELS LIST TABLE */}
      {activeTab === 'models' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">Modelo</th>
                  <th className="py-3 px-4">Marca</th>
                  <th className="py-3 px-4">Tipo de Equipo</th>
                  <th className="py-3 px-4">Alcance Sector</th>
                  <th className="py-3 px-4">Especificaciones Hardware</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredModels
                  .slice((modelsPage - 1) * modelsPageSize, modelsPage * modelsPageSize)
                  .map((model) => (
                    <tr key={model.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{model.name}</td>
                      <td className="py-3 px-4 font-bold text-[#F7A517]">{model.brand?.name || '-'}</td>
                      <td className="py-3 px-4 font-semibold text-[#016098]">{model.type?.name || 'General'}</td>
                      <td className="py-3 px-4">
                        {model.sector ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-[#016098]/10 text-[#016098] border border-[#016098]/20">
                            🏢 {model.sector.name}
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600">
                            🌐 Global
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-500">
                        {[model.processor, model.ram, model.storage].filter(Boolean).join(' | ') || 'Sin especificaciones'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {userRole !== 'LECTOR' && (
                          <div className="flex justify-end space-x-1">
                            <button
                              onClick={() => handleOpenModelModal(model)}
                              className="p-1 hover:bg-slate-100 text-slate-500 hover:text-[#39BABD] rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteModel(model.id, model.name)}
                              className="p-1 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Pagination for Models */}
          {filteredModels.length > 0 && (
            renderPagination(modelsPage, modelsPageSize, filteredModels.length, setModelsPage, setModelsPageSize)
          )}
        </div>
      )}

      {/* Brand Models Double-Click Modal */}
      {isBrandModelsModalOpen && selectedBrandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Tag className="w-5 h-5 text-[#F7A517]" />
                <h3 className="font-bold text-slate-900 text-base">
                  Modelos de la Marca: <span className="text-[#F7A517]">{selectedBrandModal.name}</span>
                </h3>
              </div>
              <button
                onClick={() => setIsBrandModelsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {models
                .filter((m) => m.brandId === selectedBrandModal.id)
                .map((m) => (
                  <div key={m.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-xs text-slate-900">{m.name}</div>
                      <div className="text-[10px] text-slate-500">{m.type?.name || 'General'}</div>
                    </div>
                    <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                      {m._count?.equipment || 0} equipos
                    </span>
                  </div>
                ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsBrandModelsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Type Models Click Modal */}
      {isTypeModelsModalOpen && selectedTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-[#016098]" />
                <h3 className="font-bold text-slate-900 text-base">
                  Modelos de Tipo: <span className="text-[#016098]">{selectedTypeModal.name}</span>
                </h3>
              </div>
              <button
                onClick={() => setIsTypeModelsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {models
                .filter((m) => m.typeId === selectedTypeModal.id)
                .map((m) => (
                  <div key={m.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-xs text-slate-900">{m.name}</div>
                      <div className="text-[10px] text-[#F7A517] font-semibold">Marca: {m.brand?.name || 'General'}</div>
                    </div>
                    <span className="text-[10px] font-mono bg-[#016098]/10 text-[#016098] px-2 py-0.5 rounded font-bold">
                      {m._count?.equipment || 0} equipos
                    </span>
                  </div>
                ))}
              {models.filter((m) => m.typeId === selectedTypeModal.id).length === 0 && (
                <p className="text-center text-xs text-slate-400 italic py-6">
                  No hay modelos asociados a este tipo de equipo aún.
                </p>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsTypeModelsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Equipment Type Modal */}
      {isTypeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-slate-800 text-lg">
              {editingType ? 'Editar Tipo de Equipo' : 'Nuevo Tipo de Equipo'}
            </h3>

            {error && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl">{error}</div>}

            <form onSubmit={handleSaveTypeSubmit} className="space-y-4">
              {renderSectorTargetSelector()}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Tipo (Ej: Laptop, Monitor)</label>
                <input
                  type="text"
                  required
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value.toUpperCase())}
                  placeholder="Ej: LAPTOP NOTEBOOK"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none font-bold uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción</label>
                <input
                  type="text"
                  value={typeDescription}
                  onChange={(e) => setTypeDescription(e.target.value)}
                  placeholder="Ej: Equipos portátiles de alto rendimiento"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none"
                />
              </div>

              {/* ATRIBUTOS PERSONALIZADOS / ESPECIFICACIONES DE TIPO */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <Sliders className="w-4 h-4 text-[#016098]" />
                  <span>Atributos Personalizados ({attributes.length})</span>
                </span>

                {/* Form to add a new custom attribute */}
                <div className="space-y-2 p-2 bg-white rounded-lg border border-slate-200">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Nombre / Etiqueta *</label>
                      <input
                        type="text"
                        value={attrLabel}
                        onChange={(e) => setAttrLabel(e.target.value)}
                        placeholder="Ej: Procesador, RAM, Disco"
                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded-md outline-none focus:ring-1 focus:ring-[#016098]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Tipo de Dato</label>
                      <select
                        value={attrType}
                        onChange={(e: any) => setAttrType(e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded-md outline-none focus:ring-1 focus:ring-[#016098]"
                      >
                        <option value="text">Texto</option>
                        <option value="number">Número</option>
                        <option value="select">Selección / Opciones</option>
                        <option value="boolean">Booleano (Sí/No)</option>
                      </select>
                    </div>
                  </div>

                  {attrType === 'select' && (
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Opciones (separadas por coma)</label>
                      <input
                        type="text"
                        value={attrOptions}
                        onChange={(e) => setAttrOptions(e.target.value)}
                        placeholder="Ej: 128GB, 256GB, 512GB, 1TB"
                        className="w-full px-2 py-1 text-xs border border-slate-300 rounded-md outline-none focus:ring-1 focus:ring-[#016098]"
                      />
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddAttribute}
                      disabled={!attrLabel.trim()}
                      className="px-3 py-1 bg-[#016098] hover:bg-[#014d7a] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center space-x-1 disabled:opacity-50"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+ Agregar Atributo</span>
                    </button>
                  </div>
                </div>

                {/* List of currently defined attributes */}
                {attributes.length > 0 ? (
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {attributes.map((attr) => (
                      <div
                        key={attr.key}
                        className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-800">{attr.label}</span>
                          <span className="text-[10px] text-slate-400 font-mono ml-2">
                            [{attr.key}] • {attr.type}
                            {attr.options && attr.options.length > 0 ? ` (${attr.options.join(', ')})` : ''}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttribute(attr.key)}
                          className="text-rose-500 hover:text-rose-700 font-bold px-1.5 py-0.5 hover:bg-rose-50 rounded"
                          title="Eliminar atributo"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic text-center py-1">
                    No se han definido atributos personalizados aún.
                  </p>
                )}
              </div>

              {/* MARCAS ASOCIADAS */}
              {brands.length > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <Tag className="w-4 h-4 text-[#F7A517]" />
                    <span>Marcas Asociadas ({selectedBrandIds.length})</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pt-1">
                    {brands.map((b) => {
                      const isSelected = selectedBrandIds.includes(b.id);
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => toggleBrandAssociation(b.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center space-x-1 ${
                            isSelected
                              ? 'bg-[#F7A517] text-white border-[#F7A517] shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                          <span>{b.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTypeModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#016098] hover:bg-[#014d7a] rounded-xl cursor-pointer shadow-xs"
                >
                  Guardar Tipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Brand Modal */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-lg">
              {editingBrand ? 'Editar Marca de Equipo' : 'Nueva Marca de Equipo'}
            </h3>

            {error && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl">{error}</div>}

            <form onSubmit={handleSaveBrandSubmit} className="space-y-4">
              {renderSectorTargetSelector()}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre de la Marca</label>
                <input
                  type="text"
                  required
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value.toUpperCase())}
                  placeholder="Ej: LENOVO, HP, LG, VIEWSONIC, DELL, APPLE"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#F7A517] outline-none font-bold uppercase"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBrandModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#F7A517] hover:bg-[#d98f12] rounded-xl cursor-pointer shadow-xs"
                >
                  Guardar Marca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Model Modal */}
      {isModelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-slate-800 text-lg">
              {editingModel ? 'Editar Modelo' : 'Nuevo Modelo de Equipo'}
            </h3>

            {error && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl">{error}</div>}

            <form onSubmit={handleSaveModelSubmit} className="space-y-4">
              {renderSectorTargetSelector()}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Marca Perteneciente</label>
                <select
                  required
                  value={modelBrandId}
                  onChange={(e) => setModelBrandId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#39BABD] outline-none font-bold text-slate-800"
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      Marca {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo de Equipo Asociado (Ej: Notebook, Monitor)
                </label>
                <select
                  value={modelTypeId}
                  onChange={(e) => setModelTypeId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] outline-none font-bold text-[#016098]"
                >
                  <option value="">Sin Tipo Especificado (General)</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Modelo</label>
                <input
                  type="text"
                  required
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value.toUpperCase())}
                  placeholder="Ej: PROBOOK 450 G9, THINKPAD E14, 24MP400"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#39BABD] outline-none font-bold uppercase"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModelModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#39BABD] hover:bg-[#2fa4a7] rounded-xl cursor-pointer shadow-xs"
                >
                  Guardar Modelo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SuperAdmin Multi-Sector Warning Confirmation Alert Modal */}
      {isConfirmAlertOpen && pendingAction && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-amber-200 space-y-4">
            <div className="flex items-center space-x-3 text-amber-600">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Confirmación de Alcance Multi-Sector
                </h3>
                <p className="text-xs text-slate-500">
                  Verificación de replicación en sectores
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-2 text-slate-800">
              <p className="font-bold text-amber-900">
                Está a punto de ejecutar la siguiente acción en el catálogo:
              </p>
              <div className="p-2.5 bg-white rounded-lg border border-amber-200 font-bold text-slate-900 text-sm">
                {pendingAction.actionName}
              </div>
              <p className="font-bold text-slate-700 pt-1">
                Los cambios se aplicarán y replicarán en los siguientes sectores señalados:
              </p>
              <ul className="list-disc pl-5 space-y-1 font-bold text-slate-900">
                {targetSectorIds.includes('ALL') || targetSectorIds.length === 0 ? (
                  <li className="text-[#016098]">🌐 TODOS LOS SECTORES (Catálogo Global)</li>
                ) : (
                  targetSectorIds.map((secId) => {
                    const secObj = sectors.find((s) => s.id === secId);
                    return (
                      <li key={secId} className="text-[#016098]">
                        🏢 {secObj?.name || secId}
                      </li>
                    );
                  })
                )}
              </ul>
              <p className="text-[11px] text-amber-800 italic pt-1">
                ⚠️ Los cambios no afectarán a otros sectores que no hayan sido expresamente seleccionados.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsConfirmAlertOpen(false);
                  setPendingAction(null);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsConfirmAlertOpen(false);
                  if (pendingAction) {
                    await pendingAction.callback();
                    setPendingAction(null);
                  }
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-[#016098] hover:bg-[#014d7a] rounded-xl shadow-xs transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <ShieldCheck className="w-4 h-4 text-[#39BABD]" />
                <span>Sí, Confirmar y Aplicar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
