"use client";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader, Badge, Button, Section, LoadingScreen } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { getSesionDetalle } from "@/services/apis/caja";
import {
  Wallet, Clock, Lock, Banknote, CreditCard,
  ArrowRightLeft, Smartphone, Receipt, ChevronDown,
  FileText, FileCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Constantes ─────────────────────────────────────────────────

const MONEDAS = [
  { key: "PYG", label: "Guaraníes (PYG)" },
  { key: "USD", label: "Dólares (USD)" },
  { key: "BRL", label: "Reales (BRL)" },
];

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

// ─── Helpers ────────────────────────────────────────────────────

function formatMonto(valor, moneda) {
  if (valor == null) return "—";
  const num = Number(valor);
  if (moneda === "PYG") return `₲ ${num.toLocaleString("es-PY")}`;
  if (moneda === "USD") return `US$ ${num.toLocaleString("es-PY", { minimumFractionDigits: 2 })}`;
  if (moneda === "BRL") return `R$ ${num.toLocaleString("es-PY", { minimumFractionDigits: 2 })}`;
  return String(valor);
}

function formatFecha(fecha) {
  if (!fecha) return "—";
  const d = new Date(fecha);
  return d.toLocaleDateString("es-PY", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── Página ─────────────────────────────────────────────────────

export default function SesionDetallePage() {
  const { id } = useParams();

  const { data: sesion, loading } = useApi(getSesionDetalle, {
    auto: true,
    args: [id],
  });

  // Calcular resumen por método de pago DESDE las ventas cobradas (datos reales)
  const resumenMetodos = useMemo(() => {
    if (!sesion?.ventas_cobradas) return {};
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

    return porMetodo;
  }, [sesion]);

  if (loading || !sesion) {
    return <LoadingScreen message="Cargando sesión..." />;
  }

  const estaAbierta = sesion.estado === "abierta";

  // Calcular ingresos y egresos por moneda
  const totalesPorMoneda = MONEDAS.reduce((acc, { key }) => {
    const movs = sesion.movimientos || [];
    const ingresos = movs
      .filter((m) => m.tipo === "ingreso" && m.moneda === key)
      .reduce((sum, m) => sum + Number(m.monto), 0);
    const egresos = movs
      .filter((m) => m.tipo === "egreso" && m.moneda === key)
      .reduce((sum, m) => sum + Number(m.monto), 0);
    acc[key] = { ingresos, egresos };
    return acc;
  }, {});

  const totalVentas = sesion.ventas_cobradas?.length || 0;

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Sesiones de Caja", href: "/caja/sesiones" },
          { label: `Sesión #${sesion.id}` },
        ]}
        subtitle={
          <>
            <Wallet size={12} />
            {sesion.cajero_nombre} — {formatFecha(sesion.abierta_at)}
          </>
        }
      >
        <Badge variant={estaAbierta ? "success" : "default"}>
          {estaAbierta ? "Abierta" : "Cerrada"}
        </Badge>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0">
        <div className="max-w-[1400px] mx-auto space-y-6">

          {/* ─── Resumen por moneda ─────────────────────────────── */}
          <Section title="Resumen de Caja" subtitle="Fondo inicial, ingresos, egresos y saldo teórico">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-3">Moneda</th>
                    <th className="px-6 py-3 text-right">Fondo Inicial</th>
                    <th className="px-6 py-3 text-right">Ingresos</th>
                    <th className="px-6 py-3 text-right">Egresos</th>
                    <th className="px-6 py-3 text-right">Saldo Teórico</th>
                    {!estaAbierta && <th className="px-6 py-3 text-right">Monto Físico</th>}
                    {!estaAbierta && <th className="px-6 py-3 text-right">Diferencia</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {MONEDAS.map(({ key, label }) => {
                    const fondoKey = `fondo_${key.toLowerCase()}`;
                    const fisicoKey = `fisico_${key.toLowerCase()}`;
                    const difKey = `diferencia_${key.toLowerCase()}`;
                    const saldoTeorico = sesion.saldos_teoricos?.[key];
                    const diferencia = sesion[difKey];
                    const difNum = Number(diferencia) || 0;
                    const { ingresos, egresos } = totalesPorMoneda[key];

                    return (
                      <tr key={key} className="hover:bg-slate-50/50">
                        <td className="px-6 py-3 font-bold text-slate-700">{label}</td>
                        <td className="px-6 py-3 text-right font-medium">{formatMonto(sesion[fondoKey], key)}</td>
                        <td className="px-6 py-3 text-right font-medium text-emerald-600">{formatMonto(ingresos, key)}</td>
                        <td className="px-6 py-3 text-right font-medium text-red-500">{formatMonto(egresos, key)}</td>
                        <td className="px-6 py-3 text-right font-bold text-slate-800">{formatMonto(saldoTeorico, key)}</td>
                        {!estaAbierta && (
                          <td className="px-6 py-3 text-right font-medium">
                            {sesion[fisicoKey] != null ? formatMonto(sesion[fisicoKey], key) : "—"}
                          </td>
                        )}
                        {!estaAbierta && (
                          <td className={cn(
                            "px-6 py-3 text-right font-bold",
                            difNum > 0 ? "text-emerald-600" : difNum < 0 ? "text-red-600" : "text-slate-500"
                          )}>
                            {diferencia != null ? formatMonto(diferencia, key) : "—"}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>

          {/* ─── Desglose por método de pago ────────────────────── */}
          {Object.keys(resumenMetodos).length > 0 && (
            <Section title="Recaudación por Forma de Pago" subtitle="Total recibido por cada método durante la sesión">
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(resumenMetodos).map(([metodo, data]) => {
                    const Icon = METODO_ICONS[metodo] || Banknote;
                    const label = METODO_LABELS[metodo] || metodo;
                    return (
                      <div key={metodo} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-slate-200 shrink-0">
                          <Icon size={16} className="text-slate-500" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-700">{label}</p>
                          <p className="text-[10px] text-slate-400">{data.cantidad} pago{data.cantidad > 1 ? "s" : ""}</p>
                        </div>
                        <div className="text-right">
                          {Object.entries(data.montos).map(([mon, monto]) => (
                            <p key={mon} className="text-sm font-bold text-slate-800">{formatMonto(monto, mon)}</p>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Section>
          )}

          {/* ─── Desglose por Tipo de Documento ──────────────── */}
          {sesion.desglose_por_documento && (
            <DesgloseDocumentoSection desglose={sesion.desglose_por_documento} formatMonto={formatMonto} />
          )}

          {/* ─── Clientes Atendidos (Acordeón) ───────────────────── */}
          <Section
            title="Cobros Realizados"
            subtitle="Cada venta cobrada con su desglose de pagos"
            action={<span className="text-xs text-slate-400 font-bold">{totalVentas} cobro{totalVentas !== 1 ? "s" : ""}</span>}
          >
            {totalVentas > 0 ? (
              <VentasAcordeon ventas={sesion.ventas_cobradas} formatMonto={formatMonto} formatFecha={formatFecha} />
            ) : (
              <div className="px-6 py-12 text-center text-slate-400 text-sm">
                No se realizaron cobros en esta sesión.
              </div>
            )}
          </Section>

          {/* ─── Movimientos técnicos (colapsable) ────────────── */}
          <details className="group">
            <summary className="cursor-pointer list-none">
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors py-2">
                <span className="transition-transform group-open:rotate-90">▶</span>
                Movimientos detallados ({sesion.movimientos?.length || 0})
              </div>
            </summary>
            <div className="mt-2">
              <Section title="Registro de Movimientos" subtitle="Vista técnica de cada ingreso y egreso">
                {sesion.movimientos && sesion.movimientos.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">
                          <th className="px-6 py-3">Fecha</th>
                          <th className="px-6 py-3">Tipo</th>
                          <th className="px-6 py-3">Origen</th>
                          <th className="px-6 py-3">Concepto</th>
                          <th className="px-6 py-3 text-right">Monto</th>
                          <th className="px-6 py-3">Moneda</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {sesion.movimientos.map((mov, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-6 py-3 text-slate-500 text-xs">{formatFecha(mov.created_at)}</td>
                            <td className="px-6 py-3">
                              <Badge variant={mov.tipo === "ingreso" ? "success" : "danger"}>
                                {mov.tipo_display || mov.tipo}
                              </Badge>
                            </td>
                            <td className="px-6 py-3 text-slate-600 font-medium">{mov.origen_display || mov.origen || "—"}</td>
                            <td className="px-6 py-3 text-slate-700">{mov.concepto}</td>
                            <td className={cn("px-6 py-3 text-right font-bold", mov.tipo === "ingreso" ? "text-emerald-600" : "text-red-600")}>
                              {mov.tipo === "ingreso" ? "+" : "−"}{formatMonto(mov.monto, mov.moneda)}
                            </td>
                            <td className="px-6 py-3 text-slate-500 font-medium">{mov.moneda_display || mov.moneda}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-6 py-12 text-center text-slate-400 text-sm">
                    No hay movimientos registrados.
                  </div>
                )}
              </Section>
            </div>
          </details>

          {/* ─── Cerrar Caja ───────────────────────────────────── */}
          {estaAbierta && (
            <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div>
                <p className="text-sm font-bold text-slate-700">Sesión abierta</p>
                <p className="text-xs text-slate-400">Realice el arqueo para cerrar la caja</p>
              </div>
              <Link href={`/caja/sesiones/${id}/cerrar`}>
                <Button variant="danger" icon={Lock}>
                  Cerrar Caja
                </Button>
              </Link>
            </div>
          )}

          {/* Info cierre */}
          {!estaAbierta && sesion.cerrada_at && (
            <div className="text-center text-sm text-slate-400 py-4">
              <Clock size={14} className="inline mr-1" />
              Sesión cerrada el {formatFecha(sesion.cerrada_at)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ─── Desglose por Tipo de Documento ─────────────────────────────

function DesgloseDocumentoSection({ desglose, formatMonto }) {
  const { con_factura, sin_factura, resumen } = desglose;
  const totalVentasDesglose = con_factura.cantidad_ventas + sin_factura.cantidad_ventas;

  if (totalVentasDesglose === 0) return null;

  return (
    <Section
      title="Desglose por Tipo de Documento"
      subtitle="Diferencia entre cobros con factura legal (depositables) y sin factura"
    >
      <div className="p-6 space-y-4">
        {/* Resumen visual */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Con Factura Legal */}
          <div className="bg-emerald-50/70 rounded-xl border border-emerald-200 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 shrink-0">
                <FileCheck size={16} className="text-emerald-600" />
              </span>
              <div>
                <p className="text-sm font-bold text-emerald-800">Con Factura Legal</p>
                <p className="text-[10px] text-emerald-600">
                  {con_factura.cantidad_ventas} venta{con_factura.cantidad_ventas !== 1 ? "s" : ""} — depositable en banco
                </p>
              </div>
            </div>
            <div className="space-y-1">
              {Number(con_factura.totales_por_moneda.PYG) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-700">PYG</span>
                  <span className="font-black text-emerald-800">{formatMonto(con_factura.totales_por_moneda.PYG, "PYG")}</span>
                </div>
              )}
              {Number(con_factura.totales_por_moneda.USD) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-700">USD</span>
                  <span className="font-black text-emerald-800">{formatMonto(con_factura.totales_por_moneda.USD, "USD")}</span>
                </div>
              )}
              {Number(con_factura.totales_por_moneda.BRL) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-700">BRL</span>
                  <span className="font-black text-emerald-800">{formatMonto(con_factura.totales_por_moneda.BRL, "BRL")}</span>
                </div>
              )}
              {Number(con_factura.totales_por_moneda.PYG) === 0 &&
               Number(con_factura.totales_por_moneda.USD) === 0 &&
               Number(con_factura.totales_por_moneda.BRL) === 0 && (
                <p className="text-xs text-emerald-600 italic">Sin ventas facturadas</p>
              )}
            </div>
          </div>

          {/* Sin Factura (Comprobante Interno) */}
          <div className="bg-amber-50/70 rounded-xl border border-amber-200 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 shrink-0">
                <FileText size={16} className="text-amber-600" />
              </span>
              <div>
                <p className="text-sm font-bold text-amber-800">Comprobante Interno</p>
                <p className="text-[10px] text-amber-600">
                  {sin_factura.cantidad_ventas} venta{sin_factura.cantidad_ventas !== 1 ? "s" : ""} — sin respaldo fiscal
                </p>
              </div>
            </div>
            <div className="space-y-1">
              {Number(sin_factura.totales_por_moneda.PYG) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-amber-700">PYG</span>
                  <span className="font-black text-amber-800">{formatMonto(sin_factura.totales_por_moneda.PYG, "PYG")}</span>
                </div>
              )}
              {Number(sin_factura.totales_por_moneda.USD) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-amber-700">USD</span>
                  <span className="font-black text-amber-800">{formatMonto(sin_factura.totales_por_moneda.USD, "USD")}</span>
                </div>
              )}
              {Number(sin_factura.totales_por_moneda.BRL) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-amber-700">BRL</span>
                  <span className="font-black text-amber-800">{formatMonto(sin_factura.totales_por_moneda.BRL, "BRL")}</span>
                </div>
              )}
              {Number(sin_factura.totales_por_moneda.PYG) === 0 &&
               Number(sin_factura.totales_por_moneda.USD) === 0 &&
               Number(sin_factura.totales_por_moneda.BRL) === 0 && (
                <p className="text-xs text-amber-600 italic">Sin ventas con comprobante interno</p>
              )}
            </div>
          </div>
        </div>

        {/* Detalle de ventas por tipo (colapsable) */}
        {(con_factura.ventas.length > 0 || sin_factura.ventas.length > 0) && (
          <details className="group">
            <summary className="cursor-pointer list-none">
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors py-1">
                <span className="transition-transform group-open:rotate-90">▶</span>
                Ver detalle de ventas por tipo de documento
              </div>
            </summary>
            <div className="mt-3 space-y-4">
              {/* Ventas con factura */}
              {con_factura.ventas.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2">
                    Ventas con factura legal ({con_factura.ventas.length})
                  </p>
                  <div className="space-y-1">
                    {con_factura.ventas.map((v) => (
                      <div key={v.id} className="flex items-center gap-3 px-3 py-2 bg-emerald-50/50 rounded-lg text-sm">
                        <span className="text-xs font-bold text-emerald-600">#{v.id}</span>
                        <span className="text-slate-700 flex-1 truncate">{v.cliente}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">{v.factura_numero}</span>
                        <span className="font-bold text-slate-800 shrink-0">{formatMonto(v.total, v.moneda)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ventas sin factura */}
              {sin_factura.ventas.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-2">
                    Ventas con comprobante interno ({sin_factura.ventas.length})
                  </p>
                  <div className="space-y-1">
                    {sin_factura.ventas.map((v) => (
                      <div key={v.id} className="flex items-center gap-3 px-3 py-2 bg-amber-50/50 rounded-lg text-sm">
                        <span className="text-xs font-bold text-amber-600">#{v.id}</span>
                        <span className="text-slate-700 flex-1 truncate">{v.cliente}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          Comp. #{v.comprobante_numero || "—"}
                        </span>
                        <span className="font-bold text-slate-800 shrink-0">{formatMonto(v.total, v.moneda)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </details>
        )}
      </div>
    </Section>
  );
}

// ─── Acordeón de Cobros Realizados ──────────────────────────────

function VentasAcordeon({ ventas, formatMonto, formatFecha }) {
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div className="divide-y divide-slate-100">
      {ventas.map((venta) => {
        const isOpen = expandedId === venta.id;
        return (
          <div key={venta.id}>
            <button
              type="button"
              onClick={() => setExpandedId(isOpen ? null : venta.id)}
              className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-slate-50/50 transition-colors"
            >
              <ChevronDown
                size={14}
                className={cn("text-slate-400 shrink-0 transition-transform", isOpen && "rotate-180")}
              />
              <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded shrink-0">
                #{venta.id}
              </span>
              <span className="text-sm font-bold text-slate-800 truncate flex-1">
                {venta.cliente_nombre}
              </span>
              <span className="text-xs text-slate-400 hidden sm:block shrink-0">
                {formatFecha(venta.cobrado_at)}
              </span>
              <span className="text-sm font-black text-slate-800 shrink-0">
                {formatMonto(venta.total, venta.moneda)}
              </span>
            </button>

            {isOpen && (
              <div className="px-6 pb-4 pl-14 space-y-2">
                {venta.pagos && venta.pagos.length > 0 ? (
                  venta.pagos.map((pago, idx) => {
                    const Icon = METODO_ICONS[pago.metodo] || Banknote;
                    const label = METODO_LABELS[pago.metodo] || pago.metodo;
                    return (
                      <div key={idx} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg">
                        <Icon size={14} className="text-slate-400 shrink-0" />
                        <span className="text-sm text-slate-700 flex-1">{label}</span>
                        {pago.referencia && (
                          <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                            {pago.referencia}
                          </span>
                        )}
                        <span className="text-sm font-bold text-slate-800">
                          {formatMonto(pago.monto, pago.moneda || venta.moneda)}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400">Sin detalle de pagos</p>
                )}

                {venta.vuelto && Number(venta.vuelto) > 0 && (
                  <div className="flex items-center gap-3 p-2.5 bg-blue-50 rounded-lg">
                    <ArrowRightLeft size={14} className="text-blue-400 shrink-0" />
                    <span className="text-sm text-blue-700 flex-1">Vuelto entregado</span>
                    <span className="text-sm font-bold text-blue-700">
                      {formatMonto(venta.vuelto, venta.moneda)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
