import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, filterByBranchPermissions } from '@/lib/auth';
import { sanitizeDynamicValues } from '@/lib/sanitizeDynamicValues';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || '';
    const sectorId = searchParams.get('sectorId') || undefined;
    let branchId = searchParams.get('branchId') || undefined;
    const departmentId = searchParams.get('departmentId') || undefined;
    const typeId = searchParams.get('typeId') || undefined;
    const brandId = searchParams.get('brandId') || undefined;
    const status = searchParams.get('status') || undefined;

    // If departmentId is provided and valid, resolve its real branchId to avoid cross-branch mismatch
    if (departmentId && departmentId !== 'none') {
      const deptObj = await prisma.department.findUnique({
        where: { id: departmentId },
        select: { branchId: true },
      });
      if (deptObj && deptObj.branchId) {
        branchId = deptObj.branchId;
      }
    }

    const branchFilter = filterByBranchPermissions(sessionUser, branchId, sectorId);

    const equipment = await prisma.equipment.findMany({
      where: {
        ...branchFilter,
        ...(departmentId ? (departmentId === 'none' ? { departmentId: null } : { departmentId }) : {}),
        ...(typeId ? { typeId } : {}),
        ...(brandId ? { brandId } : {}),
        ...(status ? { status } : {}),
        OR: query
          ? [
              { asset_tag: { contains: query, mode: 'insensitive' } },
              { serial_number: { contains: query, mode: 'insensitive' } },
              { dynamic_values: { contains: query, mode: 'insensitive' } },
              { brand: { name: { contains: query, mode: 'insensitive' } } },
              { model: { name: { contains: query, mode: 'insensitive' } } },
              {
                assignments: {
                  some: {
                    fecha_fin: null,
                    employee: {
                      full_name: { contains: query, mode: 'insensitive' },
                    },
                  },
                },
              },
            ]
          : undefined,
      },
      select: {
        id: true,
        asset_tag: true,
        serial_number: true,
        typeId: true,
        brandId: true,
        modelId: true,
        branchId: true,
        departmentId: true,
        vlan: true,
        ip_address: true,
        dynamic_values: true,
        status: true,
        attached_documents: true,
        history_logs: true,
        createdAt: true,
        updatedAt: true,
        type: true,
        brand: true,
        model: true,
        branch: { include: { sector: true } },
        department: true,
        assignments: {
          where: { fecha_fin: null },
          select: {
            id: true,
            fecha_inicio: true,
            notes: true,
            employee: {
              select: {
                id: true,
                full_name: true,
                rut_document: true,
                position: true,
                status: true,
                branch: { select: { id: true, name: true, sector: true } },
                department: { select: { id: true, name: true } },
              },
            },
            assignedByUser: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(equipment);
  } catch (error: any) {
    console.error('Error fetching equipment:', error);
    return NextResponse.json({ error: 'Error al consultar inventario' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role === 'LECTOR') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

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

    if (!asset_tag || !serial_number || !typeId || !branchId) {
      return NextResponse.json(
        { error: 'Asset Tag, Serie, Tipo y Sucursal son requeridos' },
        { status: 400 }
      );
    }

    if (status === 'asignado' && !assignedEmployeeId) {
      return NextResponse.json(
        { error: 'Debe seleccionar un funcionario para registrar un equipo con estado Asignado' },
        { status: 400 }
      );
    }

    const existingTag = await prisma.equipment.findUnique({
      where: { asset_tag: asset_tag.trim().toUpperCase() },
    });
    if (existingTag) {
      return NextResponse.json({ error: `El código Asset Tag '${asset_tag}' ya existe` }, { status: 400 });
    }

    const existingSerial = await prisma.equipment.findUnique({
      where: { serial_number: serial_number.trim().toUpperCase() },
    });
    if (existingSerial) {
      return NextResponse.json({ error: `El número de serie '${serial_number}' ya está registrado` }, { status: 400 });
    }

    let finalBranchId = branchId;
    let finalDeptId = departmentId ? departmentId : null;

    if (status === 'asignado' && assignedEmployeeId) {
      await prisma.employee.update({
        where: { id: assignedEmployeeId },
        data: {
          branchId: finalBranchId,
          departmentId: finalDeptId,
        },
      });
    }

    const nowFormatted = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' +
      new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }) +
      ' hrs';

    const initialLogs = [{
      id: 'evt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      timestamp: nowFormatted,
      userId: sessionUser.id,
      userName: sessionUser.name,
      userEmail: sessionUser.email,
      type: 'CREACION',
      details: `Equipo registrado en inventario por ${sessionUser.name}`,
      changes: [
        `Asset Tag: ${asset_tag.trim().toUpperCase()}`,
        `Número de Serie: ${serial_number.trim().toUpperCase()}`,
        `Estado Inicial: ${status || 'disponible'}`,
        ...(vlan ? [`VLAN: ${vlan.trim()}`] : []),
        ...(ip_address ? [`Dirección IP: ${ip_address.trim()}`] : []),
      ],
    }];

    const equipmentTypeObj = typeId
      ? await prisma.equipmentType.findUnique({ where: { id: typeId } })
      : null;

    const sanitizedDynValues = sanitizeDynamicValues(
      equipmentTypeObj?.dynamic_attributes,
      dynamic_values || {}
    );

    const equipment = await prisma.equipment.create({
      data: {
        asset_tag: asset_tag.trim().toUpperCase(),
        serial_number: serial_number.trim().toUpperCase(),
        typeId,
        brandId: brandId || null,
        modelId: modelId || null,
        branchId: finalBranchId,
        departmentId: finalDeptId,
        vlan: vlan ? vlan.trim() : null,
        ip_address: ip_address ? ip_address.trim() : null,
        dynamic_values: sanitizedDynValues,
        status: status || 'disponible',
        history_logs: JSON.stringify(initialLogs),
      },
      include: {
        type: true,
        brand: true,
        model: true,
        branch: { include: { sector: true } },
        department: true,
      },
    });

    if (status === 'asignado' && assignedEmployeeId) {
      await prisma.equipmentAssignment.create({
        data: {
          equipmentId: equipment.id,
          employeeId: assignedEmployeeId,
          assignedByUserId: sessionUser.id,
          notes: assignmentNotes || 'Asignación al crear equipo en inventario',
        },
      });
    }

    const result = await prisma.equipment.findUnique({
      where: { id: equipment.id },
      include: {
        type: true,
        brand: true,
        model: true,
        branch: { include: { sector: true } },
        department: true,
        assignments: {
          where: { fecha_fin: null },
          include: { employee: true },
        },
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error creating equipment:', error);
    return NextResponse.json({ error: 'Error al registrar equipo en inventario: ' + error.message }, { status: 500 });
  }
}
