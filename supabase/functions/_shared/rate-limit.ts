// Shared persistent rate limiter backed by public.rate_limits + check_rate_limit() RPC.
// Use from any Edge Function. Returns { allowed, retryAfter } so callers can return 429 cleanly.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export interface RateLimitOptions {
  /** Logical bucket name, e.g. "netopia-payment" */
  endpoint: string;
  /** Identifier (usually client IP). Falls back to "anon" if missing. */
  identifier: string | null | undefined;
  /** Max requests inside the window */
  limit: number;
  /** Window length in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  resetAt: string | null;
  retryAfterSeconds: number;
}

let _client: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (_client) return _client;
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Supabase service env vars missing");
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}

export async function checkRateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  const id = (opts.identifier || "anon").slice(0, 100);
  const key = `${opts.endpoint}:${id}`;
  try {
    const supabase = getClient();
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_key: key,
      p_limit: opts.limit,
      p_window_seconds: opts.windowSeconds,
    });
    if (error) {
      console.error("[rate-limit] RPC error:", error.message);
      // Fail-open on infrastructure errors, but log so we notice.
      return { allowed: true, count: 0, resetAt: null, retryAfterSeconds: 0 };
    }
    const row = Array.isArray(data) ? data[0] : data;
    const allowed = !!row?.allowed;
    const resetAt = row?.reset_at ?? null;
    const retryAfterSeconds = resetAt
      ? Math.max(1, Math.ceil((new Date(resetAt).getTime() - Date.now()) / 1000))
      : opts.windowSeconds;
    return { allowed, count: row?.current_count ?? 0, resetAt, retryAfterSeconds };
  } catch (e) {
    console.error("[rate-limit] unexpected:", e);
    return { allowed: true, count: 0, resetAt: null, retryAfterSeconds: 0 };
  }
}

/** Extract best-effort client IP from a Request */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** Helper: build a 429 response */
export function tooManyRequests(result: RateLimitResult, corsHeaders: Record<string, string> = {}) {
  return new Response(
    JSON.stringify({
      error: "Too many requests. Please try again later.",
      retryAfter: result.retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfterSeconds),
      },
    },
  );
}
