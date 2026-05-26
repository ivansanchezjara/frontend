"use client";
import { EmptyState, LoadingScreen, PageHeader, Pagination } from '@/components/ui';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Plus, Calendar, User, Check, X, Edit3, Package
} from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useDebounce } from '@/hooks/useDebounce';
import { getEdicionesLote, aprobarEdicionLote, rechazarEdicionLote } from '@/services/apis/movimientos';
import MovimientosFilterBar from '@/components/movimientos/MovimientosFilterBar';
import MovimientoCard from '@/components/movimientos/MovimientoCard';
import { useToast } from "@/components/ui/feedback/ToastContext";
import { useConfirm } from "@/components/ui/feedback/ConfirmContext";

export default function EditarLotePage() {
    const router = useRouter();
    const { confirm, danger } = useConfirm();
    const { showToast } = useToast();

    // Estados de filtros y paginación
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);
    const [filters, setFilters] = useState({
        fecha_inicio: '',
        fecha_fin: '',
        estado: ''
    });
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 24;

    const { data: edicionesData, loading, execute: fetchEdiciones } = useApi(getEdicionesLote, {
        auto: false,
        initialData: { results: [], count: 0 }
    });

    const { execute: approveAction, loading: isAprobando } = useApi(aprobarEdicionLote, { auto: false });
    const { execute: rejectAction, loading: isRechazando } = useApi(rechazarEdicionLote, { auto: false });

    useEffect(() => {
        fetchEdiciones({
            page,
            search: debouncedSearch,
            ...filters
        });
    }, [page, debouncedSearch, filters, fetchEdiciones]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPage(1);
    };

    const ediciones = edicionesData?.results || [];
    const totalCount = edicionesData?.count || 0;

    const handleAprobar = async (id, e) => {
        e.preventDefault();
        e.stopPropagation();
        const isConfirmed = await confirm(
            "¿Confirmar aprobación? Los datos del lote se actualizarán inmediatamente.",
            "Aprobar Edición de Lote"
        );
        if (!isConfirmed) return;

        try {
            await approveAction(id);
            showToast("Edición de lote aprobada con éxito", "success");
            fetchEdiciones({ page, search: debouncedSearch, ...filters });
        } catch (error) {
            showToast("Error al aprobar la edición", "error");
        }
    };

    const handleRechazar = async (id, e) => {
        e.preventDefault();
        e.stopPropagation();
        const isConfirmed = await danger(
            "¿Confirmar rechazo de esta edición? Esta acción es irreversible.",
            "Rechazar Edición"
        );
        if (!isConfirmed) return;

        try {
            await rejectAction(id);
            showToast("Edición rechazada", "info");
            fetchEdiciones({ page, search: debouncedSearch, ...filters });
        } catch (error) {
            showToast("Error al rechazar la edición", "error");
        }
    };

    return (
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
            <PageHeader
                breadcrumbs={[
                    { label: 'Gestión de Movimientos', href: '/movimientos' },
                    { label: 'Ajustes de Inventario', href: '/movimientos/ajustes' },
                    { label: 'Editar Lote' }
                ]}
                subtitle={
                    <>
                        <Edit3 size={12} />
                        Corrección de nombres de lote y fechas de vencimiento con trazabilidad.
                    </>
                }
            >
                <Link
                    href="/movimientos/ajustes/editar-lote/nuevo"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 px-6 rounded-xl shadow-lg shadow-blue-100 transition-all flex items-center gap-2 uppercase text-[10px] tracking-widest active:scale-95"
                >
                    <Plus size={16} /> Nueva Edición
                </Link>
            </PageHeader>

            <main className="flex-1 overflow-y-auto p-8 min-w-0">
                <div className="max-w-[1800px] mx-auto space-y-6">

                    <MovimientosFilterBar
                        searchTerm={searchTerm}
                        setSearchTerm={(val) => {
                            setSearchTerm(val);
                            setPage(1);
                        }}
                        filters={filters}
                        handleFilterChange={handleFilterChange}
                        onClear={() => {
                            setSearchTerm('');
                            setFilters({ fecha_inicio: '', fecha_fin: '', estado: '' });
                            setPage(1);
                        }}
                        loading={loading}
                        placeholder="Buscar por código de lote, producto o motivo..."
                        estadoOptions={[
                            { value: "BORRADOR", label: "Borrador" },
                            { value: "APROBADO", label: "Aprobado" },
                            { value: "RECHAZADO", label: "Rechazado" },
                        ]}
                    />

                    {loading ? (
                        <LoadingScreen message="Cargando ediciones de lote..." />
                    ) : ediciones.length === 0 ? (
                        <EmptyState
                            icon={<Edit3 size={48} className="text-slate-300 mx-auto mb-4" />}
                            title="No hay ediciones de lote registradas"
                            message="Aquí verás el historial de correcciones a nombres y vencimientos de lotes."
                            actionLabel="Nueva Edición"
                            onAction={() => router.push("/movimientos/ajustes/editar-lote/nuevo")}
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {ediciones.map((edicion) => (
                                <MovimientoCard
                                    key={edicion.id}
                                    id={edicion.id}
                                    estado={edicion.estado}
                                    titulo={`${edicion.variante_codigo} — ${edicion.variante_nombre}`}
                                    subtitulo={edicion.motivo}
                                    href={`/movimientos/ajustes/editar-lote/${edicion.id}`}
                                    badges={[
                                        ...(edicion.nuevo_lote_codigo ? [{ label: `→ ${edicion.nuevo_lote_codigo}`, className: 'bg-blue-50 text-blue-600' }] : []),
                                        ...(edicion.nuevo_vencimiento ? [{ label: `Venc: ${new Date(edicion.nuevo_vencimiento).toLocaleDateString()}`, className: 'bg-amber-50 text-amber-600' }] : []),
                                    ]}
                                    info={[
                                        { icon: Package, label: `Lote: ${edicion.lote_codigo_anterior}` },
                                        { icon: Calendar, label: new Date(edicion.fecha).toLocaleDateString() },
                                        { icon: User, label: edicion.usuario_nombre },
                                        ...(edicion.aprobado_por_nombre ? [{ icon: Check, label: `Aprobado: ${edicion.aprobado_por_nombre}` }] : [])
                                    ]}
                                    onApprove={handleAprobar}
                                    onReject={handleRechazar}
                                    isAprobando={isAprobando}
                                    isRechazando={isRechazando}
                                    approveLabel="Aprobar Edición"
                                />
                            ))}
                        </div>
                    )}

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
