"use client";
import React from 'react';
import { Text } from '@/components/ui';

/**
 * ConsignacionHistorial estandarizado (Strict Light Mode).
 * Pestaña de línea de tiempo (timeline) que detalla el progreso histórico completo
 * de una consignación: desde su inicio hasta las sucesivas liquidaciones, retornos
 * y su eventual cierre final.
 * Reutiliza las piezas de interfaz (Typography - Text).
 */
export default function ConsignacionHistorial({ consignacion, resumen }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 font-sans">
      <div className="relative pl-8 border-l-2 border-slate-100 ml-4 space-y-12 select-none">
        {/* Hito: Salida */}
        <div className="relative">
          <div className="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-blue-500 border-4 border-white shadow-sm"></div>
          <div>
            <Text variant="bodyXs" className="text-blue-500 uppercase tracking-widest font-black leading-none mb-1">
              Inicio Consignación
            </Text>
            <Text className="text-sm font-bold text-slate-700">
              Mercadería enviada a {consignacion.destino}
            </Text>
            <div className="flex items-center gap-2 mt-1">
              <Text variant="bodyXs" className="text-slate-400 font-bold">
                {new Date(consignacion.fecha_salida).toLocaleString()}
              </Text>
              <span className="text-slate-200 select-none">•</span>
              <Text variant="bodyXs" className="text-blue-500 font-black uppercase">
                {consignacion.usuario_nombre}
              </Text>
            </div>
          </div>
        </div>

        {/* Hitos: Movimientos Intermedios */}
        {[...(consignacion.devoluciones || []), ...(consignacion.liquidaciones || [])]
          .sort((a, b) => new Date(a.fecha_devolucion || a.fecha_liquidacion) - new Date(b.fecha_devolucion || b.fecha_liquidacion))
          .map((mov, idx) => (
            <div key={idx} className="relative">
              <div className={`absolute -left-[41px] top-0 w-5 h-5 rounded-full border-4 border-white shadow-sm ${mov.fecha_devolucion ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
              <div>
                <Text 
                  variant="bodyXs" 
                  className={`font-black uppercase tracking-widest leading-none mb-1 ${mov.fecha_devolucion ? 'text-emerald-500' : 'text-blue-500'}`}
                >
                  {mov.fecha_devolucion ? 'Retorno de Stock' : 'Liquidación / Venta'}
                </Text>
                <Text className="text-sm font-bold text-slate-700">
                  {mov.fecha_devolucion ? `Ingreso a ${mov.deposito_destino_nombre}` : `Motivo: ${mov.motivo}`}
                </Text>
                <div className="flex items-center gap-2 mt-1">
                  <Text variant="bodyXs" className="text-slate-400 font-bold">
                    {new Date(mov.fecha_devolucion || mov.fecha_liquidacion).toLocaleString()}
                  </Text>
                  <span className="text-slate-200 select-none">•</span>
                  <Text variant="bodyXs" className="text-blue-500 font-black uppercase">
                    {mov.usuario_nombre}
                  </Text>
                </div>
              </div>
            </div>
          ))}

        {resumen?.completado && (
          <div className="relative">
            <div className="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-emerald-600 border-4 border-white shadow-sm"></div>
            <div>
              <Text variant="bodyXs" className="text-emerald-600 uppercase tracking-widest font-black leading-none mb-1">
                Cierre de Operación
              </Text>
              <Text className="text-sm font-bold text-slate-800">
                Consignación finalizada al 100%
              </Text>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
