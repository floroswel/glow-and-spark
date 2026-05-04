// useABTest — atribuie variantă consistent + permite track conversion
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { trackABConversion } from "@/server/ab-test.functions";

const VISITOR_KEY = "ml_visitor_id";

function getVisitorId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

interface Variant {
  id: string;
  name: string;
  config: any;
}

export function useABTest(testName: string) {
  const [variant, setVariant] = useState<Variant | null>(null);
  const [testId, setTestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: test } = await (supabase
          .from("ab_tests" as any)
          .select("id, status")
          .eq("name", testName)
          .eq("status", "running")
          .maybeSingle() as any);
        if (!test || !mounted) {
          setLoading(false);
          return;
        }
        setTestId(test.id);

        const visitor = getVisitorId();

        const { data: existing } = await (supabase
          .from("ab_test_assignments" as any)
          .select("variant_id")
          .eq("test_id", test.id)
          .eq("visitor_id", visitor)
          .maybeSingle() as any);

        const { data: variants } = await (supabase
          .from("ab_test_variants" as any)
          .select("id, name, config, traffic_percent")
          .eq("test_id", test.id) as any);

        if (!variants?.length) {
          setLoading(false);
          return;
        }

        let chosen: any;
        if (existing) {
          chosen = variants.find((v: any) => v.id === existing.variant_id) || variants[0];
        } else {
          // Weighted random by traffic_percent
          const total = variants.reduce((s: number, v: any) => s + (v.traffic_percent || 50), 0);
          let r = Math.random() * total;
          chosen = variants[0];
          for (const v of variants) {
            r -= v.traffic_percent || 50;
            if (r <= 0) { chosen = v; break; }
          }
          await (supabase.from("ab_test_assignments" as any).insert({
            test_id: test.id,
            variant_id: chosen.id,
            visitor_id: visitor,
          }) as any);
        }
        if (mounted) {
          setVariant({ id: chosen.id, name: chosen.name, config: chosen.config });
          setLoading(false);
        }
      } catch (e) {
        console.warn("AB test failed", e);
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [testName]);

  const trackConversion = async (value?: number) => {
    if (!testId) return;
    const visitor = getVisitorId();
    await trackABConversion({ data: { testId, visitorId: visitor, value } });
  };

  return { variant, loading, trackConversion };
}
