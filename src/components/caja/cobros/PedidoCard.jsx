"use client";
import { Text, Badge, Button } from "@/components/ui";
import { Clock, Package, MapPin, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMonto, getAntiguedad, ENTREGA_CONFIG } from "./helpers";

export default function PedidoCard({ pedido, onNavigate }) {
  const antiguedad = getAntiguedad(pedido.confirmed_at);
  const entrega = ENTREGA_CONFIG[pedido.metodo_entrega] || ENTREGA_CONFIG.mostrador;
  const EntregaIcon = entrega.icon;
  const lineas = pedido.lineas || [];
  const totalItems = lineas.reduce((s, l) => s + l.cantidad, 0);

  return (
    <div className={cn(
      "bg-white rounded-xl border shadow-sm hover:shadow-md transition-all p-4 space-y-3",
      antiguedad?.urgente ? "border-amber-200" : "border-slate-200"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-400">#{pedido.id}</span>
            {antiguedad && (
              <span className={cn(
                "inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded",
                antiguedad.urgente
                  ? "bg-amber-50 text-amber-600 border border-amber-200"
                  : "bg-slate-50 text-slate-500 border border-slate-200"
              )}>
                <Clock size={9} />
                {antiguedad.label}
              </span>
            )}
          </div>
          <Text variant="bodySmBold" className="mt-1 truncate !text-slate-800">
            {pedido.cliente_nombre || "Sin cliente"}
          </Text>
          <Text variant="mutedXs" className="truncate">
            Vendedor: {pedido.vendedor_nombre || pedido.vendedor_username || "—"}
          </Text>
        </div>
        <div className="text-right shrink-0">
          <Text variant="bodyBold" className="!text-slate-800">
            {formatMonto(pedido.total_moneda_negociacion, pedido.moneda_negociacion)}
          </Text>
          <Badge variant="info" className="text-[9px] mt-0.5">
            {pedido.moneda_negociacion}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Package size={12} className="shrink-0" />
        <span className="font-semibold">{totalItems} ítem{totalItems !== 1 ? "s" : ""}</span>
        <span className="text-slate-300">·</span>
        <span className="truncate">
          {lineas.slice(0, 2).map((l) => l.producto_nombre || l.variante_nombre || l.variante_code).join(", ")}
          {lineas.length > 2 && ` +${lineas.length - 2} más`}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-lg", entrega.color)}>
          <EntregaIcon size={11} />
          {entrega.label}
        </span>
        {pedido.metodo_entrega === "delivery" && pedido.direccion_entrega && (
          <span className="inline-flex items-center gap-1 text-[10px] text-blue-500 truncate">
            <MapPin size={9} />
            {pedido.direccion_entrega}
          </span>
        )}
      </div>

      {pedido.observaciones_entrega && (
        <Text variant="mutedXs" className="italic bg-slate-50 rounded-lg px-3 py-1.5 truncate !text-[11px]">
          &ldquo;{pedido.observaciones_entrega}&rdquo;
        </Text>
      )}

      <div className="pt-1">
        <Button
          variant="primary"
          size="sm"
          icon={Wallet}
          onClick={() => onNavigate(pedido)}
          className="w-full justify-center"
        >
          Cobrar
        </Button>
      </div>
    </div>
  );
}
