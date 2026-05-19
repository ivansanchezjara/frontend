"use client";
import React, { useEffect } from 'react';
import { getFullImageUrl } from '@/services/apis/media.js';
import { Button, Text, Badge } from '@/components/ui';

/**
 * ProductDetailPanel estandarizado (Strict Light Mode).
 * Sidebar lateral deslizable que detalla la ficha técnica del producto,
 * incluyendo su imagen, marca, categoría, descripción, métricas de precio/stock,
 * fecha de vencimiento y etiquetas de clasificación.
 * Reutiliza las piezas atómicas de interfaz (Button, Typography - Text, Badge).
 */
export default function ProductDetailPanel({ producto, onClose }) {

    // 1. Manejo del teclado (Cerrar con Escape)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // 2. Bloqueo de renderizado
    if (!producto) return null;

    // 3. Extracción de datos (Asumiendo estructura de variantes)
    const mainVariant = producto.variants?.[0] || {};
    const stock = mainVariant.stock || 0;
    const precio = mainVariant.precio_0_publico || 0;
    const vencimiento = mainVariant.vencimiento || 'N/A';

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency', currency: 'USD', minimumFractionDigits: 2
        }).format(amount || 0);
    };

    return (
        <>
            {/* Fondo oscuro (Overlay) con animación de fade */}
            <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 animate-in fade-in duration-300 select-none"
                onClick={onClose}
            />

            {/* Panel Lateral con animación de deslizamiento desde la derecha */}
            <aside className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300 font-sans">

                {/* CABECERA (Fija) */}
                <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50 shrink-0 select-none h-24">
                    <div>
                        <Text variant="label" className="text-slate-400 block mb-1">
                            Ficha Técnica
                        </Text>
                        <div className="flex items-center gap-3">
                            <Text variant="bodyXs" className="font-mono text-slate-800 font-bold bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm">
                                {producto.general_code}
                            </Text>
                            <Badge className="bg-slate-200/70 text-slate-600 text-[9px] py-1 border-none tracking-wider font-extrabold">
                                {producto.brand || 'Sin Marca'}
                            </Badge>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={onClose}
                        className="w-8 h-8 rounded-xl border-slate-200 text-slate-400 hover:text-slate-800 hover:bg-slate-50 shadow-sm shrink-0"
                        title="Cerrar panel"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </Button>
                </header>

                {/* CONTENIDO (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">

                    {/* Imagen del Producto */}
                    <div className="w-full aspect-square bg-white rounded-3xl border border-slate-100 flex items-center justify-center p-8 shadow-sm relative group overflow-hidden select-none">
                        <img
                            src={getFullImageUrl(producto.imagen_principal_url)}
                            alt={producto.nombre_general}
                            className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                        />
                        {/* Badge de Categoría sobre la imagen */}
                        <div className="absolute top-4 left-4">
                            <Badge className="bg-white/90 backdrop-blur border border-slate-100 shadow-sm text-slate-700 text-[10px] py-1 px-3 rounded-lg font-black tracking-wide">
                                {producto.categoria?.nombre || 'General'}
                            </Badge>
                        </div>
                    </div>

                    {/* Título y Descripción */}
                    <div className="space-y-3">
                        <Text as="h2" className="text-2xl font-black text-slate-900 leading-tight">
                            {producto.nombre_general}
                        </Text>
                        <Text variant="bodySm" className="text-slate-500 leading-relaxed font-medium">
                            {producto.description || producto.longDescription || 'Este producto no tiene una descripción detallada registrada en el sistema.'}
                        </Text>
                    </div>

                    {/* Grid de Métricas Clave */}
                    <div className="grid grid-cols-2 gap-4 select-none">
                        {/* Caja de Precio */}
                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                            <Text variant="label" className="text-blue-500 block mb-1">
                                Precio Público
                            </Text>
                            <Text className="text-2xl font-black text-blue-700">
                                {formatCurrency(precio)}
                            </Text>
                        </div>

                        {/* Caja de Stock Dinámica */}
                        <div className={`p-4 rounded-2xl border ${
                            stock === 0 
                                ? 'bg-red-50/50 border-red-100' 
                                : stock <= 10 
                                    ? 'bg-amber-50/50 border-amber-100' 
                                    : 'bg-emerald-50/50 border-emerald-100'
                        }`}>
                            <Text variant="label" className={`block mb-1 ${
                                stock === 0 ? 'text-red-500' : stock <= 10 ? 'text-amber-500' : 'text-emerald-500'
                            }`}>
                                Stock Actual
                            </Text>
                            <div className="flex items-baseline gap-1">
                                <Text className={`text-2xl font-black ${
                                    stock === 0 ? 'text-red-700' : stock <= 10 ? 'text-amber-700' : 'text-emerald-700'
                                }`}>
                                    {stock}
                                </Text>
                                <span className={`text-xs font-bold ${
                                    stock === 0 ? 'text-red-400' : stock <= 10 ? 'text-amber-500' : 'text-emerald-500'
                                }`}>
                                    unds.
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Fila de Vencimiento y Tags */}
                    <div className="flex items-center gap-4 py-4 border-t border-slate-100 select-none">
                        <div className="flex-1">
                            <Text variant="label" className="text-slate-400 block mb-1">
                                Vencimiento
                            </Text>
                            <Text variant="bodySm" className="font-bold text-slate-700">
                                {vencimiento}
                            </Text>
                        </div>
                        {producto.tags && producto.tags.length > 0 && (
                            <div className="flex-1">
                                <Text variant="label" className="text-slate-400 block mb-2">
                                    Etiquetas
                                </Text>
                                <div className="flex flex-wrap gap-1.5">
                                    {producto.tags.slice(0, 3).map(tag => (
                                        <Badge key={tag} className="bg-slate-100 text-slate-500 py-0.5 border-none tracking-wide text-[9px] rounded font-bold uppercase">
                                            {tag}
                                        </Badge>
                                    ))}
                                    {producto.tags.length > 3 && (
                                        <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded text-[9px] font-bold">
                                            +{producto.tags.length - 3}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                </div>

                {/* FOOTER DE ACCIONES (Fijo al fondo) */}
                <footer className="p-6 border-t border-slate-100 bg-white shrink-0 flex gap-3 select-none">
                    <Button 
                        variant="outline"
                        className="flex-1 font-bold text-sm h-12 rounded-xl text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                        </svg>
                        Editar Producto
                    </Button>
                    <Button 
                        variant="danger"
                        className="flex-none bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white px-4 h-12 rounded-xl transition-all"
                        title="Eliminar Producto"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                    </Button>
                </footer>
            </aside>
        </>
    );
}
