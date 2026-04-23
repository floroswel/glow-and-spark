import { createFileRoute, Link } from "@tanstack/react-router";
import { setPageMeta, setCanonical, removeCanonical } from "@/lib/seo";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TopBar } from "@/components/TopBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Calendar, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/blog/$slug")({
  head: () => ({
    meta: [
      { title: "Blog — Glow & Spark" },
      { name: "description", content: "Articol de blog Glow & Spark" },
    ],
  }),
  component: BlogPostPage,
});

function BlogPostPage() {
  const { slug } = Route.useParams();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle()
      .then(({ data }) => {
        setPost(data);
        setLoading(false);
        if (data) {
          setPageMeta({
            title: data.meta_title || data.title,
            description: data.meta_description || data.excerpt || "",
            image: data.image_url || undefined,
            type: "article",
          });
        }
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-4 py-16 space-y-4">
          <div className="h-8 w-2/3 rounded bg-muted animate-pulse" />
          <div className="h-64 rounded-xl bg-muted animate-pulse" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-4 rounded bg-muted animate-pulse" />)}
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">Articol negăsit</h1>
          <p className="text-muted-foreground mb-6">Acest articol nu există sau nu a fost publicat.</p>
          <Link to="/blog" className="inline-flex items-center gap-2 text-accent font-medium hover:underline">
            <ArrowLeft className="h-4 w-4" /> Înapoi la blog
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
      <article className="mx-auto max-w-3xl px-4 py-12">
        <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-accent transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Toate articolele
        </Link>

        <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">{post.title}</h1>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Calendar className="h-4 w-4" />
          <time>{new Date(post.published_at || post.created_at).toLocaleDateString("ro-RO", { year: "numeric", month: "long", day: "numeric" })}</time>
        </div>

        {post.image_url && (
          <img src={post.image_url} alt={post.title} className="w-full rounded-xl mb-8 object-cover max-h-96" />
        )}

        <div
          className="prose prose-neutral max-w-none text-foreground [&_a]:text-accent [&_h2]:font-heading [&_h3]:font-heading"
          dangerouslySetInnerHTML={{ __html: post.content || "" }}
        />
      </article>
      <SiteFooter />
    </div>
  );
}
