"use client";
import Link from "next/link";
import {
  Receipt,
  Wallet,
  Package,
  FileText,
  Bookmark,
  ChevronRight,
} from "lucide-react";
import { PageHeader } from "@/components/ui";
import { cn } from "@/lib/utils";

// ─── Quick Link ─────────────────────────────────────────────────

function QuickLink({ href, icon: Icon, label, description }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 px-5 py-4 rounded-2xl border border-slate-200 bg-white hover:border-purple-300 hover:shadow-md transition-all"
    >
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 group-hover:bg-purple-100 transition-colors shrink-0">
        <Icon className="h-5 w-5 text-purple-600" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 group-hover:text-purple-700 transition-colors">
          {label}
        </p>
        {description && (
          <p className="text-xs text-slate-400 mt-0.5 truncate">{description}</p>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-purple-500 transition-colors shrink-0" />
    </Link>
  );
}

// ─── Página Principal ───────────────────────────────────────────

export default function CajaFacturacionPage() {
  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        title="Caja y Facturación"
        subtitle="Panel principal"
        subtitleClassName="text-purple-600"
      />

      <main className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* ─── ACCESOS RÁPIDOS ─────────────────────────────── */}
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">
              Módulos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <QuickLink
                href="/caja/cola"
                icon={Receipt}
                label="Cola de Cobro"
                description="Pedidos confirmados pendientes de cobro"
              />
              <QuickLink
                href="/caja/sesiones"
                icon={Wallet}
                label="Sesiones de Caja"
                description="Apertura, cierre y control de sesiones"
              />
              <QuickLink
                href="/caja/entrega"
                icon={Package}
                label="Entrega de Mercadería"
                description="Despacho de productos a clientes"
              />
              <QuickLink
                href="/caja/facturas"
                icon={FileText}
                label="Facturas y Comprobantes"
                description="Emisión y consulta de comprobantes"
              />
              <QuickLink
                href="/caja/timbrados"
                icon={Bookmark}
                label="Timbrados"
                description="Gestión de timbrados y numeración"
              />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
