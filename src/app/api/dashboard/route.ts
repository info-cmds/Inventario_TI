import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, filterByBranchPermissions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filterBranchId = searchParams.get('branchId') || undefined;
    const filterSectorId = searchParams.get('sectorId') || undefined;

    const branchFilter = filterByBranchPermissions(sessionUser, filterBranchId, filterSectorId);

    // Equipment Metrics
    const totalEquipment = await prisma.equipment.count({
      where: branchFilter,
    });

    const disponibleCount = await prisma.equipment.count({
      where: { ...branchFilter, status: 'disponible' },
    });

    const asignadoCount = await prisma.equipment.count({
      where: { ...branchFilter, status: 'asignado' },
    });

    const reparacionCount = await prisma.equipment.count({
      where: { ...branchFilter, status: 'en_reparacion' },
    });

    const dadoDeBajaCount = await prisma.equipment.count({
      where: { ...branchFilter, status: 'dado_de_baja' },
    });

    // Total Employees Metric
    const totalEmployees = await prisma.employee.count({
      where: branchFilter,
    });

    // Branch Summary Cards Data
    const branches = await prisma.branch.findMany({
      where:
        sessionUser.role === 'SUPERADMIN'
          ? {
              ...(filterBranchId ? { id: filterBranchId } : {}),
              ...(filterSectorId ? { sectorId: filterSectorId } : {}),
            }
          : {
              id: { in: sessionUser.branchPermissions.map((p) => p.branchId) },
              ...(filterBranchId ? { id: filterBranchId } : {}),
              ...(filterSectorId ? { sectorId: filterSectorId } : {}),
            },
      include: {
        _count: {
          select: {
            equipment: true,
            employees: true,
          },
        },
        equipment: {
          select: {
            status: true,
          },
        },
      },
    });

    const branchSummaries = branches.map((b) => {
      const disponible = b.equipment.filter((e) => e.status === 'disponible').length;
      const asignado = b.equipment.filter((e) => e.status === 'asignado').length;
      const enReparacion = b.equipment.filter((e) => e.status === 'en_reparacion').length;
      const dadoDeBaja = b.equipment.filter((e) => e.status === 'dado_de_baja').length;

      return {
        id: b.id,
        name: b.name,
        code: b.code,
        status: b.status,
        totalEquipment: b._count.equipment,
        totalEmployees: b._count.employees,
        disponible,
        asignado,
        enReparacion,
        dadoDeBaja,
      };
    });

    // Equipment Type Distribution
    const equipmentTypes = await prisma.equipmentType.findMany({
      include: {
        equipment: {
          where: branchFilter,
          select: { id: true },
        },
      },
    });

    const typeDistribution = equipmentTypes.map((t) => ({
      name: t.name,
      count: t.equipment.length,
    }));

    // Equipment Department Distribution
    const departments = await prisma.department.findMany({
      where:
        sessionUser.role === 'SUPERADMIN'
          ? {
              ...(filterBranchId ? { branchId: filterBranchId } : {}),
              ...(filterSectorId ? { branch: { sectorId: filterSectorId } } : {}),
            }
          : {
              branchId: { in: sessionUser.branchPermissions.map((p) => p.branchId) },
              ...(filterBranchId ? { branchId: filterBranchId } : {}),
              ...(filterSectorId ? { branch: { sectorId: filterSectorId } } : {}),
            },
      include: {
        equipment: {
          where: branchFilter,
          select: { id: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const departmentDistribution = departments.map((d) => ({
      id: d.id,
      name: d.name,
      count: d.equipment.length,
    }));

    const unassignedDeptCount = await prisma.equipment.count({
      where: {
        ...branchFilter,
        departmentId: null,
      },
    });

    if (unassignedDeptCount > 0) {
      departmentDistribution.push({
        id: 'none',
        name: 'Sin Depto Asignado',
        count: unassignedDeptCount,
      });
    }

    departmentDistribution.sort((a, b) => b.count - a.count);

    return NextResponse.json({
      metrics: {
        totalEquipment,
        disponibleCount,
        asignadoCount,
        reparacionCount,
        dadoDeBajaCount,
        totalEmployees,
      },
      branchSummaries,
      typeDistribution,
      departmentDistribution,
    });
  } catch (error: any) {
    console.error('Dashboard metrics error:', error);
    return NextResponse.json({ error: 'Error al obtener métricas del dashboard' }, { status: 500 });
  }
}
