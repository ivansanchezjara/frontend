"use client";
import { Suspense } from "react";
import Link from "next/link";
import {
  Wrench,
  Users,
  ClipboardList,
  AlertCircle,
  Clock,
  CheckCircle2,
  Plus,
  MapPin,
} from "lucide-react";
import {
  PageHeader,
  Button,
  LoadingScreen,
  Text,
} from "@/components/ui";
import { Heading } from "@/components/ui/basics/Typography";
import { useApi } from "@/hooks/useApi";
import { getOrdenes, getTecnicos } from "@/services/apis/asistencia";

function AsistenciaContent() {
  const { data: ordenesData } = useApi(getOrdenes, {
    auto: true,
    initialData: { results: [], count: 0 },
  });

  const { data: tecnicosData } = useApi(getTecnicos, {
    auto: true,
    initialData: { results: [], count: 0 },
  });

  const ordenes = ordenesData?.results || [];
  const totalOrdenes = ordenesData?.count || 0;
  const totalTecnicos = tecnicosData?.results?.length || tecnicosData?.count || 0;

  const pendientes = ordenes.filter((o) => o.estado === "pendiente").length;
  const enProgreso = ordenes.filter((o) => o.estado === "en_progreso").length;
  const completadas = ordenes.filter((o) => o.estado === "completada").length;

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[{ label: "Asistencia Técnica" }]}
        subtitle="Gestión de órdenes de trabajo y técnicos"
        subtitleClassName="text-blue-600"
      >
        <div className="flex items-center gap-2">
          <Link href="/asistencia-tecnica/ordenes/nueva">
            <Button variant="primary" size="md" icon={Plus} className="rounded-xl font-bold text-xs shadow-lg">
              NUEVA ORDEN
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
                <Text variant="label" className="mb-0.5">Total Órdenes</Text>
                <Heading level={4} className="leading-none">{totalOrdenes}</Heading>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 group hover:border-amber-200 transition-all">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock size={20} />
              </div>
              <div>
                <Text variant="label" className="mb-0.5">Pendientes</Text>
                <Heading level={4} className="leading-none">{pendientes}</Heading>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 group hover:border-indigo-200 transition-all">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wrench size={20} />
              </div>
              <div>
                <Text variant="label" className="mb-0.5">En Progreso</Text>
                <Heading level={4} className="leading-none">{enProgreso}</Heading>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 group hover:border-emerald-200 transition-all">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <Text variant="label" className="mb-0.5">Completadas</Text>
                <Heading level={4} className="leading-none">{completadas}</Heading>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/asistencia-tecnica/ordenes"
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ClipboardList size={18} />
                </div>
                <Heading level={5}>Órdenes de Trabajo</Heading>
              </div>
              <Text variant="bodyXs" className="text-slate-500">
                Gestionar órdenes de servicio, asignar técnicos y dar seguimiento.
              </Text>
            </Link>

            <Link
              href="/asistencia-tecnica/tecnicos"
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users size={18} />
                </div>
                <Heading level={5}>Técnicos</Heading>
              </div>
              <Text variant="bodyXs" className="text-slate-500">
                Gestionar personal técnico, agenda y disponibilidad.
              </Text>
              <Text variant="label" className="mt-2 text-blue-600">
                {totalTecnicos} técnicos registrados
              </Text>
            </Link>

            <Link
              href="/asistencia-tecnica/tipos-servicio"
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <AlertCircle size={18} />
                </div>
                <Heading level={5}>Tipos de Servicio</Heading>
              </div>
              <Text variant="bodyXs" className="text-slate-500">
                Configurar catálogo de servicios, SLA y duraciones estimadas.
              </Text>
            </Link>

            <Link
              href="/asistencia-tecnica/rastreo"
              className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MapPin size={18} />
                </div>
                <Heading level={5}>Rastreo en Vivo</Heading>
              </div>
              <Text variant="bodyXs" className="text-slate-500">
                Ver ubicación de los técnicos en tiempo real en el mapa.
              </Text>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AsistenciaTecnicaPage() {
  return (
    <Suspense fallback={<LoadingScreen texto="Cargando asistencia técnica..." />}>
      <AsistenciaContent />
    </Suspense>
  );
}
