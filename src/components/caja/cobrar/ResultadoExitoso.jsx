"use client";
import { useRouter } from "next/navigation";
import { PageHeader, Button, Text } from "@/components/ui";
import { ArrowLeft, CheckCircle, Receipt } from "lucide-react";
import { formatMonto, getMonedaSymbol } from "./utils";

export default function ResultadoExitoso({
  id,
  resultado,
  moneda,
  totalesMultimoneda,
  vueltosConfirmados,
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Caja y Facturación", href: "/caja" },
          { label: "Cobros", href: "/caja/cobros" },
          { label: `Pedido #${id}` },
        ]}
        subtitle="Cobro exitoso"
        subtitleClassName="text-emerald-600"
      />
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center gap-4 p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
            <CheckCircle size={32} className="text-emerald-600 shrink-0" />
            <div>
              <Text variant="bodyBold" className="!text-emerald-800">
                Cobro registrado correctamente
              </Text>
              <Text variant="bodyXs" className="!text-emerald-600">
                Comprobante Nº {resultado.comprobante?.numero_completo || resultado.comprobante?.numero || "—"}
              </Text>
            </div>
          </div>

          {resultado.factura && (
            <div className="flex items-center gap-4 p-5 bg-blue-50 rounded-2xl border border-blue-100">
              <Receipt size={24} className="text-blue-700 shrink-0" />
              <div>
                <Text variant="bodySmBold" className="!text-blue-800">
                  Factura Nº {resultado.factura.numero_completo || "—"}
                </Text>
                <Text variant="bodyXs" className="!text-blue-600">
                  Factura legal emitida
                </Text>
              </div>
            </div>
          )}

          {/* Total cobrado en 3 monedas */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
            <Text variant="mutedXs" className="!text-[10px] !font-bold !uppercase !tracking-wider">Total cobrado</Text>
            <div className="space-y-1">
              {[
                { key: "USD", symbol: "$" },
                { key: "PYG", symbol: "₲" },
                { key: "BRL", symbol: "R$" },
              ].map(({ key, symbol }) => {
                const valor = totalesMultimoneda[key];
                const esPrincipal = key === moneda;
                return (
                  <div key={key} className="flex items-baseline gap-2">
                    <Text variant="mutedXs" className="!text-[10px] w-7">{key}</Text>
                    <Text variant={esPrincipal ? "bodyBold" : "bodySmBold"} className={
                      esPrincipal ? "!font-black !text-slate-900 !text-lg" : "!text-slate-500"
                    }>
                      {valor != null ? `${symbol} ${formatMonto(valor, key)}` : "—"}
                    </Text>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Vuelto entregado */}
          {vueltosConfirmados.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-2">
              <Text variant="mutedXs" className="!text-[10px] !font-bold !uppercase !tracking-wider !text-blue-500">
                Vuelto entregado
              </Text>
              <div className="space-y-1">
                {vueltosConfirmados.map((v, idx) => (
                  <Text key={idx} variant="bodyBold" className="!text-blue-800 !text-lg">
                    {getMonedaSymbol(v.moneda)} {formatMonto(v.monto, v.moneda)}
                  </Text>
                ))}
              </div>
            </div>
          )}

          <Button
            variant="outline"
            className="w-full"
            icon={ArrowLeft}
            onClick={() => router.push("/caja/cobros")}
          >
            Volver a Cobros
          </Button>
        </div>
      </main>
    </div>
  );
}
