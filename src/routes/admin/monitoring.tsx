import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, RefreshCw, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

export const Route = createFileRoute("/admin/monitoring")({
  component: MonitoringPage,
});

type HealthCheck = {
  id: string;
  check_name: string;
  status: string;
  response_time_ms: number | null;
  error_message: string | null;
  checked_at: string;
};

type Incident = {
  id: string;
  check_name: string;
  status: string;
  started_at: string;
  resolved_at: string | null;
  error_message: string | null;
};

function MonitoringPage() {
  const [checks, setChecks] = useState<HealthCheck[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const [checksRes, incidentsRes] = await Promise.all([
      supabase
        .from("health_checks")
        .select("*")
        .order("checked_at", { ascending: false })
        .limit(50),
      supabase
        .from("health_incidents")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(20),
    ]);
    setChecks((checksRes.data as HealthCheck[]) || []);
    setIncidents((incidentsRes.data as Incident[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const triggerManualCheck = async () => {
    setRefreshing(true);
    try {
      await fetch("/api/public/health");
      await new Promise((r) => setTimeout(r, 2000));
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  // Get latest status per check
  const latestByCheck = new Map<string, HealthCheck>();
  for (const c of checks) {
    if (!latestByCheck.has(c.check_name)) latestByCheck.set(c.check_name, c);
  }

  const statusIcon = (s: string) => {
    if (s === "ok") return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (s === "degraded") return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const statusBadge = (s: string) => {
    const variant = s === "ok" ? "default" : s === "degraded" ? "secondary" : "destructive";
    return <Badge variant={variant}>{s.toUpperCase()}</Badge>;
  };

  if (loading) return <div className="p-6 text-muted-foreground">Se încarcă...</div>;

  const openIncidents = incidents.filter((i) => i.status === "open");

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-heading">Monitoring & Health</h1>
        </div>
        <Button onClick={triggerManualCheck} disabled={refreshing} size="sm" variant="outline">
          <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
          Verificare manuală
        </Button>
      </div>

      {/* Open Incidents */}
      {openIncidents.length > 0 && (
        <Card className="border-destructive">
          <CardHeader className="pb-2">
            <CardTitle className="text-destructive flex items-center gap-2">
              <XCircle className="w-5 h-5" /> Incidente Active ({openIncidents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {openIncidents.map((i) => (
                <div key={i.id} className="flex items-center justify-between p-2 rounded bg-destructive/10">
                  <div>
                    <span className="font-medium">{i.check_name}</span>
                    {i.error_message && <p className="text-sm text-muted-foreground">{i.error_message}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(i.started_at).toLocaleString("ro-RO")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Status Curent</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...latestByCheck.entries()].map(([name, check]) => (
              <div key={name} className="flex items-center gap-3 p-3 rounded-lg border">
                {statusIcon(check.status)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium capitalize">{name}</p>
                  <p className="text-xs text-muted-foreground">
                    {check.response_time_ms != null ? `${check.response_time_ms}ms` : "—"}
                    {" · "}
                    {new Date(check.checked_at).toLocaleTimeString("ro-RO")}
                  </p>
                </div>
                {statusBadge(check.status)}
              </div>
            ))}
          </div>
          {latestByCheck.size === 0 && (
            <p className="text-muted-foreground text-sm">
              Nicio verificare încă. Apasă „Verificare manuală" sau așteaptă cron-ul (la 5 minute).
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Istoric Recent</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-3">Check</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Timp</th>
                  <th className="py-2 pr-3">Eroare</th>
                  <th className="py-2">Data</th>
                </tr>
              </thead>
              <tbody>
                {checks.slice(0, 30).map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-medium capitalize">{c.check_name}</td>
                    <td className="py-2 pr-3">{statusBadge(c.status)}</td>
                    <td className="py-2 pr-3">{c.response_time_ms != null ? `${c.response_time_ms}ms` : "—"}</td>
                    <td className="py-2 pr-3 text-xs text-muted-foreground max-w-[200px] truncate">
                      {c.error_message || "—"}
                    </td>
                    <td className="py-2 text-xs text-muted-foreground">
                      {new Date(c.checked_at).toLocaleString("ro-RO")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Incident History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Istoric Incidente</CardTitle>
        </CardHeader>
        <CardContent>
          {incidents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Niciun incident înregistrat.</p>
          ) : (
            <div className="space-y-2">
              {incidents.map((i) => (
                <div key={i.id} className="flex items-center justify-between p-2 rounded border">
                  <div className="flex items-center gap-2">
                    {i.status === "open" ? (
                      <XCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    <span className="font-medium">{i.check_name}</span>
                    <Badge variant={i.status === "open" ? "destructive" : "secondary"}>
                      {i.status === "open" ? "DESCHIS" : "REZOLVAT"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    <div>Start: {new Date(i.started_at).toLocaleString("ro-RO")}</div>
                    {i.resolved_at && <div>Rezolvat: {new Date(i.resolved_at).toLocaleString("ro-RO")}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground space-y-1">
        <p>🔗 Endpoint public: <code>/api/public/health</code> — compatibil cu UptimeRobot, Better Uptime, Pingdom</p>
        <p>⏱ Cron automat: verificare la fiecare 5 minute cu alertă pe admin_notifications</p>
        <p>📊 Integrare externă: configurează URL-ul în orice serviciu de monitoring extern</p>
      </div>
    </div>
  );
}
