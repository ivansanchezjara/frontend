// src/components/inventario/ProductTable.jsx
import { getFullImageUrl } from '@/services/api';

// 1. EXPORTAMOS LAS CONSTANTES (Para limpiar la página principal)
export const COLUMNAS_INVENTARIO = [
    { id: 'foto', label: 'Foto' }, { id: 'codigo', label: 'Código' },
    { id: 'producto', label: 'Producto' }, { id: 'marca', label: 'Marca' },
    { id: 'categoria', label: 'Categoría' }, { id: 'stock_total', label: 'Stock' },
    { id: 'vencimiento', label: 'Vencimiento' }, { id: 'precio_publico', label: 'Precio USD' },
];

export const COLUMNAS_VISIBLES_POR_DEFECTO = [
    'foto', 'codigo', 'producto', 'stock_total', 'precio_publico'
];

export default function ProductTable({ productos, columnasVisibles, onSelectProducto }) {

    // 2. FORMATEADOR DE MONEDA PRO
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
                    <thead className="bg-slate-50/80 backdrop-blur border-b border-slate-200">
                        <tr>
                            {columnasVisibles.includes('foto') && <th className="w-20 p-4"></th>}
                            {columnasVisibles.includes('codigo') && <th className="w-32 p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Código</th>}
                            {columnasVisibles.includes('producto') && <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Descripción</th>}
                            {columnasVisibles.includes('marca') && <th className="w-32 p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Marca</th>}
                            {columnasVisibles.includes('categoria') && <th className="w-40 p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Categoría</th>}
                            {columnasVisibles.includes('stock_total') && <th className="w-28 p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Stock</th>}
                            {columnasVisibles.includes('vencimiento') && <th className="w-32 p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Vencimiento</th>}
                            {columnasVisibles.includes('precio_publico') && <th className="w-36 p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">P. Público</th>}
                            <th className="w-16 p-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {productos.map((prod) => {
                        // 3. EXTRAEMOS LA VARIANTE PRINCIPAL PARA NO REPETIR CÓDIGO
                        const mainVariant = prod.variants?.[0] || {};
                        const stock = mainVariant.stock || 0;
                        const precio = mainVariant.precio_0_publico || 0;
                        const vencimiento = mainVariant.vencimiento || '---';

                        return (
                            <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors group cursor-default">
                                {columnasVisibles.includes('foto') && (
                                    <td className="p-3">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-105 transition-transform">
                                            <img
                                                src={getFullImageUrl(prod.imagen_principal_url)}
                                                className="w-full h-full object-contain p-2"
                                                alt={prod.nombre_general || "Producto"}
                                            />
                                        </div>
                                    </td>
                                )}
                                {columnasVisibles.includes('codigo') && (
                                    <td className="p-5 text-center">
                                        <span className="font-mono text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 uppercase">
                                            {prod.general_code}
                                        </span>
                                    </td>
                                )}
                                {columnasVisibles.includes('producto') && (
                                    <td className="p-5">
                                        <div className="text-sm font-bold text-slate-800 line-clamp-1">{prod.nombre_general}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{prod.brand}</div>
                                    </td>
                                )}
                                {columnasVisibles.includes('marca') && (
                                    <td className="p-5 text-center font-black text-[10px] text-slate-400 uppercase">{prod.brand}</td>
                                )}
                                {columnasVisibles.includes('categoria') && (
                                    <td className="p-5 text-center">
                                        <span className="text-[10px] font-bold text-slate-500 border border-slate-200 px-3 py-1 rounded-full bg-white">
                                            {prod.categoria?.nombre || 'S/C'}
                                        </span>
                                    </td>
                                )}
                                {columnasVisibles.includes('stock_total') && (
                                    <td className="p-5 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider border ${stock === 0 ? 'bg-red-50 text-red-600 border-red-100' : stock <= 10 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                            {stock} U.
                                        </span>
                                    </td>
                                )}
                                {columnasVisibles.includes('vencimiento') && (
                                    <td className="p-5 text-center">
                                        <span className="font-bold text-[11px] text-slate-500 tracking-tight">
                                           {vencimiento}
                                        </span>
                                    </td>
                                )}
                                {columnasVisibles.includes('precio_publico') && (
                                    <td className="p-5 text-right font-black text-slate-900 text-sm">
                                        {formatCurrency(precio)}
                                    </td>
                                )}
                                <td className="p-5 text-center">
                                    <button onClick={() => onSelectProducto(prod)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                        </svg>
                                    </button>
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