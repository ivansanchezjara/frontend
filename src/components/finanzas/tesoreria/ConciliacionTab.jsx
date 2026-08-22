"use client";

import { Section } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { getCuentas } from "@/services/apis/tesoreria";
import { formatMonto } from "./helpers";

export default function ConciliacionTab() {
  const { data: cuentasData } = useApi(getCuentas, { auto: true, initialData: { results: [] } });
  const cuentas = cuentasData?.results || cuentasData || [];

  return (
    <div className="space-y-6">
      <Section title="Conciliación de Cuentas">
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-6">
            Compará el saldo que el sistema registra contra el saldo real (extracto bancario o arqueo físico de tesorería).
          </p>

          {cuentas.length === 0 ? (
            <p className="text-slate-400 text-sm">No hay cuentas configuradas.</p>
          ) : (
            <div className="space-y-3">
              {cuentas.map((cuenta) => (
                <div key={cuenta.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-5 py-4 border border-slate-100">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{cuenta.nombre}</p>
                    <p className="text-xs text-slate-400">{cuenta.tipo_display}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-700">Saldo sistema: {formatMonto(cuenta.saldo, cuenta.moneda_principal)}</p>
                    <p className="text-[10px] text-slate-400">Verificar contra extracto/arqueo</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 bg-purple-50 border border-purple-100 rounded-xl">
            <p className="text-xs text-purple-700 font-medium">
              💡 Para registrar diferencias, usá la opción "Movimiento Manual" en la pestaña Movimientos con origen "Ajuste de Conciliación".
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
}
