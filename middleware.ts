import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Treat files with extensions as public (assets)
const PUBLIC_FILE = /\.[^/]+$/;

export function middleware(req: NextRequest) {
  const { nextUrl, cookies } = req;
  const { pathname, search } = nextUrl;

  // Allow internal next/api/static asset requests to pass through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    PUBLIC_FILE.test(pathname) ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.json"
  ) {
    return NextResponse.next();
  }

  // Public auth pages that should not be redirected
  const PUBLIC_ROUTES = [
    "/login",
    "/signin",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/unauthorized",
    "/business/join",
    // Note: /verify and /kyb are NOT fully public - they require specific token types
    // They're handled separately below
  ];

  if (PUBLIC_ROUTES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Read cookies set by the client store (must be non-HttpOnly to be readable here)
  const token = cookies.get("token")?.value;
  const tokenType = cookies.get("tokenType")?.value;

  // Token types: "authenticated", "otp", "kyb", "password_reset"

  // Only log in development
  if (process.env.NODE_ENV === "development") {
    console.log(
      `[Middleware] Path: ${pathname}, Token: ${!!token}, TokenType: ${tokenType}`,
    );
  }

  // Handle different token types and redirect appropriately
  if (!token) {
    // No token at all - redirect to login
    if (process.env.NODE_ENV === "development") {
      console.log(`[Middleware] No token found, redirecting to login`);
    }
    const url = nextUrl.clone();
    url.pathname = "/login";
    if (pathname !== "/") {
      url.search = `callbackUrl=${encodeURIComponent(pathname + (search ?? ""))}`;
    } else {
      url.search = "";
    }
    return NextResponse.redirect(url);
  }

  // For intermediate tokens (otp, kyb, password_reset, onboarding_invite),
  // add session recovery query param. This tells the client to validate the
  // session and handle potential expiration.
  const isIntermediateToken = [
    "otp",
    "kyb",
    "password_reset",
    "onboarding_invite",
  ].includes(tokenType || "");
  const needsSessionValidation =
    isIntermediateToken && !pathname.includes("?validate=true");

  // Handle different token types - redirect to appropriate flow step
  if (tokenType === "otp") {
    // User needs OTP verification - only allow /verify page
    if (!pathname.startsWith("/verify")) {
      if (process.env.NODE_ENV === "development") {
        console.log(`[Middleware] VERIFY_OTP token, redirecting to /verify`);
      }
      // Add session validation for returning users
      const verifyUrl = new URL("/verify", req.url);
      if (needsSessionValidation) {
        verifyUrl.searchParams.set("validate", "true");
      }
      return NextResponse.redirect(verifyUrl);
    }
  } else if (["kyb", "onboarding_invite"].includes(tokenType || "")) {
    // User needs KYB completion or is in onboarding invite flow - only allow /kyb pages
    // CRITICAL FIX: Don't redirect if already on /kyb to prevent redirect loops
    if (!pathname.startsWith("/kyb") && !pathname.startsWith("/delegate")) {
      if (process.env.NODE_ENV === "development") {
        console.log(
          `[Middleware] KYB/Onboarding token (${tokenType}), redirecting to /kyb`,
        );
      }
      // Add session validation for returning users
      const kybUrl = new URL("/kyb", req.url);
      if (needsSessionValidation) {
        kybUrl.searchParams.set("validate", "true");
      }
      return NextResponse.redirect(kybUrl);
    }
    // Allow the request to proceed to /kyb pages
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[Middleware] Allowing ${tokenType} token access to ${pathname}`,
      );
    }
  } else if (tokenType === "password_reset") {
    // User in password reset flow - only allow reset-password page
    if (!pathname.startsWith("/reset-password")) {
      if (process.env.NODE_ENV === "development") {
        console.log(
          `[Middleware] PASSWORD_RESET token, redirecting to /reset-password`,
        );
      }
      // Password reset tokens are typically short-lived, redirect to login if stale
      return NextResponse.redirect(new URL("/login", req.url));
    }
  } else if (tokenType === "authenticated") {
    // Fully authenticated user - allow access to all pages (dashboard, etc.)
    // This is the normal case, let them proceed
  } else {
    // Unknown or invalid token type - redirect to login
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[Middleware] Unknown token type: ${tokenType}, redirecting to login`,
      );
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Only log in development
  if (process.env.NODE_ENV === "development") {
    console.log(`[Middleware] Allowing request to proceed to: ${pathname}`);
  }
  // Allow request to proceed
  return NextResponse.next();
}

export const config = {
  // Apply middleware to all routes except static, api, and files with extensions
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)",
  ],
};
