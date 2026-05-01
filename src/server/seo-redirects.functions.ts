import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Check if a given path has an active SEO redirect.
 * Returns { target, type } or null.
 * Uses the admin client to bypass RLS (this is a read-only public lookup).
 */
export const checkSeoRedirect = createServerFn({ method: "GET" })
  .inputValidator((data: { path: string }) => data)
  .handler(async ({ data }) => {
    const { path } = data;
    if (!path) return null;

    const { data: row, error } = await supabaseAdmin
      .from("seo_redirects")
      .select("target_path, redirect_type, id")
      .eq("source_path", path)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (error || !row) return null;

    // Fire-and-forget: increment hit counter
    supabaseAdmin
      .from("seo_redirects")
      .update({ hits: (row as any).hits ? (row as any).hits + 1 : 1 } as any)
      .eq("id", row.id)
      .then(() => {});

    return {
      target: row.target_path,
      type: row.redirect_type as number,
    };
  });
