"use client";
import { EmptyState, LoadingScreen, PageHeader, Pagination, Badge, Heading, Text } from '@/components/ui';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Package, User, Calendar, Plus, MapPin, Clock, Truck } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useDebounce } from '@/hooks/useDebounce';
import { getConsignaciones } from '@/services/apis/movimientos';
import MovimientosFilterBar from '@/components/movimientos/MovimientosFilterBar';
import { useToast } from "@/components/ui/feedback/ToastContext";
import { useConfirm } from "@/components/ui/feedback/ConfirmContext";

export default function ConsignacionesPage() {
    const { confirm } = useConfirm();
    const { showToast } = useToast();

    // Estados de filtros y paginación
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 500);
    const [filters, setFilters] = useState({
        fecha_inicio: '',
        fecha_fin: '',
        estado: ''
    });
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 24;

    const { data: consignacionesData, loading, execute: fetchConsignaciones } = useApi(getConsignaciones, {
        auto: false,
        initialData: { results: [], count: 0 }
    });

    // Cargar datos cuando cambian los filtros o la página
    useEffect(() => {
        fetchConsignaciones({
            page,
            search: debouncedSearch,
            ...filters
        });
    }, [page, debouncedSearch, filters, fetchConsignaciones]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPage(1);
    };

    const consignaciones = consignacionesData?.results || [];
    const totalCount = consignacionesData?.count || 0;

    return (
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
            <PageHeader
                breadcrumbs={[
                    { label: 'Gestión de Movimientos', href: '/movimientos' },
                    { label: 'Consignaciones' }
                ]}
                subtitle={
                    <>
                        <Package size={12} />
                        Gestioná mercadería enviada a clientes en calidad de préstamo o consignación.
                    </>
                }
            >
                <Link
                    href="/movimientos/consignaciones/nuevo"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 px-6 rounded-xl shadow-lg shadow-blue-100 transition-all flex items-center gap-2 uppercase text-[10px] tracking-widest active:scale-95"
                >
                    <Plus size={16} /> Registrar Salida
                </Link>
            </PageHeader>

            <main className="flex-1 overflow-y-auto p-8 min-w-0">
                <div className="max-w-[1800px] mx-auto space-y-6">
                    <MovimientosFilterBar
                        searchTerm={searchTerm}
                        setSearchTerm={(val) => { setSearchTerm(val); setPage(1); }}
                        filters={filters}
                        handleFilterChange={handleFilterChange}
                        onClear={() => {
                            setSearchTerm('');
                            setFilters({ fecha_inicio: '', fecha_fin: '', estado: '' });
                            setPage(1);
                        }}
                        loading={loading}
                        placeholder="Buscar por responsable, destino o ID..."
                        estadoOptions={[
                            { value: "BORRADOR", label: "Borrador" },
                            { value: "APROBADO", label: "Aprobado" },
                        ]}
                    />

                    {loading ? (
                        <LoadingScreen message="Cargando hojas de ruta de consignación..." />
                    ) : consignaciones.length === 0 ? (
                        <EmptyState
                            icon={<Truck size={48} className="text-slate-300 mx-auto mb-4" />}
                            titulo="No hay consignaciones activas"
                            descripcion="Aquí podrás gestionar la mercadería enviada a clientes o vendedores de forma temporal."
                            textoBoton="Registrar Salida"
                            onAction={() => window.location.href = '/movimientos/consignaciones/nuevo'}
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {consignaciones.map((cons) => (
                                <Link
                                    key={cons.id}
                                    href={`/movimientos/consignaciones/${cons.id}`}
                                    className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col relative overflow-hidden"
                                >
                                    <div className={`absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-[60px] -z-0 transition-transform group-hover:scale-110`}></div>

                                    <div className="flex items-center justify-between mb-4 relative z-10">
                                        <Badge variant={cons.estado === 'APROBADO' ? 'success' : 'warning'}>
                                            {cons.estado}
                                        </Badge>
                                        <Text variant="label" className="uppercase tracking-widest">#{cons.id}</Text>
                                    </div>

                                    <div className="space-y-4 relative z-10">
                                        <div>
                                            <Heading level={5} className="group-hover:text-blue-600 transition-colors leading-tight truncate text-slate-900">
                                                {cons.responsable}
                                            </Heading>
                                            <Text variant="label" className="flex items-center gap-1.5 mt-1 font-bold">
                                                <MapPin size={12} className="text-blue-400" /> {cons.destino}
                                            </Text>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 border-y border-slate-50 py-4">
                                            <div>
                                                <Text variant="caption" className="text-[9px] mb-1 text-slate-300">Enviado</Text>
                                                <Text variant="bodyBold" className="font-black">{cons.resumen_stock?.enviado} un.</Text>
                                            </div>
                                            <div className="text-right">
                                                <Text variant="caption" className="text-[9px] mb-1 text-slate-300">Pendiente</Text>
                                                <Text variant="bodyBold" className={`font-black ${cons.resumen_stock?.pendiente > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                    {cons.resumen_stock?.pendiente} un.
                                                </Text>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <Text variant="label" className="flex items-center gap-1.5 font-bold"><Calendar size={14} /> {new Date(cons.fecha_salida).toLocaleDateString()}</Text>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Text variant="label" className="flex items-center gap-1.5 text-blue-500 font-bold truncate">
                                                <User size={14} className="shrink-0" /> Creado: {cons.usuario_nombre}
                                            </Text>
                                            {cons.aprobado_por_nombre && (
                                                <Text variant="label" className="flex items-center gap-1.5 text-emerald-600 font-bold truncate">
                                                    <User size={14} className="shrink-0" /> Confirmado: {cons.aprobado_por_nombre}
                                                </Text>
                                            )}
                                        </div>
                                        {cons.fecha_esperada_devolucion && (
                                            <Text variant="label" className={`flex items-center gap-1.5 mt-3 font-bold ${new Date(cons.fecha_esperada_devolucion) < new Date() ? 'text-rose-500' : 'text-slate-400'}`}>
                                                <Clock size={14} /> Retorno: {new Date(cons.fecha_esperada_devolucion).toLocaleDateString()}
                                            </Text>
                                        )}
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between group-hover:text-blue-600 transition-all font-black text-[10px] uppercase tracking-widest">
                                        Ver Detalles / Gestionar <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Paginación */}
                    {!loading && totalCount > PAGE_SIZE && (
                        <Pagination
                            currentPage={page}
                            totalItems={totalCount}
                            pageSize={PAGE_SIZE}
                            onPageChange={setPage}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}
