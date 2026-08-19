"use client";

import { useState, useEffect, useRef } from "react";
import { Save, Receipt, ChevronDown, ChevronUp, Plus, Edit2 } from "lucide-react";
import { Button, Input, Field, Section } from "@/components/ui";
import { useToast } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import {
  getCategoriasGasto,
  createCategoriaGasto,
  getConceptosFrecuentes,
  consultarRuc,
} from "@/services/apis/finanzas";
import MontoInput from "./MontoInput";

/**
 * Formulario reutilizable para crear/editar gastos.
 *
 * Props:
 * - initialData: objeto gasto existente (null para creación)
 * - onSubmit: (payload) => Promise — se llama con el payload validado
 * - onCancel: () => void — callback para cancelar
 * - submitLabel: string — texto del botón (default: "Registrar Gasto")
 * - submittingLabel: string — texto mientras guarda (default: "Guardando...")
 */
export default function GastoForm({
  initialData = null,
  onSubmit,
  onCancel,
  submitLabel = "Registrar Gasto",
  submittingLabel = "Guardando...",
}) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [mostrarFactura, setMostrarFactura] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [mostrarNuevaCategoria, setMostrarNuevaCategoria] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState({ nombre: "", parent: "" });
  const [creandoCategoria, setCreandoCategoria] = useState(false);
  const [sugerenciasConcepto, setSugerenciasConcepto] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [consultandoRuc, setConsultandoRuc] = useState(false);
  const conceptoRef = useRef(null);
  const buscarConceptosTimeout = useRef(null);

  const isEditing = !!initialData;

  const [form, setForm] = useState({
    categoria: "",
    concepto: "",
    monto_original: "",
    moneda_original: "PYG",
    fecha_gasto: new Date().toISOString().split("T")[0],
    fecha_pago: "",
    metodo_pago: "",
    observaciones: "",
  });

  const [factura, setFactura] = useState({
    ruc_emisor: "",
    razon_social_emisor: "",
    timbrado: "",
    numero_factura: "",
    fecha_emision: "",
  });

  // Inicializar con datos existentes
  useEffect(() => {
    if (initialData) {
      setForm({
        categoria: initialData.categoria != null ? String(initialData.categoria) : "",
        concepto: initialData.concepto ?? "",
        monto_original: initialData.monto_original != null ? String(initialData.monto_original) : "",
        moneda_original: initialData.moneda_original ?? "PYG",
        fecha_gasto: initialData.fecha_gasto ?? "",
        fecha_pago: initialData.fecha_pago ?? "",
        metodo_pago: initialData.metodo_pago ?? "",
        observaciones: initialData.observaciones ?? "",
      });
      if (initialData.factura) {
        setFactura({
          ruc_emisor: initialData.factura.ruc_emisor ?? "",
          razon_social_emisor: initialData.factura.razon_social_emisor ?? "",
          timbrado: initialData.factura.timbrado ?? "",
          numero_factura: initialData.factura.numero_factura ?? "",
          fecha_emision: initialData.factura.fecha_emision ?? "",
        });
        setMostrarFactura(true);
      }
    }
  }, [initialData]);

  // Cargar categorías
  const {
    data: categoriasData,
    loading: cargandoCategorias,
    execute: recargarCategorias,
  } = useApi(getCategoriasGasto, { auto: true, initialData: null });
  const categorias = categoriasData?.results || categoriasData || [];

  // Prevenir navegación accidental
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  // ─── Handlers ─────────────────────────────────────────────────

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));

    if (field === "concepto" && value.length >= 2) {
      buscarConceptos(value);
    } else if (field === "concepto") {
      setSugerenciasConcepto([]);
      setMostrarSugerencias(false);
    }
  };

  const buscarConceptos = (q) => {
    clearTimeout(buscarConceptosTimeout.current);
    buscarConceptosTimeout.current = setTimeout(async () => {
      try {
        const data = await getConceptosFrecuentes(q);
        const conceptos = data?.conceptos || [];
        setSugerenciasConcepto(conceptos);
        setMostrarSugerencias(conceptos.length > 0);
      } catch {
        setSugerenciasConcepto([]);
      }
    }, 300);
  };

  const seleccionarConcepto = (concepto) => {
    setForm((prev) => ({ ...prev, concepto }));
    setDirty(true);
    setSugerenciasConcepto([]);
    setMostrarSugerencias(false);
  };

  const handleFacturaChange = (field, value) => {
    setFactura((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const handleBuscarRuc = async () => {
    const ruc = factura.ruc_emisor.trim();
    if (ruc.length < 3) return;
    setConsultandoRuc(true);
    try {
      const data = await consultarRuc(ruc);
      if (data?.razon_social) {
        setFactura((prev) => ({ ...prev, razon_social_emisor: data.razon_social }));
        setDirty(true);
      }
    } catch {
      // No es crítico
    } finally {
      setConsultandoRuc(false);
    }
  };

  const handleCrearCategoria = async () => {
    if (!nuevaCategoria.nombre.trim()) return;
    setCreandoCategoria(true);
    try {
      const data = {
        nombre: nuevaCategoria.nombre.trim(),
        parent: nuevaCategoria.parent || null,
      };
      const creada = await createCategoriaGasto(data);
      showToast(`Categoría "${creada.nombre}" creada.`, "success");
      await recargarCategorias();
      handleChange("categoria", String(creada.id));
      setNuevaCategoria({ nombre: "", parent: "" });
      setMostrarNuevaCategoria(false);
    } catch (err) {
      showToast(err?.message || "Error al crear categoría.", "error");
    } finally {
      setCreandoCategoria(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setErrors({});

    // Validación local
    const newErrors = {};
    if (!form.categoria) newErrors.categoria = "Seleccione una categoría.";
    if (!form.concepto.trim()) newErrors.concepto = "El concepto es requerido.";
    if (!form.monto_original || Number(form.monto_original) <= 0)
      newErrors.monto_original = "El monto debe ser mayor a cero.";
    if (!form.fecha_gasto) newErrors.fecha_gasto = "La fecha es requerida.";

    const hoy = new Date().toISOString().split("T")[0];
    if (form.fecha_gasto > hoy)
      newErrors.fecha_gasto = "La fecha del gasto no puede ser futura.";
    if (form.fecha_pago) {
      if (form.fecha_pago > hoy)
        newErrors.fecha_pago = "La fecha de pago no puede ser futura.";
      else if (form.fecha_gasto && form.fecha_pago < form.fecha_gasto)
        newErrors.fecha_pago = "La fecha de pago no puede ser anterior al gasto.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSaving(false);
      return;
    }

    const payload = {
      categoria: Number(form.categoria),
      concepto: form.concepto.trim(),
      monto_original: form.monto_original,
      moneda_original: form.moneda_original,
      fecha_gasto: form.fecha_gasto,
      fecha_pago: form.fecha_pago || null,
      metodo_pago: form.metodo_pago || null,
      observaciones: form.observaciones.trim(),
    };

    // Factura
    if (mostrarFactura) {
      const facturaLimpia = {
        ruc_emisor: factura.ruc_emisor.trim(),
        razon_social_emisor: factura.razon_social_emisor.trim(),
        timbrado: factura.timbrado.trim(),
        numero_factura: factura.numero_factura.trim(),
        fecha_emision: factura.fecha_emision || null,
      };
      const tieneFactura = Object.values(facturaLimpia).some((v) => v);
      if (tieneFactura) {
        payload.factura = facturaLimpia;
      } else {
        payload.factura = null;
      }
    } else {
      payload.factura = null;
    }

    try {
      await onSubmit(payload);
      setDirty(false);
    } catch (err) {
      if (err?.data) {
        const normalized = {};
        for (const [key, val] of Object.entries(err.data)) {
          normalized[key] = Array.isArray(val) ? val[0] : val;
        }
        setErrors(normalized);
      } else {
        showToast(err?.message || "Error al guardar.", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Datos del Gasto */}
      <Section title="Datos del Gasto">
        <div className="p-6 space-y-4">
          <Field label="Categoría *" error={errors.categoria}>
            <div className="flex gap-2">
              <select
                value={form.categoria}
                onChange={(e) => handleChange("categoria", e.target.value)}
                disabled={cargandoCategorias}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">
                  {cargandoCategorias ? "Cargando categorías..." : "Seleccionar categoría..."}
                </option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.parent_nombre
                      ? `${cat.parent_nombre} > ${cat.nombre}`
                      : cat.nombre}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setMostrarNuevaCategoria(!mostrarNuevaCategoria)}
                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 transition-colors"
                title="Crear nueva categoría"
              >
                <Plus size={16} />
              </button>
            </div>

            {mostrarNuevaCategoria && (
              <div className="mt-2 p-3 bg-purple-50 border border-purple-100 rounded-lg space-y-2">
                <p className="text-xs font-medium text-purple-700">Nueva categoría</p>
                <div className="flex gap-2">
                  <Input
                    value={nuevaCategoria.nombre}
                    onChange={(e) => setNuevaCategoria((prev) => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Nombre de la categoría"
                    className="flex-1"
                    maxLength={100}
                  />
                  <select
                    value={nuevaCategoria.parent}
                    onChange={(e) => setNuevaCategoria((prev) => ({ ...prev, parent: e.target.value }))}
                    className="w-40 rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Categoría principal</option>
                    {categorias
                      .filter((c) => !c.parent)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          Dentro de: {cat.nombre}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setMostrarNuevaCategoria(false)}
                    className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleCrearCategoria}
                    disabled={!nuevaCategoria.nombre.trim() || creandoCategoria}
                    className="text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {creandoCategoria ? "Creando..." : "Crear"}
                  </button>
                </div>
              </div>
            )}
          </Field>

          <Field label="Concepto *" error={errors.concepto}>
            <div className="relative" ref={conceptoRef}>
              <Input
                value={form.concepto}
                onChange={(e) => handleChange("concepto", e.target.value)}
                onFocus={() => {
                  if (sugerenciasConcepto.length > 0) setMostrarSugerencias(true);
                }}
                onBlur={() => {
                  setTimeout(() => setMostrarSugerencias(false), 200);
                }}
                placeholder="Ej: Pago de alquiler mes de Junio"
                maxLength={300}
                autoComplete="off"
              />
              {mostrarSugerencias && sugerenciasConcepto.length > 0 && (
                <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    Conceptos anteriores
                  </p>
                  {sugerenciasConcepto.map((concepto, i) => (
                    <button
                      key={i}
                      type="button"
                      onMouseDown={() => seleccionarConcepto(concepto)}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                    >
                      {concepto}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Monto *" error={errors.monto_original}>
              <MontoInput
                value={form.monto_original}
                onChange={(val) => handleChange("monto_original", val)}
                moneda={form.moneda_original}
              />
            </Field>

            <Field label="Moneda">
              <select
                value={form.moneda_original}
                onChange={(e) => handleChange("moneda_original", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="PYG">Guaraní (PYG)</option>
                <option value="USD">Dólar (USD)</option>
                <option value="BRL">Real (BRL)</option>
              </select>
            </Field>

            <Field label="Fecha del Gasto *" error={errors.fecha_gasto}>
              <Input
                type="date"
                value={form.fecha_gasto}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => handleChange("fecha_gasto", e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Método de Pago">
              <select
                value={form.metodo_pago}
                onChange={(e) => handleChange("metodo_pago", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Sin especificar</option>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia Bancaria</option>
                <option value="cheque">Cheque</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="otro">Otro</option>
              </select>
            </Field>

            <Field label="Fecha de Pago" error={errors.fecha_pago}>
              <Input
                type="date"
                value={form.fecha_pago}
                max={new Date().toISOString().split("T")[0]}
                min={form.fecha_gasto || undefined}
                onChange={(e) => handleChange("fecha_pago", e.target.value)}
              />
              <p className="text-xs text-slate-400 mt-1">
                Si se completa, el gasto se marca como pagado.
              </p>
            </Field>
          </div>

          <Field label="Observaciones">
            <textarea
              value={form.observaciones}
              onChange={(e) => handleChange("observaciones", e.target.value)}
              rows={3}
              maxLength={1000}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              placeholder="Notas adicionales..."
            />
          </Field>
        </div>
      </Section>

      {/* Datos de Factura (colapsable) */}
      <Section
        title={
          <button
            type="button"
            onClick={() => setMostrarFactura(!mostrarFactura)}
            className="flex items-center gap-2 w-full text-left"
          >
            <Receipt className="w-4 h-4 text-purple-500" />
            <span>Datos de Factura / Comprobante</span>
            {mostrarFactura ? (
              <ChevronUp className="w-4 h-4 ml-auto text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-auto text-slate-400" />
            )}
          </button>
        }
      >
        {mostrarFactura && (
          <div className="p-6 space-y-4">
            <p className="text-xs text-slate-500 mb-2">
              Datos fiscales del comprobante recibido (opcional).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="RUC Emisor">
                <div className="flex gap-2">
                  <Input
                    value={factura.ruc_emisor}
                    onChange={(e) => handleFacturaChange("ruc_emisor", e.target.value)}
                    onBlur={handleBuscarRuc}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleBuscarRuc();
                      }
                    }}
                    placeholder="80012345-6"
                  />
                  <button
                    type="button"
                    onClick={handleBuscarRuc}
                    disabled={consultandoRuc || factura.ruc_emisor.trim().length < 3}
                    className="shrink-0 px-3 py-2 text-xs font-medium text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Buscar razón social por RUC"
                  >
                    {consultandoRuc ? "..." : "Buscar"}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Ingresá el RUC y se completará la razón social automáticamente.
                </p>
              </Field>

              <Field label="Razón Social Emisor">
                <Input
                  value={factura.razon_social_emisor}
                  onChange={(e) => handleFacturaChange("razon_social_emisor", e.target.value)}
                  placeholder="Nombre de la empresa emisora"
                  disabled={consultandoRuc}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Timbrado">
                <Input
                  value={factura.timbrado}
                  onChange={(e) => handleFacturaChange("timbrado", e.target.value)}
                  placeholder="12345678"
                />
              </Field>

              <Field label="Nro. Factura">
                <Input
                  value={factura.numero_factura}
                  onChange={(e) => handleFacturaChange("numero_factura", e.target.value)}
                  placeholder="001-001-0001234"
                />
              </Field>

              <Field label="Fecha Emisión">
                <Input
                  type="date"
                  value={factura.fecha_emision}
                  onChange={(e) => handleFacturaChange("fecha_emision", e.target.value)}
                />
              </Field>
            </div>
          </div>
        )}
      </Section>

      {/* Botones */}
      <div className="flex justify-end gap-3">
        <Button variant="ghost" type="button" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          icon={isEditing ? Edit2 : Save}
          disabled={saving}
          className="shadow-lg bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
        >
          {saving ? submittingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
