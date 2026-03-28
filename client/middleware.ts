import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function decodeJwt(token: string): any | null {
  try {
    const part = token.split('.')[1]
    if (!part) return null
    const normalized = part.replace(/-/g, '+').replace(/_/g, '/')
    const json = Buffer.from(normalized, 'base64').toString('utf8')
    return JSON.parse(json)
  } catch {
    return null
  }
}

function loginRouteForRole(role?: string | null) {
  if (role === 'platform_admin' || role === 'platform_staff') return '/login/platform-admin'
  if (role === 'organization_admin' || role === 'org_admin') return '/login/org-admin'
  return '/login'
}

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  // Public org admin setup link (token-based onboarding)
  if (path === '/org-admin/setup' || path.startsWith('/org-admin/setup/')) {
    return NextResponse.next()
  }

  // Public platform staff invite acceptance link
  if (path === '/platform-staff/accept-invite' || path.startsWith('/platform-staff/accept-invite/')) {
    return NextResponse.next()
  }

  const protectedPrefixes = ['/platform-admin', '/org-admin', '/student', '/instructor', '/platform']
  const isProtected = protectedPrefixes.some((p) => path === p || path.startsWith(p + '/'))
  if (!isProtected) return NextResponse.next()

  const token = req.cookies.get('instatute_token')?.value
  if (!token) {
    const url = req.nextUrl.clone()
    url.pathname = path.startsWith('/org-admin') ? '/login/org-admin' : '/login'
    url.searchParams.set('returnUrl', path)
    return NextResponse.redirect(url)
  }

  const decoded = decodeJwt(token)
  const role = decoded?.role as string | undefined

  // Strict role-based sections
  if (path.startsWith('/platform-admin') || path.startsWith('/platform')) {
    if (role !== 'platform_admin' && role !== 'platform_staff') {
      const url = req.nextUrl.clone()
      url.pathname = loginRouteForRole(role)
      return NextResponse.redirect(url)
    }
  }

  if (path.startsWith('/org-admin')) {
    if (role !== 'organization_admin' && role !== 'org_admin') {
      const url = req.nextUrl.clone()
      url.pathname = '/login/org-admin'
      url.searchParams.set('returnUrl', path)
      return NextResponse.redirect(url)
    }
  }

  if (path.startsWith('/student')) {
    if (role !== 'student') {
      const url = req.nextUrl.clone()
      url.pathname = loginRouteForRole(role)
      return NextResponse.redirect(url)
    }
  }

  if (path.startsWith('/instructor')) {
    if (role !== 'instructor') {
      const url = req.nextUrl.clone()
      url.pathname = loginRouteForRole(role)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
