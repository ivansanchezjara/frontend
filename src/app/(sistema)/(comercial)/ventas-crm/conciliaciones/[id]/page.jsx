"use client";
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CheckCircle2, XCircle, User, Calendar, FileText } from 'lucide-react';
import { PageHeader, LoadingScreen, Badge, Button, Section } from '@/components/ui';
import { Text } from '@/components/ui/basics/Typography';
import { useApi } from '@/hooks/useApi';
import { getConciliacion, confirmarConciliacion, rechazarConciliacion } from '@/services/apis/ventas';
import { useToast } from '@/components/ui/feedback/ToastContext';
import { useConfirm } from '@/components/ui/feedback/ConfirmContext';
import ConciliacionDetalle from '@/components/comercial/ventas/shared/ConciliacionDetalle';

// ─── Configuración de estados ───────────────────────────────────

const ESTADO_BADGE_MAP = {
    borrador: { variant: 'warning', label: 'Borrador' },
    confirmado: { variant: 'success', label: 'Confirmado' },
    rechazado: { variant: 'danger', label: 'Rechazado' },
};

// ─── Helpers ────────────────────────────────────────────────────

function formatFecha(fechaStr) {
    if (!fechaStr) return '—';
    return new Date(fechaStr).toLocaleDateString('es-PY', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

// ─── Página de Detalle ──────────────────────────────────────────

export default function ConciliacionDetallePage() {
    const router = useRouter();
    const { id } = useParams();
    const { showToast } = useToast();
    const { confirm, prompt } = useConfirm();

    const {
        data: conciliacion,
        loading,
        error,
        execute: fetchConciliacion,
    } = useApi(getConciliacion);

    const { execute: ejecutarConfirmar, loading: confirmando } = useApi(confirmarConciliacion);
    const { execute: ejecutarRechazar, loading: rechazando } = useApi(rechazarConciliacion);

    const [hasLoaded, setHasLoaded] = useState(false);

    useEffect(() => {
        if (id) {
            fetchConciliacion(id).then(() => setHasLoaded(true));
        }
    }, [id, fetchConciliacion]);

    // ─── Acciones ───────────────────────────────────────────────

    const handleConfirmar = async () => {
        const ok = await confirm(
            '¿Estás seguro de confirmar esta conciliación? Esta acción no se puede deshacer.',
            'Confirmar Conciliación',
            { confirmText: 'Confirmar', type: 'success' }
        );
        if (!ok) return;

        try {
            await ejecutarConfirmar(id);
            showToast('Conciliación confirmada correctamente', 'success');
            fetchConciliacion(id);
        } catch (err) {
            showToast('Error al confirmar la conciliación', 'error');
        }
    };

    const handleRechazar = async () => {
        const motivo = await prompt(
            'Indicá el motivo por el cual se rechaza esta conciliación.',
            'Rechazar Conciliación',
            { placeholder: 'Motivo del rechazo...', type: 'danger', confirmText: 'Rechazar' }
        );
        if (!motivo) return;

        try {
            await ejecutarRechazar(id, { motivo_rechazo: motivo });
            showToast('Conciliación rechazada', 'success');
            fetchConciliacion(id);
        } catch (err) {
            showToast('Error al rechazar la conciliación', 'error');
        }
    };

    // ─── Estados de carga y error ───────────────────────────────

    if (loading && !hasLoaded) {
        return <LoadingScreen texto="Cargando conciliación..." />;
    }

    if (error && !conciliacion) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <Text variant="bodySmall" className="text-red-500">
                    Error al cargar la conciliación.
                </Text>
                <Button variant="secondary" onClick={() => router.push('/ventas-crm/conciliaciones')}>
                    Volver al listado
                </Button>
            </div>
        );
    }

    if (!conciliacion) return null;

    const estado = conciliacion.estado;
    const estadoBadge = ESTADO_BADGE_MAP[estado] || { variant: 'default', label: estado };
    const esBorrador = estado === 'borrador';

    return (
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">

            {/* HEADER */}
            <PageHeader
                breadcrumbs={[
                    { label: 'Conciliaciones', href: '/ventas-crm/conciliaciones' },
                    { label: `Conciliación #${conciliacion.id}` },
                ]}
                subtitle="Comercial · Detalle de conciliación"
                subtitleClassName="text-emerald-600"
            >
                <div className="flex items-center gap-3">
                    {esBorrador && (
                        <>
                            <Button
                                variant="danger"
                                size="md"
                                icon={XCircle}
                                onClick={handleRechazar}
                                disabled={rechazando || confirmando}
                                className="rounded-xl font-bold text-xs"
                            >
                                {rechazando ? 'RECHAZANDO...' : 'RECHAZAR'}
                            </Button>
                            <Button
                                variant="success"
                                size="md"
                                icon={CheckCircle2}
                                onClick={handleConfirmar}
                                disabled={confirmando || rechazando}
                                className="rounded-xl font-bold text-xs shadow-lg shadow-emerald-100"
                            >
                                {confirmando ? 'CONFIRMANDO...' : 'CONFIRMAR'}
                            </Button>
                        </>
                    )}
                </div>
            </PageHeader>

            <main className="flex-1 overflow-y-auto p-8 min-w-0">
                <div className="max-w-5xl mx-auto space-y-6">

                    {/* Información General */}
                    <Section
                        title="Información General"
                        subtitle="Datos principales de la conciliación."
                        action={<Badge variant={estadoBadge.variant}>{estadoBadge.label}</Badge>}
                    >
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-slate-100 rounded-lg">
                                        <User className="w-4 h-4 text-slate-500" />
                                    </div>
                                    <div>
                                        <Text variant="bodyXs" className="text-slate-400 uppercase font-bold">
                                            Vendedor
                                        </Text>
                                        <p className="text-sm font-semibold text-slate-700 mt-0.5">
                                            {conciliacion.vendedor_nombre || conciliacion.vendedor?.username || '—'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-slate-100 rounded-lg">
                                        <Calendar className="w-4 h-4 text-slate-500" />
                                    </div>
                                    <div>
                                        <Text variant="bodyXs" className="text-slate-400 uppercase font-bold">
                                            Fecha de Creación
                                        </Text>
                                        <p className="text-sm font-semibold text-slate-700 mt-0.5">
                                            {formatFecha(conciliacion.created_at)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-slate-100 rounded-lg">
                                        <FileText className="w-4 h-4 text-slate-500" />
                                    </div>
                                    <div>
                                        <Text variant="bodyXs" className="text-slate-400 uppercase font-bold">
                                            {estado === 'confirmado' ? 'Fecha de Confirmación' : 'Última Actualización'}
                                        </Text>
                                        <p className="text-sm font-semibold text-slate-700 mt-0.5">
                                            {formatFecha(conciliacion.confirmed_at || conciliacion.updated_at)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* Detalle de la conciliación (ítems + discrepancias) */}
                    <ConciliacionDetalle conciliacion={conciliacion} />

                </div>
            </main>
        </div>
    );
}
