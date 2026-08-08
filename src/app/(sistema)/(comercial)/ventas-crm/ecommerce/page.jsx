"use client";
import Link from "next/link";
import {
  Store, MessageSquare, Star, Image as ImageIcon,
  ExternalLink, Tag, Users, Package,
} from "lucide-react";
import { PageHeader, Section } from "@/components/ui";

const SECCIONES = [
  {
    href: "/ventas-crm/ecommerce/preguntas",
    icon: MessageSquare,
    title: "Preguntas",
    desc: "Responder consultas de clientes sobre productos",
    color: "bg-blue-50 text-blue-600",
  },
  {
    href: "/ventas-crm/ecommerce/resenas",
    icon: Star,
    title: "Reseñas",
    desc: "Moderar evaluaciones de productos",
    color: "bg-amber-50 text-amber-600",
  },
  {
    href: "/ventas-crm/ecommerce/banners",
    icon: ImageIcon,
    title: "Banners",
    desc: "Gestionar el carousel y promociones de la tienda",
    color: "bg-purple-50 text-purple-600",
  },
];

const LINKS_EXTERNOS = [
  {
    href: "/gestion-comercial",
    icon: Tag,
    title: "Cupones",
    desc: "Gestión en módulo comercial",
  },
  {
    href: "/catalogo",
    icon: Package,
    title: "Productos publicados",
    desc: "Activar/desactivar en catálogo master",
  },
  {
    href: "/ventas-crm/contactos",
    icon: Users,
    title: "Clientes registrados",
    desc: "Gestión en contactos del CRM",
  },
];

export default function EcommercePage() {
  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/30">
      <PageHeader
        title="E-commerce"
        subtitle="Administración de la tienda online"
        subtitleClassName="text-emerald-600"
      />

      <main className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* Secciones principales */}
          <Section title="Gestión de la tienda">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SECCIONES.map((sec) => {
                const Icon = sec.icon;
                return (
                  <Link
                    key={sec.href}
                    href={sec.href}
                    className="flex items-start gap-4 p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all group"
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${sec.color}`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                        {sec.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{sec.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Section>

          {/* Links a otros módulos */}
          <Section title="También relacionado">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {LINKS_EXTERNOS.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 hover:border-slate-300 transition-colors group"
                  >
                    <Icon size={16} className="text-slate-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-600">{link.title}</p>
                      <p className="text-[10px] text-slate-400">{link.desc}</p>
                    </div>
                    <ExternalLink size={12} className="text-slate-300 shrink-0" />
                  </Link>
                );
              })}
            </div>
          </Section>

        </div>
      </main>
    </div>
  );
}
