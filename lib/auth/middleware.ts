import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    role: string;
    sessionId: string;
  };
}

export function getTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

export async function authenticateRequest(req: AuthenticatedRequest): Promise<{ user: { id: string; role: string; sessionId: string } } | NextResponse> {
  const token = getTokenFromRequest(req);
  if (!token) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' } },
      { status: 401 }
    );
  }

  try {
    const payload = await verifyAccessToken(token);
    return {
      user: {
        id: payload.sub,
        role: payload.role,
        sessionId: payload.sessionId,
      },
    };
  } catch {
    return NextResponse.json(
      { error: { code: 'TOKEN_EXPIRED', message: 'Access token expired or invalid' } },
      { status: 401 }
    );
  }
}

export function requireRole(...roles: string[]) {
  return async (req: AuthenticatedRequest): Promise<NextResponse | undefined> => {
    const result = await authenticateRequest(req);
    if (result instanceof NextResponse) return result;
    req.user = result.user;
    if (roles.length > 0 && !roles.includes(result.user.role)) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }
    return undefined;
  };
}
