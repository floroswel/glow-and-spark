import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MarqueeBanner } from "@/components/MarqueeBanner";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { ChevronRight, Heart, Leaf, Award, Sparkles } from "lucide-react";

export const Route = createFileRoute("/despre-noi")({
  head: () => ({
    meta: [
      { title: "Despre Noi — Mama Lucica | Lumânări Artizanale" },
      { name: "description", content: "Descoperă povestea Mama Lucica — lumânări artizanale din ceară de soia 100% naturală, turnate manual cu dragoste în România de SC Vomix Genius SRL." },
      { property: "og:title", content: "Despre Noi — Mama Lucica" },
      { property: "og:description", content: "Lumânări artizanale din ceară de soia 100% naturală, turnate manual cu dragoste în România." },
    ],
  }),
  component: DespreNoiPage,
});

const values = [
  { icon: Leaf, title: "Ingrediente naturale", desc: "Ceară de soia 100% naturală, fitiluri din bumbac, uleiuri esențiale și parfumuri de calitate superioară." },
  { icon: Heart, title: "Făcute cu dragoste", desc: "Fiecare lumânare este turnată manual, cu atenție la detalii, în atelierul nostru din România." },
  { icon: Award, title: "Calitate premium", desc: "Testăm fiecare lot pentru ardere uniformă, difuzie optimă a parfumului și durabilitate." },
  { icon: Sparkles, title: "Design unic", desc: "Ambalaje elegante și recipiente reutilizabile, ideale pentru cadouri sau pentru tine." },
];

function DespreNoiPage() {
  const C = useCompanyInfo();
  return (
    <div className="min-h-screen">
      <MarqueeBanner />
      <TopBar />
      <SiteHeader />

      <div className="mx-auto max-w-4xl px-4 py-8">
        <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Acasă</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">Despre noi</span>
        </nav>

        <div className="text-center mb-12">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground">Povestea Mama Lucica</h1>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed">
            Mama Lucica s-a născut din pasiunea pentru lumânările artizanale și dorința de a aduce 
            un strop de căldură și eleganță în fiecare casă. Inspirați de tradițiile românești și de 
            ingredientele naturale, creăm lumânări care transformă orice spațiu într-o oază de liniște.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          {values.map((v) => (
            <div key={v.title} className="rounded-2xl border border-border bg-card p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 mb-4">
                <v.icon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{v.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-4 text-sm text-muted-foreground leading-relaxed">
          <h2 className="font-heading text-xl font-bold text-foreground">Cine suntem</h2>
          <p>
            Suntem o echipă mică dar dedicată, cu sediul în Județul Teleorman, România. 
            Fiecare lumânare Mama Lucica este rezultatul unui proces artizanal atent: 
            de la selectarea materiilor prime de cea mai bună calitate, până la turnarea 
            manuală și testarea fiecărui lot.
          </p>
          <p>
            Credem că o lumânare bună poate schimba atmosfera unei întregi încăperi — 
            de aceea ne dedicăm creării unor produse care nu doar arată frumos, 
            ci și ard uniform, eliberează parfumul treptat și durează mai mult 
            decât alternativele de parafină.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card/50 p-6 text-xs text-muted-foreground space-y-1">
          <p><strong className="text-foreground">SC Vomix Genius SRL</strong></p>
          <p>CUI: 43025661</p>
          <p>Sediu social: Județul Teleorman, România</p>
          <p>Contact: <a href="mailto:contact@mamalucica.ro" className="text-accent hover:underline">contact@mamalucica.ro</a></p>
        </div>
      </div>

      <SiteFooter />
      <WhatsAppButton />
    </div>
  );
}
