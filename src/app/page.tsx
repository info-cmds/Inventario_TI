'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import DashboardView from '@/components/DashboardView';
import EquipmentView from '@/components/EquipmentView';
import AssignmentsView from '@/components/AssignmentsView';
import EmployeesView from '@/components/EmployeesView';
import BranchesView from '@/components/BranchesView';
import EquipmentTypesView from '@/components/EquipmentTypesView';
import UsersView from '@/components/UsersView';
import LoginView from '@/components/LoginView';
import PasswordChangeModal from '@/components/PasswordChangeModal';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [branchesSubTab, setBranchesSubTab] = useState<'sectors' | 'branches' | 'departments'>('branches');
  const [selectedSectorId, setSelectedSectorId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [selectedEquipmentTag, setSelectedEquipmentTag] = useState('');

  // Password Change Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isForcedPasswordChange, setIsForcedPasswordChange] = useState(false);

  // Mobile Drawer Navigation State
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // App Data
  const [sectors, setSectors] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [branchSummaries, setBranchSummaries] = useState<any[]>([]);
  const [typeDistribution, setTypeDistribution] = useState<any[]>([]);
  const [departmentDistribution, setDepartmentDistribution] = useState<any[]>([]);

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (user) {
      loadSectors();
      loadBranches();
      loadDepartments();
      loadEquipment();
      loadDashboardMetrics(selectedSectorId, selectedBranchId);
    }
  }, [user, selectedSectorId, selectedBranchId]);

  const checkSession = async () => {
    setLoadingUser(true);
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (res.ok && data.authenticated) {
        setUser(data.user);
        if (data.user.must_change_password) {
          setIsForcedPasswordChange(true);
          setIsPasswordModalOpen(true);
        }
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const loadSectors = async () => {
    try {
      const res = await fetch('/api/sectors');
      const data = await res.json();
      const sectorList = Array.isArray(data) ? data : [];
      setSectors(sectorList);

      if (user && user.role !== 'SUPERADMIN') {
        if (sectorList.length === 1 && !selectedSectorId) {
          setSelectedSectorId(sectorList[0].id);
        } else if (user.branchPermissions && user.branchPermissions.length > 0 && !selectedSectorId) {
          const userSecIds = Array.from(new Set(user.branchPermissions.map((p: any) => p.sectorId).filter(Boolean)));
          if (userSecIds.length === 1) {
            setSelectedSectorId(userSecIds[0] as string);
          }
        }
      }
    } catch (e) {}
  };

  const loadBranches = async () => {
    try {
      const url = selectedSectorId ? `/api/branches?sectorId=${selectedSectorId}` : '/api/branches';
      const res = await fetch(url);
      const data = await res.json();
      setBranches(Array.isArray(data) ? data : []);
    } catch (e) {}
  };

  const loadDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      const data = await res.json();
      setDepartments(Array.isArray(data) ? data : []);
    } catch (e) {}
  };

  const loadEquipment = async () => {
    try {
      const res = await fetch('/api/equipment');
      const data = await res.json();
      setEquipment(Array.isArray(data) ? data : []);
    } catch (e) {}
  };

  const loadDashboardMetrics = async (sectorId?: string, branchId?: string) => {
    try {
      const params = new URLSearchParams();
      if (sectorId) params.append('sectorId', sectorId);
      if (branchId) params.append('branchId', branchId);

      const url = params.toString() ? `/api/dashboard?${params.toString()}` : '/api/dashboard';
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setMetrics(data.metrics);
        setBranchSummaries(data.branchSummaries || []);
        setTypeDistribution(data.typeDistribution || []);
        setDepartmentDistribution(data.departmentDistribution || []);
      }
    } catch (e) {}
  };

  const handleLoginSuccess = (userData: any, mustChangePassword: boolean) => {
    setUser(userData);
    if (mustChangePassword) {
      setIsForcedPasswordChange(true);
      setIsPasswordModalOpen(true);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  const handlePasswordSuccess = () => {
    setIsPasswordModalOpen(false);
    setIsForcedPasswordChange(false);
    checkSession();
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#39BABD] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold tracking-wider text-slate-300">Cargando CMDS Inventario...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        user={user}
        sectors={sectors}
        branches={branches}
        selectedSectorId={selectedSectorId}
        selectedBranchId={selectedBranchId}
        onSelectSector={(id) => {
          setSelectedSectorId(id);
          setSelectedBranchId('');
          setSelectedDepartmentId('');
        }}
        onSelectBranch={(id) => {
          setSelectedBranchId(id);
          if (id) {
            const b = branches.find((x) => x.id === id);
            if (b && b.sectorId) setSelectedSectorId(b.sectorId);
          }
          setSelectedDepartmentId('');
        }}
        onLogout={handleLogout}
        onChangePasswordClick={() => {
          setIsForcedPasswordChange(false);
          setIsPasswordModalOpen(true);
        }}
        isMobileSidebarOpen={isMobileSidebarOpen}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      {/* Main Container */}
      <div className="flex flex-1 w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 gap-4 sm:gap-6">
        {/* Desktop Sidebar (hidden on mobile) */}
        <div className="hidden lg:block">
          <Sidebar
            currentTab={currentTab}
            onTabChange={(tab, secId, subTab, bId, dId, eqTag) => {
              if (secId !== undefined) setSelectedSectorId(secId);
              if (bId !== undefined) setSelectedBranchId(bId); else setSelectedBranchId('');
              if (dId !== undefined) setSelectedDepartmentId(dId); else setSelectedDepartmentId('');
              if (eqTag !== undefined) setSelectedEquipmentTag(eqTag); else setSelectedEquipmentTag('');
              if (subTab) setBranchesSubTab(subTab);
              setCurrentTab(tab);
            }}
            userRole={user.role}
            sectors={sectors}
            branches={branches}
            departments={departments}
            equipment={equipment}
            onSelectSector={(id) => {
              setSelectedSectorId(id);
              setSelectedBranchId('');
              setSelectedDepartmentId('');
            }}
            onSelectBranch={(id) => {
              setSelectedBranchId(id);
              if (id) {
                const b = branches.find((x) => x.id === id);
                if (b && b.sectorId) setSelectedSectorId(b.sectorId);
              }
              setSelectedDepartmentId('');
            }}
            selectedSectorId={selectedSectorId}
            selectedBranchId={selectedBranchId}
            selectedDepartmentId={selectedDepartmentId}
            selectedEquipmentTag={selectedEquipmentTag}
            branchesSubTab={branchesSubTab}
          />
        </div>

        {/* Mobile Slide-Over Sidebar Drawer */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileSidebarOpen(false)}
            />

            {/* Slide-over panel */}
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl z-10 my-2 ml-2 rounded-2xl overflow-hidden">
              <Sidebar
                currentTab={currentTab}
                onTabChange={(tab, secId, subTab, bId, dId, eqTag) => {
                  if (secId !== undefined) setSelectedSectorId(secId);
                  if (bId !== undefined) setSelectedBranchId(bId); else setSelectedBranchId('');
                  if (dId !== undefined) setSelectedDepartmentId(dId); else setSelectedDepartmentId('');
                  if (eqTag !== undefined) setSelectedEquipmentTag(eqTag); else setSelectedEquipmentTag('');
                  if (subTab) setBranchesSubTab(subTab);
                  setCurrentTab(tab);
                  setIsMobileSidebarOpen(false); // Auto close mobile drawer on tab click!
                }}
                userRole={user.role}
                sectors={sectors}
                branches={branches}
                departments={departments}
                equipment={equipment}
                onSelectSector={(id) => {
                  setSelectedSectorId(id);
                  setSelectedBranchId('');
                  setSelectedDepartmentId('');
                }}
                onSelectBranch={(id) => {
                  setSelectedBranchId(id);
                  if (id) {
                    const b = branches.find((x) => x.id === id);
                    if (b && b.sectorId) setSelectedSectorId(b.sectorId);
                  }
                  setSelectedDepartmentId('');
                }}
                selectedSectorId={selectedSectorId}
                selectedBranchId={selectedBranchId}
                selectedDepartmentId={selectedDepartmentId}
                selectedEquipmentTag={selectedEquipmentTag}
                branchesSubTab={branchesSubTab}
              />
            </div>
          </div>
        )}

        {/* Dynamic Main Workspace Content */}
        <main className="flex-1 min-w-0">
          {currentTab === 'dashboard' && (
            <DashboardView
              metrics={metrics}
              branchSummaries={branchSummaries}
              typeDistribution={typeDistribution}
              departmentDistribution={departmentDistribution}
              selectedSectorId={selectedSectorId}
              selectedBranchId={selectedBranchId}
              onNavigate={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'equipment' && (
            <EquipmentView
              userRole={user.role}
              branches={branches}
              selectedSectorId={selectedSectorId}
              selectedBranchId={selectedBranchId}
              initialSearchQuery={selectedEquipmentTag}
              initialDepartmentId={selectedDepartmentId}
            />
          )}

          {currentTab === 'assignments' && (
            <AssignmentsView
              userRole={user.role}
              selectedSectorId={selectedSectorId}
              selectedBranchId={selectedBranchId}
            />
          )}

          {currentTab === 'employees' && (
            <EmployeesView
              userRole={user.role}
              branches={branches}
              selectedSectorId={selectedSectorId}
              selectedBranchId={selectedBranchId}
            />
          )}

          {currentTab === 'branches' && (
            <BranchesView
              userRole={user.role}
              selectedSectorId={selectedSectorId}
              selectedBranchId={selectedBranchId}
              activeSubTab={branchesSubTab}
              onNavigateToEmployees={(secId, bId) => {
                if (secId) setSelectedSectorId(secId);
                if (bId) setSelectedBranchId(bId);
                setCurrentTab('employees');
              }}
            />
          )}

          {currentTab === 'equipment-types' && (
            <EquipmentTypesView
              userRole={user.role}
              sectors={sectors}
              selectedSectorId={selectedSectorId}
            />
          )}

          {currentTab === 'users' && user.role === 'SUPERADMIN' && (
            <UsersView branches={branches} departments={departments} />
          )}
        </main>
      </div>

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={isPasswordModalOpen}
        isForced={isForcedPasswordChange}
        onSuccess={handlePasswordSuccess}
        onCancel={() => {
          if (!isForcedPasswordChange) setIsPasswordModalOpen(false);
        }}
      />
    </div>
  );
}
