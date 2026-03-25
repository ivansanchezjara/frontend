"use client";
import { useEffect, useState } from 'react';
import { getProductos } from '@/services/api';
import Link from 'next/link';

export default function InventarioPage() {
    const [productos, setProductos] = useState([]);
    const [busqueda, setBusqueda] = useState(''); // Estado para el buscador
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const data = await getProductos();
                setProductos(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    // Lógica de filtrado: busca por nombre o por código
    const productosFiltrados = productos.filter(prod =>
        prod.nombre_general.toLowerCase().includes(busqueda.toLowerCase()) ||
        prod.general_code.toLowerCase().includes(busqueda.toLowerCase())
    );

    if (loading) return <div className="p-20 text-center font-bold text-slate-600 animate-pulse">Consultando Inventario...</div>;

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-slate-900 text-white p-6 px-12 flex justify-between items-center shadow-lg">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Módulo de Inventario</h1>
                    <Link href="/dashboard" className="text-slate-400 hover:text-white text-xs uppercase font-black tracking-widest transition flex items-center gap-1 mt-1">
                        <span>←</span> VOLVER AL PANEL
                    </Link>
                </div>
                <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-bold transition shadow-md active:scale-95 text-sm">
                    + Nuevo Producto
                </button>
            </header>

            <main className="p-12 max-w-7xl mx-auto">
                {/* BARRA DE HERRAMIENTAS */}
                <div className="mb-6 flex gap-4">
                    <div className="relative flex-1">
                        <span className="absolute left-4 top-3.5 text-slate-400">🔍</span>
                        <input
                            type="text"
                            placeholder="Buscar por nombre o código (ej: THA-21...)"
                            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition shadow-sm"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>
                    <select className="bg-white px-6 rounded-2xl border border-slate-200 font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer">
                        <option>Todas las Categorías</option>
                        <option>Instrumentales</option>
                        <option>Estética</option>
                    </select>
                </div>

                {/* TABLA */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/80 border-b border-slate-200">
                            <tr>
                                <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-wider">Código</th>
                                <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-wider">Producto</th>
                                <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-wider">Categoría</th>
                                <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-wider text-center">Stock</th>
                                <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Precio</th>
                                <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-wider text-center">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {productosFiltrados.length > 0 ? (
                                productosFiltrados.map((prod) => (
                                    <tr key={prod.id} className="hover:bg-blue-50/50 transition-colors group">
                                        <td className="p-5 font-mono text-sm text-blue-600 font-bold tracking-tight">
                                            {prod.general_code}
                                        </td>
                                        <td className="p-5">
                                            <div className="font-bold text-slate-800">{prod.nombre_general}</div>
                                            <div className="text-xs text-slate-400 font-medium">{prod.brand}</div>
                                        </td>
                                        <td className="p-5">
                                            <span className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                                                {prod.categoria?.nombre || 'General'}
                                            </span>
                                        </td>
                                        <td className="p-5 text-center">
                                            <span className={`px-4 py-1.5 rounded-xl text-xs font-black ${prod.variants[0]?.stock > 10
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                                }`}>
                                                {prod.variants[0]?.stock || 0} U.
                                            </span>
                                        </td>
                                        <td className="p-5 text-right font-black text-slate-900 text-lg">
                                            ${prod.variants[0]?.precio_0_publico}
                                        </td>
                                        <td className="p-5 text-center">
                                            <button className="text-slate-300 hover:text-blue-600 transition-colors transform hover:scale-125">
                                                <span className="text-xl">⚙️</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="p-20 text-center text-slate-400 font-medium">
                                        No se encontraron productos que coincidan con "{busqueda}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}