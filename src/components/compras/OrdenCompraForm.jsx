"use client";

import { useState, useEffect } from "react";
import { Package } from "lucide-react";
import { Button, Input, Field, Section, useToast } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import {
  createOrdenCompra, getSiguienteNumeroOC,
  getTableroAbastecimiento, marcarEnGestion,
} from "@/services/apis/compras";
import { getMarcas } from "@/services/apis/catalogo";

const PRIORIDAD_BADGE = {
  alta: { label: "Alta", className: "bg-red-100 text-red-700" },
  media: { label: "Media", className: "bg-amber-100 text-amber-700" },
  baja: { label: "Baja", className: "bg-slate-100 text-slate-600" },
};

/**
 * Formulario para crear una nueva Orden de Compra.
 *
 * Props:
 * - onSuccess: (orden) => void — callback tras creación exitosa
 * - onCancel: () => void
 */
export default function OrdenCompraForm({ onSuccess, onCancel }) {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    numero: "",
    proveedor: "",
    pais_origen: "China",
    marca_id: "",
    fecha_orden: new Date().toISOString().split("T")[0],
    fecha_estimada_arribo: "",
    observaciones: "",
  });

  const [seleccionados, setSeleccionados] = useState(new Set());

  const { data: tablero, execute: fetchTablero } = useApi(
    getTableroAbastecimiento, { auto: false, initialData: [] }
  );
  const { data: marcasData, execute: fetchMarcas } = useApi(
    getMarcas, { auto: false, initialData: [] }
  );

  useEffect(() => {
    getSiguienteNumeroOC()
      .then((res) => { if (res?.numero) setForm((f) => ({ ...f, numero: res.numero })); })
      .catch(() => {});
    fetchMarcas({ page_size: 200 });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const params = {};
    if (form.marca_id) params.marca = form.marca_id;
    fetchTablero(params);
  }, [form.marca_id, fetchTablero]);

  const allMarcas = marcasData?.results || marcasData || [];
  const items = tablero || [];

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const toggleSeleccion = (solicitudIds) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      const allSelected = solicitudIds.every((id) => next.has(id));
      if (allSelected) solicitudIds.forEach((id) => next.delete(id));
      else solicitudIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.numero || !form.proveedor || !form.fecha_orden) {
      showToast("Completá los campos obligatorios (número, proveedor, fecha)", "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        numero: form.numero,
        proveedor: form.proveedor,
        pais_origen: form.pais_origen || "China",
        fecha_orden: form.fecha_orden,
        fecha_estimada_arribo: form.fecha_estimada_arribo || null,
        monto_mercaderia_usd: 0,
        monto_flete_usd: 0,
        monto_seguro_usd: 0,
        monto_aduana_usd: 0,
        monto_otros_usd: 0,
        observaciones: form.observaciones,
        items: [],
      };
      const resultado = await createOrdenCompra(payload);

      if (seleccionados.size > 0 && resultado?.id) {
        await marcarEnGestion({
          solicitud_ids: Array.from(seleccionados),
          orden_compra_id: resultado.id,
        });
      }

      showToast("Orden de compra creada exitosamente", "success");
      onSuccess?.(resultado);
    } catch (err) {
      showToast(err.message || "Error al crear la orden", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Datos Generales */}
      <Section title="Datos Generales">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Número de Orden *">
            <Input
              value={form.numero}
              onChange={(e) => handleChange("numero", e.target.value)}
              placeholder="OC-2026-001"
            />
          </Field>
          <Field label="Proveedor *">
            <Input
              value={form.proveedor}
              onChange={(e) => handleChange("proveedor", e.target.value)}
              placeholder="Nombre del proveedor"
            />
          </Field>
          <Field label="País de Origen">
            <Input
              value={form.pais_origen}
              onChange={(e) => handleChange("pais_origen", e.target.value)}
              placeholder="China"
            />
          </Field>
          <Field label="Marca">
            <select
              value={form.marca_id}
              onChange={(e) => handleChange("marca_id", e.target.value)}
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            >
              <option value="">Seleccionar marca...</option>
              {allMarcas.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </Field>
          <Field label="Fecha de Orden *">
            <Input
              type="date"
              value={form.fecha_orden}
              onChange={(e) => handleChange("fecha_orden", e.target.value)}
            />
          </Field>
          <Field label="Fecha Estimada de Arribo">
            <Input
              type="date"
              value={form.fecha_estimada_arribo}
              onChange={(e) => handleChange("fecha_estimada_arribo", e.target.value)}
            />
          </Field>
        </div>
        <Field label="Observaciones" className="mt-4">
          <textarea
            value={form.observaciones}
            onChange={(e) => handleChange("observaciones", e.target.value)}
            rows={2}
            placeholder="Notas, tracking, referencia del pedido..."
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm resize-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-transparent outline-none transition-all"
          />
        </Field>
      </Section>

      {/* Solicitudes de Abastecimiento */}
      <Section
        title="Solicitudes de Abastecimiento"
        subtitle={
          form.marca_id
            ? `Productos solicitados por vendedores de esta marca (${items.length})`
            : "Seleccioná una marca arriba para ver solicitudes relacionadas"
        }
      >
        {items.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">
            {form.marca_id
              ? "No hay solicitudes activas para esta marca."
              : "Seleccioná una marca arriba para filtrar solicitudes."}
          </p>
        ) : (
          <div className="border border-slate-100 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="w-8 px-2 py-2"></th>
                  <th className="text-left px-3 py-2 font-medium text-slate-500">Producto</th>
                  <th className="text-center px-2 py-2 font-medium text-slate-500">Prioridad</th>
                  <th className="text-center px-2 py-2 font-medium text-slate-500">Vendedores</th>
                  <th className="text-center px-2 py-2 font-medium text-slate-500">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((item) => {
                  const badge = PRIORIDAD_BADGE[item.prioridad_maxima] || {};
                  const isSelected = item.solicitud_ids.every((id) => seleccionados.has(id));
                  return (
                    <tr
                      key={item.variante_id}
                      className={`cursor-pointer transition-colors ${isSelected ? "bg-blue-50/60" : "hover:bg-slate-50"}`}
                      onClick={() => toggleSeleccion(item.solicitud_ids)}
                    >
                      <td className="px-2 py-2 text-center">
                        <input type="checkbox" checked={isSelected} onChange={() => {}} className="rounded border-slate-300 pointer-events-none" />
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-semibold text-slate-800">{item.producto_nombre}</div>
                        <div className="text-[11px] text-slate-400">{item.variante_codigo} · {item.marca_nombre}</div>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${badge.className}`}>{badge.label}</span>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <span className="font-bold text-slate-700">{item.cantidad_vendedores}</span>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <span className={`font-bold ${item.stock_actual === 0 ? "text-red-600" : "text-slate-700"}`}>{item.stock_actual}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {seleccionados.size > 0 && (
          <p className="text-xs text-blue-600 font-medium mt-3">
            ✓ {seleccionados.size} solicitud(es) se vincularán a esta orden al crearla.
          </p>
        )}
      </Section>

      {/* Acciones */}
      <div className="flex justify-end gap-3">
        <Button variant="ghost" type="button" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? "Guardando..." : "Crear Orden de Compra"}
        </Button>
      </div>
    </form>
  );
}
