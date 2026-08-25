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

    let brands = await prisma.brand.findMany({
      where: sectorFilter,
      include: {
        sector: { select: { id: true, name: true } },
        models: {
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { equipment: true, models: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Auto-populate initial default brands if DB is empty
    if (brands.length === 0 && (!querySectorId || sessionUser.role === 'SUPERADMIN')) {
      const defaultData = [
        { name: 'LG', models: ['24MP400', 'ULTRAGEAR 27', '22MK430H'] },
        { name: 'VIEWSONIC', models: ['VA2406-H', 'VA2732-MHD', 'TD2423 TOUCH'] },
        { name: 'LENOVO', models: ['THINKPAD E14', 'V15 G3', 'THINKCENTRE M70Q'] },
        { name: 'HP', models: ['PROBOOK 450 G9', 'LASERJET PRO M404', 'ELITEDESK 800 G6'] },
        { name: 'DELL', models: ['LATITUDE 3420', 'OPTIPLEX 3080', 'ULTRASHARP U2422H'] },
        { name: 'APPLE', models: ['MACBOOK AIR M2', 'IMAC 24"', 'IPAD AIR'] },
        { name: 'SAMSUNG', models: ['ODYSSEY G3', 'ESSENTIAL MONITOR S3'] },
        { name: 'EPSON', models: ['ECOTANK L3250', 'POWERLITE L210W'] },
      ];

      for (const item of defaultData) {
        await prisma.brand.create({
          data: {
            name: item.name.toUpperCase(),
            sectorId: null, // Global
            models: {
              create: item.models.map((mName) => ({ name: mName.toUpperCase(), sectorId: null })),
            },
          },
        });
      }

      brands = await prisma.brand.findMany({
        where: sectorFilter,
        include: {
          sector: { select: { id: true, name: true } },
          models: {
            orderBy: { name: 'asc' },
          },
          _count: {
            select: { equipment: true, models: true },
          },
        },
        orderBy: { name: 'asc' },
      });
    }

    return NextResponse.json(brands);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener marcas' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role === 'LECTOR') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const { name, targetSectorIds } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'El nombre de la marca es obligatorio' }, { status: 400 });
    }

    const cleanName = name.trim().toUpperCase();

    // Determine target sectors
    let sectorsToApply: (string | null)[] = [null];

    if (sessionUser.role === 'SUPERADMIN') {
      if (Array.isArray(targetSectorIds) && targetSectorIds.length > 0 && !targetSectorIds.includes('ALL')) {
        sectorsToApply = targetSectorIds;
      } else {
        sectorsToApply = [null]; // Global
      }
    } else {
      // Sector Admin: scope exclusively to their sector
      const userSectorId = sessionUser.branchPermissions[0]?.sectorId || null;
      sectorsToApply = [userSectorId];
    }

    const createdBrands = [];

    for (const secId of sectorsToApply) {
      const existing = await prisma.brand.findFirst({
        where: {
          name: cleanName,
          sectorId: secId,
        },
      });

      if (existing) {
        continue;
      }

      const brand = await prisma.brand.create({
        data: {
          name: cleanName,
          sectorId: secId,
        },
        include: { sector: true, models: true },
      });
      createdBrands.push(brand);
    }

    return NextResponse.json(createdBrands[0] || { message: 'Marca procesada' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al crear marca: ' + error.message }, { status: 500 });
  }
}
