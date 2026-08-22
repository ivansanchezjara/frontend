"use client";
import { Text, Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { CheckCircle, AlertCircle } from "lucide-react";
import { formatMonto, getMonedaSymbol, convertir } from "./utils";

const MONEDAS = [
  { key: "USD", symbol: "$" },
  { key: "PYG", symbol: "₲" },
  { key: "BRL", symbol: "R$" },
];

export default function FooterCobro({
  moneda,
  totalesMultimoneda,
  totalPagadoEnMoneda,
  faltante,
  vuelto,
  pagosCompletos,
  cobrando,
  tasas,
  onCancelar,
  onConfirmar,
}) {
  function convertirA(monto, destino) {
    if (destino === moneda) return monto;
    return convertir(monto, moneda, destino, tasas);
  }

  function MonedaColumn({ label, color, icon: Icon, renderValor }) {
    return (
      <div className="min-w-0">
        <Text variant="mutedXs" className={cn(
          "!text-[9px] !font-bold !uppercase !tracking-wider mb-0.5 flex items-center gap-1",
          color === "red" && "!text-red-500",
          color === "green" && "!text-emerald-500",
          color === "blue" && "!text-blue-500",
          !color && "!text-slate-400"
        )}>
          {Icon && <Icon size={9} />}
          {label}
        </Text>
        <div className="space-y-0">
          {MONEDAS.map(({ key, symbol }) => {
            const { valor, esPrincipal } = renderValor(key);
            return (
              <div key={key} className="flex items-baseline gap-1">
                <span className={cn(
                  "text-[8px] w-6 shrink-0",
                  color === "red" ? "text-red-400" : "text-slate-400"
                )}>{key}</span>
                <span className={cn(
                  "text-[11px] font-medium whitespace-nowrap",
                  esPrincipal && "!font-bold",
                  color === "red" && "text-red-600",
                  color === "green" && "text-emerald-600",
                  color === "blue" && "text-blue-600",
                  !color && (esPrincipal ? "text-slate-900" : "text-slate-500"),
                )}>
                  {valor != null ? `${symbol} ${formatMonto(valor, key)}` : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <footer className="shrink-0 border-t border-slate-200 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-3">
        <div className="flex flex-wrap items-start gap-4 lg:gap-6">

          {/* Total */}
          <MonedaColumn
            label="Total"
            renderValor={(key) => ({
              valor: totalesMultimoneda[key],
              esPrincipal: key === moneda,
            })}
          />

          <div className="hidden sm:block w-px h-10 bg-slate-200 self-center" />

          {/* Pagado */}
          <MonedaColumn
            label="Pagado"
            color={pagosCompletos ? "green" : undefined}
            renderValor={(key) => ({
              valor: convertirA(totalPagadoEnMoneda, key),
              esPrincipal: key === moneda,
            })}
          />

          {/* Faltante */}
          {faltante > 0 && (
            <>
              <div className="hidden sm:block w-px h-10 bg-slate-200 self-center" />
              <MonedaColumn
                label="Faltante"
                color="red"
                icon={AlertCircle}
                renderValor={(key) => ({
                  valor: convertirA(faltante, key),
                  esPrincipal: key === moneda,
                })}
              />
            </>
          )}

          {/* Vuelto (solo informativo) */}
          {vuelto > 0 && (
            <>
              <div className="hidden sm:block w-px h-10 bg-slate-200 self-center" />
              <MonedaColumn
                label="Vuelto"
                color="blue"
                renderValor={(key) => ({
                  valor: convertirA(vuelto, key),
                  esPrincipal: key === moneda,
                })}
              />
            </>
          )}

          {/* Spacer */}
          <div className="hidden lg:block flex-1" />

          {/* Botones */}
          <div className="flex items-center gap-2 ml-auto lg:ml-0">
            <Button variant="ghost" size="sm" onClick={onCancelar} disabled={cobrando}>
              Cancelar
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={onConfirmar}
              disabled={!pagosCompletos || cobrando}
              icon={CheckCircle}
              className="lg:!text-base lg:!px-6 lg:!py-2.5"
            >
              {cobrando ? "Procesando..." : "Confirmar Cobro"}
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
