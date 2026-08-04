"use client";

import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  MapPin,
  Phone,
  Mail,
  Building2,
  Loader2,
} from "lucide-react";
import { Button, Input, Text, Heading } from "@/components/ui";
import {
  getSucursales,
  createSucursal,
  updateSucursal,
  deleteSucursal,
} from "@/services/apis/empresa.js";
import { useApi } from "@/hooks/useApi";

const EMPTY_SUCURSAL = {
  nombre: "",
  direccion: "",
  ciudad: "",
  telefono: "",
  email: "",
  whatsapp: "",
  orden: 0,
  activa: true,
};

export default function SucursalesManager() {
  const [sucursales, setSucursales] = useState([]);
  const [editing, setEditing] = useState(null); // id or 'new'
  const [form, setForm] = useState(EMPTY_SUCURSAL);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const { loading } = useApi(getSucursales, {
    auto: true,
    initialData: [],
    onSuccess: (data) => setSucursales(data),
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const startCreate = () => {
    setEditing("new");
    setForm(EMPTY_SUCURSAL);
  };

  const startEdit = (sucursal) => {
    setEditing(sucursal.id);
    setForm({ ...sucursal });
  };

  const cancel = () => {
    setEditing(null);
    setForm(EMPTY_SUCURSAL);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing === "new") {
        const created = await createSucursal(form);
        setSucursales((prev) => [...prev, created]);
      } else {
        const updated = await updateSucursal(editing, form);
        setSucursales((prev) =>
          prev.map((s) => (s.id === editing ? updated : s))
        );
      }
      cancel();
    } catch {
      // error handling via global handler
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta sucursal?")) return;
    setDeleting(id);
    try {
      await deleteSucursal(id);
      setSucursales((prev) => prev.filter((s) => s.id !== id));
    } catch {
      // error handling via global handler
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Heading level={2}>Sucursales</Heading>
          <Text variant="bodySm" className="text-slate-500">
            Puntos de contacto y ubicaciones de la empresa.
          </Text>
        </div>
        {editing === null && (
          <Button
            size="sm"
            icon={Plus}
            onClick={startCreate}
          >
            Agregar Sucursal
          </Button>
        )}
      </div>

      {/* Formulario de edición / creación */}
      {editing !== null && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-6 space-y-4">
          <Text variant="label">
            {editing === "new" ? "Nueva Sucursal" : "Editar Sucursal"}
          </Text>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Nombre"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              icon={Building2}
              placeholder="Ej: Asunción"
              required
            />
            <Input
              label="Ciudad"
              name="ciudad"
              value={form.ciudad}
              onChange={handleChange}
              icon={MapPin}
              placeholder="Asunción, CDE..."
            />
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Dirección
              </label>
              <textarea
                name="direccion"
                value={form.direccion}
                onChange={handleChange}
                rows={2}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Dirección completa..."
              />
            </div>
            <Input
              label="Teléfono"
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              icon={Phone}
              placeholder="+595 21 205 055"
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              icon={Mail}
              placeholder="sucursal@empresa.com"
            />
            <Input
              label="WhatsApp"
              name="whatsapp"
              value={form.whatsapp}
              onChange={handleChange}
              icon={Phone}
              placeholder="+595 981 123 456"
            />
            <Input
              label="Orden"
              name="orden"
              type="number"
              value={form.orden}
              onChange={handleChange}
              placeholder="0"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="activa"
              checked={form.activa}
              onChange={handleChange}
              id="sucursal-activa"
              className="rounded border-slate-300"
            />
            <label htmlFor="sucursal-activa" className="text-sm text-slate-700">
              Activa (visible en ecommerce)
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              size="sm"
              icon={saving ? Loader2 : Check}
              onClick={handleSave}
              disabled={saving || !form.nombre}
              className={saving ? "[&>svg]:animate-spin" : ""}
            >
              {saving ? "Guardando..." : "Guardar"}
            </Button>
            <Button size="sm" variant="ghost" icon={X} onClick={cancel}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Lista de sucursales */}
      {sucursales.length === 0 && editing === null && (
        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
          <MapPin size={32} className="mx-auto text-slate-300 mb-3" />
          <Text variant="bodySm" className="text-slate-400">
            No hay sucursales registradas. Agregá una para mostrar en tu tienda.
          </Text>
        </div>
      )}

      <div className="space-y-3">
        {sucursales.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Text variant="label">{s.nombre}</Text>
                {!s.activa && (
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase">
                    Inactiva
                  </span>
                )}
              </div>
              {s.direccion && (
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <MapPin size={12} />
                  <span>{s.direccion}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                {s.telefono && (
                  <span className="flex items-center gap-1">
                    <Phone size={12} />
                    {s.telefono}
                  </span>
                )}
                {s.email && (
                  <span className="flex items-center gap-1">
                    <Mail size={12} />
                    {s.email}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => startEdit(s)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                title="Editar"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => handleDelete(s.id)}
                disabled={deleting === s.id}
                className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Eliminar"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
