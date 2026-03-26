"use client";
import { useEffect, useState, useMemo } from 'react';
import { getProductos, getCategorias, getFullImageUrl } from '@/services/api';

// Componentes Reutilizables
import SearchBar from '@/components/ui/SearchBar';
import ColumnSelector from '@/components/ui/ColumnSelector';

export default function InventarioPage() {
    // --- ESTADOS ---
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todas');
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [mostrarMenuColumnas, setMostrarMenuColumnas] = useState(false);

    // Columnas visibles por defecto
    const [columnasVisibles, setColumnasVisibles] = useState([
        'foto', 'codigo', 'producto', 'stock_total', 'precio_publico'
    ]);

    const opcionesColumnas = [
        { id: 'foto', label: '📸 Foto' },
        { id: 'codigo', label: '🔢 Código' },
        { id: 'producto', label: '📦 Producto' },
        { id: 'marca', label: '🏷️ Marca' },
        { id: 'categoria', label: '📂 Categoría' },
        { id: 'stock_total', label: '📊 Stock' },
        { id: 'vencimiento', label: '📅 Vencimiento' },
        { id: 'precio_publico', label: '💵 Precio USD' },
    ];

    // --- CARGA DE DATOS ---
    useEffect(() => {
        async function fetchData() {
            try {
                const [p, c] = await Promise.all([getProductos(), getCategorias()]);
                setProductos(p);
                setCategorias(c || []);
            } catch (err) {
                console.error("Error en inventario:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    // --- FILTRADO INTELIGENTE (SIN ACENTOS) ---
    const productosFiltrados = useMemo(() => {
        const normalizar = (t) => t?.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() || "";
        const bNormalizada = normalizar(busqueda);
        const palabras = bNormalizada.split(' ').filter(p => p !== '');

        return productos.filter(prod => {
            const coincideCat = categoriaSeleccionada === 'Todas' || prod.categoria?.nombre === categoriaSeleccionada;
            if (!coincideCat) return false;
            if (palabras.length === 0) return true;

            const contenido = normalizar(`${prod.nombre_general} ${prod.general_code} ${prod.brand} ${prod.categoria?.nombre || ''}`);
            return palabras.every(p => contenido.includes(p));
        });
    }, [productos, busqueda, categoriaSeleccionada]);

    const toggleColumna = (id) => {
        setColumnasVisibles(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
    };

    if (loading) return (
        <div className="flex-1 flex items-center justify-center bg-slate-50">
            <div className="text-center animate-pulse">
                <div className="w-12 h-12 bg-blue-600 rounded-xl mx-auto mb-4 flex items-center justify-center font-black text-white text-2xl">T</div>
                <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Cargando Thalys ERP...</p>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
            {/* HEADER */}
            <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 shrink-0 z-10">
                <div>
                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Inventario</h2>
                    <p className="text-[10px] font-bold text-blue-600 uppercase">Control de Existencias</p>
                </div>
                <button className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-blue-600 transition-all shadow-lg active:scale-95 cursor-pointer">
                    + NUEVO PRODUCTO
                </button>
            </header>

            <main className="flex-1 overflow-y-auto p-8">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* BARRA DE HERRAMIENTAS MODULAR */}
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <SearchBar
                            value={busqueda}
                            onChange={setBusqueda}
                            placeholder="Buscar por código, nombre o marca..."
                        />

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Categoría</label>
                            <select
                                value={categoriaSeleccionada}
                                onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                                className="bg-white px-6 py-3.5 rounded-2xl border border-slate-200 font-bold text-slate-600 outline-none shadow-sm cursor-pointer hover:border-slate-300 transition-all"
                            >
                                <option value="Todas">Todas</option>
                                {categorias.map(cat => <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>)}
                            </select>
                        </div>

                        <ColumnSelector
                            opciones={opcionesColumnas}
                            visibles={columnasVisibles}
                            onToggle={toggleColumna}
                            isOpen={mostrarMenuColumnas}
                            setIsOpen={setMostrarMenuColumnas}
                        />
                    </div>

                    <div className="px-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        {productosFiltrados.length} Resultados encontrados
                    </div>

                    {/* TABLA DINÁMICA */}
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left border-collapse table-fixed">
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
                                {productosFiltrados.map((prod) => {
                                    const stock = prod.variants[0]?.stock || 0;
                                    return (
                                        <tr key={prod.id} className="hover:bg-blue-50/40 transition-colors group">
                                            {columnasVisibles.includes('foto') && (
                                                <td className="p-3">
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-105 transition-transform">
                                                        <img src={getFullImageUrl(prod.imagen_principal_url)} className="w-full h-full object-contain p-2" alt="thumb" />
                                                    </div>
                                                </td>
                                            )}
                                            {columnasVisibles.includes('codigo') && (
                                                <td className="p-5 text-center">
                                                    <span className="font-mono text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 uppercase">{prod.general_code}</span>
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
                                                    <span className="text-[10px] font-bold text-slate-500 border border-slate-200 px-3 py-1 rounded-full bg-white">{prod.categoria?.nombre || 'S/C'}</span>
                                                </td>
                                            )}
                                            {columnasVisibles.includes('stock_total') && (
                                                <td className="p-5">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className={`text-xs font-black ${stock < 10 ? 'text-red-500' : 'text-green-600'}`}>{stock} U.</span>
                                                        <div className="w-10 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className={`h-full ${stock < 10 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(stock * 2, 100)}%` }}></div>
                                                        </div>
                                                    </div>
                                                </td>
                                            )}
                                            {columnasVisibles.includes('vencimiento') && (
                                                <td className="p-5 text-center font-bold text-[10px] text-amber-600">🗓️ {prod.variants[0]?.vencimiento || '---'}</td>
                                            )}
                                            {columnasVisibles.includes('precio_publico') && (
                                                <td className="p-5 text-right font-black text-slate-900 text-sm">
                                                    ${prod.variants[0]?.precio_0_publico || '0.00'}
                                                </td>
                                            )}
                                            <td className="p-5 text-center">
                                                <button onClick={() => setProductoSeleccionado(prod)} className="p-2 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer text-lg">⚙️</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* PANEL LATERAL (SLIDE-OVER) */}
            {productoSeleccionado && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity" onClick={() => setProductoSeleccionado(null)} />
            )}

            <aside className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-500 flex flex-col ${productoSeleccionado ? 'translate-x-0' : 'translate-x-full'}`}>
                {productoSeleccionado && (
                    <>
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ficha Técnica</h3>
                                <p className="font-mono text-blue-600 font-bold mt-1">{productoSeleccionado.general_code}</p>
                            </div>
                            <button onClick={() => setProductoSeleccionado(null)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-red-500 rounded-2xl transition-all shadow-sm cursor-pointer">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            <div className="w-full aspect-square bg-white rounded-[2.5rem] border border-slate-100 flex items-center justify-center p-12 shadow-inner relative group overflow-hidden">
                                <img src={getFullImageUrl(productoSeleccionado.imagen_principal_url)} alt="img" className="w-full h-full object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-110" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-slate-900 leading-tight">{productoSeleccionado.nombre_general}</h2>
                                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase">{productoSeleccionado.categoria?.nombre}</span>
                            </div>
                            <p className="text-sm text-slate-500 leading-relaxed font-medium">{productoSeleccionado.description}</p>
                        </div>
                    </>
                )}
            </aside>
        </div>
    );
}