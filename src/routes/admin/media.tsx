import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Image, Upload, Trash2, Copy, Search, Grid, List, X, Check } from "lucide-react";

export const Route = createFileRoute("/admin/media")({
  component: AdminMedia,
});

interface MediaFile {
  name: string;
  url: string;
  size: number;
  created_at: string;
}

function AdminMedia() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [toast, setToast] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFiles();
  }, []);

  async function loadFiles() {
    const { data, error } = await supabase.storage.from("product-images").list("", { limit: 200, sortBy: { column: "created_at", order: "desc" } });
    if (data) {
      const mediaFiles: MediaFile[] = data.filter(f => !f.id?.endsWith("/")).map(f => ({
        name: f.name,
        url: supabase.storage.from("product-images").getPublicUrl(f.name).data.publicUrl,
        size: f.metadata?.size || 0,
        created_at: f.created_at || "",
      }));
      setFiles(mediaFiles);
    }
    setLoading(false);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList?.length) return;
    setUploading(true);
    for (const file of Array.from(fileList)) {
      const ext = file.name.split(".").pop();
      const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      await supabase.storage.from("product-images").upload(name, file);
    }
    await loadFiles();
    setUploading(false);
    setToast(`${fileList.length} fișier(e) încărcate!`);
    setTimeout(() => setToast(""), 3000);
    e.target.value = "";
  }

  async function deleteSelected() {
    if (!selected.size) return;
    const names = Array.from(selected);
    await supabase.storage.from("product-images").remove(names);
    setSelected(new Set());
    await loadFiles();
    setToast(`${names.length} fișier(e) șterse`);
    setTimeout(() => setToast(""), 3000);
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    setToast("URL copiat!"); setTimeout(() => setToast(""), 2000);
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  const filtered = files.filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="grid grid-cols-4 gap-4">{[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="aspect-square rounded-xl" />)}</div>;

  return (
    <div className="space-y-6">
      {toast && <div className="fixed top-4 right-4 z-50 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-lg">{toast}</div>}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Media Library</h1>
          <p className="text-sm text-muted-foreground">{files.length} fișiere • Bucket: product-images</p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button onClick={deleteSelected} className="flex items-center gap-1 rounded-lg bg-destructive px-3 py-2 text-xs font-medium text-destructive-foreground">
              <Trash2 className="h-3.5 w-3.5" /> Șterge ({selected.size})
            </button>
          )}
          <label className="flex cursor-pointer items-center gap-1 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">
            <Upload className="h-4 w-4" /> {uploading ? "Se încarcă..." : "Încarcă"}
            <input type="file" multiple accept="image/*" onChange={handleUpload} className="hidden" />
          </label>
        </div>
      </div>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Caută fișier..."
            className="w-full rounded-lg border border-border pl-9 pr-3 py-2 text-sm" />
        </div>
        <div className="flex rounded-lg border border-border">
          <button onClick={() => setViewMode("grid")} className={`p-2 ${viewMode === "grid" ? "bg-muted" : ""}`}><Grid className="h-4 w-4" /></button>
          <button onClick={() => setViewMode("list")} className={`p-2 ${viewMode === "list" ? "bg-muted" : ""}`}><List className="h-4 w-4" /></button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map(file => {
            const isSelected = selected.has(file.name);
            return (
              <div key={file.name} className={`group relative rounded-xl border bg-card overflow-hidden ${isSelected ? "ring-2 ring-accent" : "hover:border-accent/30"}`}>
                <div className="aspect-square bg-muted/30 flex items-center justify-center overflow-hidden">
                  <img src={file.url} alt={file.name} className="h-full w-full object-cover" loading="lazy" />
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium truncate">{file.name}</p>
                  <p className="text-[10px] text-muted-foreground">{formatSize(file.size)}</p>
                </div>
                <div className="absolute top-2 left-2">
                  <button onClick={() => { const n = new Set(selected); isSelected ? n.delete(file.name) : n.add(file.name); setSelected(n); }}
                    className={`h-5 w-5 rounded border flex items-center justify-center text-white text-xs ${isSelected ? "bg-accent border-accent" : "bg-white/80 border-border opacity-0 group-hover:opacity-100"} transition`}>
                    {isSelected && <Check className="h-3 w-3" />}
                  </button>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => copyUrl(file.url)} className="rounded bg-black/50 p-1 text-white hover:bg-black/70"><Copy className="h-3 w-3" /></button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/30">
              <th className="w-8 px-3 py-2"></th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Preview</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Nume</th>
              <th className="px-4 py-2 text-right font-medium text-muted-foreground">Mărime</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Acțiuni</th>
            </tr></thead>
            <tbody>
              {filtered.map(file => (
                <tr key={file.name} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-3"><input type="checkbox" checked={selected.has(file.name)} onChange={() => { const n = new Set(selected); selected.has(file.name) ? n.delete(file.name) : n.add(file.name); setSelected(n); }} /></td>
                  <td className="px-4 py-2"><img src={file.url} alt="" className="h-10 w-10 rounded object-cover" /></td>
                  <td className="px-4 py-2 text-xs">{file.name}</td>
                  <td className="px-4 py-2 text-right text-xs">{formatSize(file.size)}</td>
                  <td className="px-4 py-2"><button onClick={() => copyUrl(file.url)} className="text-xs text-accent hover:underline">Copiază URL</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length === 0 && <div className="text-center py-12 text-muted-foreground"><Image className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>Niciun fișier găsit</p></div>}
    </div>
  );
}
