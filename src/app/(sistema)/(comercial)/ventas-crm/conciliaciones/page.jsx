"use client";
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { Plus, Filter } from 'lucide-react';
import { EmptyState, LoadingScreen, PageHeader, Pagination, SearchBar, Button, Badge, Text } from '@/components/ui';
import { useApi } from '@/hooks/useApi';
import { useDebounce } from '@/hooks/useDebounce';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { getConciliaciones } from '@/services/apis/ventas';
import { cn } from '@/lib/utils';

// ─── Configuración de estados ───────────────────────────────────

const ESTADOS_CONCILIACION = [
    { value: '', label: 'Todos' },
    { value: 'borrador', label: 'Borrador' },
    { value: 'confirmado', label: 'Confirmado' },
    { value: 'rechazado', label: 'Rechazado' },
];

const ESTADO_BADGE_MAP = {
    borrador: { variant: 'warning', label: 'Borrador' },
    confirmado: { variant: 'success', label: 'Confirmado' },
    rechazado: { variant: 'danger', label: 'Rechazado' },
};

const FILTER_SCHEMA = {
    search: '',
    estado: '',
    page: 1,
};

// ─── Componente FilterDropdown ──────────────────────────────────

function FilterDropdown({ value, onChange, icon: Icon, label, options }) {
    const isActive = value !== '';
    return (
        <div className="relative flex items-center gap-1.5">
            <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-emerald-600' : 'text-slate-400')} />
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={cn(
                    'appearance-none text-xs font-semibold rounded-lg px-2 py-1.5 pr-6 cursor-pointer',
                    'border transition-all outline-none',
                    isActive
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                )}
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

// ─── Componente EstadoBadge ─────────────────────────────────────

function EstadoBadge({ estado }) {
    const config = ESTADO_BADGE_MAP[estado] || { variant: 'default', label: estado };
    return <Badge variant={config.variant}>{config.label}</Badge>;
}

// ─── Helpers ────────────────────────────────────────────────────

function formatFecha(fechaStr) {
    if (!fechaStr) return '—';
    return new Date(fechaStr).toLocaleDateString('es-PY', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

function formatMonto(monto, moneda) {
    if (monto == null || monto === 0) return '—';
    const num = Number(monto);
    if (moneda === 'PYG') {
        return `₲ ${num.toLocaleString('es-PY', { maximumFractionDigits: 0 })}`;
    }
    if (moneda === 'BRL') {
        return `R$ ${num.toLocaleString('es-PY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$ ${num.toLocaleString('es-PY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Contenido Principal ────────────────────────────────────────

function ConciliacionesContent() {
    const { filters, setFilter, resetFilters, page, setPage } = useUrlFilters(FILTER_SCHEMA);

    const {
        data: conciliacionesData,
        loading,
        execute: fetchConciliaciones,
    } = useApi(getConciliaciones);

    const conciliaciones = conciliacionesData?.results || [];
    const count = conciliacionesData?.count || 0;
    const pageSize = 24;

    // Debounce para búsqueda
    const [busquedaLocal, setBusquedaLocal] = useState(filters.search);
    const busquedaDebounced = useDebounce(busquedaLocal, 400);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    // Sincronizar debounced → URL
    useEffect(() => {
        if (busquedaDebounced !== filters.search) {
            setFilter('search', busquedaDebounced);
        }
    }, [busquedaDebounced]); // eslint-disable-line react-hooks/exhaustive-deps

    // Sincronizar URL → input local
    useEffect(() => { setBusquedaLocal(filters.search); }, [filters.search]);

    // Cargar conciliaciones cuando cambian filtros en URL
    useEffect(() => {
        const params = { page: filters.page };
        if (filters.search) params.search = filters.search;
        if (filters.estado) params.estado = filters.estado;

        fetchConciliaciones(params).then(() => setHasLoadedOnce(true));
    }, [fetchConciliaciones, filters.search, filters.page, filters.estado]);

    // Pantalla de carga inicial
    if (loading && !hasLoadedOnce) return <LoadingScreen texto="Cargando conciliaciones..." />;

    const hayFiltrosActivos = filters.search !== '' || filters.estado !== '';

    const limpiarFiltros = () => {
        setBusquedaLocal('');
        resetFilters();
    };

    return (
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">

            {/* HEADER */}
            <PageHeader
                title="Conciliaciones"
                subtitle={`Comercial · ${count} conciliaciones registradas`}
                subtitleClassName="text-emerald-600"
            >
                <Link href="/ventas-crm/conciliaciones/nueva">
                    <Button
                        variant="success"
                        size="md"
                        icon={Plus}
                        className="rounded-xl font-bold text-xs shadow-lg shadow-emerald-100 cursor-pointer"
                    >
                        NUEVA CONCILIACIÓN
                    </Button>
                </Link>
            </PageHeader>

            <main className="flex-1 overflow-y-auto p-8 min-w-0">
                <div className="max-w-7xl mx-auto space-y-4">

                    {/* BARRA DE HERRAMIENTAS */}
                    <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3 relative z-20">

                        {/* Fila superior: búsqueda */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <SearchBar
                                    value={busquedaLocal}
                                    onChange={setBusquedaLocal}
                                    placeholder="Buscar por vendedor..."
                                />
                            </div>
                        </div>

                        {/* Fila inferior: filtros + contador */}
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-3">
                                <FilterDropdown
                                    value={filters.estado}
                                    onChange={(val) => setFilter('estado', val)}
                                    icon={Filter}
                                    label="Estado"
                                    options={ESTADOS_CONCILIACION}
                                />
                            </div>

                            <Text
                                variant="label"
                                className="flex items-center gap-2 text-slate-400 whitespace-nowrap"
                            >
                                <span className={cn(
                                    'w-1.5 h-1.5 rounded-full',
                                    count > 0 ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]' : 'bg-slate-300'
                                )} />
                                {count} {count === 1 ? 'conciliación' : 'conciliaciones'}
                            </Text>
                        </div>
                    </div>

                    {/* CONTENIDO: TABLA */}
                    <div className={cn(
                        'transition-opacity duration-300',
                        loading ? 'opacity-50 pointer-events-none' : 'opacity-100'
                    )}>
                        {conciliaciones.length === 0 ? (
                            <EmptyState
                                titulo={hayFiltrosActivos ? "Sin resultados" : "No hay conciliaciones"}
                                descripcion={hayFiltrosActivos
                                    ? "Intentá con otros términos o cambiá los filtros."
                                    : "Creá una conciliación para cerrar el período de un vendedor de campo."
                                }
                                textoBoton={hayFiltrosActivos ? "Limpiar filtros" : undefined}
                                onAction={hayFiltrosActivos ? limpiarFiltros : undefined}
                            />
                        ) : (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500">
                                            <th className="py-3 pl-6 pr-4 text-[11px] font-black uppercase tracking-widest">ID</th>
                                            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">Vendedor</th>
                                            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest text-center">Estado</th>
                                            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest text-right">Entregado USD</th>
                                            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest text-right">Entregado PYG</th>
                                            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest text-right">Entregado BRL</th>
                                            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">Creado</th>
                                            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">Confirmado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {conciliaciones.map(conciliacion => (
                                            <tr
                                                key={conciliacion.id}
                                                className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors"
                                            >
                                                <td className="py-3 pl-6 pr-4">
                                                    <Link
                                                        href={`/ventas-crm/conciliaciones/${conciliacion.id}`}
                                                        className="text-sm font-semibold text-slate-800 hover:text-emerald-600 transition-colors"
                                                    >
                                                        #{conciliacion.id}
                                                    </Link>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-sm text-slate-600">
                                                        {conciliacion.vendedor_nombre || conciliacion.vendedor?.username || '—'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <EstadoBadge estado={conciliacion.estado} />
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <span className="text-sm font-medium text-slate-700">
                                                        {formatMonto(conciliacion.monto_entregado_usd, 'USD')}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <span className="text-sm font-medium text-slate-700">
                                                        {formatMonto(conciliacion.monto_entregado_pyg, 'PYG')}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <span className="text-sm font-medium text-slate-700">
                                                        {formatMonto(conciliacion.monto_entregado_brl, 'BRL')}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-xs text-slate-400">
                                                        {formatFecha(conciliacion.created_at)}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-xs text-slate-400">
                                                        {formatFecha(conciliacion.confirmed_at)}
                                                    </span>
                                                </td>
                                            </tr>
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

// ─── Página con Suspense (requerido por useSearchParams) ────────

export default function ConciliacionesPage() {
    return (
        <Suspense fallback={<LoadingScreen texto="Cargando conciliaciones..." />}>
            <ConciliacionesContent />
        </Suspense>
    );
}
