"use client";
import { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { Plus, Users, Filter } from 'lucide-react';
import { EmptyState, LoadingScreen, PageHeader, Pagination, SearchBar, Button, Badge, Text } from '@/components/ui';
import { useApi } from '@/hooks/useApi';
import { useDebounce } from '@/hooks/useDebounce';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { getProspectos } from '@/services/apis/ventas';
import { cn } from '@/lib/utils';

// ─── Configuración de estados ───────────────────────────────────

const ESTADOS_PROSPECTO = [
    { value: '', label: 'Todos' },
    { value: 'nuevo', label: 'Nuevo' },
    { value: 'contactado', label: 'Contactado' },
    { value: 'calificado', label: 'Calificado' },
    { value: 'convertido', label: 'Convertido' },
    { value: 'descartado', label: 'Descartado' },
];

const ESTADO_BADGE_MAP = {
    nuevo: { variant: 'primary', label: 'Nuevo' },
    contactado: { variant: 'warning', label: 'Contactado' },
    calificado: { variant: 'success', label: 'Calificado' },
    convertido: { variant: 'info', label: 'Convertido' },
    descartado: { variant: 'danger', label: 'Descartado' },
};

const FILTER_SCHEMA = {
    search: '',
    estado: '',
    vendedor: '',
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

// ─── Contenido Principal (usa useSearchParams internamente) ─────

function ProspectosContent() {
    const { filters, setFilter, resetFilters, page, setPage } = useUrlFilters(FILTER_SCHEMA);

    const {
        data: prospectosData,
        loading,
        execute: fetchProspectos,
    } = useApi(getProspectos);

    const prospectos = prospectosData?.results || [];
    const count = prospectosData?.count || 0;
    const pageSize = 24;

    // Debounce solo para el input de búsqueda (evitar fetch en cada keystroke)
    const [busquedaLocal, setBusquedaLocal] = useState(filters.search);
    const busquedaDebounced = useDebounce(busquedaLocal, 400);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    // Sincronizar búsqueda debounced → URL
    useEffect(() => {
        if (busquedaDebounced !== filters.search) {
            setFilter('search', busquedaDebounced);
        }
    }, [busquedaDebounced]); // eslint-disable-line react-hooks/exhaustive-deps

    // Sincronizar URL → input local (para cuando se navega con back/forward)
    useEffect(() => {
        setBusquedaLocal(filters.search);
    }, [filters.search]);

    // Cargar prospectos cuando cambian filtros en URL
    useEffect(() => {
        const params = { page: filters.page };
        if (filters.search) params.search = filters.search;
        if (filters.estado) params.estado = filters.estado;
        if (filters.vendedor) params.vendedor = filters.vendedor;

        fetchProspectos(params).then(() => setHasLoadedOnce(true));
    }, [fetchProspectos, filters.search, filters.page, filters.estado, filters.vendedor]);

    // Pantalla de carga inicial
    if (loading && !hasLoadedOnce) return <LoadingScreen texto="Cargando prospectos..." />;

    const hayFiltrosActivos = filters.search !== '' || filters.estado !== '' || filters.vendedor !== '';

    const limpiarFiltros = () => {
        setBusquedaLocal('');
        resetFilters();
    };

    return (
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">

            {/* HEADER */}
            <PageHeader
                title="Prospectos"
                subtitle={`CRM · ${count} prospectos en total`}
                subtitleClassName="text-emerald-600"
            >
                <Link href="/ventas-crm/prospectos/nuevo">
                    <Button
                        variant="success"
                        size="md"
                        icon={Plus}
                        className="rounded-xl font-bold text-xs shadow-lg shadow-emerald-100 cursor-pointer"
                    >
                        NUEVO PROSPECTO
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
                                    placeholder="Buscar por nombre de prospecto..."
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
                                    options={ESTADOS_PROSPECTO}
                                />
                                <FilterDropdown
                                    value={filters.vendedor}
                                    onChange={(val) => setFilter('vendedor', val)}
                                    icon={Users}
                                    label="Vendedor"
                                    options={[{ value: '', label: 'Todos' }]}
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
                                {count} {count === 1 ? 'prospecto' : 'prospectos'} encontrados
                            </Text>
                        </div>
                    </div>

                    {/* CONTENIDO: TABLA */}
                    <div className={cn(
                        'transition-opacity duration-300',
                        loading ? 'opacity-50 pointer-events-none' : 'opacity-100'
                    )}>
                        {prospectos.length === 0 ? (
                            <EmptyState
                                titulo={hayFiltrosActivos ? "Sin resultados" : "No hay prospectos"}
                                descripcion={hayFiltrosActivos
                                    ? "Intentá con otros términos o cambiá los filtros."
                                    : "Registrá tu primer prospecto para empezar a gestionar oportunidades."
                                }
                                textoBoton={hayFiltrosActivos ? "Limpiar filtros" : undefined}
                                onAction={hayFiltrosActivos ? limpiarFiltros : undefined}
                            />
                        ) : (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500">
                                            <th className="py-3 pl-6 pr-4 text-[11px] font-black uppercase tracking-widest">Nombre</th>
                                            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">Contacto</th>
                                            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">Empresa</th>
                                            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest text-center">Estado</th>
                                            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">Vendedor</th>
                                            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">Fecha</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {prospectos.map(prospecto => (
                                            <tr
                                                key={prospecto.id}
                                                className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors"
                                            >
                                                <td className="py-3 pl-6 pr-4">
                                                    <Link
                                                        href={`/ventas-crm/prospectos/${prospecto.id}`}
                                                        className="text-sm font-semibold text-slate-800 hover:text-emerald-600 transition-colors"
                                                    >
                                                        {prospecto.nombre}
                                                    </Link>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex flex-col gap-0.5">
                                                        {prospecto.telefono && (
                                                            <span className="text-xs text-slate-600">{prospecto.telefono}</span>
                                                        )}
                                                        {prospecto.correo_electronico && (
                                                            <span className="text-xs text-slate-400">{prospecto.correo_electronico}</span>
                                                        )}
                                                        {!prospecto.telefono && !prospecto.correo_electronico && (
                                                            <span className="text-xs text-slate-300 italic">Sin contacto</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-sm text-slate-600">
                                                        {prospecto.empresa || '—'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <EstadoBadge estado={prospecto.estado} />
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-sm text-slate-600">
                                                        {prospecto.vendedor_nombre || prospecto.vendedor?.username || '—'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-xs text-slate-400">
                                                        {prospecto.created_at
                                                            ? new Date(prospecto.created_at).toLocaleDateString('es-PY', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                year: 'numeric',
                                                            })
                                                            : '—'
                                                        }
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

export default function ProspectosPage() {
    return (
        <Suspense fallback={<LoadingScreen texto="Cargando prospectos..." />}>
            <ProspectosContent />
        </Suspense>
    );
}
