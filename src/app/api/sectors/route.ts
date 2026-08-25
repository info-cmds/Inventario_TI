import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const allowedBranchIds = sessionUser.branchPermissions.map((p) => p.branchId);

    const sectors = await prisma.sector.findMany({
      where:
        sessionUser.role === 'SUPERADMIN'
          ? {}
          : {
              branches: {
                some: {
                  id: { in: allowedBranchIds },
                },
              },
            },
      include: {
        branches: {
          where:
            sessionUser.role === 'SUPERADMIN'
              ? {}
              : {
                  id: { in: allowedBranchIds },
                },
          include: {
            departments: true,
            _count: {
              select: { employees: true, equipment: true },
            },
          },
        },
        _count: {
          select: { branches: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(sectors);
  } catch (error) {
    return NextResponse.json({ error: 'Error al consultar sectores' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role === 'LECTOR') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const { name, description, status } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'El nombre del sector es obligatorio' }, { status: 400 });
    }

    const existing = await prisma.sector.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return NextResponse.json({ error: `El sector '${name}' ya existe` }, { status: 400 });
    }

    const sector = await prisma.sector.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        status: status || 'ACTIVO',
      },
    });

    return NextResponse.json(sector, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al crear sector' }, { status: 500 });
  }
}
