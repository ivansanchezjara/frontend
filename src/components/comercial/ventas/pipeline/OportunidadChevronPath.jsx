"use client";
import { Check, Ban, CheckCircle2, RotateCcw, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const STAGES = [
  { key: "nueva", label: "Nueva", description: "Lead identificado" },
  { key: "contactada", label: "Contactada", description: "En comunicación" },
  { key: "negociacion", label: "Negociación", description: "Propuesta enviada" },
];

const ORDER = ["nueva", "contactada", "negociacion"];

function getStageState(stageKey, etapa) {
  if (etapa === "perdida") return "inactive";
  if (etapa === "ganada") return "completed";

  const currentIndex = ORDER.indexOf(etapa);
  const stageIndex = ORDER.indexOf(stageKey);

  if (stageIndex < currentIndex) return "completed";
  if (stageIndex === currentIndex) return "active";
  return "upcoming";
}

// ─── Chevron Step ────────────────────────────────────────────────────────────
function ChevronStep({ stage, index, state, isLast, onClick, disabled }) {
  const isCompleted = state === "completed";
  const isActive = state === "active";
  const isUpcoming = state === "upcoming";
  const isInactive = state === "inactive";

  // Pasos completados o inactivos no son clickeables
  const isClickable = !disabled && !isCompleted && !isInactive && !isActive;

  return (
    <div className="relative flex items-center flex-1 min-w-0">
      {/* Step button */}
      <button
        onClick={isClickable ? onClick : undefined}
        disabled={!isClickable}
        title={isCompleted || isInactive ? "No podés volver a una etapa anterior" : undefined}
        className={cn(
          "relative flex-1 min-w-0 h-12 flex items-center gap-2.5 px-4 pl-5 transition-all duration-200 select-none outline-none group",
          // Base shape - first has rounded left, last has rounded right
          index === 0 ? "rounded-l-xl" : "",
          isLast ? "rounded-r-xl" : "",
          // States
          isCompleted && "bg-emerald-100 text-emerald-700 cursor-not-allowed",
          isActive && "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 cursor-default",
          isUpcoming && "bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 cursor-pointer",
          isInactive && "bg-slate-100 text-slate-300 cursor-not-allowed opacity-60",
        )}
      >
        {/* Step number / check icon */}
        <span className={cn(
          "flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold shrink-0 transition-all",
          isCompleted && "bg-emerald-600 text-white",
          isActive && "bg-white text-emerald-600",
          isUpcoming && "border-2 border-slate-300 text-slate-400 group-hover:border-slate-400",
          isInactive && "border-2 border-slate-200 text-slate-300",
        )}>
          {isCompleted ? <Check className="w-3.5 h-3.5" /> : index + 1}
        </span>

        {/* Label + description */}
        <span className="flex flex-col min-w-0 text-left">
          <span className="text-xs font-bold truncate leading-tight">{stage.label}</span>
          <span className={cn(
            "text-[10px] truncate leading-tight",
            isActive ? "text-emerald-100" : "text-current opacity-60"
          )}>
            {stage.description}
          </span>
        </span>
      </button>

      {/* Chevron connector — rendered after each step except the last */}
      {!isLast && (
        <div className={cn(
          "shrink-0 w-5 h-12 flex items-center justify-center z-10 -mx-px",
        )}>
          <svg viewBox="0 0 20 48" className="w-5 h-12" preserveAspectRatio="none">
            {/* Left fill matches the step color */}
            <polygon
              points="0,0 10,24 0,48"
              className={cn(
                "transition-colors duration-200",
                isCompleted ? "fill-emerald-100" : isActive ? "fill-emerald-600" : "fill-slate-100",
              )}
            />
            {/* Right arrow — matches next step or default */}
            <polygon
              points="10,0 20,24 10,48"
              className="fill-white"
            />
            {/* Arrow outline */}
            <polyline
              points="0,0 20,24 0,48"
              fill="none"
              strokeWidth="1.5"
              className={cn(
                "transition-colors duration-200",
                isCompleted ? "stroke-emerald-200" : "stroke-slate-200"
              )}
            />
          </svg>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function OportunidadChevronPath({ etapa, onTransicion, saving }) {
  const cerrada = etapa === "ganada" || etapa === "perdida";
  const currentIndex = ORDER.indexOf(etapa);
  const isLastStage = etapa === "negociacion";

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      {/* ── Progress Bar ── */}
      <div className="flex items-stretch gap-0 rounded-xl overflow-hidden border border-slate-200 bg-white">
        {STAGES.map((s, idx) => (
          <ChevronStep
            key={s.key}
            stage={s}
            index={idx}
            state={getStageState(s.key, etapa)}
            isLast={idx === STAGES.length - 1}
            onClick={() => onTransicion(s.key)}
            disabled={saving || cerrada}
          />
        ))}
      </div>

      {/* ── Actions Row ── */}
      <div className="mt-3 flex items-center justify-between gap-3">
        {cerrada ? (
          /* ── Closed state ── */
          <div className="flex items-center justify-between w-full gap-3">
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border",
              etapa === "ganada"
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-red-50 border-red-200 text-red-700"
            )}>
              {etapa === "ganada" ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Oportunidad Ganada</span>
                </>
              ) : (
                <>
                  <Ban className="w-4 h-4 text-red-500 shrink-0" />
                  <span>Oportunidad Perdida</span>
                </>
              )}
            </div>

            <button
              onClick={() => onTransicion("nueva")}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-[0.98]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reabrir
            </button>
          </div>
        ) : (
          /* ── Open state ── */
          <div className="flex items-center justify-between w-full gap-3">
            {/* Left: context hint or advance button */}
            {isLastStage ? (
              <p className="text-[11px] text-slate-400 font-medium leading-tight max-w-xs">
                Aceptá un presupuesto en la sección de abajo para marcar como Ganada.
              </p>
            ) : (
              <button
                onClick={() => onTransicion(ORDER[currentIndex + 1])}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-[0.98] shadow-sm"
              >
                Avanzar a {STAGES[currentIndex + 1]?.label}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Right: mark as lost */}
            <button
              onClick={() => onTransicion("perdida")}
              disabled={saving}
              title="Marcar como perdida"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-[0.98] text-xs font-bold"
            >
              <Ban className="w-3.5 h-3.5" />
              Perdida
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
