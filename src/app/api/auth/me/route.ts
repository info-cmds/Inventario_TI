import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, getDetailedSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const detailedUser = await getDetailedSessionUser(sessionUser.id);
    if (!detailedUser) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: detailedUser,
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
