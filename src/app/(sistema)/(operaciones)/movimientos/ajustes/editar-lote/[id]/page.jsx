"use client";
import { PageHeader, LoadingScreen, Badge, Text, Heading, Button } from '@/components/ui';
import { useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
    Calendar, MapPin, User, Check, ArrowLeft, X, Package, Edit3, ArrowRight
} from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useToast } from "@/components/ui/feedback/ToastContext";
import { useConfirm } from "@/components/ui/feedback/ConfirmContext";
import { getEdicionLote, aprobarEdicionLote, rechazarEdicionLote } from '@/services/apis/movimientos';

export default function DetalleEdicionLotePage() {
    const { id } = useParams();
    const router = useRouter();
    const { showToast } = useToast();
    const { confirm, danger } = useConfirm();

    const { data: edicion, loading, error, execute: fetchEdicion } = useApi(getEdicionLote, {
        auto: false,
        initialData: null
    });

    const { execute: approveAction, loading: isAprobando } = useApi(aprobarEdicionLote, { auto: false });
    const { execute: rejectAction, loading: isRechazando } = useApi(rechazarEdicionLote, { auto: false });

    useEffect(() => {
        if (id) {
            fetchEdicion(id);
        }
    }, [id]);

    const handleAprobar = async () => {
        const isConfirmed = await confirm(
            "¿Confirmar aprobación? Los datos del lote se actualizarán inmediatamente.",
            "Aprobar Edición de Lote"
        );
        if (!isConfirmed) return;

        try {
            await approveAction(id);
            showToast("Edición de lote aprobada con éxito", "success");
            fetchEdicion(id);
        } catch (error) {
            showToast("Error al aprobar la edición", "error");
        }
    };

    const handleRechazar = async () => {
        const isConfirmed = await danger(
            "¿Confirmar rechazo de esta edición? Esta acción es irreversible.",
            "Rechazar Edición"
        );
        if (!isConfirmed) return;

        try {
            await rejectAction(id);
            showToast("Edición rechazada", "info");
            fetchEdicion(id);
        } catch (error) {
            showToast("Error al rechazar la edición", "error");
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
                        { label: 'Editar Lote', href: '/movimientos/ajustes/editar-lote' },
                        { label: `Edición #${id}` }
                    ]}
                />
                <main className="flex-1 overflow-y-auto p-8">
                    <LoadingScreen message="Cargando detalle de la edición..." />
                </main>
            </div>
        );
    }

    if (error || !edicion) {
        return (
            <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
                <PageHeader
                    breadcrumbs={[
                        { label: 'Gestión de Movimientos', href: '/movimientos' },
                        { label: 'Ajustes de Inventario', href: '/movimientos/ajustes' },
                        { label: 'Editar Lote', href: '/movimientos/ajustes/editar-lote' },
                        { label: `Edición #${id}` }
                    ]}
                />
                <main className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-xl mx-auto text-center py-20">
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-10">
                            <Text variant="bodyLg" className="text-slate-500 mb-4">
                                No se encontró la edición de lote solicitada.
                            </Text>
                            <Link
                                href="/movimientos/ajustes/editar-lote"
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
                    { label: 'Editar Lote', href: '/movimientos/ajustes/editar-lote' },
                    { label: `Edición #${id}` }
                ]}
            >
                {edicion.estado === 'BORRADOR' && (
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
                                    Edición de Lote #{edicion.id}
                                </Heading>
                                <Text variant="bodySm" className="text-slate-500 mt-1">
                                    Corrección de datos del lote con trazabilidad completa.
                                </Text>
                            </div>
                            <Badge variant={getBadgeVariant(edicion.estado)}>
                                {edicion.estado}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <Calendar size={16} className="text-slate-400" />
                                <div>
                                    <Text variant="label" className="text-slate-400">Fecha</Text>
                                    <Text variant="bodySmBold" className="text-slate-700">
                                        {new Date(edicion.fecha).toLocaleDateString()}
                                    </Text>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <MapPin size={16} className="text-slate-400" />
                                <div>
                                    <Text variant="label" className="text-slate-400">Depósito</Text>
                                    <Text variant="bodySmBold" className="text-slate-700">
                                        {edicion.deposito_nombre}
                                    </Text>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <User size={16} className="text-slate-400" />
                                <div>
                                    <Text variant="label" className="text-slate-400">Creado por</Text>
                                    <Text variant="bodySmBold" className="text-slate-700">
                                        {edicion.usuario_nombre || '—'}
                                    </Text>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <Check size={16} className="text-slate-400" />
                                <div>
                                    <Text variant="label" className="text-slate-400">Aprobado por</Text>
                                    <Text variant="bodySmBold" className="text-slate-700">
                                        {edicion.aprobado_por_nombre || '—'}
                                    </Text>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Producto / Lote Info */}
                    <div className="bg-blue-50/30 border border-blue-100 rounded-3xl p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                                <Package size={24} />
                            </div>
                            <div>
                                <Text variant="bodyXs" className="text-blue-500 font-black uppercase tracking-widest leading-none mb-1">
                                    {edicion.variante_codigo}
                                </Text>
                                <Text className="text-lg font-black text-slate-900 leading-none">
                                    {edicion.variante_nombre}
                                </Text>
                                <Text variant="bodyXs" className="text-slate-500 mt-1">
                                    Depósito: {edicion.deposito_nombre}
                                </Text>
                            </div>
                        </div>
                    </div>

                    {/* Cambios */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                        <Heading level={6} className="uppercase tracking-widest mb-5 text-slate-600">
                            Detalle de Cambios
                        </Heading>

                        <div className="space-y-4">
                            {/* Código de Lote */}
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                <Text variant="label" className="text-slate-400 block mb-2">
                                    Código de Lote
                                </Text>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 bg-white rounded-xl p-3 border border-slate-200">
                                        <Text variant="bodyXs" className="text-slate-400 block mb-0.5">Anterior</Text>
                                        <Text className="font-black text-slate-700">
                                            {edicion.lote_codigo_anterior}
                                        </Text>
                                    </div>
                                    <ArrowRight size={16} className="text-slate-300 shrink-0" />
                                    <div className={`flex-1 rounded-xl p-3 border ${edicion.nuevo_lote_codigo ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                                        <Text variant="bodyXs" className={`block mb-0.5 ${edicion.nuevo_lote_codigo ? 'text-emerald-500' : 'text-slate-400'}`}>
                                            {edicion.nuevo_lote_codigo ? 'Nuevo' : 'Sin cambios'}
                                        </Text>
                                        <Text className={`font-black ${edicion.nuevo_lote_codigo ? 'text-emerald-700' : 'text-slate-400'}`}>
                                            {edicion.nuevo_lote_codigo || edicion.lote_codigo_anterior}
                                        </Text>
                                    </div>
                                </div>
                            </div>

                            {/* Vencimiento */}
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                <Text variant="label" className="text-slate-400 block mb-2">
                                    Fecha de Vencimiento
                                </Text>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 bg-white rounded-xl p-3 border border-slate-200">
                                        <Text variant="bodyXs" className="text-slate-400 block mb-0.5">Anterior</Text>
                                        <Text className="font-black text-slate-700">
                                            {edicion.vencimiento_anterior
                                                ? new Date(edicion.vencimiento_anterior).toLocaleDateString()
                                                : 'Sin vencimiento'}
                                        </Text>
                                    </div>
                                    <ArrowRight size={16} className="text-slate-300 shrink-0" />
                                    <div className={`flex-1 rounded-xl p-3 border ${edicion.nuevo_vencimiento ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                                        <Text variant="bodyXs" className={`block mb-0.5 ${edicion.nuevo_vencimiento ? 'text-emerald-500' : 'text-slate-400'}`}>
                                            {edicion.nuevo_vencimiento ? 'Nuevo' : 'Sin cambios'}
                                        </Text>
                                        <Text className={`font-black ${edicion.nuevo_vencimiento ? 'text-emerald-700' : 'text-slate-400'}`}>
                                            {edicion.nuevo_vencimiento
                                                ? new Date(edicion.nuevo_vencimiento).toLocaleDateString()
                                                : (edicion.vencimiento_anterior
                                                    ? new Date(edicion.vencimiento_anterior).toLocaleDateString()
                                                    : 'Sin vencimiento')}
                                        </Text>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Motivo */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                        <Heading level={6} className="uppercase tracking-widest mb-3 text-slate-600">
                            Motivo
                        </Heading>
                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                            <Text variant="bodySm" className="italic text-slate-600 leading-relaxed font-medium">
                                "{edicion.motivo}"
                            </Text>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
