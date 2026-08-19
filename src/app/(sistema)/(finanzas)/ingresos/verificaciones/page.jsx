"use client";
import { useState, useEffect } from "react";
import {
  PageHeader, Pagination, Badge, LoadingScreen, EmptyState,
  Button, useToast, useConfirm,
} from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { getPagosCobranza, verificarPago } from "@/services/apis/cobranzas";
import { FileCheck, CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

function formatUSD(v) { return v == null ? "—" : `US$ ${Number(v).toLocaleString("es-PY", { minimumFractionDigits: 2 })}`; }
function formatFecha(f) { if (!f) return "—"; const d = new Date(f); return d.toLocaleDateString("es-PY", { day: "2-digit", month: "2-digit", year: "numeric" }); }

export default function VerificacionesPage() {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [page, setPage] = useState(1);
  const [soloP, setSoloP] = useState(true);

  const { data, loading, execute: fetchPagos } = useApi(getPagosCobranza, {
    auto: false, initialData: { results: [], count: 0 },
  });

  useEffect(() => {
    const params = { page };
    if (soloP) params.pendiente_verificacion = "true";
    fetchPagos(params);
  }, [page, soloP, fetchPagos]);

  const pagos = data?.results || [];
  const totalCount = data?.count || 0;

  const handleVerificar = async (id, confirmado) => {
    const msg = confirmado ? "¿Confirmar que este pago ingresó al banco?" : "¿Rechazar este pago? El saldo no se reducirá.";
    const ok = await confirm(msg, confirmado ? "Verificar Pago" : "Rechazar Pago");
    if (!ok) return;
    try {
      await verificarPago(id, { confirmado, observaciones: confirmado ? "Confirmado en extracto bancario" : "No se encontró en extracto" });
      showToast(confirmado ? "Pago verificado" : "Pago rechazado", "success");
      fetchPagos({ page, ...(soloP ? { pendiente_verificacion: "true" } : {}) });
    } catch (err) { showToast(err?.data?.detail || "Error", "error"); }
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[{ label: "Ingresos", href: "/ingresos" }, { label: "Verificaciones Bancarias" }]}
        subtitle={<><FileCheck size={12} /> Confirmar pagos por transferencia y tarjeta</>}
      />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 min-w-0">
        <div className="max-w-[1200px] mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={soloP} onChange={(e) => { setSoloP(e.target.checked); setPage(1); }}
                className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500" />
              Solo pendientes de verificación
            </label>
          </div>

          {loading ? <LoadingScreen message="Cargando pagos..." /> : pagos.length === 0 ? (
            <EmptyState icon="✅" titulo="Sin pagos pendientes" descripcion="Todos los pagos están verificados." />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Cliente</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Método</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Referencia</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Monto USD</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Fecha</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Estado</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pagos.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3 text-slate-800 font-medium">{p.cliente_nombre}</td>
                        <td className="px-4 py-3 text-slate-600">{p.metodo_display}</td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-xs">{p.referencia || "—"}</td>
                        <td className="px-4 py-3 text-right font-bold">{formatUSD(p.monto_usd)}</td>
                        <td className="px-4 py-3 text-slate-600">{formatFecha(p.fecha_pago)}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={p.estado === "pendiente_verificacion" ? "warning" : p.estado === "verificado" ? "success" : "danger"} className="text-[10px]">
                            {p.estado_display}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {p.estado === "pendiente_verificacion" && (
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => handleVerificar(p.id, true)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600" title="Verificar">
                                <CheckCircle2 size={16} />
                              </button>
                              <button onClick={() => handleVerificar(p.id, false)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600" title="Rechazar">
                                <XCircle size={16} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
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
