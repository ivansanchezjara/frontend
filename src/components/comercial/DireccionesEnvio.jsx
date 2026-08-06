"use client";
import { useState, useEffect, useCallback } from "react";
import {
  MapPin, Plus, Pencil, Trash2, Star, Phone, User, Loader2, Check, X,
} from "lucide-react";

import {
  Button, Input, Field, Badge, UbicacionPicker, useConfirm,
} from "@/components/ui";
import { useToast } from "@/components/ui";
import { Heading, Text } from "@/components/ui/basics/Typography";
import {
  getDireccionesEnvio,
  createDireccionEnvio,
  updateDireccionEnvio,
  deleteDireccionEnvio,
  marcarDireccionPrincipal,
} from "@/services/apis/ventas";

// ─── Constantes ──────────────────────────────────────────────────

const ETIQUETAS_SUGERIDAS = [
  "Consultorio",
  "Clínica",
  "Domicilio",
  "Oficina",
  "Laboratorio",
  "Sucursal",
];

// ─── Formulario de Dirección ─────────────────────────────────────

function DireccionForm({ direccion, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState({
    etiqueta: direccion?.etiqueta || "",
    nombre_destinatario: direccion?.nombre_destinatario || "",
    telefono_contacto: direccion?.telefono_contacto || "",
    departamento: direccion?.departamento || "",
    ciudad: direccion?.ciudad || "",
    barrio: direccion?.barrio || "",
    direccion: direccion?.direccion || "",
    latitud: direccion?.latitud || null,
    longitud: direccion?.longitud || null,
    es_principal: direccion?.es_principal || false,
  });
  const [errors, setErrors] = useState({});

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }

  function validate() {
    const newErrors = {};
    if (!form.etiqueta.trim()) newErrors.etiqueta = "Requerido";
    if (!form.nombre_destinatario.trim()) newErrors.nombre_destinatario = "Requerido";
    if (!form.telefono_contacto.trim()) newErrors.telefono_contacto = "Requerido";
    if (!form.departamento) newErrors.departamento = "Requerido";
    if (!form.ciudad) newErrors.ciudad = "Requerido";
    if (!form.direccion.trim()) newErrors.direccion = "Requerido";
    return newErrors;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Etiqueta */}
      <div className="space-y-2">
        <Text variant="label" className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
          Etiqueta
        </Text>
        <div className="flex flex-wrap gap-2">
          {ETIQUETAS_SUGERIDAS.map((etiqueta) => (
            <button
              key={etiqueta}
              type="button"
              onClick={() => handleChange("etiqueta", etiqueta)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                form.etiqueta === etiqueta
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {etiqueta}
            </button>
          ))}
        </div>
        <Input
          value={form.etiqueta}
          onChange={(e) => handleChange("etiqueta", e.target.value)}
          placeholder="Ej: Consultorio, Sucursal Centro..."
          maxLength={50}
          error={errors.etiqueta}
        />
      </div>

      {/* Destinatario y teléfono */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nombre del destinatario *"
          value={form.nombre_destinatario}
          onChange={(e) => handleChange("nombre_destinatario", e.target.value)}
          placeholder="Quién recibe en esta dirección"
          maxLength={200}
          error={errors.nombre_destinatario}
        />
        <Input
          label="Teléfono de contacto *"
          type="tel"
          value={form.telefono_contacto}
          onChange={(e) => handleChange("telefono_contacto", e.target.value)}
          placeholder="+595 981 123456"
          maxLength={30}
          error={errors.telefono_contacto}
        />
      </div>

      {/* Ubicación con UbicacionPicker */}
      <UbicacionPicker
        departamento={form.departamento}
        ciudad={form.ciudad}
        direccion={form.direccion}
        latitud={form.latitud}
        longitud={form.longitud}
        onChange={({ departamento, ciudad, direccion, latitud, longitud }) => {
          setForm((prev) => ({ ...prev, departamento, ciudad, direccion, latitud, longitud }));
        }}
        errors={{ departamento: errors.departamento, ciudad: errors.ciudad, direccion: errors.direccion }}
        mapHeight="280px"
      />

      {/* Barrio (campo extra) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Barrio"
          value={form.barrio}
          onChange={(e) => handleChange("barrio", e.target.value)}
          placeholder="Nombre del barrio (opcional)"
          maxLength={100}
        />
      </div>

      {/* Principal */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={form.es_principal}
          onChange={(e) => handleChange("es_principal", e.target.checked)}
          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <div className="flex items-center gap-2">
          <Star size={14} className="text-amber-400" />
          <span className="text-xs font-medium text-slate-600">
            Usar como dirección principal de envío
          </span>
        </div>
      </label>

      {/* Acciones */}
      <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
        <Button type="button" variant="ghost" onClick={onCancel} size="sm">
          Cancelar
        </Button>
        <Button type="submit" disabled={saving} size="sm">
          {saving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Check size={14} className="mr-1.5" />}
          {saving ? "Guardando..." : direccion ? "Actualizar" : "Guardar"}
        </Button>
      </div>
    </form>
  );
}

// ─── Tarjeta de dirección ────────────────────────────────────────

function DireccionCard({ direccion, onEdit, onDelete, onMarcarPrincipal }) {
  return (
    <div
      className={`relative rounded-xl border p-4 transition-all ${
        direccion.es_principal
          ? "border-blue-200 bg-blue-50/40 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      {/* Badge principal */}
      {direccion.es_principal && (
        <Badge variant="info" className="absolute top-3 right-3 text-[10px]">
          <Star size={10} className="mr-1" />
          Principal
        </Badge>
      )}

      {/* Etiqueta */}
      <div className="flex items-center gap-2 mb-2">
        <MapPin size={14} className="text-slate-400" />
        <Text variant="bodySmBold" className="text-slate-700">{direccion.etiqueta}</Text>
      </div>

      {/* Datos */}
      <div className="space-y-1 mb-3 pl-[22px]">
        <div className="flex items-center gap-1.5">
          <User size={11} className="text-slate-300" />
          <Text variant="bodySm" className="text-slate-600">{direccion.nombre_destinatario}</Text>
        </div>
        <Text variant="bodySm" className="text-slate-500">{direccion.direccion}</Text>
        <Text variant="bodySm" className="text-slate-400">
          {[direccion.barrio, direccion.ciudad, direccion.departamento].filter(Boolean).join(", ")}
        </Text>
        <div className="flex items-center gap-1.5">
          <Phone size={11} className="text-slate-300" />
          <Text variant="bodySm" className="text-slate-400">{direccion.telefono_contacto}</Text>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1 border-t border-slate-100 pt-2">
        <button
          onClick={() => onEdit(direccion)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <Pencil size={12} /> Editar
        </button>
        {!direccion.es_principal && (
          <button
            onClick={() => onMarcarPrincipal(direccion.id)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-amber-600 hover:bg-amber-50 transition-colors"
          >
            <Star size={12} /> Principal
          </button>
        )}
        <button
          onClick={() => onDelete(direccion.id)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-red-500 hover:bg-red-50 transition-colors ml-auto"
        >
          <Trash2 size={12} /> Eliminar
        </button>
      </div>
    </div>
  );
}

// ─── Componente Principal ────────────────────────────────────────

/**
 * DireccionesEnvio — CRUD de direcciones de envío para una CuentaComercial.
 *
 * Props:
 * - cuentaId: number — ID de la CuentaComercial
 * - maxDirecciones: number (default 10)
 */
export default function DireccionesEnvio({ cuentaId, maxDirecciones = 10 }) {
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const [direcciones, setDirecciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);

  const fetchDirecciones = useCallback(async () => {
    if (!cuentaId) return;
    try {
      setLoading(true);
      const data = await getDireccionesEnvio(cuentaId);
      setDirecciones(Array.isArray(data) ? data : data.results || []);
    } catch {
      showToast("Error al cargar direcciones", "error");
    } finally {
      setLoading(false);
    }
  }, [cuentaId, showToast]);

  useEffect(() => {
    fetchDirecciones();
  }, [fetchDirecciones]);

  async function handleCreate(formData) {
    setSaving(true);
    try {
      await createDireccionEnvio({ ...formData, cuenta: cuentaId });
      setShowForm(false);
      showToast("Dirección creada", "success");
      await fetchDirecciones();
    } catch (err) {
      showToast(err?.data?.detail || err?.data?.cuenta?.[0] || "Error al crear", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(formData) {
    setSaving(true);
    try {
      await updateDireccionEnvio(editando.id, formData);
      setEditando(null);
      showToast("Dirección actualizada", "success");
      await fetchDirecciones();
    } catch (err) {
      showToast(err?.data?.detail || "Error al actualizar", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const ok = await confirm("¿Eliminar esta dirección de envío?", "Esta acción no se puede deshacer.");
    if (!ok) return;
    try {
      await deleteDireccionEnvio(id);
      showToast("Dirección eliminada", "success");
      await fetchDirecciones();
    } catch {
      showToast("Error al eliminar", "error");
    }
  }

  async function handleMarcarPrincipal(id) {
    try {
      await marcarDireccionPrincipal(id);
      await fetchDirecciones();
    } catch {
      showToast("Error al marcar como principal", "error");
    }
  }

  // ─── Render ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={20} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Text variant="label" className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            Direcciones de Envío
          </Text>
          <Text variant="bodySm" className="text-slate-400 mt-0.5">
            {direcciones.length}/{maxDirecciones} direcciones
          </Text>
        </div>
        {!showForm && !editando && (
          <Button
            onClick={() => setShowForm(true)}
            size="sm"
            variant="ghost"
            disabled={direcciones.length >= maxDirecciones}
          >
            <Plus size={14} className="mr-1" /> Agregar
          </Button>
        )}
      </div>

      {/* Formulario de creación */}
      {showForm && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-5">
          <Text variant="bodySmBold" className="text-blue-700 mb-3">Nueva Dirección de Envío</Text>
          <DireccionForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
            saving={saving}
          />
        </div>
      )}

      {/* Formulario de edición */}
      {editando && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-5">
          <Text variant="bodySmBold" className="text-blue-700 mb-3">Editar Dirección</Text>
          <DireccionForm
            direccion={editando}
            onSubmit={handleUpdate}
            onCancel={() => setEditando(null)}
            saving={saving}
          />
        </div>
      )}

      {/* Lista de direcciones */}
      {!showForm && !editando && (
        <>
          {direcciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                <MapPin size={20} className="text-slate-300" />
              </div>
              <Text variant="bodySm" className="text-slate-500">
                Sin direcciones de envío registradas
              </Text>
              <Text variant="bodySm" className="text-slate-400 mt-1">
                Agregá la primera dirección para agilizar los despachos.
              </Text>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {direcciones.map((dir) => (
                <DireccionCard
                  key={dir.id}
                  direccion={dir}
                  onEdit={setEditando}
                  onDelete={handleDelete}
                  onMarcarPrincipal={handleMarcarPrincipal}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
