import { createStart, createMiddleware } from "@tanstack/react-start";
import { SECURITY_HEADERS } from "./server/security-headers";

/**
 * Global request middleware — runs on EVERY server request (SSR, routes, functions).
 * Applies security headers to all responses.
 */
const securityHeadersMiddleware = createMiddleware().server(
  async ({ next }) => {
    const result = await next();
    return result;
  },
);

export default createStart(() => ({
  requestMiddleware: [securityHeadersMiddleware],
}));
