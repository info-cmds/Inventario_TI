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
    const { name, targetSectorIds } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'El nombre de la marca es obligatorio' }, { status: 400 });
    }

    const brand = await prisma.brand.findUnique({ where: { id } });
    if (!brand) {
      return NextResponse.json({ error: 'Marca no encontrada' }, { status: 404 });
    }

    const cleanName = name.trim().toUpperCase();

    if (sessionUser.role === 'SUPERADMIN') {
      let newSectorId = brand.sectorId;
      if (Array.isArray(targetSectorIds)) {
        if (targetSectorIds.includes('ALL') || targetSectorIds.length === 0) {
          newSectorId = null;
        } else {
          newSectorId = targetSectorIds[0];
        }
      }

      const updated = await prisma.brand.update({
        where: { id },
        data: { name: cleanName, sectorId: newSectorId },
        include: { sector: true, models: true },
      });

      return NextResponse.json(updated);
    } else {
      // Sector Admin: if item is global, create sector-scoped copy instead of overwriting global item
      const userSectorId = (sessionUser.branchPermissions[0] as any)?.sectorId || null;

      if (brand.sectorId === null) {
        // Create sector-specific brand copy so global brand is untouched for other sectors
        const sectorCopy = await prisma.brand.create({
          data: {
            name: cleanName,
            sectorId: userSectorId,
          },
          include: { sector: true, models: true },
        });
        return NextResponse.json(sectorCopy);
      } else {
        // Directly update item belonging to user's sector
        const updated = await prisma.brand.update({
          where: { id },
          data: { name: cleanName },
          include: { sector: true, models: true },
        });
        return NextResponse.json(updated);
      }
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al actualizar marca: ' + error.message }, { status: 500 });
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
    const brand = await prisma.brand.findUnique({ where: { id } });

    if (!brand) {
      return NextResponse.json({ error: 'Marca no encontrada' }, { status: 404 });
    }

    const equipmentCount = await prisma.equipment.count({
      where: { brandId: id },
    });

    if (equipmentCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar la marca porque tiene equipos vinculados en el sistema' },
        { status: 400 }
      );
    }

    await prisma.brand.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar marca' }, { status: 500 });
  }
}
