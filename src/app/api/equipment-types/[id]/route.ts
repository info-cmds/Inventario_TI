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
    const { name, description, dynamic_attributes, associated_brands, targetSectorIds } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'El nombre del tipo de equipo es obligatorio' }, { status: 400 });
    }

    const typeObj = await prisma.equipmentType.findUnique({ where: { id } });
    if (!typeObj) {
      return NextResponse.json({ error: 'Tipo de equipo no encontrado' }, { status: 404 });
    }

    const cleanName = name.trim().toUpperCase();

    if (sessionUser.role === 'SUPERADMIN') {
      let newSectorId = typeObj.sectorId;
      if (Array.isArray(targetSectorIds)) {
        if (targetSectorIds.includes('ALL') || targetSectorIds.length === 0) {
          newSectorId = null;
        } else {
          newSectorId = targetSectorIds[0];
        }
      }

      const updated = await prisma.equipmentType.update({
        where: { id },
        data: {
          name: cleanName,
          sectorId: newSectorId,
          description: description !== undefined ? (description ? description.trim() : null) : typeObj.description,
          dynamic_attributes: dynamic_attributes !== undefined
            ? (typeof dynamic_attributes === 'string' ? dynamic_attributes : JSON.stringify(dynamic_attributes))
            : typeObj.dynamic_attributes,
          associated_brands: associated_brands !== undefined
            ? (typeof associated_brands === 'string' ? associated_brands : JSON.stringify(associated_brands))
            : typeObj.associated_brands,
        },
        include: { sector: true },
      });

      return NextResponse.json(updated);
    } else {
      // Sector Admin: create sector-scoped copy if original is global
      const userSectorId = (sessionUser.branchPermissions[0] as any)?.sectorId || null;

      if (typeObj.sectorId === null) {
        const sectorCopy = await prisma.equipmentType.create({
          data: {
            name: cleanName,
            sectorId: userSectorId,
            description: description !== undefined ? (description ? description.trim() : null) : typeObj.description,
            dynamic_attributes: dynamic_attributes !== undefined
              ? (typeof dynamic_attributes === 'string' ? dynamic_attributes : JSON.stringify(dynamic_attributes))
              : typeObj.dynamic_attributes,
            associated_brands: associated_brands !== undefined
              ? (typeof associated_brands === 'string' ? associated_brands : JSON.stringify(associated_brands))
              : typeObj.associated_brands,
          },
          include: { sector: true },
        });
        return NextResponse.json(sectorCopy);
      } else {
        const updated = await prisma.equipmentType.update({
          where: { id },
          data: {
            name: cleanName,
            description: description !== undefined ? (description ? description.trim() : null) : typeObj.description,
            dynamic_attributes: dynamic_attributes !== undefined
              ? (typeof dynamic_attributes === 'string' ? dynamic_attributes : JSON.stringify(dynamic_attributes))
              : typeObj.dynamic_attributes,
            associated_brands: associated_brands !== undefined
              ? (typeof associated_brands === 'string' ? associated_brands : JSON.stringify(associated_brands))
              : typeObj.associated_brands,
          },
          include: { sector: true },
        });
        return NextResponse.json(updated);
      }
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al actualizar tipo de equipo: ' + error.message }, { status: 500 });
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

    const equipmentCount = await prisma.equipment.count({
      where: { typeId: id },
    });

    if (equipmentCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar el tipo de equipo porque existen equipos vinculados' },
        { status: 400 }
      );
    }

    await prisma.equipmentType.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar tipo de equipo' }, { status: 500 });
  }
}
