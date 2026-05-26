"use client";
import { PageHeader, LoadingScreen, Badge, Text, Heading, Button } from '@/components/ui';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, MapPin, User, Check, Edit3, ArrowLeft, X } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useToast } from "@/components/ui/feedback/ToastContext";
import { useConfirm } from "@/components/ui/feedback/ConfirmContext";
import { getAjusteRapido, aprobarAjusteRapido, rechazarAjusteRapido } from '@/services/apis/movimientos';

export default function DetalleAjusteRapidoPage() {
    const { id } = useParams();
    const router = useRouter();
    const { showToast } = useToast();
    const { confirm, danger } = useConfirm();

    const { data: ajuste, loading, error, execute: fetchAjuste } = useApi(getAjusteRapido, {
        auto: false,
        initialData: null
    });

    const { execute: approveAction, loading: isAprobando } = useApi(aprobarAjusteRapido, { auto: false });
    const { execute: rejectAction, loading: isRechazando } = useApi(rechazarAjusteRapido, { auto: false });

    useEffect(() => {
        if (id) {
            fetchAjuste(id);
        }
    }, [id]);

    const handleAprobar = async () => {
        const isConfirmed = await confirm(
            "¿Confirmar aprobación de este ajuste? Los cambios de stock se aplicarán inmediatamente.",
            "Aprobar Ajuste"
        );
        if (!isConfirmed) return;

        try {
            await approveAction(id);
            showToast("Ajuste aprobado con éxito", "success");
            fetchAjuste(id);
        } catch (error) {
            showToast("Error al aprobar el ajuste", "error");
        }
    };

    const handleRechazar = async () => {
        const isConfirmed = await danger(
            "¿Confirmar rechazo de este ajuste? Esta acción es irreversible.",
            "Rechazar Ajuste"
        );
        if (!isConfirmed) return;

        try {
            await rejectAction(id);
            showToast("Ajuste rechazado", "info");
            fetchAjuste(id);
        } catch (error) {
            showToast("Error al rechazar el ajuste", "error");
        }
    };

    const getBadgeVariant = (estado) => {
        switch (estado) {
            case 'APROBADO': return 'success';
            case 'RECHAZADO': return 'danger';
            default: return 'warning';
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
                <PageHeader
                    breadcrumbs={[
                        { label: 'Gestión de Movimientos', href: '/movimientos' },
                        { label: 'Ajustes de Inventario', href: '/movimientos/ajustes' },
                        { label: 'Altas y Bajas', href: '/movimientos/ajustes/altas-bajas' },
                        { label: `Ajuste #${id}` }
                    ]}
                />
                <main className="flex-1 overflow-y-auto p-8">
                    <LoadingScreen message="Cargando detalle del ajuste..." />
                </main>
            </div>
        );
    }

    // Error / 404 state
    if (error || !ajuste) {
        return (
            <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
                <PageHeader
                    breadcrumbs={[
                        { label: 'Gestión de Movimientos', href: '/movimientos' },
                        { label: 'Ajustes de Inventario', href: '/movimientos/ajustes' },
                        { label: 'Altas y Bajas', href: '/movimientos/ajustes/altas-bajas' },
                        { label: `Ajuste #${id}` }
                    ]}
                />
                <main className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-xl mx-auto text-center py-20">
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-10">
                            <Text variant="bodyLg" className="text-slate-500 mb-4">
                                No se encontró el ajuste rápido solicitado.
                            </Text>
                            <Link
                                href="/movimientos/ajustes/altas-bajas"
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

    const lineas = ajuste.lineas || [];

    return (
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
            <PageHeader
                breadcrumbs={[
                    { label: 'Gestión de Movimientos', href: '/movimientos' },
                    { label: 'Ajustes de Inventario', href: '/movimientos/ajustes' },
                    { label: 'Altas y Bajas', href: '/movimientos/ajustes/altas-bajas' },
                    { label: `Ajuste #${id}` }
                ]}
            >
                {ajuste.estado === 'BORRADOR' && (
                    <div className="flex items-center gap-3">
                        <Link
                            href={`/movimientos/ajustes/altas-bajas/${id}/editar`}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-2.5 px-5 rounded-xl transition-all flex items-center gap-2 uppercase text-[10px] tracking-widest active:scale-95 border border-slate-200"
                        >
                            <Edit3 size={14} /> Editar
                        </Link>
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
                <div className="max-w-[1800px] mx-auto space-y-6">

                    {/* Header Card */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <Heading level={4} className="text-slate-800">
                                    Ajuste Rápido #{ajuste.id}
                                </Heading>
                                {ajuste.observaciones && (
                                    <Text variant="bodySm" className="text-slate-500 mt-1">
                                        {ajuste.observaciones}
                                    </Text>
                                )}
                            </div>
                            <Badge variant={getBadgeVariant(ajuste.estado)}>
                                {ajuste.estado}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                                <MapPin size={16} className="text-slate-400" />
                                <div>
                                    <Text variant="label" className="text-slate-400">Depósito</Text>
                                    <Text variant="bodySmBold" className="text-slate-700">
                                        {ajuste.deposito_nombre}
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

                    {/* Líneas Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-white">
                            <Heading level={6} className="text-slate-700">
                                Líneas de Ajuste ({lineas.length})
                            </Heading>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                                        <th className="py-4 px-4">#</th>
                                        <th className="py-4 px-4">Tipo</th>
                                        <th className="py-4 px-4">Variante</th>
                                        <th className="py-4 px-4">Lote</th>
                                        <th className="py-4 px-4 text-right">Cant. Anterior</th>
                                        <th className="py-4 px-4 text-right">Cant. Ajustada</th>
                                        <th className="py-4 px-4">Motivo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                                    {lineas.map((linea, idx) => (
                                        <tr key={linea.id || idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4 px-4">
                                                <Text variant="bodyXs" className="text-slate-400 font-bold">
                                                    {idx + 1}
                                                </Text>
                                            </td>
                                            <td className="py-4 px-4">
                                                <Badge variant={linea.tipo_operacion === 'ALTA' ? 'success' : 'danger'}>
                                                    {linea.tipo_operacion}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div>
                                                    <Text variant="bodySmBold" className="text-slate-800">
                                                        {linea.variante_codigo}
                                                    </Text>
                                                    <Text variant="bodyXs" className="text-slate-500">
                                                        {linea.variante_nombre}
                                                    </Text>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                {linea.lote_codigo ? (
                                                    <Text variant="bodySm" className="text-slate-600">
                                                        {linea.lote_codigo}
                                                    </Text>
                                                ) : linea.nuevo_lote_codigo ? (
                                                    <div>
                                                        <Text variant="bodySmBold" className="text-emerald-600">
                                                            {linea.nuevo_lote_codigo}
                                                        </Text>
                                                        <div className="flex flex-col gap-0.5 mt-1">
                                                            {linea.nuevo_vencimiento && (
                                                                <Text variant="bodyXs" className="text-slate-400">
                                                                    Venc: {new Date(linea.nuevo_vencimiento).toLocaleDateString()}
                                                                </Text>
                                                            )}
                                                            {linea.nuevo_costo && (
                                                                <Text variant="bodyXs" className="text-slate-400">
                                                                    Costo: ${Number(linea.nuevo_costo).toFixed(2)}
                                                                </Text>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <Text variant="bodyXs" className="text-slate-300">—</Text>
                                                )}
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <Text variant="bodySm" className="text-slate-500">
                                                    {linea.cantidad_anterior ?? '—'}
                                                </Text>
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <Text variant="bodySmBold" className={linea.tipo_operacion === 'ALTA' ? 'text-emerald-600' : 'text-rose-600'}>
                                                    {linea.tipo_operacion === 'ALTA' ? '+' : '-'}{linea.cantidad}
                                                </Text>
                                            </td>
                                            <td className="py-4 px-4">
                                                <Text variant="bodySm" className="text-slate-600 max-w-[200px] truncate">
                                                    {linea.motivo}
                                                </Text>
                                            </td>
                                        </tr>
                                    ))}
                                    {lineas.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="py-10 text-center">
                                                <Text variant="bodySm" className="text-slate-400">
                                                    No hay líneas de ajuste registradas.
                                                </Text>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
