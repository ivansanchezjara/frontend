"use client";
import { useState, useEffect } from "react";
import { Input, Button, Field, Toggle, PhoneInput, validatePhone, buildPhoneValue, PHONE_PREFIXES } from "@/components/ui";
import { Text } from "@/components/ui/basics/Typography";
import { cn } from "@/lib/utils";
import { DEPARTAMENTOS, CIUDADES_POR_DEPARTAMENTO, getAllCiudades } from "@/config/paraguay";

// ─── Configuración ──────────────────────────────────────────────

const TIPO_PERSONA_OPTIONS = [
  { value: "fisica", label: "Persona Física" },
  { value: "juridica", label: "Persona Jurídica" },
];

const CATEGORIAS_FISICA = [
  { value: "doctor", label: "Doctor/Odontólogo" },
  { value: "estudiante", label: "Estudiante" },
  { value: "protesista", label: "Protesista" },
  { value: "profesor", label: "Profesor" },
  { value: "cliente_casual", label: "Cliente Casual" },
];

const CATEGORIAS_JURIDICA = [
  { value: "clinica", label: "Clínica" },
  { value: "laboratorio_dental", label: "Laboratorio Dental" },
  { value: "mayorista", label: "Mayorista" },
  { value: "instituto_educativo", label: "Instituto Educativo" },
];

const TRATAMIENTO_OPTIONS = [
  { value: "", label: "—" },
  { value: "Sr.", label: "Sr." },
  { value: "Sra.", label: "Sra." },
  { value: "Dr.", label: "Dr." },
  { value: "Dra.", label: "Dra." },
  { value: "Prof.", label: "Prof." },
  { value: "Prof. Dr.", label: "Prof. Dr." },
  { value: "Prof. Dra.", label: "Prof. Dra." },
];

const selectClass =
  "block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500";

const textareaClass =
  "block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none placeholder:text-slate-400";

// ─── Componente: Buscador de Ciudad ─────────────────────────────

function CiudadSelect({ departamento, value, onChange, className }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  // Ciudades disponibles según departamento seleccionado
  const ciudadesDisponibles = departamento
    ? (CIUDADES_POR_DEPARTAMENTO[departamento] || [])
    : getAllCiudades();

  // Filtrar por búsqueda
  const filtered = search
    ? ciudadesDisponibles.filter((c) =>
        c.toLowerCase().includes(search.toLowerCase())
      )
    : ciudadesDisponibles;

  const handleSelect = (ciudad) => {
    // Simular event para handleChange
    onChange({ target: { value: ciudad } });
    setSearch("");
    setOpen(false);
  };

  const handleInputChange = (e) => {
    setSearch(e.target.value);
    setOpen(true);
    // Si el texto coincide exactamente con una ciudad, seleccionarla
    const exact = ciudadesDisponibles.find(
      (c) => c.toLowerCase() === e.target.value.toLowerCase()
    );
    if (exact) {
      onChange({ target: { value: exact } });
    } else {
      onChange({ target: { value: e.target.value } });
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        className={className}
        value={open ? search : value}
        onFocus={() => { setOpen(true); setSearch(value); }}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        onChange={handleInputChange}
        placeholder="Buscar ciudad..."
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg">
          {filtered.slice(0, 30).map((ciudad) => (
            <button
              key={ciudad}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(ciudad)}
              className={cn(
                "w-full text-left px-3.5 py-2 text-sm hover:bg-slate-50 transition-colors",
                ciudad === value && "bg-blue-50 text-blue-700 font-semibold"
              )}
            >
              {ciudad}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Helper: parsear teléfono guardado en BD → { prefix, number } ──
// El formato guardado es "+595 981000000" o "981000000" (sin prefijo)
function parsePhoneValue(raw = "") {
  if (!raw) return { prefix: "+595", number: "" };
  const known = PHONE_PREFIXES.filter((p) => p.code !== "+other").sort(
    (a, b) => b.code.length - a.code.length // más largos primero para evitar match parcial
  );
  for (const p of known) {
    if (raw.startsWith(p.code + " ")) {
      return { prefix: p.code, number: raw.slice(p.code.length + 1) };
    }
  }
  // Sin prefijo reconocido → asumir Paraguay
  return { prefix: "+595", number: raw };
}

// ─── Componente Principal ───────────────────────────────────────

/**
 * Formulario de datos del cliente.
 *
 * Obligatorios: tipo_persona, categoria, razon_social, telefono, correo_electronico
 * Condicionales: ruc (jurídica nacional), documento_extranjero (extranjero)
 * Opcionales: nombre_comercial (jurídica), direccion, direccion_entrega, notas
 *
 * @param {Object} cliente - Datos actuales del cliente (null para nuevo)
 * @param {Function} onSave - Callback al guardar (recibe formData)
 * @param {boolean} saving - Estado de guardado
 * @param {Object|null} errors - Errores de validación del backend
 * @param {boolean} isNew - Si es creación (vs edición)
 */
export default function ClienteForm({ cliente, onSave, saving = false, errors = null, isNew = false }) {
  const parsedPhone = parsePhoneValue(cliente?.telefono || "");

  const [formData, setFormData] = useState({
    tipo_persona: cliente?.tipo_persona || "fisica",
    categoria: cliente?.categoria || "cliente_casual",
    es_extranjero: cliente?.es_extranjero || false,
    tratamiento: cliente?.tratamiento || "",
    razon_social: cliente?.razon_social || "",
    nombre_comercial: cliente?.nombre_comercial || "",
    telefonoPrefijo: parsedPhone.prefix,
    telefono: parsedPhone.number,
    correo_electronico: cliente?.correo_electronico || "",
    ruc: cliente?.ruc || "",
    documento_extranjero: cliente?.documento_extranjero || "",
    cedula: cliente?.cedula || "",
    registro_profesional: cliente?.registro_profesional || "",
    departamento: cliente?.departamento || "",
    ciudad: cliente?.ciudad || "",
    direccion: cliente?.direccion || "",
    misma_direccion_entrega: cliente?.misma_direccion_entrega ?? true,
    direccion_entrega: cliente?.direccion_entrega || "",
    notas: cliente?.notas || "",
  });

  const [isDirty, setIsDirty] = useState(false);
  const [localErrors, setLocalErrors] = useState({});

  // Categorías disponibles según tipo de persona
  const categoriasDisponibles =
    formData.tipo_persona === "juridica" ? CATEGORIAS_JURIDICA : CATEGORIAS_FISICA;

  // Resetear categoría si cambia tipo_persona y la actual no es válida
  useEffect(() => {
    const validas = categoriasDisponibles.map((c) => c.value);
    if (!validas.includes(formData.categoria)) {
      setFormData((prev) => ({
        ...prev,
        categoria: categoriasDisponibles[0]?.value || "",
      }));
    }
    // Limpiar tratamiento si es persona jurídica
    if (formData.tipo_persona === "juridica" && formData.tratamiento) {
      setFormData((prev) => ({ ...prev, tratamiento: "" }));
    }
  }, [formData.tipo_persona]); // eslint-disable-line react-hooks/exhaustive-deps

  // Limpiar ciudad si cambia el departamento y la ciudad no pertenece al nuevo
  useEffect(() => {
    if (formData.departamento && formData.ciudad) {
      const ciudadesValidas = CIUDADES_POR_DEPARTAMENTO[formData.departamento] || [];
      if (!ciudadesValidas.includes(formData.ciudad)) {
        setFormData((prev) => ({ ...prev, ciudad: "" }));
      }
    }
  }, [formData.departamento]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setLocalErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleToggle = (field) => (value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validación local
    const newErrors = {};
    if (!formData.razon_social.trim()) newErrors.razon_social = "Este campo es obligatorio.";

    if (!formData.telefono.trim()) {
      newErrors.telefono = "Este campo es obligatorio.";
    } else {
      const phoneErr = validatePhone(formData.telefonoPrefijo, formData.telefono);
      if (phoneErr) newErrors.telefono = phoneErr;
    }

    if (!formData.correo_electronico.trim()) {
      newErrors.correo_electronico = "Este campo es obligatorio.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo_electronico)) {
      newErrors.correo_electronico = "El correo no tiene un formato válido.";
    }

    // RUC obligatorio para jurídica nacional
    if (formData.tipo_persona === "juridica" && !formData.es_extranjero && !formData.ruc.trim()) {
      newErrors.ruc = "El RUC es obligatorio para persona jurídica nacional.";
    }

    // Documento extranjero obligatorio si es extranjero
    if (formData.es_extranjero && !formData.documento_extranjero.trim()) {
      newErrors.documento_extranjero = "El documento es obligatorio para clientes extranjeros.";
    }

    // Dirección de entrega si no usa la misma
    if (!formData.misma_direccion_entrega && !formData.direccion_entrega.trim() && formData.direccion.trim()) {
      newErrors.direccion_entrega = "Indique una dirección de entrega o marque 'misma dirección'.";
    }

    if (Object.keys(newErrors).length > 0) {
      setLocalErrors(newErrors);
      return;
    }
    setLocalErrors({});

    // Construir payload: combinar prefijo + número en un solo string
    const { telefonoPrefijo, telefono, ...rest } = formData;
    const payload = {
      ...rest,
      telefono: buildPhoneValue(telefonoPrefijo, telefono),
    };
    if (onSave) onSave(payload);
  };

  const getError = (field) => {
    if (errors) {
      const err = errors[field];
      if (err) return Array.isArray(err) ? err.join(", ") : err;
    }
    return localErrors[field] || undefined;
  };

  const esJuridica = formData.tipo_persona === "juridica";

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">

      {/* ─── Clasificación ─────────────────────────────────────── */}
      <div>
        <Text variant="label" className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-4 block">
          Clasificación
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tipo de persona */}
          <Field label="Tipo de Persona *">
            <select
              className={selectClass}
              value={formData.tipo_persona}
              onChange={handleChange("tipo_persona")}
            >
              {TIPO_PERSONA_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>

          {/* Categoría */}
          <Field label="Categoría *">
            <select
              className={selectClass}
              value={formData.categoria}
              onChange={handleChange("categoria")}
            >
              {categoriasDisponibles.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {getError("categoria") && (
              <Text variant="bodySm" className="mt-1 text-xs text-red-500">
                {getError("categoria")}
              </Text>
            )}
          </Field>

          {/* Es extranjero */}
          <div className="flex items-end pb-1">
            <Toggle
              checked={formData.es_extranjero}
              onChange={handleToggle("es_extranjero")}
              label="Cliente extranjero"
            />
          </div>
        </div>
      </div>

      {/* ─── Datos Principales ─────────────────────────────────── */}
      <div>
        <Text variant="label" className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-4 block">
          Datos Principales
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tratamiento + Nombre en una fila */}
          <div className="flex gap-3 md:col-span-2 items-start">
            {!esJuridica && (
              <div className="flex flex-col gap-1.5 w-28 shrink-0">
                <Text as="label" variant="label">Tratamiento</Text>
                <select
                  className={selectClass}
                  value={formData.tratamiento}
                  onChange={handleChange("tratamiento")}
                >
                  {TRATAMIENTO_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <Input
                label={esJuridica ? "Razón Social *" : "Nombre Completo *"}
                value={formData.razon_social}
                onChange={handleChange("razon_social")}
                maxLength={200}
                placeholder={esJuridica ? "Nombre legal de la empresa" : "Nombre y apellido"}
                error={getError("razon_social")}
              />
            </div>
          </div>

          {esJuridica && (
            <Input
              label="Nombre Comercial"
              value={formData.nombre_comercial}
              onChange={handleChange("nombre_comercial")}
              maxLength={200}
              placeholder="Nombre de fantasía"
              error={getError("nombre_comercial")}
              className="md:col-span-2"
            />
          )}

          <PhoneInput
            label="Teléfono *"
            prefix={formData.telefonoPrefijo}
            onPrefixChange={(p) => {
              setFormData((prev) => ({ ...prev, telefonoPrefijo: p }));
              setIsDirty(true);
              setLocalErrors((prev) => { const n = { ...prev }; delete n.telefono; return n; });
            }}
            value={formData.telefono}
            onChange={handleChange("telefono")}
            error={getError("telefono")}
          />

          <Input
            label="Correo Electrónico *"
            type="email"
            value={formData.correo_electronico}
            onChange={handleChange("correo_electronico")}
            maxLength={254}
            placeholder="contacto@ejemplo.com"
            error={getError("correo_electronico")}
            helperText="Se usará como login para el portal e-commerce"
          />
        </div>
      </div>

      {/* ─── Documentos ────────────────────────────────────────── */}
      <div>
        <Text variant="label" className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-4 block">
          Documentos
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* RUC — obligatorio para jurídica nacional, opcional para física */}
          <Input
            label={esJuridica && !formData.es_extranjero ? "RUC *" : "RUC"}
            value={formData.ruc}
            onChange={handleChange("ruc")}
            maxLength={20}
            placeholder="80012345-6"
            error={getError("ruc")}
          />

          {/* Cédula de identidad */}
          {!esJuridica && (
            <Input
              label="Cédula de Identidad"
              value={formData.cedula}
              onChange={handleChange("cedula")}
              maxLength={20}
              placeholder="1.234.567"
              error={getError("cedula")}
            />
          )}

          {/* Registro profesional */}
          {!esJuridica && (
            <Input
              label="Nro. Registro Profesional"
              value={formData.registro_profesional}
              onChange={handleChange("registro_profesional")}
              maxLength={50}
              placeholder="Nro. de matrícula o registro"
              error={getError("registro_profesional")}
            />
          )}

          {/* Documento extranjero — solo si es extranjero */}
          {formData.es_extranjero && (
            <Input
              label="Documento Extranjero *"
              value={formData.documento_extranjero}
              onChange={handleChange("documento_extranjero")}
              maxLength={50}
              placeholder="CI o pasaporte del país de origen"
              error={getError("documento_extranjero")}
            />
          )}
        </div>
      </div>

      {/* ─── Direcciones ───────────────────────────────────────── */}
      <div>
        <Text variant="label" className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-4 block">
          Ubicación (Opcional)
        </Text>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Departamento">
              <select
                className={selectClass}
                value={formData.departamento}
                onChange={handleChange("departamento")}
              >
                <option value="">— Seleccionar —</option>
                {DEPARTAMENTOS.map((dep) => (
                  <option key={dep} value={dep}>{dep}</option>
                ))}
              </select>
              {getError("departamento") && (
                <Text variant="bodySm" className="mt-1 text-xs text-red-500">
                  {getError("departamento")}
                </Text>
              )}
            </Field>
            <Field label="Ciudad">
              <CiudadSelect
                departamento={formData.departamento}
                value={formData.ciudad}
                onChange={handleChange("ciudad")}
                className={selectClass}
              />
              {getError("ciudad") && (
                <Text variant="bodySm" className="mt-1 text-xs text-red-500">
                  {getError("ciudad")}
                </Text>
              )}
            </Field>
          </div>

          <Field label="Dirección">
            <textarea
              className={textareaClass}
              value={formData.direccion}
              onChange={handleChange("direccion")}
              rows={2}
              placeholder="Dirección completa"
            />
            {getError("direccion") && (
              <Text variant="bodySm" className="mt-1 text-xs text-red-500">
                {getError("direccion")}
              </Text>
            )}
          </Field>

          <Toggle
            checked={formData.misma_direccion_entrega}
            onChange={handleToggle("misma_direccion_entrega")}
            label="Usar la misma dirección para entregas"
          />

          {!formData.misma_direccion_entrega && (
            <Field label="Dirección de Entrega">
              <textarea
                className={cn(
                  textareaClass,
                  getError("direccion_entrega") && "border-red-300 focus:border-red-500"
                )}
                value={formData.direccion_entrega}
                onChange={handleChange("direccion_entrega")}
                rows={2}
                placeholder="Dirección de entrega diferente"
              />
              {getError("direccion_entrega") && (
                <Text variant="bodySm" className="mt-1 text-xs text-red-500">
                  {getError("direccion_entrega")}
                </Text>
              )}
            </Field>
          )}
        </div>
      </div>

      {/* ─── Notas ─────────────────────────────────────────────── */}
      <div>
        <Text variant="label" className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-4 block">
          Notas (Opcional)
        </Text>
        <Field label="Observaciones">
          <textarea
            className={textareaClass}
            value={formData.notas}
            onChange={handleChange("notas")}
            rows={3}
            placeholder="Notas internas sobre el cliente..."
            maxLength={1000}
          />
        </Field>
      </div>

      {/* ─── Botón guardar ─────────────────────────────────────── */}
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          variant="primary"
          disabled={saving || (!isNew && !isDirty)}
          className={saving ? "opacity-70" : ""}
        >
          {saving ? "Guardando..." : isNew ? "Crear Cliente" : "Guardar Cambios"}
        </Button>
      </div>
    </form>
  );
}
