import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/stock/inventory")({
  component: InventoryPage,
});

function InventoryPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/admin/stock" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="font-heading text-xl font-bold text-foreground">📊 Inventar</h1>
      </div>
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-4xl mb-4">📋</p>
          <h2 className="text-lg font-semibold text-foreground mb-2">Sesiune Inventar</h2>
          <p className="text-sm text-muted-foreground mb-4">Creează o sesiune de inventar pentru a compara stocul fizic cu cel din sistem. Diferențele vor fi evidențiate automat.</p>
          <p className="text-xs text-muted-foreground">Funcționalitate în curs de implementare — folosește Manager Stoc + Ajustări pentru inventar manual.</p>
        </CardContent>
      </Card>
    </div>
  );
}
