// src/app/inventario/page.jsx (o la ruta donde lo tengas)
"use client";
import { useEffect, useState, useMemo } from 'react';
import { getProductos } from '@/services/api'; // Solo pedimos productos
import { useErrorHandler } from '@/hooks/useErrorHandler';

// --- COMPONENTES IMPORTADOS ---
import SearchBar from '@/components/ui/SearchBar';
import ColumnSelector from '@/components/ui/ColumnSelector';
import LoadingScreen from '@/components/ui/LoadingScreen';
import ProductTable, { COLUMNAS_INVENTARIO, COLUMNAS_VISIBLES_POR_DEFECTO } from '@/components/inventario/ProductTable';
import ProductDetailPanel from '@/components/inventario/ProductDetailPanel';
import EmptyState from '@/components/ui/EmptyState';
import { useDebounce } from '@/hooks/useDebounce';

// Función ultra rápida afuera del componente
const normalizar = (t) => t?.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() || "";

export default function InventarioPage() {
    // --- ESTADOS ---
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);

    // Búsqueda fluida
    const [busqueda, setBusqueda] = useState('');
    const busquedaRetrasada = useDebounce(busqueda, 400);

    // Interfaz
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [mostrarMenuColumnas, setMostrarMenuColumnas] = useState(false);
    const [columnasVisibles, setColumnasVisibles] = useState(COLUMNAS_VISIBLES_POR_DEFECTO);
    const handleError = useErrorHandler();

    // --- CARGA DE DATOS (Optimizada) ---
    useEffect(() => {
        async function fetchData() {
            try {
                // Ya no pedimos categorías, carga mucho más rápido
                const p = await getProductos();
                setProductos(p || []);
            } catch (err) {
                handleError(err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [handleError]);

    // --- FILTRADO INTELIGENTE (Ahora sí funciona el Debounce) ---
    const productosFiltrados = useMemo(() => {
        const bNormalizada = normalizar(busquedaRetrasada);
        const palabras = bNormalizada.split(' ').filter(p => p !== '');

        if (palabras.length === 0) return productos;

        return productos.filter(prod => {
            const contenido = normalizar(`${prod.nombre_general} ${prod.general_code} ${prod.brand} ${prod.categoria?.nombre || ''}`);
            return palabras.every(p => contenido.includes(p));
        });
    }, [productos, busquedaRetrasada]); // 🚀 ¡Dependencia corregida!

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

            <main className="flex-1 overflow-y-auto p-8 min-w-0">
                <div className="max-w-7xl mx-auto space-y-4">
                    {/* BARRA DE HERRAMIENTAS */}
                    <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-2 relative z-20">
                        <div className="flex flex-row items-center gap-3 w-full">

                            {/* Buscador */}
                            <div className="flex-1">
                                <SearchBar
                                    value={busqueda}
                                    onChange={setBusqueda}
                                    placeholder="Buscar por código, nombre o categoría..."
                                />
                            </div>


                            <div className="shrink-0">
                                <ColumnSelector
                                    opciones={COLUMNAS_INVENTARIO}
                                    visibles={columnasVisibles}
                                    onToggle={toggleColumna}
                                    isOpen={mostrarMenuColumnas}
                                    setIsOpen={setMostrarMenuColumnas}
                                />
                            </div>
                        </div>


                        <div className="flex items-center gap-2 px-2 text-[11px] font-bold text-slate-400 whitespace-nowrap">
                            <div className={`w-1.5 h-1.5 rounded-full ${productosFiltrados.length > 0 ? 'bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]' : 'bg-slate-300'}`}></div>
                            {productosFiltrados.length} Resultados
                        </div>

                    </div>

                    {/* ESTADO VACÍO O TABLA */}
                    {productosFiltrados.length === 0 ? (
                        <EmptyState
                            titulo="No se encontraron productos"
                            descripcion="Intenta buscar con otros términos."
                            textoBoton="Limpiar Búsqueda"
                            onAction={() => setBusqueda('')}
                        />
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