"use client";
import { MessageSquare } from "lucide-react";
import { usePreguntasAdmin } from "@/hooks/usePreguntasAdmin";
import { PageHeader, EmptyState, LoadingScreen, Text } from "@/components/ui";
import PreguntaCard from "@/components/ecommerce/PreguntaCard";
import PreguntaFiltros from "@/components/ecommerce/PreguntaFiltros";

// ─── Helpers ────────────────────────────────────────────────────

function pluralizar(n, singular, plural) {
  return n === 1 ? singular : plural;
}

function formatearResumen(cantidad, filtroEstado, busquedaLocal) {
  const sujeto = pluralizar(cantidad, "pregunta", "preguntas");
  let sufijo = "";
  if (filtroEstado === "pendientes") {
    sufijo = ` ${pluralizar(cantidad, "pendiente", "pendientes")}`;
  } else if (filtroEstado === "respondidas") {
    sufijo = ` ${pluralizar(cantidad, "respondida", "respondidas")}`;
  }
  const busquedaSufijo = busquedaLocal
    ? ` ${pluralizar(cantidad, "encontrada", "encontradas")} para "${busquedaLocal}"`
    : "";
  return `${cantidad} ${sujeto}${sufijo}${busquedaSufijo}`;
}

// ─── Página ─────────────────────────────────────────────────────

export default function PreguntasEcommercePage() {
  const {
    preguntas,
    loading,
    filtroEstado,
    setFiltroEstado,
    busquedaLocal,
    setBusquedaLocal,
    handleResponder,
    handleDelete,
  } = usePreguntasAdmin();

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/30">
      <PageHeader
        breadcrumbs={[
          { label: "E-commerce", href: "/ecommerce" },
          { label: "Preguntas" },
        ]}
        subtitle="Responder consultas de clientes"
        subtitleClassName="text-emerald-600"
      />

      <main className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0">
        <div className="max-w-4xl mx-auto space-y-6">
          <PreguntaFiltros
            filtroEstado={filtroEstado}
            setFiltroEstado={setFiltroEstado}
            busquedaLocal={busquedaLocal}
            setBusquedaLocal={setBusquedaLocal}
          />

          {/* Resumen */}
          {!loading && (preguntas.length > 0 || busquedaLocal) && (
            <Text variant="bodyXs" as="p" aria-live="polite">
              {formatearResumen(preguntas.length, filtroEstado, busquedaLocal)}
            </Text>
          )}

          {/* Contenido */}
          <div id="preguntas-panel" role="tabpanel" aria-label="Lista de preguntas">
            {loading ? (
              <LoadingScreen texto="Cargando preguntas..." />
            ) : preguntas.length === 0 ? (
              <EmptyState
                icon={<MessageSquare size={32} strokeWidth={1.5} />}
                titulo={
                  busquedaLocal
                    ? "Sin resultados de búsqueda"
                    : filtroEstado === "pendientes"
                      ? "Sin preguntas pendientes"
                      : "Sin preguntas"
                }
                descripcion={
                  busquedaLocal
                    ? `No encontramos preguntas que coincidan con "${busquedaLocal}".`
                    : filtroEstado === "pendientes"
                      ? "¡Estás al día! No hay preguntas esperando respuesta."
                      : "Las preguntas de clientes aparecerán aquí."
                }
                textoBoton={busquedaLocal ? "Limpiar búsqueda" : undefined}
                onAction={busquedaLocal ? () => setBusquedaLocal("") : undefined}
              />
            ) : (
              <div className="space-y-4">
                {preguntas.map((p) => (
                  <PreguntaCard
                    key={p.id}
                    pregunta={p}
                    onResponder={handleResponder}
                    onDelete={handleDelete}
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
