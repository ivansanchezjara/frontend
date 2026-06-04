"use client";
import { useState, useEffect } from "react";
import { Search, Users, UserPlus, ArrowLeft, Save, Loader2 } from "lucide-react";
import { Input, Field, Button, Modal, PhoneInput, validatePhone, buildPhoneValue } from "@/components/ui";
import { useToast } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { createOportunidad, getClientes, createCliente } from "@/services/apis/ventas";
import { cn } from "@/lib/utils";

const INITIAL_FORM = {
  titulo: "",
  descripcion: "",
  monto_estimado: "",
  fecha_cierre_estimada: "",
  cliente: null,
};

/**
 * Modal rápido para crear una oportunidad desde el Kanban.
 */
export default function NuevaOportunidadModal({ open, onClose, onCreated }) {
  const { showToast } = useToast();

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [showClientePicker, setShowClientePicker] = useState(false);

  // Reset al abrir
  useEffect(() => {
    if (open) {
      setFormData(INITIAL_FORM);
      setErrors({});
      setClienteSeleccionado(null);
      setSaving(false);
      setShowClientePicker(false);
    }
  }, [open]);

  const handleField = (field) => (e) => {
    const value = e?.target !== undefined ? e.target.value : e;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  const handleSelectCliente = (cliente) => {
    setClienteSeleccionado(cliente);
    setFormData((prev) => ({ ...prev, cliente: cliente.id }));
    setShowClientePicker(false);
    if (errors.cliente) {
      setErrors((prev) => { const n = { ...prev }; delete n.cliente; return n; });
    }
  };

  const handleSave = async () => {
    const newErrors = {};
    if (!formData.cliente) newErrors.cliente = "Debe seleccionar un cliente.";
    if (!formData.titulo.trim()) newErrors.titulo = "El título es obligatorio.";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setSaving(true);
    setErrors({});
    try {
      const payload = {
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion || "",
        cliente: formData.cliente,
      };
      if (formData.monto_estimado) payload.monto_estimado = parseInt(formData.monto_estimado, 10);
      if (formData.fecha_cierre_estimada) payload.fecha_cierre_estimada = formData.fecha_cierre_estimada;

      const nueva = await createOportunidad(payload);
      showToast("Oportunidad creada exitosamente", "success");
      onCreated?.(nueva);
      onClose();
    } catch (err) {
      if (err?.status === 400 && err?.data) {
        const fieldErrors = {};
        for (const [key, val] of Object.entries(err.data)) {
          fieldErrors[key] = Array.isArray(val) ? val.join(" ") : val;
        }
        setErrors(fieldErrors);
        showToast("Revisá los campos marcados", "error");
      } else {
        showToast(err?.data?.detail || err?.message || "Error al crear la oportunidad", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Nueva Oportunidad" size="md">
      {/* Contenido */}
      <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Cliente */}
        {showClientePicker ? (
          <ClienteInlinePicker
            onSelect={handleSelectCliente}
            onCancel={() => setShowClientePicker(false)}
          />
        ) : clienteSeleccionado ? (
          <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50/50">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {clienteSeleccionado.razon_social}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {[clienteSeleccionado.telefono, clienteSeleccionado.correo_electronico]
                  .filter(Boolean)
                  .join(" · ") || "Sin contacto"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowClientePicker(true)}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
            >
              Cambiar
            </button>
          </div>
        ) : (
          <div>
            <button
              type="button"
              onClick={() => setShowClientePicker(true)}
              className={cn(
                "flex items-center gap-2 w-full p-3 rounded-xl border-2 border-dashed transition-colors cursor-pointer",
                errors.cliente
                  ? "border-red-300 bg-red-50 hover:border-red-400"
                  : "border-slate-200 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50/30"
              )}
            >
              <Users className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-500">Seleccionar cliente *</span>
            </button>
            {errors.cliente && (
              <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.cliente}</p>
            )}
          </div>
        )}

        {/* Título */}
        <Input
          label="Título *"
          value={formData.titulo}
          onChange={handleField("titulo")}
          placeholder="Ej: Oferta línea de composites 3M"
          maxLength={200}
          error={errors.titulo}
        />

        {/* Monto y Fecha */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Monto estimado (₲)"
            type="number"
            value={formData.monto_estimado}
            onChange={handleField("monto_estimado")}
            placeholder="0"
            error={errors.monto_estimado}
          />
          <Input
            label="Fecha cierre estimada"
            type="date"
            value={formData.fecha_cierre_estimada}
            onChange={handleField("fecha_cierre_estimada")}
            error={errors.fecha_cierre_estimada}
          />
        </div>

        {/* Descripción */}
        <Field label="Descripción">
          <textarea
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400 resize-none"
            rows={3}
            value={formData.descripcion}
            onChange={handleField("descripcion")}
            placeholder="Detalle de la oportunidad..."
            maxLength={2000}
          />
        </Field>

        {errors.non_field_errors && (
          <p className="text-xs text-red-600 font-medium">{errors.non_field_errors}</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="success"
          size="sm"
          onClick={handleSave}
          disabled={saving}
          icon={saving ? Loader2 : Save}
          className={saving ? "[&_svg]:animate-spin" : ""}
        >
          {saving ? "Creando..." : "Crear Oportunidad"}
        </Button>
      </div>
    </Modal>
  );
}

// ─── Picker inline de cliente ───────────────────────────────────

function ClienteInlinePicker({ onSelect, onCancel }) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("buscar"); // "buscar" | "crear"
  const queryDebounced = useDebounce(query, 300);
  const { data: clientesData, loading, execute: buscarClientes } = useApi(getClientes, {
    handleError: false,
  });

  useEffect(() => {
    buscarClientes({ page_size: 10 });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mode !== "buscar") return;
    const params = { page_size: 10 };
    if (queryDebounced) params.search = queryDebounced;
    buscarClientes(params);
  }, [queryDebounced, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const clientes = clientesData?.results || [];

  if (mode === "crear") {
    return (
      <NuevoClienteForm
        nombreInicial={query}
        onCreated={onSelect}
        onBack={() => setMode("buscar")}
      />
    );
  }

  return (
    <div className="rounded-xl border border-emerald-200 bg-white overflow-hidden">
      {/* Search */}
      <div className="p-3 border-b border-slate-100">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar cliente..."
          icon={Search}
          autoFocus
        />
      </div>

      {/* Lista */}
      <div className="max-h-48 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          </div>
        )}
        {!loading && clientes.length === 0 && (
          <div className="py-5 text-center space-y-2">
            <p className="text-xs text-slate-400">
              {query ? `Sin resultados para "${query}"` : "No hay clientes aún"}
            </p>
            <button
              type="button"
              onClick={() => setMode("crear")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Crear nuevo cliente
            </button>
          </div>
        )}
        {!loading && clientes.map((cliente) => (
          <button
            key={cliente.id}
            type="button"
            onClick={() => onSelect(cliente)}
            className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 transition-colors border-b border-slate-50 last:border-0 cursor-pointer"
          >
            <p className="text-sm font-semibold text-slate-800 truncate">
              {cliente.razon_social}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {[cliente.telefono, cliente.correo_electronico]
                .filter(Boolean)
                .join(" · ") || "Sin contacto"}
            </p>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          icon={UserPlus}
          onClick={() => setMode("crear")}
        >
          Nuevo cliente
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

// ─── Formulario rápido de nuevo cliente ─────────────────────────

const INITIAL_NUEVO_CLIENTE = {
  razon_social: "",
  telefono: "",
  telefonoPrefijo: "+595",
  correo_electronico: "",
  ruc: "",
};

function NuevoClienteForm({ nombreInicial, onCreated, onBack }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    ...INITIAL_NUEVO_CLIENTE,
    razon_social: nombreInicial || "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleField = (field) => (e) => {
    const value = e?.target !== undefined ? e.target.value : e;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleSave = async () => {
    const newErrors = {};

    if (!form.razon_social.trim()) {
      newErrors.razon_social = "El nombre es obligatorio.";
    }

    // Validar teléfono con prefijo
    if (form.telefono.trim()) {
      const telefonoError = validatePhone(form.telefonoPrefijo, form.telefono);
      if (telefonoError) newErrors.telefono = telefonoError;
    }

    // Validar email
    if (form.correo_electronico.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo_electronico)) {
        newErrors.correo_electronico = "El correo no tiene un formato válido.";
      }
    }

    // Al menos uno de los dos
    if (!form.telefono.trim() && !form.correo_electronico.trim()) {
      newErrors.telefono = "Ingresá al menos un teléfono o correo.";
    }

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setSaving(true);
    try {
      const payload = { razon_social: form.razon_social.trim(), etapa: "prospecto" };
      const telefonoFinal = buildPhoneValue(form.telefonoPrefijo, form.telefono);
      if (telefonoFinal) payload.telefono = telefonoFinal;
      if (form.correo_electronico.trim()) payload.correo_electronico = form.correo_electronico.trim();
      if (form.ruc.trim()) payload.ruc = form.ruc.trim();

      const nuevoCliente = await createCliente(payload);
      showToast(`Cliente "${nuevoCliente.razon_social}" creado`, "success");
      onCreated(nuevoCliente);
    } catch (err) {
      if (err?.status === 400 && err?.data) {
        const fieldErrors = {};
        for (const [key, val] of Object.entries(err.data)) {
          fieldErrors[key] = Array.isArray(val) ? val.join(" ") : val;
        }
        setErrors(fieldErrors);
      } else {
        showToast(err?.data?.detail || err?.message || "Error al crear el cliente", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-emerald-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100 bg-emerald-50/50">
        <button
          type="button"
          onClick={onBack}
          className="p-1 rounded-lg hover:bg-white transition-colors cursor-pointer"
          title="Volver a buscar"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-slate-500" />
        </button>
        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <UserPlus className="h-3.5 w-3.5 text-emerald-600" />
          Nuevo cliente
        </span>
      </div>

      {/* Campos */}
      <div className="p-3 space-y-2.5">
        <Input
          label="Nombre / Razón social *"
          value={form.razon_social}
          onChange={handleField("razon_social")}
          placeholder="Ej: Juan García o Clínica Dental S.A."
          error={errors.razon_social}
          autoFocus
        />

        <PhoneInput
          label="Teléfono"
          prefix={form.telefonoPrefijo}
          onPrefixChange={(p) => setForm((prev) => ({ ...prev, telefonoPrefijo: p }))}
          value={form.telefono}
          onChange={handleField("telefono")}
          error={errors.telefono}
          helperText={!errors.telefono ? "Al menos teléfono o correo es obligatorio." : undefined}
        />

        <Input
          label="Correo electrónico"
          type="email"
          value={form.correo_electronico}
          onChange={handleField("correo_electronico")}
          placeholder="cliente@ejemplo.com"
          error={errors.correo_electronico}
        />

        <Input
          label="RUC"
          value={form.ruc}
          onChange={handleField("ruc")}
          placeholder="80000000-0"
          error={errors.ruc}
        />

        {errors.non_field_errors && (
          <p className="text-xs text-red-600 font-medium">{errors.non_field_errors}</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 px-3 py-2.5 border-t border-slate-100 bg-slate-50/50">
        <Button variant="ghost" size="sm" onClick={onBack} disabled={saving}>
          Volver
        </Button>
        <Button
          variant="success"
          size="sm"
          onClick={handleSave}
          disabled={saving}
          icon={saving ? Loader2 : Save}
          className={saving ? "[&_svg]:animate-spin" : ""}
        >
          {saving ? "Guardando..." : "Crear cliente"}
        </Button>
      </div>
    </div>
  );
}
