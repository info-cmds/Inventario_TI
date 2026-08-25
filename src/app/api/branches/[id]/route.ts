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
    const { name, code, sectorId, status } = await req.json();

    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) {
      return NextResponse.json({ error: 'Sucursal no encontrada' }, { status: 404 });
    }

    if (code && code.trim().toUpperCase() !== branch.code) {
      const existing = await prisma.branch.findUnique({
        where: { code: code.trim().toUpperCase() },
      });
      if (existing) {
        return NextResponse.json({ error: 'El código de sucursal ya está en uso' }, { status: 400 });
      }
    }

    const updated = await prisma.branch.update({
      where: { id },
      data: {
        name: name ? name.trim() : branch.name,
        code: code ? code.trim().toUpperCase() : branch.code,
        sectorId: sectorId || branch.sectorId,
        status: status || branch.status,
      },
      include: { sector: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar sucursal' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Solo SUPERADMIN puede eliminar sucursales' }, { status: 403 });
    }

    const { id } = await params;

    const empCount = await prisma.employee.count({ where: { branchId: id } });
    const eqCount = await prisma.equipment.count({ where: { branchId: id } });

    if (empCount > 0 || eqCount > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar la sucursal porque tiene ${empCount} funcionarios y ${eqCount} equipos asignados` },
        { status: 400 }
      );
    }

    await prisma.branch.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Sucursal eliminada' });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar sucursal' }, { status: 500 });
  }
}
