import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

const LineSchema = z
  .object({
    product_id: z.string().uuid().nullable().optional(),
    name: z.string().min(1).max(255),
    price: z.number().min(0).max(1_000_000),
    quantity: z.number().int().min(1).max(999),
    image_url: z.string().max(2048).optional().nullable(),
    sku: z.string().max(128).optional().nullable(),
    manual: z.boolean().optional(),
  })
  .passthrough();

const ManualOrderSchema = z.object({
  access_token: z.string().min(20).max(4096),
  customer: z.object({
    name: z.string().min(2).max(200),
    email: z.string().email().max(254),
    phone: z.string().max(40).optional().nullable(),
    billing_type: z.enum(["individual", "company"]).default("individual"),
    company_name: z.string().max(255).optional().nullable(),
    company_cui: z.string().max(50).optional().nullable(),
    company_reg: z.string().max(50).optional().nullable(),
  }),
  shipping: z.object({
    address: z.string().max(500).optional().nullable(),
    city: z.string().max(100).optional().nullable(),
    county: z.string().max(100).optional().nullable(),
    postal_code: z.string().max(20).optional().nullable(),
  }),
  lines: z.array(LineSchema).min(1).max(100),
  shipping_cost: z.number().min(0).max(100_000).default(0),
  discount_amount: z.number().min(0).max(1_000_000).default(0),
  discount_code: z.string().max(64).optional().nullable(),
  payment_method: z.enum(["ramburs", "card", "transfer"]).default("ramburs"),
  payment_status: z.enum(["pending", "paid", "failed", "refunded"]).default("pending"),
  status: z.enum(["pending", "processing"]).default("pending"),
  notes: z.string().max(2000).optional().nullable(),
});

export const createManualOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ManualOrderSchema.parse(input))
  .handler(async ({ data }) => {
    // Verify token & admin role server-side
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      throw new Response("Server misconfigured", { status: 500 });
    }
    const verifyClient = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    const { data: claimsData, error: claimsErr } = await verifyClient.auth.getClaims(data.access_token);
    if (claimsErr || !claimsData?.claims?.sub) {
      throw new Response("Unauthorized", { status: 401 });
    }
    const userId = claimsData.claims.sub;

    const { data: roleRow, error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (roleErr || !roleRow) {
      throw new Response("Forbidden: admin only", { status: 403 });
    }

    // Server-side trusted totals: re-price catalog lines from DB; trust manual lines as entered.
    const productIds: string[] = data.lines
      .map((l): string | null => l.product_id ?? null)
      .filter((id): id is string => Boolean(id));

    let productMap = new Map<string, { id: string; name: string; price: number; image_url: string | null; sku: string | null }>();
    if (productIds.length > 0) {
      const { data: products, error: prodErr } = await supabaseAdmin
        .from("products")
        .select("id, name, price, image_url, sku")
        .in("id", productIds);
      if (prodErr) {
        // Don't expose internal DB error details
        throw new Response("Failed to load products", { status: 500 });
      }
      for (const p of products || []) productMap.set(p.id, p as any);
    }

    const items: Array<Record<string, unknown>> = [];
    let subtotal = 0;
    for (const line of data.lines) {
      let unitPrice = line.price;
      let name = line.name;
      let image: string | null | undefined = line.image_url ?? null;
      let sku: string | null | undefined = line.sku ?? null;
      let pid: string | null = line.product_id ?? null;
      const isManual = line.manual === true || !line.product_id;

      if (!isManual && line.product_id) {
        const p = productMap.get(line.product_id);
        if (!p) {
          throw new Response(`Product not found: ${line.product_id}`, { status: 400 });
        }
        unitPrice = Number(p.price);
        name = p.name;
        image = p.image_url ?? null;
        sku = p.sku ?? null;
        pid = p.id;
      }

      const lineTotal = +(unitPrice * line.quantity).toFixed(2);
      subtotal += lineTotal;

      items.push({
        id: pid,
        product_id: pid,
        name,
        price: unitPrice,
        quantity: line.quantity,
        qty: line.quantity,
        image,
        sku,
        manual: isManual,
      });
    }
    subtotal = +subtotal.toFixed(2);

    const shippingCost = +Number(data.shipping_cost || 0).toFixed(2);
    const discountAmount = +Math.min(Number(data.discount_amount || 0), subtotal).toFixed(2);
    const total = +Math.max(0, subtotal + shippingCost - discountAmount).toFixed(2);

    // Order number using general.order_prefix
    const { data: settingRow } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "general")
      .maybeSingle();
    const prefix = ((settingRow?.value as any)?.order_prefix || "ML").toString().slice(0, 8).toUpperCase();
    const orderNumber = `${prefix}-${Date.now().toString(36).toUpperCase()}`;

    const orderId = crypto.randomUUID();

    const insertPayload = {
      id: orderId,
      order_number: orderNumber,
      customer_name: data.customer.name.trim(),
      customer_email: data.customer.email.trim().toLowerCase(),
      customer_phone: data.customer.phone?.trim() || null,
      billing_type: data.customer.billing_type,
      company_name: data.customer.billing_type === "company" ? data.customer.company_name || null : null,
      company_cui: data.customer.billing_type === "company" ? data.customer.company_cui || null : null,
      company_reg: data.customer.billing_type === "company" ? data.customer.company_reg || null : null,
      shipping_address: data.shipping.address || null,
      city: data.shipping.city || null,
      county: data.shipping.county || null,
      postal_code: data.shipping.postal_code || null,
      items: items as any,
      subtotal,
      shipping_cost: shippingCost,
      discount_amount: discountAmount,
      discount_code: data.discount_code || null,
      total,
      currency: "RON",
      payment_method: data.payment_method,
      payment_status: data.payment_status,
      status: data.status,
      notes: data.notes || null,
      user_id: null,
    };

    const { error: insErr } = await supabaseAdmin.from("orders").insert(insertPayload);
    if (insErr) {
      throw new Response("Order insert failed", { status: 500 });
    }

    // Initial timeline entry
    await supabaseAdmin.from("order_timeline").insert({
      order_id: orderId,
      action: "Comandă creată manual",
      performed_by: userId,
      details: {
        source: "admin_panel",
        payment_method: data.payment_method,
        total,
        lines: items.length,
      } as any,
    });

    return { ok: true, id: orderId, order_number: orderNumber, total };
  });
