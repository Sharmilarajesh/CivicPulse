import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedRoutes   = ['/report', '/my-reports', '/officer', '/admin', '/notifications', '/admin/invite']
const adminRoutes       = ['/admin']        // admin + super_admin
const officerRoutes     = ['/officer']      // officer only
const citizenOnlyRoutes = ['/report', '/my-reports']  // citizen only

export function middleware(request: NextRequest) {
  const token   = request.cookies.get('token')?.value
  const userStr = request.cookies.get('user')?.value
  const path    = request.nextUrl.pathname

  // Not logged in → redirect to login
  if (protectedRoutes.some(r => path.startsWith(r)) && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (token && userStr) {
    try {
      const user = JSON.parse(decodeURIComponent(userStr))

      // Admin routes: only admin and super_admin
      if (adminRoutes.some(r => path.startsWith(r))) {
        if (user.role !== 'admin' && user.role !== 'super_admin') {
          return NextResponse.redirect(
            new URL(getRedirectForRole(user.role), request.url)
          )
        }
      }

      // Officer routes: only officer
      if (officerRoutes.some(r => path.startsWith(r))) {
        if (user.role !== 'officer') {
          return NextResponse.redirect(
            new URL(getRedirectForRole(user.role), request.url)
          )
        }
      }

      // Citizen only routes
      if (citizenOnlyRoutes.some(r => path.startsWith(r))) {
        if (user.role !== 'citizen') {
          return NextResponse.redirect(
            new URL(getRedirectForRole(user.role), request.url)
          )
        }
      }

    } catch {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

function getRedirectForRole(role: string): string {
  switch(role) {
    case 'super_admin': return '/admin'
    case 'admin':       return '/admin'
    case 'officer':     return '/officer'
    case 'citizen':     return '/my-reports'
    default:            return '/'
  }
}

export const config = {
  matcher: [
    '/report/:path*',
    '/my-reports/:path*',
    '/officer/:path*',
    '/admin/:path*',
    '/notifications/:path*',
  ]
}
