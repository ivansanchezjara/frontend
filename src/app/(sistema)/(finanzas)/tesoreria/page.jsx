"use client";

import { useState } from "react";
import { Building2, ArrowUpDown, FileCheck, Wallet } from "lucide-react";
import { PageHeader, Button, Section } from "@/components/ui";
import { Text } from "@/components/ui/basics/Typography";

const TABS = [
  { id: "cuentas", label: "Cuentas", icon: Building2 },
  { id: "movimientos", label: "Movimientos", icon: ArrowUpDown },
  { id: "cheques", label: "Cheques", icon: FileCheck },
  { id: "conciliacion", label: "Conciliación", icon: Wallet },
];

export default function TesoreriaPage() {
  const [activeTab, setActiveTab] = useState("cuentas");

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[{ label: "Tesorería" }]}
        subtitle="Gestión de cuentas financieras, movimientos y conciliación"
        subtitleClassName="text-purple-600"
      />

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white px-8">
        <div className="flex gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-5xl mx-auto">
          {activeTab === "cuentas" && <CuentasTab />}
          {activeTab === "movimientos" && <MovimientosTab />}
          {activeTab === "cheques" && <ChequesTab />}
          {activeTab === "conciliacion" && <ConciliacionTab />}
        </div>
      </main>
    </div>
  );
}

// ─── Placeholder Tabs ───────────────────────────────────────────

function CuentasTab() {
  return (
    <Section title="Cuentas Financieras">
      <div className="p-8 text-center">
        <Building2 className="mx-auto mb-3 text-slate-300" size={48} />
        <Text className="text-slate-500">
          Aquí se gestionarán las cuentas: tesorería, bancos y carteras de cheques.
        </Text>
        <Text className="text-slate-400 text-sm mt-1">
          Próximamente...
        </Text>
      </div>
    </Section>
  );
}

function MovimientosTab() {
  return (
    <Section title="Movimientos de Fondos">
      <div className="p-8 text-center">
        <ArrowUpDown className="mx-auto mb-3 text-slate-300" size={48} />
        <Text className="text-slate-500">
          Historial de todos los movimientos entre cuentas con trazabilidad completa.
        </Text>
        <Text className="text-slate-400 text-sm mt-1">
          Próximamente...
        </Text>
      </div>
    </Section>
  );
}

function ChequesTab() {
  return (
    <Section title="Gestión de Cheques">
      <div className="p-8 text-center">
        <FileCheck className="mx-auto mb-3 text-slate-300" size={48} />
        <Text className="text-slate-500">
          Cheques recibidos y emitidos con seguimiento de estados.
        </Text>
        <Text className="text-slate-400 text-sm mt-1">
          Próximamente...
        </Text>
      </div>
    </Section>
  );
}

function ConciliacionTab() {
  return (
    <Section title="Conciliación">
      <div className="p-8 text-center">
        <Wallet className="mx-auto mb-3 text-slate-300" size={48} />
        <Text className="text-slate-500">
          Contrastar saldos del sistema contra la realidad (extracto bancario, arqueo de tesorería).
        </Text>
        <Text className="text-slate-400 text-sm mt-1">
          Próximamente...
        </Text>
      </div>
    </Section>
  );
}
