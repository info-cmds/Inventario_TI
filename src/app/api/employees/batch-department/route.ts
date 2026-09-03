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

    const nowFormatted = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' +
      new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }) +
      ' hrs';

    const targetBranch = branchId ? await prisma.branch.findUnique({ where: { id: branchId } }) : null;
    const targetDept = targetDeptId ? await prisma.department.findUnique({ where: { id: targetDeptId } }) : null;

    const employeesToUpdate = await prisma.employee.findMany({
      where: { id: { in: employeeIds } },
      include: { branch: true, department: true },
    });

    for (const emp of employeesToUpdate) {
      let existingLogs: any[] = [];
      try {
        existingLogs = JSON.parse(emp.history_logs || '[]');
      } catch (e) {}

      const changes: string[] = [];
      if (branchId && branchId !== emp.branchId) {
        changes.push(`Sucursal (Lote): ${emp.branch?.name || 'N/A'} ➔ ${targetBranch?.name || branchId}`);
      }
      if (targetDeptId !== emp.departmentId) {
        changes.push(`Departamento (Lote): ${emp.department?.name || 'Sin Depto'} ➔ ${targetDept?.name || 'Sin Depto'}`);
      }

      if (changes.length > 0) {
        existingLogs.unshift({
          id: 'evt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          timestamp: nowFormatted,
          userId: sessionUser.id,
          userName: sessionUser.name,
          userEmail: sessionUser.email,
          type: 'MODIFICACION',
          details: `Departamento/Sucursal asignado en lote por ${sessionUser.name}`,
          changes,
        });

        await prisma.employee.update({
          where: { id: emp.id },
          data: {
            departmentId: targetDeptId,
            ...(branchId ? { branchId } : {}),
            history_logs: JSON.stringify(existingLogs),
          },
        });
      }
    }

    const empUpdateResult = { count: employeesToUpdate.length };

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
