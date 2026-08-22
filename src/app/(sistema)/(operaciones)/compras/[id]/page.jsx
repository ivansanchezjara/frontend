"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Ship, Package, CreditCard, CheckCircle, Trash2,
} from "lucide-react";
import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import { getOrdenCompra, recepcionParcialOrden, marcarRecibidaOrden, cancelarOrden } from "@/services/apis/compras";
import { PageHeader, Button, LoadingScreen, useToast } from "@/components/ui";
import { useConfirm } from "@/components/ui/feedback/ConfirmContext";
import RegistrarPagoModal from "@/components/compras/RegistrarPagoModal";
import VincularIngresoModal from "@/components/compras/VincularIngresoModal";

function formatUSD(v) {
  if (v == null) return "—";
  return `US$ ${Number(v).toLocaleString("es-PY", { minimumFractionDigits: 2 })}`;
}

function formatFecha(f) {
  if (!f) return "—";
  return new Date(f).toLocaleDateString("es-PY", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const ESTADO_BADGE = {
  borrador: { label: "Borrador", className: "bg-slate-100 text-slate-700" },
  en_transito: { label: "En Tránsito", className: "bg-amber-100 text-amber-700" },
  recibida_parcial: { label: "Recibida Parcial", className: "bg-purple-100 text-purple-700" },
  recibida: { label: "Recibida", className: "bg-green-100 text-green-700" },
  cancelada: { label: "Cancelada", className: "bg-red-100 text-red-700" },
};

export default function OrdenCompraDetallePage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const { data: orden, loading, execute: fetchOrden } = useApi(getOrdenCompra, { auto: false });

  const [modalRegistrarPago, setModalRegistrarPago] = useState(false);
  const [modalIngreso, setModalIngreso] = useState(false);

  useEffect(() => { if (id) fetchOrden(id); }, [id, fetchOrden]);
  const recargar = useCallback(() => fetchOrden(id), [id, fetchOrden]);

  // ─── Acciones ─────────────────────────────────────────────────

  const handleRecepcionParcial = async () => {
    try {
      await recepcionParcialOrden(id);
      showToast("Marcada como recepción parcial", "success");
      recargar();
    } catch (e) { showToast(e.message || "Error", "error"); }
  };

  const handleMarcarRecibida = async () => {
    const ok = await confirm("¿Marcar como completamente recibida?", "Marcar Recibida");
    if (!ok) return;
    try {
      await marcarRecibidaOrden(id);
      showToast("Orden marcada como recibida", "success");
      recargar();
    } catch (e) { showToast(e.message || "Error", "error"); }
  };

  const handleEliminar = async () => {
    const ok = await confirm("¿Eliminar esta orden? Solo se puede si no tiene pagos.", "Eliminar");
    if (!ok) return;
    try {
      await cancelarOrden(id);
      showToast("Orden eliminada", "success");
      router.push("/compras");
    } catch (e) { showToast(e.message || "Error", "error"); }
  };

  // ─── Render ───────────────────────────────────────────────────

  if (loading || !orden) return <LoadingScreen message="Cargando orden..." />;

  const badge = ESTADO_BADGE[orden.estado] || {};
  const puedeRegistrarPago = !["recibida", "cancelada"].includes(orden.estado);

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[{ label: "Compras", href: "/compras" }, { label: orden.numero }]}
        subtitle={`${orden.proveedor} — ${orden.pais_origen}`}
        subtitleClassName="text-blue-600"
      >
        <Link href="/compras">
          <Button variant="ghost" size="sm" icon={ArrowLeft}>Volver</Button>
        </Link>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Header */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Ship size={24} className="text-blue-600" />
                <h2 className="text-xl font-semibold text-slate-900">{orden.numero}</h2>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badge.className}`}>
                  {badge.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {orden.estado === "borrador" && (
                  <Button variant="danger" size="sm" icon={Trash2} onClick={handleEliminar}>Eliminar</Button>
                )}
                {orden.estado === "en_transito" && (
                  <>
                    <Button variant="ghost" size="sm" onClick={handleRecepcionParcial}>Recepción Parcial</Button>
                    <Button variant="primary" size="sm" icon={CheckCircle} onClick={handleMarcarRecibida}>Marcar Recibida</Button>
                  </>
                )}
                {orden.estado === "recibida_parcial" && (
                  <Button variant="primary" size="sm" icon={CheckCircle} onClick={handleMarcarRecibida}>Marcar Recibida</Button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="text-slate-500">Proveedor</span><p className="font-medium text-slate-900">{orden.proveedor}</p></div>
              <div><span className="text-slate-500">País Origen</span><p className="font-medium text-slate-900">{orden.pais_origen}</p></div>
              <div><span className="text-slate-500">Fecha Orden</span><p className="font-medium text-slate-900">{formatFecha(orden.fecha_orden)}</p></div>
              <div><span className="text-slate-500">ETA</span><p className="font-medium text-slate-900">{formatFecha(orden.fecha_estimada_arribo)}</p></div>
              {orden.fecha_arribo_real && (
                <div><span className="text-slate-500">Arribo Real</span><p className="font-medium text-green-700 font-semibold">{formatFecha(orden.fecha_arribo_real)}</p></div>
              )}
            </div>
          </div>

          {/* Costos */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Costos de Importación (USD)</h3>
            {orden.desglose_pagado_usd && Object.values(orden.desglose_pagado_usd).some(v => v > 0) ? (
              <div className="space-y-2 text-sm">
                {orden.desglose_pagado_usd.mercaderia > 0 && <div className="flex justify-between"><span className="text-slate-600">Mercadería (FOB)</span><span className="font-medium">{formatUSD(orden.desglose_pagado_usd.mercaderia)}</span></div>}
                {orden.desglose_pagado_usd.flete > 0 && <div className="flex justify-between"><span className="text-slate-600">Flete Internacional</span><span className="font-medium">{formatUSD(orden.desglose_pagado_usd.flete)}</span></div>}
                {orden.desglose_pagado_usd.seguro > 0 && <div className="flex justify-between"><span className="text-slate-600">Seguro</span><span className="font-medium">{formatUSD(orden.desglose_pagado_usd.seguro)}</span></div>}
                {orden.desglose_pagado_usd.aduana > 0 && <div className="flex justify-between"><span className="text-slate-600">Aduana / Despacho</span><span className="font-medium">{formatUSD(orden.desglose_pagado_usd.aduana)}</span></div>}
                {orden.desglose_pagado_usd.flete_interno > 0 && <div className="flex justify-between"><span className="text-slate-600">Flete Interno</span><span className="font-medium">{formatUSD(orden.desglose_pagado_usd.flete_interno)}</span></div>}
                {orden.desglose_pagado_usd.otro > 0 && <div className="flex justify-between"><span className="text-slate-600">Otros</span><span className="font-medium">{formatUSD(orden.desglose_pagado_usd.otro)}</span></div>}
                <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                  <span className="font-semibold text-slate-900">Landed Cost Real</span>
                  <span className="font-bold text-slate-900">{formatUSD(orden.landed_cost_real_usd)}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Sin pagos registrados aún.</p>
            )}
          </div>

          {/* Ítems */}
          {orden.items && orden.items.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Ítems ({orden.items.length})</h3>
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100">
                  <tr>
                    <th className="text-left py-2 text-slate-500 font-medium">Producto</th>
                    <th className="text-right py-2 text-slate-500 font-medium">Cantidad</th>
                    <th className="text-right py-2 text-slate-500 font-medium">Costo Unit.</th>
                    <th className="text-right py-2 text-slate-500 font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {orden.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2"><span className="font-medium text-slate-900">{item.variante_codigo}</span>{item.variante_nombre && <span className="ml-2 text-slate-500">{item.variante_nombre}</span>}</td>
                      <td className="py-2 text-right">{item.cantidad}</td>
                      <td className="py-2 text-right">{formatUSD(item.costo_unitario_usd)}</td>
                      <td className="py-2 text-right font-medium">{formatUSD(item.subtotal_usd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagos */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700">Pagos ({orden.pagos?.length || 0})</h3>
              {puedeRegistrarPago && (
                <Button variant="primary" size="sm" icon={CreditCard} onClick={() => setModalRegistrarPago(true)}>Registrar Pago</Button>
              )}
            </div>
            {orden.pagos && orden.pagos.length > 0 ? (
              <div className="space-y-2">
                {orden.pagos.map((pago) => (
                  <div key={pago.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 mr-2">{pago.tipo_costo_display}</span>
                      <span className="font-medium text-slate-900">{pago.concepto_pago}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-slate-900">{formatUSD(pago.gasto_monto_usd)}</span>
                      {pago.gasto_fecha_pago && <span className="ml-2 text-xs text-slate-500">{formatFecha(pago.gasto_fecha_pago)}</span>}
                    </div>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="font-semibold text-slate-700">Total Pagado</span>
                  <span className="font-bold text-slate-900">{formatUSD(orden.total_pagado_usd)}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Sin pagos registrados. Usá "Registrar Pago" para el primer pago.</p>
            )}
          </div>

          {/* Ingreso de mercadería */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700">Ingreso de Mercadería</h3>
              {["en_transito", "recibida_parcial"].includes(orden.estado) && !orden.ingreso_mercaderia && (
                <Button variant="ghost" size="sm" icon={Package} onClick={() => setModalIngreso(true)}>Vincular Ingreso</Button>
              )}
            </div>
            {orden.ingreso_mercaderia ? (
              <div className="flex items-center gap-3">
                <CheckCircle size={18} className="text-green-500" />
                <span className="font-medium text-slate-900">Ingreso #{orden.ingreso_mercaderia_id}</span>
                <Link href={`/movimientos/ingresos/${orden.ingreso_mercaderia_id}`} className="text-blue-600 text-sm hover:underline">Ver ingreso →</Link>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Sin ingreso vinculado. Cuando llegue la mercadería, registrá el ingreso y vinculalo acá.</p>
            )}
          </div>

          {/* Observaciones */}
          {orden.observaciones && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Observaciones</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{orden.observaciones}</p>
            </div>
          )}
        </div>
      </main>

      {/* Modales */}
      <RegistrarPagoModal
        open={modalRegistrarPago}
        onClose={() => setModalRegistrarPago(false)}
        ordenId={Number(id)}
        ordenNumero={orden.numero}
        ordenProveedor={orden.proveedor}
        onSuccess={recargar}
      />
      <VincularIngresoModal
        open={modalIngreso}
        onClose={() => setModalIngreso(false)}
        ordenId={Number(id)}
        onSuccess={recargar}
      />
    </div>
  );
}
