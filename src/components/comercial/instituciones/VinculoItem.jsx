"use client";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";

import { Badge } from "@/components/ui";

export function VinculoItem({ nombre, rol, detalle, personaId }) {
  const router = useRouter();

  return (
    <div className="bg-white border border-slate-100 rounded-lg p-3 flex items-center justify-between shadow-sm hover:border-slate-200 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
          <User size={14} className="text-slate-500" />
        </div>
        <div className="min-w-0">
          <button
            onClick={() => router.push(`/ventas-crm/contactos/personas/${personaId}`)}
            className="text-sm font-medium text-slate-700 hover:text-emerald-600 transition-colors truncate block"
          >
            {nombre}
          </button>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="default" className="text-[10px] py-0 px-1.5 uppercase font-semibold">
              {rol}
            </Badge>
            {detalle && (
              <span className="text-[11px] text-slate-400 truncate">{detalle}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
