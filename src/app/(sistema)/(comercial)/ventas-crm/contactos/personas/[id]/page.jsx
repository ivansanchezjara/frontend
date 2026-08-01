"use client";
import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { SearchX, ShoppingBag, Plus, Tag } from "lucide-react";

import InteraccionTimeline from "@/components/comercial/ventas/clientes/InteraccionTimeline";
import {
  RelacionesSection, CuentaOnlineSection,
  DatosPersonaForm, TierPrecioSection, HistorialCompras,
} from "@/components/comercial/personas";
import { VerificacionEstudianteSection } from "@/components/comercial/personas/VerificacionEstudianteSection";
import {
  Button, Badge, LoadingScreen, PageHeader, Section,
} from "@/components/ui";
import { Heading, Text } from "@/components/ui/basics/Typography";
import { useApi } from "@/hooks/useApi";
import { CATEGORIA_LABELS, TIER_LABELS } from "@/config/personas";
import {
  getPersona, getInteracciones,
  habilitarOnlinePersona, deshabilitarOnlinePersona,
} from "@/services/apis/ventas";

// ─── Página Principal ───────────────────────────────────────────

export default function PerfilPersonaPage() {
  const { id } = useParams();

  const [notFound, setNotFound] = useState(false);

  // ─── Fetch persona ──────────────────────────────────────────
  const handleError = useCallback((err) => {
    if (err.status === 404) setNotFound(true);
  }, []);

  const {
    data: persona,
    loading,
    setData: setPersona,
    refetch: refetchPersona,
  } = useApi(getPersona, {
    auto: true,
    initialData: null,
    args: [id],
    onError: handleError,
  });

  // ─── Fetch interacciones ────────────────────────────────────
  const {
    data: interaccionesData,
    loading: interaccionesLoading,
  } = useApi(getInteracciones, {
    auto: true,
    args: [{ cliente: id, ordering: "-fecha" }],
    initialData: null,
  });

  const interacciones = interaccionesData?.results || [];

  // ─── Estados de carga y error ───────────────────────────────
  if (loading) return <LoadingScreen texto="Cargando perfil..." />;

  if (notFound) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-6 inline-flex rounded-3xl bg-slate-900 p-4 text-white shadow-2xl shadow-blue-500/20">
            <SearchX size={44} strokeWidth={2.5} aria-hidden="true" />
          </div>
          <Heading level={3}>Persona no encontrada</Heading>
          <Text className="mt-2">La persona solicitada no existe o fue desactivada.</Text>
          <Button
            as={Link}
            href="/ventas-crm/contactos/personas"
            className="mt-6 bg-slate-900 text-white font-black hover:bg-slate-800 shadow-lg active:scale-[0.98]"
          >
            Volver a Personas
          </Button>
        </div>
      </main>
    );
  }

  if (!persona) return null;

  // Badges para el header
  const headerBadges = [];
  if (persona.categoria) headerBadges.push(CATEGORIA_LABELS[persona.categoria] || persona.categoria);

  return (
    <div className="flex h-screen flex-1 flex-col overflow-hidden bg-slate-50/50">
      {/* Header */}
      <PageHeader
        breadcrumbs={[
          { label: "Ventas y CRM", href: "/ventas-crm" },
          { label: "Contactos", href: "/ventas-crm/contactos" },
          { label: "Personas", href: "/ventas-crm/contactos/personas" },
          { label: persona.razon_social },
        ]}
        subtitle={
          <span className="flex items-center gap-2 flex-wrap">
            <Badge variant="info">{TIER_LABELS[persona.tier_precio] || persona.tier_precio}</Badge>
            {headerBadges.map((b) => (
              <Badge key={b} variant="secondary">{b}</Badge>
            ))}
            {persona.etapa === "prospecto" && <Badge variant="warning">Prospecto</Badge>}
            {persona.etapa === "inactivo" && <Badge variant="danger">Inactivo</Badge>}
          </span>
        }
        subtitleClassName="text-blue-600"
      />

      {/* Contenido principal */}
      <main className="min-w-0 flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-4xl space-y-6">

          {/* Sección: Datos de la Persona */}
          <Section
            title="Datos de la Persona"
            subtitle="Información completa. Los campos con * son obligatorios."
            action={
              persona.ruc && (
                <Text variant="bodyXs" className="text-slate-400">
                  RUC: <span className="font-bold text-slate-600">{persona.ruc}</span>
                </Text>
              )
            }
          >
            <DatosPersonaForm
              persona={persona}
              onSaved={(updated) => setPersona(updated)}
            />
          </Section>

          {/* Sección: Tier de Precio */}
          <Section
            title="Tier de Precio"
            subtitle="Define qué lista de precios se aplica por defecto."
            action={
              <div className="flex items-center gap-1.5 text-slate-400">
                <Tag size={14} aria-hidden="true" />
                <Text variant="bodyXs">{TIER_LABELS[persona.tier_precio] || persona.tier_precio}</Text>
              </div>
            }
          >
            <TierPrecioSection
              personaId={id}
              tierActual={persona.tier_precio}
              esEstudianteActivo={persona.es_estudiante_activo}
              onUpdated={refetchPersona}
            />
          </Section>

          {/* Sección: Verificación de Estudiante */}
          <VerificacionEstudianteSection persona={persona} onUpdated={refetchPersona} />

          {/* Sección: Relaciones y Vínculos */}
          <RelacionesSection persona={persona} onRelacionesChanged={refetchPersona} />

          {/* Sección: Historial de Compras */}
          <Section
            title="Historial de Compras"
            subtitle="Ventas confirmadas asociadas a esta persona."
            action={
              <div className="flex items-center gap-1.5 text-slate-400">
                <ShoppingBag size={14} aria-hidden="true" />
                <Text variant="bodyXs">Confirmadas</Text>
              </div>
            }
          >
            <HistorialCompras personaId={id} />
          </Section>

          {/* Sección: Interacciones */}
          <Section
            title="Interacciones"
            subtitle="Historial de contacto, más recientes primero."
            action={
              <Button
                as={Link}
                href={`/ventas-crm/contactos/${id}/nueva-interaccion`}
                variant="ghost"
                size="sm"
                icon={Plus}
              >
                Nueva
              </Button>
            }
          >
            <InteraccionTimeline
              interacciones={interacciones}
              loading={interaccionesLoading}
            />
          </Section>

          {/* Sección: Cuenta E-commerce */}
          <CuentaOnlineSection
            persona={persona}
            onHabilitar={async () => {
              const res = await habilitarOnlinePersona(id);
              setPersona(res.persona);
            }}
            onDeshabilitar={async () => {
              const updated = await deshabilitarOnlinePersona(id);
              setPersona(updated);
            }}
          />

        </div>
      </main>
    </div>
  );
}
