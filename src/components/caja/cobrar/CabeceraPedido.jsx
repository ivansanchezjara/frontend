"use client";
import { Text, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  Clock, User, Truck, Store, Building2, MapPin,
  Phone, Mail, Building, Tag, ExternalLink,
} from "lucide-react";
import Link from "next/link";

const ENTREGA_CONFIG = {
  mostrador: { icon: Store, label: "Mostrador", color: "text-slate-600 bg-slate-100" },
  delivery: { icon: Truck, label: "Delivery", color: "text-blue-600 bg-blue-50" },
  retiro_sucursal: { icon: Building2, label: "Retiro sucursal", color: "text-purple-600 bg-purple-50" },
};

const TIER_LABELS = {
  publico: "Público (P0)",
  estudiante: "Estudiante (P1)",
  reventa: "Reventa (P2)",
  mayorista: "Mayorista (P3)",
  intercompany: "Intercompany (P4)",
};

function getAntiguedad(fecha) {
  if (!fecha) return null;
  const mins = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000);
  if (mins < 60) return { label: `${mins} min`, urgente: mins > 30 };
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return { label: `${hrs}h ${mins % 60}m`, urgente: hrs >= 1 };
  const dias = Math.floor(hrs / 24);
  return { label: `${dias}d`, urgente: true };
}

export default function CabeceraPedido({ pedido }) {
  const entrega = ENTREGA_CONFIG[pedido?.metodo_entrega] || ENTREGA_CONFIG.mostrador;
  const EntregaIcon = entrega.icon;
  const antiguedad = getAntiguedad(pedido?.confirmed_at);

  const clienteNombre = pedido?.cliente_nombre || "Sin cliente";
  const clienteId = pedido?.cliente_id;
  const clienteRuc = pedido?.cliente_ruc;
  const clienteTelefono = pedido?.cliente_telefono;
  const clienteCorreo = pedido?.cliente_correo;
  const clienteCiudad = pedido?.cliente_ciudad;
  const clienteTier = pedido?.cliente_tier;
  const requiereFactura = pedido?.requiere_factura_legal;

  const clienteUrl = clienteId ? `/ventas-crm/contactos/${clienteId}` : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">

      {/* Encabezado: Pedido # + antigüedad */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Text variant="bodyBold" className="!text-slate-800">
            Pedido #{pedido?.id}
          </Text>
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
        <Text variant="mutedXs">
          Vendedor: {pedido?.vendedor_nombre || pedido?.vendedor_username || "—"}
        </Text>
      </div>

      {/* Datos del cliente */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <User size={14} className="text-slate-400 shrink-0" />
            <div>
              {clienteUrl ? (
                <Link
                  href={clienteUrl}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors"
                >
                  {clienteNombre}
                  <ExternalLink size={10} className="text-slate-400" />
                </Link>
              ) : (
                <Text variant="bodySmBold" className="!text-slate-800">
                  {clienteNombre}
                </Text>
              )}
              {clienteRuc && (
                <Text variant="mutedXs" className="!text-[10px]">
                  RUC: {clienteRuc}
                </Text>
              )}
            </div>
          </div>
          {clienteTier && (
            <Badge variant="neutral" className="text-[9px] shrink-0">
              <Tag size={8} className="mr-0.5" />
              {TIER_LABELS[clienteTier] || clienteTier}
            </Badge>
          )}
        </div>

        {/* Contacto */}
        {(clienteTelefono || clienteCorreo || clienteCiudad) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
            {clienteTelefono && (
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                <Phone size={9} />
                {clienteTelefono}
              </span>
            )}
            {clienteCorreo && (
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                <Mail size={9} />
                {clienteCorreo}
              </span>
            )}
            {clienteCiudad && (
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                <Building size={9} />
                {clienteCiudad}
              </span>
            )}
          </div>
        )}
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

      {pedido?.observaciones_entrega && (
        <Text variant="mutedXs" className="italic bg-slate-50 rounded-lg px-3 py-2 !text-[11px]">
          &ldquo;{pedido.observaciones_entrega}&rdquo;
        </Text>
      )}
    </div>
  );
}
