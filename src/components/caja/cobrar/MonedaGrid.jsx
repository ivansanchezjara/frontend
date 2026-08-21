"use client";
import { Text } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatMonto, convertir, getMonedaSymbol } from "./utils";

/**
 * Grid de 3 columnas mostrando un monto en PYG, USD y BRL.
 * Resalta la moneda principal (moneda de negociación) del pedido.
 *
 * @param {number} monto - Monto en la moneda de negociación
 * @param {string} moneda - Moneda de negociación del pedido
 * @param {number} totalUsd - Total en USD (precalculado)
 * @param {object} totalesMultimoneda - { PYG, USD, BRL } precalculados
 * @param {object} tasas - Tasas de cambio vigentes
 * @param {"default"|"green"|"amber"|"red"|"blue"} color - Esquema de color del grid
 * @param {boolean} useConvertir - Si true, convierte monto con convertir() en vez de usar totalesMultimoneda
 */
export default function MonedaGrid({
  monto,
  moneda,
  totalUsd,
  totalesMultimoneda,
  tasas,
  color = "default",
  useConvertir = false,
}) {
  const colorSchemes = {
    default: {
      active: "bg-white border-2 border-slate-300 shadow-sm",
      inactive: "bg-white border border-slate-200",
      label: "text-slate-400",
      valueActive: "text-slate-900",
      valueInactive: "text-slate-600",
    },
    green: {
      active: "bg-white/80 border-2 border-emerald-300",
      inactive: "bg-white/70 border border-emerald-100",
      label: "text-emerald-400",
      valueActive: "text-emerald-800",
      valueInactive: "text-emerald-700",
    },
    amber: {
      active: "bg-white/80 border-2 border-amber-300",
      inactive: "bg-white/70 border border-amber-100",
      label: "text-amber-400",
      valueActive: "text-amber-800",
      valueInactive: "text-amber-700",
    },
    red: {
      active: "bg-white/80 border-2 border-red-300",
      inactive: "bg-white/70 border border-red-100",
      label: "text-red-300",
      valueActive: "text-red-800",
      valueInactive: "text-red-700",
    },
    blue: {
      active: "bg-white/80 border-2 border-blue-300",
      inactive: "bg-white/70 border border-blue-100",
      label: "text-blue-300",
      valueActive: "text-blue-800",
      valueInactive: "text-blue-700",
    },
  };

  const scheme = colorSchemes[color] || colorSchemes.default;

  function getValor(targetMoneda) {
    if (moneda === targetMoneda) return monto;
    if (useConvertir) {
      return convertir(monto, moneda, targetMoneda, tasas);
    }
    if (targetMoneda === "USD") return totalUsd > 0 ? totalUsd : null;
    return totalesMultimoneda?.[targetMoneda] ?? null;
  }

  const monedas = [
    { key: "PYG", label: "Guaraníes", symbol: "₲" },
    { key: "USD", label: "Dólares", symbol: "$" },
    { key: "BRL", label: "Reales", symbol: "R$" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {monedas.map(({ key, label, symbol }) => {
        const isActive = moneda === key;
        const valor = getValor(key);

        return (
          <div
            key={key}
            className={cn(
              "p-2.5 rounded-lg text-center",
              isActive ? scheme.active : scheme.inactive
            )}
          >
            <Text variant="caption" className={cn("!text-[9px]", scheme.label)}>
              {label}
            </Text>
            <Text
              variant={isActive ? "bodyBold" : "bodySmBold"}
              className={cn(
                "!font-black",
                isActive ? `text-base ${scheme.valueActive}` : `text-sm ${scheme.valueInactive}`
              )}
            >
              {valor != null ? `${symbol} ${formatMonto(valor, key)}` : "—"}
            </Text>
          </div>
        );
      })}
    </div>
  );
}
