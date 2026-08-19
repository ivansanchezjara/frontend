"use client";
import { useState, useEffect } from "react";
import {
  PageHeader, Pagination, Badge, LoadingScreen, EmptyState,
  Button, useToast, useConfirm,
} from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { getCheques, depositarCheque, confirmarCobroCheque, rechazarCheque } from "@/services/apis/cobranzas";
import { Landmark, Calendar, Hash, X, CheckCircle2, XCircle, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

function formatMonto(v, moneda) {
  if (v == null) return "—";
  const num = Number(v);
  if (moneda === "PYG") return `₲ ${num.toLocaleString("es-PY")}`;
  if (moneda === "USD") return `US$ ${num.toLocaleString("es-PY", { minimumFractionDigits: 2 })}`;
  return `R$ ${num.toLocaleString("es-PY", { minimumFractionDigits: 2 })}`;
}
function formatFecha(f) {
  if (!f) return "—";
  const [y, m, d] = f.split("-");
  return `${d}/${m}/${y}`;
}

const ESTADO_BADGE = {
  en_cartera: { variant: "info", label: "En Cartera" },
  depositado: { variant: "warning", label: "Depositado" },
  cobrado: { variant: "success", label: "Cobrado" },
  rechazado: { variant: "danger", label: "Rechazado" },
  vencido: { variant: "default", label: "Vencido" },
  endosado: { variant: "default", label: "Endosado" },
};

export default function ChequesPage() {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [page, setPage] = useState(1);
  const [filtroEstado, setFiltroEstado] = useState("");

  const { data, loading, execute: fetchCheques } = useApi(getCheques, {
    auto: false, initialData: { results: [], count: 0 },
  });

  useEffect(() => {
    const params = { page };
    if (filtroEstado) params.estado = filtroEstado;
    fetchCheques(params);
  }, [page, filtroEstado, fetchCheques]);

  const cheques = data?.results || [];
  const totalCount = data?.count || 0;

  const handleDepositar = async (id) => {
    try {
      await depositarCheque(id);
      showToast("Cheque marcado como depositado", "success");
      fetchCheques({ page });
    } catch (err) { showToast(err?.data?.detail || "Error", "error"); }
  };

  const handleCobrar = async (id) => {
    try {
      await confirmarCobroCheque(id);
      showToast("Cheque cobrado exitosamente", "success");
      fetchCheques({ page });
    } catch (err) { showToast(err?.data?.detail || "Error", "error"); }
  };

  const handleRechazar = async (id) => {
    const ok = await confirm("¿Marcar cheque como rechazado por el banco?", "Rechazar Cheque");
    if (!ok) return;
    try {
      await rechazarCheque(id, { motivo: "Rechazado por el banco" });
      showToast("Cheque rechazado", "success");
      fetchCheques({ page });
    } catch (err) { showToast(err?.data?.detail || "Error", "error"); }
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[{ label: "Ingresos", href: "/ingresos" }, { label: "Cartera de Cheques" }]}
        subtitle={<><Landmark size={12} /> Cheques recibidos y calendario de cobro</>}
      />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 min-w-0">
        <div className="max-w-[1200px] mx-auto space-y-6">
          {/* Filtro */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-end gap-4">
            <div className="min-w-[150px]">
              <label className="text-xs font-medium text-slate-500 block mb-1">Estado</label>
              <select value={filtroEstado} onChange={(e) => { setFiltroEstado(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm">
                <option value="">Todos</option>
                <option value="en_cartera">En Cartera</option>
                <option value="depositado">Depositado</option>
                <option value="cobrado">Cobrado</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </div>
            {filtroEstado && <Button variant="ghost" size="sm" icon={X} onClick={() => { setFiltroEstado(""); setPage(1); }}>Limpiar</Button>}
          </div>

          {/* Lista */}
          {loading ? <LoadingScreen message="Cargando cheques..." /> : cheques.length === 0 ? (
            <EmptyState icon="🏦" titulo="Sin cheques" descripcion="No hay cheques registrados." />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Nro.</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Banco</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Cliente</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Monto</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Cobrar el</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Estado</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cheques.map((ch) => {
                      const badge = ESTADO_BADGE[ch.estado] || ESTADO_BADGE.en_cartera;
                      return (
                        <tr key={ch.id} className="hover:bg-slate-50/60">
                          <td className="px-4 py-3 font-mono text-xs">{ch.numero_cheque}</td>
                          <td className="px-4 py-3 text-slate-700">{ch.banco_emisor}</td>
                          <td className="px-4 py-3 text-slate-700">{ch.cliente_nombre}{ch.es_tercero && <span className="text-[10px] text-amber-500 ml-1">(tercero)</span>}</td>
                          <td className="px-4 py-3 text-right font-bold">{formatMonto(ch.monto, ch.moneda)}</td>
                          <td className="px-4 py-3 text-slate-600">{formatFecha(ch.fecha_cobro)}</td>
                          <td className="px-4 py-3 text-center"><Badge variant={badge.variant} className="text-[10px]">{badge.label}</Badge></td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {ch.estado === "en_cartera" && (
                                <button onClick={() => handleDepositar(ch.id)} className="px-2 py-1 rounded text-[10px] font-bold text-blue-600 hover:bg-blue-50" title="Depositar">
                                  <ArrowDown size={12} />
                                </button>
                              )}
                              {(ch.estado === "en_cartera" || ch.estado === "depositado") && (
                                <>
                                  <button onClick={() => handleCobrar(ch.id)} className="px-2 py-1 rounded text-[10px] font-bold text-emerald-600 hover:bg-emerald-50" title="Cobrado">
                                    <CheckCircle2 size={12} />
                                  </button>
                                  <button onClick={() => handleRechazar(ch.id)} className="px-2 py-1 rounded text-[10px] font-bold text-red-600 hover:bg-red-50" title="Rechazado">
                                    <XCircle size={12} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {!loading && totalCount > PAGE_SIZE && <Pagination count={totalCount} pageSize={PAGE_SIZE} currentPage={page} onPageChange={setPage} />}
        </div>
      </main>
    </div>
  );
}
