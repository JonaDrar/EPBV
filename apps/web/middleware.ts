import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "ebv_session";

export function middleware(req: NextRequest) {
  const session = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/dashboard") && !session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (pathname === "/login" && session) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
