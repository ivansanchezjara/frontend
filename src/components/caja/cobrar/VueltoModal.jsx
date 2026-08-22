"use client";
import { useState } from "react";
import { Modal, Button, Text, MontoInput } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Plus, Trash2, CheckCircle } from "lucide-react";
import { formatMonto, getMonedaSymbol, convertir } from "./utils";

const MONEDAS = [
  { key: "USD", symbol: "$" },
  { key: "PYG", symbol: "₲" },
  { key: "BRL", symbol: "R$" },
];

/**
 * Modal para definir en qué monedas se entrega el vuelto.
 * Aparece después de confirmar el cobro cuando hay vuelto > 0.
 */
export default function VueltoModal({ vueltoTeorico, moneda, tasas, onConfirmar, onClose, loading }) {
  const [vueltos, setVueltos] = useState([{ moneda: moneda === "USD" ? "USD" : "PYG", monto: "" }]);

  // Total vuelto convertido a moneda del pedido
  const totalVueltoEnMoneda = vueltos.reduce((sum, v) => {
    const monto = Number(v.monto) || 0;
    if (monto <= 0) return sum;
    if (v.moneda === moneda) return sum + monto;
    const conv = convertir(monto, v.moneda, moneda, tasas);
    return sum + (conv || 0);
  }, 0);

  const ajuste = vueltoTeorico - totalVueltoEnMoneda;

  const handleAdd = () => setVueltos([...vueltos, { moneda: "PYG", monto: "" }]);
  const handleRemove = (idx) => setVueltos(vueltos.filter((_, i) => i !== idx));
  const handleMoneda = (idx, m) => {
    const n = [...vueltos];
    n[idx] = { ...n[idx], moneda: m };
    setVueltos(n);
  };
  const handleMonto = (idx, val) => {
    const n = [...vueltos];
    n[idx] = { ...n[idx], monto: val };
    setVueltos(n);
  };

  const handleConfirmar = () => {
    const data = vueltos
      .filter((v) => Number(v.monto) > 0)
      .map((v) => ({ moneda: v.moneda, monto: Number(v.monto) }));
    onConfirmar(data);
  };

  // Hay al menos un vuelto con monto > 0
  const tieneAlgunVuelto = vueltos.some((v) => Number(v.monto) > 0);

  return (
    <Modal open onClose={onClose} title="Vuelto a entregar" size="sm">
      <div className="p-6 space-y-5">

        {/* Info del vuelto teórico */}
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
          <Text variant="mutedXs" className="!text-blue-500 !text-[10px] !font-bold !uppercase mb-1">
            Vuelto calculado
          </Text>
          <div className="space-y-0.5">
            {MONEDAS.map(({ key, symbol }) => {
              const valor = key === moneda ? vueltoTeorico : convertir(vueltoTeorico, moneda, key, tasas);
              const esPrincipal = key === moneda;
              return (
                <div key={key} className="flex items-baseline gap-2">
                  <Text variant="mutedXs" className="!text-[9px] w-7 !text-blue-400">{key}</Text>
                  <Text variant={esPrincipal ? "bodySmBold" : "bodyXs"} className={cn(
                    esPrincipal ? "!font-black !text-blue-800" : "!text-blue-600"
                  )}>
                    {valor != null ? `${symbol} ${formatMonto(valor, key)}` : "—"}
                  </Text>
                </div>
              );
            })}
          </div>
        </div>

        {/* Definir vuelto real */}
        <div className="space-y-3">
          <Text variant="label" className="!text-sm !text-slate-700">
            ¿En qué monedas vas a dar el vuelto?
          </Text>

          <div className="space-y-2">
            {vueltos.map((v, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <select
                  value={v.moneda}
                  onChange={(e) => handleMoneda(idx, e.target.value)}
                  className="px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none cursor-pointer w-20"
                >
                  {MONEDAS.map(({ key }) => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                </select>
                <div className="flex-1">
                  <MontoInput
                    value={v.monto}
                    onChange={(val) => handleMonto(idx, val)}
                    moneda={v.moneda}
                  />
                </div>
                {vueltos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={handleAdd} icon={Plus}>
            Otra moneda
          </Button>
        </div>

        {/* Indicador de ajuste */}
        {tieneAlgunVuelto && Math.abs(ajuste) > (moneda === "PYG" ? 100 : 0.01) && (
          <div className={cn(
            "p-3 rounded-xl border",
            ajuste > 0 ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"
          )}>
            <Text variant="bodyXs" className={cn(
              "!font-bold",
              ajuste > 0 ? "!text-amber-700" : "!text-emerald-700"
            )}>
              {ajuste > 0
                ? `Ajuste a favor empresa: ${getMonedaSymbol(moneda)} ${formatMonto(ajuste, moneda)}`
                : `Ajuste a favor cliente: ${getMonedaSymbol(moneda)} ${formatMonto(Math.abs(ajuste), moneda)}`
              }
            </Text>
            <Text variant="mutedXs" className="!text-[10px] mt-0.5">
              {ajuste > 0
                ? "Se entrega menos vuelto del calculado (redondeo)."
                : "Se entrega más vuelto del calculado."
              }
            </Text>
          </div>
        )}
      </div>

      {/* Footer del modal */}
      <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          Volver
        </Button>
        <Button
          variant="success"
          onClick={handleConfirmar}
          disabled={!tieneAlgunVuelto || loading}
          icon={CheckCircle}
        >
          {loading ? "Procesando..." : "Confirmar Vuelto"}
        </Button>
      </div>
    </Modal>
  );
}
