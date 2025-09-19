// src/components/SyncClientesButton.tsx
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Props = { label?: string; className?: string; onDone?: () => void };

export default function SyncClientesButton({ label = "Actualizar clientes", className, onDone }: Props) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const click = async () => {
    setLoading(true); setMsg(null);
    try {
      const idem = crypto.randomUUID();
      const { data, error } = await supabase.functions.invoke("sapiens-clientes", {
        headers: {
          "Idempotency-Key": idem,
        },
      });

      if (error) throw new Error(error.message || "Edge function error");

      setMsg(typeof data === "string" ? "Sincronización en curso/completada." : (data?.message || "Sincronización en curso/completada."));
      onDone?.(); // aquí puedes re-fetch del dropdown
    } catch (e: any) {
      setMsg(`Error: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <button
        onClick={click}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 bg-slate-900 text-white text-sm disabled:opacity-50 shadow-md hover:shadow-lg transition"
        title="Sincronizar clientes desde Sapiens (n8n)"
      >
        <svg className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M4 4v4h.01L8 8a6 6 0 1 1-1.356 3.778l1.932-.518A4 4 0 1 0 10 6H8l.01-4H4z" />
        </svg>
        {loading ? "Sincronizando..." : label}
      </button>
      {msg && <p className="mt-1 text-xs text-slate-600">{msg}</p>}
    </div>
  );
}
