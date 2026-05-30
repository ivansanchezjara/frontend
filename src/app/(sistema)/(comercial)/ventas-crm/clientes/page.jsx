"use client";
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { Search, Building2, UserCheck, Plus } from 'lucide-react';
import { EmptyState, LoadingScreen, PageHeader, Pagination, SearchBar, Button, Text } from '@/components/ui';
import { useConfirm } from '@/components/ui';
import { useToast } from '@/components/ui';
import { useApi } from '@/hooks/useApi';
import { useDebounce } from '@/hooks/useDebounce';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { getClientes, desactivarCliente, reactivarCliente } from '@/services/apis/ventas';
import { cn } from '@/lib/utils';

// ─── Configuración de tiers ─────────────────────────────────────

const TIER_OPTIONS = [
    { value: '', label: 'Todos' },
    { value: 'publico', label: 'Público' },
    { value: 'estudiante', label: 'Estudiante' },
    { value: 'reventa', label: 'Reventa' },
    { value: 'mayorista', label: 'Mayorista' },
    { value: 'intercompany', label: 'Intercompany' },
];

const TIER_BADGE_STYLES = {
    publico: 'bg-slate-100 text-slate-700',
    estudiante: 'bg-blue-100 text-blue-700',
    reventa: 'bg-emerald-100 text-emerald-700',
    mayorista: 'bg-purple-100 text-purple-700',
    intercompany: 'bg-amber-100 text-amber-700',
};

const TIER_LABELS = {
    publico: 'Público',
    estudiante: 'Estudiante',
    reventa: 'Reventa',
    mayorista: 'Mayorista',
    intercompany: 'Intercompany',
};

const FILTER_SCHEMA = {
    search: '',
    ruc: '',
    tier_precio: '',
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

// ─── Contenido Principal ────────────────────────────────────────

function ClientesContent() {
    const { showToast } = useToast();
    const { danger, confirm } = useConfirm();
    const { filters, setFilter, resetFilters, page, setPage } = useUrlFilters(FILTER_SCHEMA);

    // --- API & DATA ---
    const {
        data: clientesData,
        loading: loadingClientes,
        execute: fetchClientes
    } = useApi(getClientes);

    const clientes = clientesData?.results || [];
    const count = clientesData?.count || 0;
    const pageSize = 24;

    // Debounce para inputs de texto
    const [busquedaLocal, setBusquedaLocal] = useState(filters.search);
    const busquedaDebounced = useDebounce(busquedaLocal, 400);
    const [rucLocal, setRucLocal] = useState(filters.ruc);
    const rucDebounced = useDebounce(rucLocal, 400);
    const [vendedorLocal, setVendedorLocal] = useState(filters.vendedor);
    const vendedorDebounced = useDebounce(vendedorLocal, 400);

    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    // Sincronizar debounced → URL
    useEffect(() => {
        if (busquedaDebounced !== filters.search) setFilter('search', busquedaDebounced);
    }, [busquedaDebounced]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (rucDebounced !== filters.ruc) setFilter('ruc', rucDebounced);
    }, [rucDebounced]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (vendedorDebounced !== filters.vendedor) setFilter('vendedor', vendedorDebounced);
    }, [vendedorDebounced]); // eslint-disable-line react-hooks/exhaustive-deps

    // Sincronizar URL → inputs locales
    useEffect(() => { setBusquedaLocal(filters.search); }, [filters.search]);
    useEffect(() => { setRucLocal(filters.ruc); }, [filters.ruc]);
    useEffect(() => { setVendedorLocal(filters.vendedor); }, [filters.vendedor]);

    // Cargar clientes cuando cambian filtros en URL
    useEffect(() => {
        const params = { page: filters.page };
        if (filters.search) params.search = filters.search;
        if (filters.ruc) params.ruc = filters.ruc;
        if (filters.tier_precio) params.tier_precio = filters.tier_precio;
        if (filters.vendedor) params.vendedor_responsable = filters.vendedor;

        fetchClientes(params).then(() => setHasLoadedOnce(true));
    }, [fetchClientes, filters.search, filters.ruc, filters.tier_precio, filters.vendedor, filters.page]);

    // --- Acciones ---
    const handleDesactivar = async (cliente) => {
        const confirmed = await danger(
            `¿Estás seguro de desactivar al cliente "${cliente.razon_social}"? El cliente no podrá realizar compras hasta ser reactivado.`,
            'Desactivar cliente',
            { confirmText: 'Desactivar' }
        );
        if (!confirmed) return;

        try {
            await desactivarCliente(cliente.id);
            showToast('Cliente desactivado correctamente', 'success');
            fetchClientes({ page: filters.page });
        } catch (err) {
            showToast('Error al desactivar el cliente', 'error');
        }
    };

    const handleReactivar = async (cliente) => {
        const confirmed = await confirm(
            `¿Deseas reactivar al cliente "${cliente.razon_social}"?`,
            'Reactivar cliente',
            { confirmText: 'Reactivar' }
        );
        if (!confirmed) return;

        try {
            await reactivarCliente(cliente.id);
            showToast('Cliente reactivado correctamente', 'success');
            fetchClientes({ page: filters.page });
        } catch (err) {
            showToast('Error al reactivar el cliente', 'error');
        }
    };

    // --- Loading inicial ---
    const isInitialLoading = loadingClientes && !hasLoadedOnce;
    if (isInitialLoading) return <LoadingScreen texto="Cargando clientes..." />;

    const hayFiltrosActivos = filters.search !== '' || filters.ruc !== '' || filters.tier_precio !== '' || filters.vendedor !== '';

    const limpiarFiltros = () => {
        setBusquedaLocal('');
        setRucLocal('');
        setVendedorLocal('');
        resetFilters();
    };

    return (
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">

            {/* HEADER */}
            <PageHeader
                title="Clientes"
                subtitle={`CRM · ${count} clientes registrados`}
                subtitleClassName="text-emerald-600"
            >
                <Link href="/ventas-crm/clientes/nuevo">
                    <Button
                        variant="success"
                        size="md"
                        icon={Plus}
                        className="rounded-xl font-bold text-xs shadow-lg shadow-emerald-100 cursor-pointer"
                    >
                        NUEVO CLIENTE
                    </Button>
                </Link>
            </PageHeader>

            <main className="flex-1 overflow-y-auto p-8 min-w-0">
                <div className="max-w-7xl mx-auto space-y-4">

                    {/* BARRA DE HERRAMIENTAS */}
                    <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3 relative z-20">

                        {/* Fila superior: búsqueda por razón social */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <SearchBar
                                    value={busquedaLocal}
                                    onChange={setBusquedaLocal}
                                    placeholder="Buscar por razón social..."
                                />
                            </div>
                        </div>

                        {/* Fila inferior: filtros */}
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-3 flex-wrap">
                                {/* Filtro RUC */}
                                <div className="relative flex items-center gap-1.5">
                                    <Search className={cn('w-3.5 h-3.5', rucLocal ? 'text-emerald-600' : 'text-slate-400')} />
                                    <input
                                        type="text"
                                        value={rucLocal}
                                        onChange={(e) => setRucLocal(e.target.value)}
                                        placeholder="RUC..."
                                        className={cn(
                                            'text-xs font-semibold rounded-lg px-2 py-1.5 w-32',
                                            'border transition-all outline-none',
                                            rucLocal
                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 placeholder:text-slate-400'
                                        )}
                                        aria-label="Filtrar por RUC"
                                    />
                                </div>

                                {/* Filtro Tier */}
                                <FilterDropdown
                                    value={filters.tier_precio}
                                    onChange={(val) => setFilter('tier_precio', val)}
                                    icon={Building2}
                                    label="Tier"
                                    options={TIER_OPTIONS}
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
                            </div>

                            {/* Contador */}
                            <Text
                                variant="label"
                                className="flex items-center gap-2 text-slate-400 whitespace-nowrap"
                            >
                                <span className={cn(
                                    'w-1.5 h-1.5 rounded-full',
                                    count > 0 ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]' : 'bg-slate-300'
                                )} />
                                {count} {count === 1 ? 'cliente' : 'clientes'}
                            </Text>
                        </div>
                    </div>

                    {/* CONTENIDO */}
                    <div className={cn(
                        'transition-opacity duration-300',
                        loadingClientes ? 'opacity-50 pointer-events-none' : 'opacity-100'
                    )}>
                        {clientes.length === 0 ? (
                            <EmptyState
                                titulo={hayFiltrosActivos ? "Sin resultados" : "Sin clientes"}
                                descripcion={hayFiltrosActivos ? "Intentá con otros términos o cambiá los filtros." : "Registrá tu primer cliente para empezar."}
                                textoBoton={hayFiltrosActivos ? "Limpiar filtros" : undefined}
                                onAction={hayFiltrosActivos ? limpiarFiltros : undefined}
                            />
                        ) : (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500">
                                            <th className="py-3 pl-6 pr-4 text-[11px] font-black uppercase tracking-widest">Razón Social</th>
                                            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest hidden md:table-cell">RUC</th>
                                            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest hidden md:table-cell">Teléfono</th>
                                            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest text-center">Tier</th>
                                            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest hidden lg:table-cell">Vendedor</th>
                                            <th className="py-3 pr-6 pl-4 text-[11px] font-black uppercase tracking-widest text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clientes.map(cliente => (
                                            <tr
                                                key={cliente.id}
                                                className={cn(
                                                    'border-t border-slate-100 hover:bg-slate-50/50 transition-colors',
                                                    !cliente.activo && 'opacity-50'
                                                )}
                                            >
                                                <td className="py-3 pl-6 pr-4">
                                                    <Link
                                                        href={`/ventas-crm/clientes/${cliente.id}`}
                                                        className="text-sm font-semibold text-slate-800 hover:text-emerald-600 transition-colors"
                                                    >
                                                        {cliente.razon_social}
                                                    </Link>
                                                    {cliente.nombre_comercial && (
                                                        <p className="text-xs text-slate-400 mt-0.5">{cliente.nombre_comercial}</p>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 hidden md:table-cell">
                                                    <span className="text-xs font-mono text-slate-600">
                                                        {cliente.ruc || '—'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 hidden md:table-cell">
                                                    <span className="text-xs text-slate-600">
                                                        {cliente.telefono}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className={cn(
                                                        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                                                        TIER_BADGE_STYLES[cliente.tier_precio] || 'bg-slate-100 text-slate-700'
                                                    )}>
                                                        {TIER_LABELS[cliente.tier_precio] || cliente.tier_precio}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 hidden lg:table-cell">
                                                    <span className="text-xs text-slate-600">
                                                        {cliente.vendedor_responsable_nombre || cliente.vendedor_responsable || '—'}
                                                    </span>
                                                </td>
                                                <td className="py-3 pr-6 pl-4 text-right">
                                                    {cliente.activo ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDesactivar(cliente)}
                                                            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            Desactivar
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleReactivar(cliente)}
                                                            className="text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                        >
                                                            Reactivar
                                                        </Button>
                                                    )}
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

export default function ClientesPage() {
    return (
        <Suspense fallback={<LoadingScreen texto="Cargando clientes..." />}>
            <ClientesContent />
        </Suspense>
    );
}
