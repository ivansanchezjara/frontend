"use client";
import React from 'react';
import { getFullImageUrl } from '@/services/apis/catalogo.js';
import { DataTable, Text, Badge } from '@/components/ui';

export const COLUMNAS_INVENTARIO = [
    { id: 'foto', label: 'Foto' },
    { id: 'codigo', label: 'Código SKU', required: true },
    { id: 'producto', label: 'Producto / Variante', required: true },
    { id: 'categoria', label: 'Categoría' },
    { id: 'stock', label: 'Disp.' },
    { id: 'consignacion', label: 'Consig.' },
    { id: 'reserva', label: 'Reservado' },
    { id: 'vencido', label: 'Vencido' },
    { id: 'vencimiento', label: 'Vence' },
    { id: 'precio', label: 'Precio USD' },
];

export const COLUMNAS_VISIBLES_POR_DEFECTO = [
    'codigo', 'producto', 'stock', 'consignacion', 'reserva', 'vencido', 'precio'
];

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(amount || 0);
};

/**
 * Definición de columnas para DataTable, usando las mismas funciones render
 * que antes estaban inline en el JSX de ProductTable.
 */
const COLUMNS_CONFIG = [
    {
        key: 'foto',
        label: 'Img',
        resizable: true,
        width: 65,
        minWidth: 65,
        render: (_, row) => (
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm group-hover:scale-110 transition-transform">
                <img
                    src={getFullImageUrl(row.imagen_url)}
                    className="w-full h-full object-contain p-1"
                    alt={row.nombre_variante || "SKU"}
                />
            </div>
        ),
    },
    {
        key: 'codigo',
        label: 'SKU',
        required: true,
        resizable: true,
        width: 140,
        minWidth: 100,
        cellClassName: 'truncate max-w-0',
        render: (_, row) => (
            <Text variant="bodyXs" className="font-mono text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 uppercase truncate inline-block max-w-full group-hover:bg-blue-100 group-hover:border-blue-200 transition-colors">
                {row.product_code}
            </Text>
        ),
    },
    {
        key: 'producto',
        label: 'Descripción / Variante',
        required: true,
        resizable: true,
        width: 280,
        minWidth: 200,
        cellClassName: 'max-w-0',
        render: (_, row) => (
            <>
                <Text variant="bodyXs" className="font-black text-slate-800 truncate leading-tight group-hover:text-blue-600 transition-colors">
                    {row.producto_nombre_general}
                </Text>
                <Text variant="bodyXs" className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate mt-0.5">
                    {row.nombre_variante}
                </Text>
            </>
        ),
    },
    {
        key: 'categoria',
        label: 'Categoría',
        resizable: true,
        width: 120,
        minWidth: 90,
        cellClassName: 'truncate max-w-0',
        render: (_, row) => (
            <Badge className="bg-slate-50 text-slate-400 border border-slate-100 py-1 px-2.5 rounded-full uppercase tracking-widest text-[9px] font-extrabold truncate inline-block max-w-full">
                {row.categoria_nombre}
            </Badge>
        ),
    },
    {
        key: 'stock',
        label: 'Disp.',
        resizable: true,
        width: 60,
        minWidth: 50,
        render: (_, row) => {
            const stock = row.stock || 0;
            return (
                <Badge className={`px-2 py-0.5 rounded text-[10px] font-black border whitespace-nowrap shadow-sm ${
                    stock === 0
                        ? 'bg-rose-50 text-rose-600 border-rose-100'
                        : stock <= 5
                            ? 'bg-amber-50 text-amber-600 border-amber-100'
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                }`}>
                    {stock}
                </Badge>
            );
        },
    },
    {
        key: 'consignacion',
        label: 'Consig.',
        resizable: true,
        width: 70,
        minWidth: 60,
        render: (_, row) => (
            <Badge className={`px-2 py-0.5 rounded text-[10px] font-black border whitespace-nowrap ${
                row.stock_en_consignacion > 0
                    ? 'bg-purple-50 text-purple-600 border-purple-100 font-bold'
                    : 'bg-slate-50 text-slate-300 border-slate-100 opacity-40'
            }`}>
                {row.stock_en_consignacion || 0}
            </Badge>
        ),
    },
    {
        key: 'reserva',
        label: 'Res.',
        resizable: true,
        width: 70,
        minWidth: 60,
        render: (_, row) => (
            <Badge className={`px-2 py-0.5 rounded text-[10px] font-black border whitespace-nowrap ${
                row.stock_reservado > 0
                    ? 'bg-blue-50 text-blue-600 border-blue-100 font-bold'
                    : 'bg-slate-50 text-slate-300 border-slate-100 opacity-40'
            }`}>
                {row.stock_reservado || 0}
            </Badge>
        ),
    },
    {
        key: 'vencido',
        label: 'Venc.',
        resizable: true,
        width: 70,
        minWidth: 60,
        render: (_, row) => (
            <Badge className={`px-2 py-0.5 rounded text-[10px] font-black border whitespace-nowrap ${
                row.stock_vencido > 0
                    ? 'bg-red-50 text-red-600 border-red-100 font-bold'
                    : 'bg-slate-50 text-slate-300 border-slate-100 opacity-40'
            }`}>
                {row.stock_vencido || 0}
            </Badge>
        ),
    },
    {
        key: 'vencimiento',
        label: 'Vence',
        resizable: true,
        width: 90,
        minWidth: 70,
        cellClassName: 'truncate max-w-0',
        render: (_, row) => {
            const stock = row.stock || 0;
            return (
                <Text variant="bodyXs" className="font-black text-[9px] text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${stock > 0 ? 'bg-blue-400' : 'bg-slate-300'}`}></div>
                    {row.vencimiento || '---'}
                </Text>
            );
        },
    },
    {
        key: 'precio',
        label: 'Precio USD',
        resizable: true,
        width: 90,
        minWidth: 70,
        cellClassName: 'font-black text-slate-800 text-xs truncate max-w-0 whitespace-nowrap',
        render: (_, row) => formatCurrency(row.precio_0_publico || 0),
    },
];

/**
 * ProductTable estandarizado — ahora construido sobre DataTable genérico.
 * Mantiene la misma API pública para no romper la página de stock.
 */
export default function ProductTable({ productos, columnasVisibles, onSelectSKU }) {
    // Aplanamos el array de productos para mostrar cada variante (SKU) como una fila
    const skus = productos.flatMap(prod =>
        (prod.variants || []).map(v => ({
            ...v,
            producto_nombre_general: prod.nombre_general,
            categoria_nombre: prod.categoria?.nombre || 'S/C',
            brand: prod.brand,
            imagen_url: v.imagen_variante_url || prod.imagen_principal_url,
            raw_producto: prod,
        }))
    );

    return (
        <DataTable
            columns={COLUMNS_CONFIG}
            data={skus}
            rowKey="id"
            visibleColumns={columnasVisibles}
            onRowClick={(row) => onSelectSKU(row)}
            variant="rounded"
            size="md"
            fixedLayout
            className="select-none"
        />
    );
}
