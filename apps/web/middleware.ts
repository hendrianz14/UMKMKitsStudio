import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, verifySessionToken } from "lib/session";

function isProtectedPath(pathname: string) {
  return pathname.startsWith("/dashboard");
}

function isAuthPath(pathname: string) {
  return pathname.startsWith("/login") || pathname.startsWith("/otp");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value ?? "";
  const session = token ? await verifySessionToken(token) : null;

  if (isProtectedPath(pathname) && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    if (pathname !== "/dashboard") {
      url.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(url);
  }

  if (session && isAuthPath(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/otp"],
};
