"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { LoadingScreen, PageHeader } from "@/components/ui";
import { useToast, useConfirm } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { getOportunidad, updateOportunidad, getInteracciones } from "@/services/apis/ventas";

import { cn } from "@/lib/utils";
import DetalleSection from "@/components/comercial/ventas/ventas/DetalleSection";
import ProductosInteresSection from "@/components/comercial/ventas/clientes/ProductosInteresSection";
import PresupuestoSection from "@/components/comercial/ventas/presupuestos/PresupuestoSection";
import InteraccionesSection from "@/components/comercial/ventas/clientes/InteraccionesSection";
import OportunidadChevronPath from "@/components/comercial/ventas/pipeline/OportunidadChevronPath";
import OportunidadGuidanceCard from "@/components/comercial/ventas/pipeline/OportunidadGuidanceCard";
import ClienteSidebarCard from "@/components/comercial/ventas/clientes/ClienteSidebarCard";

// ─── Página de detalle ──────────────────────────────────────────

export default function OportunidadDetallePage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { prompt: promptDialog } = useConfirm();

  const {
    data: oportunidad,
    loading,
    execute: fetchOportunidad,
  } = useApi(getOportunidad);

  const { data: interaccionesData, execute: fetchInteracciones } =
    useApi(getInteracciones);

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("actividad");

  useEffect(() => {
    if (id) {
      fetchOportunidad(id);
      fetchInteracciones({ oportunidad: id });
    }
  }, [id, fetchOportunidad, fetchInteracciones]);

  // ─── Transición de etapa ────────────────────────────────────
  const handleTransicion = async (nuevaEtapa) => {
    setSaving(true);
    try {
      const payload = { etapa: nuevaEtapa };
      if (nuevaEtapa === "perdida") {
        const motivo = await promptDialog(
          "Indicá el motivo por el cual se pierde esta oportunidad.",
          "Marcar como perdida",
          { placeholder: "Ej: El cliente eligió otro proveedor", confirmText: "Confirmar", type: "danger" }
        );
        if (motivo === null) {
          setSaving(false);
          return;
        }
        payload.motivo_perdida = motivo || "";
      }
      await updateOportunidad(id, payload);
      showToast("Etapa actualizada", "success");
      fetchOportunidad(id);
    } catch (err) {
      const detail =
        err?.data?.etapa?.[0] || err?.data?.detail || "Error al cambiar etapa";
      showToast(detail, "error");
    } finally {
      setSaving(false);
    }
  };

  // ─── Loading ────────────────────────────────────────────────
  if (loading || !oportunidad)
    return <LoadingScreen texto="Cargando oportunidad..." />;

  const interacciones = interaccionesData?.results || [];
  const etapa = oportunidad.etapa;
  const cerrada = etapa === "ganada" || etapa === "perdida";

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Oportunidades", href: "/ventas-crm/oportunidades" },
          { label: oportunidad.titulo },
        ]}
        subtitle={`Cliente: ${oportunidad.cliente_razon_social}`}
        subtitleClassName="text-emerald-600"
      />

      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Chevron Path Tracker */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6">
          <OportunidadChevronPath
            etapa={etapa}
            onTransicion={handleTransicion}
            saving={saving}
          />
        </div>

        {/* Grid de Dos Columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto px-4 md:px-8 py-6 pb-16">

          {/* Columna Izquierda: Pestañas de Trabajo */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-px">
              <button
                onClick={() => setActiveTab("actividad")}
                className={cn(
                  "py-3 px-4 md:px-6 text-xs md:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap outline-none",
                  activeTab === "actividad"
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                )}
              >
                Actividad e Interacciones
              </button>
              <button
                onClick={() => setActiveTab("productos")}
                className={cn(
                  "py-3 px-4 md:px-6 text-xs md:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap outline-none",
                  activeTab === "productos"
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                )}
              >
                Productos de Interés
              </button>
              <button
                onClick={() => setActiveTab("presupuestos")}
                className={cn(
                  "py-3 px-4 md:px-6 text-xs md:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap outline-none",
                  activeTab === "presupuestos"
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                )}
              >
                Presupuestos
              </button>
            </div>

            {/* Contenido Dinámico de la Pestaña */}
            <div className="animate-in fade-in-50 duration-200">
              {activeTab === "actividad" && (
                <InteraccionesSection
                  oportunidadId={id}
                  interacciones={interacciones}
                  cerrada={cerrada}
                  onCreated={() => fetchInteracciones({ oportunidad: id })}
                />
              )}
              {activeTab === "productos" && (
                <ProductosInteresSection
                  oportunidadId={id}
                  productos={oportunidad.productos || []}
                  editable={!cerrada}
                  onUpdated={() => fetchOportunidad(id)}
                />
              )}
              {activeTab === "presupuestos" && (
                <PresupuestoSection
                  oportunidadId={id}
                  etapa={etapa}
                  onGanada={() => fetchOportunidad(id)}
                />
              )}
            </div>
          </div>

          {/* Columna Derecha: Sidebar de Datos e Inforación */}
          <div className="space-y-6">
            <OportunidadGuidanceCard
              etapa={etapa}
              motivoPerdida={oportunidad.motivo_perdida}
            />

            <ClienteSidebarCard
              clienteId={oportunidad.cliente}
            />

            <DetalleSection
              oportunidad={oportunidad}
              cerrada={cerrada}
              onUpdated={() => fetchOportunidad(id)}
            />
          </div>

        </div>
      </main>
    </div>
  );
}
