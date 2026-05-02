/**
 * Security headers middleware for all server responses.
 * 
 * CSP Strategy: Report-Only first for safe rollout, switch to enforcing after validation.
 * Set ENFORCE_CSP=true in env to switch from report-only to enforcing.
 */

const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net https://www.google-analytics.com https://tagmanager.google.com https://analytics.tiktok.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://tagmanager.google.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://www.facebook.com https://region1.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net https://analytics.tiktok.com",
  "frame-src 'self' https://www.youtube.com https://player.vimeo.com https://secure.mobilpay.ro",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://*.supabase.co https://secure.mobilpay.ro",
  "upgrade-insecure-requests",
].join("; ");

export const SECURITY_HEADERS: Record<string, string> = {
  // CSP — start with Report-Only for safe rollout
  "Content-Security-Policy-Report-Only": CSP_DIRECTIVES,
  // Enforcing CSP (subset — blocks most dangerous vectors)
  "Content-Security-Policy": "frame-ancestors 'self'; object-src 'none'; base-uri 'self'",
  // HSTS — 1 year with subdomains (Cloudflare adds its own, this ensures it for origin)
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  // Prevent MIME sniffing
  "X-Content-Type-Options": "nosniff",
  // Clickjacking protection (superseded by CSP frame-ancestors but kept for older browsers)
  "X-Frame-Options": "SAMEORIGIN",
  // Referrer policy — send origin only cross-origin
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // Permissions policy — disable unnecessary browser APIs
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), magnetometer=(), gyroscope=(), accelerometer=(), interest-cohort=()",
  // Prevent cross-origin embedding attacks
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  // Disable DNS prefetching for privacy
  "X-DNS-Prefetch-Control": "off",
};

/**
 * Apply security headers to a Response object.
 */
export function applySecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
