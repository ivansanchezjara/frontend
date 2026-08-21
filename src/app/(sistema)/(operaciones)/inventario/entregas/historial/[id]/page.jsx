"use client";
import { useParams, useRouter } from "next/navigation";
import {
  PageHeader,
  Badge,
  Button,
  LoadingScreen,
} from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { getEntregaDetalle } from "@/services/apis/caja";
import {
  Package, MapPin, Warehouse, Calendar, Hash, Truck, Store,
  CheckCircle2, ShieldCheck, AlertTriangle, RefreshCw, ArrowLeft,
  User, Clock, PackageCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Helpers ────────────────────────────────────────────────────

function formatFecha(fecha) {
  if (!fecha) return "—";
  const d = new Date(fecha);
  return d.toLocaleDateString("es-PY", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatFechaCorta(fecha) {
  if (!fecha) return "—";
  const [year, month, day] = fecha.split("-");
  return `${day}/${month}/${year}`;
}

function formatMonto(valor, moneda) {
  if (valor == null) return "—";
  const num = Number(valor);
  if (moneda === "PYG") return `₲ ${num.toLocaleString("es-PY")}`;
  if (moneda === "USD") return `US$ ${num.toLocaleString("es-PY", { minimumFractionDigits: 2 })}`;
  if (moneda === "BRL") return `R$ ${num.toLocaleString("es-PY", { minimumFractionDigits: 2 })}`;
  return String(valor);
}

const ENTREGA_CONFIG = {
  mostrador: { icon: Store, label: "Retira en mostrador", color: "text-violet-600" },
  delivery: { icon: Truck, label: "Delivery", color: "text-blue-600" },
  retiro_sucursal: { icon: Store, label: "Retiro sucursal", color: "text-teal-600" },
};

// ─── Página de Historial de Entrega (solo lectura) ──────────────

export default function EntregaHistorialDetallePage() {
  const { id } = useParams();
  const router = useRouter();

  const { data: detalle, loading } = useApi(getEntregaDetalle, {
    auto: true,
    args: [id],
    initialData: null,
  });

  if (loading || !detalle) {
    return <LoadingScreen message="Cargando detalle de entrega..." />;
  }

  const lineas = detalle.lineas || [];
  const verificaciones = detalle.verificaciones || [];
  const entregaInfo = ENTREGA_CONFIG[detalle.metodo_entrega] || ENTREGA_CONFIG.mostrador;
  const EntregaIcon = entregaInfo.icon;

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Inventario", href: "/inventario" },
          { label: "Entregas", href: "/inventario/entregas" },
          { label: `Entrega #${id}` },
        ]}
        subtitle={
          <>
            <PackageCheck size={12} />
            Detalle de entrega completada
          </>
        }
      >
        <Button
          variant="ghost"
          size="sm"
          icon={ArrowLeft}
          onClick={() => router.push("/inventario/entregas")}
        >
          Volver
        </Button>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-[1100px] mx-auto space-y-5">

          {/* ─── Banner de entrega completada ─────────────────────── */}
          <div className="bg-emerald-50 rounded-2xl border border-emerald-200 px-6 py-4 flex flex-wrap items-center gap-4">
            <div className="p-2.5 rounded-xl bg-emerald-100">
              <CheckCircle2 size={20} className="text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-emerald-800">Entrega completada</p>
              <div className="flex flex-wrap items-center gap-4 mt-1 text-xs text-emerald-600">
                {detalle.entregado_at && (
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {formatFecha(detalle.entregado_at)}
                  </span>
                )}
                {detalle.entregado_por_username && (
                  <span className="flex items-center gap-1">
                    <User size={11} />
                    {detalle.entregado_por_username}
                  </span>
                )}
              </div>
            </div>
            <Badge variant="success">Entregado</Badge>
          </div>

          {/* ─── Cabecera del pedido ─────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 flex flex-wrap items-center gap-x-8 gap-y-3">
              {/* Cliente */}
              <div className="flex-1 min-w-[200px]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Cliente</p>
                <p className="text-lg font-bold text-slate-800">
                  {detalle.cliente_nombre || "Sin cliente"}
                </p>
              </div>

              {/* Método de entrega */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Entrega</p>
                <span className={cn("flex items-center gap-1.5 text-sm font-semibold", entregaInfo.color)}>
                  <EntregaIcon size={16} />
                  {entregaInfo.label}
                </span>
              </div>

              {/* Total */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total</p>
                <p className="text-lg font-bold text-slate-800">
                  {formatMonto(detalle.total_moneda_negociacion, detalle.moneda_negociacion)}
                </p>
              </div>

              {/* Piezas */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Piezas</p>
                <p className="text-lg font-bold text-slate-800">{detalle.total_items}</p>
              </div>

              {/* Fecha de cobro */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Cobrado</p>
                <p className="text-sm font-medium text-slate-600">{formatFecha(detalle.cobrado_at)}</p>
              </div>
            </div>

            {/* Dirección / observaciones */}
            {(detalle.direccion_entrega || detalle.observaciones_entrega) && (
              <div className="px-6 py-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                {detalle.direccion_entrega && (
                  <span className="flex items-center gap-1 text-blue-600">
                    <MapPin size={12} />{detalle.direccion_entrega}
                  </span>
                )}
                {detalle.observaciones_entrega && (
                  <span className="italic">Obs: {detalle.observaciones_entrega}</span>
                )}
              </div>
            )}
          </div>

          {/* ─── Tabla de ítems entregados ─────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-3 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-500 flex items-center gap-2">
                <Package size={13} />
                Ítems entregados ({lineas.length} líneas)
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 font-bold text-[10px] uppercase tracking-widest bg-slate-50/50">
                    <th className="py-3 px-4 text-left">Código</th>
                    <th className="py-3 px-4 text-left">Producto</th>
                    <th className="py-3 px-4 text-center">Cant.</th>
                    <th className="py-3 px-4 text-left">Lote</th>
                    <th className="py-3 px-4 text-left">Depósito</th>
                    <th className="py-3 px-4 text-left">Vencimiento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lineas.map((linea) => {
                    const asignaciones = linea.asignaciones || [];

                    if (asignaciones.length === 0) {
                      return (
                        <tr key={linea.id} className="hover:bg-slate-50/50">
                          <td className="py-3.5 px-4">
                            <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-700 font-semibold">
                              {linea.product_code}
                            </code>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 font-medium">
                            {linea.producto_nombre}
                            {linea.variante_nombre && linea.variante_nombre !== linea.producto_nombre && (
                              <span className="text-slate-400 ml-1 text-xs">· {linea.variante_nombre}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 font-bold text-slate-800">
                              {linea.cantidad}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">—</td>
                          <td className="py-3.5 px-4 text-slate-400">—</td>
                          <td className="py-3.5 px-4 text-slate-400">—</td>
                        </tr>
                      );
                    }

                    return asignaciones.map((asig, idx) => (
                      <tr key={`${linea.id}-${idx}`} className="hover:bg-slate-50/50">
                        {idx === 0 && (
                          <>
                            <td className="py-3.5 px-4" rowSpan={asignaciones.length}>
                              <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-700 font-semibold">
                                {linea.product_code}
                              </code>
                            </td>
                            <td className="py-3.5 px-4 text-slate-700 font-medium" rowSpan={asignaciones.length}>
                              {linea.producto_nombre}
                              {linea.variante_nombre && linea.variante_nombre !== linea.producto_nombre && (
                                <span className="text-slate-400 ml-1 text-xs">· {linea.variante_nombre}</span>
                              )}
                            </td>
                          </>
                        )}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 font-bold text-slate-800">
                            {asig.cantidad}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="flex items-center gap-1.5 text-slate-700">
                            <Hash size={11} className="text-slate-400" />{asig.lote_codigo}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="flex items-center gap-1.5 text-slate-700">
                            <Warehouse size={11} className="text-slate-400" />{asig.deposito_nombre}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {asig.vencimiento ? (
                            <span className="flex items-center gap-1.5 text-slate-700">
                              <Calendar size={11} className="text-slate-400" />{formatFechaCorta(asig.vencimiento)}
                            </span>
                          ) : <span className="text-slate-400">—</span>}
                        </td>
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── Verificaciones registradas ────────────────────────── */}
          {verificaciones.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                Verificaciones registradas
              </p>
              <div className="flex flex-wrap gap-2">
                {verificaciones.map((v) => (
                  <span
                    key={v.id}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700"
                  >
                    <ShieldCheck size={13} />
                    {v.verificador_nombre}
                    <span className="text-emerald-400 text-[10px]">
                      {new Date(v.verificado_at).toLocaleTimeString("es-PY", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ─── Discrepancias ─────────────────────────────────────── */}
          {(detalle.discrepancias || []).length > 0 && (
            <div className="bg-white rounded-2xl border border-amber-200 shadow-sm px-6 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-3">
                Discrepancias reportadas
              </p>
              <div className="space-y-2">
                {detalle.discrepancias.map((d) => (
                  <div
                    key={d.id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-xl border text-xs",
                      d.resolucion === "reasignado"
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-amber-50 border-amber-200 text-amber-700"
                    )}
                  >
                    {d.resolucion === "reasignado" ? (
                      <RefreshCw size={13} className="shrink-0" />
                    ) : (
                      <AlertTriangle size={13} className="shrink-0" />
                    )}
                    <span className="font-medium">{d.motivo_display}</span>
                    <span className="text-[10px] opacity-70">{d.cantidad_afectada} ud.</span>
                    {d.lote_original_codigo && (
                      <span className="text-[10px] opacity-70">
                        Lote: {d.lote_original_codigo}
                        {d.lote_reasignado_codigo && ` → ${d.lote_reasignado_codigo}`}
                      </span>
                    )}
                    <Badge
                      variant={d.resolucion === "reasignado" ? "info" : "warning"}
                      className="ml-auto text-[9px]"
                    >
                      {d.resolucion_display}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
