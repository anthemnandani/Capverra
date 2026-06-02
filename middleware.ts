import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Check if Supabase environment variables are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase is not configured, skip middleware checks
  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      "[Middleware] Supabase environment variables not configured. Skipping auth checks."
    );
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Session refresh
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  
  // Route type checks
  const isAdminRoute = pathname.startsWith("/admin");
  const isAdminLoginRoute = pathname === "/admin/login";
  const isUserLoginRoute = pathname === "/login";
  const isUserProtectedRoute = pathname.startsWith("/dashboard") || 
                               pathname.startsWith("/assets") || 
                               pathname.startsWith("/identities") ||
                               pathname.startsWith("/reports") ||
                               pathname.startsWith("/settings") ||
                               pathname.startsWith("/profile");

  // Helper function to check if user is admin
  const checkIsAdmin = async (userId: string) => {
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("id, is_active")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();
    return !!adminUser;
  };

  // CASE 1: Admin routes (except admin login)
  if (isAdminRoute && !isAdminLoginRoute) {
    if (!user) {
      // Not logged in - redirect to admin login
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Check if user is an admin
    const isAdmin = await checkIsAdmin(user.id);
    if (!isAdmin) {
      // Regular user trying to access admin - redirect to user dashboard
      const dashboardUrl = new URL("/dashboard", request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // CASE 2: Admin login page
  if (isAdminLoginRoute) {
    if (user) {
      const isAdmin = await checkIsAdmin(user.id);
      if (isAdmin) {
        // Admin already logged in - redirect to admin dashboard
        const dashboardUrl = new URL("/admin/dashboard", request.url);
        return NextResponse.redirect(dashboardUrl);
      } else {
        // Regular user on admin login page - redirect to user dashboard
        const dashboardUrl = new URL("/dashboard", request.url);
        return NextResponse.redirect(dashboardUrl);
      }
    }
  }

  // CASE 3: User login page
  if (isUserLoginRoute) {
    if (user) {
      const isAdmin = await checkIsAdmin(user.id);
      if (isAdmin) {
        // Admin on user login page - redirect to admin dashboard
        const dashboardUrl = new URL("/admin/dashboard", request.url);
        return NextResponse.redirect(dashboardUrl);
      } else {
        // Regular user already logged in - redirect to user dashboard
        const dashboardUrl = new URL("/dashboard", request.url);
        return NextResponse.redirect(dashboardUrl);
      }
    }
  }

  // CASE 4: User protected routes (dashboard, assets, etc.)
  if (isUserProtectedRoute) {
    if (!user) {
      // Not logged in - redirect to user login
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Check if user is an admin trying to access user dashboard
    const isAdmin = await checkIsAdmin(user.id);
    if (isAdmin) {
      // Admin trying to access user dashboard - redirect to admin dashboard
      const dashboardUrl = new URL("/admin/dashboard", request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
