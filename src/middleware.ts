import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-do-not-use-in-production"
);

const protectedPaths = ["/dashboard", "/api/files"];
const authPaths = ["/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("markdown-cms-token")?.value;

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAuthPage = authPaths.some((p) => pathname.startsWith(p));

  if (isProtected) {
    if (!token) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.next();
    } catch {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("markdown-cms-token");
      return response;
    }
  }

  if (isAuthPage && token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } catch {
      // Invalid token, let them access login page
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/files/:path*", "/login"],
};
