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
  CornerDownRight,
} from "lucide-react";
import { Button, Text, Badge } from '@/components/ui';

/**
 * AjusteDetailModal estandarizado (Strict Light Mode).
 * Modal de visualización que detalla los cambios de stock y vencimiento de lotes
 * efectuados en un ajuste de inventario específico.
 * Reutiliza las piezas atómicas de interfaz (Button, Typography - Text, Badge).
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
                  Ajuste INV-#{ajuste.id}
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
                Detalles del Movimiento
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
                Motivo del Ajuste
              </Text>
              <Badge className="bg-white border border-slate-200 text-slate-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                {ajuste.motivo?.replace("_", " ")}
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

          {/* Tabla de Cambios */}
          <div className="space-y-4">
            <Text variant="label" className="text-slate-400 block ml-2 mb-2 tracking-[0.2em]">
              Lotes Afectados
            </Text>
            <div className="space-y-4">
              {ajuste.lotes_ajustados?.map((item) => {
                const hasQtyChange =
                  item.nueva_cantidad !== null &&
                  item.nueva_cantidad !== item.cantidad_anterior;
                const hasDateChange =
                  item.nuevo_vencimiento !== null &&
                  item.nuevo_vencimiento !== item.vencimiento_anterior;
                const isSplit =
                  item.nuevo_lote_codigo && item.nueva_cantidad !== null;

                return (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-100 rounded-[24px] overflow-hidden shadow-sm hover:border-slate-300 transition-all"
                  >
                    <div className="p-5 flex flex-col md:flex-row justify-between gap-6">
                      {/* Info Lote */}
                      <div className="flex items-center gap-4 min-w-[200px]">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                          <MapPin size={20} />
                        </div>
                        <div>
                          <Text variant="label" className="text-slate-400 block mb-1">
                            {item.deposito_nombre}
                          </Text>
                          <Text className="font-black text-slate-900 tracking-tight">
                            {item.lote_codigo}
                          </Text>
                        </div>
                      </div>

                      {/* Comparación Cantidad */}
                      <div className="flex-1">
                        <Text variant="label" className="text-slate-400 block mb-2">
                          Cantidad
                        </Text>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-slate-400 line-through">
                            {item.cantidad_anterior} u.
                          </span>
                          <ArrowRight size={14} className="text-slate-300 animate-pulse" />
                          <span
                            className={`text-lg font-black ${hasQtyChange ? "text-blue-600" : "text-slate-800"}`}
                          >
                            {item.nueva_cantidad ?? item.cantidad_anterior} u.
                          </span>
                        </div>
                      </div>

                      {/* Comparación Vencimiento */}
                      <div className="flex-1">
                        <Text variant="label" className="text-slate-400 block mb-2">
                          Vencimiento
                        </Text>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-bold text-slate-400 line-through">
                            {item.vencimiento_anterior || "N/A"}
                          </span>
                          <ArrowRight size={14} className="text-slate-300 animate-pulse" />
                          <span
                            className={`text-xs font-black ${hasDateChange ? "text-amber-600" : "text-slate-800"}`}
                          >
                            {item.nuevo_vencimiento ??
                              item.vencimiento_anterior ??
                              "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Detalle de Redistribución (Si hubo split/transferencia) */}
                    {isSplit && (
                      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2 select-none">
                        <CornerDownRight size={16} className="text-blue-500" />
                        <Text variant="bodyXs" className="font-bold text-slate-600 uppercase tracking-widest">
                          Diferencia de{" "}
                          <span className="text-blue-600 font-black">
                            {item.cantidad_anterior - item.nueva_cantidad}u.
                          </span>{" "}
                          movida a lote:{" "}
                          <span className="text-slate-900 font-black">
                            {item.nuevo_lote_codigo}
                          </span>
                        </Text>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0 select-none">
          <div className="flex gap-6">
            <div className="flex flex-col">
              <Text variant="label" className="text-slate-400 block mb-1">
                Fecha de Registro
              </Text>
              <div className="flex items-center gap-2 text-slate-700 font-black text-xs">
                <Calendar size={14} className="text-slate-400" />
                {new Date(ajuste.fecha).toLocaleString()}
              </div>
            </div>
            <div className="flex flex-col">
              <Text variant="label" className="text-slate-400 block mb-1">
                Registrado por
              </Text>
              <div className="flex items-center gap-2 text-slate-700 font-black text-xs">
                <User size={14} className="text-slate-400" />
                {ajuste.usuario_nombre}
              </div>
            </div>
          </div>
          <Button
            onClick={onClose}
            className="bg-slate-900 text-white px-10 h-13 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-100 active:scale-95"
          >
            Cerrar Detalles
          </Button>
        </div>
      </div>
    </div>
  );
}
