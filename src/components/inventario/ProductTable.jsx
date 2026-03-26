// src/components/inventario/ProductTable.jsx
import { getFullImageUrl } from '@/services/api';

// 1. EXPORTAMOS LAS CONSTANTES (Para limpiar la página principal)
export const COLUMNAS_INVENTARIO = [
    { id: 'foto', label: '📸 Foto' }, { id: 'codigo', label: '🔢 Código' },
    { id: 'producto', label: '📦 Producto' }, { id: 'marca', label: '🏷️ Marca' },
    { id: 'categoria', label: '📂 Categoría' }, { id: 'stock_total', label: '📊 Stock' },
    { id: 'vencimiento', label: '📅 Vencimiento' }, { id: 'precio_publico', label: '💵 Precio USD' },
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
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                        {columnasVisibles.includes('foto') && <th className="w-20 p-5"></th>}
                        {columnasVisibles.includes('codigo') && <th className="w-36 p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Código</th>}
                        {columnasVisibles.includes('producto') && <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Descripción</th>}
                        {columnasVisibles.includes('marca') && <th className="w-32 p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Marca</th>}
                        {columnasVisibles.includes('categoria') && <th className="w-40 p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Categoría</th>}
                        {columnasVisibles.includes('stock_total') && <th className="w-28 p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Stock</th>}
                        {columnasVisibles.includes('vencimiento') && <th className="w-32 p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Vencimiento</th>}
                        {columnasVisibles.includes('precio_publico') && <th className="w-36 p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">P. Público</th>}
                        <th className="w-20 p-5"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {productos.map((prod) => {
                        // 3. EXTRAEMOS LA VARIANTE PRINCIPAL PARA NO REPETIR CÓDIGO
                        const mainVariant = prod.variants?.[0] || {};
                        const stock = mainVariant.stock || 0;
                        const precio = mainVariant.precio_0_publico || 0;
                        const vencimiento = mainVariant.vencimiento || '---';

                        return (
                            <tr key={prod.id} className="hover:bg-blue-50/40 transition-colors group">
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
                                    <td className="p-5">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className={`text-xs font-black ${stock < 10 ? 'text-red-500' : 'text-green-600'}`}>
                                                {stock} U.
                                            </span>
                                            <div className="w-10 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full ${stock < 10 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(stock * 2, 100)}%` }}></div>
                                            </div>
                                        </div>
                                    </td>
                                )}
                                {columnasVisibles.includes('vencimiento') && (
                                    <td className="p-5 text-center font-bold text-[10px] text-amber-600">
                                        {vencimiento !== '---' && '🗓️'} {vencimiento}
                                    </td>
                                )}
                                {columnasVisibles.includes('precio_publico') && (
                                    <td className="p-5 text-right font-black text-slate-900 text-sm">
                                        {formatCurrency(precio)}
                                    </td>
                                )}
                                <td className="p-5 text-center">
                                    <button onClick={() => onSelectProducto(prod)} className="p-2 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer text-lg">
                                        ⚙️
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}