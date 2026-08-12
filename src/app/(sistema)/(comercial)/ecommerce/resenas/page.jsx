"use client";
import { Star } from "lucide-react";
import { useResenasAdmin } from "@/hooks/useResenasAdmin";
import { PageHeader, EmptyState, LoadingScreen, Text } from "@/components/ui";
import ResenaCard from "@/components/ecommerce/ResenaCard";
import ResenaFiltros from "@/components/ecommerce/ResenaFiltros";

// ─── Helpers ────────────────────────────────────────────────────

function pluralizar(n, singular, plural) {
  return n === 1 ? singular : plural;
}

function formatearResumen(cantidad, filtroEstado, busquedaLocal) {
  const sujeto = pluralizar(cantidad, "reseña", "reseñas");
  let sufijo = "";
  if (filtroEstado === "aprobadas") {
    sufijo = ` ${pluralizar(cantidad, "aprobada", "aprobadas")}`;
  } else if (filtroEstado === "pendientes") {
    sufijo = ` ${pluralizar(cantidad, "oculta", "ocultas")}`;
  }
  const busquedaSufijo = busquedaLocal
    ? ` ${pluralizar(cantidad, "encontrada", "encontradas")} para "${busquedaLocal}"`
    : "";
  return `${cantidad} ${sujeto}${sufijo}${busquedaSufijo}`;
}

// ─── Página ─────────────────────────────────────────────────────

export default function ResenasEcommercePage() {
  const {
    resenas,
    loading,
    filtroEstado,
    setFiltroEstado,
    busquedaLocal,
    setBusquedaLocal,
    handleToggleAprobada,
  } = useResenasAdmin();

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/30">
      <PageHeader
        breadcrumbs={[
          { label: "E-commerce", href: "/ecommerce" },
          { label: "Reseñas" },
        ]}
        subtitle="Moderar evaluaciones de clientes"
        subtitleClassName="text-emerald-600"
      />

      <main className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0">
        <div className="max-w-4xl mx-auto space-y-6">
          <ResenaFiltros
            filtroEstado={filtroEstado}
            setFiltroEstado={setFiltroEstado}
            busquedaLocal={busquedaLocal}
            setBusquedaLocal={setBusquedaLocal}
          />

          {/* Resumen */}
          {!loading && (resenas.length > 0 || busquedaLocal) && (
            <Text variant="bodyXs" as="p" aria-live="polite">
              {formatearResumen(resenas.length, filtroEstado, busquedaLocal)}
            </Text>
          )}

          {/* Contenido */}
          <div id="resenas-panel" role="tabpanel" aria-label="Lista de reseñas">
            {loading ? (
              <LoadingScreen texto="Cargando reseñas..." />
            ) : resenas.length === 0 ? (
              <EmptyState
                icon={<Star size={32} strokeWidth={1.5} />}
                titulo={
                  busquedaLocal
                    ? "Sin resultados de búsqueda"
                    : filtroEstado === "pendientes"
                      ? "Sin reseñas ocultas"
                      : "Sin reseñas"
                }
                descripcion={
                  busquedaLocal
                    ? `No encontramos reseñas que coincidan con "${busquedaLocal}".`
                    : "Las evaluaciones de clientes aparecerán aquí."
                }
                textoBoton={busquedaLocal ? "Limpiar búsqueda" : undefined}
                onAction={busquedaLocal ? () => setBusquedaLocal("") : undefined}
              />
            ) : (
              <div className="space-y-4">
                {resenas.map((r) => (
                  <ResenaCard
                    key={r.id}
                    resena={r}
                    onToggleAprobada={handleToggleAprobada}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
