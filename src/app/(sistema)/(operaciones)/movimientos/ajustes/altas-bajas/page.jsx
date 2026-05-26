"use client";
import { EmptyState, LoadingScreen, PageHeader, Pagination, Badge, Text } from '@/components/ui';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Plus, Calendar, MapPin, User, Check, X, Edit3, Layers
} from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useDebounce } from '@/hooks/useDebounce';
import { getAjustesRapidos, aprobarAjusteRapido, rechazarAjusteRapido } from '@/services/apis/movimientos';
import MovimientosFilterBar from '@/components/movimientos/MovimientosFilterBar';
import MovimientoCard from '@/components/movimientos/MovimientoCard';
import { useToast } from "@/components/ui/feedback/ToastContext";
import { useConfirm } from "@/components/ui/feedback/ConfirmContext";

export default function AjustesRapidosPage() {
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
    const [vista, setVista] = useState('grilla'); // 'grilla' | 'tabla'

    const { data: ajustesData, loading, execute: fetchAjustes } = useApi(getAjustesRapidos, {
        auto: false,
        initialData: { results: [], count: 0 }
    });

    const { execute: approveAjusteAction, loading: isAprobando } = useApi(aprobarAjusteRapido, { auto: false });
    const { execute: rejectAjusteAction, loading: isRechazando } = useApi(rechazarAjusteRapido, { auto: false });

    // Cargar datos cuando cambian los filtros o la página
    useEffect(() => {
        fetchAjustes({
            page,
            search: debouncedSearch,
            ...filters
        });
    }, [page, debouncedSearch, filters, fetchAjustes]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPage(1);
    };

    const ajustes = ajustesData?.results || [];
    const totalCount = ajustesData?.count || 0;

    const handleAprobar = async (id, e) => {
        e.preventDefault();
        e.stopPropagation();
        const isConfirmed = await confirm(
            "¿Confirmar aprobación de este ajuste? Los cambios de stock se aplicarán inmediatamente.",
            "Aprobar Ajuste"
        );
        if (!isConfirmed) return;

        try {
            await approveAjusteAction(id);
            showToast("Ajuste aprobado con éxito", "success");
            fetchAjustes();
        } catch (error) {
            showToast("Error al aprobar el ajuste", "error");
        }
    };

    const handleRechazar = async (id, e) => {
        e.preventDefault();
        e.stopPropagation();
        const isConfirmed = await danger(
            "¿Confirmar rechazo de este ajuste? Esta acción es irreversible.",
            "Rechazar Ajuste"
        );
        if (!isConfirmed) return;

        try {
            await rejectAjusteAction(id);
            showToast("Ajuste rechazado", "info");
            fetchAjustes();
        } catch (error) {
            showToast("Error al rechazar el ajuste", "error");
        }
    };

    return (
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
            <PageHeader
                breadcrumbs={[
                    { label: 'Gestión de Movimientos', href: '/movimientos' },
                    { label: 'Ajustes de Inventario', href: '/movimientos/ajustes' },
                    { label: 'Altas y Bajas' }
                ]}
                subtitle={
                    <>
                        <Layers size={12} />
                        Registrá altas y bajas de stock de forma masiva con trazabilidad completa.
                    </>
                }
            >
                <Link
                    href="/movimientos/ajustes/altas-bajas/nuevo"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 px-6 rounded-xl shadow-lg shadow-blue-100 transition-all flex items-center gap-2 uppercase text-[10px] tracking-widest active:scale-95"
                >
                    <Plus size={16} /> Nuevo Ajuste
                </Link>
            </PageHeader>

            <main className="flex-1 overflow-y-auto p-8 min-w-0">
                <div className="max-w-[1800px] mx-auto space-y-6">

                    {/* Barra de Búsqueda y Filtros */}
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
                        placeholder="Buscar por observaciones, ID o usuario..."
                        vista={vista}
                        setVista={setVista}
                    />

                    {loading ? (
                        <LoadingScreen message="Sincronizando ajustes rápidos..." />
                    ) : ajustes.length === 0 ? (
                        <EmptyState
                            icon={<Layers size={48} className="text-slate-300 mx-auto mb-4" />}
                            title="No hay ajustes rápidos registrados"
                            message="Aquí verás todas las altas y bajas de stock realizadas."
                            actionLabel="Nuevo Ajuste"
                            onAction={() => window.location.href = '/movimientos/ajustes/altas-bajas/nuevo'}
                        />
                    ) : vista === 'grilla' ? (
                        <div className="grid grid-cols-1 gap-4">
                            {ajustes.map((ajuste) => (
                                <MovimientoCard
                                    key={ajuste.id}
                                    id={ajuste.id}
                                    estado={ajuste.estado}
                                    titulo={ajuste.observaciones || `Ajuste Rápido #${ajuste.id}`}
                                    href={`/movimientos/ajustes/altas-bajas/${ajuste.id}`}
                                    info={[
                                        { icon: Calendar, label: new Date(ajuste.fecha).toLocaleDateString() },
                                        { icon: MapPin, label: ajuste.deposito_nombre },
                                        { icon: User, label: ajuste.usuario_nombre },
                                        { icon: Layers, label: `${ajuste.cantidad_lineas} líneas` },
                                        ...(ajuste.aprobado_por_nombre ? [{ icon: Check, label: `Confirmado: ${ajuste.aprobado_por_nombre}` }] : [])
                                    ]}
                                    onApprove={handleAprobar}
                                    onReject={handleRechazar}
                                    onEditHref={`/movimientos/ajustes/altas-bajas/${ajuste.id}/editar`}
                                    isAprobando={isAprobando}
                                    isRechazando={isRechazando}
                                    approveLabel="Aprobar Ajuste"
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                                            <th className="py-4 px-6">ID</th>
                                            <th className="py-4 px-4">Estado</th>
                                            <th className="py-4 px-4">Observaciones</th>
                                            <th className="py-4 px-4">Fecha</th>
                                            <th className="py-4 px-4">Depósito</th>
                                            <th className="py-4 px-4">Líneas</th>
                                            <th className="py-4 px-4">Creado por</th>
                                            <th className="py-4 px-4">Confirmado por</th>
                                            <th className="py-4 px-6 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                                        {ajustes.map((ajuste) => {
                                            const badgeVariant = ajuste.estado === 'APROBADO' ? 'success'
                                                : ajuste.estado === 'RECHAZADO' ? 'danger'
                                                    : 'warning';

                                            return (
                                                <tr
                                                    key={ajuste.id}
                                                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                                                    onClick={() => router.push(`/movimientos/ajustes/altas-bajas/${ajuste.id}`)}
                                                >
                                                    <td className="py-4 px-6">
                                                        <Text variant="bodyXs" className="text-slate-400 font-bold">#{ajuste.id}</Text>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <Badge variant={badgeVariant}>
                                                            {ajuste.estado}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <Text variant="bodySmBold" className="group-hover:text-blue-600 transition-colors">
                                                            {ajuste.observaciones || `Ajuste Rápido #${ajuste.id}`}
                                                        </Text>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <Text variant="bodyXs" className="text-slate-500">{new Date(ajuste.fecha).toLocaleDateString()}</Text>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <Text variant="bodyXs" className="text-slate-500">{ajuste.deposito_nombre}</Text>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <Text variant="bodyXs" className="text-slate-500">{ajuste.cantidad_lineas}</Text>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <Text variant="bodyXs" className="text-slate-500">{ajuste.usuario_nombre || '—'}</Text>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <Text variant="bodyXs" className="text-slate-500">{ajuste.aprobado_por_nombre || '—'}</Text>
                                                    </td>
                                                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                                                        {ajuste.estado === 'BORRADOR' ? (
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Link
                                                                    href={`/movimientos/ajustes/altas-bajas/${ajuste.id}/editar`}
                                                                    className="p-1.5 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg border border-slate-200 hover:border-blue-100 transition-all"
                                                                    title="Editar"
                                                                >
                                                                    <Edit3 size={14} />
                                                                </Link>
                                                                <button
                                                                    onClick={(e) => handleAprobar(ajuste.id, e)}
                                                                    disabled={isAprobando || isRechazando}
                                                                    className="p-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg border border-slate-200 hover:border-emerald-100 transition-all disabled:opacity-50"
                                                                    title="Aprobar"
                                                                >
                                                                    <Check size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => handleRechazar(ajuste.id, e)}
                                                                    disabled={isAprobando || isRechazando}
                                                                    className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg border border-slate-200 hover:border-rose-100 transition-all disabled:opacity-50"
                                                                    title="Rechazar"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <Text variant="label" className="uppercase tracking-wider">
                                                                Auditado
                                                            </Text>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Paginación */}
                {!loading && totalCount > PAGE_SIZE && (
                    <Pagination
                        count={totalCount}
                        pageSize={PAGE_SIZE}
                        currentPage={page}
                        onPageChange={setPage}
                    />
                )}
            </main>
        </div>
    );
}
