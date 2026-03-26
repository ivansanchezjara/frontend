"use client";
import { useEffect, useState, useMemo } from 'react';
import { getProductos, getCategorias } from '@/services/api';
import { getFullImageUrl } from '@/services/api';

export default function InventarioPage() {
    const [productos, setProductos] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [loading, setLoading] = useState(true);

    // NUEVO: Estados para manejar las categorías reales de Django
    const [categorias, setCategorias] = useState([]);
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todas');

    const [productoSeleccionado, setProductoSeleccionado] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                // ACTUALIZADO: Traemos Productos y Categorías al mismo tiempo
                const [dataProductos, dataCategorias] = await Promise.all([
                    getProductos(),
                    getCategorias()
                ]);

                setProductos(dataProductos);
                setCategorias(dataCategorias || []); // Guardamos las categorías
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    // 🧠 Usamos useMemo para que la tabla reaccione INSTANTÁNEAMENTE al escribir
    const productosFiltrados = useMemo(() => {
        return productos.filter(prod => {
            // 1. Filtro por texto (Nombre, Código o Marca)
            const busquedaLower = busqueda.toLowerCase();
            const coincideTexto =
                prod.nombre_general?.toLowerCase().includes(busquedaLower) ||
                prod.general_code?.toLowerCase().includes(busquedaLower) ||
                prod.brand?.toLowerCase().includes(busquedaLower);

            // 2. Filtro por categoría
            const coincideCategoria =
                categoriaSeleccionada === 'Todas' ||
                prod.categoria?.nombre === categoriaSeleccionada;

            return coincideTexto && coincideCategoria;
        });
    }, [productos, busqueda, categoriaSeleccionada]);

    if (loading) return (
        <div className="flex-1 flex items-center justify-center">
            <div className="p-20 text-center font-bold text-slate-400 animate-pulse text-xl">
                Cargando base de datos...
            </div>
        </div>
    );

    return (
        <>
            {/* HEADER */}
            <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-10">
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Módulo de Inventario</h2>
                <button className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-500/20 active:scale-95">
                    + NUEVO PRODUCTO
                </button>
            </header>

            <main className="p-10 max-w-7xl mx-auto w-full relative">
                {/* BARRA DE HERRAMIENTAS */}
                <div className="mb-6 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <span className="absolute left-4 top-3.5 text-slate-400">🔍</span>
                        <input
                            type="text"
                            placeholder="Buscar por nombre o código..."
                            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition shadow-sm font-medium text-slate-800"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>

                    {/* ACTUALIZADO: El Select ahora se llena solo con los datos de Django */}
                    <select
                        value={categoriaSeleccionada}
                        onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                        className="bg-white px-6 py-3 rounded-2xl border border-slate-200 font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer"
                    >
                        <option value="Todas">Todas las Categorías</option>
                        {categorias.map((cat) => (
                            <option key={cat.id || cat.nombre} value={cat.nombre}>
                                {cat.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                {/* TABLA PRINCIPAL */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/80 border-b border-slate-200">
                            <tr>
                                <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-wider">Código</th>
                                <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-wider">Producto</th>
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
                                            <div className="text-xs text-slate-400 font-medium uppercase">{prod.brand}</div>
                                        </td>
                                        <td className="p-5 text-center">
                                            <span className={`px-4 py-1.5 rounded-xl text-xs font-black ${prod.variants[0]?.stock > 10 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {prod.variants[0]?.stock || 0} U.
                                            </span>
                                        </td>
                                        <td className="p-5 text-right font-black text-slate-900 text-lg">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(prod.variants[0]?.precio_0_publico || 0)}
                                        </td>
                                        <td className="p-5 text-center">
                                            <button
                                                onClick={() => setProductoSeleccionado(prod)}
                                                className="text-slate-300 hover:text-blue-600 transition-colors transform hover:scale-125 cursor-pointer"
                                            >
                                                <span className="text-xl">⚙️</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                /* NUEVO: Mensaje si el filtro no encuentra nada */
                                <tr>
                                    <td colSpan="5" className="p-20 text-center text-slate-400 font-medium">
                                        No se encontraron productos con esos filtros.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* PANEL LATERAL FLOTANTE (SLIDE-OVER) */}
            {productoSeleccionado && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity"
                    onClick={() => setProductoSeleccionado(null)}
                ></div>
            )}

            <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${productoSeleccionado ? 'translate-x-0' : 'translate-x-full'}`}>

                {productoSeleccionado && (
                    <>
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Detalle de Producto</h3>
                                <p className="font-mono text-blue-600 font-bold mt-1">{productoSeleccionado.general_code}</p>
                            </div>
                            <button
                                onClick={() => setProductoSeleccionado(null)}
                                className="w-8 h-8 flex items-center justify-center bg-slate-200 text-slate-500 hover:bg-red-100 hover:text-red-500 rounded-full font-bold transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="w-full aspect-square bg-slate-50 rounded-3xl mb-6 border border-slate-200 flex items-center justify-center overflow-hidden relative p-8 shadow-inner">
                                {productoSeleccionado.imagen_principal_url ? (
                                    <img
                                        src={getFullImageUrl(productoSeleccionado.imagen_principal_url)}
                                        alt={productoSeleccionado.nombre_general}
                                        /* CAMBIO CLAVE: object-contain para que no se corte y p-4 para que no toque los bordes */
                                        className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 hover:scale-110"
                                    />
                                ) : (
                                    <div className="text-slate-400 font-medium text-sm flex flex-col items-center gap-2">
                                        <span className="text-4xl">📸</span>
                                        <span>Sin imagen disponible</span>
                                    </div>
                                )}
                            </div>

                            <h2 className="text-2xl font-black text-slate-900 mb-1">{productoSeleccionado.nombre_general}</h2>
                            <span className="inline-block bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-lg uppercase tracking-wider mb-6">
                                Marca: {productoSeleccionado.brand} | Cat: {productoSeleccionado.categoria?.nombre || 'S/C'}
                            </span>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Descripción</h4>
                                    <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                        {productoSeleccionado.description || "Sin descripción detallada en el sistema."}
                                    </p>
                                </div>

                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Stock Total (Variantes)</h4>
                                    <div className="text-3xl font-black text-blue-700">
                                        {productoSeleccionado.variants[0]?.stock || 0} <span className="text-sm font-bold text-blue-500">unidades</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-white grid grid-cols-2 gap-3">
                            <button className="py-3 rounded-xl font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                                Editar Datos
                            </button>
                            <button className="py-3 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all">
                                Ver Lotes
                            </button>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}