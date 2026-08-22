"use client";

import { useState } from "react";
import { Modal, Input, Field, Button, MontoInput, useToast } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { getCategoriasGasto } from "@/services/apis/finanzas";
import { getCuentas } from "@/services/apis/tesoreria";
import { registrarPagoOrden } from "@/services/apis/compras";

function formatUSD(v) {
  if (v == null) return "—";
  return `US$ ${Number(v).toLocaleString("es-PY", { minimumFractionDigits: 2 })}`;
}

/**
 * Modal para registrar un pago directo vinculado a una OC.
 * Crea el gasto + egreso en tesorería + vincula a la OC en un solo paso.
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - ordenId: number
 * - ordenNumero: string
 * - ordenProveedor: string
 * - onSuccess: () => void — se llama tras registrar exitosamente
 */
export default function RegistrarPagoModal({
  open,
  onClose,
  ordenId,
  ordenNumero = "",
  ordenProveedor = "",
  onSuccess,
}) {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    concepto: "",
    monto_original: "",
    moneda_original: "USD",
    fecha_gasto: new Date().toISOString().split("T")[0],
    metodo_pago: "transferencia",
    tipo_costo: "mercaderia",
    concepto_pago: "",
    observaciones: "",
    categoria: "",
    cuenta_origen: "",
  });

  const { data: categoriasData } = useApi(getCategoriasGasto, { auto: true, initialData: null });
  const categorias = categoriasData?.results || categoriasData || [];

  const { data: cuentasData } = useApi(getCuentas, { auto: true, initialData: null });
  const cuentas = (cuentasData?.results || cuentasData || []).filter(
    (c) => c.tipo === "tesoreria" || c.tipo === "banco"
  );

  const resetForm = () => {
    setForm({
      concepto: "", monto_original: "", moneda_original: "USD",
      fecha_gasto: new Date().toISOString().split("T")[0],
      metodo_pago: "transferencia", tipo_costo: "mercaderia",
      concepto_pago: "", observaciones: "", categoria: "", cuenta_origen: "",
    });
  };

  const handleSubmit = async () => {
    if (!form.concepto.trim() || !form.monto_original || !form.categoria) {
      showToast("Completá concepto, monto y categoría", "error");
      return;
    }
    if (!form.cuenta_origen) {
      showToast("Seleccioná la cuenta de donde sale el dinero", "error");
      return;
    }
    setSubmitting(true);
    try {
      await registrarPagoOrden(ordenId, {
        categoria: Number(form.categoria),
        concepto: form.concepto.trim(),
        monto_original: form.monto_original,
        moneda_original: form.moneda_original,
        fecha_gasto: form.fecha_gasto,
        metodo_pago: form.metodo_pago || null,
        tipo_costo: form.tipo_costo,
        concepto_pago: form.concepto_pago.trim() || form.concepto.trim(),
        observaciones: form.observaciones,
        cuenta_origen: Number(form.cuenta_origen),
      });
      showToast("Pago registrado exitosamente", "success");
      resetForm();
      onClose();
      onSuccess?.();
    } catch (e) {
      showToast(e.message || "Error al registrar pago", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} title="Registrar Pago" size="lg" onClose={onClose}>
      <div className="space-y-4 p-4">
        <p className="text-xs text-slate-500">
          Registra un pago para {ordenNumero}. Se descuenta de la cuenta seleccionada.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Tipo de Costo *">
            <select
              value={form.tipo_costo}
              onChange={(e) => setForm((f) => ({ ...f, tipo_costo: e.target.value }))}
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            >
              <option value="mercaderia">Mercadería (FOB)</option>
              <option value="flete">Flete Internacional</option>
              <option value="seguro">Seguro</option>
              <option value="aduana">Aduana / Despacho</option>
              <option value="flete_interno">Flete Interno</option>
              <option value="otro">Otros Costos</option>
            </select>
          </Field>
          <Field label="Categoría de Gasto *">
            <select
              value={form.categoria}
              onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            >
              <option value="">Seleccionar...</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.parent_nombre ? `${cat.parent_nombre} > ${cat.nombre}` : cat.nombre}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Concepto *">
          <Input
            value={form.concepto}
            onChange={(e) => setForm((f) => ({ ...f, concepto: e.target.value }))}
            placeholder={`Ej: Pago FOB ${ordenNumero} - ${ordenProveedor}`}
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Monto *">
            <MontoInput
              value={form.monto_original}
              onChange={(val) => setForm((f) => ({ ...f, monto_original: val }))}
              moneda={form.moneda_original}
            />
          </Field>
          <Field label="Moneda">
            <select
              value={form.moneda_original}
              onChange={(e) => setForm((f) => ({ ...f, moneda_original: e.target.value }))}
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            >
              <option value="USD">USD</option>
              <option value="PYG">PYG</option>
              <option value="BRL">BRL</option>
            </select>
          </Field>
          <Field label="Fecha *">
            <Input
              type="date"
              value={form.fecha_gasto}
              onChange={(e) => setForm((f) => ({ ...f, fecha_gasto: e.target.value }))}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Cuenta Origen *">
            <select
              value={form.cuenta_origen}
              onChange={(e) => setForm((f) => ({ ...f, cuenta_origen: e.target.value }))}
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            >
              <option value="">Seleccionar cuenta...</option>
              {cuentas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({formatUSD(c.saldo_usd)})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Método de Pago">
            <select
              value={form.metodo_pago}
              onChange={(e) => setForm((f) => ({ ...f, metodo_pago: e.target.value }))}
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            >
              <option value="">Sin especificar</option>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia Bancaria</option>
              <option value="cheque">Cheque</option>
              <option value="otro">Otro</option>
            </select>
          </Field>
        </div>

        <Field label="Detalle adicional">
          <Input
            value={form.concepto_pago}
            onChange={(e) => setForm((f) => ({ ...f, concepto_pago: e.target.value }))}
            placeholder="Ej: Anticipo 50%, Saldo final..."
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Registrando..." : "Registrar Pago"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
