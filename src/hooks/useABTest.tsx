// useABTest — atribuie variantă consistent + permite track conversion
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

export function useABTest(testKey: string) {
  const [variant, setVariant] = useState<Variant | null>(null);
  const [testId, setTestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: test } = await supabase
          .from("ab_tests")
          .select("id, status")
          .eq("key", testKey)
          .eq("status", "running")
          .maybeSingle();
        if (!test || !mounted) {
          setLoading(false);
          return;
        }
        setTestId(test.id);

        const visitor = getVisitorId();

        // Vezi dacă există atribuire
        const { data: existing } = await supabase
          .from("ab_test_assignments")
          .select("variant_id")
          .eq("test_id", test.id)
          .eq("visitor_id", visitor)
          .maybeSingle();

        const { data: variants } = await supabase
          .from("ab_test_variants")
          .select("id, name, config, weight")
          .eq("test_id", test.id);

        if (!variants?.length) {
          setLoading(false);
          return;
        }

        let chosen: any;
        if (existing) {
          chosen = variants.find((v) => v.id === existing.variant_id) || variants[0];
        } else {
          // Weighted random
          const total = variants.reduce((s, v) => s + (v.weight || 1), 0);
          let r = Math.random() * total;
          chosen = variants[0];
          for (const v of variants) {
            r -= v.weight || 1;
            if (r <= 0) { chosen = v; break; }
          }
          await supabase.from("ab_test_assignments").insert({
            test_id: test.id,
            variant_id: chosen.id,
            visitor_id: visitor,
          });
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
  }, [testKey]);

  const trackConversion = async (value?: number) => {
    if (!testId) return;
    const visitor = getVisitorId();
    await supabase
      .from("ab_test_assignments")
      .update({ converted: true, conversion_value: value, converted_at: new Date().toISOString() })
      .eq("test_id", testId)
      .eq("visitor_id", visitor);
  };

  return { variant, loading, trackConversion };
}
