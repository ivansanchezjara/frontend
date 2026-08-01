"use client";
import { useState } from "react";
import { Button } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/components/ui";
import { crearPuntoExpedicion, actualizarPuntoExpedicion } from "@/services/apis/caja";
import { Save } from "lucide-react";

export default function PuntoExpedicionForm({ punto, onClose, onSuccess }) {
  const { showToast } = useToast();
  const isEditing = !!punto;

  const [form, setForm] = useState({
    codigo_establecimiento: punto?.codigo_establecimiento || "",
    codigo_punto: punto?.codigo_punto || "",
    nombre: punto?.nombre || "",
    activo: punto?.activo ?? true,
  });

  const { execute: guardar, loading } = useApi(
    isEditing ? actualizarPuntoExpedicion : crearPuntoExpedicion,
    { handleError: false }
  );

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones básicas
    if (!form.codigo_establecimiento.trim()) {
      showToast("El código de establecimiento es obligatorio", "error");
      return;
    }
    if (!form.codigo_punto.trim()) {
      showToast("El código de punto es obligatorio", "error");
      return;
    }
    if (!form.nombre.trim()) {
      showToast("El nombre es obligatorio", "error");
      return;
    }

    // Validar formato (3 dígitos)
    if (!/^\d{1,3}$/.test(form.codigo_establecimiento.trim())) {
      showToast("El código de establecimiento debe ser numérico (máx. 3 dígitos)", "error");
      return;
    }
    if (!/^\d{1,3}$/.test(form.codigo_punto.trim())) {
      showToast("El código de punto debe ser numérico (máx. 3 dígitos)", "error");
      return;
    }

    const payload = {
      codigo_establecimiento: form.codigo_establecimiento.trim().padStart(3, "0"),
      codigo_punto: form.codigo_punto.trim().padStart(3, "0"),
      nombre: form.nombre.trim(),
      activo: form.activo,
    };

    try {
      if (isEditing) {
        await guardar(punto.id, payload);
      } else {
        await guardar(payload);
      }
      showToast(
        isEditing ? "Punto de expedición actualizado" : "Punto de expedición creado",
        "success"
      );
      onSuccess?.();
    } catch (err) {
      const detail = err?.data?.detail || err?.data?.codigo_establecimiento?.[0] || err?.data?.codigo_punto?.[0] || "Error al guardar";
      showToast(detail, "error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      {/* Códigos */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
            Cód. Establecimiento
          </label>
          <input
            type="text"
            maxLength={3}
            value={form.codigo_establecimiento}
            onChange={(e) => handleChange("codigo_establecimiento", e.target.value)}
            placeholder="001"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
          />
          <p className="text-[10px] text-slate-400 mt-1">Identifica la sucursal o local físico</p>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
            Cód. Punto de Emisión
          </label>
          <input
            type="text"
            maxLength={3}
            value={form.codigo_punto}
            onChange={(e) => handleChange("codigo_punto", e.target.value)}
            placeholder="001"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
          />
          <p className="text-[10px] text-slate-400 mt-1">Identifica la caja o terminal dentro del local</p>
        </div>
      </div>

      {/* Nombre */}
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
          Nombre descriptivo
        </label>
        <input
          type="text"
          value={form.nombre}
          onChange={(e) => handleChange("nombre", e.target.value)}
          placeholder="Ej: Casa Central, Sucursal CDE..."
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
        />
      </div>

      {/* Activo toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={form.activo}
          onClick={() => handleChange("activo", !form.activo)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-300 ${
            form.activo ? "bg-purple-500" : "bg-slate-300"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform ring-0 transition duration-200 ease-in-out ${
              form.activo ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
        <span className="text-sm font-medium text-slate-700">
          {form.activo ? "Activo" : "Inactivo"}
        </span>
      </div>

      {/* Preview */}
      {form.codigo_establecimiento && form.codigo_punto && (
        <div className="p-3 rounded-xl bg-purple-50 border border-purple-100">
          <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wide mb-1">
            Vista previa del código
          </p>
          <p className="text-lg font-black text-purple-700">
            {form.codigo_establecimiento.padStart(3, "0")}-{form.codigo_punto.padStart(3, "0")}
          </p>
        </div>
      )}

      {/* Botones */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={onClose}
          className="rounded-xl"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="md"
          icon={Save}
          loading={loading}
          className="rounded-xl font-bold shadow-lg shadow-purple-100"
        >
          {isEditing ? "Guardar Cambios" : "Crear Punto"}
        </Button>
      </div>
    </form>
  );
}
