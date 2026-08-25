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
    const brandId = searchParams.get('brandId') || undefined;
    const typeId = searchParams.get('typeId') || undefined;
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

    const models = await prisma.equipmentModel.findMany({
      where: {
        ...(brandId ? { brandId } : {}),
        ...(typeId ? { typeId } : {}),
        ...sectorFilter,
      },
      include: {
        sector: { select: { id: true, name: true } },
        brand: true,
        type: true,
        _count: { select: { equipment: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(models);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener modelos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role === 'LECTOR') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const { name, brandId, typeId, ram, processor, storage, specs, targetSectorIds } = await req.json();

    if (!name || !name.trim() || !brandId) {
      return NextResponse.json({ error: 'Nombre del modelo y marca son obligatorios' }, { status: 400 });
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

    const createdModels = [];

    for (const secId of sectorsToApply) {
      const model = await prisma.equipmentModel.create({
        data: {
          name: cleanName,
          sectorId: secId,
          brandId,
          typeId: typeId || null,
          ram: ram?.trim() || null,
          processor: processor?.trim() || null,
          storage: storage?.trim() || null,
          specs: specs ? (typeof specs === 'string' ? specs : JSON.stringify(specs)) : null,
        },
        include: { sector: true, brand: true, type: true },
      });
      createdModels.push(model);
    }

    return NextResponse.json(createdModels[0] || { message: 'Modelo procesado' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al crear modelo: ' + error.message }, { status: 500 });
  }
}
