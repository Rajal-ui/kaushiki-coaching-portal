import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, errors } from 'jose';

const ACCESS_SECRET = Buffer.from(
  process.env.JWT_ACCESS_SECRET || 'fallback-access-secret-32-chars-min!!'
);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;

  if (!token) {
    return redirectToLogin(request);
  }

  try {
    await jwtVerify(token, ACCESS_SECRET);
    return NextResponse.next();
  } catch (error) {
    if (error instanceof errors.JWTExpired) {
      return NextResponse.next();
    }
    return redirectToLogin(request);
  }
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname + request.nextUrl.search);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete('accessToken');
  return response;
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
