import { type NextRequest, NextResponse } from "next/server"

const publicPaths = ["/", "/auth/login"]

export async function updateSession(request: NextRequest) {
  try {
    const isPublicPath = publicPaths.some((path) => request.nextUrl.pathname.startsWith(path))
    const isApiPath = request.nextUrl.pathname.startsWith("/api")
    const hasSupabaseAuthCookie = request.cookies
      .getAll()
      .some((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"))

    if (!hasSupabaseAuthCookie && !isPublicPath && !isApiPath) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/auth/login"
      return NextResponse.redirect(redirectUrl)
    }

    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  } catch (error) {
    console.error("Middleware session update failed:", error)
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }
}
