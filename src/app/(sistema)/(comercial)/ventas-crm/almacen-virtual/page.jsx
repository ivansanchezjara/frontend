"use client";
import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { LoadingScreen, PageHeader, SearchBar, Text } from '@/components/ui';
import { useApi } from '@/hooks/useApi';
import { useDebounce } from '@/hooks/useDebounce';
import { getAlmacenVirtual, getDisponibilidadAlmacen } from '@/services/apis/ventas';
import { cn } from '@/lib/utils';
import AlmacenVirtualGrid from '@/components/comercial/ventas/shared/AlmacenVirtualGrid';

// ─── Página de Almacén Virtual ──────────────────────────────────

export default function AlmacenVirtualPage() {
    const {
        data: stockData,
        loading,
        execute: fetchStock,
    } = useApi(getAlmacenVirtual);

    const {
        data: searchData,
        loading: searchLoading,
        execute: fetchDisponibilidad,
    } = useApi(getDisponibilidadAlmacen);

    const [busqueda, setBusqueda] = useState('');
    const busquedaDebounced = useDebounce(busqueda, 400);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    // Carga inicial: todo el stock
    useEffect(() => {
        fetchStock().then(() => setHasLoadedOnce(true));
    }, [fetchStock]);

    // Búsqueda con debounce
    useEffect(() => {
        if (busquedaDebounced) {
            fetchDisponibilidad({ q: busquedaDebounced });
        }
    }, [fetchDisponibilidad, busquedaDebounced]);

    // Determinar qué datos mostrar
    const isSearching = busquedaDebounced.length > 0;
    const items = isSearching ? (searchData || []) : (stockData || []);
    const isLoading = isSearching ? searchLoading : loading;

    // Pantalla de carga inicial
    if (loading && !hasLoadedOnce) {
        return <LoadingScreen texto="Cargando almacén virtual..." />;
    }

    const totalItems = Array.isArray(items) ? items.length : 0;

    // Calcular total de unidades disponibles
    const totalUnidades = Array.isArray(items)
        ? items.reduce((sum, item) => sum + (item.disponible || 0), 0)
        : 0;

    return (
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">

            {/* HEADER */}
            <PageHeader
                title="Almacén Virtual"
                subtitle="Ventas y CRM · Stock en consignación"
                subtitleClassName="text-emerald-600"
            />

            <main className="flex-1 overflow-y-auto p-8 min-w-0">
                <div className="max-w-7xl mx-auto space-y-4">

                    {/* BARRA DE HERRAMIENTAS */}
                    <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3 relative z-20">

                        {/* Búsqueda */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <SearchBar
                                    value={busqueda}
                                    onChange={setBusqueda}
                                    placeholder="Buscar por código o nombre de producto..."
                                />
                            </div>
                        </div>

                        {/* Info de resultados */}
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-4">
                                <Text
                                    variant="label"
                                    className="flex items-center gap-2 text-slate-400 whitespace-nowrap"
                                >
                                    <Package className="w-3.5 h-3.5 text-emerald-500" />
                                    {totalUnidades} {totalUnidades === 1 ? 'unidad' : 'unidades'} disponibles
                                </Text>
                            </div>

                            <Text
                                variant="label"
                                className="flex items-center gap-2 text-slate-400 whitespace-nowrap"
                            >
                                <span className={cn(
                                    'w-1.5 h-1.5 rounded-full',
                                    totalItems > 0 ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]' : 'bg-slate-300'
                                )} />
                                {totalItems} {totalItems === 1 ? 'lote' : 'lotes'}
                                {isSearching && ' encontrados'}
                            </Text>
                        </div>
                    </div>

                    {/* GRID DE STOCK */}
                    <div className={cn(
                        'transition-opacity duration-300',
                        isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'
                    )}>
                        <AlmacenVirtualGrid
                            items={items}
                            loading={isLoading && !hasLoadedOnce}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
