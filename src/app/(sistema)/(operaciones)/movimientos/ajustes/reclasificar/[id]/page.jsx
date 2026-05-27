"use client";
import { PageHeader, LoadingScreen, Badge, Text, Heading } from '@/components/ui';
import { useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
    Calendar, User, Check, ArrowLeft, X, Package, Shuffle, ArrowRight, MapPin
} from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useToast } from "@/components/ui/feedback/ToastContext";
import { useConfirm } from "@/components/ui/feedback/ConfirmContext";
import { getAjuste, aprobarAjuste, rechazarAjuste } from '@/services/apis/movimientos';

export default function DetalleReclasificacionPage() {
    const { id } = useParams();
    const router = useRouter();
    const { showToast } = useToast();
    const { confirm, danger } = useConfirm();

    const { data: ajuste, loading, error, execute: fetchAjuste } = useApi(getAjuste, {
        auto: false,
        initialData: null
    });

    const { execute: approveAction, loading: isAprobando } = useApi(aprobarAjuste, { auto: false });
    const { execute: rejectAction, loading: isRechazando } = useApi(rechazarAjuste, { auto: false });

    useEffect(() => {
        if (id) {
            fetchAjuste(id);
        }
    }, [id]);

    const handleAprobar = async () => {
        const isConfirmed = await confirm(
            "¿Confirmar aprobación? Las cantidades se moverán entre lotes inmediatamente.",
            "Aprobar Reclasificación"
        );
        if (!isConfirmed) return;

        try {
            await approveAction(id);
            showToast("Reclasificación aprobada con éxito", "success");
            fetchAjuste(id);
        } catch (error) {
            showToast("Error al aprobar la reclasificación", "error");
        }
    };

    const handleRechazar = async () => {
        const isConfirmed = await danger(
            "¿Confirmar rechazo de esta reclasificación? Esta acción es irreversible.",
            "Rechazar Reclasificación"
        );
        if (!isConfirmed) return;

        try {
            await rejectAction(id);
            showToast("Reclasificación rechazada", "info");
            fetchAjuste(id);
        } catch (error) {
            showToast("Error al rechazar la reclasificación", "error");
        }
    };

    const getBadgeVariant = (estado) => {
        switch (estado) {
            case 'APROBADO': return 'success';
            case 'RECHAZADO': return 'danger';
            default: return 'warning';
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
                <PageHeader
                    breadcrumbs={[
                        { label: 'Gestión de Movimientos', href: '/movimientos' },
                        { label: 'Ajustes de Inventario', href: '/movimientos/ajustes' },
                        { label: 'Reclasificar', href: '/movimientos/ajustes/reclasificar' },
                        { label: `Reclasificación #${id}` }
                    ]}
                />
                <main className="flex-1 overflow-y-auto p-8">
                    <LoadingScreen message="Cargando detalle de la reclasificación..." />
                </main>
            </div>
        );
    }

    if (error || !ajuste) {
        return (
            <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
                <PageHeader
                    breadcrumbs={[
                        { label: 'Gestión de Movimientos', href: '/movimientos' },
                        { label: 'Ajustes de Inventario', href: '/movimientos/ajustes' },
                        { label: 'Reclasificar', href: '/movimientos/ajustes/reclasificar' },
                        { label: `Reclasificación #${id}` }
                    ]}
                />
                <main className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-xl mx-auto text-center py-20">
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-10">
                            <Text variant="bodyLg" className="text-slate-500 mb-4">
                                No se encontró la reclasificación solicitada.
                            </Text>
                            <Link
                                href="/movimientos/ajustes/reclasificar"
                                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-sm transition-colors"
                            >
                                <ArrowLeft size={16} />
                                Volver al listado
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
            <PageHeader
                breadcrumbs={[
                    { label: 'Gestión de Movimientos', href: '/movimientos' },
                    { label: 'Ajustes de Inventario', href: '/movimientos/ajustes' },
                    { label: 'Reclasificar', href: '/movimientos/ajustes/reclasificar' },
                    { label: `Reclasificación #${id}` }
                ]}
            >
                {ajuste.estado === 'BORRADOR' && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleAprobar}
                            disabled={isAprobando || isRechazando}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 px-5 rounded-xl shadow-lg shadow-emerald-100 transition-all flex items-center gap-2 uppercase text-[10px] tracking-widest active:scale-95 disabled:opacity-50"
                        >
                            <Check size={14} /> Aprobar
                        </button>
                        <button
                            onClick={handleRechazar}
                            disabled={isAprobando || isRechazando}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-black py-2.5 px-5 rounded-xl shadow-lg shadow-rose-100 transition-all flex items-center gap-2 uppercase text-[10px] tracking-widest active:scale-95 disabled:opacity-50"
                        >
                            <X size={14} /> Rechazar
                        </button>
                    </div>
                )}
            </PageHeader>

            <main className="flex-1 overflow-y-auto p-8 min-w-0">
                <div className="max-w-3xl mx-auto space-y-6">

                    {/* Header Card */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <Heading level={4} className="text-slate-800">
                                    Reclasificación #{ajuste.id}
                                </Heading>
                                <Text variant="bodySm" className="text-slate-500 mt-1">
                                    Movimiento de unidades entre lotes con trazabilidad completa.
                                </Text>
                            </div>
                            <Badge variant={getBadgeVariant(ajuste.estado)}>
                                {ajuste.estado}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <Calendar size={16} className="text-slate-400" />
                                <div>
                                    <Text variant="label" className="text-slate-400">Fecha</Text>
                                    <Text variant="bodySmBold" className="text-slate-700">
                                        {new Date(ajuste.fecha).toLocaleDateString()}
                                    </Text>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <User size={16} className="text-slate-400" />
                                <div>
                                    <Text variant="label" className="text-slate-400">Creado por</Text>
                                    <Text variant="bodySmBold" className="text-slate-700">
                                        {ajuste.usuario_nombre || '—'}
                                    </Text>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <Check size={16} className="text-slate-400" />
                                <div>
                                    <Text variant="label" className="text-slate-400">Aprobado por</Text>
                                    <Text variant="bodySmBold" className="text-slate-700">
                                        {ajuste.aprobado_por_nombre || '—'}
                                    </Text>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Producto Info */}
                    <div className="bg-blue-50/30 border border-blue-100 rounded-3xl p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                                <Package size={24} />
                            </div>
                            <div>
                                <Text variant="bodyXs" className="text-blue-500 font-black uppercase tracking-widest leading-none mb-1">
                                    {ajuste.variante_codigo}
                                </Text>
                                <Text className="text-lg font-black text-slate-900 leading-none">
                                    {ajuste.producto_nombre}
                                </Text>
                                {ajuste.variante_nombre && (
                                    <Text variant="bodyXs" className="text-slate-500 mt-1">
                                        {ajuste.variante_nombre}
                                    </Text>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Items / Líneas de Reclasificación */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                        <Heading level={6} className="uppercase tracking-widest mb-5 text-slate-600">
                            Movimientos entre Lotes ({ajuste.items?.length || 0})
                        </Heading>

                        <div className="space-y-4">
                            {ajuste.items?.map((item, idx) => (
                                <div key={item.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                    <Text variant="label" className="text-xs uppercase tracking-widest text-slate-400 mb-3 block">
                                        Línea {idx + 1}
                                    </Text>
                                    <div className="flex items-center gap-3">
                                        {/* Lote Origen */}
                                        <div className="flex-1 bg-white rounded-xl p-3 border border-slate-200">
                                            <Text variant="bodyXs" className="text-slate-400 block mb-0.5">Lote Origen</Text>
                                            <Text className="font-black text-slate-700">
                                                {item.lote_origen_codigo}
                                            </Text>
                                            {item.lote_origen_deposito && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <MapPin size={10} className="text-slate-300" />
                                                    <Text variant="bodyXs" className="text-slate-400">
                                                        {item.lote_origen_deposito}
                                                    </Text>
                                                </div>
                                            )}
                                        </div>

                                        {/* Flecha */}
                                        <div className="flex flex-col items-center gap-1 shrink-0">
                                            <ArrowRight size={16} className="text-blue-400" />
                                            <Text variant="bodyXs" className="text-blue-600 font-black">
                                                {item.cantidad} u.
                                            </Text>
                                        </div>

                                        {/* Lote Destino */}
                                        <div className={`flex-1 rounded-xl p-3 border ${item.nuevo_lote_codigo ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                                            <Text variant="bodyXs" className={`block mb-0.5 ${item.nuevo_lote_codigo ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                {item.nuevo_lote_codigo ? 'Lote Nuevo' : 'Lote Destino'}
                                            </Text>
                                            <Text className={`font-black ${item.nuevo_lote_codigo ? 'text-emerald-700' : 'text-slate-700'}`}>
                                                {item.nuevo_lote_codigo || item.lote_destino_codigo}
                                            </Text>
                                            {item.lote_destino_deposito && !item.nuevo_lote_codigo && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <MapPin size={10} className="text-slate-300" />
                                                    <Text variant="bodyXs" className="text-slate-400">
                                                        {item.lote_destino_deposito}
                                                    </Text>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Motivo y Observaciones */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                        <Heading level={6} className="uppercase tracking-widest mb-3 text-slate-600">
                            Motivo
                        </Heading>
                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                            <Text variant="bodySm" className="italic text-slate-600 leading-relaxed font-medium">
                                "{ajuste.motivo}"
                            </Text>
                        </div>

                        {ajuste.observaciones && (
                            <div className="mt-4">
                                <Heading level={6} className="uppercase tracking-widest mb-3 text-slate-600">
                                    Observaciones
                                </Heading>
                                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                                    <Text variant="bodySm" className="text-slate-600 leading-relaxed">
                                        {ajuste.observaciones}
                                    </Text>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
}
