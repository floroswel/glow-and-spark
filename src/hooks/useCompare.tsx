import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "gs_compare";
const MAX_ITEMS = 4;

interface CompareContextValue {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  count: number;
}

const CompareContext = createContext<CompareContextValue | null>(null);

function readStorage(): string[] {
  try {
    const raw = typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY) : null;
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(() => readStorage());

  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids)); } catch {}
  }, [ids]);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_ITEMS) return prev;
      return [...prev, id];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const clear = useCallback(() => setIds([]), []);

  return (
    <CompareContext.Provider value={{ ids, has, toggle, remove, clear, count: ids.length }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
