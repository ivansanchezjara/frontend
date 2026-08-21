"use client";
import { Text } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Package, Truck, Store, Building2, MapPin } from "lucide-react";
import { formatMonto, getMonedaSymbol } from "./utils";

const ENTREGA_ICONS = { mostrador: Store, delivery: Truck, retiro_sucursal: Building2 };
const ENTREGA_CONFIG = {
  mostrador: { label: "Mostrador", color: "text-slate-600 bg-slate-100" },
  delivery: { label: "Delivery", color: "text-blue-600 bg-blue-50" },
  retiro_sucursal: { label: "Retiro sucursal", color: "text-purple-600 bg-purple-50" },
};

export default function InfoPedido({ pedido, moneda, totalPedido }) {
  const lineas = pedido?.lineas || [];
  const entrega = ENTREGA_CONFIG[pedido?.metodo_entrega] || ENTREGA_CONFIG.mostrador;
  const EntregaIcon = ENTREGA_ICONS[pedido?.metodo_entrega] || Store;

  return (
    <div className="px-6 pt-5 pb-4 space-y-4 border-b border-slate-100">
      {/* Cliente + Total principal */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Text variant="bodySmBold" className="text-slate-800">
            {pedido?.cliente_nombre || "Sin cliente"}
          </Text>
          <Text variant="mutedXs">
            Vendedor: {pedido?.vendedor_nombre || pedido?.vendedor_username || "—"} · Pedido #{pedido?.id}
          </Text>
        </div>
        <Text variant="bodyBold" className="!text-lg !font-black text-slate-800">
          {getMonedaSymbol(moneda)} {formatMonto(totalPedido, moneda)}
        </Text>
      </div>

      {/* Método de entrega */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg", entrega.color)}>
          <EntregaIcon size={12} />
          {entrega.label}
        </span>
        {pedido?.metodo_entrega === "delivery" && pedido?.direccion_entrega && (
          <span className="inline-flex items-center gap-1 text-[11px] text-blue-500">
            <MapPin size={10} />
            {pedido.direccion_entrega}
          </span>
        )}
      </div>

      {/* Líneas del pedido */}
      <div className="bg-slate-50 rounded-xl border border-slate-100 p-3">
        <div className="flex items-center gap-2 mb-2">
          <Package size={12} className="text-slate-400" />
          <Text variant="label" className="!text-[10px]">
            Productos ({lineas.length})
          </Text>
        </div>
        <div className="space-y-1.5 max-h-32 overflow-y-auto">
          {lineas.map((linea, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Text variant="mono" as="span" className="shrink-0">
                  {linea.variante_code}
                </Text>
                <Text variant="bodyXsBold" as="span" className="truncate text-slate-700">
                  {linea.producto_nombre || linea.variante_nombre || `Variante ${linea.variante_code}`}
                </Text>
                {linea.variante_nombre && linea.producto_nombre && linea.variante_nombre !== linea.producto_nombre && (
                  <Text variant="mutedXs" as="span" className="truncate shrink-0 !text-[10px]">
                    · {linea.variante_nombre}
                  </Text>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Text variant="bodyXs" as="span" className="text-slate-500">×{linea.cantidad}</Text>
                <Text variant="bodyXsBold" as="span" className="w-24 text-right text-slate-700">
                  {getMonedaSymbol(moneda)} {formatMonto(linea.precio_unitario_moneda, moneda)}
                </Text>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
