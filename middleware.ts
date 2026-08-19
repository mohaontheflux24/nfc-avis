import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "__Host-nfc_avis_session";

export function middleware(req: NextRequest) {
  if (!req.cookies.get(COOKIE_NAME)?.value) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
