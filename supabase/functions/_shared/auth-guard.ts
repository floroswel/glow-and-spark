// Shared auth guard for edge functions.
// Validates either admin JWT or a CRON_SECRET bearer token.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Verify the caller is an admin user (JWT + user_roles check).
 * Returns the user object on success, null on failure.
 */
export async function verifyAdmin(req: Request): Promise<{ user: any } | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.replace("Bearer ", "");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userClient = createClient(supabaseUrl, anonKey);
  const { data: { user } } = await userClient.auth.getUser(token);
  if (!user) return null;

  const adminClient = createClient(supabaseUrl, serviceKey);
  const { data: roleData } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleData) return null;
  return { user };
}

/**
 * Verify the caller is either an admin or presents a valid CRON_SECRET.
 * Use for background job endpoints that can be triggered by cron or admin.
 */
export async function verifyCronOrAdmin(req: Request): Promise<boolean> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return false;

  // Check CRON_SECRET first (fast path for scheduled calls)
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;

  // Check service role key (internal function-to-function calls)
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceKey && authHeader === `Bearer ${serviceKey}`) return true;

  // Fall back to admin JWT check
  const admin = await verifyAdmin(req);
  return admin !== null;
}
