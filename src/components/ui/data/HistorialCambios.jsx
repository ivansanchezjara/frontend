"use client";
import { useState } from "react";
import { History, Package, Layers, Image } from "lucide-react";
import Section from "../layout/Section";
import Pagination from "./Pagination";
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

/**
 * Detecta el "origen" de la entrada basándose en el campo `contexto`
 * que envía el backend:
 *   - Sin contexto → producto general
 *   - Contexto empieza con "Variante:" → variante
 *   - Contexto empieza con "Galería:" → imagen de galería
 */
function detectarOrigen(entrada) {
  if (!entrada.contexto) return "producto";
  if (entrada.contexto.startsWith("Variante:")) return "variante";
  if (entrada.contexto.startsWith("Galería:")) return "imagen";
  return "producto";
}

// Estilos por tipo de acción (Creación, Edición, Eliminación)
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

// Configuración visual por origen
const ORIGEN_CONFIG = {
  producto: {
    label: "Producto",
    icon: Package,
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    border: "border-l-slate-300",
  },
  variante: {
    label: "Variante",
    icon: Layers,
    badge: "bg-purple-50 text-purple-600 border-purple-200",
    border: "border-l-purple-300",
  },
  imagen: {
    label: "Galería",
    icon: Image,
    badge: "bg-amber-50 text-amber-600 border-amber-200",
    border: "border-l-amber-300",
  },
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

function OrigenBadge({ origen }) {
  const config = ORIGEN_CONFIG[origen];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-semibold",
        config.badge,
      )}
    >
      <Icon size={10} />
      {config.label}
    </span>
  );
}

function EntradaHistorial({ entrada, isLast }) {
  const origen = detectarOrigen(entrada);
  const origenConfig = ORIGEN_CONFIG[origen];

  // Extraer la acción base (sin el sufijo "(galería)" que agrega el backend)
  const accionBase = entrada.accion?.split(" ")[0] ?? entrada.accion;
  const dotClass = ACCION_DOT[accionBase] ?? "bg-slate-400";
  const badgeClass = ACCION_STYLES[accionBase] ?? "bg-slate-50 text-slate-600 border-slate-200";

  // Texto descriptivo del contexto (sin el prefijo "Variante:" o "Galería:")
  const contextoLimpio = entrada.contexto
    ? entrada.contexto.replace(/^(Variante:|Galería:)\s*/, "")
    : null;

  return (
    <div className="flex gap-4">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center shrink-0">
        <div className={cn("w-2.5 h-2.5 rounded-full mt-1 shrink-0", dotClass)} />
        {!isLast && <div className="w-px flex-1 bg-slate-100 mt-1" />}
      </div>

      {/* Content */}
      <div className={cn("pb-6 min-w-0 flex-1", isLast && "pb-0")}>
        {/* Header row: badges + fecha + usuario */}
        <div className="flex flex-wrap items-center gap-1.5 mb-1">
          <OrigenBadge origen={origen} />
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-wider",
              badgeClass,
            )}
          >
            {accionBase}
          </span>
          <Text variant="bodyXs" className="text-slate-400 font-medium">
            {formatFecha(entrada.fecha)}
          </Text>
          <Text variant="bodyXs" className="text-slate-500 font-semibold">
            · {entrada.usuario}
          </Text>
        </div>

        {/* Contexto descriptivo (nombre de variante o imagen) */}
        {contextoLimpio && (
          <div
            className={cn(
              "mt-1 pl-2 border-l-2 text-[11px] font-medium text-slate-500",
              origenConfig.border,
            )}
          >
            {contextoLimpio}
          </div>
        )}

        {/* Campos modificados */}
        {entrada.campos_modificados?.length > 0 && (
          <div className="mt-2 space-y-1 pl-2 border-l-2 border-slate-100">
            {entrada.campos_modificados.map((c, i) => (
              <CampoModificado key={i} {...c} />
            ))}
          </div>
        )}

        {/* Mensaje para creaciones de producto sin contexto */}
        {accionBase === "Creación" && origen === "producto" && (
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
 *   - entradas: Array<{ id, fecha, usuario, accion, campos_modificados, contexto? }>
 *   - loading?: boolean
 *   - title?: string
 *   - subtitle?: string
 *   - pageSize?: number (default 10)
 */
export default function HistorialCambios({
  entradas = [],
  loading = false,
  title = "Historial de Cambios",
  subtitle = "Registro de modificaciones realizadas sobre este elemento.",
  pageSize = 10,
}) {
  const [currentPage, setCurrentPage] = useState(1);

  // Paginación client-side
  const totalEntradas = entradas.length;
  const startIdx = (currentPage - 1) * pageSize;
  const entradasPagina = entradas.slice(startIdx, startIdx + pageSize);

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
          <>
            {/* Leyenda de colores */}
            <div className="flex flex-wrap gap-3 mb-5 pb-4 border-b border-slate-100">
              {Object.entries(ORIGEN_CONFIG).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <div key={key} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded border font-semibold", config.badge)}>
                      <Icon size={10} />
                      {config.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div>
              {entradasPagina.map((entrada, i) => (
                <EntradaHistorial
                  key={`${entrada.id}-${entrada.accion}-${startIdx + i}`}
                  entrada={entrada}
                  isLast={i === entradasPagina.length - 1}
                />
              ))}
            </div>

            {/* Paginación */}
            <Pagination
              count={totalEntradas}
              pageSize={pageSize}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
    </Section>
  );
}
