"use client";
import React from 'react';
import {
  Package,
  MapPin,
  Calendar,
  User,
  Clock,
  CheckCircle,
  ArrowRight,
  Shuffle,
} from "lucide-react";
import { Button, Text, Badge } from '@/components/ui';

/**
 * AjusteDetailModal — Modal de detalle para reclasificaciones de inventario.
 * Muestra las líneas de movimiento de stock entre lotes.
 */
export default function AjusteDetailModal({ ajuste, isOpen, onClose }) {
  if (!isOpen || !ajuste) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] font-sans">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0 select-none">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border ${
                ajuste.estado === "APROBADO" 
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                  : "bg-amber-50 text-amber-500 border-amber-100"
              }`}
            >
              {ajuste.estado === "APROBADO" ? (
                <CheckCircle size={28} />
              ) : (
                <Clock size={28} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Text variant="bodyXs" className="text-slate-400 uppercase tracking-widest font-black shrink-0">
                  Reclasificación #{ajuste.id}
                </Text>
                <Badge
                  className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest border-none ${
                    ajuste.estado === "APROBADO" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {ajuste.estado}
                </Badge>
              </div>
              <Text as="h2" className="text-xl font-black text-slate-900 tracking-tight leading-none">
                Detalle de Reclasificación
              </Text>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={onClose}
            className="w-12 h-12 rounded-2xl border-slate-200 text-slate-400 hover:text-slate-800 shadow-sm shrink-0 font-extrabold"
            title="Cerrar modal"
          >
            ✕
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Info del Producto */}
          <div className="bg-blue-50/30 border border-blue-100 rounded-[32px] p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                <Package size={24} />
              </div>
              <div>
                <Text variant="bodyXs" className="text-blue-500 font-black uppercase tracking-widest leading-none mb-1">
                  {ajuste.variante_codigo}
                </Text>
                <Text className="text-lg font-black text-slate-900 leading-none">
                  {ajuste.producto_nombre}
                </Text>
                <Text variant="bodySm" className="text-slate-500 font-bold uppercase mt-1 tracking-wider leading-none">
                  {ajuste.variante_nombre}
                </Text>
              </div>
            </div>
            <div className="text-right select-none">
              <Text variant="label" className="text-slate-400 block mb-1">
                Motivo
              </Text>
              <Badge className="bg-white border border-slate-200 text-slate-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                {ajuste.motivo}
              </Badge>
            </div>
          </div>

          {/* Observaciones */}
          {ajuste.observaciones && (
            <div className="space-y-2">
              <Text variant="label" className="text-slate-400 block ml-2 mb-1 tracking-[0.2em]">
                Observaciones
              </Text>
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                <Text variant="bodySm" className="italic text-slate-600 leading-relaxed font-medium">
                  "{ajuste.observaciones}"
                </Text>
              </div>
            </div>
          )}

          {/* Líneas de Reclasificación */}
          <div className="space-y-4">
            <Text variant="label" className="text-slate-400 block ml-2 mb-2 tracking-[0.2em]">
              Movimientos entre Lotes
            </Text>
            <div className="space-y-4">
              {ajuste.items?.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-100 rounded-[24px] overflow-hidden shadow-sm hover:border-slate-300 transition-all"
                >
                  <div className="p-5 flex flex-col md:flex-row items-center gap-4">
                    {/* Lote Origen */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-400 shrink-0">
                        <MapPin size={20} />
                      </div>
                      <div className="min-w-0">
                        <Text variant="label" className="text-slate-400 block mb-0.5">
                          Origen
                        </Text>
                        <Text className="font-black text-slate-900 tracking-tight truncate">
                          {item.lote_origen_codigo}
                        </Text>
                        <Text variant="bodyXs" className="text-slate-400">
                          {item.lote_origen_deposito}
                        </Text>
                      </div>
                    </div>

                    {/* Flecha + Cantidad */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-4 py-2 rounded-full">
                        <Shuffle size={14} className="text-blue-500" />
                        <Text className="font-black text-blue-700 text-sm">
                          {item.cantidad} u.
                        </Text>
                      </div>
                      <ArrowRight size={16} className="text-slate-300" />
                    </div>

                    {/* Lote Destino */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 shrink-0">
                        <MapPin size={20} />
                      </div>
                      <div className="min-w-0">
                        <Text variant="label" className="text-slate-400 block mb-0.5">
                          Destino
                        </Text>
                        <Text className="font-black text-slate-900 tracking-tight truncate">
                          {item.lote_destino_codigo || item.nuevo_lote_codigo}
                        </Text>
                        <Text variant="bodyXs" className="text-slate-400">
                          {item.lote_destino_deposito || (item.nuevo_lote_codigo ? "Lote nuevo" : "")}
                        </Text>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0 select-none">
          <div className="flex gap-6">
            <div className="flex flex-col">
              <Text variant="label" className="text-slate-400 block mb-1">
                Fecha
              </Text>
              <div className="flex items-center gap-2 text-slate-700 font-black text-xs">
                <Calendar size={14} className="text-slate-400" />
                {new Date(ajuste.fecha).toLocaleString()}
              </div>
            </div>
            <div className="flex flex-col">
              <Text variant="label" className="text-slate-400 block mb-1">
                Creado por
              </Text>
              <div className="flex items-center gap-2 text-slate-700 font-black text-xs">
                <User size={14} className="text-slate-400" />
                {ajuste.usuario_nombre}
              </div>
            </div>
            {ajuste.aprobado_por_nombre && (
              <div className="flex flex-col">
                <Text variant="label" className="text-slate-400 block mb-1">
                  Aprobado por
                </Text>
                <div className="flex items-center gap-2 text-slate-700 font-black text-xs">
                  <CheckCircle size={14} className="text-emerald-500" />
                  {ajuste.aprobado_por_nombre}
                </div>
              </div>
            )}
          </div>
          <Button
            onClick={onClose}
            className="bg-slate-900 text-white px-10 h-13 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-100 active:scale-95"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
