"use client";

import { useState } from "react";
import { Building2, FileCheck, Wallet } from "lucide-react";
import { PageHeader } from "@/components/ui";
import {
  CuentasTab, ChequesTab, ConciliacionTab,
} from "@/components/finanzas/tesoreria";

const TABS = [
  { id: "cuentas", label: "Cuentas", icon: Building2 },
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
          {activeTab === "cheques" && <ChequesTab />}
          {activeTab === "conciliacion" && <ConciliacionTab />}
        </div>
      </main>
    </div>
  );
}
