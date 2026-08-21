"use client";
import { Text, MontoInput } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Trash2, Zap } from "lucide-react";
import { METODO_PAGO_OPTIONS, formatMonto, getMonedaSymbol } from "./utils";

/**
 * Fila individual de pago: método + monto + referencia/cheque/tarjeta.
 */
export default function PagoItem({
  pago,
  index,
  moneda,
  faltante,
  detalle,
  terminales,
  onMetodoChange,
  onMontoChange,
  onReferenciaChange,
  onFieldChange,
  onRemove,
  onAutoCompletar,
}) {
  const montoNum = Number(pago.monto) || 0;
  const montoInvalido = pago.monto !== "" && (montoNum <= 0 || isNaN(montoNum));
  const esDiferenteMoneda = pago.moneda !== moneda;
  const sinTasa = detalle?.sinTasa;

  return (
    <div
      className={cn(
        "p-4 rounded-xl border transition-all",
        sinTasa ? "bg-amber-50/50 border-amber-200" :
        montoInvalido ? "bg-red-50/50 border-red-200" :
        "bg-slate-50 border-slate-100"
      )}
    >
      <div className="flex items-end gap-3">
        {/* Método */}
        <div className="flex-1 min-w-0">
          <Text variant="label" as="label" className="block mb-1.5 !text-[10px] !text-slate-500">
            Método
          </Text>
          <select
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-700"
            value={pago.metodo}
            onChange={(e) => onMetodoChange(index, e.target.value)}
          >
            {METODO_PAGO_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Monto */}
        <div className="flex-1 min-w-0">
          <Text variant="label" as="label" className="block mb-1.5 !text-[10px] !text-slate-500">
            Monto ({getMonedaSymbol(pago.moneda)})
          </Text>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <MontoInput
                value={pago.monto}
                onChange={(val) => onMontoChange(index, val)}
                moneda={pago.moneda || "PYG"}
                error={montoInvalido ? "Monto inválido" : undefined}
              />
            </div>
            {faltante > 0 && (
              <button
                type="button"
                onClick={() => onAutoCompletar(index)}
                className="shrink-0 inline-flex items-center gap-1 px-2 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 transition-colors text-[9px] font-bold"
                title={`Completar faltante en ${pago.moneda}`}
              >
                <Zap size={9} />
                Completar
              </button>
            )}
          </div>
        </div>

        {/* Eliminar */}
        <div className="pb-0.5">
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Equivalencia en moneda del pedido */}
      {esDiferenteMoneda && montoNum > 0 && !sinTasa && (
        <Text variant="mutedXs" className="mt-2 !text-[10px]">
          ≈ {getMonedaSymbol(moneda)} {formatMonto(detalle?.montoConvertido, moneda)} en {moneda}
        </Text>
      )}
      {sinTasa && (
        <Text variant="bodyXs" className="mt-2 !text-[10px] text-amber-600 !font-medium">
          ⚠ Sin tipo de cambio {pago.moneda}→{moneda}. No se puede calcular equivalencia.
        </Text>
      )}

      {/* Sub-formularios según método */}
      {pago.metodo.startsWith("cheque_") ? (
        <ChequeFields pago={pago} index={index} onFieldChange={onFieldChange} />
      ) : (pago.metodo === "tarjeta_credito" || pago.metodo === "tarjeta_debito") ? (
        <TarjetaFields
          pago={pago}
          index={index}
          terminales={terminales}
          onFieldChange={onFieldChange}
          onReferenciaChange={onReferenciaChange}
        />
      ) : (
        <div className="mt-3">
          <input
            type="text"
            value={pago.referencia}
            onChange={(e) => onReferenciaChange(index, e.target.value)}
            placeholder="Referencia (nro. comprobante, etc.)"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-xs text-slate-600"
          />
        </div>
      )}
    </div>
  );
}

// ─── Sub-componente: Datos del cheque ─────────────────────────

function ChequeFields({ pago, index, onFieldChange }) {
  return (
    <div className="mt-3 space-y-3 p-3 bg-white rounded-xl border border-slate-200">
      <Text variant="label" className="!text-[10px] !text-slate-500">
        Datos del cheque
      </Text>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Text variant="label" as="label" className="block mb-1 !text-[10px] !font-semibold !text-slate-500 !tracking-normal !lowercase first-letter:!uppercase">
            Banco emisor *
          </Text>
          <input
            type="text"
            value={pago.cheque_banco_emisor || ""}
            onChange={(e) => onFieldChange(index, "cheque_banco_emisor", e.target.value)}
            placeholder="Ej: Itaú, Continental..."
            className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          />
        </div>
        <div>
          <Text variant="label" as="label" className="block mb-1 !text-[10px] !font-semibold !text-slate-500 !tracking-normal !lowercase first-letter:!uppercase">
            Nro. cheque *
          </Text>
          <input
            type="text"
            value={pago.cheque_numero || ""}
            onChange={(e) => onFieldChange(index, "cheque_numero", e.target.value)}
            placeholder="Nro. impreso"
            className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      <div>
        <Text variant="label" as="label" className="block mb-1 !text-[10px] !font-semibold !text-slate-500 !tracking-normal !lowercase first-letter:!uppercase">
          Librador (firmante)
        </Text>
        <input
          type="text"
          value={pago.cheque_librador || ""}
          onChange={(e) => onFieldChange(index, "cheque_librador", e.target.value)}
          placeholder="Nombre de quien firma el cheque"
          className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Text variant="label" as="label" className="block mb-1 !text-[10px] !font-semibold !text-slate-500 !tracking-normal !lowercase first-letter:!uppercase">
            Fecha emisión *
          </Text>
          <input
            type="date"
            value={pago.cheque_fecha_emision || ""}
            onChange={(e) => onFieldChange(index, "cheque_fecha_emision", e.target.value)}
            className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          />
        </div>
        <div>
          <Text variant="label" as="label" className="block mb-1 !text-[10px] !font-semibold !text-slate-500 !tracking-normal !lowercase first-letter:!uppercase">
            Fecha de pago *
          </Text>
          <input
            type="date"
            value={pago.cheque_fecha_cobro || ""}
            onChange={(e) => onFieldChange(index, "cheque_fecha_cobro", e.target.value)}
            className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      <div>
        <Text variant="label" as="label" className="block mb-1 !text-[10px] !font-semibold !text-slate-500 !tracking-normal !lowercase first-letter:!uppercase">
          Observaciones
        </Text>
        <input
          type="text"
          value={pago.cheque_observaciones || ""}
          onChange={(e) => onFieldChange(index, "cheque_observaciones", e.target.value)}
          placeholder="Notas adicionales"
          className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
        />
      </div>

      {/* Checklist de verificación */}
      <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 space-y-2">
        <Text variant="label" className="!text-[10px] !text-amber-700">
          Verificaciones obligatorias
        </Text>
        {[
          { key: "cheque_es_cruzado", label: "El cheque está cruzado (dos líneas diagonales)" },
          { key: "cheque_montos_correctos", label: "Montos en números y letras coinciden con la operación" },
          { key: "cheque_beneficiario_correcto", label: 'El beneficiario dice "Dentpar" (razón social correcta)' },
          { key: "cheque_no_negociable", label: 'Tiene sello "No a la orden" o "No negociable"' },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-start gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={!!pago[key]}
              onChange={(e) => onFieldChange(index, key, e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-amber-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <span className={cn(
              "text-[11px] leading-tight",
              pago[key] ? "text-emerald-700 font-semibold" : "text-amber-700"
            )}>
              {label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ─── Sub-componente: Datos de tarjeta ─────────────────────────

function TarjetaFields({ pago, index, terminales, onFieldChange, onReferenciaChange }) {
  const montoNum = Number(pago.monto) || 0;

  return (
    <div className="mt-3 space-y-3 p-3 bg-white rounded-xl border border-slate-200">
      <Text variant="label" className="!text-[10px] !text-slate-500">
        Datos de tarjeta
      </Text>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Text variant="label" as="label" className="block mb-1 !text-[10px] !font-semibold !text-slate-500 !tracking-normal !lowercase first-letter:!uppercase">
            Terminal POS *
          </Text>
          <select
            value={pago.terminal_pos_id || ""}
            onChange={(e) => onFieldChange(index, "terminal_pos_id", e.target.value ? Number(e.target.value) : null)}
            className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          >
            <option value="">Seleccionar terminal...</option>
            {terminales.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre} ({t.proveedor})
              </option>
            ))}
          </select>
        </div>
        <div>
          <Text variant="label" as="label" className="block mb-1 !text-[10px] !font-semibold !text-slate-500 !tracking-normal !lowercase first-letter:!uppercase">
            Nro. voucher
          </Text>
          <input
            type="text"
            value={pago.referencia || ""}
            onChange={(e) => onReferenciaChange(index, e.target.value)}
            placeholder="Nro. de voucher"
            className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Comisión calculada */}
      {pago.terminal_pos_id && montoNum > 0 && (() => {
        const terminal = terminales.find((t) => t.id === pago.terminal_pos_id);
        if (!terminal) return null;
        const tasa = pago.metodo === "tarjeta_credito"
          ? Number(terminal.comision_credito)
          : Number(terminal.comision_debito);
        const comisionNeta = Math.round(montoNum * tasa / 100);
        const iva = Math.round(comisionNeta * Number(terminal.iva_sobre_comision) / 100);
        const comisionTotal = comisionNeta + iva;
        const neto = montoNum - comisionTotal;
        const dias = pago.metodo === "tarjeta_credito"
          ? terminal.dias_acreditacion_credito
          : terminal.dias_acreditacion_debito;
        return (
          <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100 space-y-1">
            <div className="flex justify-between text-[10px]">
              <Text variant="mutedXs" as="span" className="!text-[10px] !text-blue-600">Comisión ({tasa}%)</Text>
              <Text variant="bodyXsBold" as="span" className="!text-[10px] !text-blue-700">- ₲ {comisionNeta.toLocaleString("es-PY")}</Text>
            </div>
            <div className="flex justify-between text-[10px]">
              <Text variant="mutedXs" as="span" className="!text-[10px] !text-blue-600">IVA ({terminal.iva_sobre_comision}%)</Text>
              <Text variant="bodyXsBold" as="span" className="!text-[10px] !text-blue-700">- ₲ {iva.toLocaleString("es-PY")}</Text>
            </div>
            <div className="flex justify-between text-[10px] border-t border-blue-200 pt-1">
              <Text variant="bodyXsBold" as="span" className="!text-[10px] !text-blue-800">Neto a recibir</Text>
              <Text variant="bodyXsBold" as="span" className="!text-[10px] !font-black !text-blue-800">₲ {neto.toLocaleString("es-PY")}</Text>
            </div>
            <Text variant="mutedXs" className="!text-[9px] !text-blue-500">
              Acreditación: ~{dias} día{dias > 1 ? "s" : ""} hábil{dias > 1 ? "es" : ""} en {terminal.cuenta_acreditacion_nombre}
            </Text>
          </div>
        );
      })()}
    </div>
  );
}
