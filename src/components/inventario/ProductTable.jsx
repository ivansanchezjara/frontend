import { getFullImageUrl } from '@/services/api';
import ResizableHeader from '../ui/ResizableHeader';
import { ArrowRight } from 'lucide-react';

export const COLUMNAS_INVENTARIO = [
    { id: 'foto', label: 'Foto' }, { id: 'codigo', label: 'Código SKU' },
    { id: 'producto', label: 'Producto / Variante' },
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

export default function ProductTable({ productos, columnasVisibles, onSelectSKU }) {

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    // Aplanamos el array de productos para mostrar cada variante (SKU) como una fila
    const skus = productos.flatMap(prod => 
        (prod.variants || []).map(v => ({
            ...v,
            producto_nombre_general: prod.nombre_general,
            categoria_nombre: prod.categoria?.nombre || 'S/C',
            brand: prod.brand,
            imagen_url: v.imagen_variante_url || prod.imagen_principal_url,
            raw_producto: prod // Guardamos el objeto original para el modal de auditoría
        }))
    );

    return (
        <div className="w-full min-w-0 bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
            <div className="w-full overflow-x-auto">
                <table className="w-max min-w-full text-left border-collapse table-fixed">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            {columnasVisibles.includes('foto') && (
                                <ResizableHeader defaultWidth={65} minWidth={65} className="px-3 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    Img
                                </ResizableHeader>
                            )}
                            {columnasVisibles.includes('codigo') && (
                                <ResizableHeader defaultWidth={140} minWidth={100} className="px-3 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    SKU
                                </ResizableHeader>
                            )}
                            {columnasVisibles.includes('producto') && (
                                <ResizableHeader defaultWidth={280} minWidth={200} className="px-3 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    Descripción / Variante
                                </ResizableHeader>
                            )}
                            {columnasVisibles.includes('categoria') && (
                                <ResizableHeader defaultWidth={120} minWidth={90} className="px-3 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    Categoría
                                </ResizableHeader>
                            )}
                            {columnasVisibles.includes('stock') && (
                                <ResizableHeader defaultWidth={80} minWidth={60} className="px-3 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    Disp.
                                </ResizableHeader>
                            )}
                            {columnasVisibles.includes('consignacion') && (
                                <ResizableHeader defaultWidth={90} minWidth={70} className="px-3 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    En Consig.
                                </ResizableHeader>
                            )}
                            {columnasVisibles.includes('reserva') && (
                                <ResizableHeader defaultWidth={100} minWidth={70} className="px-3 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    Reservado
                                </ResizableHeader>
                            )}
                            {columnasVisibles.includes('vencido') && (
                                <ResizableHeader defaultWidth={90} minWidth={60} className="px-3 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    Vencido
                                </ResizableHeader>
                            )}
                            {columnasVisibles.includes('vencimiento') && (
                                <ResizableHeader defaultWidth={100} minWidth={80} className="px-3 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    Vence
                                </ResizableHeader>
                            )}
                            {columnasVisibles.includes('precio') && (
                                <ResizableHeader defaultWidth={110} minWidth={80} className="px-3 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    Precio USD
                                </ResizableHeader>
                            )}
                            <th className="min-w-[60px] px-3 py-4"></th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                        {skus.map((sku) => {
                            const stock = sku.stock || 0;
                            const precio = sku.precio_0_publico || 0;
                            const vencimiento = sku.vencimiento || '---';

                            return (
                                <tr
                                    key={sku.id}
                                    onClick={() => onSelectSKU(sku)}
                                    className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                                >
                                    {columnasVisibles.includes('foto') && (
                                        <td className="px-3 py-2">
                                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm group-hover:scale-110 transition-transform">
                                                <img
                                                    src={getFullImageUrl(sku.imagen_url)}
                                                    className="w-full h-full object-contain p-1"
                                                    alt={sku.nombre_variante || "SKU"}
                                                />
                                            </div>
                                        </td>
                                    )}
                                    {columnasVisibles.includes('codigo') && (
                                        <td className="px-3 py-2 text-left truncate max-w-0">
                                            <span className="font-mono text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 uppercase truncate inline-block max-w-full group-hover:bg-blue-100 group-hover:border-blue-200 transition-colors">
                                                {sku.product_code}
                                            </span>
                                        </td>
                                    )}
                                    {columnasVisibles.includes('producto') && (
                                        <td className="px-3 py-2 max-w-0 text-left">
                                            <div className="text-xs font-black text-slate-800 truncate leading-tight group-hover:text-blue-600 transition-colors">{sku.producto_nombre_general}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate mt-0.5">{sku.nombre_variante}</div>
                                        </td>
                                    )}
                                    {columnasVisibles.includes('categoria') && (
                                        <td className="px-3 py-2 text-left truncate max-w-0">
                                            <span className="text-[9px] font-black text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full uppercase tracking-widest truncate inline-block max-w-full">
                                                {sku.categoria_nombre}
                                            </span>
                                        </td>
                                    )}
                                    {columnasVisibles.includes('stock') && (
                                        <td className="px-3 py-2 text-left">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border whitespace-nowrap shadow-sm ${stock === 0 ? 'bg-rose-50 text-rose-600 border-rose-100' : stock <= 5 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                                {stock} u.
                                            </span>
                                        </td>
                                    )}
                                    {columnasVisibles.includes('consignacion') && (
                                        <td className="px-3 py-2 text-left">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border whitespace-nowrap ${sku.stock_en_consignacion > 0 ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-slate-50 text-slate-300 border-slate-100 opacity-40'}`}>
                                                {sku.stock_en_consignacion || 0} u.
                                            </span>
                                        </td>
                                    )}
                                    {columnasVisibles.includes('reserva') && (
                                        <td className="px-3 py-2 text-left">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border whitespace-nowrap ${sku.stock_reservado > 0 ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-300 border-slate-100 opacity-40'}`}>
                                                {sku.stock_reservado || 0} u.
                                            </span>
                                        </td>
                                    )}
                                    {columnasVisibles.includes('vencido') && (
                                        <td className="px-3 py-2 text-left">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border whitespace-nowrap ${sku.stock_vencido > 0 ? 'bg-red-50 text-red-600 border-red-100 font-bold' : 'bg-slate-50 text-slate-300 border-slate-100 opacity-40'}`}>
                                                {sku.stock_vencido || 0} u.
                                            </span>
                                        </td>
                                    )}
                                    {columnasVisibles.includes('vencimiento') && (
                                        <td className="px-3 py-2 text-left truncate max-w-0">
                                            <span className="font-black text-[9px] text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                                <div className={`w-1.5 h-1.5 rounded-full ${stock > 0 ? 'bg-blue-400' : 'bg-slate-300'}`}></div>
                                                {vencimiento}
                                            </span>
                                        </td>
                                    )}
                                    {columnasVisibles.includes('precio') && (
                                        <td className="px-3 py-2 text-left font-black text-slate-800 text-xs truncate max-w-0 whitespace-nowrap">
                                            {formatCurrency(precio)}
                                        </td>
                                    )}
                                    <td className="px-2 py-2 text-right">
                                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                            <ArrowRight size={14} />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}