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
    const equipmentId = searchParams.get('equipmentId') || undefined;
    const employeeId = searchParams.get('employeeId') || undefined;
    const sectorId = searchParams.get('sectorId') || undefined;
    const branchId = searchParams.get('branchId') || undefined;

    const branchFilter = filterByBranchPermissions(sessionUser, branchId, sectorId);

    const assignments = await prisma.equipmentAssignment.findMany({
      where: {
        ...(equipmentId ? { equipmentId } : {}),
        ...(employeeId ? { employeeId } : {}),
        ...(branchFilter ? { equipment: branchFilter } : {}),
      },
      include: {
        equipment: {
          include: {
            type: true,
            brand: true,
            model: true,
            branch: { include: { sector: true } },
            department: true,
          },
        },
        employee: {
          include: {
            branch: true,
            department: true,
          },
        },
        assignedByUser: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    return NextResponse.json({ error: 'Error al consultar historial de asignaciones' }, { status: 500 });
  }
}

// POST: Assign Equipment to Employee & Sync Equipment Branch/Department to Employee
export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role === 'LECTOR') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const { equipmentId, employeeId, notes } = await req.json();

    if (!equipmentId || !employeeId) {
      return NextResponse.json({ error: 'Se requiere id de equipo y de funcionario' }, { status: 400 });
    }

    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
    });

    if (!equipment) {
      return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 });
    }

    if (equipment.status !== 'disponible') {
      return NextResponse.json(
        { error: `El equipo con Asset Tag ${equipment.asset_tag} no está disponible (Estado actual: '${equipment.status}')` },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee || employee.status !== 'ACTIVO') {
      return NextResponse.json({ error: 'Funcionario no encontrado o inactivo' }, { status: 400 });
    }

    // Permission Check: User must have rights on both the equipment's current branch and the employee's destination branch
    if (sessionUser.role !== 'SUPERADMIN') {
      const allowedBranchIds = sessionUser.branchPermissions.map((p) => p.branchId);
      if (!allowedBranchIds.includes(equipment.branchId)) {
        return NextResponse.json(
          { error: 'No tiene permisos para asignar equipos pertenecientes a esta sucursal.' },
          { status: 403 }
        );
      }
      if (!allowedBranchIds.includes(employee.branchId)) {
        return NextResponse.json(
          { error: 'No tiene permisos para asignar equipos a funcionarios de esa sucursal (fuera de su sector asignado).' },
          { status: 403 }
        );
      }
    }

    const nowFormatted = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' +
      new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }) +
      ' hrs';

    let existingLogs: any[] = [];
    try {
      existingLogs = JSON.parse(equipment.history_logs || '[]');
    } catch (e) {}

    existingLogs.unshift({
      id: 'evt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      timestamp: nowFormatted,
      userId: sessionUser.id,
      userName: sessionUser.name,
      userEmail: sessionUser.email,
      type: 'ASIGNACION',
      details: `Equipo asignado a ${employee.full_name} por ${sessionUser.name}`,
      changes: [
        `Asignado a: ${employee.full_name} (RUN: ${employee.rut_document})`,
        `Cargo: ${employee.position}`,
        `Estado Operativo: ${equipment.status} ➔ asignado`,
        `Notas: ${notes ? notes.trim() : 'Sin notas'}`,
      ],
    });

    // Resolve target location: sync employee branch & department to match assigned equipment
    let targetBranchId = equipment.branchId;
    let targetDeptId = equipment.departmentId !== null ? equipment.departmentId : (employee.departmentId || null);

    // Update employee branch & department so it immediately reflects on the employee record
    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        branchId: targetBranchId,
        departmentId: targetDeptId,
      },
    });

    // Atomically close any orphan open assignments, create new assignment record, and update equipment location & history
    const [_, assignment, updatedEquipment] = await prisma.$transaction([
      prisma.equipmentAssignment.updateMany({
        where: { equipmentId, fecha_fin: null },
        data: { fecha_fin: new Date() },
      }),
      prisma.equipmentAssignment.create({
        data: {
          equipmentId,
          employeeId,
          fecha_inicio: new Date(),
          assignedByUserId: sessionUser.id,
          notes: notes ? notes.trim() : null,
        },
        include: {
          equipment: { include: { type: true, brand: true, model: true } },
          employee: { include: { branch: true, department: true } },
          assignedByUser: { select: { name: true, email: true } },
        },
      }),
      prisma.equipment.update({
        where: { id: equipmentId },
        data: {
          status: 'asignado',
          branchId: targetBranchId,
          departmentId: targetDeptId,
          history_logs: JSON.stringify(existingLogs),
        },
      }),
    ]);

    return NextResponse.json({ success: true, assignment, equipment: updatedEquipment }, { status: 201 });
  } catch (error: any) {
    console.error('Error assigning equipment:', error);
    return NextResponse.json({ error: 'Error al procesar asignación: ' + error.message }, { status: 500 });
  }
}

// PUT: Unassign Equipment (Return to disponible)
export async function PUT(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role === 'LECTOR') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const { equipmentId, notes } = await req.json();

    if (!equipmentId) {
      return NextResponse.json({ error: 'Se requiere id de equipo' }, { status: 400 });
    }

    const activeAssignment = await prisma.equipmentAssignment.findFirst({
      where: { equipmentId, fecha_fin: null },
    });

    if (!activeAssignment) {
      return NextResponse.json({ error: 'No hay ninguna asignación activa para este equipo' }, { status: 400 });
    }

    const eqObj = await prisma.equipment.findUnique({ where: { id: equipmentId } });
    const nowFormatted = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' +
      new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }) +
      ' hrs';

    let existingLogs: any[] = [];
    try {
      existingLogs = JSON.parse(eqObj?.history_logs || '[]');
    } catch (e) {}

    existingLogs.unshift({
      id: 'evt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      timestamp: nowFormatted,
      userId: sessionUser.id,
      userName: sessionUser.name,
      userEmail: sessionUser.email,
      type: 'DESASIGNACION',
      details: `Equipo desasignado por ${sessionUser.name}`,
      changes: [
        `Estado Operativo: asignado ➔ disponible`,
        `Notas / Motivo Desasignación: ${notes ? notes.trim() : 'Sin notas'}`,
      ],
    });

    const [closedAssignment, updatedEquipment] = await prisma.$transaction([
      prisma.equipmentAssignment.update({
        where: { id: activeAssignment.id },
        data: {
          fecha_fin: new Date(),
          notes: notes ? (activeAssignment.notes ? `${activeAssignment.notes} | Desasignación: ${notes}` : notes) : activeAssignment.notes,
        },
      }),
      prisma.equipment.update({
        where: { id: equipmentId },
        data: {
          status: 'disponible',
          history_logs: JSON.stringify(existingLogs),
        },
      }),
    ]);

    return NextResponse.json({ success: true, message: 'Equipo desasignado exitosamente', equipment: updatedEquipment });
  } catch (error: any) {
    console.error('Error unassigning equipment:', error);
    return NextResponse.json({ error: 'Error al desasignar equipo' }, { status: 500 });
  }
}
