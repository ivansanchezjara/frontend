"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button, Input, Field, MontoInput } from "@/components/ui";
import { useToast } from "@/components/ui";
import { transferirEntreCuentas } from "@/services/apis/tesoreria";
import { formatMonto } from "./helpers";

export default function TransferenciaForm({ cuentas, onClose, onSuccess }) {
  const { showToast } = useToast();
  const [transForm, setTransForm] = useState({
    cuenta_origen: "", cuenta_destino: "", monto_original: "",
    monto_destino: "", concepto: "", fecha: new Date().toISOString().split("T")[0],
    tipo_cambio_usado: "",
  });

  const cuentaOrigen = cuentas.find((c) => String(c.id) === transForm.cuenta_origen);
  const cuentaDestino = cuentas.find((c) => String(c.id) === transForm.cuenta_destino);
  const monedaOrigen = cuentaOrigen?.moneda_principal || "PYG";
  const monedaDestino = cuentaDestino?.moneda_principal || "PYG";
  const esCambioDivisas = cuentaOrigen && cuentaDestino && monedaOrigen !== monedaDestino;

  // Calcular monto a retirar (monto destino × tipo de cambio)
  const montoRetirar = (() => {
    if (!esCambioDivisas) return null;
    const montoDestino = Number(transForm.monto_destino);
    const cambio = Number(String(transForm.tipo_cambio_usado).replace(",", "."));
    if (!montoDestino || !cambio || isNaN(montoDestino) || isNaN(cambio)) return null;
    return montoDestino * cambio;
  })();

  const handleTransferir = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        cuenta_origen: Number(transForm.cuenta_origen),
        cuenta_destino: Number(transForm.cuenta_destino),
        concepto: transForm.concepto,
        fecha: transForm.fecha,
        moneda_original: monedaOrigen,
      };
      if (esCambioDivisas) {
        payload.monto_original = montoRetirar;
        payload.tipo_cambio_usado = transForm.tipo_cambio_usado;
      } else {
        payload.monto_original = transForm.monto_original;
      }
      await transferirEntreCuentas(payload);
      showToast("Transferencia registrada.", "success");
      onSuccess();
    } catch (err) {
      showToast(err?.data?.detail || err?.message || "Error.", "error");
    }
  };

  return (
    <div className="bg-white border border-purple-200 rounded-2xl p-6">
      <h3 className="text-sm font-bold text-slate-800 mb-4">Transferencia entre Cuentas</h3>
      <form onSubmit={handleTransferir} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Cuenta Origen (retira) *">
          <select value={transForm.cuenta_origen} onChange={(e) => setTransForm({ ...transForm, cuenta_origen: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option value="">Seleccionar...</option>
            {cuentas.map((c) => <option key={c.id} value={c.id}>{c.nombre} ({c.moneda_principal})</option>)}
          </select>
        </Field>
        <Field label="Cuenta Destino (deposita) *">
          <select value={transForm.cuenta_destino} onChange={(e) => setTransForm({ ...transForm, cuenta_destino: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option value="">Seleccionar...</option>
            {cuentas.filter((c) => String(c.id) !== transForm.cuenta_origen).map((c) => <option key={c.id} value={c.id}>{c.nombre} ({c.moneda_principal})</option>)}
          </select>
        </Field>

        {/* Misma moneda: solo monto */}
        {!esCambioDivisas && (
          <Field label={`Monto (${monedaOrigen}) *`}>
            <MontoInput
              value={transForm.monto_original}
              onChange={(val) => setTransForm({ ...transForm, monto_original: val })}
              moneda={monedaOrigen}
            />
          </Field>
        )}

        {/* Cambio de divisas */}
        {esCambioDivisas && (
          <>
            <Field label={`Monto a depositar (${monedaDestino}) *`}>
              <MontoInput
                value={transForm.monto_destino}
                onChange={(val) => setTransForm({ ...transForm, monto_destino: val })}
                moneda={monedaDestino}
              />
            </Field>
            <Field label={`Tipo de cambio (1 ${monedaDestino} = ? ${monedaOrigen}) *`}>
              <Input
                type="text"
                inputMode="decimal"
                value={transForm.tipo_cambio_usado}
                onChange={(e) => setTransForm({ ...transForm, tipo_cambio_usado: e.target.value })}
                placeholder={monedaDestino === "USD" && monedaOrigen === "PYG" ? "Ej: 7.450" : "Ej: 0,000134"}
              />
            </Field>
            <div className="col-span-full">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Monto a retirar de {cuentaOrigen?.nombre} ({monedaOrigen})</p>
                  <p className="text-lg font-black text-red-600 mt-1">
                    {montoRetirar != null ? formatMonto(montoRetirar, monedaOrigen) : "—"}
                  </p>
                </div>
                <ArrowRight size={20} className="text-slate-400" />
              </div>
            </div>
          </>
        )}

        <Field label="Concepto *">
          <Input value={transForm.concepto} onChange={(e) => setTransForm({ ...transForm, concepto: e.target.value })} placeholder="Cambio de divisas en banco" />
        </Field>
        <Field label="Fecha">
          <Input type="date" value={transForm.fecha} onChange={(e) => setTransForm({ ...transForm, fecha: e.target.value })} />
        </Field>

        <div className="col-span-full flex gap-2 justify-end">
          <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" type="submit" icon={ArrowRight} className="bg-purple-600 hover:bg-purple-700">Transferir</Button>
        </div>
      </form>
    </div>
  );
}
