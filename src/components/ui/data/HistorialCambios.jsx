"use client";
import { History } from "lucide-react";
import Section from "../layout/Section";
import { Text } from "../basics/Typography";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────

function formatFecha(isoString) {
  if (!isoString) return "—";
  const d = new Date(isoString);
  return d.toLocaleString("es-PY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ACCION_STYLES = {
  Creación: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Edición: "bg-blue-50 text-blue-700 border-blue-200",
  Eliminación: "bg-red-50 text-red-700 border-red-200",
};

const ACCION_DOT = {
  Creación: "bg-emerald-400",
  Edición: "bg-blue-400",
  Eliminación: "bg-red-400",
};

// ─── Sub-components ───────────────────────────────────────────────

function CampoModificado({ campo, anterior, nuevo }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[11px]">
      <span className="font-semibold text-slate-600 shrink-0">{campo}:</span>
      <span className="text-slate-400 line-through">{anterior}</span>
      <span className="text-slate-300 shrink-0">→</span>
      <span className="text-slate-700 font-medium">{nuevo}</span>
    </div>
  );
}

function EntradaHistorial({ entrada, isLast }) {
  const dotClass = ACCION_DOT[entrada.accion] ?? ACCION_DOT[entrada.accion?.split(" ")[0]] ?? "bg-slate-400";
  const badgeClass =
    ACCION_STYLES[entrada.accion] ??
    ACCION_STYLES[entrada.accion?.split(" ")[0]] ??
    "bg-slate-50 text-slate-600 border-slate-200";

  return (
    <div className="flex gap-4">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center shrink-0">
        <div className={cn("w-2.5 h-2.5 rounded-full mt-1 shrink-0", dotClass)} />
        {!isLast && <div className="w-px flex-1 bg-slate-100 mt-1" />}
      </div>

      {/* Content */}
      <div className={cn("pb-6 min-w-0 flex-1", isLast && "pb-0")}>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-wider",
              badgeClass,
            )}
          >
            {entrada.accion}
          </span>
          <Text variant="bodyXs" className="text-slate-400 font-medium">
            {formatFecha(entrada.fecha)}
          </Text>
          <Text variant="bodyXs" className="text-slate-500 font-semibold">
            · {entrada.usuario}
          </Text>
        </div>

        {entrada.contexto && (
          <Text variant="bodyXs" className="text-slate-400 font-medium mb-1">
            {entrada.contexto}
          </Text>
        )}

        {entrada.campos_modificados?.length > 0 && (
          <div className="mt-2 space-y-1 pl-1 border-l-2 border-slate-100">
            {entrada.campos_modificados.map((c, i) => (
              <CampoModificado key={i} {...c} />
            ))}
          </div>
        )}

        {entrada.accion === "Creación" && !entrada.contexto && (
          <Text variant="bodyXs" className="text-slate-400 italic mt-1">
            Registro inicial del producto.
          </Text>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────

/**
 * HistorialCambios — componente genérico de timeline de auditoría.
 *
 * Props:
 *   - entradas: Array<{ id, fecha, usuario, accion, campos_modificados }>
 *   - loading?: boolean
 *   - title?: string
 *   - subtitle?: string
 */
export default function HistorialCambios({
  entradas = [],
  loading = false,
  title = "Historial de Cambios",
  subtitle = "Registro de modificaciones realizadas sobre este elemento.",
}) {
  return (
    <Section title={title} subtitle={subtitle}>
      <div className="p-6">
        {loading && (
          <div className="flex items-center gap-2 text-slate-400 py-4">
            <History size={16} className="animate-pulse" />
            <Text variant="bodyXs">Cargando historial...</Text>
          </div>
        )}

        {!loading && entradas.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
            <History size={28} className="text-slate-200" />
            <Text variant="bodySm" className="text-slate-400">
              Sin registros de cambios todavía.
            </Text>
          </div>
        )}

        {!loading && entradas.length > 0 && (
          <div>
            {entradas.map((entrada, i) => (
              <EntradaHistorial
                key={`${entrada.id}-${entrada.accion}-${i}`}
                entrada={entrada}
                isLast={i === entradas.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
