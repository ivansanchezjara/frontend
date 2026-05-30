"use client";
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    CheckCircle2,
    User,
    Calendar,
    MapPin,
    ShoppingCart,
    CreditCard,
    FileText,
    Receipt,
    AlertTriangle,
} from 'lucide-react';
import { PageHeader, LoadingScreen, Badge, Button, Section } from '@/components/ui';
import { Text } from '@/components/ui/basics/Typography';
import { useApi } from '@/hooks/useApi';
import { getVenta, confirmarVenta } from '@/services/apis/ventas';
import { useToast } from '@/components/ui/feedback/ToastContext';
import { useConfirm } from '@/components/ui/feedback/ConfirmContext';

// ─── Configuración de estados ───────────────────────────────────

const ESTADO_BADGE_MAP = {
    borrador: { variant: 'default', label: 'Borrador' },
    confirmado: { variant: 'success', label: 'Confirmado' },
    rechazado: { variant: 'danger', label: 'Rechazado' },
};

const ORIGEN_BADGE_MAP = {
    sucursal: { variant: 'primary', label: 'Sucursal' },
    campo: { variant: 'success', label: 'Campo' },
};

const MONEDA_LABELS = {
    USD: 'Dólar (USD)',
    PYG: 'Guaraní (PYG)',
    BRL: 'Real (BRL)',
};

const METODO_PAGO_LABELS = {
    cheque_usd: 'Cheque USD',
    cheque_pyg: 'Cheque PYG',
    efectivo_usd: 'Efectivo USD',
    efectivo_brl: 'Efectivo BRL',
    efectivo_pyg: 'Efectivo PYG',
    transferencia_pyg: 'Transferencia PYG',
    cuotas: 'Pago a Cuotas',
    tarjeta_credito: 'Tarjeta Crédito',
    tarjeta_debito: 'Tarjeta Débito',
    pix: 'PIX',
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

function formatMonto(monto, moneda) {
    if (monto == null) return '—';
    const num = Number(monto);
    if (moneda === 'PYG') {
        return num.toLocaleString('es-PY', { maximumFractionDigits: 0 });
    }
    return num.toLocaleString('es-PY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Página de Detalle de Venta ─────────────────────────────────

export default function VentaDetallePage() {
    const router = useRouter();
    const { id } = useParams();
    const { showToast } = useToast();
    const { confirm } = useConfirm();

    const {
        data: venta,
        loading,
        error,
        execute: fetchVenta,
    } = useApi(getVenta);

    const { execute: ejecutarConfirmar, loading: confirmando } = useApi(confirmarVenta, {
        handleError: false,
    });

    const [hasLoaded, setHasLoaded] = useState(false);
    const [errorConfirmar, setErrorConfirmar] = useState(null);

    useEffect(() => {
        if (id) {
            fetchVenta(id).then(() => setHasLoaded(true));
        }
    }, [id, fetchVenta]);

    // ─── Acción Confirmar ───────────────────────────────────────

    const handleConfirmar = async () => {
        const ok = await confirm(
            '¿Estás seguro de confirmar esta venta? Se descontará stock y se generará el comprobante interno. Esta acción no se puede deshacer.',
            'Confirmar Venta',
            { confirmText: 'Confirmar', type: 'success' }
        );
        if (!ok) return;

        setErrorConfirmar(null);

        try {
            await ejecutarConfirmar(id);
            showToast('Venta confirmada correctamente', 'success');
            fetchVenta(id);
        } catch (err) {
            const errorData = err?.data || err?.response?.data || err;

            // Manejar error de stock insuficiente
            if (errorData?.code === 'stock_insuficiente' || errorData?.type === 'StockInsuficienteError') {
                setErrorConfirmar({
                    tipo: 'stock_insuficiente',
                    mensaje: 'Stock insuficiente para confirmar la venta.',
                    lineas: errorData.lineas || errorData.detail?.lineas || [],
                });
            }
            // Manejar error de tipo de cambio no disponible
            else if (errorData?.code === 'tipo_cambio_no_disponible' || errorData?.type === 'TipoCambioNoDisponibleError') {
                setErrorConfirmar({
                    tipo: 'tipo_cambio_no_disponible',
                    mensaje: errorData.detail || errorData.message || 'No existe un tipo de cambio vigente para la moneda de negociación. Registre una cotización antes de confirmar.',
                    par: errorData.par || '',
                });
            }
            // Error genérico
            else {
                const mensaje = errorData?.detail || errorData?.message || 'Error al confirmar la venta.';
                setErrorConfirmar({
                    tipo: 'generico',
                    mensaje: typeof mensaje === 'string' ? mensaje : 'Error al confirmar la venta.',
                });
            }
        }
    };

    // ─── Estados de carga y error ───────────────────────────────

    if (loading && !hasLoaded) {
        return <LoadingScreen texto="Cargando venta..." />;
    }

    if (error && !venta) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <Text variant="bodySmall" className="text-red-500">
                    Error al cargar la venta.
                </Text>
                <Button variant="secondary" onClick={() => router.push('/ventas-crm/ventas')}>
                    Volver al listado
                </Button>
            </div>
        );
    }

    if (!venta) return null;

    const estado = venta.estado;
    const estadoBadge = ESTADO_BADGE_MAP[estado] || { variant: 'default', label: estado };
    const esBorrador = estado === 'borrador';
    const lineas = venta.lineas || [];
    const pagos = venta.pagos || [];
    const comprobante = venta.comprobante || null;
    const factura = venta.factura_legal || null;

    return (
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">

            {/* HEADER */}
            <PageHeader
                breadcrumbs={[
                    { label: 'Ventas', href: '/ventas-crm/ventas' },
                    { label: comprobante ? `Comprobante #${comprobante.numero}` : `Venta #${venta.id}` },
                ]}
                subtitle="Comercial · Detalle de venta"
                subtitleClassName="text-emerald-600"
            >
                <div className="flex items-center gap-3">
                    {esBorrador && (
                        <Button
                            variant="success"
                            size="md"
                            icon={CheckCircle2}
                            onClick={handleConfirmar}
                            disabled={confirmando}
                            className="rounded-xl font-bold text-xs shadow-lg shadow-emerald-100"
                        >
                            {confirmando ? 'CONFIRMANDO...' : 'CONFIRMAR VENTA'}
                        </Button>
                    )}
                </div>
            </PageHeader>

            <main className="flex-1 overflow-y-auto p-8 min-w-0">
                <div className="max-w-5xl mx-auto space-y-6">

                    {/* Error de confirmación */}
                    {errorConfirmar && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <div className="space-y-2">
                                    <p className="text-sm font-semibold text-red-700">
                                        {errorConfirmar.mensaje}
                                    </p>

                                    {/* Detalle de stock insuficiente */}
                                    {errorConfirmar.tipo === 'stock_insuficiente' && errorConfirmar.lineas.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-xs font-bold text-red-600 uppercase mb-1">
                                                Líneas con stock insuficiente:
                                            </p>
                                            <ul className="space-y-1">
                                                {errorConfirmar.lineas.map((linea, idx) => (
                                                    <li key={idx} className="text-xs text-red-600 flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                                        <span className="font-mono font-semibold">{linea.variante}</span>
                                                        <span>— Solicitado: {linea.solicitado}, Disponible: {linea.disponible}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Detalle de TC no disponible */}
                                    {errorConfirmar.tipo === 'tipo_cambio_no_disponible' && errorConfirmar.par && (
                                        <p className="text-xs text-red-600">
                                            Par de monedas sin cotización: <span className="font-mono font-bold">{errorConfirmar.par}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => setErrorConfirmar(null)}
                                className="text-xs text-red-500 hover:text-red-700 font-semibold underline"
                            >
                                Cerrar
                            </button>
                        </div>
                    )}

                    {/* Información General */}
                    <Section
                        title="Información General"
                        subtitle="Datos principales de la venta."
                        action={<Badge variant={estadoBadge.variant}>{estadoBadge.label}</Badge>}
                    >
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <InfoItem
                                    icon={MapPin}
                                    label="Origen"
                                    value={
                                        <Badge variant={ORIGEN_BADGE_MAP[venta.origen]?.variant || 'default'}>
                                            {ORIGEN_BADGE_MAP[venta.origen]?.label || venta.origen}
                                        </Badge>
                                    }
                                />
                                <InfoItem
                                    icon={User}
                                    label="Cliente"
                                    value={venta.cliente_nombre || venta.cliente?.razon_social || 'Venta mostrador'}
                                />
                                <InfoItem
                                    icon={User}
                                    label="Vendedor"
                                    value={venta.vendedor_nombre || venta.vendedor?.username || '—'}
                                />
                                <InfoItem
                                    icon={Calendar}
                                    label="Fecha de Creación"
                                    value={formatFecha(venta.created_at)}
                                />
                                <InfoItem
                                    icon={CreditCard}
                                    label="Moneda de Negociación"
                                    value={MONEDA_LABELS[venta.moneda_negociacion] || venta.moneda_negociacion}
                                />
                                <InfoItem
                                    icon={ShoppingCart}
                                    label="Total USD"
                                    value={`$${formatMonto(venta.total_usd, 'USD')}`}
                                />
                                {venta.moneda_negociacion !== 'USD' && (
                                    <InfoItem
                                        icon={CreditCard}
                                        label={`Total ${venta.moneda_negociacion}`}
                                        value={formatMonto(venta.total_moneda_negociacion, venta.moneda_negociacion)}
                                    />
                                )}
                                {venta.tipo_cambio_usado && (
                                    <InfoItem
                                        icon={FileText}
                                        label={`TC Usado (${venta.tipo_cambio_par || ''})`}
                                        value={formatMonto(venta.tipo_cambio_usado, 'USD')}
                                    />
                                )}
                                {venta.confirmed_at && (
                                    <InfoItem
                                        icon={Calendar}
                                        label="Fecha de Confirmación"
                                        value={formatFecha(venta.confirmed_at)}
                                    />
                                )}
                            </div>
                        </div>
                    </Section>

                    {/* Líneas de Venta */}
                    <Section
                        title="Líneas de Venta"
                        subtitle={`${lineas.length} ${lineas.length === 1 ? 'producto' : 'productos'} en esta venta.`}
                    >
                        {lineas.length === 0 ? (
                            <div className="p-6 text-center">
                                <Text variant="bodySm" className="text-slate-400">
                                    No hay líneas de venta registradas.
                                </Text>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500">
                                            <th className="py-3 pl-6 pr-4 text-[11px] font-black uppercase tracking-widest">#</th>
                                            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">Variante</th>
                                            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest text-center">Cantidad</th>
                                            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest text-right">Precio Unit. USD</th>
                                            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest text-right">Subtotal USD</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lineas.map((linea, idx) => (
                                            <tr
                                                key={linea.id || idx}
                                                className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors"
                                            >
                                                <td className="py-3 pl-6 pr-4 text-xs text-slate-400 font-mono">
                                                    {idx + 1}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-sm font-semibold text-slate-700">
                                                        {linea.variante_nombre || linea.variante?.nombre || linea.variante?.product_code || `Variante #${linea.variante_id || linea.variante}`}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className="text-sm font-semibold text-slate-700">
                                                        {linea.cantidad}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <span className="text-sm text-slate-600">
                                                        ${formatMonto(linea.precio_unitario_usd, 'USD')}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <span className="text-sm font-semibold text-slate-800">
                                                        ${formatMonto(linea.subtotal_usd, 'USD')}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-2 border-slate-200 bg-slate-50">
                                            <td colSpan={4} className="py-3 pl-6 pr-4 text-right">
                                                <span className="text-xs font-black uppercase text-slate-500">
                                                    Total USD
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <span className="text-sm font-bold text-slate-900">
                                                    ${formatMonto(venta.total_usd, 'USD')}
                                                </span>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </Section>

                    {/* Pagos */}
                    <Section
                        title="Pagos"
                        subtitle={`${pagos.length} ${pagos.length === 1 ? 'pago registrado' : 'pagos registrados'}.`}
                    >
                        {pagos.length === 0 ? (
                            <div className="p-6 text-center">
                                <Text variant="bodySm" className="text-slate-400">
                                    No hay pagos registrados.
                                </Text>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500">
                                            <th className="py-3 pl-6 pr-4 text-[11px] font-black uppercase tracking-widest">#</th>
                                            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">Método</th>
                                            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest text-center">Moneda</th>
                                            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest text-right">Monto</th>
                                            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">Referencia</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pagos.map((pago, idx) => (
                                            <tr
                                                key={pago.id || idx}
                                                className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors"
                                            >
                                                <td className="py-3 pl-6 pr-4 text-xs text-slate-400 font-mono">
                                                    {idx + 1}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-sm font-semibold text-slate-700">
                                                        {METODO_PAGO_LABELS[pago.metodo] || pago.metodo}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className="text-xs font-mono text-slate-500">
                                                        {pago.moneda}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <span className="text-sm font-semibold text-slate-800">
                                                        {formatMonto(pago.monto, pago.moneda)}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-xs text-slate-400">
                                                        {pago.referencia || '—'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Section>

                    {/* Comprobante Interno (solo si confirmado) */}
                    {comprobante && (
                        <Section
                            title="Comprobante Interno"
                            subtitle="Documento interno generado al confirmar la venta."
                            action={<Badge variant="success">Emitido</Badge>}
                        >
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <InfoItem
                                        icon={Receipt}
                                        label="Número"
                                        value={`#${comprobante.numero}`}
                                    />
                                    <InfoItem
                                        icon={MapPin}
                                        label="Sucursal"
                                        value={comprobante.sucursal_codigo || '—'}
                                    />
                                    <InfoItem
                                        icon={Calendar}
                                        label="Fecha de Emisión"
                                        value={formatFecha(comprobante.fecha_emision)}
                                    />
                                    <InfoItem
                                        icon={CreditCard}
                                        label="Total USD"
                                        value={`$${formatMonto(comprobante.total_usd, 'USD')}`}
                                    />
                                    {Number(comprobante.vuelto) > 0 && (
                                        <InfoItem
                                            icon={CreditCard}
                                            label="Vuelto"
                                            value={`$${formatMonto(comprobante.vuelto, 'USD')}`}
                                        />
                                    )}
                                </div>
                            </div>
                        </Section>
                    )}

                    {/* Factura Legal (solo si existe) */}
                    {factura && (
                        <Section
                            title="Factura Legal"
                            subtitle="Documento fiscal asociado a esta venta."
                            action={<Badge variant="info">Factura</Badge>}
                        >
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <InfoItem
                                        icon={FileText}
                                        label="RUC Destinatario"
                                        value={factura.ruc_destinatario || '—'}
                                    />
                                    <InfoItem
                                        icon={User}
                                        label="Nombre Comercial"
                                        value={factura.nombre_comercial || '—'}
                                    />
                                    <InfoItem
                                        icon={CreditCard}
                                        label="Moneda Facturación"
                                        value={factura.moneda_facturacion || '—'}
                                    />
                                    <InfoItem
                                        icon={CreditCard}
                                        label="Total Factura"
                                        value={formatMonto(factura.total_factura, factura.moneda_facturacion)}
                                    />
                                    <InfoItem
                                        icon={Calendar}
                                        label="Fecha"
                                        value={formatFecha(factura.created_at)}
                                    />
                                </div>
                            </div>
                        </Section>
                    )}

                </div>
            </main>
        </div>
    );
}

// ─── Componente auxiliar InfoItem ────────────────────────────────

function InfoItem({ icon: Icon, label, value }) {
    return (
        <div className="flex items-start gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
                <Icon className="w-4 h-4 text-slate-500" />
            </div>
            <div>
                <Text variant="bodyXs" className="text-slate-400 uppercase font-bold">
                    {label}
                </Text>
                <div className="text-sm font-semibold text-slate-700 mt-0.5">
                    {value}
                </div>
            </div>
        </div>
    );
}
