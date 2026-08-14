"use client";
import Link from "next/link";
import {
  Store, MessageSquare, Star, Image as ImageIcon,
  ExternalLink, Tag, Users, Package, ArrowRight, FileDown, Calendar,
} from "lucide-react";
import { PageHeader, Section, Text } from "@/components/ui";

// ─── Datos ──────────────────────────────────────────────────────

const SECCIONES = [
  {
    href: "/ecommerce/clientes",
    icon: Users,
    title: "Clientes Online",
    desc: "Cuentas con acceso a la tienda e-commerce",
    color: "from-emerald-500 to-teal-600",
    bgLight: "bg-emerald-50",
  },
  {
    href: "/ecommerce/preguntas",
    icon: MessageSquare,
    title: "Preguntas",
    desc: "Responder consultas de clientes sobre productos",
    color: "from-blue-500 to-blue-600",
    bgLight: "bg-blue-50",
  },
  {
    href: "/ecommerce/resenas",
    icon: Star,
    title: "Reseñas",
    desc: "Moderar evaluaciones y ratings de productos",
    color: "from-amber-500 to-amber-600",
    bgLight: "bg-amber-50",
  },
  {
    href: "/ecommerce/banners",
    icon: ImageIcon,
    title: "Banners",
    desc: "Gestionar el carousel y promociones de la tienda",
    color: "from-purple-500 to-purple-600",
    bgLight: "bg-purple-50",
  },
  {
    href: "/ecommerce/catalogos",
    icon: FileDown,
    title: "Catálogos PDF",
    desc: "Subir catálogos y fichas técnicas para descarga",
    color: "from-rose-500 to-red-600",
    bgLight: "bg-rose-50",
  },
  {
    href: "/ecommerce/eventos",
    icon: Calendar,
    title: "Eventos",
    desc: "Congresos, workshops y capacitaciones",
    color: "from-indigo-500 to-indigo-600",
    bgLight: "bg-indigo-50",
  },
];

const LINKS_EXTERNOS = [
  {
    href: "/gestion-comercial/cupones",
    icon: Tag,
    title: "Cupones",
    desc: "Gestión en módulo comercial",
    iconColor: "text-emerald-500",
  },
  {
    href: "/catalogo",
    icon: Package,
    title: "Productos publicados",
    desc: "Activar/desactivar en catálogo master",
    iconColor: "text-blue-500",
  },
];

// ─── Componentes internos ───────────────────────────────────────

function SeccionCard({ href, icon: Icon, title, desc, color, bgLight }) {
  return (
    <Link
      href={href}
      aria-label={`Ir a ${title}`}
      className="group relative flex flex-col gap-4 p-6 rounded-2xl border border-slate-200 bg-white hover:shadow-lg transition-all duration-200 overflow-hidden"
    >
      {/* Decoración sutil de fondo */}
      <div className={`absolute -top-6 -right-6 w-24 h-24 ${bgLight} rounded-full opacity-50 group-hover:opacity-80 transition-opacity duration-300`} aria-hidden="true" />

      <div className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-sm`}>
        <Icon size={20} className="text-white" />
      </div>

      <div className="relative flex-1">
        <Text variant="bodySmBold" as="p" className="text-slate-800 group-hover:text-emerald-700 transition-colors">
          {title}
        </Text>
        <Text variant="bodyXs" as="p" className="mt-1">
          {desc}
        </Text>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <Text variant="bodyXs" as="span" className="text-emerald-600 font-semibold">Abrir</Text>
        <ArrowRight size={12} className="text-emerald-600" aria-hidden="true" />
      </div>
    </Link>
  );
}

function LinkExterno({ href, icon: Icon, title, desc, iconColor }) {
  return (
    <Link
      href={href}
      aria-label={`Ir a ${title}`}
      className="group flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all duration-200"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 group-hover:bg-slate-100 transition-colors">
        <Icon size={15} className={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <Text variant="bodyXsBold" as="p" className="text-slate-700">{title}</Text>
        <Text variant="mutedXs" as="p">{desc}</Text>
      </div>
      <ExternalLink size={12} className="text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" aria-hidden="true" />
    </Link>
  );
}

// ─── Página ─────────────────────────────────────────────────────

export default function EcommercePage() {
  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/30">
      <PageHeader
        title="E-commerce"
        subtitle="Administración de la tienda online"
        subtitleClassName="text-emerald-600"
      />

      <main className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0">
        <div className="max-w-5xl mx-auto space-y-10">

          {/* Hero mínimo */}
          <div className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
              <Store size={22} className="text-white" />
            </div>
            <div>
              <Text variant="bodySmBold" as="p" className="text-slate-800">
                Panel de la tienda
              </Text>
              <Text variant="bodyXs" as="p">
                Gestioná preguntas, reseñas y contenido visual del e-commerce desde acá.
              </Text>
            </div>
          </div>

          {/* Secciones principales */}
          <Section title="Gestión de la tienda">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {SECCIONES.map((sec) => (
                <SeccionCard key={sec.href} {...sec} />
              ))}
            </div>
          </Section>

          {/* Links a otros módulos */}
          <Section title="También relacionado">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {LINKS_EXTERNOS.map((link) => (
                <LinkExterno key={link.href} {...link} />
              ))}
            </div>
          </Section>

        </div>
      </main>
    </div>
  );
}
