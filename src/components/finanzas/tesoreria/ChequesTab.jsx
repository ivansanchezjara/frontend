"use client";

import { useState, useEffect } from "react";
import { Badge, LoadingScreen, EmptyState } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { getChequesTesoreria } from "@/services/apis/tesoreria";
import { formatUSD, formatFecha } from "./helpers";

export default function ChequesTab() {
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const { data, loading, execute: fetchCheques } = useApi(getChequesTesoreria, {
    auto: false, initialData: { results: [] },
  });

  useEffect(() => {
    const params = {};
    if (filtroTipo) params.tipo_cheque = filtroTipo;
    if (filtroEstado) params.estado = filtroEstado;
    fetchCheques(params);
  }, [filtroTipo, filtroEstado, fetchCheques]);

  const cheques = data?.results || data || [];

  const ESTADO_BADGE = {
    en_cartera: "info", depositado: "warning", acreditado: "success",
    rechazado: "danger", emitido: "warning", cobrado: "success", anulado: "default",
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-end gap-4">
        <div className="min-w-[140px]">
          <label className="text-xs font-medium text-slate-500 block mb-1">Tipo</label>
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm">
            <option value="">Todos</option>
            <option value="recibido">Recibidos</option>
            <option value="emitido">Emitidos</option>
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className="text-xs font-medium text-slate-500 block mb-1">Estado</label>
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm">
            <option value="">Todos</option>
            <option value="en_cartera">En Cartera</option>
            <option value="depositado">Depositado</option>
            <option value="acreditado">Acreditado</option>
            <option value="rechazado">Rechazado</option>
            <option value="emitido">Emitido</option>
            <option value="cobrado">Cobrado</option>
          </select>
        </div>
      </div>

      {loading ? <LoadingScreen texto="Cargando cheques..." /> : cheques.length === 0 ? (
        <EmptyState icon="📄" titulo="Sin cheques" descripcion="No hay cheques registrados en tesorería." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Nro.</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Banco</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">De / Para</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Monto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Fecha Cobro</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cheques.map((ch) => (
                  <tr key={ch.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-mono text-xs">{ch.numero_cheque}</td>
                    <td className="px-4 py-3 text-slate-700">{ch.banco_emisor}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {ch.tipo_cheque === "recibido" ? (ch.librador || ch.cliente_nombre || "—") : (ch.beneficiario || ch.proveedor_nombre || "—")}
                    </td>
                    <td className="px-4 py-3 text-right font-bold">{formatUSD(ch.monto_usd)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatFecha(ch.fecha_cobro || ch.fecha_emision)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={ESTADO_BADGE[ch.estado] || "default"} className="text-[10px]">{ch.estado}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
