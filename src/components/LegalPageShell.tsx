import { Link } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MarqueeBanner } from "@/components/MarqueeBanner";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ChevronRight, AlertTriangle } from "lucide-react";
import { useCompanyInfo, type CompanyInfo } from "@/hooks/useCompanyInfo";

/** Shared company identity block for legal pages */
export function CompanyIdentityBlock({ C }: { C: CompanyInfo }) {
  return (
    <ul className="list-none pl-0 space-y-0.5 text-sm">
      <li><strong>Denumire:</strong> {C.name}</li>
      <li><strong>CUI:</strong> {C.cui}</li>
      <li><strong>Reg. Com.:</strong> {C.regCom}</li>
      <li><strong>Sediu social:</strong> {C.fullAddress}</li>
      <li><strong>E-mail:</strong> <a href={`mailto:${C.email}`} className="text-accent hover:underline">{C.email}</a></li>
      <li><strong>Telefon:</strong> <a href={`tel:${C.phone.replace(/\s/g, "")}`} className="text-accent hover:underline">{C.phone}</a></li>
    </ul>
  );
}

/** DRAFT_FOR_LEGAL_REVIEW banner */
export function DraftBanner() {
  return (
    <div className="mb-6 rounded-lg border-2 border-yellow-500/50 bg-yellow-500/10 p-4 flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
      <div className="text-sm">
        <p className="font-bold text-yellow-700 dark:text-yellow-400">DRAFT_FOR_LEGAL_REVIEW</p>
        <p className="text-muted-foreground mt-1">
          Acest document este un proiect tehnic și <strong>nu constituie consiliere juridică</strong>. 
          Conținutul trebuie verificat și aprobat de un avocat autorizat înainte de publicare. 
          Corectitudinea juridică necesită revizuire de avocat cu competențe în dreptul consumatorilor din România.
        </p>
      </div>
    </div>
  );
}

/** Footer company identity block */
export function LegalPageFooterBlock({ C }: { C: CompanyInfo }) {
  return (
    <div className="mt-8 text-xs text-muted-foreground text-center space-y-1 border-t border-border pt-6">
      <p><strong className="text-foreground">{C.name}</strong> · CUI: {C.cui} · Reg. Com.: {C.regCom}</p>
      <p>{C.fullAddress}</p>
      <p>E-mail: {C.email} · Tel: {C.phone}</p>
    </div>
  );
}

/** Changelog/Modifications section at bottom of legal pages */
export function ModificariSection({ lastUpdate }: { lastUpdate: string }) {
  return (
    <div className="mt-8 rounded-lg border border-border bg-secondary/20 p-5 text-sm">
      <h2 className="text-foreground font-heading font-bold text-lg mb-2">Modificări</h2>
      <p className="text-muted-foreground text-xs mb-2">Ultima actualizare: {lastUpdate}</p>
      <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-xs">
        <li><strong>{lastUpdate}</strong> — Versiune inițială (DRAFT_FOR_LEGAL_REVIEW). Necesită verificare avocat.</li>
      </ul>
      <p className="text-xs text-muted-foreground/70 mt-3 italic">
        [PLACEHOLDER_VERIFICARE_AVOCAT_CONTABIL] — Secțiunea de modificări va fi completată la fiecare actualizare aprobată juridic.
      </p>
    </div>
  );
}

/** Standard legal page shell */
export function LegalPageShell({ 
  title, 
  breadcrumb, 
  lastUpdate, 
  children 
}: { 
  title: string; 
  breadcrumb: string;
  lastUpdate: string;
  children: React.ReactNode;
}) {
  const C = useCompanyInfo();

  return (
    <div className="min-h-screen">
      <MarqueeBanner />
      <TopBar />
      <SiteHeader />

      <div className="mx-auto max-w-3xl px-4 py-8">
        <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Acasă</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">{breadcrumb}</span>
        </nav>

        <DraftBanner />

        <h1 className="font-heading text-3xl font-bold text-foreground mb-2 text-center">{title}</h1>
        <p className="text-center text-sm text-muted-foreground mb-8">Ultima actualizare: {lastUpdate}</p>

        <div className="prose prose-sm max-w-none text-muted-foreground space-y-6 [&_h2]:text-foreground [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3 [&_strong]:text-foreground">
          {children}
        </div>

        <ModificariSection lastUpdate={lastUpdate} />
        <LegalPageFooterBlock C={C} />
      </div>

      <SiteFooter />
      <WhatsAppButton />
    </div>
  );
}
