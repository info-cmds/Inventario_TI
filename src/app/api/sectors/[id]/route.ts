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
    const { name, description, status } = await req.json();

    const updated = await prisma.sector.update({
      where: { id },
      data: {
        name: name ? name.trim() : undefined,
        description: description !== undefined ? description : undefined,
        status: status || undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar sector' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Solo SUPERADMIN puede eliminar sectores' }, { status: 403 });
    }

    const { id } = await params;

    const branchCount = await prisma.branch.count({ where: { sectorId: id } });
    if (branchCount > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar el sector porque tiene ${branchCount} sucursales asociadas` },
        { status: 400 }
      );
    }

    await prisma.sector.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Sector eliminado' });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar sector' }, { status: 500 });
  }
}
