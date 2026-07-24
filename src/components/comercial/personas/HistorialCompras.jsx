"use client";
import { useState } from "react";
import Link from "next/link";

import { Badge, Pagination, EmptyState } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { getVentas } from "@/services/apis/ventas";

// ─── Helpers ────────────────────────────────────────────────────

function formatFecha(fechaStr) {
  if (!fechaStr) return "—";
  return new Date(fechaStr).toLocaleDateString("es-PY", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function formatMonto(monto, moneda = "USD") {
  if (monto == null) return "—";
  if (moneda === "PYG") return `₲ ${Number(monto).toLocaleString("es-PY")}`;
  return `$ ${Number(monto).toFixed(2)}`;
}

/**
 * Tabla de historial de compras confirmadas para una persona.
 */
export function HistorialCompras({ personaId }) {
  const [page, setPage] = useState(1);

  const { data: ventasData, loading: ventasLoading } = useApi(getVentas, {
    auto: true,
    args: [{ cliente: personaId, estado: "confirmado", page }],
  });

  const ventas = ventasData?.results || [];
  const count = ventasData?.count || 0;

  if (ventasLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-lg bg-slate-100" />)}
        </div>
      </div>
    );
  }

  if (ventas.length === 0) {
    return (
      <div className="p-6">
        <EmptyState titulo="Sin compras registradas" descripcion="Esta persona aún no tiene ventas confirmadas." icon="🛒" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left py-2 px-3 text-[11px] font-bold uppercase text-slate-400">Comprobante</th>
              <th className="text-left py-2 px-3 text-[11px] font-bold uppercase text-slate-400">Fecha</th>
              <th className="text-left py-2 px-3 text-[11px] font-bold uppercase text-slate-400">Origen</th>
              <th className="text-right py-2 px-3 text-[11px] font-bold uppercase text-slate-400">Total USD</th>
              <th className="text-right py-2 px-3 text-[11px] font-bold uppercase text-slate-400">Total Moneda</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((venta) => (
              <tr key={venta.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="py-2.5 px-3">
                  <Link href={`/ventas-crm/ventas/${venta.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                    {venta.comprobante?.numero ? `#${venta.comprobante.numero}` : `V-${venta.id}`}
                  </Link>
                </td>
                <td className="py-2.5 px-3 text-slate-600">{formatFecha(venta.confirmed_at || venta.created_at)}</td>
                <td className="py-2.5 px-3">
                  <Badge variant={venta.origen === "sucursal" ? "primary" : "success"}>{venta.origen}</Badge>
                </td>
                <td className="py-2.5 px-3 text-right font-medium text-slate-700">{formatMonto(venta.total_usd, "USD")}</td>
                <td className="py-2.5 px-3 text-right font-medium text-slate-500">{formatMonto(venta.total_moneda_negociacion, venta.moneda_negociacion)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {count > 24 && <Pagination count={count} pageSize={24} currentPage={page} onPageChange={setPage} />}
    </div>
  );
}
