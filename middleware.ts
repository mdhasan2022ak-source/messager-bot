import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "bot_admin_session";
const SESSION_VALUE  = "authenticated";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes — always allow
  const publicPaths = ["/login", "/api/auth/login", "/api/webhook"];
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Protect /dashboard and /api/* (except webhook)
  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/api/");

  if (isProtected) {
    const session = req.cookies.get(SESSION_COOKIE);
    if (session?.value !== SESSION_VALUE) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*", "/login"],
};
