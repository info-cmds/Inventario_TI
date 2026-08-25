import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Acceso denegado (requiere SUPERADMIN)' }, { status: 403 });
    }

    const { id } = await params;
    const { email, name, role, status, must_change_password, resetPassword, branchPermissions } = await req.json();

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const PROTECTED_EMAILS = ['ppizarro@cmds.cl', 'cgonzalezo@cmds.cl'];
    const isProtected = PROTECTED_EMAILS.includes(user.email.toLowerCase());

    // Protection rule: Protected accounts cannot be deactivated!
    if (isProtected && status && status.toUpperCase() === 'INACTIVO') {
      return NextResponse.json(
        { error: 'Las cuentas de superadministrador principal (ppizarro@cmds.cl y cgonzalezo@cmds.cl) están protegidas y no pueden ser desactivadas.' },
        { status: 403 }
      );
    }

    // Email duplication check
    if (email && email.trim().toLowerCase() !== user.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      });
      if (emailExists) {
        return NextResponse.json({ error: 'El correo electrónico ya pertenece a otro usuario' }, { status: 400 });
      }
    }

    const updateData: any = {
      email: email ? email.trim().toLowerCase() : user.email,
      name: name || user.name,
      role: role || user.role,
      status: isProtected ? 'ACTIVO' : (status ? status.toUpperCase() : user.status),
    };

    if (must_change_password !== undefined) {
      updateData.must_change_password = Boolean(must_change_password);
    }

    if (resetPassword) {
      updateData.password = await bcrypt.hash('admin123', 10);
      updateData.must_change_password = true;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Update branch permissions
    if (branchPermissions && Array.isArray(branchPermissions)) {
      await prisma.userBranchPermission.deleteMany({ where: { userId: id } });
      for (const perm of branchPermissions) {
        if (perm.branchId) {
          await prisma.userBranchPermission.create({
            data: {
              userId: id,
              branchId: perm.branchId,
              departmentId: perm.departmentId || null,
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Error al actualizar usuario: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Acceso denegado (requiere SUPERADMIN)' }, { status: 403 });
    }

    const { id } = await params;

    const userToDelete = await prisma.user.findUnique({ where: { id } });
    if (!userToDelete) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const PROTECTED_EMAILS = ['ppizarro@cmds.cl', 'cgonzalezo@cmds.cl'];
    if (PROTECTED_EMAILS.includes(userToDelete.email.toLowerCase())) {
      return NextResponse.json(
        { error: 'Las cuentas de superadministrador principal (ppizarro@cmds.cl y cgonzalezo@cmds.cl) están protegidas y no pueden ser eliminadas.' },
        { status: 403 }
      );
    }

    if (id === sessionUser.id) {
      return NextResponse.json({ error: 'No puede eliminar su propia cuenta activa' }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Usuario eliminado' });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
  }
}
