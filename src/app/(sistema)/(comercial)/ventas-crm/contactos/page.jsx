"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, Building2, Truck, GraduationCap, ChevronRight,
} from "lucide-react";
import {
  PageHeader, LoadingScreen, SearchBar, Button,
} from "@/components/ui";
import { Text } from "@/components/ui/basics/Typography";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { getCuentas, getPersonas, getClinicas, getMayoristas, getInstituciones } from "@/services/apis/ventas";
import { cn } from "@/lib/utils";

// ─── Configuracion de tipos ─────────────────────────────────────

const TIPO_CONFIG = [
  {
    key: "persona",
    label: "Personas",
    desc: "Profesionales, estudiantes y clientes individuales",
    icon: Users,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    href: "/ventas-crm/contactos/personas",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    key: "clinica",
    label: "Clinicas",
    desc: "Consultorios y clinicas dentales",
    icon: Building2,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    href: "/ventas-crm/contactos/clinicas",
    badgeColor: "bg-emerald-100 text-emerald-700",
  },
  {
    key: "mayorista",
    label: "Mayoristas",
    desc: "Distribuidores y revendedores B2B",
    icon: Truck,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    href: "/ventas-crm/contactos/mayoristas",
    badgeColor: "bg-purple-100 text-purple-700",
  },
  {
    key: "institucion",
    label: "Instituciones",
    desc: "Universidades, institutos y gremios",
    icon: GraduationCap,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    href: "/ventas-crm/instituciones",
    badgeColor: "bg-amber-100 text-amber-700",
  },
];

const TIPO_BADGE = {
  persona: { label: "Persona", className: "bg-blue-100 text-blue-700" },
  clinica: { label: "Clinica", className: "bg-emerald-100 text-emerald-700" },
  mayorista: { label: "Mayorista", className: "bg-purple-100 text-purple-700" },
  institucion: { label: "Institucion", className: "bg-amber-100 text-amber-700" },
};

// ─── Componente: Resultado de busqueda ──────────────────────────

function ResultRow({ cuenta }) {
  const tipo = cuenta.tipo || "cuenta";
  const badge = TIPO_BADGE[tipo] || { label: tipo, className: "bg-slate-100 text-slate-600" };

  // Determinar link de detalle segun tipo
  let href = "#";
  if (tipo === "persona") href = `/ventas-crm/contactos/personas/${cuenta.id}`;
  else if (tipo === "clinica") href = `/ventas-crm/contactos/clinicas/${cuenta.id}`;
  else if (tipo === "mayorista") href = `/ventas-crm/contactos/mayoristas/${cuenta.id}`;
  else if (tipo === "institucion") href = `/ventas-crm/instituciones`;

  return (
    <Link
      href={href}
      className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Text variant="bodySmBold" className="truncate text-slate-800">
            {cuenta.razon_social}
          </Text>
          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", badge.className)}>
            {badge.label}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          {cuenta.telefono && (
            <Text variant="mutedXs">{cuenta.telefono}</Text>
          )}
          {cuenta.correo_electronico && (
            <Text variant="mutedXs">{cuenta.correo_electronico}</Text>
          )}
          {cuenta.ciudad && (
            <Text variant="mutedXs">{cuenta.ciudad}</Text>
          )}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors shrink-0" />
    </Link>
  );
}

// ─── Pagina principal ───────────────────────────────────────────

export default function ClientesHubPage() {

  // Conteos por tipo
  const { data: personasData, execute: fetchPersonas } = useApi(getPersonas);
  const { data: clinicasData, execute: fetchClinicas } = useApi(getClinicas);
  const { data: mayoristasData, execute: fetchMayoristas } = useApi(getMayoristas);
  const { data: institucionesData, execute: fetchInstituciones } = useApi(getInstituciones);

  // Busqueda global
  const { data: searchData, loading: searching, execute: fetchSearch } = useApi(getCuentas);

  const [busqueda, setBusqueda] = useState("");
  const busquedaDebounced = useDebounce(busqueda, 400);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Cargar conteos al montar
  useEffect(() => {
    Promise.all([
      fetchPersonas({ page_size: 1 }),
      fetchClinicas({ page_size: 1 }),
      fetchMayoristas({ page_size: 1 }),
      fetchInstituciones({ page_size: 1 }),
    ]).then(() => setHasLoadedOnce(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Busqueda global
  useEffect(() => {
    if (busquedaDebounced.trim().length >= 2) {
      fetchSearch({ search: busquedaDebounced, page_size: 10 });
    }
  }, [busquedaDebounced]); // eslint-disable-line react-hooks/exhaustive-deps

  const conteos = {
    persona: personasData?.count ?? 0,
    clinica: clinicasData?.count ?? 0,
    mayorista: mayoristasData?.count ?? (Array.isArray(mayoristasData) ? mayoristasData.length : 0),
    institucion: institucionesData?.count ?? (Array.isArray(institucionesData) ? institucionesData.length : 0),
  };

  const totalCuentas = conteos.persona + conteos.clinica + conteos.mayorista + conteos.institucion;
  const resultadosBusqueda = searchData?.results || [];
  const mostrarResultados = busquedaDebounced.trim().length >= 2;

  if (!hasLoadedOnce) return <LoadingScreen texto="Cargando clientes..." />;

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Ventas y CRM", href: "/ventas-crm" },
          { label: "Contactos" },
        ]}
        subtitle={`CRM \u00b7 ${totalCuentas} cuentas comerciales`}
        subtitleClassName="text-emerald-600"
      >
        <div className="flex items-center gap-2">
          <Link href="/ventas-crm/contactos/personas/nuevo-prospecto">
            <Button
              variant="secondary"
              size="md"
              icon={Users}
              className="rounded-xl font-bold text-xs cursor-pointer"
            >
              + PROSPECTO
            </Button>
          </Link>
        </div>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Busqueda global */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <SearchBar
              value={busqueda}
              onChange={setBusqueda}
              placeholder="Buscar en todas las cuentas por nombre, RUC, telefono o correo..."
            />

            {/* Resultados de busqueda */}
            {mostrarResultados && (
              <div className="mt-3 border border-slate-200 rounded-xl overflow-hidden">
                {searching ? (
                  <div className="px-5 py-4 text-center">
                    <Text variant="mutedXs">Buscando...</Text>
                  </div>
                ) : resultadosBusqueda.length === 0 ? (
                  <div className="px-5 py-4 text-center">
                    <Text variant="mutedXs">Sin resultados para &ldquo;{busquedaDebounced}&rdquo;</Text>
                  </div>
                ) : (
                  <>
                    {resultadosBusqueda.map((cuenta) => (
                      <ResultRow key={cuenta.id} cuenta={cuenta} />
                    ))}
                    {(searchData?.count || 0) > 10 && (
                      <div className="px-5 py-3 bg-slate-50 text-center">
                        <Text variant="mutedXs">
                          Mostrando 10 de {searchData.count} resultados. Usa los listados por tipo para ver todos.
                        </Text>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Cards por tipo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TIPO_CONFIG.map((tipo) => {
              const Icon = tipo.icon;
              return (
                <Link
                  key={tipo.key}
                  href={tipo.href}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className={cn("inline-flex h-10 w-10 items-center justify-center rounded-xl", tipo.iconBg)}>
                      <Icon className={cn("h-5 w-5", tipo.iconColor)} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <Text variant="bodySmBold" className="text-slate-800">
                        {tipo.label}
                      </Text>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-lg font-black text-slate-800">
                          {conteos[tipo.key]}
                        </span>
                        <Text variant="mutedXs">registros</Text>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <Text variant="mutedXs" className="text-slate-400">
                    {tipo.desc}
                  </Text>
                </Link>
              );
            })}
          </div>

          {/* Acceso rapido: crear por tipo */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div>
              <Text variant="label" className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-3 block">
                Crear nuevo cliente
              </Text>
              <div className="flex flex-wrap gap-2">
                <Link href="/ventas-crm/contactos/personas/nuevo">
                  <Button variant="secondary" size="sm" icon={Users} className="rounded-xl text-xs font-bold cursor-pointer">
                    Persona
                  </Button>
                </Link>
                <Link href="/ventas-crm/contactos/clinicas/nuevo">
                  <Button variant="secondary" size="sm" icon={Building2} className="rounded-xl text-xs font-bold cursor-pointer">
                    Clinica
                  </Button>
                </Link>
                <Link href="/ventas-crm/contactos/mayoristas/nuevo">
                  <Button variant="secondary" size="sm" icon={Truck} className="rounded-xl text-xs font-bold cursor-pointer">
                    Mayorista
                  </Button>
                </Link>
                <Link href="/ventas-crm/instituciones">
                  <Button variant="secondary" size="sm" icon={GraduationCap} className="rounded-xl text-xs font-bold cursor-pointer">
                    Institucion
                  </Button>
                </Link>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <Text variant="label" className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-3 block">
                Carga rápida de prospectos
              </Text>
              <div className="flex flex-wrap gap-2">
                <Link href="/ventas-crm/contactos/personas/nuevo-prospecto">
                  <Button variant="ghost" size="sm" icon={Users} className="rounded-xl text-xs font-bold cursor-pointer text-blue-600 hover:bg-blue-50">
                    Personas
                  </Button>
                </Link>
                <Link href="/ventas-crm/contactos/clinicas/nuevo-prospecto">
                  <Button variant="ghost" size="sm" icon={Building2} className="rounded-xl text-xs font-bold cursor-pointer text-emerald-600 hover:bg-emerald-50">
                    Clínicas
                  </Button>
                </Link>
                <Link href="/ventas-crm/contactos/mayoristas/nuevo-prospecto">
                  <Button variant="ghost" size="sm" icon={Truck} className="rounded-xl text-xs font-bold cursor-pointer text-purple-600 hover:bg-purple-50">
                    Mayoristas
                  </Button>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
