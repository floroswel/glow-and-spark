import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TopBar } from "@/components/TopBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Calendar, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — Mama Lucica" },
      { name: "description", content: "Articole despre lumânări, aromaterapie și decorațiuni." },
      { property: "og:title", content: "Blog — Mama Lucica" },
      { property: "og:description", content: "Articole despre lumânări, aromaterapie și decorațiuni." },
    ],
  }),
  component: BlogPage,
});

function BlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("blog_posts")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .then(({ data }) => {
        setPosts(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">Blog</h1>
        <p className="text-muted-foreground mb-10">Descoperă articole despre lumânări, aromaterapie și inspirație pentru casa ta.</p>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl bg-muted animate-pulse h-72" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">Niciun articol publicat încă.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                to="/blog/$slug"
                params={{ slug: post.slug }}
                className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow"
              >
                {post.image_url ? (
                  <img src={post.image_url} alt={post.title} className="h-44 w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="h-44 bg-secondary/40 flex items-center justify-center">
                    <span className="text-4xl">✨</span>
                  </div>
                )}
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{new Date(post.published_at || post.created_at).toLocaleDateString("ro-RO")}</span>
                  </div>
                  <h2 className="font-heading text-lg font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-2">{post.title}</h2>
                  {post.excerpt && <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>}
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-accent">
                    Citește <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
