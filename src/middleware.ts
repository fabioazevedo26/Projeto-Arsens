import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// A raiz (/) é o painel público do cidadão: não passa por aqui.
// Só o painel técnico (/dashboard e sub-rotas, como /dashboard/export) exige login.
export function middleware(request: NextRequest) {
  const session = request.cookies.get('session');
  const isAuthenticated = session?.value === 'authenticated';

  // Painel técnico sem sessão -> tela de login
  if (request.nextUrl.pathname.startsWith('/dashboard') && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Se o usuário logado tentar acessar /login, manda para o dashboard
  if (request.nextUrl.pathname === '/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
