"use client";
import React from 'react';
import { DollarSign } from "lucide-react";
import { Text, Badge } from '@/components/ui';

/**
 * ConsignacionLiquidaciones estandarizado (Strict Light Mode).
 * Pestaña de listado que presenta el historial de cierres por liquidación y ventas
 * asociados a una consignación, detallando los motivos y comprobantes registrados.
 * Reutiliza las piezas de interfaz (Typography - Text, Badge).
 */
export default function ConsignacionLiquidaciones({ liquidaciones }) {
  if (!liquidaciones || liquidaciones.length === 0) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <Text variant="bodyXs" className="text-slate-400 font-bold uppercase tracking-widest text-center py-20 italic block">
          No hay liquidaciones registradas aún.
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 font-sans">
      <div className="grid grid-cols-1 gap-4">
        {liquidaciones.map((liq) => (
          <div key={liq.id} className="p-6 bg-slate-50 border border-slate-100 rounded-[32px] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-blue-100/50">
                <DollarSign size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 select-none">
                  <Text variant="bodyXs" className="text-slate-400 uppercase tracking-widest font-black shrink-0">
                    Liquidación #{liq.id}
                  </Text>
                  <Badge className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase bg-blue-100 text-blue-700 border-none">
                    {liq.motivo}
                  </Badge>
                </div>
                <Text className="font-black text-slate-800">
                  {liq.comprobante_venta || 'Sin Comprobante'}
                </Text>
                <div className="flex items-center gap-2 mt-1">
                  <Text variant="bodyXs" className="text-slate-400 font-bold">
                    {new Date(liq.fecha_liquidacion).toLocaleString()}
                  </Text>
                  <span className="text-[10px] text-slate-350 select-none">•</span>
                  <Text variant="bodyXs" className="text-blue-500 font-black uppercase">
                    {liq.usuario_nombre}
                  </Text>
                </div>
              </div>
            </div>
            <div className="text-right">
              <Text variant="label" className="text-slate-400 block mb-1.5 select-none">
                Cantidad Liquidada
              </Text>
              <div className="flex gap-2 justify-end">
                {liq.items.map((it, idx) => (
                  <Badge 
                    key={idx} 
                    className="bg-white text-slate-800 border-slate-200 py-1 px-2 text-[10px] font-black rounded-lg shadow-sm"
                    title={it.variante_nombre}
                  >
                    {it.cantidad_liquidada}u.
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
