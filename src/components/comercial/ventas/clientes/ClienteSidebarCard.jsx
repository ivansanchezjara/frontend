"use client";
import { useEffect } from "react";
import { useApi } from "@/hooks/useApi";
import { getCliente } from "@/services/apis/ventas";
import { Phone, Mail, FileText, ExternalLink, Loader2, User } from "lucide-react";
import Link from "next/link";
import { Badge, Text } from "@/components/ui";

const TIER_LABELS = {
  publico: "Público",
  estudiante: "Estudiante",
  reventa: "Reventa",
  mayorista: "Mayorista",
  intercompany: "Intercompany",
};

const ETAPA_BADGES = {
  prospecto: { variant: "info", label: "Prospecto" },
  activo: { variant: "success", label: "Cliente Activo" },
  inactivo: { variant: "danger", label: "Inactivo" },
};

export default function ClienteSidebarCard({ clienteId }) {
  const { data: cliente, loading, execute: fetchCliente } = useApi(getCliente);

  useEffect(() => {
    if (clienteId) {
      fetchCliente(clienteId);
    }
  }, [clienteId, fetchCliente]);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col items-center justify-center min-h-[160px] gap-2">
        <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
        <span className="text-xs text-slate-400 font-medium">Cargando contacto...</span>
      </div>
    );
  }

  if (!cliente) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header Ficha */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
              Cliente
            </span>
            {cliente.etapa && ETAPA_BADGES[cliente.etapa] && (
              <Badge variant={ETAPA_BADGES[cliente.etapa].variant} className="text-[9px] px-1 py-0.25">
                {ETAPA_BADGES[cliente.etapa].label}
              </Badge>
            )}
          </div>
          <h3 className="font-black text-sm text-slate-800 truncate" title={cliente.razon_social}>
            {cliente.tratamiento ? `${cliente.tratamiento} ` : ""}{cliente.razon_social}
          </h3>
          {cliente.nombre_comercial && (
            <p className="text-xs text-slate-400 font-bold leading-tight">
              {cliente.nombre_comercial}
            </p>
          )}
        </div>
        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
          <User className="w-4 h-4" />
        </div>
      </div>

      {/* Info List */}
      <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
        {/* RUC */}
        <div className="flex items-center justify-between text-slate-600">
          <span className="font-bold text-slate-400">RUC:</span>
          <span className="font-black font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 text-[10px]">
            {cliente.ruc || "—"}
          </span>
        </div>

        {/* Teléfono */}
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-400">Teléfono:</span>
          {cliente.telefono ? (
            <a
              href={`tel:${cliente.telefono}`}
              className="font-black text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
            >
              <Phone className="w-3 h-3" />
              {cliente.telefono}
            </a>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </div>

        {/* Correo */}
        <div className="flex items-center justify-between min-w-0">
          <span className="font-bold text-slate-400 shrink-0 mr-2">Email:</span>
          {cliente.correo_electronico ? (
            <a
              href={`mailto:${cliente.correo_electronico}`}
              className="font-black text-emerald-600 hover:text-emerald-700 hover:underline truncate flex items-center gap-1 min-w-0"
              title={cliente.correo_electronico}
            >
              <Mail className="w-3 h-3 shrink-0" />
              <span className="truncate">{cliente.correo_electronico}</span>
            </a>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </div>

        {/* Lista de Precios */}
        <div className="flex items-center justify-between text-slate-600">
          <span className="font-bold text-slate-400">Lista Precios:</span>
          <span className="font-black bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[10px]">
            {TIER_LABELS[cliente.tier_precio] || cliente.tier_precio || "Público"}
          </span>
        </div>
      </div>

      {/* Botón Ver Más */}
      <div className="pt-2 border-t border-slate-100">
        <Link
          href={`/ventas-crm/clientes/${clienteId}`}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 transition-all active:scale-[0.98]"
        >
          <ExternalLink className="w-3 h-3" />
          Ficha del Cliente
        </Link>
      </div>
    </div>
  );
}
