import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { UserSessionPayload } from '@/types';
import { prisma } from './prisma';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-key-antigravity-2026-inventory-app'
);
const COOKIE_NAME = 'tech_inv_token';

export async function createToken(payload: UserSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET_KEY);
}

export async function verifyToken(token: string): Promise<UserSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as UserSessionPayload;
  } catch (error) {
    return null;
  }
}

export async function getSessionUser(req?: NextRequest): Promise<UserSessionPayload | null> {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get(COOKIE_NAME)?.value;
  } else {
    const cookieStore = await cookies();
    token = cookieStore.get(COOKIE_NAME)?.value;
  }

  if (!token) return null;
  return await verifyToken(token);
}

export async function getDetailedSessionUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as any,
    must_change_password: user.must_change_password,
    branchPermissions: user.userBranchPermissions.map((p) => ({
      branchId: p.branchId,
      sectorId: p.branch.sectorId,
      sectorName: p.branch.sector?.name || '',
      departmentId: p.departmentId,
      branchName: p.branch.name,
      departmentName: p.department?.name || 'Todas',
    })),
  };
}

export function filterByBranchPermissions(
  user: UserSessionPayload,
  queryBranchId?: string,
  querySectorId?: string
) {
  let baseBranchFilter: any = {};

  if (queryBranchId) {
    baseBranchFilter = { branchId: queryBranchId };
  } else if (querySectorId) {
    baseBranchFilter = { branch: { sectorId: querySectorId } };
  }

  if (user.role === 'SUPERADMIN') {
    return baseBranchFilter;
  }

  const allowedBranchIds = user.branchPermissions.map((p) => p.branchId);

  if (queryBranchId) {
    if (allowedBranchIds.includes(queryBranchId)) {
      return { branchId: queryBranchId };
    } else {
      return { branchId: 'NONE_ALLOWED' };
    }
  }

  if (querySectorId) {
    return {
      branchId: { in: allowedBranchIds },
      branch: { sectorId: querySectorId },
    };
  }

  return {
    branchId: { in: allowedBranchIds },
  };
}
