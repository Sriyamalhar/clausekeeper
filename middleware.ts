import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

// Only run auth checks on routes that actually require a session.
// Marketing pages, API auth routes, and static assets are excluded so the
// landing page and login flow itself are never blocked.
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/contracts/:path*",
    "/clients/:path*",
    "/settings/:path*",
  ],
};
