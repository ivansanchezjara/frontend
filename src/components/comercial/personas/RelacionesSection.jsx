"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap, BookOpen, Award, Briefcase, User, Plus, X, Loader2,
} from "lucide-react";

import { Badge, Button, Input, Field, Section } from "@/components/ui";
import { useToast } from "@/components/ui";
import { Text } from "@/components/ui/basics/Typography";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import {
  getInstituciones, getClinicas, getOfertaAcademica,
  createFormacion, createVinculoLaboral, createVinculoDocente,
  createCargoDirectivo, deleteFormacion, deleteVinculoLaboral,
  deleteVinculoDocente, deleteCargoDirectivo, updateVinculoLaboral,
} from "@/services/apis/ventas";

// ─── Constantes ─────────────────────────────────────────────────

const TIPO_DOCENTE_LABELS = {
  titular: "Titular", adjunto: "Adjunto", asistente: "Asistente",
  instructor: "Instructor", invitado: "Invitado",
};

const TIPO_DOCENTE_OPTIONS = [
  { value: "titular", label: "Titular" },
  { value: "adjunto", label: "Adjunto" },
  { value: "asistente", label: "Asistente" },
  { value: "instructor", label: "Instructor" },
  { value: "invitado", label: "Invitado" },
];

const ESTADO_FORMACION = {
  cursando: { label: "Cursando", className: "bg-blue-50 text-blue-700" },
  egresado: { label: "Egresado/a", className: "bg-emerald-50 text-emerald-700" },
  abandonado: { label: "Abandonó", className: "bg-red-50 text-red-600" },
};

const ESTADO_FORMACION_OPTIONS = [
  { value: "cursando", label: "Cursando" },
  { value: "egresado", label: "Egresado/a" },
  { value: "abandonado", label: "Abandonó" },
];

const TIPO_FORMACION_OPTIONS = [
  { value: "grado", label: "Grado" },
  { value: "posgrado", label: "Posgrado" },
  { value: "especializacion", label: "Especialización" },
  { value: "diplomado", label: "Diplomado" },
  { value: "residencia", label: "Residencia" },
  { value: "curso", label: "Curso" },
];

const selectClass =
  "block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500";

// ─── Buscador de entidades (instituciones o clínicas) ───────────

function EntitySearch({ label, placeholder, fetchFn, onSelect, displayField = "razon_social" }) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const { data, loading } = useApi(fetchFn, {
    auto: debouncedQuery.length >= 2,
    args: [{ search: debouncedQuery, page_size: 8 }],
    initialData: null,
  });

  const results = data?.results || [];

  return (
    <div className="relative">
      <Input
        label={label}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
      />
      {debouncedQuery.length >= 2 && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {loading && (
            <div className="px-3 py-2 text-xs text-slate-400">Buscando...</div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-3 py-2 text-xs text-slate-400">Sin resultados</div>
          )}
          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
              onClick={() => { onSelect(item); setQuery(""); }}
            >
              <span className="font-medium text-slate-700">
                {item.abreviatura ? `${item.abreviatura} — ` : ""}
                {item[displayField]}
              </span>
              {item.nombre_comercial && (
                <span className="text-slate-400 text-xs ml-1">({item.nombre_comercial})</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Buscador de Oferta Académica (filtrado por institución) ────

function OfertaAcademicaSearch({ institucionId, selected, onSelect, onClear }) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar ofertas cuando cambia la institución o el query
  useEffect(() => {
    if (!institucionId) return;
    let cancelled = false;
    setLoading(true);
    const params = { institucion: institucionId };
    if (debouncedQuery) params.search = debouncedQuery;
    getOfertaAcademica(params)
      .then((data) => {
        if (!cancelled) setResults(data?.results || data || []);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [institucionId, debouncedQuery]);

  if (selected) {
    return (
      <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 border border-violet-200">
        <BookOpen size={12} className="text-violet-500" />
        <Text variant="bodySm" className="text-violet-700 font-medium">{selected.nombre}</Text>
        <button type="button" onClick={onClear} className="ml-auto text-slate-400 hover:text-red-500">
          <X size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Input
        label="Oferta Académica (carrera/programa)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar o seleccionar..."
      />
      {results.length > 0 && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
          {loading && (
            <div className="px-3 py-2 text-xs text-slate-400">Buscando...</div>
          )}
          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
              onClick={() => { onSelect(item); setQuery(""); }}
            >
              <span className="font-medium text-slate-700">{item.nombre}</span>
            </button>
          ))}
        </div>
      )}
      {!loading && debouncedQuery.length >= 2 && results.length === 0 && (
        <div className="mt-1">
          <Text variant="mutedXs" className="text-slate-400">Sin resultados. Podés escribir el título manualmente abajo.</Text>
        </div>
      )}
    </div>
  );
}

// ─── Form: Agregar Formación Académica ──────────────────────────

function AddFormacionForm({ personaId, onCreated, onCancel }) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [institucion, setInstitucion] = useState(null);
  const [ofertaAcademica, setOfertaAcademica] = useState(null);
  const [form, setForm] = useState({
    tipo: "grado",
    estado: "cursando",
    anio_ingreso: "",
    anio_egreso: "",
    titulo_obtenido: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!institucion) return;
    setSaving(true);
    try {
      await createFormacion({
        persona: personaId,
        institucion: institucion.id,
        oferta_academica: ofertaAcademica?.id || null,
        tipo: form.tipo,
        estado: form.estado,
        anio_ingreso: form.anio_ingreso ? Number(form.anio_ingreso) : null,
        anio_egreso: form.anio_egreso ? Number(form.anio_egreso) : null,
        titulo_obtenido: form.titulo_obtenido || "",
      });
      showToast("Formación agregada", "success");
      onCreated();
    } catch (err) {
      showToast(err?.data?.detail || "Error al crear formación", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-violet-50/50 border border-violet-100 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Text variant="bodySmBold" className="text-violet-700">Nueva Formación Académica</Text>
        <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <X size={16} />
        </button>
      </div>

      <EntitySearch
        label="Institución *"
        placeholder="Buscar institución..."
        fetchFn={getInstituciones}
        onSelect={(inst) => { setInstitucion(inst); setOfertaAcademica(null); }}
      />
      {institucion && (
        <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 border border-violet-200">
          <GraduationCap size={12} className="text-violet-500" />
          <Text variant="bodySm" className="text-violet-700 font-medium">{institucion.abreviatura || institucion.razon_social}</Text>
          <button type="button" onClick={() => { setInstitucion(null); setOfertaAcademica(null); }} className="ml-auto text-slate-400 hover:text-red-500">
            <X size={12} />
          </button>
        </div>
      )}

      {institucion && (
        <OfertaAcademicaSearch
          institucionId={institucion.id}
          selected={ofertaAcademica}
          onSelect={setOfertaAcademica}
          onClear={() => setOfertaAcademica(null)}
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tipo">
          <select className={selectClass} value={form.tipo} onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}>
            {TIPO_FORMACION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
        <Field label="Estado">
          <select className={selectClass} value={form.estado} onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value }))}>
            {ESTADO_FORMACION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Año ingreso" type="number" value={form.anio_ingreso} onChange={(e) => setForm((p) => ({ ...p, anio_ingreso: e.target.value }))} placeholder="2020" />
        <Input label="Año egreso" type="number" value={form.anio_egreso} onChange={(e) => setForm((p) => ({ ...p, anio_egreso: e.target.value }))} placeholder="2025" />
      </div>

      <Input label="Título obtenido" value={form.titulo_obtenido} onChange={(e) => setForm((p) => ({ ...p, titulo_obtenido: e.target.value }))} placeholder="Ej: Doctor en Odontología" helperText="Opcional si ya seleccionaste una oferta académica" />

      <div className="flex justify-end">
        <Button type="submit" variant="primary" size="sm" disabled={saving || !institucion} icon={saving ? Loader2 : undefined}>
          {saving ? "Guardando..." : "Agregar"}
        </Button>
      </div>
    </form>
  );
}

// ─── Form: Agregar Vínculo Laboral ──────────────────────────────

function AddVinculoLaboralForm({ personaId, onCreated, onCancel }) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [clinica, setClinica] = useState(null);
  const [cargo, setCargo] = useState("");
  const [especialidad, setEspecialidad] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clinica) return;
    setSaving(true);
    try {
      await createVinculoLaboral({
        persona: personaId,
        clinica: clinica.id,
        cargo,
        especialidad,
        activo: true,
      });
      showToast("Vínculo laboral agregado", "success");
      onCreated();
    } catch (err) {
      showToast(err?.data?.detail || err?.data?.non_field_errors?.[0] || "Error al crear vínculo", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Text variant="bodySmBold" className="text-emerald-700">Nuevo Vínculo Laboral</Text>
        <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <X size={16} />
        </button>
      </div>

      <EntitySearch
        label="Clínica *"
        placeholder="Buscar clínica..."
        fetchFn={getClinicas}
        onSelect={setClinica}
        displayField="razon_social"
      />
      {clinica && (
        <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 border border-emerald-200">
          <Briefcase size={12} className="text-emerald-500" />
          <Text variant="bodySm" className="text-emerald-700 font-medium">{clinica.nombre_comercial || clinica.razon_social}</Text>
          <button type="button" onClick={() => setClinica(null)} className="ml-auto text-slate-400 hover:text-red-500">
            <X size={12} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Input label="Cargo" value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Ej: Director, Asociado" />
        <Input label="Especialidad" value={especialidad} onChange={(e) => setEspecialidad(e.target.value)} placeholder="Ej: Endodoncia, Implantes" />
      </div>

      <div className="flex justify-end">
        <Button type="submit" variant="primary" size="sm" disabled={saving || !clinica} icon={saving ? Loader2 : undefined}>
          {saving ? "Guardando..." : "Agregar"}
        </Button>
      </div>
    </form>
  );
}

// ─── Form: Agregar Vínculo Docente ──────────────────────────────

function AddVinculoDocenteForm({ personaId, onCreated, onCancel }) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [institucion, setInstitucion] = useState(null);
  const [ofertaAcademica, setOfertaAcademica] = useState(null);
  const [form, setForm] = useState({ tipo: "titular", catedra: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!institucion) return;
    setSaving(true);
    try {
      await createVinculoDocente({
        persona: personaId,
        institucion: institucion.id,
        oferta_academica: ofertaAcademica?.id || null,
        tipo: form.tipo,
        catedra: form.catedra,
        activo: true,
      });
      showToast("Vínculo docente agregado", "success");
      onCreated();
    } catch (err) {
      showToast(err?.data?.detail || err?.data?.non_field_errors?.[0] || "Error al crear vínculo docente", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Text variant="bodySmBold" className="text-blue-700">Nuevo Vínculo Docente</Text>
        <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <X size={16} />
        </button>
      </div>

      <EntitySearch
        label="Institución *"
        placeholder="Buscar institución..."
        fetchFn={getInstituciones}
        onSelect={(inst) => { setInstitucion(inst); setOfertaAcademica(null); }}
      />
      {institucion && (
        <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 border border-blue-200">
          <BookOpen size={12} className="text-blue-500" />
          <Text variant="bodySm" className="text-blue-700 font-medium">{institucion.abreviatura || institucion.razon_social}</Text>
          <button type="button" onClick={() => { setInstitucion(null); setOfertaAcademica(null); }} className="ml-auto text-slate-400 hover:text-red-500">
            <X size={12} />
          </button>
        </div>
      )}

      {institucion && (
        <OfertaAcademicaSearch
          institucionId={institucion.id}
          selected={ofertaAcademica}
          onSelect={setOfertaAcademica}
          onClear={() => setOfertaAcademica(null)}
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tipo">
          <select className={selectClass} value={form.tipo} onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}>
            {TIPO_DOCENTE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
        <Input label="Cátedra" value={form.catedra} onChange={(e) => setForm((p) => ({ ...p, catedra: e.target.value }))} placeholder="Ej: Ortodoncia II" />
      </div>

      <div className="flex justify-end">
        <Button type="submit" variant="primary" size="sm" disabled={saving || !institucion} icon={saving ? Loader2 : undefined}>
          {saving ? "Guardando..." : "Agregar"}
        </Button>
      </div>
    </form>
  );
}

// ─── Form: Agregar Cargo Directivo ──────────────────────────────

function AddCargoDirectivoForm({ personaId, onCreated, onCancel }) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [institucion, setInstitucion] = useState(null);
  const [cargo, setCargo] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!institucion || !cargo.trim()) return;
    setSaving(true);
    try {
      await createCargoDirectivo({
        persona: personaId,
        institucion: institucion.id,
        cargo,
        activo: true,
      });
      showToast("Cargo directivo agregado", "success");
      onCreated();
    } catch (err) {
      showToast(err?.data?.detail || err?.data?.non_field_errors?.[0] || "Error al crear cargo", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-amber-50/50 border border-amber-100 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Text variant="bodySmBold" className="text-amber-700">Nuevo Cargo Directivo</Text>
        <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <X size={16} />
        </button>
      </div>

      <EntitySearch
        label="Institución *"
        placeholder="Buscar institución..."
        fetchFn={getInstituciones}
        onSelect={setInstitucion}
      />
      {institucion && (
        <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 border border-amber-200">
          <Award size={12} className="text-amber-500" />
          <Text variant="bodySm" className="text-amber-700 font-medium">{institucion.abreviatura || institucion.razon_social}</Text>
          <button type="button" onClick={() => setInstitucion(null)} className="ml-auto text-slate-400 hover:text-red-500">
            <X size={12} />
          </button>
        </div>
      )}

      <Input label="Cargo *" value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Ej: Decano, Director Académico" />

      <div className="flex justify-end">
        <Button type="submit" variant="primary" size="sm" disabled={saving || !institucion || !cargo.trim()} icon={saving ? Loader2 : undefined}>
          {saving ? "Guardando..." : "Agregar"}
        </Button>
      </div>
    </form>
  );
}

// ─── Componente: Vínculo Laboral con edición inline ─────────────

function VinculoLaboralItem({ vinculo, onDelete, onUpdated }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [cargo, setCargo] = useState(vinculo.cargo || "");
  const [especialidad, setEspecialidad] = useState(vinculo.especialidad || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateVinculoLaboral(vinculo.id, { cargo, especialidad });
      showToast("Vínculo actualizado", "success");
      setEditing(false);
      if (onUpdated) onUpdated();
    } catch {
      showToast("Error al actualizar", "error");
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="bg-white border border-emerald-200 rounded-lg p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
            placeholder="Cargo"
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-emerald-400"
          />
          <input
            type="text"
            value={especialidad}
            onChange={(e) => setEspecialidad(e.target.value)}
            placeholder="Especialidad"
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-emerald-400"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setEditing(false)} className="text-[10px] font-bold text-slate-400 hover:text-slate-600">Cancelar</button>
          <button type="button" onClick={handleSave} disabled={saving} className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 disabled:opacity-50">
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    );
  }

  const subtitulo = [vinculo.cargo, vinculo.especialidad].filter(Boolean).join(" · ");

  return (
    <div
      className={cn(
        "bg-white border border-slate-100 rounded-lg p-3 flex items-center gap-3 shadow-sm hover:border-slate-200 transition-colors group cursor-pointer"
      )}
      onClick={() => vinculo.clinica && router.push(`/ventas-crm/contactos/clinicas/${vinculo.clinica}`)}
    >
      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-500")}>
        <Briefcase size={14} className="text-current" />
      </div>
      <div className="flex-1 min-w-0">
        <Text variant="bodySmBold" className="text-slate-700 truncate">{vinculo.clinica_nombre_comercial || vinculo.clinica_nombre}</Text>
        {subtitulo && <Text variant="mutedXs" className="text-slate-400 truncate">{subtitulo}</Text>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setEditing(true); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-emerald-500 p-1"
          title="Editar"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-500 p-1"
          title="Eliminar"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Componente: Item de Relación ───────────────────────────────

function RelacionItem({ icon: Icon, iconBg, nombre, subtitulo, badges, href, onDelete }) {
  const router = useRouter();
  return (
    <div
      className={cn(
        "bg-white border border-slate-100 rounded-lg p-3 flex items-center gap-3 shadow-sm hover:border-slate-200 transition-colors group",
        href && "cursor-pointer"
      )}
      onClick={() => href && router.push(href)}
    >
      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", iconBg)}>
        <Icon size={14} className="text-current" />
      </div>
      <div className="flex-1 min-w-0">
        <Text variant="bodySmBold" className="text-slate-700 truncate">{nombre}</Text>
        {subtitulo && <Text variant="mutedXs" className="text-slate-400 truncate">{subtitulo}</Text>}
        {badges && badges.length > 0 && (
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {badges.map((b, i) => (
              <Badge key={i} variant="default" className={cn("text-[9px] py-0 px-1.5", b.className)}>
                {b.label}
              </Badge>
            ))}
          </div>
        )}
      </div>
      {onDelete && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-500 shrink-0"
          title="Eliminar"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

// ─── Componente: Menú de agregar ────────────────────────────────

function AddMenu({ onSelect, onClose }) {
  const options = [
    { key: "formacion", label: "Formación Académica", icon: GraduationCap, color: "text-violet-600" },
    { key: "laboral", label: "Vínculo Laboral (Clínica)", icon: Briefcase, color: "text-emerald-600" },
    { key: "docente", label: "Vínculo Docente", icon: BookOpen, color: "text-blue-600" },
    { key: "directivo", label: "Cargo Directivo", icon: Award, color: "text-amber-600" },
  ];

  return (
    <>
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
          onClick={() => onSelect(opt.key)}
        >
          <opt.icon size={14} className={opt.color} />
          {opt.label}
        </button>
      ))}
    </>
  );
}

// ─── Componente Principal ───────────────────────────────────────

export function RelacionesSection({ persona, onRelacionesChanged }) {
  const { showToast } = useToast();
  const [addingType, setAddingType] = useState(null); // null | "formacion" | "laboral" | "docente" | "directivo"
  const [showMenu, setShowMenu] = useState(false);

  const formaciones = persona.formaciones || [];
  const vinculosDocentes = persona.vinculos_docentes || [];
  const cargosDirectivos = persona.cargos_directivos || [];
  const vinculosLaborales = persona.vinculos_laborales || [];

  const totalRelaciones = formaciones.length + vinculosDocentes.length + cargosDirectivos.length + vinculosLaborales.length;

  const handleCreated = () => {
    setAddingType(null);
    // Recargar datos de persona — el parent debe re-fetch
    if (onRelacionesChanged) onRelacionesChanged();
  };

  const handleDelete = async (type, id) => {
    try {
      if (type === "formacion") await deleteFormacion(id);
      else if (type === "laboral") await deleteVinculoLaboral(id);
      else if (type === "docente") await deleteVinculoDocente(id);
      else if (type === "directivo") await deleteCargoDirectivo(id);
      showToast("Relación eliminada", "success");
      if (onRelacionesChanged) onRelacionesChanged();
    } catch (err) {
      showToast("No se pudo eliminar", "error");
    }
  };

  return (
    <Section
      title={`Relaciones y Vínculos (${totalRelaciones})`}
      subtitle="Formaciones, docencias, cargos y vínculos laborales."
      action={
        <Button
          variant="ghost"
          size="sm"
          icon={Plus}
          onClick={() => setShowMenu((p) => !p)}
        >
          Agregar
        </Button>
      }
    >
      <div className="p-6 space-y-5">

        {/* Menú de tipo de relación a agregar */}
        {showMenu && !addingType && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-2 space-y-0.5">
            <div className="flex items-center justify-between px-3 py-1.5">
              <Text variant="mutedXs" className="text-slate-400 uppercase font-bold tracking-wide text-[10px]">
                ¿Qué tipo de relación?
              </Text>
              <button type="button" onClick={() => setShowMenu(false)} className="text-slate-300 hover:text-slate-500">
                <X size={14} />
              </button>
            </div>
            <AddMenu
              onSelect={(type) => { setAddingType(type); setShowMenu(false); }}
              onClose={() => setShowMenu(false)}
            />
          </div>
        )}

        {/* Formulario de agregar (si hay uno activo) */}
        {addingType === "formacion" && (
          <AddFormacionForm personaId={persona.id} onCreated={handleCreated} onCancel={() => setAddingType(null)} />
        )}
        {addingType === "laboral" && (
          <AddVinculoLaboralForm personaId={persona.id} onCreated={handleCreated} onCancel={() => setAddingType(null)} />
        )}
        {addingType === "docente" && (
          <AddVinculoDocenteForm personaId={persona.id} onCreated={handleCreated} onCancel={() => setAddingType(null)} />
        )}
        {addingType === "directivo" && (
          <AddCargoDirectivoForm personaId={persona.id} onCreated={handleCreated} onCancel={() => setAddingType(null)} />
        )}

        {totalRelaciones === 0 && !addingType && (
          <div className="text-center py-6">
            <User size={32} className="text-slate-300 mx-auto mb-2" />
            <Text variant="bodySm" className="text-slate-400">
              No hay relaciones registradas.
            </Text>
            <Text variant="mutedXs" className="text-slate-400 mt-1">
              Usá el botón &quot;Agregar&quot; para vincular con instituciones o clínicas.
            </Text>
          </div>
        )}

        {/* Formaciones Académicas */}
        {formaciones.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap size={14} className="text-violet-500" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Formaciones ({formaciones.length})
              </span>
            </div>
            {formaciones.map((f) => {
              const estado = ESTADO_FORMACION[f.estado] || { label: f.estado, className: "" };
              return (
                <RelacionItem
                  key={`form-${f.id}`}
                  icon={GraduationCap}
                  iconBg="bg-violet-50 text-violet-500"
                  nombre={f.oferta_academica_nombre || f.titulo_obtenido || "Formación"}
                  subtitulo={`${f.institucion_nombre}${f.institucion_abreviatura ? ` (${f.institucion_abreviatura})` : ""}`}
                  badges={[
                    { label: estado.label, className: estado.className },
                    ...(f.anio_ingreso ? [{ label: `${f.anio_ingreso}${f.anio_egreso ? `–${f.anio_egreso}` : "–presente"}` }] : []),
                  ]}
                  href={f.institucion ? `/ventas-crm/instituciones/${f.institucion}` : undefined}
                  onDelete={() => handleDelete("formacion", f.id)}
                />
              );
            })}
          </div>
        )}

        {/* Vínculos Docentes */}
        {vinculosDocentes.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen size={14} className="text-blue-500" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Docencia ({vinculosDocentes.length})
              </span>
            </div>
            {vinculosDocentes.map((d) => (
              <RelacionItem
                key={`doc-${d.id}`}
                icon={BookOpen}
                iconBg="bg-blue-50 text-blue-500"
                nombre={d.institucion_nombre}
                subtitulo={[d.oferta_academica_nombre, d.catedra].filter(Boolean).join(" · ") || undefined}
                badges={[
                  { label: TIPO_DOCENTE_LABELS[d.tipo] || d.tipo, className: "bg-blue-50 text-blue-700" },
                  ...(!d.activo ? [{ label: "Inactivo", className: "bg-red-50 text-red-600" }] : []),
                ]}
                href={d.institucion ? `/ventas-crm/instituciones/${d.institucion}` : undefined}
                onDelete={() => handleDelete("docente", d.id)}
              />
            ))}
          </div>
        )}

        {/* Cargos Directivos */}
        {cargosDirectivos.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Award size={14} className="text-amber-500" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Cargos Directivos ({cargosDirectivos.length})
              </span>
            </div>
            {cargosDirectivos.map((c) => (
              <RelacionItem
                key={`dir-${c.id}`}
                icon={Award}
                iconBg="bg-amber-50 text-amber-500"
                nombre={c.institucion_nombre}
                subtitulo={c.cargo}
                badges={[
                  ...(!c.activo ? [{ label: "Inactivo", className: "bg-red-50 text-red-600" }] : []),
                  ...(c.desde ? [{ label: `Desde ${c.desde}` }] : []),
                ]}
                href={c.institucion ? `/ventas-crm/instituciones/${c.institucion}` : undefined}
                onDelete={() => handleDelete("directivo", c.id)}
              />
            ))}
          </div>
        )}

        {/* Vínculos Laborales */}
        {vinculosLaborales.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase size={14} className="text-emerald-500" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Vínculos Laborales ({vinculosLaborales.length})
              </span>
            </div>
            {vinculosLaborales.map((v) => (
              <VinculoLaboralItem
                key={`lab-${v.id}`}
                vinculo={v}
                onDelete={() => handleDelete("laboral", v.id)}
                onUpdated={onRelacionesChanged}
              />
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
