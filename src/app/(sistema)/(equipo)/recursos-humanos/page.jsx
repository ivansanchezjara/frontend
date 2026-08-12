"use client";
import { useState } from "react";
import {
  Users,
  Clock,
  CalendarDays,
  DollarSign,
  CalendarRange,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import { PageHeader } from "@/components/ui";
import TabDashboard from "@/components/rrhh/TabDashboard";
import TabFuncionarios from "@/components/rrhh/TabFuncionarios";
import TabAsistencia from "@/components/rrhh/TabAsistencia";
import TabAusencias from "@/components/rrhh/TabAusencias";
import TabCalendario from "@/components/rrhh/TabCalendario";
import TabLiquidaciones from "@/components/rrhh/TabLiquidaciones";
import TabConfiguracion from "@/components/rrhh/TabConfiguracion";
import FuncionarioDetail from "@/components/rrhh/FuncionarioDetail";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "funcionarios", label: "Funcionarios", icon: Users },
  { id: "asistencia", label: "Asistencia", icon: Clock },
  { id: "ausencias", label: "Ausencias", icon: CalendarDays },
  { id: "calendario", label: "Calendario", icon: CalendarRange },
  { id: "liquidaciones", label: "Salarios", icon: DollarSign },
  { id: "configuracion", label: "Configuración", icon: Settings },
];

export default function RecursosHumanosPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedFuncionario, setSelectedFuncionario] = useState(null);

  // Si hay un funcionario seleccionado, mostrar su detalle
  if (selectedFuncionario) {
    return (
      <FuncionarioDetail
        funcionarioId={selectedFuncionario}
        onBack={() => setSelectedFuncionario(null)}
      />
    );
  }

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        title="Recursos Humanos"
        subtitle={
          <>
            <Users size={12} /> Gestión integral del personal
          </>
        }
        subtitleClassName="text-amber-600"
      />

      {/* Tabs de navegación principal */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-8">
        <div className="max-w-[1600px] mx-auto flex gap-1 overflow-x-auto py-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-amber-100 text-amber-700 shadow-sm"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido del tab activo */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "dashboard" && <TabDashboard />}
        {activeTab === "funcionarios" && (
          <TabFuncionarios
            onSelectFuncionario={(id) => setSelectedFuncionario(id)}
          />
        )}
        {activeTab === "asistencia" && <TabAsistencia />}
        {activeTab === "ausencias" && <TabAusencias />}
        {activeTab === "calendario" && <TabCalendario />}
        {activeTab === "liquidaciones" && <TabLiquidaciones />}
        {activeTab === "configuracion" && <TabConfiguracion />}
      </div>
    </div>
  );
}
