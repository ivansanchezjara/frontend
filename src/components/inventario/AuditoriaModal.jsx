"use client";
import React from 'react';
import { MapPin, Info } from "lucide-react";
import { Button, Text } from '@/components/ui';

/**
 * AuditoriaModal estandarizado (Strict Light Mode).
 * Modal interactivo que detalla el stock de un SKU desglosado por lotes,
 * fechas de vencimiento y ubicaciones físicas (depósitos).
 * Reutiliza las piezas atómicas de interfaz (Button, Typography - Text).
 */
export default function AuditoriaModal({ selectedSKU, lotes, onClose }) {
    const getSemaforoVencimiento = (vencimiento) => {
        if (!vencimiento)
            return {
                color: "text-slate-300",
                dot: "bg-slate-200",
                label: "Sin vencimiento",
            };
        const days = (new Date(vencimiento) - new Date()) / (1000 * 60 * 60 * 24);
        if (days < 0)
            return {
                color: "text-red-900",
                dot: "bg-red-900 animate-pulse",
                label: "VENCIDO",
            };
        if (days < 90)
            return { color: "text-red-500", dot: "bg-red-500", label: `< 90 días` };
        if (days < 180)
            return {
                color: "text-yellow-500",
                dot: "bg-yellow-500",
                label: `< 180 días`,
            };
        return {
            color: "text-emerald-500",
            dot: "bg-emerald-500",
            label: "Al día",
        };
    };

    if (!selectedSKU) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col my-8 animate-in zoom-in-95 duration-200">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 select-none">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Text variant="bodyXs" className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase tracking-widest font-black shrink-0 inline-block">
                                {selectedSKU.product_code}
                            </Text>
                            <Text as="h2" className="text-2xl font-black text-slate-900 tracking-tight">
                                Auditando SKU
                            </Text>
                        </div>
                        <Text variant="bodySm" className="text-slate-500 font-bold uppercase mt-1 tracking-widest leading-none">
                            {selectedSKU.producto_nombre_general}{" "}
                            <span className="text-slate-300 ml-2">
                                / {selectedSKU.nombre_variante}
                            </span>
                        </Text>
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

                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto font-sans">
                    {/* Resumen de Estados Stock */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 select-none">
                        <div className="bg-emerald-50/70 p-4 rounded-3xl border border-emerald-100">
                            <Text variant="label" className="text-emerald-600 block mb-1">
                                Disponible
                            </Text>
                            <Text className="text-xl font-black text-emerald-700">
                                {selectedSKU.stock || 0}{" "}
                                <span className="text-xs font-normal">u.</span>
                            </Text>
                        </div>
                        <div className="bg-purple-50/70 p-4 rounded-3xl border border-purple-100">
                            <Text variant="label" className="text-purple-600 block mb-1">
                                Consignación
                            </Text>
                            <Text className="text-xl font-black text-purple-700">
                                {selectedSKU.stock_en_consignacion || 0}{" "}
                                <span className="text-xs font-normal">u.</span>
                            </Text>
                        </div>
                        <div className="bg-blue-50/70 p-4 rounded-3xl border border-blue-100">
                            <Text variant="label" className="text-blue-600 block mb-1">
                                Reservado
                            </Text>
                            <Text className="text-xl font-black text-blue-700">
                                {selectedSKU.stock_reservado || 0}{" "}
                                <span className="text-xs font-normal">u.</span>
                            </Text>
                        </div>
                        <div className="bg-red-50/70 p-4 rounded-3xl border border-red-100">
                            <Text variant="label" className="text-red-600 block mb-1">
                                Vencido
                            </Text>
                            <Text className="text-xl font-black text-red-700">
                                {selectedSKU.stock_vencido || 0}{" "}
                                <span className="text-xs font-normal">u.</span>
                            </Text>
                        </div>
                    </div>

                    {/* Desglose por Lotes */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(() => {
                                const validLotes = (Array.isArray(lotes) ? lotes : []).filter(
                                    (l) => l.cantidad > 0,
                                );

                                if (validLotes.length === 0) {
                                    return (
                                        <div className="col-span-2 py-12 text-center bg-slate-50 rounded-[30px] border border-dashed border-slate-200 select-none">
                                            <Text variant="bodyXs" className="text-slate-400 font-bold uppercase tracking-widest italic">
                                                No hay lotes con stock para este SKU.
                                            </Text>
                                        </div>
                                    );
                                }

                                // Agrupar por código de lote
                                const lotesAgrupados = validLotes.reduce((acc, lote) => {
                                    const code = lote.lote_codigo;
                                    if (!acc[code]) {
                                        acc[code] = {
                                            lote_codigo: code,
                                            vencimiento: lote.vencimiento,
                                            esta_vencido: lote.esta_vencido,
                                            total_cantidad: 0,
                                            ubicaciones: [],
                                        };
                                    }
                                    acc[code].total_cantidad += lote.cantidad;
                                    if (lote.esta_vencido) acc[code].esta_vencido = true;
                                    acc[code].ubicaciones.push({
                                        id: lote.id,
                                        deposito_nombre: lote.deposito_nombre,
                                        cantidad: lote.cantidad,
                                        esta_vencido: lote.esta_vencido,
                                    });
                                    return acc;
                                }, {});

                                return Object.values(lotesAgrupados).map((grupo, idx) => (
                                    <div
                                        key={idx}
                                        className="p-5 rounded-3xl border transition-all bg-white border-slate-100 hover:border-slate-300 flex flex-col"
                                    >
                                        <div className="flex justify-between items-start mb-4 select-none">
                                            <div>
                                                <Text variant="label" as="label" className="ml-1 mb-1 block text-slate-400">
                                                    Código de Lote
                                                </Text>
                                                <Text className="text-lg font-black text-slate-800 ml-1">
                                                    {grupo.lote_codigo}
                                                </Text>
                                            </div>
                                            <div className="text-right">
                                                <Text className="text-xl font-black text-slate-900">
                                                    {grupo.total_cantidad} <span className="text-xs font-normal">u.</span>
                                                </Text>
                                                {grupo.esta_vencido && (
                                                    <div className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                                                        VENCIDO
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mb-4 select-none">
                                            <Text variant="label" as="label" className="ml-1 mb-1 block text-slate-400">
                                                Vencimiento
                                            </Text>
                                            <div className="flex items-center gap-2 ml-1">
                                                <div
                                                    className={`w-2 h-2 rounded-full ${getSemaforoVencimiento(grupo.vencimiento).dot}`}
                                                ></div>
                                                <Text
                                                    className={`text-[11px] font-black uppercase tracking-tight ${getSemaforoVencimiento(grupo.vencimiento).color}`}
                                                >
                                                    {grupo.vencimiento || "Sin fecha"}
                                                </Text>
                                            </div>
                                        </div>

                                        <div className="mt-auto bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                            <Text variant="label" className="text-slate-400 mb-2 flex items-center gap-1.5 select-none">
                                                <MapPin size={10} /> Ubicaciones
                                            </Text>
                                            <div className="space-y-2">
                                                {grupo.ubicaciones.map((ubi) => (
                                                    <div
                                                        key={ubi.id}
                                                        className="flex justify-between items-center text-xs"
                                                    >
                                                        <Text variant="bodyXs" className="font-bold text-slate-600">
                                                            {ubi.deposito_nombre || "Depósito"}
                                                        </Text>
                                                        <div className="flex items-center gap-2">
                                                            {ubi.cantidad > 0 && (
                                                                <Text variant="bodyXs" className="font-black text-slate-800">
                                                                    {ubi.cantidad} u.
                                                                </Text>
                                                            )}
                                                            {ubi.esta_vencido && (
                                                                <span className="font-bold text-red-500 bg-white px-1.5 rounded-md border border-red-100 text-[10px]">
                                                                    vencido
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center select-none">
                    <div className="flex items-start gap-3 max-w-md">
                        <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                        <Text variant="bodyXs" className="text-blue-700 font-medium leading-normal">
                            Para realizar correcciones o mover unidades entre lotes, dirígete
                            al módulo de <strong>Ajustes de Inventario</strong>.
                        </Text>
                    </div>
                </div>
            </div>
        </div>
    );
}
