import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ============================================
// Rate Limiting Configuration
// ============================================
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // API routes - stricter limits
  "/api/tokens": { windowMs: 60 * 1000, maxRequests: 30 }, // 30 requests/minute
  "/api/tokens/create": { windowMs: 60 * 1000, maxRequests: 5 }, // 5 creates/minute
  "/api/trade": { windowMs: 60 * 1000, maxRequests: 10 }, // 10 trades/minute
  "/api/webhooks": { windowMs: 60 * 1000, maxRequests: 100 }, // 100 webhooks/minute
  // Default for other API routes
  default: { windowMs: 60 * 1000, maxRequests: 60 }, // 60 requests/minute
};

// Simple in-memory rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getRateLimitConfig(pathname: string): RateLimitConfig {
  for (const [path, config] of Object.entries(RATE_LIMITS)) {
    if (pathname.startsWith(path)) {
      return config;
    }
  }
  return RATE_LIMITS.default;
}

function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = `${identifier}:${Math.floor(now / config.windowMs)}`;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // New window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  if (record.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  record.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

// ============================================
// Protected Routes Configuration
// ============================================
const PROTECTED_ROUTES = [
  "/portfolio",
  "/settings",
  "/admin",
];

const AUTH_ROUTES = [
  "/login",
  "/register",
];

// ============================================
// Main Middleware Function
// ============================================
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // ==========================================
  // 1. Security Headers
  // ==========================================
  const securityHeaders = {
    // Prevent XSS attacks
    "X-Content-Type-Options": "nosniff",
    // Prevent clickjacking
    "X-Frame-Options": "DENY",
    // Enable XSS protection
    "X-XSS-Protection": "1; mode=block",
    // Referrer policy
    "Referrer-Policy": "strict-origin-when-cross-origin",
    // Content Security Policy (customize as needed)
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self'",
      "connect-src 'self' https://*.solana.com https://*.helius.xyz https://*.jup.ag wss:",
      "frame-ancestors 'none'",
    ].join("; "),
  };

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // ==========================================
  // 2. CORS Headers for API Routes
  // ==========================================
  if (pathname.startsWith("/api/")) {
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: response.headers });
    }
  }

  // ==========================================
  // 3. Rate Limiting for API Routes
  // ==========================================
  if (pathname.startsWith("/api/")) {
    // Get client identifier (IP address or custom header)
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const rateLimitConfig = getRateLimitConfig(pathname);
    const rateLimitResult = checkRateLimit(clientIp, rateLimitConfig);

    // Add rate limit headers
    response.headers.set("X-RateLimit-Limit", String(rateLimitConfig.maxRequests));
    response.headers.set(
      "X-RateLimit-Remaining",
      String(rateLimitResult.remaining)
    );
    response.headers.set(
      "X-RateLimit-Reset",
      String(Math.ceil(rateLimitResult.resetTime / 1000))
    );

    if (!rateLimitResult.allowed) {
      return new NextResponse(
        JSON.stringify({
          error: "Too many requests",
          message: "Rate limit exceeded. Please try again later.",
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            ...Object.fromEntries(response.headers.entries()),
            "Content-Type": "application/json",
            "Retry-After": String(
              Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
            ),
          },
        }
      );
    }
  }

  // ==========================================
  // 4. Auth Check for Protected Routes
  // ==========================================
  // Note: In a real app, you'd check for a session/token here
  // For Solana wallet-based auth, we typically check client-side
  // This is a placeholder for server-side auth if needed
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // Check for auth token/session
    const authToken = request.cookies.get("auth-token")?.value;

    if (!authToken && process.env.REQUIRE_AUTH === "true") {
      // Redirect to login
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ==========================================
  // 5. Redirect Authenticated Users from Auth Pages
  // ==========================================
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isAuthRoute) {
    const authToken = request.cookies.get("auth-token")?.value;

    if (authToken) {
      // Already authenticated, redirect to home
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // ==========================================
  // 6. Admin Route Protection
  // ==========================================
  if (pathname.startsWith("/admin")) {
    const adminToken = request.cookies.get("admin-token")?.value;

    // In production, verify admin token against database
    if (!adminToken && process.env.NODE_ENV === "production") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  // ==========================================
  // 7. Logging (development only)
  // ==========================================
  if (process.env.NODE_ENV === "development") {
    console.log(`[Middleware] ${request.method} ${pathname}`);
  }

  return response;
}

// ============================================
// Matcher Configuration
// ============================================
export const config = {
  matcher: [
    // Match all API routes
    "/api/:path*",
    // Match protected routes
    "/portfolio/:path*",
    "/settings/:path*",
    "/admin/:path*",
    // Match auth routes
    "/login",
    "/register",
    // Exclude static files, images, etc.
    // Note: Next.js automatically excludes /_next/static and /favicon.ico
  ],
};
