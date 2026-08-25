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

    // Parallel execution of all dashboard aggregations
    const [
      statusGroup,
      totalEquipment,
      totalEmployees,
      branches,
      equipmentTypes,
      departments,
      unassignedDeptCount,
    ] = await Promise.all([
      prisma.equipment.groupBy({
        by: ['status'],
        where: branchFilter,
        _count: true,
      }),
      prisma.equipment.count({ where: branchFilter }),
      prisma.employee.count({ where: branchFilter }),
      prisma.branch.findMany({
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
      }),
      prisma.equipmentType.findMany({
        include: {
          equipment: {
            where: branchFilter,
            select: { id: true },
          },
        },
      }),
      prisma.department.findMany({
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
      }),
      prisma.equipment.count({
        where: {
          ...branchFilter,
          departmentId: null,
        },
      }),
    ]);

    // Parse status counts from groupBy
    const statusMap = statusGroup.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {} as Record<string, number>);

    const disponibleCount = statusMap['disponible'] || 0;
    const asignadoCount = statusMap['asignado'] || 0;
    const reparacionCount = statusMap['en_reparacion'] || 0;
    const dadoDeBajaCount = statusMap['dado_de_baja'] || 0;

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

    const typeDistribution = equipmentTypes.map((t) => ({
      name: t.name,
      count: t.equipment.length,
    }));

    const departmentDistribution = departments.map((d) => ({
      id: d.id,
      name: d.name,
      count: d.equipment.length,
    }));

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
