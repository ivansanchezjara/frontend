"use client";
import { useState, useCallback, useRef } from "react";
import {
  Plus, GraduationCap, MapPin, Trash2, Pencil, ChevronDown, ChevronRight, X,
  Download, Upload, Building2,
} from "lucide-react";

import {
  PageHeader, Section, Button, Input, Field, EmptyState, LoadingScreen, Badge,
} from "@/components/ui";
import { useToast } from "@/components/ui";
import { Text } from "@/components/ui/basics/Typography";
import { useApi } from "@/hooks/useApi";
import { useConfirm } from "@/components/ui/feedback/ConfirmContext";
import { cn } from "@/lib/utils";
import { DEPARTAMENTOS, CIUDADES_POR_DEPARTAMENTO } from "@/config/paraguay";
import {
  getInstituciones,
  createInstitucion,
  updateInstitucion,
  deleteInstitucion,
  createEspecialidad,
  deleteEspecialidad,
  bulkCreateInstituciones,
  createSedeInstitucion,
  deleteSedeInstitucion,
} from "@/services/apis/ventas";

// ─── Constantes ─────────────────────────────────────────────────

const TIPO_ESPECIALIDAD = [
  { value: "grado", label: "Grado" },
  { value: "posgrado", label: "Posgrado" },
  { value: "especializacion", label: "Especialización" },
  { value: "diplomado", label: "Diplomado" },
  { value: "tecnicatura", label: "Tecnicatura" },
  { value: "curso", label: "Curso" },
];

const selectClass =
  "block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500";

// ─── Modal: Nueva/Editar Institución ────────────────────────────

function InstitucionModal({ institucion, onClose, onSaved }) {
  const { showToast } = useToast();
  const isEdit = !!institucion;

  const [form, setForm] = useState({
    nombre: institucion?.nombre || "",
    abreviatura: institucion?.abreviatura || "",
    departamento: institucion?.departamento || "",
    ciudad: institucion?.ciudad || "",
    telefono: institucion?.telefono || "",
    sitio_web: institucion?.sitio_web || "",
  });
  const [saving, setSaving] = useState(false);

  const ciudades = form.departamento
    ? (CIUDADES_POR_DEPARTAMENTO[form.departamento] || [])
    : [];

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      showToast("El nombre es obligatorio", "error");
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await updateInstitucion(institucion.id, form);
        showToast("Institución actualizada", "success");
      } else {
        await createInstitucion(form);
        showToast("Institución creada", "success");
      }
      onSaved();
      onClose();
    } catch (err) {
      showToast(err?.data?.detail || "Error al guardar", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <Text variant="bodySmBold" className="text-lg">
            {isEdit ? "Editar Institución" : "Nueva Institución"}
          </Text>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <Input
            label="Nombre *"
            value={form.nombre}
            onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
            placeholder="Universidad Nacional de Asunción, Instituto IAPD..."
          />
          <Input
            label="Abreviatura"
            value={form.abreviatura}
            onChange={(e) => setForm((p) => ({ ...p, abreviatura: e.target.value }))}
            placeholder="UNA, IAPD, etc."
            maxLength={20}
          />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Departamento">
              <select
                className={selectClass}
                value={form.departamento}
                onChange={(e) => setForm((p) => ({ ...p, departamento: e.target.value, ciudad: "" }))}
              >
                <option value="">— Seleccionar —</option>
                {DEPARTAMENTOS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </Field>
            <Field label="Ciudad">
              <select
                className={selectClass}
                value={form.ciudad}
                onChange={(e) => setForm((p) => ({ ...p, ciudad: e.target.value }))}
              >
                <option value="">— Seleccionar —</option>
                {ciudades.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>
          <Input
            label="Teléfono"
            value={form.telefono}
            onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))}
            placeholder="021 123456"
          />
          <Input
            label="Sitio Web"
            value={form.sitio_web}
            onChange={(e) => setForm((p) => ({ ...p, sitio_web: e.target.value }))}
            placeholder="https://www.ejemplo.edu.py"
          />
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-slate-100">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : isEdit ? "Guardar" : "Crear"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Nueva Especialidad ──────────────────────────────────

function EspecialidadModal({ institucionId, onClose, onSaved }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    nombre: "",
    tipo: "grado",
    duracion_anios: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      showToast("El nombre es obligatorio", "error");
      return;
    }
    setSaving(true);
    try {
      await createEspecialidad({
        nombre: form.nombre,
        institucion: institucionId,
        tipo: form.tipo,
        duracion_anios: form.duracion_anios ? parseInt(form.duracion_anios) : null,
      });
      showToast("Especialidad creada", "success");
      onSaved();
      onClose();
    } catch (err) {
      showToast(err?.data?.detail || "Error al crear", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <Text variant="bodySmBold">Nueva Especialidad / Carrera</Text>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <Input
            label="Nombre *"
            value={form.nombre}
            onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
            placeholder="Odontología, Ortodoncia, etc."
          />
          <Field label="Tipo">
            <select
              className={selectClass}
              value={form.tipo}
              onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}
            >
              {TIPO_ESPECIALIDAD.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Field>
          <Input
            label="Duración (años)"
            type="number"
            value={form.duracion_anios}
            onChange={(e) => setForm((p) => ({ ...p, duracion_anios: e.target.value }))}
            placeholder="5"
          />
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-slate-100">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Crear"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Nueva Sede ──────────────────────────────────────────

function SedeModal({ institucionId, onClose, onSaved }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    nombre: "",
    departamento: "",
    ciudad: "",
    telefono: "",
  });
  const [saving, setSaving] = useState(false);

  const ciudades = form.departamento
    ? (CIUDADES_POR_DEPARTAMENTO[form.departamento] || [])
    : [];

  const handleSave = async () => {
    if (!form.departamento.trim() || !form.ciudad.trim()) {
      showToast("Departamento y ciudad son obligatorios", "error");
      return;
    }
    setSaving(true);
    try {
      await createSedeInstitucion({
        institucion: institucionId,
        nombre: form.nombre,
        departamento: form.departamento,
        ciudad: form.ciudad,
        telefono: form.telefono,
      });
      showToast("Sede creada", "success");
      onSaved();
      onClose();
    } catch (err) {
      showToast(err?.data?.detail || err?.data?.non_field_errors?.[0] || "Error al crear", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <Text variant="bodySmBold">Nueva Sede</Text>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <Input
            label="Nombre de la sede"
            value={form.nombre}
            onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
            placeholder="Sede Encarnación, Filial CDE..."
          />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Departamento *">
              <select
                className={selectClass}
                value={form.departamento}
                onChange={(e) => setForm((p) => ({ ...p, departamento: e.target.value, ciudad: "" }))}
              >
                <option value="">— Seleccionar —</option>
                {DEPARTAMENTOS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </Field>
            <Field label="Ciudad *">
              <select
                className={selectClass}
                value={form.ciudad}
                onChange={(e) => setForm((p) => ({ ...p, ciudad: e.target.value }))}
              >
                <option value="">— Seleccionar —</option>
                {ciudades.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>
          <Input
            label="Teléfono"
            value={form.telefono}
            onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))}
            placeholder="021 123456"
          />
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-slate-100">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Crear"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Card de Institución ────────────────────────────────────────

function InstitucionCard({ institucion, onRefresh }) {
  const { showToast } = useToast();
  const { danger } = useConfirm();
  const [expanded, setExpanded] = useState(false);
  const [sedesExpanded, setSedesExpanded] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [espModal, setEspModal] = useState(false);
  const [sedeModal, setSedeModal] = useState(false);

  const especialidades = institucion.especialidades?.filter((e) => e.activo) || [];
  const sedes = institucion.sedes || [];

  const handleDelete = async () => {
    const ok = await danger(
      `¿Eliminar "${institucion.nombre}"?`,
      "Eliminar Institución",
      { confirmText: "Eliminar" }
    );
    if (!ok) return;
    try {
      await deleteInstitucion(institucion.id);
      showToast("Institución eliminada", "info");
      onRefresh();
    } catch {
      showToast("Error al eliminar", "error");
    }
  };

  const handleDeleteEsp = async (esp) => {
    const ok = await danger(
      `¿Eliminar "${esp.nombre}"?`,
      "Eliminar Especialidad",
      { confirmText: "Eliminar" }
    );
    if (!ok) return;
    try {
      await deleteEspecialidad(esp.id);
      showToast("Especialidad eliminada", "info");
      onRefresh();
    } catch {
      showToast("Error al eliminar", "error");
    }
  };

  const handleDeleteSede = async (sede) => {
    const label = sede.nombre || `${sede.ciudad}, ${sede.departamento}`;
    const ok = await danger(
      `¿Eliminar sede "${label}"?`,
      "Eliminar Sede",
      { confirmText: "Eliminar" }
    );
    if (!ok) return;
    try {
      await deleteSedeInstitucion(sede.id);
      showToast("Sede eliminada", "info");
      onRefresh();
    } catch {
      showToast("Error al eliminar", "error");
    }
  };

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-colors">
        <div className="p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <GraduationCap size={20} className="text-indigo-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Text variant="bodySmBold" className="truncate">{institucion.nombre}</Text>
              {institucion.abreviatura && (
                <Badge variant="default">{institucion.abreviatura}</Badge>
              )}
            </div>
            {(institucion.ciudad || institucion.departamento) && (
              <div className="flex items-center gap-1 mt-1 text-slate-400">
                <MapPin size={12} />
                <Text variant="mutedXs">
                  {[institucion.ciudad, institucion.departamento].filter(Boolean).join(", ")}
                </Text>
              </div>
            )}
            <div className="flex items-center gap-3 mt-1">
              <Text variant="mutedXs">
                {institucion.cantidad_especialidades || especialidades.length} especialidades
              </Text>
              {sedes.length > 0 && (
                <Text variant="mutedXs" className="text-indigo-500">
                  · {sedes.length} {sedes.length === 1 ? "sede" : "sedes"}
                </Text>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setEditModal(true)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Sedes */}
        <button
          onClick={() => setSedesExpanded(!sedesExpanded)}
          className="w-full px-5 py-3 border-t border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <Text variant="mutedXs" className="font-bold uppercase tracking-wider text-indigo-400">
            Sedes ({sedes.length})
          </Text>
          {sedesExpanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
        </button>

        {sedesExpanded && (
          <div className="px-5 pb-4 space-y-2">
            {sedes.length === 0 ? (
              <Text variant="mutedXs" className="text-slate-400 py-2">
                Sin sedes adicionales. La ubicación principal es {[institucion.ciudad, institucion.departamento].filter(Boolean).join(", ") || "no definida"}.
              </Text>
            ) : (
              sedes.map((sede) => (
                <div key={sede.id} className="flex items-center justify-between py-1.5 px-3 bg-indigo-50/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Building2 size={12} className="text-indigo-400" />
                    <div>
                      <Text variant="bodySm" className="font-medium">
                        {sede.nombre || `${sede.ciudad}, ${sede.departamento}`}
                      </Text>
                      {sede.nombre && (
                        <Text variant="mutedXs">{sede.ciudad}, {sede.departamento}</Text>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteSede(sede)}
                    className="p-1.5 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
            <Button
              variant="ghost"
              size="sm"
              icon={Plus}
              onClick={() => setSedeModal(true)}
              className="mt-2"
            >
              Agregar sede
            </Button>
          </div>
        )}

        {/* Especialidades */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-5 py-3 border-t border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <Text variant="mutedXs" className="font-bold uppercase tracking-wider text-slate-400">
            Especialidades ({especialidades.length})
          </Text>
          {expanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
        </button>

        {expanded && (
          <div className="px-5 pb-4 space-y-2">
            {especialidades.length === 0 ? (
              <Text variant="mutedXs" className="text-slate-400 py-2">
                Sin especialidades registradas.
              </Text>
            ) : (
              especialidades.map((esp) => (
                <div key={esp.id} className="flex items-center justify-between py-1.5 px-3 bg-slate-50 rounded-lg">
                  <div>
                    <Text variant="bodySm" className="font-medium">{esp.nombre}</Text>
                    <Text variant="mutedXs">
                      {TIPO_ESPECIALIDAD.find((t) => t.value === esp.tipo)?.label || esp.tipo}
                      {esp.duracion_anios ? ` · ${esp.duracion_anios} años` : ""}
                    </Text>
                  </div>
                  <button
                    onClick={() => handleDeleteEsp(esp)}
                    className="p-1.5 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
            <Button
              variant="ghost"
              size="sm"
              icon={Plus}
              onClick={() => setEspModal(true)}
              className="mt-2"
            >
              Agregar especialidad
            </Button>
          </div>
        )}
      </div>

      {editModal && (
        <InstitucionModal
          institucion={institucion}
          onClose={() => setEditModal(false)}
          onSaved={onRefresh}
        />
      )}
      {espModal && (
        <EspecialidadModal
          institucionId={institucion.id}
          onClose={() => setEspModal(false)}
          onSaved={onRefresh}
        />
      )}
      {sedeModal && (
        <SedeModal
          institucionId={institucion.id}
          onClose={() => setSedeModal(false)}
          onSaved={onRefresh}
        />
      )}
    </>
  );
}

// ─── Página Principal ───────────────────────────────────────────

function parseInstitucionesCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];

  // Detectar separador
  const firstLine = lines[0];
  let sep = ";";
  if (firstLine.includes("\t")) sep = "\t";
  else if (!firstLine.includes(";") && firstLine.includes(",")) sep = ",";

  const rows = lines.map((line) => line.split(sep).map((c) => c.trim().replace(/^["']|["']$/g, "")));

  // Normalizar headers (quitar sufijos como "(obligatorio)" etc)
  const header = rows[0].map((h) =>
    h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s*\(.*?\)\s*/g, "").trim()
  );

  const KNOWN = ["nombre", "abreviatura", "departamento", "ciudad", "telefono", "sitio_web", "sede_departamento", "sede_ciudad", "sede_nombre"];
  const hasHeader = header.some((h) => KNOWN.includes(h));
  const dataRows = hasHeader ? rows.slice(1) : rows;

  // Mapear columnas
  const col = (keywords) => hasHeader ? header.findIndex((h) => keywords.includes(h)) : -1;
  const nameCol = Math.max(col(["nombre"]), 0);
  const abrevCol = col(["abreviatura", "sigla"]);
  const depCol = col(["departamento"]);
  const cityCol = col(["ciudad"]);
  const telCol = col(["telefono"]);
  const webCol = col(["sitio_web", "web", "url"]);
  const sedeDepCol = col(["sede_departamento"]);
  const sedeCityCol = col(["sede_ciudad"]);
  const sedeNameCol = col(["sede_nombre"]);

  return dataRows
    .map((row) => {
      const item = { nombre: row[nameCol] || "" };
      if (abrevCol >= 0 && row[abrevCol]) item.abreviatura = row[abrevCol];
      if (depCol >= 0 && row[depCol]) item.departamento = row[depCol];
      if (cityCol >= 0 && row[cityCol]) item.ciudad = row[cityCol];
      if (telCol >= 0 && row[telCol]) item.telefono = row[telCol];
      if (webCol >= 0 && row[webCol]) item.sitio_web = row[webCol];
      // Sedes inline
      if (sedeDepCol >= 0 && sedeCityCol >= 0 && row[sedeDepCol] && row[sedeCityCol]) {
        item.sedes = [{
          departamento: row[sedeDepCol],
          ciudad: row[sedeCityCol],
          nombre: sedeNameCol >= 0 ? (row[sedeNameCol] || "") : "",
        }];
      }
      return item;
    })
    .filter((r) => r.nombre);
}

export default function InstitucionesPage() {
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const {
    data: instituciones,
    loading,
    execute: fetchInstituciones,
  } = useApi(getInstituciones, { auto: true, initialData: [] });

  const lista = Array.isArray(instituciones) ? instituciones : (instituciones?.results || []);

  const handleRefresh = useCallback(() => {
    fetchInstituciones();
  }, [fetchInstituciones]);

  const handleDownloadTemplate = () => {
    const headers = [
      "Nombre (obligatorio)",
      "Abreviatura (opcional)",
      "Departamento (opcional)",
      "Ciudad (opcional)",
      "Telefono (opcional)",
      "Sitio_Web (opcional)",
      "Sede_Departamento (opcional)",
      "Sede_Ciudad (opcional)",
      "Sede_Nombre (opcional)",
    ];
    const example1 = "Universidad Nacional de Asunción;UNA;Central;San Lorenzo;021 585000;https://www.una.py;Alto Paraná;Ciudad del Este;Filial CDE";
    const example2 = "Instituto IAPD;IAPD;Central;Asunción;021 444555;;;;";
    const csvContent = [headers.join(";"), example1, example2].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla_instituciones.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";

    const ext = file.name.split(".").pop().toLowerCase();
    if (!["csv", "txt", "tsv"].includes(ext)) {
      showToast("Formato no soportado. Usá CSV, TXT o TSV.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const parsed = parseInstitucionesCSV(ev.target.result);
      if (parsed.length === 0) {
        showToast("No se encontraron datos en el archivo.", "error");
        return;
      }

      setUploading(true);
      try {
        const res = await bulkCreateInstituciones(parsed);
        showToast(
          `${res.creados} instituciones creadas${res.errores > 0 ? `, ${res.errores} con errores` : ""}`,
          res.errores > 0 ? "warning" : "success"
        );
        handleRefresh();
      } catch (err) {
        showToast(err?.data?.detail || "Error al subir instituciones", "error");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  if (loading && lista.length === 0) {
    return <LoadingScreen texto="Cargando instituciones..." />;
  }

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Ventas y CRM", href: "/ventas-crm" },
          { label: "Instituciones" },
        ]}
        subtitle="CRM · Universidades, institutos y centros de formación"
        subtitleClassName="text-emerald-600"
      >
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            icon={Download}
            onClick={handleDownloadTemplate}
            size="sm"
          >
            Plantilla
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt,.tsv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            variant="ghost"
            icon={Upload}
            onClick={() => fileInputRef.current?.click()}
            size="sm"
            disabled={uploading}
          >
            {uploading ? "Subiendo..." : "Subir CSV"}
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setShowModal(true)}
            size="sm"
          >
            Nueva Institución
          </Button>
        </div>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-3xl mx-auto space-y-4">
          {lista.length === 0 ? (
            <EmptyState
              titulo="Sin instituciones registradas"
              descripcion="Agregá universidades, institutos o centros de capacitación para segmentar prospectos."
              icon="🎓"
            />
          ) : (
            lista.map((inst) => (
              <InstitucionCard
                key={inst.id}
                institucion={inst}
                onRefresh={handleRefresh}
              />
            ))
          )}
        </div>
      </main>

      {showModal && (
        <InstitucionModal
          onClose={() => setShowModal(false)}
          onSaved={handleRefresh}
        />
      )}
    </div>
  );
}
