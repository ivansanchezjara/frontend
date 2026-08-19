"use client";
import { useState, useEffect } from "react";
import {
  PageHeader, Badge, LoadingScreen, EmptyState,
  Button, Input, useToast, useConfirm,
} from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import {
  getLineasCredito, createLineaCredito, updateLineaCredito,
  bloquearLineaCredito, desbloquearLineaCredito,
} from "@/services/apis/cobranzas";
import { Users, Plus, ShieldAlert, ShieldCheck, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";

function formatUSD(v) { return v == null ? "—" : `US$ ${Number(v).toLocaleString("es-PY", { minimumFractionDigits: 2 })}`; }

const ESTADO_BADGE = {
  activa: { variant: "success", label: "Activa" },
  suspendida: { variant: "warning", label: "Suspendida" },
  bloqueada: { variant: "danger", label: "Bloqueada" },
};

export default function LineasCreditoPage() {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ cliente: "", monto_aprobado_usd: "", observaciones: "" });

  const { data, loading, execute: fetchLineas } = useApi(getLineasCredito, {
    auto: false, initialData: { results: [] },
  });

  useEffect(() => { fetchLineas(); }, [fetchLineas]);

  const lineas = data?.results || data || [];

  const handleCrear = async () => {
    if (!form.cliente || !form.monto_aprobado_usd) {
      showToast("Completá cliente y monto", "error"); return;
    }
    try {
      await createLineaCredito({ cliente: Number(form.cliente), monto_aprobado_usd: Number(form.monto_aprobado_usd), observaciones: form.observaciones });
      showToast("Línea de crédito creada", "success");
      setShowForm(false);
      fetchLineas();
    } catch (err) { showToast(err?.data?.detail || err?.data?.cliente?.[0] || "Error", "error"); }
  };

  const handleBloquear = async (id, nombre) => {
    const ok = await confirm(`¿Bloquear la línea de crédito de ${nombre}? No podrá comprar a crédito.`, "Bloquear");
    if (!ok) return;
    try {
      await bloquearLineaCredito(id, { motivo: "Bloqueo manual por mora" });
      showToast("Línea bloqueada", "success");
      fetchLineas();
    } catch (err) { showToast(err?.data?.detail || "Error", "error"); }
  };

  const handleDesbloquear = async (id) => {
    try {
      await desbloquearLineaCredito(id, { observaciones: "Desbloqueado manualmente" });
      showToast("Línea desbloqueada", "success");
      fetchLineas();
    } catch (err) { showToast(err?.data?.detail || "Error", "error"); }
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[{ label: "Ingresos", href: "/ingresos" }, { label: "Líneas de Crédito" }]}
        subtitle={<><Users size={12} /> Aprobación y control de crédito por cliente</>}
      >
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowForm(true)}>Nueva Línea</Button>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 min-w-0">
        <div className="max-w-[1100px] mx-auto space-y-6">

          {showForm && (
            <div className="bg-white rounded-2xl border border-purple-200 shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Nueva línea de crédito</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 block mb-1">ID Cliente (CuentaComercial)</label>
                  <input type="number" value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" placeholder="ID del cliente" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 block mb-1">Monto aprobado (USD)</label>
                  <input type="number" step="0.01" value={form.monto_aprobado_usd} onChange={(e) => setForm({ ...form, monto_aprobado_usd: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 block mb-1">Observaciones</label>
                  <input type="text" value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="primary" size="sm" icon={Save} onClick={handleCrear}>Crear</Button>
                <Button variant="ghost" size="sm" icon={X} onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </div>
          )}

          {loading ? <LoadingScreen message="Cargando líneas..." /> : lineas.length === 0 ? (
            <EmptyState icon="💳" titulo="Sin líneas de crédito" descripcion="No hay líneas de crédito registradas." />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase">Cliente</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Aprobado</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Utilizado</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Disponible</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Estado</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lineas.map((l) => {
                      const badge = ESTADO_BADGE[l.estado] || ESTADO_BADGE.activa;
                      return (
                        <tr key={l.id} className={cn("hover:bg-slate-50/60", l.estado === "bloqueada" && "bg-red-50/30")}>
                          <td className="px-5 py-3 font-medium text-slate-800">{l.cliente_nombre}</td>
                          <td className="px-4 py-3 text-right">{formatUSD(l.monto_aprobado_usd)}</td>
                          <td className="px-4 py-3 text-right text-amber-600 font-medium">{formatUSD(l.saldo_utilizado)}</td>
                          <td className="px-4 py-3 text-right text-emerald-600 font-bold">{formatUSD(l.saldo_disponible)}</td>
                          <td className="px-4 py-3 text-center"><Badge variant={badge.variant} className="text-[10px]">{badge.label}</Badge></td>
                          <td className="px-4 py-3 text-center">
                            {l.estado === "activa" && (
                              <button onClick={() => handleBloquear(l.id, l.cliente_nombre)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold text-red-600 hover:bg-red-50">
                                <ShieldAlert size={12} /> Bloquear
                              </button>
                            )}
                            {l.estado === "bloqueada" && (
                              <button onClick={() => handleDesbloquear(l.id)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold text-emerald-600 hover:bg-emerald-50">
                                <ShieldCheck size={12} /> Desbloquear
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
