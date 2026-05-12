import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getSession() reads from the cookie — no network round-trip (~0ms vs ~400ms for getUser)
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  const { pathname } = request.nextUrl

  // Protect /admin and /superadmin routes
  if ((pathname.startsWith('/admin') || pathname.startsWith('/superadmin')) && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Protect superadmin — check role
  if (pathname.startsWith('/superadmin') && user) {
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminUser?.role !== 'superadmin') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*', '/superadmin/:path*'],
}
