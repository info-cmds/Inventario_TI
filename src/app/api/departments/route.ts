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
    const branchId = searchParams.get('branchId');
    const sectorId = searchParams.get('sectorId');

    const departments = await prisma.department.findMany({
      where: {
        ...(branchId ? { branchId } : {}),
        ...(sectorId ? { branch: { sectorId } } : {}),
      },
      include: {
        branch: {
          include: {
            sector: true,
          },
        },
        _count: {
          select: {
            employees: true,
            equipment: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(departments);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener departamentos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role === 'LECTOR') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const { name, branchId, vlan } = await req.json();

    if (!name || !branchId) {
      return NextResponse.json({ error: 'Nombre y sucursal son requeridos' }, { status: 400 });
    }

    const department = await prisma.department.create({
      data: {
        name: name.trim(),
        branchId,
        vlan: vlan ? vlan.trim() : null,
      },
      include: {
        branch: {
          include: {
            sector: true,
          },
        },
      },
    });

    return NextResponse.json(department, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al crear departamento' }, { status: 500 });
  }
}
