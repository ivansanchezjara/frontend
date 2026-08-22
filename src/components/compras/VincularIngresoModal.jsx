"use client";

import { useState } from "react";
import { Modal, Input, Field, Button, useToast } from "@/components/ui";
import { vincularIngresoOrden } from "@/services/apis/compras";

/**
 * Modal para vincular un ingreso de mercadería a una OC.
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - ordenId: number
 * - onSuccess: () => void
 */
export default function VincularIngresoModal({ open, onClose, ordenId, onSuccess }) {
  const { showToast } = useToast();
  const [ingresoId, setIngresoId] = useState("");

  const handleVincular = async () => {
    if (!ingresoId) { showToast("Ingresá el ID del ingreso", "error"); return; }
    try {
      await vincularIngresoOrden(ordenId, { ingreso_mercaderia_id: Number(ingresoId) });
      showToast("Ingreso vinculado", "success");
      setIngresoId("");
      onClose();
      onSuccess?.();
    } catch (e) { showToast(e.message || "Error", "error"); }
  };

  return (
    <Modal open={open} title="Vincular Ingreso de Mercadería" onClose={onClose}>
      <div className="space-y-4 p-4">
        <Field label="ID del Ingreso de Mercadería">
          <Input
            type="number"
            value={ingresoId}
            onChange={(e) => setIngresoId(e.target.value)}
            placeholder="Ej: 15"
          />
        </Field>
        <p className="text-xs text-slate-500">Encontrá el ID en Movimientos → Ingresos.</p>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleVincular}>Vincular</Button>
        </div>
      </div>
    </Modal>
  );
}
