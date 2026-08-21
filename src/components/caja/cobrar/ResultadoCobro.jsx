"use client";
import { Text, Modal, Button } from "@/components/ui";
import { CheckCircle, Receipt } from "lucide-react";
import { formatMonto, getMonedaSymbol } from "./utils";

/**
 * Vista de resultado exitoso tras el cobro.
 */
export default function ResultadoCobro({ resultado, moneda, totalPedido, vuelto, onClose }) {
  // Usar el vuelto calculado por el frontend (ya convertido correctamente)
  // El backend puede retornar un vuelto incorrecto si los pagos son multi-moneda
  const vueltoFinal = Number(vuelto) || 0;
  const totalNum = Number(totalPedido) || 0;
  const vueltoValido = vueltoFinal > 0 && vueltoFinal < totalNum;

  return (
    <Modal open onClose={onClose} title="Cobro Exitoso" size="sm">
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
          <CheckCircle size={24} className="text-emerald-600 shrink-0" />
          <div>
            <Text variant="bodySmBold" className="!text-emerald-800">
              Cobro registrado correctamente
            </Text>
            <Text variant="bodyXs" className="!text-emerald-600">
              Comprobante Nº {resultado.comprobante?.numero_completo || resultado.comprobante?.numero || "—"}
            </Text>
          </div>
        </div>

        {resultado.factura && (
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <Receipt size={20} className="text-blue-700 shrink-0" />
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

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-50 rounded-lg">
            <Text variant="mutedXs">Total cobrado</Text>
            <Text variant="bodySmBold" className="!text-slate-800">
              {getMonedaSymbol(moneda)} {formatMonto(totalPedido, moneda)}
            </Text>
          </div>
          {vueltoValido && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <Text variant="mutedXs" className="!text-blue-600">Vuelto</Text>
              <Text variant="bodySmBold" className="!text-blue-800">
                {getMonedaSymbol(moneda)} {formatMonto(vueltoFinal, moneda)}
              </Text>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
        <Button variant="primary" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </Modal>
  );
}
