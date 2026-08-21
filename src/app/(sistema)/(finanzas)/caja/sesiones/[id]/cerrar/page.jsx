"use client";
import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader, Badge, Button, Section, LoadingScreen, MontoInput } from "@/components/ui";
import { useToast } from "@/components/ui/feedback/ToastContext";
import { useApi } from "@/hooks/useApi";
import { getSesionDetalle, cerrarCaja } from "@/services/apis/caja";
import {
  Lock, Banknote, CreditCard, ArrowRightLeft, Smartphone,
  Receipt, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Check,
  FileText, FileCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Constantes ─────────────────────────────────────────────────

function formatMonto(valor, moneda) {
  if (valor == null) return "—";
  const num = Number(valor);
  if (moneda === "PYG") return `₲ ${num.toLocaleString("es-PY")}`;
  if (moneda === "USD") return `US$ ${num.toLocaleString("es-PY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (moneda === "BRL") return `R$ ${num.toLocaleString("es-PY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return String(valor);
}

function formatFecha(fecha) {
  if (!fecha) return "—";
  const d = new Date(fecha);
  return d.toLocaleDateString("es-PY", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const METODO_LABELS = {
  efectivo_pyg: "Efectivo PYG",
  efectivo_usd: "Efectivo USD",
  efectivo_brl: "Efectivo BRL",
  cheque_pyg: "Cheque PYG",
  cheque_usd: "Cheque USD",
  transferencia_pyg: "Transferencia",
  tarjeta_credito: "Tarjeta Crédito",
  tarjeta_debito: "Tarjeta Débito",
  pix: "PIX",
  cuotas: "Cuotas",
};

const METODO_ICONS = {
  efectivo_pyg: Banknote,
  efectivo_usd: Banknote,
  efectivo_brl: Banknote,
  cheque_pyg: Receipt,
  cheque_usd: Receipt,
  transferencia_pyg: ArrowRightLeft,
  tarjeta_credito: CreditCard,
  tarjeta_debito: CreditCard,
  pix: Smartphone,
  cuotas: CreditCard,
};

// Métodos que requieren conteo de efectivo
const METODOS_EFECTIVO = ["efectivo_pyg", "efectivo_usd", "efectivo_brl"];

// ─── Página ─────────────────────────────────────────────────────

export default function CerrarCajaPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useToast();

  const { data: sesion, loading } = useApi(getSesionDetalle, {
    auto: true,
    args: [id],
  });

  const { execute: ejecutarCierre, loading: cerrando } = useApi(cerrarCaja);

  // Estado: montos físicos de efectivo
  const [fisico, setFisico] = useState({ pyg: "", usd: "", brl: "" });

  // Estado: verificación de métodos no-efectivo (el cajero marca que verificó)
  const [verificados, setVerificados] = useState({});

  // ─── Resumen por método ─────────────────────────────────────
  const resumenMetodos = useMemo(() => {
    if (!sesion?.ventas_cobradas) return [];
    const porMetodo = {};

    sesion.ventas_cobradas.forEach((venta) => {
      (venta.pagos || []).forEach((pago) => {
        const key = pago.metodo;
        if (!porMetodo[key]) porMetodo[key] = { cantidad: 0, montos: {} };
        porMetodo[key].cantidad += 1;
        const moneda = pago.moneda || "PYG";
        porMetodo[key].montos[moneda] = (porMetodo[key].montos[moneda] || 0) + Number(pago.monto);
      });
    });

    return Object.entries(porMetodo).map(([metodo, data]) => ({
      metodo,
      ...data,
      esEfectivo: METODOS_EFECTIVO.includes(metodo),
    }));
  }, [sesion]);

  const metodosNoEfectivo = resumenMetodos.filter((m) => !m.esEfectivo);
  const todosVerificados = metodosNoEfectivo.every((m) => verificados[m.metodo]);

  // ─── Handlers ─────────────────────────────────────────────────
  const handleCerrar = async () => {
    if (!todosVerificados && metodosNoEfectivo.length > 0) {
      showToast("Verificá todos los métodos de pago antes de cerrar", "error");
      return;
    }

    try {
      await ejecutarCierre(id, {
        fisico_pyg: Number(fisico.pyg) || 0,
        fisico_usd: Number(fisico.usd) || 0,
        fisico_brl: Number(fisico.brl) || 0,
      });
      showToast("Caja cerrada correctamente", "success");
      router.push(`/caja/sesiones/${id}`);
    } catch (err) {
      showToast(err?.data?.detail || "Error al cerrar la caja", "error");
    }
  };

  if (loading || !sesion) {
    return <LoadingScreen message="Cargando sesión..." />;
  }

  if (sesion.estado !== "abierta") {
    return (
      <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
        <PageHeader breadcrumbs={[{ label: "Sesiones", href: "/caja/sesiones" }, { label: "Cerrar Caja" }]} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <CheckCircle2 size={48} className="text-emerald-400 mx-auto" />
            <p className="text-lg font-bold text-slate-700">Esta sesión ya fue cerrada</p>
            <Button variant="ghost" onClick={() => router.push(`/caja/sesiones/${id}`)}>Ver detalle</Button>
          </div>
        </div>
      </div>
    );
  }

  const saldoTeoricoPyg = Number(sesion.saldos_teoricos?.PYG) || 0;
  const saldoTeoricoUsd = Number(sesion.saldos_teoricos?.USD) || 0;
  const saldoTeoricoBrl = Number(sesion.saldos_teoricos?.BRL) || 0;

  const difPyg = (Number(fisico.pyg) || 0) - saldoTeoricoPyg;
  const difUsd = (Number(fisico.usd) || 0) - saldoTeoricoUsd;
  const difBrl = (Number(fisico.brl) || 0) - saldoTeoricoBrl;
  const hayDiferenciaEfectivo = difPyg !== 0 || difUsd !== 0 || difBrl !== 0;

  const totalCobros = sesion.ventas_cobradas?.length || 0;

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Sesiones de Caja", href: "/caja/sesiones" },
          { label: `Sesión #${sesion.id}`, href: `/caja/sesiones/${id}` },
          { label: "Cerrar Caja" },
        ]}
        subtitle={<><Lock size={12} /> Arqueo y cierre — {sesion.cajero_nombre} — {totalCobros} cobro{totalCobros !== 1 ? "s" : ""} realizados</>}
      />

      <main className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* ─── 1. Resumen rápido ─────────────────────────────── */}
          <Section title="Resumen de la Sesión" subtitle={`Abierta: ${formatFecha(sesion.abierta_at)}`}>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { moneda: "PYG", label: "Guaraníes", fondo: sesion.fondo_pyg, saldo: saldoTeoricoPyg },
                  { moneda: "USD", label: "Dólares", fondo: sesion.fondo_usd, saldo: saldoTeoricoUsd },
                  { moneda: "BRL", label: "Reales", fondo: sesion.fondo_brl, saldo: saldoTeoricoBrl },
                ].map(({ moneda, label, fondo, saldo }) => (
                  <div key={moneda} className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase">{label}</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Fondo inicial</span>
                      <span className="font-medium">{formatMonto(fondo, moneda)}</span>
                    </div>
                    <div className="border-t border-slate-100 pt-2 flex justify-between text-sm">
                      <span className="font-bold text-slate-700">Saldo teórico efectivo</span>
                      <span className="font-black text-slate-800">{formatMonto(saldo, moneda)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* ─── 1b. Desglose por Tipo de Documento ──────────── */}
          {sesion.desglose_por_documento && (() => {
            const { con_factura, sin_factura } = sesion.desglose_por_documento;
            const totalDesglose = con_factura.cantidad_ventas + sin_factura.cantidad_ventas;
            if (totalDesglose === 0) return null;
            return (
              <Section
                title="Desglose por Tipo de Documento"
                subtitle="Lo facturado es depositable en banco con respaldo fiscal"
              >
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Con Factura Legal */}
                    <div className="bg-emerald-50/70 rounded-xl border border-emerald-200 p-4 space-y-2">
                      <div className="flex items-center gap-2 mb-1">
                        <FileCheck size={16} className="text-emerald-600" />
                        <p className="text-sm font-bold text-emerald-800">Con Factura Legal</p>
                      </div>
                      <p className="text-[10px] text-emerald-600">
                        {con_factura.cantidad_ventas} venta{con_factura.cantidad_ventas !== 1 ? "s" : ""}
                      </p>
                      {Number(con_factura.totales_por_moneda.PYG) > 0 && (
                        <p className="text-sm font-black text-emerald-800">{formatMonto(con_factura.totales_por_moneda.PYG, "PYG")}</p>
                      )}
                      {Number(con_factura.totales_por_moneda.USD) > 0 && (
                        <p className="text-sm font-black text-emerald-800">{formatMonto(con_factura.totales_por_moneda.USD, "USD")}</p>
                      )}
                      {Number(con_factura.totales_por_moneda.BRL) > 0 && (
                        <p className="text-sm font-black text-emerald-800">{formatMonto(con_factura.totales_por_moneda.BRL, "BRL")}</p>
                      )}
                    </div>

                    {/* Sin Factura */}
                    <div className="bg-amber-50/70 rounded-xl border border-amber-200 p-4 space-y-2">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText size={16} className="text-amber-600" />
                        <p className="text-sm font-bold text-amber-800">Comprobante Interno</p>
                      </div>
                      <p className="text-[10px] text-amber-600">
                        {sin_factura.cantidad_ventas} venta{sin_factura.cantidad_ventas !== 1 ? "s" : ""}
                      </p>
                      {Number(sin_factura.totales_por_moneda.PYG) > 0 && (
                        <p className="text-sm font-black text-amber-800">{formatMonto(sin_factura.totales_por_moneda.PYG, "PYG")}</p>
                      )}
                      {Number(sin_factura.totales_por_moneda.USD) > 0 && (
                        <p className="text-sm font-black text-amber-800">{formatMonto(sin_factura.totales_por_moneda.USD, "USD")}</p>
                      )}
                      {Number(sin_factura.totales_por_moneda.BRL) > 0 && (
                        <p className="text-sm font-black text-amber-800">{formatMonto(sin_factura.totales_por_moneda.BRL, "BRL")}</p>
                      )}
                    </div>
                  </div>
                </div>
              </Section>
            );
          })()}

          {/* ─── 2. Verificación de métodos no-efectivo ───────── */}
          {metodosNoEfectivo.length > 0 && (
            <Section
              title="Verificación de Pagos No-Efectivo"
              subtitle="Confirme que los comprobantes y vouchers de cada método están correctos"
            >
              <div className="p-6 space-y-3">
                {metodosNoEfectivo.map(({ metodo, cantidad, montos }) => {
                  const Icon = METODO_ICONS[metodo] || CreditCard;
                  const label = METODO_LABELS[metodo] || metodo;
                  const checked = !!verificados[metodo];

                  return (
                    <label
                      key={metodo}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                        checked
                          ? "border-emerald-200 bg-emerald-50/50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => setVerificados((prev) => ({ ...prev, [metodo]: e.target.checked }))}
                        className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 shrink-0">
                        <Icon size={16} className="text-slate-500" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-700">{label}</p>
                        <p className="text-[10px] text-slate-400">{cantidad} pago{cantidad > 1 ? "s" : ""} — verificar comprobantes/vouchers</p>
                      </div>
                      <div className="text-right shrink-0">
                        {Object.entries(montos).map(([mon, monto]) => (
                          <p key={mon} className="text-sm font-bold text-slate-800">{formatMonto(monto, mon)}</p>
                        ))}
                      </div>
                      {checked && <Check size={18} className="text-emerald-600 shrink-0" />}
                    </label>
                  );
                })}

                {todosVerificados && (
                  <p className="text-xs text-emerald-600 font-bold text-center pt-2">✓ Todos los métodos verificados</p>
                )}
              </div>
            </Section>
          )}

          {/* ─── 3. Conteo de efectivo ────────────────────────── */}
          <Section title="Conteo de Efectivo" subtitle="Cuente el dinero en la gaveta y declare los montos por moneda">
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <MontoInput
                    label="Efectivo PYG contado"
                    value={fisico.pyg}
                    onChange={(val) => setFisico((prev) => ({ ...prev, pyg: val }))}
                    moneda="PYG"
                  />
                  <p className="text-[10px] text-slate-400">Teórico: {formatMonto(saldoTeoricoPyg, "PYG")}</p>
                </div>
                <div className="space-y-2">
                  <MontoInput
                    label="Efectivo USD contado"
                    value={fisico.usd}
                    onChange={(val) => setFisico((prev) => ({ ...prev, usd: val }))}
                    moneda="USD"
                  />
                  <p className="text-[10px] text-slate-400">Teórico: {formatMonto(saldoTeoricoUsd, "USD")}</p>
                </div>
                <div className="space-y-2">
                  <MontoInput
                    label="Efectivo BRL contado"
                    value={fisico.brl}
                    onChange={(val) => setFisico((prev) => ({ ...prev, brl: val }))}
                    moneda="BRL"
                  />
                  <p className="text-[10px] text-slate-400">Teórico: {formatMonto(saldoTeoricoBrl, "BRL")}</p>
                </div>
              </div>

              {/* Diferencias */}
              {(fisico.pyg || fisico.usd || fisico.brl) && (
                <div className={cn(
                  "rounded-xl p-4 border",
                  hayDiferenciaEfectivo ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"
                )}>
                  <div className="flex items-center gap-2 mb-3">
                    {hayDiferenciaEfectivo
                      ? <AlertTriangle size={16} className="text-amber-600" />
                      : <CheckCircle2 size={16} className="text-emerald-600" />
                    }
                    <p className={cn("text-sm font-bold", hayDiferenciaEfectivo ? "text-amber-700" : "text-emerald-700")}>
                      {hayDiferenciaEfectivo ? "Hay diferencias en el efectivo" : "Efectivo cuadra correctamente"}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { moneda: "PYG", dif: difPyg },
                      { moneda: "USD", dif: difUsd },
                      { moneda: "BRL", dif: difBrl },
                    ].map(({ moneda, dif }) => (
                      <div key={moneda} className="text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{moneda}</p>
                        <p className={cn(
                          "text-sm font-black",
                          dif > 0 ? "text-emerald-600" : dif < 0 ? "text-red-600" : "text-slate-500"
                        )}>
                          {dif > 0 ? "+" : ""}{formatMonto(dif, moneda)}
                        </p>
                        {dif !== 0 && (
                          <p className="text-[9px] text-slate-400">
                            {dif > 0 ? <TrendingUp size={9} className="inline" /> : <TrendingDown size={9} className="inline" />}
                            {" "}{dif > 0 ? "Sobrante" : "Faltante"}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* ─── 4. Resumen de recaudación total ──────────────── */}
          {resumenMetodos.length > 0 && (
            <Section title="Recaudación Total" subtitle="Todo lo cobrado durante la sesión por método">
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {resumenMetodos.map(({ metodo, cantidad, montos, esEfectivo }) => {
                    const Icon = METODO_ICONS[metodo] || Banknote;
                    const label = METODO_LABELS[metodo] || metodo;
                    const checked = esEfectivo || verificados[metodo];
                    return (
                      <div key={metodo} className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border",
                        checked ? "bg-emerald-50/50 border-emerald-100" : "bg-slate-50 border-slate-100"
                      )}>
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-slate-200 shrink-0">
                          <Icon size={16} className="text-slate-500" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-700">{label}</p>
                          <p className="text-[10px] text-slate-400">{cantidad} pago{cantidad > 1 ? "s" : ""}</p>
                        </div>
                        <div className="text-right">
                          {Object.entries(montos).map(([mon, monto]) => (
                            <p key={mon} className="text-sm font-bold text-slate-800">{formatMonto(monto, mon)}</p>
                          ))}
                        </div>
                        {checked && <Check size={14} className="text-emerald-500 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Section>
          )}

          {/* ─── 5. Confirmar cierre ──────────────────────────── */}
          <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div>
              <p className="text-sm font-bold text-slate-700">¿Confirmar cierre de caja?</p>
              <p className="text-xs text-slate-400">Esta acción no se puede deshacer</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => router.push(`/caja/sesiones/${id}`)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                icon={Lock}
                onClick={handleCerrar}
                disabled={cerrando || (!todosVerificados && metodosNoEfectivo.length > 0)}
              >
                {cerrando ? "Cerrando..." : "Confirmar Cierre"}
              </Button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
