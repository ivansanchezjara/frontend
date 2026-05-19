"use client";
import React from 'react';
import { RotateCcw } from "lucide-react";
import { Button, Text, Badge } from '@/components/ui';

/**
 * ConsignacionDevoluciones estandarizado (Strict Light Mode).
 * Pestaña de listado que presenta el historial de retornos de mercadería
 * correspondientes a una salida en consignación seleccionada, con soporte para
 * aprobar ingresos a depósito de retornos pendientes.
 * Reutiliza las piezas de interfaz (Button, Typography - Text, Badge).
 */
export default function ConsignacionDevoluciones({ devoluciones, isAprobandoDev, onAprobarDevolucion }) {
  if (!devoluciones || devoluciones.length === 0) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <Text variant="bodyXs" className="text-slate-400 font-bold uppercase tracking-widest text-center py-20 italic block">
          No hay retornos registrados para esta salida.
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 font-sans">
      <div className="grid grid-cols-1 gap-4">
        {devoluciones.map((dev) => (
          <div key={dev.id} className="p-6 bg-slate-50 border border-slate-100 rounded-[32px] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${
                dev.estado === 'APROBADO' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-500 border-amber-100'
              }`}>
                <RotateCcw size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 select-none">
                  <Text variant="bodyXs" className="text-slate-400 uppercase tracking-widest font-black shrink-0">
                    Devolución #{dev.id}
                  </Text>
                  <Badge className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase border-none ${
                    dev.estado === 'APROBADO' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {dev.estado}
                  </Badge>
                </div>
                <Text className="font-black text-slate-800">
                  Vuelve a: {dev.deposito_destino_nombre}
                </Text>
                <div className="flex items-center gap-2 mt-1">
                  <Text variant="bodyXs" className="text-slate-400 font-bold">
                    {new Date(dev.fecha_devolucion).toLocaleString()}
                  </Text>
                  <span className="text-[10px] text-slate-350 select-none">•</span>
                  <Text variant="bodyXs" className="text-blue-500 font-black uppercase">
                    {dev.usuario_nombre}
                  </Text>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right select-none">
                <Text variant="label" className="text-slate-400 block mb-1">
                  Items devueltos
                </Text>
                <div className="flex -space-x-2">
                  {dev.items.map((it, idx) => (
                    <div 
                      key={idx} 
                      className="w-8 h-8 rounded-full bg-white border-2 border-slate-50 flex items-center justify-center text-[10px] font-black text-slate-650 shadow-sm" 
                      title={`${it.variante_nombre}: ${it.cantidad_devuelta}u.`}
                    >
                      {it.cantidad_devuelta}
                    </div>
                  ))}
                </div>
              </div>
              {dev.estado === 'BORRADOR' && (
                <Button
                  onClick={() => onAprobarDevolucion(dev.id)}
                  disabled={isAprobandoDev}
                  className="bg-slate-900 text-white px-4 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-95"
                >
                  {isAprobandoDev ? "Aprobando..." : "Aprobar Ingreso"}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
