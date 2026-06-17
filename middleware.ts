import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      "[Middleware] Supabase environment variables not configured. Skipping auth checks."
    )
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
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
  })

  // Refresh session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // ─────────────────────────────────────────────
  // Bypass: auth-related public routes
  // ─────────────────────────────────────────────
  const isForgotPasswordRoute = pathname === "/forgot-password"
  const isResetPasswordRoute = pathname === "/reset-password"
  const isAuthCallbackRoute =
    pathname === "/callback" ||
    pathname.startsWith("/auth/callback")

  if (isForgotPasswordRoute || isResetPasswordRoute || isAuthCallbackRoute) {
    return supabaseResponse
  }

  // Route type flags
  const isAdminRoute = pathname.startsWith("/admin")
  const isAdminLoginRoute = pathname === "/admin/login"
  const isUserLoginRoute = pathname === "/login"
  const isUserProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/identities") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/profile")

  // ─────────────────────────────────────────────
  // Helper: check admin via custom `users` table
  // role must be 'admin' or 'super_admin'
  // ─────────────────────────────────────────────
  const checkIsAdmin = async (userId: string): Promise<boolean> => {
    const { data } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", userId)
      .in("role", ["admin", "super_admin"])
      .single()
    return !!data
  }

  // ─────────────────────────────────────────────
  // CASE 1: Admin routes (except /admin/login)
  // ─────────────────────────────────────────────
  if (isAdminRoute && !isAdminLoginRoute) {
    if (!user) {
      const loginUrl = new URL("/admin/login", request.url)
      return NextResponse.redirect(loginUrl)
    }

    const isAdmin = await checkIsAdmin(user.id)
    if (!isAdmin) {
      const dashboardUrl = new URL("/dashboard", request.url)
      return NextResponse.redirect(dashboardUrl)
    }
  }

  // ─────────────────────────────────────────────
  // CASE 2: Admin login page
  // ─────────────────────────────────────────────
  if (isAdminLoginRoute) {
    if (user) {
      const isAdmin = await checkIsAdmin(user.id)
      if (isAdmin) {
        const dashboardUrl = new URL("/admin/dashboard", request.url)
        return NextResponse.redirect(dashboardUrl)
      } else {
        const dashboardUrl = new URL("/dashboard", request.url)
        return NextResponse.redirect(dashboardUrl)
      }
    }
  }

  // ─────────────────────────────────────────────
  // CASE 3: User login page
  // ─────────────────────────────────────────────
  if (isUserLoginRoute) {
    if (user) {
      const isAdmin = await checkIsAdmin(user.id)
      if (isAdmin) {
        const dashboardUrl = new URL("/admin/dashboard", request.url)
        return NextResponse.redirect(dashboardUrl)
      } else {
        const dashboardUrl = new URL("/dashboard", request.url)
        return NextResponse.redirect(dashboardUrl)
      }
    }
  }

  // ─────────────────────────────────────────────
  // CASE 4: User protected routes
  // ─────────────────────────────────────────────
  if (isUserProtectedRoute) {
    if (!user) {
      const loginUrl = new URL("/login", request.url)
      return NextResponse.redirect(loginUrl)
    }

    const isAdmin = await checkIsAdmin(user.id)
    if (isAdmin) {
      const dashboardUrl = new URL("/admin/dashboard", request.url)
      return NextResponse.redirect(dashboardUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}