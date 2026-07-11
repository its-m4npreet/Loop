import { NextRequest, NextResponse } from 'next/server'

const protectedRoutes = [
  '/dashboard',
  '/analytics',
  '/ask-loop',
  '/feedback-inbox',
  '/reports',
  '/settings',
  '/team',
  '/themes',
  '/profile',
  '/workspace',
]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )

  if (!isProtected) return NextResponse.next()

  const token =
    request.cookies.get('authjs.session-token')?.value ||
    request.cookies.get('__Secure-authjs.session-token')?.value

  if (!token) {
    const url = request.nextUrl.clone()
    url.pathname = '/api/auth'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/analytics/:path*',
    '/ask-loop/:path*',
    '/feedback-inbox/:path*',
    '/reports/:path*',
    '/settings/:path*',
    '/team/:path*',
    '/themes/:path*',
    '/profile/:path*',
    '/workspace/:path*',
  ],
}
