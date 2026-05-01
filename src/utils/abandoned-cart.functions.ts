import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const COOKIE_NAME = "cart_sid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const CartItemSchema = z.object({
  id: z.string().min(1).max(128),
  name: z.string().min(1).max(255),
  slug: z.string().max(255).optional(),
  price: z.number().min(0).max(1_000_000),
  old_price: z.number().min(0).max(1_000_000).nullable().optional(),
  image_url: z.string().max(2048).optional(),
  image: z.string().max(2048).optional(),
  quantity: z.number().int().min(1).max(999),
}).passthrough();

const SaveCartSchema = z.object({
  items: z.array(CartItemSchema).max(100),
  subtotal: z.number().min(0).max(10_000_000),
  total: z.number().min(0).max(10_000_000),
  email: z.string().email().max(254).optional().nullable(),
  customer_name: z.string().max(255).optional().nullable(),
});

function generateSessionId(): string {
  // 32 random bytes hex => 64 chars
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const saveAbandonedCart = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SaveCartSchema.parse(input))
  .handler(async ({ data }) => {
    if (data.items.length === 0) {
      return { ok: true, skipped: true };
    }

    let sessionId = getCookie(COOKIE_NAME);
    if (!sessionId || sessionId.length < 32 || sessionId.length > 128) {
      sessionId = generateSessionId();
      setCookie(COOKIE_NAME, sessionId, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE,
        path: "/",
      });
    }

    const now = new Date().toISOString();
    const { error } = await supabaseAdmin.from("abandoned_carts").upsert(
      {
        session_id: sessionId,
        items: data.items as any,
        subtotal: data.subtotal,
        total: data.total,
        email: data.email ?? null,
        customer_name: data.customer_name ?? null,
        updated_at: now,
        last_activity_at: now,
      },
      { onConflict: "session_id" }
    );

    if (error) {
      // Error details kept server-side only — not exposed to client
      return { ok: false, error: "save_failed" };
    }
    return { ok: true };
  });

export const clearAbandonedCart = createServerFn({ method: "POST" })
  .handler(async () => {
    const sessionId = getCookie(COOKIE_NAME);
    if (!sessionId) return { ok: true };
    await supabaseAdmin
      .from("abandoned_carts")
      .update({ recovered: true, updated_at: new Date().toISOString() })
      .eq("session_id", sessionId);
    return { ok: true };
  });
