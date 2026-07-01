"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { createFuncionario, updateFuncionario } from "@/services/apis/rrhh";
import { useErrorHandler } from "@/hooks/useErrorHandler";

export default function FuncionarioModal({
  funcionario,
  departamentos,
  cargos,
  onClose,
  onSuccess,
}) {
  const isEdit = !!funcionario;
  const { handleError } = useErrorHandler();

  const [form, setForm] = useState({
    nombre: funcionario?.nombre || "",
    apellido: funcionario?.apellido || "",
    cedula: funcionario?.cedula || "",
    fecha_nacimiento: funcionario?.fecha_nacimiento || "",
    sexo: funcionario?.sexo || "masculino",
    estado_civil: funcionario?.estado_civil || "soltero",
    nacionalidad: funcionario?.nacionalidad || "Paraguaya",
    telefono: funcionario?.telefono || "",
    correo_personal: funcionario?.correo_personal || "",
    correo_corporativo: funcionario?.correo_corporativo || "",
    direccion: funcionario?.direccion || "",
    ciudad: funcionario?.ciudad || "",
    barrio: funcionario?.barrio || "",
    departamento: funcionario?.departamento || "",
    cargo: funcionario?.cargo || "",
    fecha_ingreso: funcionario?.fecha_ingreso || "",
    estado: funcionario?.estado || "activo",
    banco: funcionario?.banco || "",
    numero_cuenta: funcionario?.numero_cuenta || "",
    tipo_cuenta: funcionario?.tipo_cuenta || "",
    numero_ips: funcionario?.numero_ips || "",
    emergencia_nombre: funcionario?.emergencia_nombre || "",
    emergencia_telefono: funcionario?.emergencia_telefono || "",
    emergencia_relacion: funcionario?.emergencia_relacion || "",
    notas: funcionario?.notas || "",
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await updateFuncionario(funcionario.id, form);
      } else {
        await createFuncionario(form);
      }
      onSuccess();
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">
            {isEdit ? "Editar Funcionario" : "Nuevo Funcionario"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Datos personales */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Datos Personales
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label="Nombre *" name="nombre" value={form.nombre} onChange={handleChange} required />
              <Input label="Apellido *" name="apellido" value={form.apellido} onChange={handleChange} required />
              <Input label="Cédula *" name="cedula" value={form.cedula} onChange={handleChange} required />
              <Input label="Fecha Nacimiento *" name="fecha_nacimiento" type="date" value={form.fecha_nacimiento} onChange={handleChange} required />
              <Select label="Sexo" name="sexo" value={form.sexo} onChange={handleChange} options={[
                { value: "masculino", label: "Masculino" },
                { value: "femenino", label: "Femenino" },
              ]} />
              <Select label="Estado Civil" name="estado_civil" value={form.estado_civil} onChange={handleChange} options={[
                { value: "soltero", label: "Soltero/a" },
                { value: "casado", label: "Casado/a" },
                { value: "divorciado", label: "Divorciado/a" },
                { value: "viudo", label: "Viudo/a" },
                { value: "union_libre", label: "Unión Libre" },
              ]} />
              <Input label="Nacionalidad" name="nacionalidad" value={form.nacionalidad} onChange={handleChange} />
            </div>
          </fieldset>

          {/* Contacto */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Contacto
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label="Teléfono" name="telefono" value={form.telefono} onChange={handleChange} />
              <Input label="Correo Personal" name="correo_personal" type="email" value={form.correo_personal} onChange={handleChange} />
              <Input label="Correo Corporativo" name="correo_corporativo" type="email" value={form.correo_corporativo} onChange={handleChange} />
              <Input label="Ciudad" name="ciudad" value={form.ciudad} onChange={handleChange} />
              <Input label="Barrio" name="barrio" value={form.barrio} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Dirección</label>
              <textarea
                name="direccion"
                value={form.direccion}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400 resize-none"
              />
            </div>
          </fieldset>

          {/* Datos laborales */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Datos Laborales
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select label="Departamento *" name="departamento" value={form.departamento} onChange={handleChange} required options={departamentos.map(d => ({ value: d.id, label: d.nombre }))} />
              <Select label="Cargo *" name="cargo" value={form.cargo} onChange={handleChange} required options={cargos.map(c => ({ value: c.id, label: c.nombre }))} />
              <Input label="Fecha de Ingreso *" name="fecha_ingreso" type="date" value={form.fecha_ingreso} onChange={handleChange} required />
              <Select label="Estado" name="estado" value={form.estado} onChange={handleChange} options={[
                { value: "activo", label: "Activo" },
                { value: "inactivo", label: "Inactivo" },
                { value: "licencia", label: "En Licencia" },
                { value: "desvinculado", label: "Desvinculado" },
              ]} />
            </div>
          </fieldset>

          {/* Datos bancarios */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Datos Bancarios y Seguridad Social
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input label="Banco" name="banco" value={form.banco} onChange={handleChange} />
              <Input label="Nro. Cuenta" name="numero_cuenta" value={form.numero_cuenta} onChange={handleChange} />
              <Input label="Tipo Cuenta" name="tipo_cuenta" value={form.tipo_cuenta} onChange={handleChange} />
              <Input label="Nro. IPS" name="numero_ips" value={form.numero_ips} onChange={handleChange} />
            </div>
          </fieldset>

          {/* Emergencia */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Contacto de Emergencia
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input label="Nombre" name="emergencia_nombre" value={form.emergencia_nombre} onChange={handleChange} />
              <Input label="Teléfono" name="emergencia_telefono" value={form.emergencia_telefono} onChange={handleChange} />
              <Input label="Relación" name="emergencia_relacion" value={form.emergencia_relacion} onChange={handleChange} />
            </div>
          </fieldset>

          {/* Notas */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Notas</label>
            <textarea
              name="notas"
              value={form.notas}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400 resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2.5 bg-amber-600 text-white text-sm font-medium rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50"
          >
            {saving ? "Guardando..." : isEdit ? "Actualizar" : "Crear Funcionario"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componentes internos ───────────────────────────────────────

function Input({ label, required, ...props }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-slate-500 mb-1">{label}</label>
      <input
        {...props}
        required={required}
        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400"
      />
    </div>
  );
}

function Select({ label, options, required, ...props }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-slate-500 mb-1">{label}</label>
      <select
        {...props}
        required={required}
        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400 bg-white"
      >
        <option value="">Seleccionar...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
