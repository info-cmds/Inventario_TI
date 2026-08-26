import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

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
    const {
      asset_tag,
      serial_number,
      typeId,
      brandId,
      modelId,
      branchId,
      departmentId,
      vlan,
      ip_address,
      dynamic_values,
      status,
      assignedEmployeeId,
      assignmentNotes,
    } = await req.json();

    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: {
        type: true,
        brand: true,
        model: true,
        branch: true,
        department: true,
        assignments: { where: { fecha_fin: null } },
      },
    });

    if (!equipment) {
      return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 });
    }

    // Check tags
    if (asset_tag && asset_tag.trim().toUpperCase() !== equipment.asset_tag) {
      const tagExists = await prisma.equipment.findUnique({
        where: { asset_tag: asset_tag.trim().toUpperCase() },
      });
      if (tagExists) {
        return NextResponse.json({ error: `El Asset Tag ${asset_tag} ya existe` }, { status: 400 });
      }
    }

    if (serial_number && serial_number.trim().toUpperCase() !== equipment.serial_number) {
      const serialExists = await prisma.equipment.findUnique({
        where: { serial_number: serial_number.trim().toUpperCase() },
      });
      if (serialExists) {
        return NextResponse.json({ error: `El número de serie ${serial_number} ya existe` }, { status: 400 });
      }
    }

    const newStatus = status || equipment.status;
    const activeAssignment = equipment.assignments[0];

    let targetBranchId = branchId || equipment.branchId;
    let targetDepartmentId = departmentId !== undefined ? (departmentId || null) : equipment.departmentId;

    // Handle assignment changes based on new status
    if (newStatus === 'asignado') {
      const empIdToUse = assignedEmployeeId || activeAssignment?.employeeId;
      if (empIdToUse) {
        const assignedEmp = await prisma.employee.findUnique({
          where: { id: empIdToUse },
        });

        if (assignedEmp) {
          // Always sync assigned employee's branch and department to match the equipment's target location
          await prisma.employee.update({
            where: { id: empIdToUse },
            data: {
              branchId: targetBranchId,
              departmentId: targetDepartmentId,
            },
          });
        }

        // If employee changed or no active assignment, close existing and create new
        if (assignedEmployeeId && (!activeAssignment || activeAssignment.employeeId !== assignedEmployeeId)) {
          if (activeAssignment) {
            await prisma.equipmentAssignment.update({
              where: { id: activeAssignment.id },
              data: { fecha_fin: new Date() },
            });
          }

          await prisma.equipmentAssignment.create({
            data: {
              equipmentId: id,
              employeeId: assignedEmployeeId,
              assignedByUserId: sessionUser.id,
              notes: assignmentNotes || 'Asignación al actualizar equipo',
            },
          });
        }
      }
    } else {
      // Status changed to disponible, en_reparacion, or dado_de_baja -> close ALL active assignments for this equipment
      await prisma.equipmentAssignment.updateMany({
        where: { equipmentId: id, fecha_fin: null },
        data: { fecha_fin: new Date() },
      });
    }

    // Parse dynamic values
    let dynObj: Record<string, any> = {};
    let oldDyn: Record<string, any> = {};
    try {
      oldDyn = JSON.parse(equipment.dynamic_values || '{}');
    } catch (e) {}

    if (dynamic_values !== undefined) {
      dynObj = typeof dynamic_values === 'string' ? JSON.parse(dynamic_values || '{}') : dynamic_values;
    } else {
      dynObj = { ...oldDyn };
    }

    // Preserve existing system metadata arrays
    if (!dynObj._upgrades && oldDyn._upgrades) dynObj._upgrades = oldDyn._upgrades;
    if (!dynObj._maintenances && oldDyn._maintenances) dynObj._maintenances = oldDyn._maintenances;
    if (!dynObj._decommission_reason && oldDyn._decommission_reason) {
      dynObj._decommission_reason = oldDyn._decommission_reason;
      dynObj._decommission_date = oldDyn._decommission_date;
      dynObj._decommission_by = oldDyn._decommission_by;
    }

    const nowFormatted = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' +
      new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }) +
      ' hrs';

    const reqBody = await req.json().catch(() => ({}));

    // Process new Upgrade registration
    if (reqBody.newUpgrade) {
      const upgradesList = Array.isArray(dynObj._upgrades) ? [...dynObj._upgrades] : [];
      upgradesList.unshift({
        id: 'upg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        timestamp: nowFormatted,
        userId: sessionUser.id,
        userName: sessionUser.name,
        category: reqBody.newUpgrade.category || 'Mejora General',
        description: reqBody.newUpgrade.description || '',
        component: reqBody.newUpgrade.component || '',
        cost: reqBody.newUpgrade.cost || '',
      });
      dynObj._upgrades = upgradesList;
    }

    // Process new Maintenance registration
    if (reqBody.newMaintenance) {
      const maintenanceList = Array.isArray(dynObj._maintenances) ? [...dynObj._maintenances] : [];
      maintenanceList.unshift({
        id: 'mnt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        timestamp: nowFormatted,
        userId: sessionUser.id,
        userName: sessionUser.name,
        maintenanceType: reqBody.newMaintenance.maintenanceType || 'Preventiva',
        description: reqBody.newMaintenance.description || '',
        technicianNotes: reqBody.newMaintenance.technicianNotes || '',
        nextServiceDate: reqBody.newMaintenance.nextServiceDate || '',
      });
      dynObj._maintenances = maintenanceList;
    }

    if (newStatus === 'dado_de_baja' && (reqBody.decommissionReason || reqBody.reason)) {
      dynObj._decommission_reason = reqBody.decommissionReason || reqBody.reason;
      dynObj._decommission_date = nowFormatted;
      dynObj._decommission_by = sessionUser.name;
    }

    // Track detailed audit changes for history_logs
    const changes: string[] = [];

    const newAssetTag = asset_tag ? asset_tag.trim().toUpperCase() : equipment.asset_tag;
    if (newAssetTag !== equipment.asset_tag) {
      changes.push(`Asset Tag: ${equipment.asset_tag} ➔ ${newAssetTag}`);
    }

    const newSerial = serial_number ? serial_number.trim().toUpperCase() : equipment.serial_number;
    if (newSerial !== equipment.serial_number) {
      changes.push(`Número de Serie: ${equipment.serial_number} ➔ ${newSerial}`);
    }

    if (typeId && typeId !== equipment.typeId) {
      const targetType = await prisma.equipmentType.findUnique({ where: { id: typeId } });
      changes.push(`Tipo de Equipo: ${equipment.type?.name || 'N/A'} ➔ ${targetType?.name || 'N/A'}`);
    }

    if (brandId !== undefined && (brandId || null) !== equipment.brandId) {
      const targetBrand = brandId ? await prisma.brand.findUnique({ where: { id: brandId } }) : null;
      changes.push(`Marca: ${equipment.brand?.name || 'Sin Especificar'} ➔ ${targetBrand?.name || 'Sin Especificar'}`);
    }

    if (modelId !== undefined && (modelId || null) !== equipment.modelId) {
      const targetModel = modelId ? await prisma.equipmentModel.findUnique({ where: { id: modelId } }) : null;
      changes.push(`Modelo: ${equipment.model?.name || 'Sin Especificar'} ➔ ${targetModel?.name || 'Sin Especificar'}`);
    }

    if (targetBranchId !== equipment.branchId) {
      const targetBranch = await prisma.branch.findUnique({ where: { id: targetBranchId } });
      changes.push(`Sucursal: ${equipment.branch?.name || 'N/A'} ➔ ${targetBranch?.name || 'N/A'}`);
    }

    if (targetDepartmentId !== equipment.departmentId) {
      const targetDept = targetDepartmentId ? await prisma.department.findUnique({ where: { id: targetDepartmentId } }) : null;
      changes.push(`Departamento: ${equipment.department?.name || 'Sin Depto'} ➔ ${targetDept?.name || 'Sin Depto'}`);
    }

    const newVlan = vlan !== undefined ? (vlan ? vlan.trim() : null) : equipment.vlan;
    if (newVlan !== equipment.vlan) {
      changes.push(`VLAN: ${equipment.vlan || 'Sin VLAN'} ➔ ${newVlan || 'Sin VLAN'}`);
    }

    const newIp = ip_address !== undefined ? (ip_address ? ip_address.trim() : null) : equipment.ip_address;
    if (newIp !== equipment.ip_address) {
      changes.push(`Dirección IP: ${equipment.ip_address || 'Sin IP'} ➔ ${newIp || 'Sin IP'}`);
    }

    if (newStatus !== equipment.status) {
      changes.push(`Estado Operativo: ${equipment.status} ➔ ${newStatus}`);
    }

    if (reqBody.newUpgrade) {
      changes.push(`Upgrade Tecnológico [${reqBody.newUpgrade.category || 'General'}]: ${reqBody.newUpgrade.description || ''} (Componente: ${reqBody.newUpgrade.component || 'N/A'}, Costo: $${reqBody.newUpgrade.cost || '0'})`);
    }

    if (reqBody.newMaintenance) {
      changes.push(`Mantención Registrada [${reqBody.newMaintenance.maintenanceType || 'Preventiva'}]: ${reqBody.newMaintenance.description || ''}`);
    }

    let existingLogs: any[] = [];
    try {
      existingLogs = JSON.parse(equipment.history_logs || '[]');
    } catch (e) {}

    if (changes.length > 0) {
      let eventType = 'MODIFICACION';
      if (reqBody.newMaintenance) eventType = 'MANTENIMIENTO';
      else if (reqBody.newUpgrade) eventType = 'UPGRADE';
      else if (newStatus === 'dado_de_baja') eventType = 'BAJA';

      existingLogs.unshift({
        id: 'evt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        timestamp: nowFormatted,
        userId: sessionUser.id,
        userName: sessionUser.name,
        userEmail: sessionUser.email,
        type: eventType,
        details: `Equipo modificado por ${sessionUser.name}`,
        changes,
      });
    }

    const updated = await prisma.equipment.update({
      where: { id },
      data: {
        asset_tag: newAssetTag,
        serial_number: newSerial,
        typeId: typeId || equipment.typeId,
        brandId: brandId !== undefined ? (brandId || null) : equipment.brandId,
        modelId: modelId !== undefined ? (modelId || null) : equipment.modelId,
        branchId: targetBranchId,
        departmentId: targetDepartmentId,
        vlan: newVlan,
        ip_address: newIp,
        dynamic_values: JSON.stringify(dynObj),
        status: newStatus,
        history_logs: JSON.stringify(existingLogs),
      },
      include: {
        type: true,
        brand: true,
        model: true,
        branch: { include: { sector: true } },
        department: true,
        assignments: {
          where: { fecha_fin: null },
          include: {
            employee: {
              include: {
                branch: { include: { sector: true } },
                department: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al actualizar equipo: ' + error.message }, { status: 500 });
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
        { error: 'Debe especificar la descripción o motivo del por qué el equipo es dado de baja' },
        { status: 400 }
      );
    }

    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: { assignments: { where: { fecha_fin: null } } },
    });

    if (!equipment) {
      return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 });
    }

    const cleanReason = reason.trim();
    const activeAssignment = equipment.assignments[0];

    const nowFormatted = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' +
      new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }) +
      ' hrs';

    // Close active assignment if equipment was assigned
    if (activeAssignment) {
      await prisma.equipmentAssignment.update({
        where: { id: activeAssignment.id },
        data: {
          fecha_fin: new Date(),
          notes: `${activeAssignment.notes || ''}\n[DADO DE BAJA]: Motivo: ${cleanReason} (Registrado por ${sessionUser.name} el ${nowFormatted})`.trim(),
        },
      });
    }

    // Parse current dynamic values and append decommission reason metadata
    let currentDyn: Record<string, any> = {};
    try {
      currentDyn = JSON.parse(equipment.dynamic_values || '{}');
    } catch (e) {}

    currentDyn._decommission_reason = cleanReason;
    currentDyn._decommission_date = nowFormatted;
    currentDyn._decommission_by = sessionUser.name;

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
      type: 'BAJA',
      reason: cleanReason,
      details: `Equipo dado de baja por ${sessionUser.name} (${sessionUser.email || 'Sin Email'}) el ${nowFormatted}`,
      changes: [
        `Estado Operativo: ${equipment.status} ➔ dado_de_baja`,
        `Motivo de Baja: ${cleanReason}`,
        `Responsable: ${sessionUser.name} (${sessionUser.email || 'Sin Email'})`,
        `Fecha y Hora: ${nowFormatted}`,
      ],
    });

    const updated = await prisma.equipment.update({
      where: { id },
      data: {
        status: 'dado_de_baja',
        dynamic_values: JSON.stringify(currentDyn),
        history_logs: JSON.stringify(existingLogs),
      },
      include: {
        type: true,
        brand: true,
        model: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'El equipo fue dado de baja exitosamente en el sistema con su justificación.',
      equipment: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al dar de baja el equipo: ' + error.message }, { status: 500 });
  }
}
