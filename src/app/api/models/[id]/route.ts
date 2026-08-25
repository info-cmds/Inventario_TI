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
    const { name, brandId, typeId, ram, processor, storage, specs, targetSectorIds } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'El nombre del modelo es obligatorio' }, { status: 400 });
    }

    const model = await prisma.equipmentModel.findUnique({ where: { id } });
    if (!model) {
      return NextResponse.json({ error: 'Modelo no encontrado' }, { status: 404 });
    }

    const targetBrandId = brandId || model.brandId;
    const cleanName = name.trim().toUpperCase();

    if (sessionUser.role === 'SUPERADMIN') {
      let newSectorId = model.sectorId;
      if (Array.isArray(targetSectorIds)) {
        if (targetSectorIds.includes('ALL') || targetSectorIds.length === 0) {
          newSectorId = null;
        } else {
          newSectorId = targetSectorIds[0];
        }
      }

      const updated = await prisma.equipmentModel.update({
        where: { id },
        data: {
          name: cleanName,
          sectorId: newSectorId,
          brandId: targetBrandId,
          typeId: typeId !== undefined ? (typeId || null) : model.typeId,
          ram: ram !== undefined ? (ram?.trim() || null) : model.ram,
          processor: processor !== undefined ? (processor?.trim() || null) : model.processor,
          storage: storage !== undefined ? (storage?.trim() || null) : model.storage,
          specs: specs !== undefined ? (typeof specs === 'string' ? specs : JSON.stringify(specs)) : model.specs,
        },
        include: { sector: true, brand: true, type: true },
      });

      return NextResponse.json(updated);
    } else {
      // Sector Admin: create sector-scoped copy if original is global
      const userSectorId = (sessionUser.branchPermissions[0] as any)?.sectorId || null;

      if (model.sectorId === null) {
        const sectorCopy = await prisma.equipmentModel.create({
          data: {
            name: cleanName,
            sectorId: userSectorId,
            brandId: targetBrandId,
            typeId: typeId !== undefined ? (typeId || null) : model.typeId,
            ram: ram !== undefined ? (ram?.trim() || null) : model.ram,
            processor: processor !== undefined ? (processor?.trim() || null) : model.processor,
            storage: storage !== undefined ? (storage?.trim() || null) : model.storage,
            specs: specs !== undefined ? (typeof specs === 'string' ? specs : JSON.stringify(specs)) : model.specs,
          },
          include: { sector: true, brand: true, type: true },
        });
        return NextResponse.json(sectorCopy);
      } else {
        const updated = await prisma.equipmentModel.update({
          where: { id },
          data: {
            name: cleanName,
            brandId: targetBrandId,
            typeId: typeId !== undefined ? (typeId || null) : model.typeId,
            ram: ram !== undefined ? (ram?.trim() || null) : model.ram,
            processor: processor !== undefined ? (processor?.trim() || null) : model.processor,
            storage: storage !== undefined ? (storage?.trim() || null) : model.storage,
            specs: specs !== undefined ? (typeof specs === 'string' ? specs : JSON.stringify(specs)) : model.specs,
          },
          include: { sector: true, brand: true, type: true },
        });
        return NextResponse.json(updated);
      }
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al actualizar modelo: ' + error.message }, { status: 500 });
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
      where: { modelId: id },
    });

    if (equipmentCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar el modelo porque tiene equipos vinculados' },
        { status: 400 }
      );
    }

    await prisma.equipmentModel.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar modelo' }, { status: 500 });
  }
}
