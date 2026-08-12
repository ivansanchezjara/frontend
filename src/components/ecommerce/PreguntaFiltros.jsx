"use client";
import { MessageSquare, CheckCircle2, Clock, Search } from "lucide-react";
import { Input } from "@/components/ui";

const TABS = [
  { id: "pendientes", label: "Pendientes", icon: Clock },
  { id: "respondidas", label: "Respondidas", icon: CheckCircle2 },
  { id: "", label: "Todas", icon: MessageSquare },
];

export default function PreguntaFiltros({
  filtroEstado,
  setFiltroEstado,
  busquedaLocal,
  setBusquedaLocal,
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
      <div
        className="flex gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto"
        role="tablist"
        aria-label="Filtrar preguntas por estado"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = filtroEstado === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls="preguntas-panel"
              onClick={() => setFiltroEstado(tab.id)}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors duration-200 ${
                isActive
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon size={13} aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="w-full sm:max-w-xs">
        <Input
          placeholder="Buscar por producto o cliente..."
          value={busquedaLocal}
          onChange={(e) => setBusquedaLocal(e.target.value)}
          icon={Search}
          aria-label="Buscar preguntas"
          className="bg-white border-slate-200 text-xs py-1.5 focus:border-emerald-300"
          fullWidth={true}
        />
      </div>
    </div>
  );
}
