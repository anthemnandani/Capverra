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

  // Admin route protection (except login page)
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isAdminLoginRoute = request.nextUrl.pathname === "/admin/login";

  if (isAdminRoute && !isAdminLoginRoute) {
    // Check if user is logged in
    if (!user) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Check if user is an admin (this is a basic check, full verification happens in layout)
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("id, is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!adminUser) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect logged-in admins away from admin login page
  if (isAdminLoginRoute && user) {
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (adminUser) {
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
