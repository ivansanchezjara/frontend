"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Ship, Package, CreditCard, CheckCircle, XCircle,
  Link2, Calendar, Globe, FileText, DollarSign,
} from "lucide-react";
import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import {
  getOrdenCompra,
  confirmarOrden,
  marcarPagadaOrden,
  recepcionParcialOrden,
  marcarRecibidaOrden,
  cancelarOrden,
  vincularPagoOrden,
  vincularIngresoOrden,
} from "@/services/apis/compras";
import {
  PageHeader, Button, Badge, Section, LoadingScreen, Modal,
  Input, Field, useToast,
} from "@/components/ui";
import { useConfirm } from "@/components/ui/feedback/ConfirmContext";

function formatUSD(v) {
  if (v == null) return "—";
  return `US$ ${Number(v).toLocaleString("es-PY", { minimumFractionDigits: 2 })}`;
}

function formatFecha(f) {
  if (!f) return "—";
  return new Date(f).toLocaleDateString("es-PY", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

const ESTADO_BADGE = {
  borrador: { label: "Borrador", className: "bg-slate-100 text-slate-700" },
  confirmada: { label: "Confirmada", className: "bg-blue-100 text-blue-700" },
  pagada: { label: "Pagada (en tránsito)", className: "bg-amber-100 text-amber-700" },
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

  // Modales
  const [modalPago, setModalPago] = useState(false);
  const [modalIngreso, setModalIngreso] = useState(false);
  const [pagoData, setPagoData] = useState({ gasto_id: "", tipo_costo: "mercaderia", concepto_pago: "" });
  const [ingresoData, setIngresoData] = useState({ ingreso_mercaderia_id: "" });

  useEffect(() => {
    if (id) fetchOrden(id);
  }, [id, fetchOrden]);

  const recargar = useCallback(() => fetchOrden(id), [id, fetchOrden]);

  // ─── Acciones de estado ───────────────────────────────────────

  const handleConfirmar = async () => {
    const ok = await confirm("¿Confirmar esta orden de compra?", "Confirmar Orden");
    if (!ok) return;
    try {
      await confirmarOrden(id);
      showToast("Orden confirmada", "success");
      recargar();
    } catch (e) { showToast(e.message || "Error al confirmar", "error"); }
  };

  const handleMarcarPagada = async () => {
    const ok = await confirm(
      "¿Marcar esta orden como pagada? Esto indica que el dinero ya salió hacia el proveedor.",
      "Marcar como Pagada"
    );
    if (!ok) return;
    try {
      await marcarPagadaOrden(id, { fecha_pago: new Date().toISOString().split("T")[0] });
      showToast("Orden marcada como pagada", "success");
      recargar();
    } catch (e) { showToast(e.message || "Error", "error"); }
  };

  const handleRecepcionParcial = async () => {
    try {
      await recepcionParcialOrden(id);
      showToast("Marcada como recepción parcial", "success");
      recargar();
    } catch (e) { showToast(e.message || "Error", "error"); }
  };

  const handleMarcarRecibida = async () => {
    const ok = await confirm(
      "¿Marcar como completamente recibida? Debe tener un ingreso de mercadería vinculado.",
      "Marcar Recibida"
    );
    if (!ok) return;
    try {
      await marcarRecibidaOrden(id);
      showToast("Orden marcada como recibida", "success");
      recargar();
    } catch (e) { showToast(e.message || "Error", "error"); }
  };

  const handleCancelar = async () => {
    const ok = await confirm(
      "¿Cancelar esta orden de compra? Esta acción no se puede deshacer.",
      "Cancelar Orden"
    );
    if (!ok) return;
    try {
      await cancelarOrden(id);
      showToast("Orden cancelada", "success");
      recargar();
    } catch (e) { showToast(e.message || "Error", "error"); }
  };

  // ─── Vincular pago ────────────────────────────────────────────

  const handleVincularPago = async () => {
    if (!pagoData.gasto_id || !pagoData.concepto_pago || !pagoData.tipo_costo) {
      showToast("Completá todos los campos", "error");
      return;
    }
    try {
      await vincularPagoOrden(id, {
        gasto_id: Number(pagoData.gasto_id),
        tipo_costo: pagoData.tipo_costo,
        concepto_pago: pagoData.concepto_pago,
      });
      showToast("Pago vinculado exitosamente", "success");
      setModalPago(false);
      setPagoData({ gasto_id: "", tipo_costo: "mercaderia", concepto_pago: "" });
      recargar();
    } catch (e) { showToast(e.message || "Error al vincular pago", "error"); }
  };

  // ─── Vincular ingreso ─────────────────────────────────────────

  const handleVincularIngreso = async () => {
    if (!ingresoData.ingreso_mercaderia_id) {
      showToast("Ingresá el ID del ingreso de mercadería", "error");
      return;
    }
    try {
      await vincularIngresoOrden(id, {
        ingreso_mercaderia_id: Number(ingresoData.ingreso_mercaderia_id),
      });
      showToast("Ingreso vinculado exitosamente", "success");
      setModalIngreso(false);
      setIngresoData({ ingreso_mercaderia_id: "" });
      recargar();
    } catch (e) { showToast(e.message || "Error al vincular ingreso", "error"); }
  };

  // ─── Render ───────────────────────────────────────────────────

  if (loading || !orden) return <LoadingScreen message="Cargando orden..." />;

  const badge = ESTADO_BADGE[orden.estado] || {};

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Compras", href: "/compras" },
          { label: orden.numero },
        ]}
        subtitle={`${orden.proveedor} — ${orden.pais_origen}`}
        subtitleClassName="text-blue-600"
      >
        <Link href="/compras">
          <Button variant="ghost" size="sm" icon={ArrowLeft}>Volver</Button>
        </Link>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Header con estado y acciones */}
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
                  <>
                    <Button variant="primary" size="sm" onClick={handleConfirmar}>
                      Confirmar
                    </Button>
                    <Button variant="danger" size="sm" onClick={handleCancelar}>
                      Cancelar
                    </Button>
                  </>
                )}
                {orden.estado === "confirmada" && (
                  <>
                    <Button variant="primary" size="sm" icon={DollarSign} onClick={handleMarcarPagada}>
                      Marcar Pagada
                    </Button>
                    <Button variant="danger" size="sm" onClick={handleCancelar}>
                      Cancelar
                    </Button>
                  </>
                )}
                {orden.estado === "pagada" && (
                  <>
                    <Button variant="ghost" size="sm" onClick={handleRecepcionParcial}>
                      Recepción Parcial
                    </Button>
                    <Button variant="primary" size="sm" icon={CheckCircle} onClick={handleMarcarRecibida}>
                      Marcar Recibida
                    </Button>
                  </>
                )}
                {orden.estado === "recibida_parcial" && (
                  <Button variant="primary" size="sm" icon={CheckCircle} onClick={handleMarcarRecibida}>
                    Marcar Recibida
                  </Button>
                )}
              </div>
            </div>

            {/* Info general */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Proveedor</span>
                <p className="font-medium text-slate-900">{orden.proveedor}</p>
              </div>
              <div>
                <span className="text-slate-500">País Origen</span>
                <p className="font-medium text-slate-900">{orden.pais_origen}</p>
              </div>
              <div>
                <span className="text-slate-500">Fecha Orden</span>
                <p className="font-medium text-slate-900">{formatFecha(orden.fecha_orden)}</p>
              </div>
              <div>
                <span className="text-slate-500">ETA</span>
                <p className="font-medium text-slate-900">{formatFecha(orden.fecha_estimada_arribo)}</p>
              </div>
              {orden.fecha_pago && (
                <div>
                  <span className="text-slate-500">Fecha Pago</span>
                  <p className="font-medium text-slate-900">{formatFecha(orden.fecha_pago)}</p>
                </div>
              )}
              {orden.fecha_embarque && (
                <div>
                  <span className="text-slate-500">Embarque</span>
                  <p className="font-medium text-slate-900">{formatFecha(orden.fecha_embarque)}</p>
                </div>
              )}
              {orden.fecha_arribo_real && (
                <div>
                  <span className="text-slate-500">Arribo Real</span>
                  <p className="font-medium text-green-700 font-semibold">{formatFecha(orden.fecha_arribo_real)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Costos — Estimado vs. Real (calculado desde pagos) */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Costos de Importación (USD)</h3>

            {/* Desglose real desde pagos */}
            {orden.desglose_pagado_usd && Object.values(orden.desglose_pagado_usd).some(v => v > 0) ? (
              <div className="space-y-2 text-sm">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Pagado (real)</p>
                {orden.desglose_pagado_usd.mercaderia > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Mercadería (FOB)</span>
                    <span className="font-medium text-slate-900">{formatUSD(orden.desglose_pagado_usd.mercaderia)}</span>
                  </div>
                )}
                {orden.desglose_pagado_usd.flete > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Flete Internacional</span>
                    <span className="font-medium text-slate-900">{formatUSD(orden.desglose_pagado_usd.flete)}</span>
                  </div>
                )}
                {orden.desglose_pagado_usd.seguro > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Seguro</span>
                    <span className="font-medium text-slate-900">{formatUSD(orden.desglose_pagado_usd.seguro)}</span>
                  </div>
                )}
                {orden.desglose_pagado_usd.aduana > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Aduana / Despacho</span>
                    <span className="font-medium text-slate-900">{formatUSD(orden.desglose_pagado_usd.aduana)}</span>
                  </div>
                )}
                {orden.desglose_pagado_usd.flete_interno > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Flete Interno</span>
                    <span className="font-medium text-slate-900">{formatUSD(orden.desglose_pagado_usd.flete_interno)}</span>
                  </div>
                )}
                {orden.desglose_pagado_usd.otro > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Otros</span>
                    <span className="font-medium text-slate-900">{formatUSD(orden.desglose_pagado_usd.otro)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                  <span className="text-slate-900 font-semibold">Landed Cost Real</span>
                  <span className="text-slate-900 font-bold">{formatUSD(orden.landed_cost_real_usd)}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Sin pagos registrados aún. Vinculá gastos para ver el landed cost real.</p>
            )}

            {/* Estimados (si se cargaron) */}
            {orden.monto_total_estimado_usd > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Estimado (planificación)</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-slate-500">
                  {orden.monto_mercaderia_usd > 0 && (
                    <div className="flex justify-between">
                      <span>FOB</span>
                      <span>{formatUSD(orden.monto_mercaderia_usd)}</span>
                    </div>
                  )}
                  {orden.monto_flete_usd > 0 && (
                    <div className="flex justify-between">
                      <span>Flete</span>
                      <span>{formatUSD(orden.monto_flete_usd)}</span>
                    </div>
                  )}
                  {orden.monto_seguro_usd > 0 && (
                    <div className="flex justify-between">
                      <span>Seguro</span>
                      <span>{formatUSD(orden.monto_seguro_usd)}</span>
                    </div>
                  )}
                  {orden.monto_aduana_usd > 0 && (
                    <div className="flex justify-between">
                      <span>Aduana</span>
                      <span>{formatUSD(orden.monto_aduana_usd)}</span>
                    </div>
                  )}
                  {orden.monto_otros_usd > 0 && (
                    <div className="flex justify-between">
                      <span>Otros</span>
                      <span>{formatUSD(orden.monto_otros_usd)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium text-slate-700">
                    <span>Total Est.</span>
                    <span>{formatUSD(orden.monto_total_estimado_usd)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Ítems */}
          {orden.items && orden.items.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                Ítems ({orden.items.length})
              </h3>
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100">
                  <tr>
                    <th className="text-left py-2 text-slate-500 font-medium">Producto</th>
                    <th className="text-right py-2 text-slate-500 font-medium">Cantidad</th>
                    <th className="text-right py-2 text-slate-500 font-medium">Costo Unit.</th>
                    <th className="text-right py-2 text-slate-500 font-medium">Subtotal</th>
                    <th className="text-center py-2 text-slate-500 font-medium">Recibido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {orden.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2">
                        <span className="font-medium text-slate-900">{item.variante_codigo}</span>
                        {item.variante_nombre && (
                          <span className="ml-2 text-slate-500">{item.variante_nombre}</span>
                        )}
                      </td>
                      <td className="py-2 text-right">{item.cantidad}</td>
                      <td className="py-2 text-right">{formatUSD(item.costo_unitario_usd)}</td>
                      <td className="py-2 text-right font-medium">{formatUSD(item.subtotal_usd)}</td>
                      <td className="py-2 text-center">
                        {item.recepcion_completa ? (
                          <CheckCircle size={16} className="inline text-green-500" />
                        ) : (
                          <span className="text-slate-400">{item.cantidad_recibida}/{item.cantidad}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagos vinculados */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700">
                Pagos Vinculados ({orden.pagos?.length || 0})
              </h3>
              {!["recibida", "cancelada"].includes(orden.estado) && (
                <Button variant="ghost" size="sm" icon={Link2} onClick={() => setModalPago(true)}>
                  Vincular Pago
                </Button>
              )}
            </div>
            {orden.pagos && orden.pagos.length > 0 ? (
              <div className="space-y-2">
                {orden.pagos.map((pago) => (
                  <div key={pago.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 mr-2">
                        {pago.tipo_costo_display}
                      </span>
                      <span className="font-medium text-slate-900">{pago.concepto_pago}</span>
                      <span className="ml-2 text-slate-500 text-xs">{pago.gasto_concepto}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-slate-900">{formatUSD(pago.gasto_monto_usd)}</span>
                      {pago.gasto_fecha_pago && (
                        <span className="ml-2 text-xs text-slate-500">{formatFecha(pago.gasto_fecha_pago)}</span>
                      )}
                    </div>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="font-semibold text-slate-700">Total Pagado</span>
                  <span className="font-bold text-slate-900">{formatUSD(orden.total_pagado_usd)}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Sin pagos vinculados aún.</p>
            )}
          </div>

          {/* Ingreso de mercadería vinculado */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700">Ingreso de Mercadería</h3>
              {["pagada", "recibida_parcial"].includes(orden.estado) && !orden.ingreso_mercaderia && (
                <Button variant="ghost" size="sm" icon={Package} onClick={() => setModalIngreso(true)}>
                  Vincular Ingreso
                </Button>
              )}
            </div>
            {orden.ingreso_mercaderia ? (
              <div className="flex items-center gap-3">
                <CheckCircle size={18} className="text-green-500" />
                <div>
                  <span className="font-medium text-slate-900">
                    Ingreso #{orden.ingreso_mercaderia_id}
                  </span>
                  <Link
                    href={`/movimientos/ingresos/${orden.ingreso_mercaderia_id}`}
                    className="ml-2 text-blue-600 text-sm hover:underline"
                  >
                    Ver ingreso →
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                Aún no se vinculó un ingreso de mercadería. Cuando la mercadería llegue,
                registrá el ingreso desde Movimientos y vinculalo acá.
              </p>
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

      {/* Modal: Vincular Pago */}
      <Modal
        open={modalPago}
        title="Vincular Pago a Orden de Compra"
        onClose={() => setModalPago(false)}
      >
        <div className="space-y-4 p-4">
          <Field label="ID del Gasto (de Egresos)">
            <Input
              type="number"
              value={pagoData.gasto_id}
              onChange={(e) => setPagoData(p => ({ ...p, gasto_id: e.target.value }))}
              placeholder="Ej: 42"
            />
          </Field>
          <Field label="Tipo de Costo">
            <select
              value={pagoData.tipo_costo}
              onChange={(e) => setPagoData(p => ({ ...p, tipo_costo: e.target.value }))}
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            >
              <option value="mercaderia">Mercadería (FOB)</option>
              <option value="flete">Flete Internacional</option>
              <option value="seguro">Seguro</option>
              <option value="aduana">Aduana / Despacho</option>
              <option value="flete_interno">Flete Interno</option>
              <option value="otro">Otros Costos</option>
            </select>
          </Field>
          <Field label="Concepto / Detalle">
            <Input
              value={pagoData.concepto_pago}
              onChange={(e) => setPagoData(p => ({ ...p, concepto_pago: e.target.value }))}
              placeholder="Ej: Anticipo 50%, Saldo, DHL tracking ABC..."
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalPago(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleVincularPago}>Vincular</Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Vincular Ingreso */}
      <Modal
        open={modalIngreso}
        title="Vincular Ingreso de Mercadería"
        onClose={() => setModalIngreso(false)}
      >
        <div className="space-y-4 p-4">
          <Field label="ID del Ingreso de Mercadería">
            <Input
              type="number"
              value={ingresoData.ingreso_mercaderia_id}
              onChange={(e) => setIngresoData({ ingreso_mercaderia_id: e.target.value })}
              placeholder="Ej: 15"
            />
          </Field>
          <p className="text-xs text-slate-500">
            Podés encontrar el ID del ingreso en la sección de Movimientos → Ingresos.
            Registrá el ingreso primero si aún no lo hiciste.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalIngreso(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleVincularIngreso}>Vincular</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
