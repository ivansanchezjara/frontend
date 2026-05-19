"use client";
import React from 'react';
import { Package } from "lucide-react";
import { Text, Badge } from '@/components/ui';

/**
 * ConsignacionResumen estandarizado (Strict Light Mode).
 * Pestaña de resumen de cantidades enviadas, retornadas, liquidadas y pendientes
 * por cada item del lote de una salida en consignación.
 * Reutiliza las piezas de interfaz (Typography - Text, Badge).
 */
export default function ConsignacionResumen({ items }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 font-sans">
      <div>
        <Text variant="label" className="text-slate-400 block mb-4 tracking-[0.2em] select-none">
          Detalle de mercadería enviada
        </Text>
        <div className="grid grid-cols-1 gap-4">
          {items?.map((item, i) => {
            const pendiente = item.cantidad - (item.cantidad_devuelta + item.cantidad_liquidada);
            return (
              <div
                key={i}
                className="p-5 bg-slate-50 border border-slate-100 rounded-[28px] flex items-center justify-between group transition-all hover:bg-white hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                    <Package size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 select-none">
                      <Text variant="bodyXs" className="text-blue-500 font-black uppercase tracking-widest leading-none">
                        {item.lote_codigo}
                      </Text>
                      {pendiente <= 0 && (
                        <Badge className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full border-none">
                          CERRADO
                        </Badge>
                      )}
                    </div>
                    <Text className="font-black text-slate-800">
                      {item.variante_nombre}
                    </Text>
                    <Text variant="bodyXs" className="text-slate-400 font-bold uppercase mt-1 select-none">
                      Origen: {item.deposito_nombre}
                    </Text>
                  </div>
                </div>
                <div className="flex items-center gap-8 select-none">
                  <div className="text-right">
                    <Text variant="label" className="text-slate-400 block mb-0.5">
                      Enviado
                    </Text>
                    <Text className="text-sm font-black text-slate-650">
                      {item.cantidad} u.
                    </Text>
                  </div>
                  <div className="text-right">
                    <Text variant="label" className="text-emerald-500 block mb-0.5">
                      Retornado
                    </Text>
                    <Text className="text-sm font-black text-emerald-600">
                      {item.cantidad_devuelta} u.
                    </Text>
                  </div>
                  <div className="text-right">
                    <Text variant="label" className="text-blue-500 block mb-0.5">
                      Liquidado
                    </Text>
                    <Text className="text-sm font-black text-blue-600">
                      {item.cantidad_liquidada} u.
                    </Text>
                  </div>
                  <div className="text-right min-w-[80px] bg-white px-4 py-2 rounded-xl border border-slate-100">
                    <Text variant="label" className="text-slate-400 block mb-0.5">
                      Pendiente
                    </Text>
                    <Text className={`text-lg font-black ${pendiente > 0 ? "text-amber-600" : "text-slate-350"}`}>
                      {pendiente} <span className="text-[10px] font-normal">u.</span>
                    </Text>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
