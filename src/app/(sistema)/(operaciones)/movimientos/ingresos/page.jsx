"use client";
import { EmptyState, LoadingScreen, PageHeader, Pagination, Badge, Text } from '@/components/ui';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Package, User, MapPin,
    Plus, Calendar, Edit3, Check, X
} from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useDebounce } from '@/hooks/useDebounce';
import { getIngresos, aprobarIngreso, rechazarIngreso } from '@/services/apis/movimientos';
import MovimientosFilterBar from '@/components/movimientos/MovimientosFilterBar';
import MovimientoCard from '@/components/movimientos/MovimientoCard';
import { useToast } from "@/components/ui/feedback/ToastContext";
import { useConfirm } from "@/components/ui/feedback/ConfirmContext";

export default function IngresosPage() {
    const router = useRouter();
    const { confirm, danger } = useConfirm();
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
    const [vista, setVista] = useState('grilla'); // 'grilla' | 'tabla'

    const { data: ingresosData, loading, execute: fetchIngresos } = useApi(getIngresos, {
        auto: false,
        initialData: { results: [], count: 0 }
    });

    const { execute: approveIngresoAction, loading: isAprobando } = useApi(aprobarIngreso, { auto: false });
    const { execute: rejectIngresoAction, loading: isRechazando } = useApi(rechazarIngreso, { auto: false });

    // Cargar datos cuando cambian los filtros o la página
    useEffect(() => {
        fetchIngresos({
            page,
            search: debouncedSearch,
            ...filters
        });
    }, [page, debouncedSearch, filters, fetchIngresos]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPage(1); // Volver a la primera página al filtrar
    };

    const ingresos = ingresosData?.results || [];
    const totalCount = ingresosData?.count || 0;

    const handleAprobar = async (id, e) => {
        e.preventDefault();
        e.stopPropagation();
        const isConfirmed = await confirm(
            "¿Confirmar aprobación de este ingreso? El stock se cargará inmediatamente.",
            "Aprobar Ingreso"
        );
        if (!isConfirmed) return;

        try {
            await approveIngresoAction(id);
            showToast("Ingreso aprobado con éxito", "success");
            fetchIngresos();
        } catch (error) {
            showToast("Error al aprobar el ingreso", "error");
        }
    };

    const handleRechazar = async (id, e) => {
        e.preventDefault();
        e.stopPropagation();
        const isConfirmed = await danger(
            "¿Confirmar rechazo de este ingreso? Esta acción es irreversible.",
            "Rechazar Ingreso"
        );
        if (!isConfirmed) return;

        try {
            await rejectIngresoAction(id);
            showToast("Ingreso rechazado", "info");
            fetchIngresos();
        } catch (error) {
            showToast("Error al rechazar el ingreso", "error");
        }
    };

    return (
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
            <PageHeader
                breadcrumbs={[
                    { label: 'Gestión de Movimientos', href: '/movimientos' },
                    { label: 'Ingresos de Mercadería' }
                ]}
                subtitle={
                    <>
                        <Package size={12} />
                        <Text as="span" variant="bodySm">Podés registrar borradores y aprobarlos para cargar stock.</Text>
                    </>
                }
            >
                <Link
                    href="/movimientos/ingresos/nuevo"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 px-6 rounded-xl shadow-lg shadow-blue-100 transition-all flex items-center gap-2 uppercase text-[10px] tracking-widest active:scale-95"
                >
                    <Plus size={16} /> Nuevo Ingreso
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
                        placeholder="Buscar por descripción, comprobante, ID o marca..."
                        vista={vista}
                        setVista={setVista}
                    />

                    {loading ? (
                        <LoadingScreen message="Sincronizando ingresos..." />
                    ) : ingresos.length === 0 ? (
                        <EmptyState
                            icon={<Package size={48} className="text-slate-300 mx-auto mb-4" />}
                            title="No hay ingresos registrados"
                            message="Aquí verás toda la mercadería que llega a tus depósitos."
                            actionLabel="Nuevo Ingreso"
                            onAction={() => window.location.href = '/movimientos/ingresos/nuevo'}
                        />
                    ) : vista === 'grilla' ? (
                        <div className="grid grid-cols-1 gap-4">
                            {ingresos.map((ing) => (
                                <MovimientoCard
                                    key={ing.id}
                                    id={ing.id}
                                    estado={ing.estado}
                                    titulo={ing.descripcion}
                                    href={`/movimientos/ingresos/${ing.id}/detalle`}
                                    info={[
                                        { icon: Calendar, label: new Date(ing.fecha_arribo).toLocaleDateString() },
                                        { icon: MapPin, label: ing.deposito_nombre },
                                        { icon: User, label: ing.usuario_nombre?.split(' ')[0] }
                                    ]}
                                    onApprove={handleAprobar}
                                    onReject={handleRechazar}
                                    onEditHref={`/movimientos/ingresos/${ing.id}`}
                                    isAprobando={isAprobando}
                                    isRechazando={isRechazando}
                                    approveLabel="Aprobar Ingreso"
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
                                            <th className="py-4 px-4">Descripción</th>
                                            <th className="py-4 px-4">Fecha Arribo</th>
                                            <th className="py-4 px-4">Depósito</th>
                                            <th className="py-4 px-4">Usuario</th>
                                            <th className="py-4 px-6 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                                        {ingresos.map((ing) => {
                                            const badgeVariant = ing.estado === 'APROBADO' ? 'success'
                                                : ing.estado === 'RECHAZADO' ? 'danger'
                                                    : 'warning';

                                            return (
                                                <tr
                                                    key={ing.id}
                                                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                                                    onClick={() => router.push(`/movimientos/ingresos/${ing.id}/detalle`)}
                                                >
                                                    <td className="py-4 px-6">
                                                        <Text variant="bodyXs" className="text-slate-400 font-bold">#{ing.id}</Text>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <Badge variant={badgeVariant}>
                                                            {ing.estado}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <Text variant="bodySmBold" className="group-hover:text-blue-600 transition-colors">{ing.descripcion}</Text>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <Text variant="bodyXs" className="text-slate-500">{new Date(ing.fecha_arribo).toLocaleDateString()}</Text>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <Text variant="bodyXs" className="text-slate-500">{ing.deposito_nombre}</Text>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <Text variant="bodyXs" className="text-slate-500">{ing.usuario_nombre?.split(' ')[0]}</Text>
                                                    </td>
                                                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                                                        {ing.estado === 'BORRADOR' ? (
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Link
                                                                    href={`/movimientos/ingresos/${ing.id}`}
                                                                    className="p-1.5 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg border border-slate-200 hover:border-blue-100 transition-all"
                                                                    title="Editar"
                                                                >
                                                                    <Edit3 size={14} />
                                                                </Link>
                                                                <button
                                                                    onClick={(e) => handleAprobar(ing.id, e)}
                                                                    disabled={isAprobando || isRechazando}
                                                                    className="p-1.5 bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg border border-slate-200 hover:border-emerald-100 transition-all disabled:opacity-50"
                                                                    title="Aprobar"
                                                                >
                                                                    <Check size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => handleRechazar(ing.id, e)}
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
            </main >
        </div>
    );
}
