"use client";
import { memo } from "react";
import { Globe, Mail, Phone, MapPin, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Text, Badge } from "@/components/ui";

const TIER_CONFIG = {
  publico: { label: "Público", variant: "default" },
  estudiante: { label: "Estudiante", variant: "info" },
  reventa: { label: "Reventa", variant: "primary" },
  mayorista: { label: "Mayorista", variant: "warning" },
  intercompany: { label: "Intercompany", variant: "danger" },
};

const TIPO_CONFIG = {
  persona: { label: "Persona", href: (id) => `/ventas-crm/contactos/personas/${id}` },
  clinica: { label: "Clínica", href: (id) => `/ventas-crm/contactos/clinicas/${id}` },
  mayorista: { label: "Mayorista", href: (id) => `/ventas-crm/contactos/mayoristas/${id}` },
  institucion: { label: "Institución", href: () => `/ventas-crm/instituciones` },
};

const ClienteOnlineCard = memo(function ClienteOnlineCard({ cliente }) {
  const tier = TIER_CONFIG[cliente.tier_precio] || TIER_CONFIG.publico;
  const tipo = TIPO_CONFIG[cliente.tipo] || TIPO_CONFIG.persona;
  const detailHref = tipo.href(cliente.id);
  const inicial = cliente.razon_social?.charAt(0)?.toUpperCase() || "?";

  return (
    <article
      className="group relative rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
      aria-label={`Cliente online: ${cliente.razon_social}`}
    >
      {/* Barra lateral */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400" aria-hidden="true" />

      <div className="p-5 pl-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700 border border-emerald-200">
              {inicial}
            </div>
            <div className="min-w-0">
              <Text variant="bodySmBold" as="p" className="text-slate-800 truncate">
                {cliente.razon_social}
              </Text>
              {cliente.ruc && (
                <Text variant="mutedXs" as="p">RUC: {cliente.ruc}</Text>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={tier.variant} className="text-[9px] py-0.5 px-2">
              {tier.label}
            </Badge>
            <Globe size={14} className="text-emerald-500" aria-hidden="true" />
          </div>
        </div>

        {/* Info de contacto */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
          {cliente.email_online && (
            <div className="flex items-center gap-1.5">
              <Mail size={11} className="text-slate-400" aria-hidden="true" />
              <Text variant="bodyXs" as="span" className="text-slate-600">
                {cliente.email_online}
              </Text>
            </div>
          )}
          {cliente.telefono && (
            <div className="flex items-center gap-1.5">
              <Phone size={11} className="text-slate-400" aria-hidden="true" />
              <Text variant="bodyXs" as="span" className="text-slate-600">
                {cliente.telefono}
              </Text>
            </div>
          )}
          {cliente.ciudad && (
            <div className="flex items-center gap-1.5">
              <MapPin size={11} className="text-slate-400" aria-hidden="true" />
              <Text variant="bodyXs" as="span" className="text-slate-600">
                {cliente.ciudad}
              </Text>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <Badge variant="default" className="text-[9px] py-0.5 px-2">
            {tipo.label}
          </Badge>
          <Link
            href={detailHref}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            aria-label={`Ver detalle de ${cliente.razon_social}`}
          >
            Ver en CRM
            <ExternalLink size={10} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
});

export default ClienteOnlineCard;
