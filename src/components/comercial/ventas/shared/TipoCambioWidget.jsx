"use client";
import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { getTipoCambioVigente } from "@/services/apis/ventas";
import { cn } from "@/lib/utils";

const PAR_LABELS = {
  "USD/PYG": { from: "USD", to: "PYG", symbol: "₲" },
  "USD/BRL": { from: "USD", to: "BRL", symbol: "R$" },
  "BRL/PYG": { from: "BRL", to: "PYG", symbol: "₲" },
};

/**
 * Widget que muestra el tipo de cambio vigente para un par de monedas.
 * Se refresca automáticamente cuando cambia la moneda seleccionada.
 *
 * @param {string} moneda - Moneda de negociación seleccionada (USD, PYG, BRL)
 * @param {Function} onTipoCambio - Callback con el TC vigente {par, valor, fecha_vigencia}
 * @param {string} className - Clases CSS adicionales
 */
export default function TipoCambioWidget({ moneda, onTipoCambio, className }) {
  const {
    data: tipoCambio,
    loading,
    error,
    execute: fetchTC,
  } = useApi(getTipoCambioVigente);

  // Determinar qué par consultar según la moneda de negociación
  const par = moneda === "PYG" ? "USD/PYG" : moneda === "BRL" ? "USD/BRL" : null;

  useEffect(() => {
    if (par) {
      fetchTC(par).then((tc) => {
        if (onTipoCambio) onTipoCambio(tc);
      }).catch(() => {
        if (onTipoCambio) onTipoCambio(null);
      });
    } else {
      // USD no necesita conversión
      if (onTipoCambio) onTipoCambio(null);
    }
  }, [par]);

  // Si la moneda es USD, no se necesita TC
  if (!par) return null;

  const parInfo = PAR_LABELS[par];

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs",
        error
          ? "bg-red-50 border-red-200 text-red-700"
          : "bg-emerald-50 border-emerald-200 text-emerald-700",
        className
      )}
    >
      <RefreshCw
        size={14}
        className={cn("shrink-0", loading && "animate-spin")}
      />
      {loading ? (
        <span className="font-medium">Cargando TC...</span>
      ) : error ? (
        <span className="font-medium">TC no disponible para {par}</span>
      ) : tipoCambio ? (
        <span className="font-medium">
          1 {parInfo.from} = {parInfo.symbol}{" "}
          {Number(tipoCambio.valor).toLocaleString("es-PY")} {parInfo.to}
          <span className="text-emerald-500 ml-1.5">
            (vigente: {new Date(tipoCambio.fecha_vigencia).toLocaleDateString("es-PY")})
          </span>
        </span>
      ) : null}
    </div>
  );
}
