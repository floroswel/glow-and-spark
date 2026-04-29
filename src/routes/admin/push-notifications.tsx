import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Send, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/push-notifications")({
  head: () => ({ meta: [{ title: "Notificări Push — Admin" }] }),
  component: AdminPush,
});

function AdminPush() {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("/");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("push_subscriptions").select("*").order("created_at", { ascending: false });
    setSubs(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const broadcast = async () => {
    if (!title.trim()) return toast.error("Adaugă un titlu");
    // Save as in-app notification for all logged-in users (works without VAPID)
    const userIds = [...new Set(subs.map(s => s.user_id).filter(Boolean))];
    if (!userIds.length) return toast.error("Nu există abonați autentificați");
    const rows = userIds.map(uid => ({
      user_id: uid, type: "promo", title, message: body, link
    }));
    const { error } = await supabase.from("user_notifications").insert(rows);
    if (error) return toast.error(error.message);
    toast.success(`Notificare trimisă către ${userIds.length} utilizatori`);
    setTitle(""); setBody("");
  };

  const remove = async (id: string) => {
    await supabase.from("push_subscriptions").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2"><Bell className="h-6 w-6" />Notificări Push</h1>
          <p className="text-sm text-muted-foreground mt-1">{subs.length} dispozitive abonate</p>
        </div>
        <button onClick={load} className="rounded-lg border bg-card px-3 py-2 text-sm hover:bg-muted"><RefreshCw className="h-4 w-4" /></button>
      </div>

      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Trimite notificare în masă</h2>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Titlu (ex: Reducere 20% astăzi!)" className="w-full rounded border px-3 py-2 text-sm" maxLength={100} />
        <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Mesaj scurt..." className="w-full rounded border px-3 py-2 text-sm h-20" maxLength={300} />
        <input value={link} onChange={e => setLink(e.target.value)} placeholder="/promotii" className="w-full rounded border px-3 py-2 text-sm" />
        <button onClick={broadcast} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 flex items-center gap-2">
          <Send className="h-4 w-4" /> Trimite la toți utilizatorii ({[...new Set(subs.map(s => s.user_id).filter(Boolean))].length})
        </button>
        <p className="text-xs text-muted-foreground">Notificarea apare în secțiunea „Notificări" din contul utilizatorilor.</p>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="border-b px-4 py-3 font-semibold text-sm">Dispozitive abonate</div>
        {loading ? <div className="p-8 text-center text-sm text-muted-foreground">Se încarcă...</div> :
         subs.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">Niciun abonat încă</div> :
         <table className="w-full text-sm">
           <thead className="bg-muted/50 text-xs uppercase">
             <tr><th className="px-4 py-2 text-left">User ID</th><th className="px-4 py-2 text-left">User Agent</th><th className="px-4 py-2 text-left">Creat</th><th className="px-4 py-2"></th></tr>
           </thead>
           <tbody>
             {subs.map(s => (
               <tr key={s.id} className="border-t">
                 <td className="px-4 py-2 font-mono text-xs">{s.user_id?.slice(0, 8) || "anon"}</td>
                 <td className="px-4 py-2 text-xs text-muted-foreground truncate max-w-xs">{s.user_agent || "—"}</td>
                 <td className="px-4 py-2 text-xs">{new Date(s.created_at).toLocaleString("ro-RO")}</td>
                 <td className="px-4 py-2 text-right"><button onClick={() => remove(s.id)} className="rounded p-1 hover:bg-muted text-rose-600"><Trash2 className="h-4 w-4" /></button></td>
               </tr>
             ))}
           </tbody>
         </table>}
      </div>
    </div>
  );
}
