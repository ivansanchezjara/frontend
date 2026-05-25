"use client";
import { EmptyState, LoadingScreen, PageHeader, Pagination, SearchBar, Button, Text } from '@/components/ui';
import { useEffect, useState } from 'react';
import { getProductos } from '@/services/apis/catalogo.js';
import { useApi } from '@/hooks/useApi';
import { useDebounce } from '@/hooks/useDebounce';
import Link from 'next/link';
import { Image as ImageIcon, LayoutGrid, List, Globe, Star } from 'lucide-react';

// Catálogo Components
import ProductoCard from '@/components/comercial/catalogo/list/ProductoCard';
import ProductoRow from '@/components/comercial/catalogo/list/ProductoRow';

// Opciones de filtro
const FILTER_OPTIONS = [
    { value: '', label: 'Todos' },
    { value: 'true', label: 'Sí' },
    { value: 'false', label: 'No' },
];

function FilterDropdown({ value, onChange, icon: Icon, label, options = FILTER_OPTIONS }) {
    const isActive = value !== '';
    return (
        <div className="relative flex items-center gap-1.5">
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`
                    appearance-none text-xs font-semibold rounded-lg px-2 py-1.5 pr-6 cursor-pointer
                    border transition-all outline-none
                    ${isActive
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                    }
                `}
                aria-label={label}
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>
                        {label}: {opt.label}
                    </option>
                ))}
            </select>
            <div className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2">
                <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </div>
    );
}

export default function CatalogoPage() {
    // --- API & DATA ---

    const {
        data: prodData,
        loading: loadingProds,
        execute: fetchProducts
    } = useApi(getProductos);

    // Helpers para acceder a la data de productos
    const productos = prodData?.results || [];
    const count = prodData?.count || 0;

    const pageSize = 24;
    const [page, setPage] = useState(1);

    const [busqueda, setBusqueda] = useState('');
    const busquedaDebounced = useDebounce(busqueda, 400);

    // Filtros de visibilidad
    const [filtroPublicado, setFiltroPublicado] = useState('');
    const [filtroDestacado, setFiltroDestacado] = useState('');

    // Vista
    const [vista, setVista] = useState('grilla'); // 'grilla' | 'tabla'

    // Estado para saber si ya se cargó la data inicial al menos una vez
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    // Cargar Productos (cuando cambian filtros o página)
    useEffect(() => {
        const params = {
            page,
            search: busquedaDebounced,
        };
        if (filtroPublicado) params.is_published = filtroPublicado;
        if (filtroDestacado) params.featured = filtroDestacado;

        fetchProducts(params).then(() => setHasLoadedOnce(true));
    }, [fetchProducts, busquedaDebounced, page, filtroPublicado, filtroDestacado]);

    // Resetear a página 1 cuando cambia la búsqueda o filtros
    useEffect(() => {
        setPage(1);
    }, [busquedaDebounced, filtroPublicado, filtroDestacado]);

    // Pantalla de carga inicial (solo la primera vez que entra a la página)
    const isInitialLoading = loadingProds && !hasLoadedOnce;
    if (isInitialLoading) return <LoadingScreen texto="Cargando Catálogo..." />;

    const hayFiltrosActivos = busqueda !== '' || filtroPublicado !== '' || filtroDestacado !== '';

    const limpiarFiltros = () => {
        setBusqueda('');
        setFiltroPublicado('');
        setFiltroDestacado('');
    };

    // Callback para actualizar el estado local cuando se hace toggle inline
    const handleInlineToggle = (slug, field, newValue) => {
        // No necesitamos refetch — el optimistic update en ProductoRow ya maneja el UI
    };

    return (
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">

            {/* HEADER */}
            <PageHeader
                title="Catálogo"
                subtitle={`Master Data · ${count} productos en total`}
                subtitleClassName="text-emerald-600"
            >
                <Link href="/media-manager">
                    <Button
                        variant="outline"
                        icon={ImageIcon}
                        size="md"
                        className="rounded-xl font-bold text-xs hover:text-emerald-600 hover:border-emerald-200 cursor-pointer"
                    >
                        MEDIA
                    </Button>
                </Link>
                <Link href="/catalogo/nuevo">
                    <Button
                        variant="success"
                        size="md"
                        className="rounded-xl font-bold text-xs shadow-lg shadow-emerald-100 cursor-pointer"
                    >
                        + NUEVO PRODUCTO
                    </Button>
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
                                <Button
                                    id="btn-vista-grilla"
                                    onClick={() => setVista('grilla')}
                                    title="Vista grilla"
                                    variant={vista === 'grilla' ? 'success' : 'ghost'}
                                    size="sm"
                                    icon={LayoutGrid}
                                    className={`rounded-lg ${vista === 'grilla' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50 shadow-sm' : 'text-slate-400 hover:text-emerald-600 hover:bg-transparent'}`}
                                >
                                    <span className="hidden sm:inline">Grilla</span>
                                </Button>
                                <Button
                                    id="btn-vista-tabla"
                                    onClick={() => setVista('tabla')}
                                    title="Vista tabla"
                                    variant={vista === 'tabla' ? 'success' : 'ghost'}
                                    size="sm"
                                    icon={List}
                                    className={`rounded-lg ${vista === 'tabla' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50 shadow-sm' : 'text-slate-400 hover:text-emerald-600 hover:bg-transparent'}`}
                                >
                                    <span className="hidden sm:inline">Tabla</span>
                                </Button>
                            </div>
                        </div>

                        {/* Fila inferior: filtros + contador */}
                        <div className="flex items-center justify-between gap-4 flex-wrap">

                            {/* Filtros de visibilidad */}
                            <div className="flex items-center gap-3">
                                <FilterDropdown
                                    value={filtroPublicado}
                                    onChange={setFiltroPublicado}
                                    icon={Globe}
                                    label="Web"
                                />
                                <FilterDropdown
                                    value={filtroDestacado}
                                    onChange={setFiltroDestacado}
                                    icon={Star}
                                    label="Destacado"
                                />
                            </div>

                            {/* Contador */}
                            <Text
                                variant="label"
                                className="flex items-center gap-2 text-slate-400 whitespace-nowrap"
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${count > 0 ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]' : 'bg-slate-300'}`} />
                                {count} {count === 1 ? 'producto' : 'productos'} encontrados
                            </Text>
                        </div>
                    </div>

                    {/* CONTENIDO: VACÍO O VISTA */}
                    <div className={`transition-opacity duration-300 ${loadingProds ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                        {productos.length === 0 ? (
                            <EmptyState
                                titulo={hayFiltrosActivos ? "Sin resultados" : "Catálogo vacío"}
                                descripcion={hayFiltrosActivos ? "Intentá con otros términos o cambiá los filtros." : "Creá tu primer producto para empezar a armar el catálogo."}
                                textoBoton={hayFiltrosActivos ? "Limpiar filtros" : undefined}
                                onAction={hayFiltrosActivos ? limpiarFiltros : undefined}
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
                                            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest text-center hidden md:table-cell">Web</th>
                                            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest text-center hidden md:table-cell">Destacado</th>
                                            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest text-center">Variantes</th>
                                            <th className="py-3 pr-6 pl-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {productos.map(p => (
                                            <ProductoRow key={p.id} producto={p} onToggle={handleInlineToggle} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

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
