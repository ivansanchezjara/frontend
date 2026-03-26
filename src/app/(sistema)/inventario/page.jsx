"use client";
import { useEffect, useState, useMemo } from 'react';
import { getProductos, getCategorias } from '@/services/api';
import { useErrorHandler } from '@/hooks/useErrorHandler';

// --- COMPONENTES IMPORTADOS ---
import SearchBar from '@/components/ui/SearchBar';
import ColumnSelector from '@/components/ui/ColumnSelector';
import LoadingScreen from '@/components/ui/LoadingScreen';
import ProductTable, { COLUMNAS_INVENTARIO, COLUMNAS_VISIBLES_POR_DEFECTO } from '@/components/inventario/ProductTable';
import ProductDetailPanel from '@/components/inventario/ProductDetailPanel';
import CategoryFilter from '@/components/ui/CategoryFilter';

export default function InventarioPage() {
    // --- ESTADOS ---
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todas');
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [mostrarMenuColumnas, setMostrarMenuColumnas] = useState(false);
    const handleError = useErrorHandler();
    const [columnasVisibles, setColumnasVisibles] = useState(COLUMNAS_VISIBLES_POR_DEFECTO);

    // --- CARGA DE DATOS ---
    useEffect(() => {
        async function fetchData() {
            try {
                const [p, c] = await Promise.all([getProductos(), getCategorias()]);
                setProductos(p);
                setCategorias(c || []);
            } catch (err) {
                handleError(err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [handleError]);

    // --- FILTRADO INTELIGENTE ---
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

    // --- RENDER ---
    if (loading) return <LoadingScreen texto="Cargando Inventario..." />;

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
                    {/* BARRA DE HERRAMIENTAS */}
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar por código, nombre o marca..." />

                        <CategoryFilter
                            categorias={categorias}
                            value={categoriaSeleccionada}
                            onChange={setCategoriaSeleccionada}
                        />

                        <ColumnSelector
                            opciones={COLUMNAS_INVENTARIO}
                            visibles={columnasVisibles}
                            onToggle={toggleColumna}
                            isOpen={mostrarMenuColumnas}
                            setIsOpen={setMostrarMenuColumnas}
                        />
                    </div>

                    <div className="px-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        {productosFiltrados.length} Resultados encontrados
                    </div>

                    {/* 2. 🚀 ESTADO VACÍO (Empty State) O TABLA */}
                    {productosFiltrados.length === 0 ? (
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-16 text-center flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
                            <span className="text-6xl mb-4">🔍</span>
                            <h3 className="text-xl font-black text-slate-900 mb-2">No se encontraron productos</h3>
                            <p className="text-slate-500 font-medium text-sm max-w-sm mx-auto">
                                Intenta buscar con otros términos o cambia la categoría seleccionada.
                            </p>
                            <button
                                onClick={() => { setBusqueda(''); setCategoriaSeleccionada('Todas'); }}
                                className="mt-6 px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 hover:text-slate-900 transition-colors text-xs uppercase tracking-widest"
                            >
                                Limpiar Filtros
                            </button>
                        </div>
                    ) : (
                        <ProductTable
                            productos={productosFiltrados}
                            columnasVisibles={columnasVisibles}
                            onSelectProducto={setProductoSeleccionado}
                        />
                    )}
                </div>
            </main>

            {/* COMPONENTE PANEL LATERAL */}
            <ProductDetailPanel
                producto={productoSeleccionado}
                onClose={() => setProductoSeleccionado(null)}
            />
        </div>
    );
}