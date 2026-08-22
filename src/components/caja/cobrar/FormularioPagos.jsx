"use client";
import { Text, Button } from "@/components/ui";
import { CreditCard, Plus } from "lucide-react";
import { MAX_PAGOS } from "./utils";
import PagoItem from "./PagoItem";

export default function FormularioPagos({
  pagos,
  moneda,
  faltante,
  pagosDetalle,
  terminales,
  cargandoTasas,
  onAddPago,
  onMetodoChange,
  onMontoChange,
  onReferenciaChange,
  onFieldChange,
  onRemovePago,
  onAutoCompletar,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard size={16} className="text-purple-500" />
          <Text variant="label" className="!text-sm !text-slate-700">
            Medios de pago
          </Text>
        </div>
        {pagos.length < MAX_PAGOS && (
          <Button variant="outline" size="xs" onClick={onAddPago} icon={Plus}>
            Agregar
          </Button>
        )}
      </div>

      {cargandoTasas && (
        <Text variant="mutedXs" className="text-center py-2">Cargando tipos de cambio...</Text>
      )}

      <div className="space-y-3">
        {pagos.map((pago, index) => (
          <PagoItem
            key={index}
            pago={pago}
            index={index}
            moneda={moneda}
            faltante={faltante}
            detalle={pagosDetalle[index]}
            terminales={terminales}
            onMetodoChange={onMetodoChange}
            onMontoChange={onMontoChange}
            onReferenciaChange={onReferenciaChange}
            onFieldChange={onFieldChange}
            onRemove={onRemovePago}
            onAutoCompletar={onAutoCompletar}
          />
        ))}
      </div>
    </div>
  );
}
