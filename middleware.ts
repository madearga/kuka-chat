import { authMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default authMiddleware({
  publicRoutes: ["/landing"],
  afterAuth(auth, req) {
    // If user is not logged in and trying to access a page other than /landing, redirect to /landing
    if (!auth.userId && req.nextUrl.pathname !== "/landing") {
      return NextResponse.redirect(new URL("/landing", req.url));
    }
    
    // If user is logged in and trying to access /landing, redirect to the main page
    if (auth.userId && req.nextUrl.pathname === "/landing") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    
    // For other cases, continue as usual
    return NextResponse.next();
  },
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};