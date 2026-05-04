import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const trackABConversion = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({
      testId: z.string().uuid(),
      visitorId: z.string().min(1).max(100),
      value: z.number().optional(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("ab_test_assignments" as any)
      .update({
        converted: true,
        conversion_value: data.value ?? null,
        converted_at: new Date().toISOString(),
      })
      .eq("test_id", data.testId)
      .eq("visitor_id", data.visitorId);

    if (error) {
      console.error("AB conversion tracking failed", error);
    }
    return { ok: !error };
  });
