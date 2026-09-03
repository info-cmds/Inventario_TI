import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, filterByBranchPermissions } from '@/lib/auth';

// Strict RUT formatter: converts any input (12.345.678-K, 12345678K, 12 345 678 K) to standard 12345678-K
export function cleanAndFormatRUT(rawRut: string): { valid: boolean; formatted: string; error?: string } {
  if (!rawRut || !rawRut.trim()) {
    return { valid: false, formatted: '', error: 'El RUN es obligatorio' };
  }

  const cleaned = rawRut.replace(/[^0-9kK]/g, '').trim().toUpperCase();

  if (cleaned.length < 2) {
    return { valid: false, formatted: '', error: 'El RUN es demasiado corto o no contiene un formato válido' };
  }

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  const formatted = `${body}-${dv}`;
  return { valid: true, formatted };
}

// Helper: Text Only Validation for Names
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

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || '';
    const sectorId = searchParams.get('sectorId') || undefined;
    const branchId = searchParams.get('branchId') || undefined;
    const departmentId = searchParams.get('departmentId') || undefined;
    const status = searchParams.get('status') || undefined;

    const branchFilter = filterByBranchPermissions(sessionUser, branchId, sectorId);

    const employees = await prisma.employee.findMany({
      where: {
        ...branchFilter,
        ...(departmentId ? { departmentId } : {}),
        ...(status ? { status } : {}),
        OR: query
          ? [
              { full_name: { contains: query, mode: 'insensitive' } },
              { names: { contains: query, mode: 'insensitive' } },
              { paternal_surname: { contains: query, mode: 'insensitive' } },
              { maternal_surname: { contains: query, mode: 'insensitive' } },
              { rut_document: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
              { position: { contains: query, mode: 'insensitive' } },
            ]
          : undefined,
      },
      select: {
        id: true,
        rut_document: true,
        names: true,
        paternal_surname: true,
        maternal_surname: true,
        full_name: true,
        email: true,
        position: true,
        branchId: true,
        departmentId: true,
        status: true,
        history_logs: true,
        createdAt: true,
        updatedAt: true,
        branch: { include: { sector: true } },
        department: true,
        assignments: {
          where: { fecha_fin: null },
          select: {
            id: true,
            fecha_inicio: true,
            notes: true,
            equipment: {
              select: {
                id: true,
                asset_tag: true,
                serial_number: true,
                status: true,
                type: { select: { id: true, name: true } },
                brand: { select: { id: true, name: true } },
                model: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { full_name: 'asc' },
    });

    return NextResponse.json(employees);
  } catch (error: any) {
    console.error('Error getting employees:', error);
    return NextResponse.json({ error: 'Error al consultar funcionarios' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role === 'LECTOR') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

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
    } = await req.json();

    const rutVal = cleanAndFormatRUT(rut_document);
    if (!rutVal.valid) {
      return NextResponse.json({ error: rutVal.error }, { status: 400 });
    }

    // Validate Names & Surnames
    const namesVal = validateTextOnly(names, 'El campo Nombres');
    if (!namesVal.valid) return NextResponse.json({ error: namesVal.error }, { status: 400 });

    const patVal = validateTextOnly(paternal_surname, 'El Apellido Paterno');
    if (!patVal.valid) return NextResponse.json({ error: patVal.error }, { status: 400 });

    if (maternal_surname && maternal_surname.trim()) {
      const matVal = validateTextOnly(maternal_surname, 'El Apellido Materno');
      if (!matVal.valid) return NextResponse.json({ error: matVal.error }, { status: 400 });
    }

    if (!branchId) {
      return NextResponse.json({ error: 'La Sucursal es obligatoria' }, { status: 400 });
    }

    if (sessionUser.role !== 'SUPERADMIN') {
      const allowedBranchIds = sessionUser.branchPermissions.map((p) => p.branchId);
      if (!allowedBranchIds.includes(branchId)) {
        return NextResponse.json(
          { error: 'No tiene permisos para registrar funcionarios en este sector o sucursal. Los administradores de Salud no pueden registrar funcionarios en Educación y viceversa.' },
          { status: 403 }
        );
      }
    }

    const formattedRut = rutVal.formatted.toUpperCase();
    const existingRUT = await prisma.employee.findUnique({
      where: { rut_document: formattedRut },
    });

    if (existingRUT) {
      return NextResponse.json({ error: `El RUN ${formattedRut} ya se encuentra registrado` }, { status: 400 });
    }

    const targetDeptId = departmentId ? departmentId : null;

    const cleanNames = names.trim().toUpperCase();
    const cleanPat = paternal_surname.trim().toUpperCase();
    const cleanMat = maternal_surname ? maternal_surname.trim().toUpperCase() : '';
    const fullNameComputed = `${cleanNames} ${cleanPat} ${cleanMat}`.trim();

    const nowFormatted = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' +
      new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false }) +
      ' hrs';

    const initialLogs = [
      {
        id: 'evt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        timestamp: nowFormatted,
        userId: sessionUser.id,
        userName: sessionUser.name,
        type: 'CREACION',
        details: `Funcionario registrado en el sistema por ${sessionUser.name}`,
        changes: [
          `Registrado con RUN ${formattedRut}`,
          `Nombre: ${fullNameComputed}`,
          `Cargo: ${position ? position.trim().toUpperCase() : 'FUNCIONARIO'}`,
        ],
      },
    ];

    const employee = await prisma.employee.create({
      data: {
        rut_document: formattedRut,
        names: cleanNames,
        paternal_surname: cleanPat,
        maternal_surname: cleanMat,
        full_name: fullNameComputed,
        email: email ? email.trim().toUpperCase() : '',
        position: position ? position.trim().toUpperCase() : 'FUNCIONARIO',
        branchId,
        departmentId: targetDeptId,
        status: status ? status.toUpperCase() : 'ACTIVO',
        history_logs: JSON.stringify(initialLogs),
      },
      include: {
        branch: { include: { sector: true } },
        department: true,
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al crear funcionario: ' + error.message }, { status: 500 });
  }
}
