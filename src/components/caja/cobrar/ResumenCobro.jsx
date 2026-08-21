"use client";
import { Text } from "@/components/ui";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";
import MonedaGrid from "./MonedaGrid";
import { formatMonto, getMonedaSymbol, convertir } from "./utils";

/**
 * Resumen del cobro: total en 3 monedas, pagado en 3 monedas, desglose, saldo pendiente, vuelto.
 */
export default function ResumenCobro({
  totalPedido,
  totalUsd,
  totalesMultimoneda,
  moneda,
  tasas,
  totalPagadoEnMoneda,
  faltante,
  vuelto,
  pagosCompletos,
  pagos,
}) {
  // Calcular pagado en USD para el resumen final
  const pagadoUsd = moneda === "USD"
    ? totalPagadoEnMoneda
    : convertir(totalPagadoEnMoneda, moneda, "USD", tasas);

  // Desglose de pagos con conversión a USD
  const desglosePagos = (pagos || [])
    .filter((p) => Number(p.monto) > 0)
    .map((p) => {
      const monto = Number(p.monto);
      const montoUsd = p.moneda === "USD"
        ? monto
        : convertir(monto, p.moneda, "USD", tasas);
      return { ...p, montoNum: monto, montoUsd };
    });

  const totalDesglosadoUsd = desglosePagos.reduce((sum, p) => sum + (p.montoUsd || 0), 0);

  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
      {/* Total a cobrar — Grid de 3 monedas */}
      <div>
        <Text variant="label" className="mb-2">
          Total a cobrar
        </Text>
        <MonedaGrid
          monto={totalPedido}
          moneda={moneda}
          totalUsd={totalUsd}
          totalesMultimoneda={totalesMultimoneda}
          tasas={tasas}
          color="default"
        />
      </div>

      {/* Pagado — Grid de 3 monedas */}
      <div className={cn(
        "rounded-lg border p-3",
        pagosCompletos ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"
      )}>
        <Text variant="label" className={cn("mb-2", pagosCompletos ? "!text-emerald-500" : "!text-amber-500")}>
          {pagosCompletos ? "✓ Pagado" : "Pagado parcial"}
        </Text>
        <MonedaGrid
          monto={totalPagadoEnMoneda}
          moneda={moneda}
          totalUsd={0}
          totalesMultimoneda={null}
          tasas={tasas}
          color={pagosCompletos ? "green" : "amber"}
          useConvertir
        />
      </div>

      {/* Saldo pendiente */}
      {faltante > 0 && (
        <div className="bg-red-50 rounded-lg border border-red-200 p-3">
          <Text variant="label" className="mb-2 !text-red-400 flex items-center gap-1.5">
            <AlertCircle size={11} />
            Saldo pendiente
          </Text>
          <MonedaGrid
            monto={faltante}
            moneda={moneda}
            totalUsd={0}
            totalesMultimoneda={null}
            tasas={tasas}
            color="red"
            useConvertir
          />
        </div>
      )}

      {/* Vuelto */}
      {vuelto > 0 && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-3">
          <Text variant="label" className="mb-2 !text-blue-400">
            Vuelto a entregar
          </Text>
          <MonedaGrid
            monto={vuelto}
            moneda={moneda}
            totalUsd={0}
            totalesMultimoneda={null}
            tasas={tasas}
            color="blue"
            useConvertir
          />
        </div>
      )}

      {/* Desglose de pagos + total USD */}
      {pagosCompletos && desglosePagos.length > 0 && (
        <div className="pt-2 border-t border-slate-200 space-y-2">
          <Text variant="label">Desglose de pagos</Text>

          <div className="space-y-1.5">
            {desglosePagos.map((p, i) => (
              <div key={i} className="flex justify-between items-center">
                <Text variant="bodyXs" className="!text-slate-600">
                  {getMetodoLabel(p.metodo)}
                </Text>
                <div className="flex items-center gap-3">
                  <Text variant="bodyXsBold" className="!text-slate-700">
                    {getMonedaSymbol(p.moneda)} {formatMonto(p.montoNum, p.moneda)}
                  </Text>
                  {p.moneda !== "USD" && p.montoUsd != null && (
                    <Text variant="mutedXs" className="!text-slate-400">
                      → $ {formatMonto(p.montoUsd, "USD")}
                    </Text>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Total consolidado en USD */}
          <div className="flex justify-between items-center pt-2 border-t border-slate-200">
            <Text variant="bodySmBold" className="!text-slate-700">Total en USD:</Text>
            <Text variant="bodyBold" className="!text-lg !font-black !text-slate-900">
              $ {formatMonto(totalDesglosadoUsd, "USD")}
            </Text>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helper interno ───────────────────────────────────────────

const METODO_LABELS = {
  efectivo_pyg: "Efectivo PYG",
  efectivo_usd: "Efectivo USD",
  efectivo_brl: "Efectivo BRL",
  cheque_pyg: "Cheque PYG",
  cheque_usd: "Cheque USD",
  transferencia_pyg: "Transferencia PYG",
  tarjeta_credito: "Tarjeta Crédito",
  tarjeta_debito: "Tarjeta Débito",
  pix: "PIX",
  cuotas: "Pago a Cuotas",
};

function getMetodoLabel(metodo) {
  return METODO_LABELS[metodo] || metodo;
}
