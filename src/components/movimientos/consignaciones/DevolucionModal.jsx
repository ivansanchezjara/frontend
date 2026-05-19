"use client";
import React, { useState } from "react";
import { Button, Text } from '@/components/ui';

/**
 * DevolucionModal estandarizado (Strict Light Mode).
 * Modal interactivo que permite registrar el retorno físico de mercadería en consignación
 * hacia un depósito de destino seleccionado del listado.
 * Reutiliza las piezas de interfaz (Button, Typography - Text).
 */
export default function DevolucionModal({ consignacion, depositos, onClose, onConfirm, isSubmitting }) {
  const [depositoDestino, setDepositoDestino] = useState(depositos[0]?.id || "");
  const [itemsDevolver, setItemsDevolver] = useState([]);

  const handleItemChange = (itemSalidaId, val) => {
    setItemsDevolver((prev) => {
      const idx = prev.findIndex((it) => it.item_salida === itemSalidaId);
      if (idx > -1) {
        const newItems = [...prev];
        newItems[idx].cantidad_devuelta = val;
        return newItems;
      }
      return [...prev, { item_salida: itemSalidaId, cantidad_devuelta: val }];
    });
  };

  const handleConfirm = () => {
    const validItems = itemsDevolver.filter((it) => it.cantidad_devuelta > 0);
    if (validItems.length === 0) return alert("Ingresa cantidades a devolver");
    
    onConfirm({
      salida_original: consignacion.id,
      deposito_destino: depositoDestino,
      items: validItems,
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 font-sans">
        <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center select-none">
          <div>
            <Text as="h2" className="text-xl font-black text-slate-900 uppercase tracking-tight">
              Retorno de Mercadería
            </Text>
            <Text variant="bodyXs" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Registrar ingreso a depósito
            </Text>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={onClose}
            className="w-10 h-10 rounded-xl border-slate-200 text-slate-400 hover:text-slate-900 shadow-sm shrink-0 font-extrabold"
            title="Cerrar modal"
          >
            ✕
          </Button>
        </div>

        <div className="p-8 overflow-y-auto space-y-6">
          <div className="space-y-2 select-none">
            <Text variant="label" as="label" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
              Depósito de Destino
            </Text>
            <select
              className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
              onChange={(e) => setDepositoDestino(e.target.value)}
              value={depositoDestino}
            >
              {depositos.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <Text variant="label" as="label" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block select-none">
              Items a devolver
            </Text>
            {consignacion.items.map((item, i) => {
              const pendiente =
                item.cantidad -
                (item.cantidad_devuelta + item.cantidad_liquidada);
              if (pendiente <= 0) return null;
              
              return (
                <div
                  key={i}
                  className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <Text variant="bodyXs" className="text-blue-500 font-black uppercase tracking-widest leading-none mb-1">
                      {item.lote_codigo}
                    </Text>
                    <Text variant="bodySm" className="font-black text-slate-800 truncate">
                      {item.variante_nombre}
                    </Text>
                    <Text variant="bodyXs" className="text-slate-400 font-bold mt-0.5 select-none">
                      Pendiente: {pendiente} u.
                    </Text>
                  </div>
                  <div className="w-24 shrink-0">
                    <input
                      type="number"
                      min="0"
                      max={pendiente}
                      placeholder="0"
                      className="w-full h-10 bg-white border border-slate-200 rounded-xl text-center font-black text-blue-600 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        handleItemChange(item.id, val);
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 select-none">
          <Button
            variant="ghost"
            onClick={onClose}
            className="px-8 h-12 text-[10px] font-black uppercase text-slate-400 hover:text-slate-650 transition-all active:scale-95"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-10 h-12 bg-slate-900 hover:bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Procesando..." : "Confirmar Retorno"}
          </Button>
        </div>
      </div>
    </div>
  );
}
