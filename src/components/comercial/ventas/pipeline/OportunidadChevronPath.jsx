"use client";
import { Check, Ban, CheckCircle2, RotateCcw, ArrowRight, Trophy, X } from "lucide-react";
import { cn } from "@/lib/utils";

const STAGES = [
  { key: "nueva",       label: "Nueva",       description: "Lead identificado" },
  { key: "contactada",  label: "Contactada",  description: "En comunicación"   },
  { key: "negociacion", label: "Negociación", description: "Propuesta enviada" },
];

const ORDER = ["nueva", "contactada", "negociacion"];

function getStageState(stageKey, etapa) {
  if (etapa === "perdida") return "inactive";
  if (etapa === "ganada")  return "completed";

  const currentIndex = ORDER.indexOf(etapa);
  const stageIndex   = ORDER.indexOf(stageKey);

  if (stageIndex < currentIndex)  return "completed";
  if (stageIndex === currentIndex) return "active";
  return "upcoming";
}

// ─── Step Node ───────────────────────────────────────────────────────────────
function StepNode({ stage, index, state, isLast, onClick, disabled }) {
  const isCompleted = state === "completed";
  const isActive    = state === "active";
  const isInactive  = state === "inactive";
  // Solo los upcoming son clickeables (no podés ir para atrás)
  const isClickable = !disabled && state === "upcoming";

  return (
    <div className="flex flex-col items-center flex-1 min-w-0 relative">
      {/* Connector line — left half */}
      {index > 0 && (
        <div className="absolute top-5 right-1/2 left-0 h-0.5 -translate-y-px z-0">
          <div className={cn(
            "h-full transition-colors duration-500",
            isCompleted || isActive ? "bg-emerald-500" : "bg-slate-200"
          )} />
        </div>
      )}
      {/* Connector line — right half */}
      {!isLast && (
        <div className="absolute top-5 left-1/2 right-0 h-0.5 -translate-y-px z-0">
          <div className={cn(
            "h-full transition-colors duration-500",
            isCompleted ? "bg-emerald-500" : "bg-slate-200"
          )} />
        </div>
      )}

      {/* Circle */}
      <button
        onClick={isClickable ? onClick : undefined}
        disabled={!isClickable}
        title={isCompleted ? "No podés volver a una etapa anterior" : undefined}
        className={cn(
          "relative z-10 w-10 h-10 rounded-full flex items-center justify-center",
          "transition-all duration-200 outline-none ring-offset-2 focus-visible:ring-2 ring-emerald-400",
          isCompleted && "bg-emerald-500 text-white cursor-not-allowed shadow-md shadow-emerald-200",
          isActive    && "bg-emerald-600 text-white cursor-default shadow-lg shadow-emerald-300/50 ring-4 ring-emerald-100",
          isClickable && "bg-white text-slate-400 border-2 border-slate-200 hover:border-emerald-400 hover:text-emerald-500 hover:shadow-sm cursor-pointer",
          !isClickable && state === "upcoming" && "bg-white text-slate-300 border-2 border-slate-200 cursor-not-allowed",
          isInactive  && "bg-slate-100 text-slate-300 border-2 border-slate-200 cursor-not-allowed opacity-50",
        )}
      >
        {isCompleted
          ? <Check className="w-4 h-4" />
          : <span className="text-xs font-bold">{index + 1}</span>
        }
      </button>

      {/* Labels */}
      <div className="mt-2 flex flex-col items-center text-center px-1">
        <span className={cn(
          "text-xs font-semibold leading-tight truncate max-w-full",
          isActive    && "text-emerald-700",
          isCompleted && "text-emerald-600",
          isClickable && "text-slate-500",
          (!isClickable && state === "upcoming") && "text-slate-400",
          isInactive  && "text-slate-300",
        )}>
          {stage.label}
        </span>
        <span className={cn(
          "text-[10px] leading-tight truncate max-w-full mt-0.5",
          isActive    ? "text-emerald-500" : "text-slate-400 opacity-70",
          isInactive  && "opacity-30",
        )}>
          {stage.description}
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function OportunidadChevronPath({ etapa, onTransicion, saving }) {
  const cerrada      = etapa === "ganada" || etapa === "perdida";
  const currentIndex = ORDER.indexOf(etapa);
  const isLastStage  = etapa === "negociacion";

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

      {/* ── Closed banner ─────────────────────────────────────────────────── */}
      {cerrada && (
        <div className={cn(
          "flex items-center justify-between px-5 py-3 border-b text-sm font-semibold",
          etapa === "ganada"
            ? "bg-emerald-50 border-emerald-100 text-emerald-700"
            : "bg-red-50 border-red-100 text-red-700"
        )}>
          <div className="flex items-center gap-2">
            {etapa === "ganada"
              ? <><Trophy className="w-4 h-4 text-emerald-500" /> Oportunidad Ganada</>
              : <><X      className="w-4 h-4 text-red-500"     /> Oportunidad Perdida</>
            }
          </div>
          <button
            onClick={() => onTransicion("nueva")}
            disabled={saving}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 transition-all disabled:opacity-50 cursor-pointer active:scale-[0.97]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reabrir
          </button>
        </div>
      )}

      {/* ── Step tracker ──────────────────────────────────────────────────── */}
      <div className="px-6 pt-5 pb-4">
        <div className="flex items-start">
          {STAGES.map((s, idx) => (
            <StepNode
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
      </div>

      {/* ── Action bar ────────────────────────────────────────────────────── */}
      {!cerrada && (
        <div className="flex items-center justify-between gap-3 px-5 py-3 bg-slate-50/70 border-t border-slate-100">
          {isLastStage ? (
            <p className="text-[11px] text-slate-400 font-medium leading-tight">
              Aceptá un presupuesto en la sección de abajo para marcar como Ganada.
            </p>
          ) : (
            <button
              onClick={() => onTransicion(ORDER[currentIndex + 1])}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-[0.97] shadow-sm"
            >
              Avanzar a {STAGES[currentIndex + 1]?.label}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => onTransicion("perdida")}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-[0.97] text-xs font-bold"
          >
            <Ban className="w-3.5 h-3.5" />
            Marcar perdida
          </button>
        </div>
      )}
    </div>
  );
}
