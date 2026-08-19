"use client";
import { useState, useEffect } from "react";
import {
  PageHeader, Pagination, Badge, LoadingScreen, EmptyState,
  Input, Button, useToast, useConfirm,
} from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { getCuentasPorCobrar, registrarPagoCuenta } from "@/services/apis/cobranzas";
import {
  DollarSign, ChevronDown, ChevronUp, Calendar, Hash, X,
  CreditCard, Clock, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

function formatUSD(v) {
  if (v == null) return "—";
  return `US$ ${Number(v).toLocaleString("es-PY", { minimumFractionDigits: 2 })}`;
}
function formatFecha(f) {
  if (!f) return "—";
  const [y, m, d] = f.split("-");
  return `${d}/${m}/${y}`;
}

const ESTADO_BADGE = {
  vigente: { variant: "info", label: "Vigente" },
  pagada: { variant: "success", label: "Pagada" },
  vencida: { variant: "warning", label: "Vencida" },
  en_mora: { variant: "danger", label: "En Mora" },
  anulada: { variant: "default", label: "Anulada" },
};

const CUOTA_BADGE = {
  pendiente: { variant: "default", label: "Pendiente" },
  pagada: { variant: "success", label: "Pagada" },
  vencida: { variant: "warning", label: "Vencida" },
  parcial: { variant: "info", label: "Parcial" },
};

export default function CuentasPorCobrarPage() {
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [pagoForm, setPagoForm] = useState(null);

  const { data, loading, execute: fetchCuentas } = useApi(getCuentasPorCobrar, {
    auto: false, initialData: { results: [], count: 0 },
  });
  const { execute: ejecutarPago, loading: registrando } = useApi(registrarPagoCuenta, {
    auto: false, handleError: false,
  });

  useEffect(() => {
    const params = { page };
    if (filtroEstado) params.estado = filtroEstado;
    fetchCuentas(params);
  }, [page, filtroEstado, fetchCuentas]);

  const cuentas = data?.results || [];
  const totalCount = data?.count || 0;

  const handleRegistrarPago = async () => {
    if (!pagoForm) return;
    try {
      await ejecutarPago(pagoForm.cuentaId, {
        monto_recibido: Number(pagoForm.monto),
        moneda: pagoForm.moneda,
        monto_usd: Number(pagoForm.montoUsd),
        metodo: pagoForm.metodo,
        fecha_pago: pagoForm.fecha,
        referencia: pagoForm.referencia,
        cuota_id: pagoForm.cuotaId || null,
      });
      showToast("Pago registrado", "success");
      setPagoForm(null);
      fetchCuentas({ page });
    } catch (err) {
      showToast(err?.data?.detail || "Error al registrar pago", "error");
    }
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Ingresos", href: "/ingresos" },
          { label: "Cuentas por Cobrar" },
        ]}
        subtitle={<><DollarSign size={12} /> Deuda de clientes y registro de pagos</>}
      />

      <main className="flex-1 overflow-y-auto p-4 md:p-8 min-w-0">
        <div className="max-w-[1200px] mx-auto space-y-6">
          {/* Filtros */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-end gap-4">
            <div className="min-w-[150px]">
              <label className="text-xs font-medium text-slate-500 block mb-1">Estado</label>
              <select
                value={filtroEstado}
                onChange={(e) => { setFiltroEstado(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
              >
                <option value="">Todos</option>
                <option value="vigente">Vigente</option>
                <option value="vencida">Vencida</option>
                <option value="en_mora">En Mora</option>
                <option value="pagada">Pagada</option>
              </select>
            </div>
            {filtroEstado && (
              <Button variant="ghost" size="sm" icon={X} onClick={() => { setFiltroEstado(""); setPage(1); }}>
                Limpiar
              </Button>
            )}
          </div>

          {/* Lista */}
          {loading ? <LoadingScreen message="Cargando cuentas..." /> : cuentas.length === 0 ? (
            <EmptyState icon="💰" titulo="Sin cuentas por cobrar" descripcion="No hay deuda pendiente registrada." />
          ) : (
            <div className="space-y-3">
              {cuentas.map((cuenta) => {
                const badge = ESTADO_BADGE[cuenta.estado] || ESTADO_BADGE.vigente;
                const isExpanded = expandedId === cuenta.id;
                return (
                  <div key={cuenta.id} className={cn("bg-white rounded-2xl border shadow-sm overflow-hidden transition-all", isExpanded ? "ring-2 ring-purple-200" : "border-slate-200")}>
                    <button type="button" onClick={() => setExpandedId(isExpanded ? null : cuenta.id)}
                      className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-slate-50/50 transition-colors cursor-pointer">
                      <span className="text-xs font-bold text-slate-400">#{cuenta.id}</span>
                      <span className="text-sm font-bold text-slate-800 truncate flex-1">{cuenta.cliente_nombre}</span>
                      <span className="text-xs text-slate-400 hidden sm:block">Vence: {formatFecha(cuenta.fecha_vencimiento)}</span>
                      <Badge variant={badge.variant} className="text-[10px]">{badge.label}</Badge>
                      <span className="text-sm font-bold text-slate-700">{formatUSD(cuenta.saldo_pendiente_usd)}</span>
                      {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </button>

                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/30 px-6 py-4 space-y-4">
                        {/* Info */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div><p className="text-slate-400">Total</p><p className="font-bold">{formatUSD(cuenta.monto_total_usd)}</p></div>
                          <div><p className="text-slate-400">Pagado</p><p className="font-bold text-emerald-600">{formatUSD(cuenta.monto_total_usd - cuenta.saldo_pendiente_usd)}</p></div>
                          <div><p className="text-slate-400">Pendiente</p><p className="font-bold text-amber-600">{formatUSD(cuenta.saldo_pendiente_usd)}</p></div>
                          <div><p className="text-slate-400">Condición</p><p className="font-bold">{cuenta.condicion_pago}</p></div>
                        </div>

                        {/* Cuotas */}
                        {cuenta.cuotas?.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Cuotas</p>
                            <div className="space-y-1.5">
                              {cuenta.cuotas.map((c) => {
                                const cb = CUOTA_BADGE[c.estado] || CUOTA_BADGE.pendiente;
                                return (
                                  <div key={c.id} className="flex items-center gap-3 bg-white rounded-lg border border-slate-100 px-3 py-2 text-xs">
                                    <span className="font-bold text-slate-500 w-8">#{c.numero_cuota}</span>
                                    <span className="flex-1">{formatUSD(c.monto_usd)}</span>
                                    <span className="text-slate-400">{formatFecha(c.fecha_vencimiento)}</span>
                                    <Badge variant={cb.variant} className="text-[9px]">{cb.label}</Badge>
                                    {c.estado === "pendiente" && cuenta.saldo_pendiente_usd > 0 && (
                                      <button
                                        onClick={() => setPagoForm({ cuentaId: cuenta.id, cuotaId: c.id, monto: "", montoUsd: c.saldo_restante, moneda: "USD", metodo: "efectivo", fecha: new Date().toISOString().split("T")[0], referencia: "" })}
                                        className="text-[10px] font-bold text-purple-600 hover:text-purple-800"
                                      >
                                        Pagar
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Botón pago general */}
                        {cuenta.saldo_pendiente_usd > 0 && !pagoForm && (
                          <Button variant="primary" size="sm" icon={CreditCard}
                            onClick={() => setPagoForm({ cuentaId: cuenta.id, cuotaId: null, monto: "", montoUsd: "", moneda: "PYG", metodo: "efectivo", fecha: new Date().toISOString().split("T")[0], referencia: "" })}>
                            Registrar Pago
                          </Button>
                        )}

                        {/* Form de pago inline */}
                        {pagoForm && pagoForm.cuentaId === cuenta.id && (
                          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
                            <p className="text-xs font-bold text-purple-700">Registrar pago</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="text-[10px] text-purple-600">Monto USD</label>
                                <input type="number" step="0.01" value={pagoForm.montoUsd} onChange={(e) => setPagoForm({ ...pagoForm, montoUsd: e.target.value })}
                                  className="w-full px-3 py-2 rounded-lg border border-purple-300 text-sm mt-1" />
                              </div>
                              <div>
                                <label className="text-[10px] text-purple-600">Método</label>
                                <select value={pagoForm.metodo} onChange={(e) => setPagoForm({ ...pagoForm, metodo: e.target.value })}
                                  className="w-full px-3 py-2 rounded-lg border border-purple-300 text-sm mt-1">
                                  <option value="efectivo">Efectivo</option>
                                  <option value="transferencia">Transferencia</option>
                                  <option value="cheque">Cheque</option>
                                  <option value="tarjeta_credito">Tarjeta Crédito</option>
                                  <option value="tarjeta_debito">Tarjeta Débito</option>
                                  <option value="deposito">Depósito</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] text-purple-600">Fecha</label>
                                <input type="date" value={pagoForm.fecha} onChange={(e) => setPagoForm({ ...pagoForm, fecha: e.target.value })}
                                  className="w-full px-3 py-2 rounded-lg border border-purple-300 text-sm mt-1" />
                              </div>
                              <div className="col-span-2">
                                <label className="text-[10px] text-purple-600">Referencia (nro. transferencia, voucher...)</label>
                                <input type="text" value={pagoForm.referencia} onChange={(e) => setPagoForm({ ...pagoForm, referencia: e.target.value })}
                                  className="w-full px-3 py-2 rounded-lg border border-purple-300 text-sm mt-1" />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="primary" size="sm" onClick={handleRegistrarPago} loading={registrando || undefined}>Confirmar Pago</Button>
                              <Button variant="ghost" size="sm" onClick={() => setPagoForm(null)}>Cancelar</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!loading && totalCount > PAGE_SIZE && (
            <Pagination count={totalCount} pageSize={PAGE_SIZE} currentPage={page} onPageChange={setPage} />
          )}
        </div>
      </main>
    </div>
  );
}
