import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createToken, getDetailedSessionUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Debe ingresar email y contraseña' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: {
        userBranchPermissions: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas (Usuario no encontrado)' },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Credenciales inválidas (Contraseña incorrecta)' },
        { status: 401 }
      );
    }

    const sessionPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      must_change_password: user.must_change_password,
      branchPermissions: user.userBranchPermissions.map((p) => ({
        branchId: p.branchId,
        departmentId: p.departmentId,
      })),
    };

    const token = await createToken(sessionPayload);
    const detailedUser = await getDetailedSessionUser(user.id);

    const response = NextResponse.json({
      success: true,
      user: detailedUser,
      must_change_password: user.must_change_password,
    });

    response.cookies.set('tech_inv_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: `Error de conexión a la base de datos: ${error?.message || 'Error interno'}` },
      { status: 500 }
    );
  }
}
