import { createStart, createMiddleware } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";

/**
 * Global security middleware — sets security headers on every server response.
 * These supplement the meta http-equiv tags in __root.tsx for full coverage
 * on API routes, server functions, and non-HTML responses.
 */
const securityMiddleware = createMiddleware().server(
  async ({ next }) => {
    // Set headers before handler runs — they'll be included in the response
    setResponseHeader("X-Content-Type-Options", "nosniff");
    setResponseHeader("X-Frame-Options", "SAMEORIGIN");
    setResponseHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    setResponseHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    setResponseHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), magnetometer=(), gyroscope=(), accelerometer=(), interest-cohort=()");
    setResponseHeader("Cross-Origin-Opener-Policy", "same-origin");
    setResponseHeader("X-DNS-Prefetch-Control", "off");

    return next();
  },
);

export default createStart(() => ({
  requestMiddleware: [securityMiddleware],
}));
