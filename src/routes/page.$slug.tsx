import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TopBar } from "@/components/TopBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/page/$slug")({
  head: () => ({
    meta: [
      { title: "Mama Lucica" },
      { name: "description", content: "Pagină informativă Mama Lucica" },
    ],
  }),
  component: CmsPage,
});

function CmsPage() {
  const { slug } = Route.useParams();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("cms_pages")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle()
      .then(({ data }) => {
        setPage(data);
        setLoading(false);
        if (data) {
          document.title = data.meta_title || `${data.title} — Mama Lucica`;
          const desc = document.querySelector('meta[name="description"]');
          if (desc) desc.setAttribute("content", data.meta_description || "");
        }
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-4 py-16 space-y-4">
          <div className="h-8 w-1/2 rounded bg-muted animate-pulse" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-4 rounded bg-muted animate-pulse" />)}
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Pagină negăsită</h1>
          <p className="text-muted-foreground mb-6">Această pagină nu există sau nu a fost publicată.</p>
          <Link to="/" className="inline-flex items-center gap-2 text-accent font-medium hover:underline">
            <ArrowLeft className="h-4 w-4" /> Acasă
          </Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-8">{page.title}</h1>
        <div
          className="prose prose-neutral max-w-none text-foreground [&_a]:text-accent [&_h2]:font-heading [&_h3]:font-heading"
          dangerouslySetInnerHTML={{ __html: page.content || "" }}
        />
      </div>
      <SiteFooter />
    </div>
  );
}
