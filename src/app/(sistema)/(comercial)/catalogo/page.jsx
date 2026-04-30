// src/app/(sistema)/catalogo/page.jsx
"use client";
import { useEffect, useState, useMemo } from 'react';
import { getProductos, getCategorias } from '@/services/api';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useDebounce } from '@/hooks/useDebounce';
import Link from 'next/link';
import { Image as ImageIcon } from 'lucide-react';

// UI Components
import SearchBar from '@/components/ui/SearchBar';
import LoadingScreen from '@/components/ui/LoadingScreen';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';

// Catálogo Components
import ProductoCard from '@/components/catalogo/ProductoCard';
import ProductoRow from '@/components/catalogo/ProductoRow';
import Pagination from '@/components/ui/Pagination';

// Normalización para búsqueda sin tildes
const normalizar = (t) => t?.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() || "";

// --- ICONOS ---
function IconGrid() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
        </svg>
    );
}

function IconList() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
    );
}

export default function CatalogoPage() {
    // --- ESTADO ---
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [count, setCount] = useState(0);
    const [page, setPage] = useState(1);
    const pageSize = 24;

    // Filtros
    const [busqueda, setBusqueda] = useState('');
    const busquedaDebounced = useDebounce(busqueda, 400);
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todas');

    // Vista
    const [vista, setVista] = useState('grilla'); // 'grilla' | 'tabla'

    const handleError = useErrorHandler();

    // Cargar Categorías (una sola vez)
    useEffect(() => {
        getCategorias().then(setCategorias).catch(handleError);
    }, [handleError]);

    // Cargar Productos (cuando cambian filtros o página)
    useEffect(() => {
        async function fetchProducts() {
            setLoading(true);
            try {
                const params = {
                    page,
                    search: busquedaDebounced,
                    categoria: categoriaSeleccionada !== 'todas' ? categoriaSeleccionada : undefined
                };
                const data = await getProductos(params);
                setProductos(data.results || []);
                setCount(data.count || 0);
            } catch (err) {
                handleError(err);
            } finally {
                setLoading(false);
            }
        }
        fetchProducts();
    }, [handleError, busquedaDebounced, categoriaSeleccionada, page]);

    // Resetear a página 1 cuando cambia la búsqueda o categoría
    useEffect(() => {
        setPage(1);
    }, [busquedaDebounced, categoriaSeleccionada]);

    if (loading && productos.length === 0) return <LoadingScreen texto="Cargando Catálogo..." />;

    const hayFiltrosActivos = busqueda !== '' || categoriaSeleccionada !== 'todas';

    return (
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">

            {/* HEADER */}
            <PageHeader
                title="Catálogo"
                subtitle={`Master Data · ${count} productos en total`}
                subtitleClassName="text-emerald-600"
            >
                <Link
                    href="/media-manager"
                    className="flex items-center gap-1.5 bg-white text-slate-700 border border-slate-200 px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-50 hover:text-emerald-600 transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                    <ImageIcon size={14} /> MEDIA
                </Link>
                <Link
                    href="/catalogo/nuevo"
                    className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-emerald-700 transition-all shadow-lg active:scale-95 cursor-pointer"
                >
                    + NUEVO PRODUCTO
                </Link>
            </PageHeader>

            <main className="flex-1 overflow-y-auto p-8 min-w-0">
                <div className="max-w-7xl mx-auto space-y-4">

                    {/* BARRA DE HERRAMIENTAS */}
                    <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3 relative z-20">

                        {/* Fila superior: búsqueda + toggle de vista */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <SearchBar
                                    value={busqueda}
                                    onChange={setBusqueda}
                                    placeholder="Buscar por código, nombre o marca..."
                                />
                            </div>

                            {/* Toggle Grilla / Tabla con acento verde */}
                            <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1 shrink-0">
                                <button
                                    id="btn-vista-grilla"
                                    onClick={() => setVista('grilla')}
                                    title="Vista grilla"
                                    className={`flex items-center outline-none focus:outline-none gap-1.5 px-3 py-2 rounded-lg font-bold text-xs transition-all ${vista === 'grilla' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-slate-400 hover:text-emerald-600'}`}
                                >
                                    <IconGrid />
                                    <span className="hidden sm:inline">Grilla</span>
                                </button>
                                <button
                                    id="btn-vista-tabla"
                                    onClick={() => setVista('tabla')}
                                    title="Vista tabla"
                                    className={`flex items-center outline-none focus:outline-none gap-1.5 px-3 py-2 rounded-lg font-bold text-xs transition-all ${vista === 'tabla' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-slate-400 hover:text-emerald-600'}`}
                                >
                                    <IconList />
                                    <span className="hidden sm:inline">Tabla</span>
                                </button>
                            </div>
                        </div>

                        {/* Fila inferior: contador y selector de categoría */}
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setCategoriaSeleccionada('todas')}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${categoriaSeleccionada === 'todas' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                >
                                    TODAS
                                </button>
                                {categorias.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setCategoriaSeleccionada(cat.id.toString())}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${categoriaSeleccionada === cat.id.toString() ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                    >
                                        {cat.nombre}
                                    </button>
                                ))}
                            </div>

                            {/* Contador */}
                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 whitespace-nowrap">
                                <div className={`w-1.5 h-1.5 rounded-full ${count > 0 ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]' : 'bg-slate-300'}`} />
                                {count} {count === 1 ? 'producto' : 'productos'} encontrados
                            </div>
                        </div>
                    </div>

                    {/* CONTENIDO: VACÍO O VISTA */}
                    {productos.length === 0 ? (
                        <EmptyState
                            titulo={hayFiltrosActivos ? "Sin resultados" : "Catálogo vacío"}
                            descripcion={hayFiltrosActivos ? "Intentá con otros términos o cambiá el filtro de categoría." : "Creá tu primer producto para empezar a armar el catálogo."}
                            textoBoton={hayFiltrosActivos ? "Limpiar filtros" : undefined}
                            onAction={hayFiltrosActivos ? () => { setBusqueda(''); setCategoriaSeleccionada('todas'); } : undefined}
                        />
                    ) : vista === 'grilla' ? (

                        /* VISTA GRILLA */
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                            {productos.map(p => (
                                <ProductoCard key={p.id} producto={p} />
                            ))}
                        </div>

                    ) : (

                        /* VISTA TABLA */
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500">
                                        <th className="py-3 pl-6 pr-4 text-[11px] font-black uppercase tracking-widest">Producto</th>
                                        <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">Marca</th>
                                        <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">Categoría</th>
                                        <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest text-center">Variantes</th>
                                        <th className="py-3 pr-6 pl-4"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productos.map(p => (
                                        <ProductoRow key={p.id} producto={p} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* PAGINACIÓN */}
                    {count > pageSize && (
                        <Pagination 
                            count={count}
                            pageSize={pageSize}
                            currentPage={page}
                            onPageChange={setPage}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}