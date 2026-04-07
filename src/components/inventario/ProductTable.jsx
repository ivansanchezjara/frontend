// src/components/inventario/ProductTable.jsx
import { getFullImageUrl } from '@/services/api';
import ResizableHeader from '../ui/ResizableHeader';

export const COLUMNAS_INVENTARIO = [
    { id: 'foto', label: 'Foto' }, { id: 'codigo', label: 'Código' },
    { id: 'producto', label: 'Producto' },
    { id: 'categoria', label: 'Categoría' }, { id: 'stock_total', label: 'Stock' },
    { id: 'vencimiento', label: 'Vencimiento' }, { id: 'precio_publico', label: 'Precio USD' },
];

export const COLUMNAS_VISIBLES_POR_DEFECTO = [
    'codigo', 'producto', 'stock_total', 'precio_publico'
];

export default function ProductTable({ productos, columnasVisibles, onSelectProducto }) {

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    return (
        <div className="w-full min-w-0 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="w-full overflow-x-auto">
                <table className="w-max min-w-full text-left border-collapse table-fixed">
                    <thead className="bg-slate-50/90 backdrop-blur border-b border-slate-200">
                        <tr>
                            {columnasVisibles.includes('foto') && (
                                <ResizableHeader defaultWidth={65} minWidth={65} className="px-3 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                    Img
                                </ResizableHeader>
                            )}
                            {columnasVisibles.includes('codigo') && (
                                <ResizableHeader defaultWidth={110} minWidth={90} className="px-3 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                    Código
                                </ResizableHeader>
                            )}
                            {columnasVisibles.includes('producto') && (
                                <ResizableHeader defaultWidth={200} minWidth={200} className="px-3 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                    Descripción
                                </ResizableHeader>
                            )}
                            {columnasVisibles.includes('categoria') && (
                                <ResizableHeader defaultWidth={120} minWidth={90} className="px-3 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                    Categoría
                                </ResizableHeader>
                            )}
                            {columnasVisibles.includes('stock_total') && (
                                <ResizableHeader defaultWidth={80} minWidth={80} className="px-3 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                    Stock
                                </ResizableHeader>
                            )}
                            {columnasVisibles.includes('vencimiento') && (
                                <ResizableHeader defaultWidth={100} minWidth={80} className="px-3 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                    Vence
                                </ResizableHeader>
                            )}
                            {columnasVisibles.includes('precio_publico') && (
                                <ResizableHeader defaultWidth={100} minWidth={80} className="px-3 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                    Precio
                                </ResizableHeader>
                            )}
                            <th className="min-w-[60px] px-3 py-2.5"></th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                        {productos.map((prod) => {
                            const mainVariant = prod.variants?.[0] || {};
                            const stock = mainVariant.stock || 0;
                            const precio = mainVariant.precio_0_publico || 0;
                            const vencimiento = mainVariant.vencimiento || '---';

                            return (
                                <tr
                                    key={prod.id}
                                    onClick={() => onSelectProducto(prod)}
                                    className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                                >
                                    {columnasVisibles.includes('foto') && (
                                        <td className="px-3 py-1.5">
                                            <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-left justify-left overflow-hidden shadow-sm">
                                                <img
                                                    src={getFullImageUrl(prod.imagen_principal_url)}
                                                    className="w-full h-full object-contain p-0.5"
                                                    alt={prod.nombre_general || "Producto"}
                                                />
                                            </div>
                                        </td>
                                    )}
                                    {columnasVisibles.includes('codigo') && (
                                        <td className="px-3 py-1.5 text-left truncate max-w-0">
                                            <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 uppercase truncate inline-block max-w-full">
                                                {prod.general_code}
                                            </span>
                                        </td>
                                    )}
                                    {columnasVisibles.includes('producto') && (
                                        <td className="px-3 py-1.5 max-w-0 text-left">
                                            <div className="text-xs font-semibold text-slate-800 truncate leading-tight">{prod.nombre_general}</div>
                                            <div className="text-[9px] font-medium text-slate-400 uppercase tracking-tight truncate mt-0.5">{prod.brand}</div>
                                        </td>
                                    )}
                                    {columnasVisibles.includes('categoria') && (
                                        <td className="px-3 py-1.5 text-left truncate max-w-0">
                                            <span className="text-[9px] font-semibold text-slate-500 border border-slate-200 px-2 py-0.5 rounded bg-white truncate inline-block max-w-full">
                                                {prod.categoria?.nombre || 'S/C'}
                                            </span>
                                        </td>
                                    )}
                                    {columnasVisibles.includes('stock_total') && (
                                        <td className="px-3 py-1.5 text-left">
                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight border whitespace-nowrap ${stock === 0 ? 'bg-red-50 text-red-600 border-red-100' : stock <= 10 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                                {stock}
                                            </span>
                                        </td>
                                    )}
                                    {columnasVisibles.includes('vencimiento') && (
                                        <td className="px-3 py-1.5 text-left truncate max-w-0">
                                            <span className="font-medium text-[10px] text-slate-500 whitespace-nowrap">
                                                {vencimiento}
                                            </span>
                                        </td>
                                    )}
                                    {columnasVisibles.includes('precio_publico') && (
                                        <td className="px-3 py-1.5 text-left font-bold text-slate-800 text-xs truncate max-w-0 whitespace-nowrap">
                                            {formatCurrency(precio)}
                                        </td>
                                    )}
                                    <td className="px-2 py-1.5 text-center">
                                        <div className="text-slate-300 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mx-auto">
                                                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                            </svg>
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