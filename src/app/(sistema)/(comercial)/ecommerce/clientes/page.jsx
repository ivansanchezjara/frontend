"use client";
import { Users, Search, Globe } from "lucide-react";
import { useClientesOnline } from "@/hooks/useClientesOnline";
import { PageHeader, EmptyState, LoadingScreen, Text, Input, Badge } from "@/components/ui";
import ClienteOnlineCard from "@/components/ecommerce/ClienteOnlineCard";

// ─── Constantes ─────────────────────────────────────────────────

const TIERS = [
  { id: "", label: "Todos" },
  { id: "publico", label: "Público" },
  { id: "estudiante", label: "Estudiante" },
  { id: "reventa", label: "Reventa" },
  { id: "mayorista", label: "Mayorista" },
];

// ─── Página ─────────────────────────────────────────────────────

export default function ClientesOnlinePage() {
  const {
    clientes,
    total,
    loading,
    busquedaLocal,
    setBusquedaLocal,
    filtroTier,
    setFiltroTier,
  } = useClientesOnline();

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/30">
      <PageHeader
        breadcrumbs={[
          { label: "E-commerce", href: "/ecommerce" },
          { label: "Clientes Online" },
        ]}
        subtitle="Cuentas con acceso a la tienda"
        subtitleClassName="text-emerald-600"
      />

      <main className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Resumen rápido */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
              <Globe size={18} className="text-white" />
            </div>
            <div>
              <Text variant="bodySmBold" as="p" className="text-slate-800">
                {total} {total === 1 ? "cliente" : "clientes"} con cuenta online
              </Text>
              <Text variant="bodyXs" as="p">
                Cuentas que pueden acceder a la tienda e-commerce, hacer pedidos y ver precios por tier.
              </Text>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div
              className="flex gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto overflow-x-auto"
              role="tablist"
              aria-label="Filtrar por tier de precio"
            >
              {TIERS.map((tier) => {
                const isActive = filtroTier === tier.id;
                return (
                  <button
                    key={tier.id}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setFiltroTier(tier.id)}
                    className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-bold transition-colors duration-200 ${
                      isActive
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {tier.label}
                  </button>
                );
              })}
            </div>

            <div className="w-full sm:max-w-xs">
              <Input
                placeholder="Buscar por nombre, RUC, email..."
                value={busquedaLocal}
                onChange={(e) => setBusquedaLocal(e.target.value)}
                icon={Search}
                aria-label="Buscar clientes online"
                className="bg-white border-slate-200 text-xs py-1.5 focus:border-emerald-300"
                fullWidth={true}
              />
            </div>
          </div>

          {/* Resumen de resultados */}
          {!loading && (clientes.length > 0 || busquedaLocal) && (
            <Text variant="bodyXs" as="p" aria-live="polite">
              {clientes.length} {clientes.length === 1 ? "cliente encontrado" : "clientes encontrados"}
              {filtroTier && ` en tier "${TIERS.find((t) => t.id === filtroTier)?.label}"`}
              {busquedaLocal && ` para "${busquedaLocal}"`}
            </Text>
          )}

          {/* Contenido */}
          {loading ? (
            <LoadingScreen texto="Cargando clientes online..." />
          ) : clientes.length === 0 ? (
            <EmptyState
              icon={<Users size={32} strokeWidth={1.5} />}
              titulo={busquedaLocal ? "Sin resultados" : "Sin clientes online"}
              descripcion={
                busquedaLocal
                  ? `No encontramos clientes que coincidan con "${busquedaLocal}".`
                  : "Cuando se habilite la cuenta online de un cliente desde el CRM, aparecerá acá."
              }
              textoBoton={busquedaLocal ? "Limpiar búsqueda" : undefined}
              onAction={busquedaLocal ? () => setBusquedaLocal("") : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clientes.map((c) => (
                <ClienteOnlineCard key={c.id} cliente={c} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
