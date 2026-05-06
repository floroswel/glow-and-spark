import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { verifyAdmin } from "../_shared/auth-guard.ts";

Deno.serve(async (req) => {
  const cors = buildCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  try {
    // Verify admin
    const admin = await verifyAdmin(req);
    if (!admin) {
      return new Response(JSON.stringify({ error: "Neautorizat" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const perPage = parseInt(url.searchParams.get("per_page") || "50");

    const { data: { users }, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) throw error;

    const { data: allRoles } = await supabase
      .from("user_roles")
      .select("user_id, role");

    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, phone, avatar_url");

    const rolesMap = new Map<string, string[]>();
    allRoles?.forEach((r) => {
      const existing = rolesMap.get(r.user_id) || [];
      existing.push(r.role);
      rolesMap.set(r.user_id, existing);
    });

    const profilesMap = new Map(
      allProfiles?.map((p) => [p.user_id, p]) || []
    );

    const enrichedUsers = users.map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      email_confirmed_at: u.email_confirmed_at,
      full_name: profilesMap.get(u.id)?.full_name || u.user_metadata?.full_name || null,
      phone: profilesMap.get(u.id)?.phone || null,
      avatar_url: profilesMap.get(u.id)?.avatar_url || null,
      roles: rolesMap.get(u.id) || [],
    }));

    return new Response(
      JSON.stringify({ users: enrichedUsers, total: enrichedUsers.length }),
      {
        status: 200,
        headers: { ...cors, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Admin users error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Eroare" }),
      {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      }
    );
  }
});
