import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    role: string;
    sessionId: string;
  };
}

export interface AuthUser {
  id: string;
  role: string;
  sessionId: string;
}

export function getTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

export async function authenticateRequest(req: AuthenticatedRequest): Promise<{ user: AuthUser } | NextResponse> {
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

// ---------------------------------------------------------------------------
// withRole() wrapper
// ---------------------------------------------------------------------------

type RouteParams = { params: Promise<Record<string, string>> };

type HandlerWithParams = (
  req: NextRequest,
  ctx: RouteParams,
) => Promise<Response> | Response;

type HandlerNoParams = (
  req: NextRequest,
) => Promise<Response> | Response;

type ApiHandler = HandlerWithParams | HandlerNoParams;

function authenticateAndAuthorize(
  req: NextRequest,
  allowedRoles: string[],
): Promise<{ user: AuthUser } | NextResponse> {
  const authReq = req as AuthenticatedRequest;
  return authenticateRequest(authReq).then((result) => {
    if (result instanceof NextResponse) return result;
    (authReq as AuthenticatedRequest).user = result.user;
    if (allowedRoles.length > 0 && !allowedRoles.includes(result.user.role)) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }
    return result;
  });
}

export function withRole(roles: string | string[], handler: HandlerWithParams): HandlerWithParams;
export function withRole(roles: string | string[], handler: HandlerNoParams): HandlerNoParams;
export function withRole(roles: string | string[], handler: ApiHandler): ApiHandler {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  if (handler.length > 1) {
    const typedHandler = handler as HandlerWithParams;
    return async (req: NextRequest, ctx: RouteParams): Promise<Response> => {
      const result = await authenticateAndAuthorize(req, allowedRoles);
      if (result instanceof NextResponse) return result;
      return typedHandler(req, ctx);
    };
  }

  const typedHandler = handler as HandlerNoParams;
  return async (req: NextRequest): Promise<Response> => {
    const result = await authenticateAndAuthorize(req, allowedRoles);
    if (result instanceof NextResponse) return result;
    return typedHandler(req);
  };
}
