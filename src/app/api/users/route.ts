import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Acceso denegado (requiere SUPERADMIN)' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      include: {
        userBranchPermissions: {
          include: {
            branch: {
              include: { sector: true },
            },
            department: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedUsers = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      status: u.status || 'ACTIVO',
      must_change_password: u.must_change_password,
      createdAt: u.createdAt,
      permissions: u.userBranchPermissions.map((p) => ({
        id: p.id,
        branchId: p.branchId,
        branchName: p.branch.name,
        sectorName: p.branch.sector?.name || '',
        departmentId: p.departmentId,
        departmentName: p.department?.name || 'Todas las áreas',
      })),
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Acceso denegado (requiere SUPERADMIN)' }, { status: 403 });
    }

    const { email, name, role, password, status, must_change_password, branchPermissions } = await req.json();

    if (!email || !name || !role) {
      return NextResponse.json({ error: 'Email, nombre y rol son obligatorios' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'El correo electrónico ya está registrado' }, { status: 400 });
    }

    const initialPassword = password || 'admin123';
    const hashedPassword = await bcrypt.hash(initialPassword, 10);

    const newUser = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        name,
        role,
        status: status ? status.toUpperCase() : 'ACTIVO',
        password: hashedPassword,
        must_change_password: must_change_password !== undefined ? Boolean(must_change_password) : true,
      },
    });

    // Create branch permissions if provided
    if (branchPermissions && Array.isArray(branchPermissions)) {
      for (const perm of branchPermissions) {
        if (perm.branchId) {
          await prisma.userBranchPermission.create({
            data: {
              userId: newUser.id,
              branchId: perm.branchId,
              departmentId: perm.departmentId || null,
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Error al crear usuario: ' + error.message }, { status: 500 });
  }
}
