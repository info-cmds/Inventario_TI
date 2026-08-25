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
    const querySectorId = searchParams.get('sectorId');

    let sectorFilter: any = {};

    if (querySectorId) {
      sectorFilter = {
        OR: [{ sectorId: null }, { sectorId: querySectorId }],
      };
    } else if (sessionUser.role !== 'SUPERADMIN') {
      const allowedSectorIds = Array.from(
        new Set(sessionUser.branchPermissions.map((p: any) => p.sectorId).filter(Boolean))
      );
      if (allowedSectorIds.length > 0) {
        sectorFilter = {
          OR: [{ sectorId: null }, { sectorId: { in: allowedSectorIds } }],
        };
      }
    }

    const types = await prisma.equipmentType.findMany({
      where: sectorFilter,
      include: {
        sector: { select: { id: true, name: true } },
        models: { include: { brand: true } },
        _count: {
          select: { equipment: true, models: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(types);
  } catch (error) {
    return NextResponse.json({ error: 'Error al consultar tipos de equipo' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role === 'LECTOR') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const { name, description, dynamic_attributes, associated_brands, targetSectorIds } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'El nombre del tipo de equipo es obligatorio' }, { status: 400 });
    }

    const cleanName = name.trim().toUpperCase();

    let sectorsToApply: (string | null)[] = [null];

    if (sessionUser.role === 'SUPERADMIN') {
      if (Array.isArray(targetSectorIds) && targetSectorIds.length > 0 && !targetSectorIds.includes('ALL')) {
        sectorsToApply = targetSectorIds;
      } else {
        sectorsToApply = [null]; // Global
      }
    } else {
      const userSectorId = (sessionUser.branchPermissions[0] as any)?.sectorId || null;
      sectorsToApply = [userSectorId];
    }

    const createdTypes = [];

    for (const secId of sectorsToApply) {
      const type = await prisma.equipmentType.create({
        data: {
          name: cleanName,
          sectorId: secId,
          description: description ? description.trim() : null,
          dynamic_attributes: typeof dynamic_attributes === 'string'
            ? dynamic_attributes
            : JSON.stringify(dynamic_attributes || []),
          associated_brands: typeof associated_brands === 'string'
            ? associated_brands
            : JSON.stringify(associated_brands || []),
        },
        include: { sector: true },
      });
      createdTypes.push(type);
    }

    return NextResponse.json(createdTypes[0] || { message: 'Tipo de equipo procesado' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al crear tipo de equipo: ' + error.message }, { status: 500 });
  }
}
