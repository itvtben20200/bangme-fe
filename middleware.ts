import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const PUBLIC_PATHS = [
  '/', '/login', '/register',
  '/forgot-password', '/reset-password', '/verify-email', '/verify-email-sent',
  '/for-creators',
  '/admin/login', '/admin/register',
  '/terms', '/privacy', '/community-guidelines', '/faqs', '/help', '/contact', '/report-issue',
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  const token = req.cookies.get('bangme_access')?.value
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET)
    const { payload } = await jwtVerify(token, secret)

    // Guard admin routes — non-admins sent to /home
    if (pathname.startsWith('/admin') && payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/home', req.url))
    }

    // Guard /login and /register — admins sent to admin dashboard
    if ((pathname === '/login' || pathname === '/register') && payload.role === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url))
    }

    // Guard creator-center
    if (pathname.startsWith('/creator-center') && payload.role === 'user') {
      return NextResponse.redirect(new URL('/become-creator', req.url))
    }

    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/).*)'],
}
