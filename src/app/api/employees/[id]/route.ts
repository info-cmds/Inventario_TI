import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { cleanAndFormatRUT } from '../route';

function validateTextOnly(val: string, fieldName: string): { valid: boolean; error?: string } {
  if (!val || !val.trim()) {
    return { valid: false, error: `${fieldName} es obligatorio` };
  }

  const textRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  if (!textRegex.test(val.trim())) {
    return { valid: false, error: `${fieldName} solo puede contener texto y letras (sin números ni símbolos)` };
  }

  return { valid: true };
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role === 'LECTOR') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const { id } = await params;
    const reqBody = await req.json().catch(() => ({}));
    const {
      rut_document,
      names,
      paternal_surname,
      maternal_surname,
      email,
      position,
      branchId,
      departmentId,
      status,
      decommissionReason,
      reason,
      motivo_baja,
    } = reqBody;

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { branch: true, department: true },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Funcionario no encontrado' }, { status: 404 });
    }

    if (sessionUser.role !== 'SUPERADMIN') {
      const allowedBranchIds = sessionUser.branchPermissions.map((p) => p.branchId);
      if (!allowedBranchIds.includes(employee.branchId)) {
        return NextResponse.json(
          { error: 'No tiene permisos para intervenir ni modificar funcionarios de otro sector.' },
          { status: 403 }
        );
      }
      if (branchId && !allowedBranchIds.includes(branchId)) {
        return NextResponse.json(
          { error: 'No tiene permisos para reasignar este funcionario a una sucursal/sector no autorizado.' },
          { status: 403 }
        );
      }
    }

    let formattedRut = employee.rut_document;
    if (rut_document) {
      const rutVal = cleanAndFormatRUT(rut_document);
      if (!rutVal.valid) {
        return NextResponse.json({ error: rutVal.error }, { status: 400 });
      }
      formattedRut = rutVal.formatted.toUpperCase();
      if (formattedRut !== employee.rut_document) {
        const rutExists = await prisma.employee.findUnique({ where: { rut_document: formattedRut } });
        if (rutExists) {
          return NextResponse.json({ error: `El RUN ${formattedRut} ya pertenece a otro funcionario` }, { status: 400 });
        }
      }
    }

    // Validate Names if provided
    const newNames = names !== undefined ? names.trim().toUpperCase() : employee.names;
    const newPaternal = paternal_surname !== undefined ? paternal_surname.trim().toUpperCase() : employee.paternal_surname;
    const newMaternal = maternal_surname !== undefined ? maternal_surname.trim().toUpperCase() : employee.maternal_surname;

    if (names !== undefined) {
      const namesVal = validateTextOnly(newNames, 'El campo Nombres');
      if (!namesVal.valid) return NextResponse.json({ error: namesVal.error }, { status: 400 });
    }

    if (paternal_surname !== undefined) {
      const patVal = validateTextOnly(newPaternal, 'El Apellido Paterno');
      if (!patVal.valid) return NextResponse.json({ error: patVal.error }, { status: 400 });
    }

    if (newMaternal) {
      const matVal = validateTextOnly(newMaternal, 'El Apellido Materno');
      if (!matVal.valid) return NextResponse.json({ error: matVal.error }, { status: 400 });
    }

    const fullNameComputed = `${newNames} ${newPaternal} ${newMaternal}`.trim();
    const oldStatus = employee.status;
    const newStatus = status ? status.toUpperCase() : employee.status;
    const statusChanged = status !== undefined && newStatus !== oldStatus;

    const nowFormatted = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' +
      new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }) +
      ' hrs';

    const cleanBajaReason = (decommissionReason || reason || motivo_baja || '').trim();

    if (statusChanged && newStatus === 'INACTIVO' && !cleanBajaReason) {
      return NextResponse.json(
        { error: 'Debe especificar el motivo o justificación de por qué el funcionario es dado de baja' },
        { status: 400 }
      );
    }

    // Track Audit Log Events
    const changes: string[] = [];
    if (formattedRut !== employee.rut_document) {
      changes.push(`RUN: ${employee.rut_document} ➔ ${formattedRut}`);
    }
    if (fullNameComputed !== employee.full_name) {
      changes.push(`Nombre Completo: ${employee.full_name} ➔ ${fullNameComputed}`);
    }
    const newEmail = email !== undefined ? (email ? email.trim().toUpperCase() : '') : employee.email;
    if (newEmail !== employee.email) {
      changes.push(`Email: ${employee.email || 'Sin Email'} ➔ ${newEmail || 'Sin Email'}`);
    }
    const newPosition = position ? position.trim().toUpperCase() : employee.position;
    if (newPosition !== employee.position) {
      changes.push(`Cargo: ${employee.position} ➔ ${newPosition}`);
    }
    const newBranchId = branchId || employee.branchId;
    if (newBranchId !== employee.branchId) {
      const targetBranch = await prisma.branch.findUnique({ where: { id: newBranchId } });
      changes.push(`Sucursal: ${employee.branch?.name || 'N/A'} ➔ ${targetBranch?.name || 'N/A'}`);
    }
    const newDeptId = departmentId !== undefined ? (departmentId || null) : employee.departmentId;
    if (newDeptId !== employee.departmentId) {
      const targetDept = newDeptId ? await prisma.department.findUnique({ where: { id: newDeptId } }) : null;
      changes.push(`Departamento: ${employee.department?.name || 'Sin Depto'} ➔ ${targetDept?.name || 'Sin Depto'}`);
    }
    if (statusChanged) {
      changes.push(`Estado: ${oldStatus} ➔ ${newStatus} ${newStatus === 'INACTIVO' ? '(Dado de Baja)' : '(Reactivado)'}`);
      if (newStatus === 'INACTIVO') {
        changes.push(`Motivo de Baja: ${cleanBajaReason}`);
        changes.push(`Dado de baja por: ${sessionUser.name} (${sessionUser.email || 'Sin Email'})`);
        changes.push(`Fecha y Hora de Baja: ${nowFormatted}`);
      } else if (newStatus === 'ACTIVO') {
        changes.push(`Reactivado por: ${sessionUser.name} (${sessionUser.email || 'Sin Email'})`);
        changes.push(`Fecha y Hora de Reactivación: ${nowFormatted}`);
      }
    }

    let existingLogs: any[] = [];
    try {
      existingLogs = JSON.parse(employee.history_logs || '[]');
    } catch (e) {}

    if (changes.length > 0) {
      existingLogs.unshift({
        id: 'evt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        timestamp: nowFormatted,
        userId: sessionUser.id,
        userName: sessionUser.name,
        userEmail: sessionUser.email,
        type: statusChanged ? (newStatus === 'INACTIVO' ? 'BAJA' : 'REACTIVACION') : 'MODIFICACION',
        reason: newStatus === 'INACTIVO' ? cleanBajaReason : undefined,
        details: statusChanged && newStatus === 'INACTIVO'
          ? `Funcionario dado de baja (puesto INACTIVO) por ${sessionUser.name} (${sessionUser.email || 'Sin Email'})`
          : `Funcionario modificado por ${sessionUser.name}`,
        changes,
      });
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        rut_document: formattedRut,
        names: newNames,
        paternal_surname: newPaternal,
        maternal_surname: newMaternal,
        full_name: fullNameComputed,
        email: newEmail,
        position: newPosition,
        branchId: newBranchId,
        departmentId: newDeptId,
        status: newStatus,
        history_logs: JSON.stringify(existingLogs),
      },
      include: {
        branch: { include: { sector: true } },
        department: true,
      },
    });

    if (statusChanged) {
      if (newStatus === 'INACTIVO') {
        const activeAssignments = await prisma.equipmentAssignment.findMany({
          where: { employeeId: id, fecha_fin: null },
          include: {
            equipment: {
              include: { type: true, brand: true, model: true },
            },
          },
        });

        for (const ass of activeAssignments) {
          const noteMsg = `[INACTIVACIÓN FUNCIONARIO]: Funcionario puesto en estado INACTIVO (Dado de baja) por ${sessionUser.name} (${sessionUser.email || ''}) el ${nowFormatted}. Motivo: "${cleanBajaReason}". Equipo desasignado automáticamente.`;
          await prisma.equipmentAssignment.update({
            where: { id: ass.id },
            data: {
              fecha_fin: new Date(),
              notes: ass.notes ? `${ass.notes} | ${noteMsg}` : noteMsg,
            },
          });

          let eqLogs: any[] = [];
          try {
            eqLogs = JSON.parse(ass.equipment.history_logs || '[]');
          } catch (e) {}

          eqLogs.unshift({
            id: 'evt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            timestamp: nowFormatted,
            userId: sessionUser.id,
            userName: sessionUser.name,
            userEmail: sessionUser.email,
            type: 'DESASIGNACION',
            reason: `Desasignado por baja de funcionario. Motivo: "${cleanBajaReason}"`,
            details: `Equipo desasignado automáticamente por baja del funcionario ${employee.full_name}`,
            changes: [
              `Estado Operativo: ${ass.equipment.status || 'asignado'} ➔ disponible`,
              `Funcionario Desvinculado: ${employee.full_name} (RUN: ${employee.rut_document})`,
              `Cargo del Funcionario: ${employee.position || 'N/A'}`,
              `Motivo Justificado de Baja: ${cleanBajaReason}`,
              `Fecha y Hora: ${nowFormatted}`,
              `Desasignado por: ${sessionUser.name} (${sessionUser.email || 'Sin Email'})`,
            ],
          });

          await prisma.equipment.update({
            where: { id: ass.equipmentId },
            data: {
              status: 'disponible',
              history_logs: JSON.stringify(eqLogs),
            },
          });
        }

        if (activeAssignments.length === 0) {
          const latestAss = await prisma.equipmentAssignment.findFirst({
            where: { employeeId: id },
            orderBy: { createdAt: 'desc' },
          });
          if (latestAss) {
            const noteMsg = `[INACTIVACIÓN FUNCIONARIO]: Funcionario puesto en estado INACTIVO por ${sessionUser.name} (${sessionUser.email || ''}) el ${nowFormatted}. Motivo: "${cleanBajaReason}".`;
            await prisma.equipmentAssignment.update({
              where: { id: latestAss.id },
              data: {
                notes: latestAss.notes ? `${latestAss.notes} | ${noteMsg}` : noteMsg,
              },
            });
          }
        }
      } else if (newStatus === 'ACTIVO') {
        const latestAss = await prisma.equipmentAssignment.findFirst({
          where: { employeeId: id },
          orderBy: { createdAt: 'desc' },
        });
        if (latestAss) {
          const noteMsg = `[REACTIVACIÓN FUNCIONARIO]: Funcionario reactivado a estado ACTIVO por ${sessionUser.name} (${sessionUser.email || ''}) el ${nowFormatted}.`;
          await prisma.equipmentAssignment.update({
            where: { id: latestAss.id },
            data: {
              notes: latestAss.notes ? `${latestAss.notes} | ${noteMsg}` : noteMsg,
            },
          });
        }
      }
    }

    // Synchronize active equipment assigned to this employee
    await prisma.equipment.updateMany({
      where: {
        assignments: {
          some: {
            employeeId: id,
            fecha_fin: null,
          },
        },
      },
      data: {
        branchId: updated.branchId,
        departmentId: updated.departmentId,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating employee:', error);
    return NextResponse.json({ error: 'Error al actualizar funcionario' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role === 'LECTOR') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);

    let reason = searchParams.get('reason') || '';
    if (!reason) {
      try {
        const body = await req.json();
        reason = body.reason || body.decommissionReason || body.motivo_baja || '';
      } catch (e) {}
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: 'Debe especificar el motivo o justificación del por qué el funcionario es dado de baja' },
        { status: 400 }
      );
    }

    const cleanReason = reason.trim();

    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      return NextResponse.json({ error: 'Funcionario no encontrado' }, { status: 404 });
    }

    if (sessionUser.role !== 'SUPERADMIN') {
      const allowedBranchIds = sessionUser.branchPermissions.map((p) => p.branchId);
      if (!allowedBranchIds.includes(employee.branchId)) {
        return NextResponse.json(
          { error: 'No tiene permisos para intervenir ni deshabilitar funcionarios de otro sector.' },
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
      existingLogs = JSON.parse(employee.history_logs || '[]');
    } catch (e) {}

    existingLogs.unshift({
      id: 'evt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      timestamp: nowFormatted,
      userId: sessionUser.id,
      userName: sessionUser.name,
      userEmail: sessionUser.email,
      type: 'BAJA',
      reason: cleanReason,
      details: `Funcionario dado de baja (puesto INACTIVO) por ${sessionUser.name} (${sessionUser.email || 'Sin Email'}) el ${nowFormatted}`,
      changes: [
        'Estado cambiado a INACTIVO (Dado de Baja)',
        `Motivo de Baja: ${cleanReason}`,
        `Autoridad / Usuario Responsable: ${sessionUser.name} (${sessionUser.email || 'Sin Email'})`,
        `Fecha y Hora Exacta: ${nowFormatted}`,
        'Eliminación física prohibida por políticas del sistema',
      ],
    });

    // Soft-disable employee by setting status = 'INACTIVO' and saving history log
    const updated = await prisma.employee.update({
      where: { id },
      data: {
        status: 'INACTIVO',
        history_logs: JSON.stringify(existingLogs),
      },
      include: {
        branch: { include: { sector: true } },
        department: true,
      },
    });

    // Unassign active equipment & log event in assignment history & equipment history_logs
    const activeAssignments = await prisma.equipmentAssignment.findMany({
      where: { employeeId: id, fecha_fin: null },
      include: {
        equipment: {
          include: { type: true, brand: true, model: true },
        },
      },
    });

    for (const ass of activeAssignments) {
      const noteMsg = `[DESHABILITACIÓN FUNCIONARIO]: Funcionario dado de baja por ${sessionUser.name} (${sessionUser.email || ''}) el ${nowFormatted}. Motivo: "${cleanReason}". Equipo desasignado automáticamente.`;
      await prisma.equipmentAssignment.update({
        where: { id: ass.id },
        data: {
          fecha_fin: new Date(),
          notes: ass.notes ? `${ass.notes} | ${noteMsg}` : noteMsg,
        },
      });

      let eqLogs: any[] = [];
      try {
        eqLogs = JSON.parse(ass.equipment.history_logs || '[]');
      } catch (e) {}

      eqLogs.unshift({
        id: 'evt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        timestamp: nowFormatted,
        userId: sessionUser.id,
        userName: sessionUser.name,
        userEmail: sessionUser.email,
        type: 'DESASIGNACION',
        reason: `Desasignado por baja de funcionario. Motivo: "${cleanReason}"`,
        details: `Equipo desasignado automáticamente por baja del funcionario ${employee.full_name}`,
        changes: [
          `Estado Operativo: ${ass.equipment.status || 'asignado'} ➔ disponible`,
          `Funcionario Desvinculado: ${employee.full_name} (RUN: ${employee.rut_document})`,
          `Cargo del Funcionario: ${employee.position || 'N/A'}`,
          `Motivo Justificado de Baja: ${cleanReason}`,
          `Fecha y Hora: ${nowFormatted}`,
          `Desasignado por: ${sessionUser.name} (${sessionUser.email || 'Sin Email'})`,
        ],
      });

      await prisma.equipment.update({
        where: { id: ass.equipmentId },
        data: {
          status: 'disponible',
          history_logs: JSON.stringify(eqLogs),
        },
      });
    }

    if (activeAssignments.length === 0) {
      const latestAss = await prisma.equipmentAssignment.findFirst({
        where: { employeeId: id },
        orderBy: { createdAt: 'desc' },
      });
      if (latestAss) {
        const noteMsg = `[DESHABILITACIÓN FUNCIONARIO]: Funcionario dado de baja por ${sessionUser.name} (${sessionUser.email || ''}) el ${nowFormatted}. Motivo: "${cleanReason}".`;
        await prisma.equipmentAssignment.update({
          where: { id: latestAss.id },
          data: {
            notes: latestAss.notes ? `${latestAss.notes} | ${noteMsg}` : noteMsg,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'El funcionario fue dado de baja exitosamente (quedando INACTIVO) registrando autoría completa, fecha/hora y motivo.',
      employee: updated,
    });
  } catch (error: any) {
    console.error('Error disabling employee:', error);
    return NextResponse.json({ error: 'Error al dar de baja funcionario' }, { status: 500 });
  }
}
