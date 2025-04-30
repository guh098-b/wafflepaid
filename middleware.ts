import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const { pathname } = request.nextUrl

  console.log("Middleware running for path:", pathname)

  // Skip middleware for static files
  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next()
  }

  // For admin routes
  if (pathname.startsWith("/dashboard/admin")) {
    const adminCookie = request.cookies.get("admin_session")
    console.log("Admin cookie:", adminCookie?.value)

    if (!adminCookie || adminCookie.value !== "true") {
      console.log("Admin access denied, redirecting to home")
      return NextResponse.redirect(new URL("/", request.url))
    }

    console.log("Admin access granted")
    return NextResponse.next()
  }

  // For regular dashboard routes
  if (pathname.startsWith("/static/")) {
    const keyCookie = request.cookies.get("key_session")
    console.log("Key cookie:", keyCookie?.value ? "exists" : "missing")

    if (!keyCookie || !keyCookie.value) {
      console.log("Dashboard access denied, redirecting to home")
      return NextResponse.redirect(new URL("/", request.url))
    }

    console.log("Dashboard access granted")
    return NextResponse.next()
  }

  // For all other routes
  return NextResponse.next()
}

// Match only dashboard routes
export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/static/"],
}
