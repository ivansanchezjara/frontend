"use client";
import { Text, Heading } from '@/components/ui';
import { Package, MapPin, Calendar } from 'lucide-react';

/**
 * Card reutilizable que muestra el producto/variante/lote seleccionado.
 * 
 * Props:
 * - codigo: string — Código del producto/variante (ej: product_code)
 * - titulo: string — Nombre principal (ej: nombre del producto)
 * - subtitulo: string (opcional) — Nombre de la variante
 * - detalles: array de { icon, label } (opcional) — Info adicional (lote, depósito, vencimiento)
 * - onClear: function — Callback para deseleccionar
 * - clearLabel: string — Texto del botón de limpiar (default: "Cambiar producto")
 */
export default function SelectedProductCard({
    codigo,
    titulo,
    subtitulo,
    detalles = [],
    onClear,
    clearLabel = "Cambiar producto"
}) {
    return (
        <div className="flex items-center justify-between p-5 bg-blue-50/50 border border-blue-100 rounded-[24px]">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-blue-100 shadow-sm shrink-0">
                    <Package size={24} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                    {codigo && (
                        <Text variant="bodyXs" className="text-blue-500 font-black uppercase tracking-widest leading-none mb-1">
                            {codigo}
                        </Text>
                    )}
                    <Heading level={4} className="text-slate-900 text-lg truncate">
                        {titulo}
                        {subtitulo && (
                            <Text as="span" variant="muted" className="text-sm ml-2">
                                | {subtitulo}
                            </Text>
                        )}
                    </Heading>
                    {detalles.length > 0 && (
                        <div className="flex flex-wrap items-center gap-4 mt-1.5">
                            {detalles.map((det, idx) => (
                                <Text key={idx} variant="bodyXs" className="text-slate-500 flex items-center gap-1">
                                    {det.icon && <det.icon size={12} />}
                                    {det.label}
                                </Text>
                            ))}
                        </div>
                    )}
                    {onClear && (
                        <button
                            type="button"
                            onClick={onClear}
                            className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1 hover:underline"
                        >
                            {clearLabel}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
