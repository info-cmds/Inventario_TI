import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sectorId = searchParams.get('sectorId') || undefined;

    const whereCondition: any = {
      ...(sectorId ? { sectorId } : {}),
      ...(sessionUser.role === 'SUPERADMIN'
        ? {}
        : { id: { in: sessionUser.branchPermissions.map((p) => p.branchId) } }),
    };

    const branches = await prisma.branch.findMany({
      where: whereCondition,
      include: {
        sector: true,
        departments: true,
        _count: {
          select: {
            employees: true,
            equipment: true,
            departments: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(branches);
  } catch (error) {
    return NextResponse.json({ error: 'Error al listar sucursales' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role === 'LECTOR') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const { name, code, sectorId, status } = await req.json();

    if (!name || !code || !sectorId) {
      return NextResponse.json({ error: 'Nombre, código y sector son obligatorios' }, { status: 400 });
    }

    const existingCode = await prisma.branch.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (existingCode) {
      return NextResponse.json({ error: 'El código de sucursal ya existe' }, { status: 400 });
    }

    const branch = await prisma.branch.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        sectorId,
        status: status || 'ACTIVA',
      },
      include: { sector: true },
    });

    return NextResponse.json(branch, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al crear sucursal: ' + error.message }, { status: 500 });
  }
}
