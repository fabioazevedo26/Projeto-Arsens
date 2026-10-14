import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session');

  // Se o usuário estiver tentando acessar /dashboard ou a raiz
  if (request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname === '/') {
    // Se não tiver sessão, redireciona para o login
    if (!session || session.value !== 'authenticated') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Se o usuário logado tentar acessar /login, manda para o dashboard
  if (request.nextUrl.pathname === '/login' && session && session.value === 'authenticated') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/login'],
};
