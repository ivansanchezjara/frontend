"use client";
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { Plus, Filter, MapPin, UserCheck, Calendar } from 'lucide-react';
import { EmptyState, LoadingScreen, PageHeader, Pagination, SearchBar, Button, Badge, Text } from '@/components/ui';
import { useApi } from '@/hooks/useApi';
import { useDebounce } from '@/hooks/useDebounce';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { getVentas } from '@/services/apis/ventas';
import { cn } from '@/lib/utils';

// ─── Configuración de estados ───────────────────────────────────

const ESTADOS_VENTA = [
    { value: '', label: 'Todos' },
    { value: 'borrador', label: 'Borrador' },
    { value: 'confirmado', label: 'Confirmado' },
    { value: 'rechazado', label: 'Rechazado' },
];

const ESTADO_BADGE_MAP = {
    borrador: { variant: 'default', label: 'Borrador' },
    confirmado: { variant: 'success', label: 'Confirmado' },
    rechazado: { variant: 'danger', label: 'Rechazado' },
};

// ─── Configuración de orígenes ──────────────────────────────────

const ORIGENES_VENTA = [
    { value: '', label: 'Todos' },
    { value: 'sucursal', label: 'Sucursal' },
    { value: 'campo', label: 'Campo' },
];

const ORIGEN_BADGE_MAP = {
    sucursal: { variant: 'primary', label: 'Sucursal' },
    campo: { variant: 'warning', label: 'Campo' },
};

// ─── Configuración de monedas ───────────────────────────────────

const MONEDA_LABELS = {
    USD: 'USD',
    PYG: 'PYG',
    BRL: 'BRL',
};

const FILTER_SCHEMA = {
    search: '',
    estado: '',
    origen: '',
    vendedor: '',
    fecha_desde: '',
    fecha_hasta: '',
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

// ─── Componente OrigenBadge ─────────────────────────────────────

function OrigenBadge({ origen }) {
    const config = ORIGEN_BADGE_MAP[origen] || { variant: 'default', label: origen };
    return <Badge variant={config.variant}>{config.label}</Badge>;
}

// ─── Formateo de montos ─────────────────────────────────────────

function formatMonto(monto, moneda) {
    if (monto == null) return '—';
    const num = Number(monto);
    if (moneda === 'PYG') {
        return num.toLocaleString('es-PY', { maximumFractionDigits: 0 });
    }
    return num.toLocaleString('es-PY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Contenido Principal ────────────────────────────────────────

function VentasContent() {
    const { filters, setFilter, resetFilters, page, setPage } = useUrlFilters(FILTER_SCHEMA);

    const {
        data: ventasData,
        loading,
        execute: fetchVentas,
    } = useApi(getVentas);

    const ventas = ventasData?.results || [];
    const count = ventasData?.count || 0;
    const pageSize = 24;

    // Debounce para búsqueda y vendedor (inputs de texto)
    const [busquedaLocal, setBusquedaLocal] = useState(filters.search);
    const busquedaDebounced = useDebounce(busquedaLocal, 400);
    const [vendedorLocal, setVendedorLocal] = useState(filters.vendedor);
    const vendedorDebounced = useDebounce(vendedorLocal, 400);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    // Sincronizar debounced → URL
    useEffect(() => {
        if (busquedaDebounced !== filters.search) {
            setFilter('search', busquedaDebounced);
        }
    }, [busquedaDebounced]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (vendedorDebounced !== filters.vendedor) {
            setFilter('vendedor', vendedorDebounced);
        }
    }, [vendedorDebounced]); // eslint-disable-line react-hooks/exhaustive-deps

    // Sincronizar URL → inputs locales
    useEffect(() => { setBusquedaLocal(filters.search); }, [filters.search]);
    useEffect(() => { setVendedorLocal(filters.vendedor); }, [filters.vendedor]);

    // Cargar ventas cuando cambian filtros en URL
    useEffect(() => {
        const params = { page: filters.page };
        if (filters.search) params.search = filters.search;
        if (filters.estado) params.estado = filters.estado;
        if (filters.origen) params.origen = filters.origen;
        if (filters.vendedor) params.vendedor = filters.vendedor;
        if (filters.fecha_desde) params.fecha_desde = filters.fecha_desde;
        if (filters.fecha_hasta) params.fecha_hasta = filters.fecha_hasta;

        fetchVentas(params).then(() => setHasLoadedOnce(true));
    }, [fetchVentas, filters.search, filters.page, filters.estado, filters.origen, filters.vendedor, filters.fecha_desde, filters.fecha_hasta]);

    // Pantalla de carga inicial
    if (loading && !hasLoadedOnce) return <LoadingScreen texto="Cargando ventas..." />;

    const hayFiltrosActivos = filters.search !== '' || filters.estado !== '' || filters.origen !== '' || filters.vendedor !== '' || filters.fecha_desde !== '' || filters.fecha_hasta !== '';

    const limpiarFiltros = () => {
        setBusquedaLocal('');
        setVendedorLocal('');
        resetFilters();
    };

    return (
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">

            {/* HEADER */}
            <PageHeader
                title="Ventas"
                subtitle={`Comercial · ${count} ventas registradas`}
                subtitleClassName="text-emerald-600"
            >
                <Link href="/ventas-crm/ventas/nueva">
                    <Button
                        variant="success"
                        size="md"
                        icon={Plus}
                        className="rounded-xl font-bold text-xs shadow-lg shadow-emerald-100 cursor-pointer"
                    >
                        NUEVA VENTA
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
                                    placeholder="Buscar por cliente o comprobante..."
                                />
                            </div>
                        </div>

                        {/* Fila inferior: filtros + contador */}
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-3 flex-wrap">
                                <FilterDropdown
                                    value={filters.estado}
                                    onChange={(val) => setFilter('estado', val)}
                                    icon={Filter}
                                    label="Estado"
                                    options={ESTADOS_VENTA}
                                />
                                <FilterDropdown
                                    value={filters.origen}
                                    onChange={(val) => setFilter('origen', val)}
                                    icon={MapPin}
                                    label="Origen"
                                    options={ORIGENES_VENTA}
                                />

                                {/* Filtro Vendedor */}
                                <div className="relative flex items-center gap-1.5">
                                    <UserCheck className={cn('w-3.5 h-3.5', vendedorLocal ? 'text-emerald-600' : 'text-slate-400')} />
                                    <input
                                        type="text"
                                        value={vendedorLocal}
                                        onChange={(e) => setVendedorLocal(e.target.value)}
                                        placeholder="Vendedor..."
                                        className={cn(
                                            'text-xs font-semibold rounded-lg px-2 py-1.5 w-32',
                                            'border transition-all outline-none',
                                            vendedorLocal
                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 placeholder:text-slate-400'
                                        )}
                                        aria-label="Filtrar por vendedor"
                                    />
                                </div>

                                {/* Filtro Fecha Desde */}
                                <div className="relative flex items-center gap-1.5">
                                    <Calendar className={cn('w-3.5 h-3.5', filters.fecha_desde ? 'text-emerald-600' : 'text-slate-400')} />
                                    <input
                                        type="date"
                                        value={filters.fecha_desde}
                                        onChange={(e) => setFilter('fecha_desde', e.target.value)}
                                        className={cn(
                                            'text-xs font-semibold rounded-lg px-2 py-1.5',
                                            'border transition-all outline-none',
                                            filters.fecha_desde
                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                                        )}
                                        aria-label="Fecha desde"
                                    />
                                </div>

                                {/* Filtro Fecha Hasta */}
                                <div className="relative flex items-center gap-1.5">
                                    <span className={cn('text-xs', filters.fecha_hasta ? 'text-emerald-600' : 'text-slate-400')}>—</span>
                                    <input
                                        type="date"
                                        value={filters.fecha_hasta}
                                        onChange={(e) => setFilter('fecha_hasta', e.target.value)}
                                        className={cn(
                                            'text-xs font-semibold rounded-lg px-2 py-1.5',
                                            'border transition-all outline-none',
                                            filters.fecha_hasta
                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                                        )}
                                        aria-label="Fecha hasta"
                                    />
                                </div>
                            </div>

                            <Text
                                variant="label"
                                className="flex items-center gap-2 text-slate-400 whitespace-nowrap"
                            >
                                <span className={cn(
                                    'w-1.5 h-1.5 rounded-full',
                                    count > 0 ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]' : 'bg-slate-300'
                                )} />
                                {count} {count === 1 ? 'venta' : 'ventas'}
                            </Text>
                        </div>
                    </div>

                    {/* CONTENIDO: TABLA */}
                    <div className={cn(
                        'transition-opacity duration-300',
                        loading ? 'opacity-50 pointer-events-none' : 'opacity-100'
                    )}>
                        {ventas.length === 0 ? (
                            <EmptyState
                                titulo={hayFiltrosActivos ? "Sin resultados" : "No hay ventas"}
                                descripcion={hayFiltrosActivos
                                    ? "Intentá con otros términos o cambiá los filtros."
                                    : "Creá tu primera venta para empezar a registrar operaciones."
                                }
                                textoBoton={hayFiltrosActivos ? "Limpiar filtros" : undefined}
                                onAction={hayFiltrosActivos ? limpiarFiltros : undefined}
                            />
                        ) : (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500">
                                            <th className="py-3 pl-6 pr-4 text-[11px] font-black uppercase tracking-widest">ID / Comprobante</th>
                                            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">Cliente</th>
                                            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest text-center">Origen</th>
                                            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest text-center">Estado</th>
                                            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest text-right">Total USD</th>
                                            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest text-center">Moneda</th>
                                            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest hidden lg:table-cell">Vendedor</th>
                                            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">Fecha</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ventas.map(venta => (
                                            <tr
                                                key={venta.id}
                                                className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors"
                                            >
                                                <td className="py-3 pl-6 pr-4">
                                                    <Link
                                                        href={`/ventas-crm/ventas/${venta.id}`}
                                                        className="text-sm font-semibold text-slate-800 hover:text-emerald-600 transition-colors"
                                                    >
                                                        {venta.comprobante?.numero
                                                            ? `#${venta.comprobante.numero}`
                                                            : `V-${venta.id}`
                                                        }
                                                    </Link>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-sm text-slate-600">
                                                        {venta.cliente_nombre || venta.cliente?.razon_social || 'Venta mostrador'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <OrigenBadge origen={venta.origen} />
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <EstadoBadge estado={venta.estado} />
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <span className="text-sm font-semibold text-slate-800">
                                                        ${formatMonto(venta.total_usd, 'USD')}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className="text-xs font-mono text-slate-500">
                                                        {MONEDA_LABELS[venta.moneda_negociacion] || venta.moneda_negociacion}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 hidden lg:table-cell">
                                                    <span className="text-sm text-slate-600">
                                                        {venta.vendedor_nombre || venta.vendedor?.username || '—'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-xs text-slate-400">
                                                        {venta.created_at
                                                            ? new Date(venta.created_at).toLocaleDateString('es-PY', {
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

export default function VentasPage() {
    return (
        <Suspense fallback={<LoadingScreen texto="Cargando ventas..." />}>
            <VentasContent />
        </Suspense>
    );
}
