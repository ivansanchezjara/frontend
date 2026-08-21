"use client";
import { Text, Modal, Button, Badge } from "@/components/ui";
import { Receipt, Package, CreditCard, User, Calendar, ArrowRight } from "lucide-react";
import { formatMonto, getMonedaSymbol } from "./utils";

/**
 * Modal con detalle completo de un cobro realizado.
 */
export default function DetalleCobro({ cobro, onClose }) {
  if (!cobro) return null;

  const moneda = cobro.moneda_negociacion || cobro.moneda || "PYG";
  const lineas = cobro.lineas || [];
  const pagos = cobro.pagos || [];
  const detallePagos = cobro.detalle_pagos || [];

  // Usar pagos registrados, fallback a detalle_pagos del comprobante
  const pagosDisplay = pagos.length > 0 ? pagos : detallePagos;

  return (
    <Modal open onClose={onClose} title="Detalle de Cobro" size="lg">
      <div className="max-h-[75vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Text variant="bodySmBold" className="!text-slate-800">
                Comprobante Nº {cobro.numero_completo || "—"}
              </Text>
              <Text variant="mutedXs">
                {formatFecha(cobro.cobrado_at || cobro.fecha_emision)}
              </Text>
            </div>
            <Badge variant={cobro.estado === "vigente" ? "success" : "error"}>
              {cobro.estado === "vigente" ? "Vigente" : "Anulado"}
            </Badge>
          </div>

          {/* Info general */}
          <div className="grid grid-cols-2 gap-3">
            <InfoItem icon={User} label="Cliente" value={cobro.cliente_nombre || "Sin cliente"} />
            <InfoItem icon={User} label="Vendedor" value={cobro.vendedor_nombre || "—"} />
            <InfoItem icon={User} label="Cajero" value={cobro.cajero_nombre || "—"} />
            <InfoItem icon={Calendar} label="Entrega" value={cobro.metodo_entrega_display || "—"} />
          </div>

          {/* Totales */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="p-3 bg-slate-50 rounded-lg text-center">
              <Text variant="mutedXs">Total ({moneda})</Text>
              <Text variant="bodySmBold" className="!text-slate-800">
                {getMonedaSymbol(moneda)} {formatMonto(cobro.total_moneda_negociacion || cobro.total, moneda)}
              </Text>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg text-center">
              <Text variant="mutedXs">Total USD</Text>
              <Text variant="bodySmBold" className="!text-slate-800">
                $ {formatMonto(cobro.total_usd, "USD")}
              </Text>
            </div>
            {Number(cobro.vuelto) > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <Text variant="mutedXs" className="!text-blue-600">Vuelto</Text>
                <Text variant="bodySmBold" className="!text-blue-800">
                  {getMonedaSymbol(cobro.moneda || moneda)} {formatMonto(cobro.vuelto, cobro.moneda || moneda)}
                </Text>
              </div>
            )}
          </div>
        </div>

        {/* Productos */}
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <Package size={14} className="text-slate-400" />
            <Text variant="label">Productos ({lineas.length})</Text>
          </div>
          <div className="space-y-2">
            {lineas.map((linea, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Text variant="mono" as="span" className="shrink-0">
                    {linea.variante_code}
                  </Text>
                  <Text variant="bodyXs" as="span" className="truncate !text-slate-700">
                    {linea.producto_nombre || linea.variante_nombre}
                  </Text>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <Text variant="bodyXs" as="span" className="!text-slate-500">
                    ×{linea.cantidad}
                  </Text>
                  <Text variant="bodyXsBold" as="span" className="w-24 text-right !text-slate-700">
                    {getMonedaSymbol(moneda)} {formatMonto(linea.precio_unitario_moneda, moneda)}
                  </Text>
                </div>
              </div>
            ))}
            {lineas.length === 0 && (
              <Text variant="mutedXs" className="text-center py-3">
                Sin detalle de productos disponible
              </Text>
            )}
          </div>
        </div>

        {/* Pagos */}
        <div className="px-6 py-4">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={14} className="text-slate-400" />
            <Text variant="label">Pagos realizados ({pagosDisplay.length})</Text>
          </div>
          <div className="space-y-2">
            {pagosDisplay.map((pago, idx) => (
              <div key={idx} className="flex items-center justify-between bg-emerald-50 rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Text variant="bodyXsBold" as="span" className="!text-emerald-700">
                    {pago.metodo_display || getMetodoLabel(pago.metodo)}
                  </Text>
                  {pago.referencia && (
                    <Text variant="mutedXs" as="span" className="!text-emerald-500">
                      ({pago.referencia})
                    </Text>
                  )}
                </div>
                <Text variant="bodySmBold" as="span" className="!text-emerald-800">
                  {getMonedaSymbol(pago.moneda)} {formatMonto(pago.monto, pago.moneda)}
                </Text>
              </div>
            ))}
            {pagosDisplay.length === 0 && (
              <Text variant="mutedXs" className="text-center py-3">
                Sin detalle de pagos disponible
              </Text>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
        <Button variant="ghost" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </Modal>
  );
}

// ─── Helpers ──────────────────────────────────────────────────

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={12} className="text-slate-400 shrink-0" />
      <div className="min-w-0">
        <Text variant="mutedXs" className="!text-[9px]">{label}</Text>
        <Text variant="bodyXsBold" className="!text-slate-700 truncate">{value}</Text>
      </div>
    </div>
  );
}

function formatFecha(fecha) {
  if (!fecha) return "—";
  const d = new Date(fecha);
  return d.toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const METODO_LABELS = {
  efectivo_pyg: "Efectivo PYG",
  efectivo_usd: "Efectivo USD",
  efectivo_brl: "Efectivo BRL",
  cheque_pyg: "Cheque PYG",
  cheque_usd: "Cheque USD",
  transferencia_pyg: "Transferencia PYG",
  tarjeta_credito: "Tarjeta Crédito",
  tarjeta_debito: "Tarjeta Débito",
  pix: "PIX",
  cuotas: "Pago a Cuotas",
};

function getMetodoLabel(metodo) {
  return METODO_LABELS[metodo] || metodo;
}
