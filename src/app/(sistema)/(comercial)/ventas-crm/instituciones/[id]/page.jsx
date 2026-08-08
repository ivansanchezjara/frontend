"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  GraduationCap, Plus, Trash2, Pencil,
  Users, BookOpen, Award, User,
} from "lucide-react";

import {
  PageHeader, Button, Input, Field, LoadingScreen, Badge, Section, UbicacionPicker,
} from "@/components/ui";
import { useToast } from "@/components/ui";
import { Text } from "@/components/ui/basics/Typography";
import { useApi } from "@/hooks/useApi";
import { useConfirm } from "@/components/ui/feedback/ConfirmContext";
import { useKeySave } from "@/hooks/useKeySave";
import { cn } from "@/lib/utils";
import {
  getInstitucion, updateInstitucion, deleteInstitucion,
  deleteOfertaAcademica,
  getVinculosDocentes, getCargosDirectivos, getPersonas,
} from "@/services/apis/ventas";

import {
  OfertaForm, VinculoItem, HistorialSection, AgregarVinculoForm,
  TIPO_INSTITUCION, TIPO_OFERTA, TIPO_DOCENTE, ETAPA_CUENTA,
  selectClass,
} from "@/components/comercial/instituciones";

// ─── Validación ─────────────────────────────────────────────────

function validateForm(form) {
  const errors = {};
  if (!form.razon_social.trim()) {
    errors.razon_social = "El nombre es obligatorio";
  }
  if (form.correo_electronico && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo_electronico)) {
    errors.correo_electronico = "Formato de correo inválido";
  }
  return errors;
}

// ─── Página Principal ───────────────────────────────────────────

export default function InstitucionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const { danger } = useConfirm();
  const [showNewOferta, setShowNewOferta] = useState(false);
  const [editingOfertaId, setEditingOfertaId] = useState(null);
  const [showAddVinculo, setShowAddVinculo] = useState(false);

  const institucionId = parseInt(params.id);

  const { data: institucion, loading, execute: fetchInstitucion } =
    useApi(() => getInstitucion(institucionId), { auto: false, initialData: null });
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Vínculos: docentes y directivos de esta institución
  const { data: docentesData, execute: fetchDocentes } =
    useApi(() => getVinculosDocentes({ institucion: institucionId, activo: true }), { auto: false, initialData: null });
  const { data: directivosData, execute: fetchDirectivos } =
    useApi(() => getCargosDirectivos({ institucion: institucionId, activo: true }), { auto: false, initialData: null });

  // Personas para selector de vínculo
  const { data: personasData, execute: fetchPersonas } =
    useApi(() => getPersonas({ page_size: 500 }), { auto: false, initialData: null });

  const INITIAL_FORM = {
    razon_social: "", abreviatura: "", tipo_institucion: "universidad",
    ruc: "", correo_electronico: "", telefono: "",
    departamento: "", ciudad: "", direccion: "",
    latitud: null, longitud: null,
    notas: "", etapa: "activo", tier_precio: "publico",
  };

  const [form, setForm] = useState(INITIAL_FORM);
  const [savedForm, setSavedForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Dirty state detection
  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedForm),
    [form, savedForm]
  );

  useEffect(() => {
    if (institucionId) {
      fetchInstitucion().finally(() => setInitialLoaded(true));
      fetchDocentes();
      fetchDirectivos();
      fetchPersonas();
    }
  }, [institucionId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (institucion) {
      const data = {
        razon_social: institucion.razon_social || "",
        abreviatura: institucion.abreviatura || "",
        tipo_institucion: institucion.tipo_institucion || "universidad",
        ruc: institucion.ruc || "",
        correo_electronico: institucion.correo_electronico || "",
        telefono: institucion.telefono || "",
        departamento: institucion.departamento || "",
        ciudad: institucion.ciudad || "",
        direccion: institucion.direccion || "",
        latitud: institucion.latitud ?? null,
        longitud: institucion.longitud ?? null,
        notas: institucion.notas || "",
        etapa: institucion.etapa || "activo",
        tier_precio: institucion.tier_precio || "publico",
      };
      setForm(data);
      setSavedForm(data);
      setFieldErrors({});
    }
  }, [institucion]);

  // Warn on unsaved changes before navigating away
  useEffect(() => {
    function handleBeforeUnload(e) {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const oferta = institucion?.oferta_academica || [];

  // Datos de vínculos
  const docentes = Array.isArray(docentesData) ? docentesData : (docentesData?.results || []);
  const directivos = Array.isArray(directivosData) ? directivosData : (directivosData?.results || []);
  const personas = Array.isArray(personasData) ? personasData : (personasData?.results || []);
  const totalVinculos = docentes.length + directivos.length;

  const handleSave = useCallback(async () => {
    const errors = validateForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      showToast("Corregí los errores antes de guardar", "error");
      return;
    }
    setSaving(true);
    try {
      await updateInstitucion(institucionId, form);
      showToast("Institución actualizada", "success");
      fetchInstitucion();
    } catch (err) {
      showToast(err?.data?.detail || "Error al guardar", "error");
    } finally {
      setSaving(false);
    }
  }, [form, institucionId, showToast, fetchInstitucion]);

  // Ctrl+S para guardar
  useKeySave(handleSave, { disabled: saving || !isDirty });

  const handleDelete = async () => {
    const ok = await danger(`Eliminar "${form.razon_social}"?`, "Eliminar Institución", { confirmText: "Eliminar" });
    if (!ok) return;
    try {
      await deleteInstitucion(institucionId);
      showToast("Eliminada", "info");
      router.push("/ventas-crm/instituciones");
    } catch (err) {
      showToast(err?.data?.detail || "Error", "error");
    }
  };

  const handleDeleteOferta = async (item) => {
    const ok = await danger(`Eliminar "${item.nombre}"?`, "Eliminar", { confirmText: "Eliminar" });
    if (!ok) return;
    try {
      await deleteOfertaAcademica(item.id);
      showToast("Eliminada", "info");
      fetchInstitucion();
    } catch (err) {
      showToast(err?.data?.detail || "Error al eliminar", "error");
    }
  };

  const handleRefresh = useCallback(() => {
    setShowNewOferta(false);
    setEditingOfertaId(null);
    fetchInstitucion();
  }, [fetchInstitucion]);

  const handleRefreshVinculos = useCallback(() => {
    setShowAddVinculo(false);
    fetchDocentes();
    fetchDirectivos();
  }, [fetchDocentes, fetchDirectivos]);

  if (loading || !initialLoaded) return <LoadingScreen texto="Cargando institución..." />;

  if (!institucion) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md text-center">
          <GraduationCap size={48} className="text-red-400 mx-auto mb-4" />
          <Text variant="bodySmBold" className="text-red-700">Institución no encontrada</Text>
          <Button variant="primary" className="mt-4" onClick={() => router.push("/ventas-crm/instituciones")}>
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Ventas y CRM", href: "/ventas-crm" },
          { label: "Instituciones", href: "/ventas-crm/instituciones" },
          { label: form.razon_social || "Detalle" },
        ]}
        subtitle={
          form.abreviatura
            ? `${form.abreviatura} · ${TIPO_INSTITUCION.find((t) => t.value === form.tipo_institucion)?.label || ""}`
            : undefined
        }
      >
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleDelete} disabled={saving}>
            Eliminar
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving || !isDirty}>
            {saving ? "Guardando..." : "Guardar cambios"}
            {isDirty && !saving && (
              <span className="w-1.5 h-1.5 rounded-full bg-white/80 ml-1.5 animate-pulse" />
            )}
          </Button>
        </div>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* ─── Datos Básicos ─────────────────────────────── */}
          <Section title="Datos Básicos">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <Input
                  label="Nombre *"
                  value={form.razon_social}
                  onChange={(e) => setForm((p) => ({ ...p, razon_social: e.target.value }))}
                  placeholder="Universidad Nacional de Asunción — Sede San Lorenzo"
                  error={fieldErrors.razon_social}
                />
              </div>
              <Input
                label="Abreviatura"
                value={form.abreviatura}
                onChange={(e) => setForm((p) => ({ ...p, abreviatura: e.target.value }))}
                placeholder="UNA"
                maxLength={20}
              />
              <Field label="Tipo de Institución">
                <select
                  className={selectClass}
                  value={form.tipo_institucion}
                  onChange={(e) => setForm((p) => ({ ...p, tipo_institucion: e.target.value }))}
                >
                  {TIPO_INSTITUCION.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Etapa">
                <select
                  className={selectClass}
                  value={form.etapa}
                  onChange={(e) => setForm((p) => ({ ...p, etapa: e.target.value }))}
                >
                  {ETAPA_CUENTA.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          {/* ─── Contacto y Ubicación ─────────────────────── */}
          <Section title="Contacto y Ubicación">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="RUC"
                value={form.ruc}
                onChange={(e) => setForm((p) => ({ ...p, ruc: e.target.value }))}
                placeholder="80000000-1"
              />
              <Input
                label="Teléfono"
                value={form.telefono}
                onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))}
                placeholder="021 123456"
              />
              <Input
                label="Correo Electrónico"
                value={form.correo_electronico}
                onChange={(e) => setForm((p) => ({ ...p, correo_electronico: e.target.value }))}
                placeholder="contacto@inst.edu.py"
                error={fieldErrors.correo_electronico}
              />
            </div>
            <div className="mt-5">
              <UbicacionPicker
                label="Ubicación"
                departamento={form.departamento}
                ciudad={form.ciudad}
                direccion={form.direccion}
                latitud={form.latitud}
                longitud={form.longitud}
                onChange={({ departamento, ciudad, direccion, latitud, longitud }) => {
                  setForm((p) => ({ ...p, departamento, ciudad, direccion, latitud, longitud }));
                }}
                mapHeight="350px"
              />
            </div>
          </Section>

          {/* ─── Contactos y Vínculos ─────────────────────── */}
          <Section title={`Contactos y Vínculos (${totalVinculos})`}>
            {totalVinculos === 0 && !showAddVinculo ? (
              <div className="text-center py-6">
                <Users size={32} className="text-slate-300 mx-auto mb-2" />
                <Text variant="bodySm" className="text-slate-400">
                  No hay personas vinculadas a esta institución.
                </Text>
                <Button variant="ghost" size="sm" icon={Plus} className="mt-3" onClick={() => setShowAddVinculo(true)}>
                  Agregar vínculo
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {directivos.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Award size={14} className="text-amber-500" />
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Directivos ({directivos.length})
                      </span>
                    </div>
                    {directivos.map((d) => (
                      <VinculoItem
                        key={`dir-${d.id}`}
                        nombre={d.persona_nombre}
                        rol={d.cargo}
                        detalle={d.activo ? (d.desde ? `Desde ${d.desde}` : null) : "Inactivo"}
                        personaId={d.persona}
                      />
                    ))}
                  </div>
                )}

                {docentes.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1 mt-3">
                      <BookOpen size={14} className="text-blue-500" />
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Docentes ({docentes.length})
                      </span>
                    </div>
                    {docentes.map((d) => (
                      <VinculoItem
                        key={`doc-${d.id}`}
                        nombre={d.persona_nombre}
                        rol={TIPO_DOCENTE.find((t) => t.value === d.tipo)?.label || d.tipo_display || d.tipo}
                        detalle={[d.oferta_academica_nombre, d.catedra].filter(Boolean).join(" · ") || null}
                        personaId={d.persona}
                      />
                    ))}
                  </div>
                )}

                {showAddVinculo ? (
                  <AgregarVinculoForm
                    institucionId={institucionId}
                    personas={personas}
                    ofertas={oferta}
                    onSaved={handleRefreshVinculos}
                    onCancel={() => setShowAddVinculo(false)}
                  />
                ) : (
                  <Button variant="ghost" size="sm" icon={Plus} className="mt-2" onClick={() => setShowAddVinculo(true)}>
                    Agregar vínculo
                  </Button>
                )}
              </div>
            )}
          </Section>

          {/* ─── Oferta Académica ─────────────────────────── */}
          <Section title={`Oferta Académica (${oferta.length})`}>
            <div className="space-y-2">
              {oferta.map((item) => (
                <div key={item.id}>
                  {editingOfertaId === item.id ? (
                    <OfertaForm
                      oferta={item}
                      institucionId={institucionId}
                      onSaved={handleRefresh}
                      onCancel={() => setEditingOfertaId(null)}
                    />
                  ) : (
                    <div
                      className="bg-white border border-slate-100 rounded-lg p-3 flex items-center justify-between shadow-sm hover:border-slate-200 transition-colors cursor-pointer"
                      onClick={() => router.push(`/ventas-crm/instituciones/${institucionId}/oferta/${item.id}`)}
                    >
                      <div className="min-w-0">
                        <Text variant="bodySmBold" className="text-slate-700 font-medium">
                          {item.nombre}
                        </Text>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <Badge variant="default" className="text-[10px] py-0 px-1.5 uppercase font-semibold">
                            {TIPO_OFERTA.find((t) => t.value === item.tipo)?.label || item.tipo}
                          </Badge>
                          {item.duracion_anios && (
                            <span className="text-[11px] text-slate-400 font-mono">
                              {item.duracion_anios} {item.duracion_anios === 1 ? "año" : "años"}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingOfertaId(item.id); }}
                          aria-label={`Editar ${item.nombre}`}
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-300 hover:text-slate-600 transition-colors"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteOferta(item); }}
                          aria-label={`Eliminar ${item.nombre}`}
                          className="p-1.5 rounded-md hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {showNewOferta ? (
                <OfertaForm
                  institucionId={institucionId}
                  onSaved={handleRefresh}
                  onCancel={() => setShowNewOferta(false)}
                />
              ) : (
                <Button variant="ghost" size="sm" icon={Plus} onClick={() => setShowNewOferta(true)}>
                  Agregar oferta académica
                </Button>
              )}
            </div>
          </Section>

          {/* ─── Historial ─────────────────────────────── */}
          <Section title="Historial de Cambios">
            <HistorialSection institucionId={institucionId} />
          </Section>

          {/* ─── Notas ────────────────────────────────────── */}
          <Section title="Notas">
            <textarea
              className={cn(selectClass, "min-h-[100px] resize-y")}
              value={form.notas}
              onChange={(e) => setForm((p) => ({ ...p, notas: e.target.value }))}
              placeholder="Observaciones sobre esta institución..."
            />
          </Section>

        </div>
      </main>
    </div>
  );
}
