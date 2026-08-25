import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role === 'LECTOR') {
      return NextResponse.json({ error: 'Permisos insuficientes para realizar cambios masivos' }, { status: 403 });
    }

    const { employeeIds, branchId, departmentId } = await req.json();

    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      return NextResponse.json({ error: 'Debe seleccionar al menos un funcionario' }, { status: 400 });
    }

    const targetDeptId = departmentId ? departmentId : null;

    // Update employees department (and branch if provided)
    const empUpdateResult = await prisma.employee.updateMany({
      where: {
        id: { in: employeeIds },
      },
      data: {
        departmentId: targetDeptId,
        ...(branchId ? { branchId } : {}),
      },
    });

    // Synchronize active equipment location parameters for all selected employees
    const eqUpdateResult = await prisma.equipment.updateMany({
      where: {
        assignments: {
          some: {
            employeeId: { in: employeeIds },
            fecha_fin: null,
          },
        },
      },
      data: {
        departmentId: targetDeptId,
        ...(branchId ? { branchId } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      employeesUpdated: empUpdateResult.count,
      equipmentUpdated: eqUpdateResult.count,
      message: `Se asignó exitosamente el departamento a ${empUpdateResult.count} funcionario(s).`,
    });
  } catch (error: any) {
    console.error('Error in batch department assignment:', error);
    return NextResponse.json({ error: 'Error al asignar departamento en lote: ' + error.message }, { status: 500 });
  }
}
