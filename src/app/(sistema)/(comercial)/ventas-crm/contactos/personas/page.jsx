"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus, Target, UserCheck, GraduationCap, Stethoscope,
  ArrowUpDown, MoreVertical, Pencil, Trash2, RotateCcw, X, Upload,
} from "lucide-react";
import {
  EmptyState, LoadingScreen, PageHeader, Pagination, SearchBar, Button, Badge,
  FilterDropdown,
} from "@/components/ui";
import { useConfirm } from "@/components/ui";
import { useToast } from "@/components/ui";
import { Text } from "@/components/ui/basics/Typography";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { getPersonas, deletePersona, reactivarPersona, bulkCreatePersonas } from "@/services/apis/ventas";
import { cn } from "@/lib/utils";

// ─── Configuración ──────────────────────────────────────────────

import { CATEGORIA_OPTIONS_FILTER, CATEGORIA_LABELS, CATEGORIA_BADGE_STYLES } from "@/config/personas";

const CATEGORIA_OPTIONS = CATEGORIA_OPTIONS_FILTER;

const ETAPA_OPTIONS = [
  { value: "", label: "Todas" },
  { value: "prospecto", label: "Prospectos" },
  { value: "activo", label: "Activos" },
  { value: "inactivo", label: "Inactivos" },
];

const ETAPA_BADGE_STYLES = {
  prospecto: "bg-amber-50 text-amber-700 border-amber-100",
  activo: "bg-emerald-50 text-emerald-700 border-emerald-100",
  inactivo: "bg-red-50 text-red-600 border-red-100",
};

const FLAGS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "es_profesional", label: "Profesionales" },
  { value: "es_estudiante_activo", label: "Estudiantes activos" },
  { value: "es_docente_activo", label: "Docentes activos" },
];

const ORDEN_OPTIONS = [
  { value: "", label: "Más recientes" },
  { value: "razon_social", label: "Nombre A-Z" },
  { value: "-razon_social", label: "Nombre Z-A" },
  { value: "-updated_at", label: "Últ. actualización" },
];

const FILTER_SCHEMA = {
  search: "",
  categoria: "",
  etapa: "",
  flag: "",
  ordering: "",
  page: 1,
};

// ─── Menú contextual ────────────────────────────────────────────

function RowActions({ persona, onDesactivar, onReactivar }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        aria-label="Acciones"
        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        onClick={(e) => { e.stopPropagation(); setOpen((p) => !p); }}
      >
        <MoreVertical size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[140px]">
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              router.push(`/ventas-crm/contactos/personas/${persona.id}`);
            }}
          >
            <Pencil size={13} />
            Editar
          </button>
          {persona.etapa !== "inactivo" ? (
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              onClick={(e) => { e.stopPropagation(); setOpen(false); onDesactivar(persona); }}
            >
              <Trash2 size={13} />
              Desactivar
            </button>
          ) : (
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors"
              onClick={(e) => { e.stopPropagation(); setOpen(false); onReactivar(persona); }}
            >
              <RotateCcw size={13} />
              Reactivar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Página ─────────────────────────────────────────────────────

export default function PersonasListPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { danger, confirm } = useConfirm();
  const { filters, setFilter, resetFilters } = useUrlFilters(FILTER_SCHEMA);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const {
    data: personasData,
    loading: loadingPersonas,
    execute: fetchPersonas_,
  } = useApi(getPersonas);

  const personas = personasData?.results || [];
  const count = personasData?.count || 0;
  const pageSize = 24;

  // Debounce para búsqueda
  const [busquedaLocal, setBusquedaLocal] = useState(filters.search);
  const busquedaDebounced = useDebounce(busquedaLocal, 400);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Sincronizar debounced -> URL
  useEffect(() => {
    if (busquedaDebounced !== filters.search) setFilter("search", busquedaDebounced);
  }, [busquedaDebounced]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sincronizar URL -> input local
  useEffect(() => {
    setBusquedaLocal(filters.search);
  }, [filters.search]);

  // Cargar personas cuando cambian filtros
  useEffect(() => {
    const params = { page: filters.page };
    if (filters.search) params.search = filters.search;
    if (filters.categoria) params.categoria = filters.categoria;
    if (filters.etapa) params.etapa = filters.etapa;
    if (filters.ordering) params.ordering = filters.ordering;

    // Flags
    if (filters.flag === "es_profesional") params.es_profesional = "true";
    if (filters.flag === "es_estudiante_activo") params.es_estudiante_activo = "true";
    if (filters.flag === "es_docente_activo") params.es_docente_activo = "true";

    fetchPersonas_(params).then(() => setHasLoadedOnce(true));
  }, [fetchPersonas_, filters.search, filters.categoria, filters.etapa, filters.flag, filters.ordering, filters.page]);

  // Acciones
  const handleDesactivar = async (persona) => {
    const confirmed = await danger(
      `Desactivar a "${persona.razon_social}"? No podrá realizar compras hasta ser reactivado/a.`,
      "Desactivar persona",
      { confirmText: "Desactivar" }
    );
    if (!confirmed) return;
    try {
      await deletePersona(persona.id);
      showToast("Persona desactivada", "success");
      fetchPersonas_({ page: filters.page });
    } catch {
      showToast("Error al desactivar", "error");
    }
  };

  const handleReactivar = async (persona) => {
    const confirmed = await confirm(
      `¿Reactivar a "${persona.razon_social}"?`,
      "Reactivar persona",
      { confirmText: "Reactivar" }
    );
    if (!confirmed) return;
    try {
      await reactivarPersona(persona.id);
      showToast("Persona reactivada", "success");
      fetchPersonas_({ page: filters.page });
    } catch {
      showToast("Error al reactivar", "error");
    }
  };

  // Carga masiva CSV
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["csv", "txt", "tsv"].includes(ext)) {
      showToast("Formato no soportado. Usá CSV, TXT o TSV.", "error");
      return;
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length === 0) { showToast("Archivo vacío.", "error"); return; }

    // Detectar separador
    let sep = ";";
    if (lines[0].includes("\t")) sep = "\t";
    else if (!lines[0].includes(";") && lines[0].includes(",")) sep = ",";

    const rows = lines.map((l) => l.split(sep).map((c) => c.trim().replace(/^["']|["']$/g, "")));

    // Detectar header
    const normalizeH = (h) => h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const header = rows[0].map(normalizeH);
    const KNOWN = ["nombre", "razon_social", "telefono", "correo", "correo_electronico", "email", "categoria", "departamento", "ciudad", "notas"];
    const hasHeader = header.some((h) => KNOWN.includes(h));
    const dataRows = hasHeader ? rows.slice(1) : rows;

    // Mapear columnas
    const col = (keywords, fallback) => {
      if (hasHeader) { const idx = header.findIndex((h) => keywords.includes(h)); return idx >= 0 ? idx : -1; }
      return fallback ?? -1;
    };
    const nameCol = col(["nombre", "razon_social"], 0);
    const telCol = col(["telefono"], 1);
    const emailCol = col(["correo", "correo_electronico", "email"], 2);
    const catCol = col(["categoria"], 3);
    const depCol = col(["departamento"], 4);
    const cityCol = col(["ciudad"], 5);
    const notasCol = col(["notas"], -1);

    const getCell = (row, idx) => (idx >= 0 && idx < row.length ? row[idx] : "") || "";

    const personas = dataRows
      .map((row) => ({
        razon_social: getCell(row, nameCol),
        telefono: getCell(row, telCol),
        correo_electronico: getCell(row, emailCol),
        categoria: getCell(row, catCol),
        departamento: getCell(row, depCol),
        ciudad: getCell(row, cityCol),
        notas: getCell(row, notasCol),
      }))
      .filter((p) => p.razon_social.trim());

    if (personas.length === 0) { showToast("No se encontraron datos válidos.", "error"); return; }

    setUploading(true);
    try {
      const res = await bulkCreatePersonas(personas);
      const parts = [];
      if (res.creados > 0) parts.push(`${res.creados} creados`);
      if (res.duplicados > 0) parts.push(`${res.duplicados} duplicados`);
      if (res.errores > 0) parts.push(`${res.errores} con errores`);
      showToast(parts.join(", ") || "Sin cambios", res.errores > 0 ? "warning" : "success");
      fetchPersonas_({ page: 1 });
    } catch (err) {
      showToast(err?.data?.detail || "Error al importar", "error");
    } finally {
      setUploading(false);
    }
  };

  // Loading inicial
  if (loadingPersonas && !hasLoadedOnce) return <LoadingScreen texto="Cargando personas..." />;

  const hayFiltrosActivos = filters.search !== "" || filters.categoria !== "" || filters.etapa !== "" || filters.flag !== "" || filters.ordering !== "";

  const limpiarFiltros = () => {
    setBusquedaLocal("");
    resetFilters();
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Ventas y CRM", href: "/ventas-crm" },
          { label: "Contactos", href: "/ventas-crm/contactos" },
          { label: "Personas" },
        ]}
        subtitle={`${count} personas registradas`}
        subtitleClassName="text-blue-600"
      >
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept=".csv,.txt,.tsv" onChange={handleFileUpload} className="hidden" />
          <Button
            variant="ghost"
            size="sm"
            icon={Upload}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Importando..." : "Importar CSV"}
          </Button>
          <Link href="/ventas-crm/contactos/personas/nuevo">
            <Button variant="primary" size="sm" icon={Plus}>
              Nueva Persona
            </Button>
          </Link>
        </div>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-7xl mx-auto space-y-4">

          {/* Barra de herramientas */}
          <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3 relative z-20">
            <SearchBar
              value={busquedaLocal}
              onChange={setBusquedaLocal}
              placeholder="Buscar por nombre, RUC, teléfono, correo o cédula..."
            />

            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                <FilterDropdown
                  value={filters.etapa}
                  onChange={(val) => setFilter("etapa", val)}
                  icon={Target}
                  label="Etapa"
                  options={ETAPA_OPTIONS}
                />
                <FilterDropdown
                  value={filters.categoria}
                  onChange={(val) => setFilter("categoria", val)}
                  icon={Stethoscope}
                  label="Categoría"
                  options={CATEGORIA_OPTIONS}
                />
                <FilterDropdown
                  value={filters.flag}
                  onChange={(val) => setFilter("flag", val)}
                  icon={UserCheck}
                  label="Perfil"
                  options={FLAGS_OPTIONS}
                />
                <FilterDropdown
                  value={filters.ordering}
                  onChange={(val) => setFilter("ordering", val)}
                  icon={ArrowUpDown}
                  label="Orden"
                  options={ORDEN_OPTIONS}
                />
                {hayFiltrosActivos && (
                  <button
                    onClick={limpiarFiltros}
                    className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                  >
                    <X size={12} />
                    Limpiar
                  </button>
                )}
              </div>

              <Text
                variant="label"
                className="flex items-center gap-2 text-slate-400 whitespace-nowrap"
              >
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  count > 0 ? "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]" : "bg-slate-300"
                )} />
                {count} {count === 1 ? "persona" : "personas"}
              </Text>
            </div>
          </div>

          {/* Tabla */}
          <div className={cn(
            "transition-opacity duration-300",
            loadingPersonas ? "opacity-50 pointer-events-none" : "opacity-100"
          )}>
            {personas.length === 0 ? (
              <EmptyState
                titulo={hayFiltrosActivos ? "Sin resultados" : "Sin personas"}
                descripcion={hayFiltrosActivos ? "Intentá con otros términos o cambiá los filtros." : "Registrá tu primera persona para empezar."}
                textoBoton={hayFiltrosActivos ? "Limpiar filtros" : undefined}
                onAction={hayFiltrosActivos ? limpiarFiltros : undefined}
              />
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500">
                      <th className="py-3 pl-6 pr-4 text-[11px] font-black uppercase tracking-widest">Nombre</th>
                      <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest hidden md:table-cell">Contacto</th>
                      <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest text-center">Categoría</th>
                      <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest text-center hidden sm:table-cell">Etapa</th>
                      <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest hidden lg:table-cell">Ubicación</th>
                      <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest hidden lg:table-cell">Flags</th>
                      <th className="py-3 pr-6 pl-4 text-[11px] font-black uppercase tracking-widest text-right w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {personas.map((persona) => (
                      <tr
                        key={persona.id}
                        className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/ventas-crm/contactos/personas/${persona.id}`)}
                      >
                        <td className="py-3 pl-6 pr-4">
                          <div>
                            <Text variant="bodySmBold" className="text-slate-800 truncate max-w-[220px]">
                              {persona.tratamiento ? `${persona.tratamiento} ` : ""}{persona.razon_social}
                            </Text>
                            {persona.ruc && (
                              <Text variant="mutedXs" className="text-slate-400">
                                RUC: {persona.ruc}
                              </Text>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <div>
                            {persona.telefono && (
                              <Text variant="bodySm" className="text-slate-600">{persona.telefono}</Text>
                            )}
                            {persona.correo_electronico && (
                              <Text variant="mutedXs" className="text-slate-400 truncate max-w-[180px]">
                                {persona.correo_electronico}
                              </Text>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {persona.categoria ? (
                            <span className={cn(
                              "inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase",
                              CATEGORIA_BADGE_STYLES[persona.categoria] || "bg-slate-100 text-slate-600"
                            )}>
                              {CATEGORIA_LABELS[persona.categoria] || persona.categoria}
                            </span>
                          ) : (
                            <Text variant="mutedXs" className="text-slate-300">—</Text>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center hidden sm:table-cell">
                          <Badge
                            variant="default"
                            className={cn("text-[9px] py-0.5 px-2 uppercase font-bold", ETAPA_BADGE_STYLES[persona.etapa] || "")}
                          >
                            {persona.etapa}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell">
                          <Text variant="bodySm" className="text-slate-500 truncate max-w-[150px]">
                            {[persona.ciudad, persona.departamento].filter(Boolean).join(", ") || "—"}
                          </Text>
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5">
                            {persona.es_profesional && (
                              <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center" title="Profesional">
                                <Stethoscope className="w-3 h-3 text-blue-600" />
                              </span>
                            )}
                            {persona.es_estudiante_activo && (
                              <span className="w-5 h-5 rounded-full bg-sky-100 flex items-center justify-center" title="Estudiante activo">
                                <GraduationCap className="w-3 h-3 text-sky-600" />
                              </span>
                            )}
                            {persona.es_docente_activo && (
                              <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center" title="Docente activo">
                                <UserCheck className="w-3 h-3 text-amber-600" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 pr-6 pl-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <RowActions
                            persona={persona}
                            onDesactivar={handleDesactivar}
                            onReactivar={handleReactivar}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {count > pageSize && (
                  <div className="border-t border-slate-100 px-6 py-3">
                    <Pagination
                      count={count}
                      pageSize={pageSize}
                      currentPage={filters.page}
                      onPageChange={(p) => setFilter("page", p)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
