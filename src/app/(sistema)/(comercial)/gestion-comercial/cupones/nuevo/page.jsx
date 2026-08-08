"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PageHeader, Button, Text, Heading, Input,
} from "@/components/ui";
import { useToast } from "@/components/ui";
import { crearCupon } from "@/services/apis/cupones";
import {
  Ticket, Save, ArrowLeft, Percent, DollarSign, Calendar,
  Users, ShieldCheck, Tag, Package,
} from "lucide-react";
import Link from "next/link";

export default function NuevoCuponPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    codigo: "",
    descripcion: "",
    tipo_descuento: "porcentaje",
    valor: "",
    descuento_maximo_usd: "",
    monto_minimo_usd: "0",
    fecha_inicio: "",
    fecha_fin: "",
    uso_maximo_global: "",
    uso_maximo_por_cliente: "1",
    marcas: [],
    solo_primera_compra: false,
    es_global: true,
    activo: true,
  });
  const [marcaInput, setMarcaInput] = useState("");

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function addMarca() {
    const marca = marcaInput.trim();
    if (marca && !form.marcas.includes(marca)) {
      setForm((prev) => ({ ...prev, marcas: [...prev.marcas, marca] }));
      setMarcaInput("");
    }
  }

  function removeMarca(marca) {
    setForm((prev) => ({ ...prev, marcas: prev.marcas.filter((m) => m !== marca) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.codigo || !form.valor || !form.fecha_inicio || !form.fecha_fin) {
      showToast("Completá código, valor y fechas.", "error");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...form,
        valor: parseFloat(form.valor),
        descuento_maximo_usd: form.descuento_maximo_usd ? parseFloat(form.descuento_maximo_usd) : null,
        monto_minimo_usd: parseFloat(form.monto_minimo_usd || 0),
        uso_maximo_global: form.uso_maximo_global ? parseInt(form.uso_maximo_global) : null,
        uso_maximo_por_cliente: parseInt(form.uso_maximo_por_cliente || 1),
        fecha_inicio: new Date(form.fecha_inicio).toISOString(),
        fecha_fin: new Date(form.fecha_fin).toISOString(),
      };
      await crearCupon(payload);
      showToast("Cupón creado correctamente", "success");
      router.push("/gestion-comercial/cupones");
    } catch (err) {
      const msg = err?.data?.detail || err?.data?.codigo?.[0] || "Error al crear el cupón.";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Gestión Comercial", href: "/gestion-comercial" },
          { label: "Cupones", href: "/gestion-comercial/cupones" },
          { label: "Nuevo Cupón" },
        ]}
        subtitle={
          <>
            <Ticket size={12} />
            Crear un nuevo cupón de descuento
          </>
        }
        subtitleClassName="text-emerald-600"
      >
        <Link href="/gestion-comercial/cupones">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft size={14} /> Volver
          </Button>
        </Link>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-6 min-w-0">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8">
          {/* ─── Identidad ─── */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Tag size={16} className="text-emerald-600" />
              <Heading level={5}>Identidad del Cupón</Heading>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Código *</label>
                <input
                  type="text"
                  value={form.codigo}
                  onChange={(e) => handleChange("codigo", e.target.value.toUpperCase())}
                  placeholder="Ej: BIENVENIDO10"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 font-mono tracking-wider"
                  maxLength={30}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Descripción</label>
                <input
                  type="text"
                  value={form.descripcion}
                  onChange={(e) => handleChange("descripcion", e.target.value)}
                  placeholder="Texto visible para el cliente"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
                  maxLength={200}
                />
              </div>
            </div>
          </section>

          {/* ─── Descuento ─── */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Percent size={16} className="text-emerald-600" />
              <Heading level={5}>Descuento</Heading>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tipo *</label>
                <select
                  value={form.tipo_descuento}
                  onChange={(e) => handleChange("tipo_descuento", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
                >
                  <option value="porcentaje">Porcentaje (%)</option>
                  <option value="monto_fijo">Monto Fijo (USD)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Valor * {form.tipo_descuento === "porcentaje" ? "(0-100)" : "(USD)"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={form.tipo_descuento === "porcentaje" ? "100" : undefined}
                  value={form.valor}
                  onChange={(e) => handleChange("valor", e.target.value)}
                  placeholder={form.tipo_descuento === "porcentaje" ? "10" : "5.00"}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
                />
              </div>
              {form.tipo_descuento === "porcentaje" && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Tope máximo (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.descuento_maximo_usd}
                    onChange={(e) => handleChange("descuento_maximo_usd", e.target.value)}
                    placeholder="Ej: 20 (sin tope si vacío)"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Monto mínimo de compra (USD)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.monto_minimo_usd}
                onChange={(e) => handleChange("monto_minimo_usd", e.target.value)}
                placeholder="0 = sin mínimo"
                className="w-full max-w-xs px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
              />
            </div>
          </section>

          {/* ─── Vigencia ─── */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Calendar size={16} className="text-emerald-600" />
              <Heading level={5}>Vigencia</Heading>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Fecha inicio *</label>
                <input
                  type="datetime-local"
                  value={form.fecha_inicio}
                  onChange={(e) => handleChange("fecha_inicio", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Fecha fin *</label>
                <input
                  type="datetime-local"
                  value={form.fecha_fin}
                  onChange={(e) => handleChange("fecha_fin", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
                />
              </div>
            </div>
          </section>

          {/* ─── Límites de uso ─── */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Users size={16} className="text-emerald-600" />
              <Heading level={5}>Límites de Uso</Heading>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Usos máximos totales</label>
                <input
                  type="number"
                  min="1"
                  value={form.uso_maximo_global}
                  onChange={(e) => handleChange("uso_maximo_global", e.target.value)}
                  placeholder="Vacío = ilimitado"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Usos por cliente</label>
                <input
                  type="number"
                  min="1"
                  value={form.uso_maximo_por_cliente}
                  onChange={(e) => handleChange("uso_maximo_por_cliente", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.es_global}
                  onChange={(e) => handleChange("es_global", e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">Global (todos los clientes)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.solo_primera_compra}
                  onChange={(e) => handleChange("solo_primera_compra", e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">Solo primera compra</span>
              </label>
            </div>
          </section>

          {/* ─── Restricciones de alcance ─── */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Package size={16} className="text-emerald-600" />
              <Heading level={5}>Restricciones de Alcance</Heading>
              <Text variant="bodySm" className="text-slate-400 ml-2">(opcional — vacío = aplica a todo)</Text>
            </div>

            {/* Marcas */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Marcas</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={marcaInput}
                  onChange={(e) => setMarcaInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMarca(); } }}
                  placeholder="Ej: Thalys"
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
                />
                <Button type="button" variant="outline" size="sm" onClick={addMarca}>
                  Agregar
                </Button>
              </div>
              {form.marcas.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.marcas.map((m) => (
                    <span
                      key={m}
                      className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-medium"
                    >
                      {m}
                      <button type="button" onClick={() => removeMarca(m)} className="text-blue-400 hover:text-blue-600">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <Text variant="bodySm" className="text-slate-400 mt-1">
                Si no agregás marcas, el cupón aplica a todas. Después de crear podés agregar categorías y productos desde el detalle.
              </Text>
            </div>
          </section>

          {/* ─── Submit ─── */}
          <div className="flex justify-end gap-3 pb-8">
            <Link href="/gestion-comercial/cupones">
              <Button variant="ghost" type="button">Cancelar</Button>
            </Link>
            <Button type="submit" disabled={saving} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 shadow-emerald-200">
              <Save size={14} />
              {saving ? "Guardando..." : "Crear Cupón"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
