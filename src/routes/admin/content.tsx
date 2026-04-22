import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { FileText, BookOpen, Image, Globe, HelpCircle, Layers, Mail, Languages, Search as SearchIcon, Navigation } from "lucide-react";

export const Route = createFileRoute("/admin/content")({
  component: AdminContentLayout,
});

const tabs = [
  { to: "/admin/blog", label: "Blog", icon: BookOpen },
  { to: "/admin/pages", label: "Pagini CMS", icon: FileText },
  { to: "/admin/content/faq", label: "FAQ", icon: HelpCircle },
  { to: "/admin/content/seo", label: "SEO Global", icon: SearchIcon },
  { to: "/admin/content/email-templates", label: "Șabloane Email", icon: Mail },
  { to: "/admin/media", label: "Media Library", icon: Image },
  { to: "/admin/content/redirects", label: "Redirecturi", icon: Navigation },
];

function AdminContentLayout() {
  const location = useLocation();
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">📝 Conținut</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestionează blog, pagini, FAQ, SEO și șabloane email</p>
      </div>
      <div className="flex flex-wrap gap-2 mb-6 border-b border-border pb-4">
        {tabs.map(t => {
          const active = location.pathname.startsWith(t.to);
          return (
            <Link key={t.to} to={t.to as any} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${active ? "bg-accent/15 text-accent" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
              <t.icon className="h-4 w-4" />
              {t.label}
            </Link>
          );
        })}
      </div>
      <Outlet />
    </div>
  );
}
