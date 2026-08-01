"use client";
import { useState, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  BookOpen, User, GraduationCap, Search, Plus,
  Pencil, Trash2, MoreVertical,
} from "lucide-react";

import {
  PageHeader, Button, Badge, LoadingScreen, Input, Field, Section,
  Pagination,
} from "@/components/ui";
import { useToast } from "@/components/ui";
import { useConfirm } from "@/components/ui/feedback/ConfirmContext";
import { Text } from "@/components/ui/basics/Typography";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import {
  getInstitucion, getOfertaAcademicaById, updateOfertaAcademica,
  getFormaciones, deleteFormacion, getVinculosDocentes,
} from "@/services/apis/ventas";
import { TIPO_OFERTA, TIPO_DOCENTE, selectClass } from "@/components/comercial/instituciones";

// ─── Constantes ─────────────────────────────────────────────────

const PAGE_SIZE = 20;

const ESTADO_BADGE = {
  vigente: { label: "Vigente", className: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  finalizada: { label: "Finalizada", className: "bg-slate-50 text-slate-500 border-slate-100" },
};

// ─── Página ─────────────────────────────────────────────────────

export default function OfertaDetallePage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const { danger } = useConfirm();

  const institucionId = parseInt(params.id);
  const ofertaId = parseInt(params.ofertaId);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(false);
  const busquedaDebounced = useDebounce(busqueda, 300);

  // ─── Fetch data ─────────────────────────────────────────────────

  const { data: institucion } = useApi(
    () => getInstitucion(institucionId),
    { auto: true, initialData: null }
  );

  const { data: oferta, loading: loadingOferta, execute: fetchOferta } = useApi(
    () => getOfertaAcademicaById(ofertaId),
    { auto: true, initialData: null }
  );

  const { data: formacionesRaw, loading: loadingFormaciones, execute: fetchFormaciones } = useApi(
    () => getFormaciones({ oferta_academica: ofertaId }),
    { auto: true, initialData: [] }
  );

  const { data: docentesRaw, loading: loadingDocentes } = useApi(
    () => getVinculosDocentes({ oferta_academica: ofertaId, activo: true }),
    { auto: true, initialData: [] }
  );

  const formaciones = useMemo(
    () => (Array.isArray(formacionesRaw) ? formacionesRaw : (formacionesRaw?.results || [])),
    [formacionesRaw]
  );

  const docentes = useMemo(
    () => (Array.isArray(docentesRaw) ? docentesRaw : (docentesRaw?.results || [])),
    [docentesRaw]
  );

  // ─── Filtrado + Paginación ──────────────────────────────────────

  const formacionesFiltradas = useMemo(() => {
    let r = formaciones;
    if (busquedaDebounced.trim()) {
      const q = busquedaDebounced.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      r = r.filter((f) => {
        const nombre = (f.persona_nombre || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return nombre.includes(q);
      });
    }
    if (filtroEstado) {
      r = r.filter((f) => filtroEstado === "vigente" ? f.vigente : !f.vigente);
    }
    return r;
  }, [formaciones, busquedaDebounced, filtroEstado]);

  const totalPages = Math.ceil(formacionesFiltradas.length / PAGE_SIZE);
  const formacionesPaginadas = formacionesFiltradas.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  // Stats
  const stats = useMemo(() => {
    const vigentes = formaciones.filter((f) => f.vigente).length;
    const finalizadas = formaciones.filter((f) => !f.vigente).length;
    return { total: formaciones.length, vigentes, finalizadas };
  }, [formaciones]);

  // ─── Edición de oferta ──────────────────────────────────────────

  const [editForm, setEditForm] = useState({});
  const [savingOferta, setSavingOferta] = useState(false);

  const startEditing = () => {
    setEditForm({
      nombre: oferta?.nombre || "",
      tipo: oferta?.tipo || "grado",
      duracion_anios: oferta?.duracion_anios ?? "",
    });
    setEditing(true);
  };

  const handleSaveOferta = async () => {
    if (!editForm.nombre.trim()) {
      showToast("El nombre es obligatorio", "error");
      return;
    }
    setSavingOferta(true);
    try {
      await updateOfertaAcademica(ofertaId, {
        nombre: editForm.nombre,
        tipo: editForm.tipo,
        duracion_anios: editForm.duracion_anios !== "" ? parseInt(editForm.duracion_anios) : null,
      });
      showToast("Oferta actualizada", "success");
      setEditing(false);
      fetchOferta();
    } catch (err) {
      showToast(err?.data?.detail || "Error al guardar", "error");
    } finally {
      setSavingOferta(false);
    }
  };

  // ─── Eliminar alumno ────────────────────────────────────────────

  const handleDeleteAlumno = async (formacion) => {
    const ok = await danger(
      `¿Desvincular a "${formacion.persona_nombre}" de esta oferta?`,
      "Desvincular alumno",
      { confirmText: "Desvincular" }
    );
    if (!ok) return;
    try {
      await deleteFormacion(formacion.id);
      showToast("Alumno desvinculado", "success");
      fetchFormaciones();
    } catch (err) {
      showToast(err?.data?.detail || "Error al desvincular", "error");
    }
  };

  // ─── Loading / Error ────────────────────────────────────────────

  if (loadingOferta && !oferta) return <LoadingScreen texto="Cargando oferta..." />;

  if (!oferta && !loadingOferta) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md text-center">
          <BookOpen size={48} className="text-red-400 mx-auto mb-4" />
          <Text variant="bodySmBold" className="text-red-700">Oferta no encontrada</Text>
          <Button variant="primary" className="mt-4" onClick={() => router.back()}>
            Volver
          </Button>
        </div>
      </div>
    );
  }

  const tipoLabel = TIPO_OFERTA.find((t) => t.value === oferta?.tipo)?.label || oferta?.tipo;

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Ventas y CRM", href: "/ventas-crm" },
          { label: "Instituciones", href: "/ventas-crm/instituciones" },
          { label: institucion?.razon_social || "...", href: `/ventas-crm/instituciones/${institucionId}` },
          { label: oferta?.nombre || "Oferta" },
        ]}
        subtitle={tipoLabel}
      />

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* ─── Info / Edición de la oferta ──────────────── */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            {editing ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Text variant="bodySmBold" className="text-emerald-700">Editar Oferta</Text>
                </div>
                <Input
                  label="Nombre *"
                  value={editForm.nombre}
                  onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))}
                  placeholder="Odontología, Maestría en Ortodoncia..."
                />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Tipo">
                    <select
                      className={selectClass}
                      value={editForm.tipo}
                      onChange={(e) => setEditForm((p) => ({ ...p, tipo: e.target.value }))}
                    >
                      {TIPO_OFERTA.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </Field>
                  <Input
                    label="Duración (años)"
                    type="number"
                    value={editForm.duracion_anios}
                    onChange={(e) => setEditForm((p) => ({ ...p, duracion_anios: e.target.value }))}
                    placeholder="5"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                    Cancelar
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSaveOferta} disabled={savingOferta}>
                    {savingOferta ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                    <BookOpen size={24} className="text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Text variant="bodySmBold" className="text-lg">{oferta.nombre}</Text>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <Badge variant="default" className="text-[10px] py-0.5 px-2 uppercase font-semibold">
                        {tipoLabel}
                      </Badge>
                      {oferta.duracion_anios && (
                        <span className="text-xs text-slate-400">
                          {oferta.duracion_anios} {oferta.duracion_anios === 1 ? "año" : "años"}
                        </span>
                      )}
                      {oferta.responsable_nombre && (
                        <span className="text-xs text-emerald-600 flex items-center gap-1">
                          <User size={12} />
                          {oferta.responsable_nombre}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={startEditing}
                    aria-label="Editar oferta"
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                  >
                    <Pencil size={16} />
                  </button>
                </div>

                {/* Stats rápidos */}
                <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-slate-100">
                  <div className="text-center">
                    <Text variant="bodySmBold" className="text-xl text-slate-800">
                      {stats.total}
                    </Text>
                    <Text variant="mutedXs">Total alumnos</Text>
                  </div>
                  <div className="text-center">
                    <Text variant="bodySmBold" className="text-xl text-emerald-600">
                      {stats.vigentes}
                    </Text>
                    <Text variant="mutedXs">Vigentes</Text>
                  </div>
                  <div className="text-center">
                    <Text variant="bodySmBold" className="text-xl text-slate-500">
                      {stats.finalizadas}
                    </Text>
                    <Text variant="mutedXs">Finalizadas</Text>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ─── Docentes de esta oferta ─────────────────── */}
          <Section title={`Docentes (${docentes.length})`}>
            {docentes.length === 0 ? (
              <div className="text-center py-6">
                <BookOpen size={28} className="text-slate-300 mx-auto mb-2" />
                <Text variant="bodySm" className="text-slate-400">
                  No hay docentes vinculados a esta oferta.
                </Text>
                <Text variant="mutedXs" className="text-slate-400 mt-1">
                  Los docentes se vinculan desde el perfil de cada persona.
                </Text>
              </div>
            ) : (
              <div className="space-y-2">
                {docentes.map((d) => {
                  const tipoDoc = TIPO_DOCENTE.find((t) => t.value === d.tipo)?.label || d.tipo_display || d.tipo;
                  return (
                    <div
                      key={d.id}
                      className="bg-white border border-slate-100 rounded-lg p-3 flex items-center justify-between shadow-sm hover:border-slate-200 transition-colors cursor-pointer"
                      onClick={() => router.push(`/ventas-crm/contactos/personas/${d.persona}`)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                          <User size={14} className="text-blue-500" />
                        </div>
                        <div className="min-w-0">
                          <Text variant="bodySmBold" className="text-slate-700 truncate">
                            {d.persona_nombre}
                          </Text>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="default" className="text-[10px] py-0 px-1.5 uppercase font-semibold bg-blue-50 text-blue-700 border-blue-100">
                              {tipoDoc}
                            </Badge>
                            {d.catedra && (
                              <span className="text-[11px] text-slate-400 truncate">
                                {d.catedra}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          {/* ─── Lista de alumnos ─────────────────────────── */}
          <Section title={`Alumnos (${formacionesFiltradas.length})`}>
            {/* Barra de búsqueda y filtro */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
                  placeholder="Buscar alumno..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
              <select
                className={cn(
                  "appearance-none text-xs font-semibold rounded-lg px-2.5 py-2 cursor-pointer border transition-all outline-none",
                  filtroEstado
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                )}
                value={filtroEstado}
                onChange={(e) => { setFiltroEstado(e.target.value); setPage(1); }}
              >
                <option value="">Todos</option>
                <option value="vigente">Vigentes</option>
                <option value="finalizada">Finalizadas</option>
              </select>
            </div>

            {loadingFormaciones ? (
              <div className="text-center py-6">
                <Text variant="mutedXs">Cargando alumnos...</Text>
              </div>
            ) : formacionesFiltradas.length === 0 ? (
              <div className="text-center py-8">
                <GraduationCap size={32} className="text-slate-300 mx-auto mb-2" />
                <Text variant="bodySm" className="text-slate-400">
                  {formaciones.length === 0
                    ? "No hay alumnos registrados en esta oferta."
                    : "Sin resultados para esta búsqueda."}
                </Text>
                {formaciones.length === 0 && (
                  <Text variant="mutedXs" className="text-slate-400 mt-2">
                    Los alumnos se vinculan desde el perfil de cada persona.
                  </Text>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {formacionesPaginadas.map((f) => {
                    const vigencia = f.vigente
                      ? ESTADO_BADGE.vigente
                      : ESTADO_BADGE.finalizada;
                    return (
                      <div
                        key={f.id}
                        className="bg-white border border-slate-100 rounded-lg p-3 flex items-center justify-between shadow-sm hover:border-slate-200 transition-colors cursor-pointer"
                        onClick={() => router.push(`/ventas-crm/contactos/personas/${f.persona}`)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                            <User size={14} className="text-slate-500" />
                          </div>
                          <div className="min-w-0">
                            <Text variant="bodySmBold" className="text-slate-700 truncate">
                              {f.persona_nombre}
                            </Text>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="default" className={cn("text-[10px] py-0 px-1.5", vigencia.className)}>
                                {vigencia.label}
                              </Badge>
                              {f.anio_ingreso && (
                                <span className="text-[11px] text-slate-400">
                                  {f.anio_ingreso}
                                  {f.anio_egreso ? ` — ${f.anio_egreso}` : " — presente"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteAlumno(f); }}
                          aria-label={`Desvincular ${f.persona_nombre}`}
                          className="p-1.5 rounded-md hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors shrink-0"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
                {totalPages > 1 && (
                  <div className="mt-4">
                    <Pagination
                      count={formacionesFiltradas.length}
                      pageSize={PAGE_SIZE}
                      currentPage={page}
                      onPageChange={setPage}
                    />
                  </div>
                )}
              </>
            )}
          </Section>

        </div>
      </main>
    </div>
  );
}
