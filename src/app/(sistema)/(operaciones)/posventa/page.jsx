"use client";
import { Suspense } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Wrench,
  ClipboardList,
  AlertCircle,
  Clock,
  CheckCircle2,
  Plus,
  ShieldAlert,
} from "lucide-react";
import {
  PageHeader,
  Button,
  LoadingScreen,
  Text,
} from "@/components/ui";
import { Heading } from "@/components/ui/basics/Typography";
import { useApi } from "@/hooks/useApi";
import { getReclamos, getGarantias, getReparaciones } from "@/services/apis/posventa";

function PosventaContent() {
  const { data: reclamosData } = useApi(getReclamos, {
    auto: true,
    initialData: { results: [], count: 0 },
  });

  const { data: garantiasData } = useApi(getGarantias, {
    auto: true,
    initialData: { results: [], count: 0 },
  });

  const { data: reparacionesData } = useApi(getReparaciones, {
    auto: true,
    initialData: { results: [], count: 0 },
  });

  const reclamos = reclamosData?.results || [];
  const totalReclamos = reclamosData?.count || 0;
  const totalGarantias = garantiasData?.count || 0;

  const reclamosAbiertos = reclamos.filter(
    (r) => r.estado === "abierto" || r.estado === "en_revision"
  ).length;
  const reclamosEscalados = reclamos.filter((r) => r.estado === "escalado").length;
  const reparacionesActivas = (reparacionesData?.results || []).filter(
    (r) => !["entregado", "no_reparable"].includes(r.estado)
  ).length;

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[{ label: "Servicio Posventa" }]}
        subtitle="Garantías, reclamos, reparaciones y satisfacción del cliente"
        subtitleClassName="text-blue-600"
      >
        <div className="flex items-center gap-2">
          <Link href="/posventa/reclamos/nuevo">
            <Button variant="primary" size="md" icon={Plus} className="rounded-xl font-bold text-xs shadow-lg">
              NUEVO RECLAMO
            </Button>
          </Link>
        </div>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 group hover:border-blue-200 transition-all">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ClipboardList size={20} />
              </div>
              <div>
                <Text variant="label" className="mb-0.5">Total Reclamos</Text>
                <Heading level={4} className="leading-none">{totalReclamos}</Heading>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 group hover:border-amber-200 transition-all">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock size={20} />
              </div>
              <div>
                <Text variant="label" className="mb-0.5">Abiertos / En Revisión</Text>
                <Heading level={4} className="leading-none">{reclamosAbiertos}</Heading>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 group hover:border-rose-200 transition-all">
              <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldAlert size={20} />
              </div>
              <div>
                <Text variant="label" className="mb-0.5">Escalados</Text>
                <Heading level={4} className="leading-none">{reclamosEscalados}</Heading>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 group hover:border-indigo-200 transition-all">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wrench size={20} />
              </div>
              <div>
                <Text variant="label" className="mb-0.5">Reparaciones Activas</Text>
                <Heading level={4} className="leading-none">{reparacionesActivas}</Heading>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/posventa/reclamos"
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ClipboardList size={18} />
                </div>
                <Heading level={5}>Reclamos</Heading>
              </div>
              <Text variant="bodyXs" className="text-slate-500">
                Gestionar reclamos posventa, seguimiento y resolución de incidencias.
              </Text>
              <Text variant="label" className="mt-2 text-blue-600">
                {reclamosAbiertos} pendientes de atención
              </Text>
            </Link>

            <Link
              href="/posventa/garantias"
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShieldCheck size={18} />
                </div>
                <Heading level={5}>Garantías</Heading>
              </div>
              <Text variant="bodyXs" className="text-slate-500">
                Registro, verificación de vigencia y seguimiento de garantías.
              </Text>
              <Text variant="label" className="mt-2 text-emerald-600">
                {totalGarantias} garantías registradas
              </Text>
            </Link>

            <Link
              href="/posventa/reparaciones"
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-amber-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Wrench size={18} />
                </div>
                <Heading level={5}>Reparaciones</Heading>
              </div>
              <Text variant="bodyXs" className="text-slate-500">
                Seguimiento de equipos recibidos, diagnóstico y entrega al cliente.
              </Text>
              <Text variant="label" className="mt-2 text-amber-600">
                {reparacionesActivas} en proceso
              </Text>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PosventaPage() {
  return (
    <Suspense fallback={<LoadingScreen texto="Cargando servicio posventa..." />}>
      <PosventaContent />
    </Suspense>
  );
}
