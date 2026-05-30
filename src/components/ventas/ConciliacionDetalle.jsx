"use client";
import { Package, AlertTriangle, DollarSign, TrendingDown, TrendingUp } from 'lucide-react';
import { Badge, Section } from '@/components/ui';
import { Text } from '@/components/ui/basics/Typography';
import { cn } from '@/lib/utils';

// ─── Helpers ────────────────────────────────────────────────────

function formatMonto(monto, moneda) {
    if (monto == null) return '—';
    const num = Number(monto);
    if (moneda === 'PYG') {
        return `₲ ${num.toLocaleString('es-PY', { maximumFractionDigits: 0 })}`;
    }
    if (moneda === 'BRL') {
        return `R$ ${num.toLocaleString('es-PY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$ ${num.toLocaleString('es-PY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Sección: Ítems Pendientes ──────────────────────────────────

function ItemsPendientes({ items }) {
    if (!items || items.length === 0) {
        return (
            <div className="p-6 text-center">
                <Text variant="bodySmall" className="text-slate-400">
                    No hay ítems pendientes en esta conciliación.
                </Text>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-slate-100">
                        <th className="text-left py-2.5 px-4 text-[11px] font-bold uppercase text-slate-400">Producto</th>
                        <th className="text-left py-2.5 px-4 text-[11px] font-bold uppercase text-slate-400">Lote</th>
                        <th className="text-right py-2.5 px-4 text-[11px] font-bold uppercase text-slate-400">Original</th>
                        <th className="text-right py-2.5 px-4 text-[11px] font-bold uppercase text-slate-400">Vendido</th>
                        <th className="text-right py-2.5 px-4 text-[11px] font-bold uppercase text-slate-400">Devuelto</th>
                        <th className="text-right py-2.5 px-4 text-[11px] font-bold uppercase text-slate-400">Pendiente</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, idx) => {
                        const pendiente = item.cantidad_pendiente ?? (item.cantidad_original - (item.cantidad_vendida || 0) - (item.cantidad_devuelta || 0));
                        return (
                            <tr
                                key={idx}
                                className={cn(
                                    'border-b border-slate-50 transition-colors',
                                    pendiente > 0 ? 'bg-amber-50/40' : 'hover:bg-slate-50/50'
                                )}
                            >
                                <td className="py-2.5 px-4">
                                    <span className="font-medium text-slate-700">
                                        {item.variante_nombre || item.producto_nombre || `Variante #${item.variante_id || item.item_salida_id}`}
                                    </span>
                                </td>
                                <td className="py-2.5 px-4">
                                    <span className="text-xs font-mono text-slate-500">
                                        {item.lote_codigo || '—'}
                                    </span>
                                </td>
                                <td className="py-2.5 px-4 text-right font-medium text-slate-600">
                                    {item.cantidad_original}
                                </td>
                                <td className="py-2.5 px-4 text-right">
                                    <span className="text-emerald-600 font-medium">
                                        {item.cantidad_vendida || 0}
                                    </span>
                                </td>
                                <td className="py-2.5 px-4 text-right">
                                    <span className="text-blue-600 font-medium">
                                        {item.cantidad_devuelta || 0}
                                    </span>
                                </td>
                                <td className="py-2.5 px-4 text-right">
                                    <span className={cn(
                                        'font-bold',
                                        pendiente > 0 ? 'text-amber-600' : 'text-slate-400'
                                    )}>
                                        {pendiente}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

// ─── Sección: Discrepancias de Caja ─────────────────────────────

function DiscrepanciasCaja({ discrepancias, datosCaja }) {
    const monedas = ['USD', 'BRL', 'PYG'];
    const hayDiscrepancias = discrepancias && monedas.some(m => {
        const val = discrepancias[m] || discrepancias[m.toLowerCase()];
        return val && Number(val) !== 0;
    });

    return (
        <div className="p-6">
            {/* Saldos de caja */}
            {datosCaja && (
                <div className="mb-4">
                    <Text variant="label" className="text-slate-500 mb-2 block">
                        Saldo de Caja Chica del Vendedor
                    </Text>
                    <div className="grid grid-cols-3 gap-3">
                        {monedas.map(moneda => {
                            const saldo = datosCaja[moneda] || datosCaja[moneda.toLowerCase()] || 0;
                            return (
                                <div key={moneda} className="bg-slate-50 rounded-lg p-3 text-center">
                                    <Text variant="bodyXs" className="text-slate-400 uppercase font-bold">
                                        {moneda}
                                    </Text>
                                    <p className="text-lg font-bold text-slate-700 mt-0.5">
                                        {formatMonto(saldo, moneda)}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Discrepancias */}
            <Text variant="label" className="text-slate-500 mb-2 block">
                Discrepancias (Saldo Caja − Total Ventas Campo)
            </Text>
            {!hayDiscrepancias ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    <Text variant="bodySmall" className="text-emerald-700 font-medium">
                        Sin discrepancias. Los montos cuadran correctamente.
                    </Text>
                </div>
            ) : (
                <div className="space-y-2">
                    {monedas.map(moneda => {
                        const valor = Number(discrepancias[moneda] || discrepancias[moneda.toLowerCase()] || 0);
                        if (valor === 0) return null;
                        const esPositivo = valor > 0;
                        return (
                            <div
                                key={moneda}
                                className={cn(
                                    'flex items-center justify-between rounded-lg p-3 border',
                                    esPositivo
                                        ? 'bg-amber-50 border-amber-200'
                                        : 'bg-red-50 border-red-200'
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    {esPositivo
                                        ? <TrendingUp className="w-4 h-4 text-amber-600" />
                                        : <TrendingDown className="w-4 h-4 text-red-600" />
                                    }
                                    <Text variant="bodySmall" className={cn(
                                        'font-medium',
                                        esPositivo ? 'text-amber-700' : 'text-red-700'
                                    )}>
                                        {moneda}: {esPositivo ? 'Sobrante' : 'Faltante'}
                                    </Text>
                                </div>
                                <span className={cn(
                                    'font-bold text-sm',
                                    esPositivo ? 'text-amber-700' : 'text-red-700'
                                )}>
                                    {formatMonto(Math.abs(valor), moneda)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Componente Principal ───────────────────────────────────────

export default function ConciliacionDetalle({ conciliacion }) {
    if (!conciliacion) return null;

    const items = conciliacion.datos_items || [];
    const discrepancias = conciliacion.discrepancias || {};
    const datosCaja = conciliacion.datos_caja || {};

    return (
        <div className="space-y-6">
            {/* Ítems Pendientes */}
            <Section
                title="Ítems de Consignación"
                subtitle="Detalle de mercadería consignada al vendedor y su estado."
                action={
                    <div className="flex items-center gap-1.5 text-slate-400">
                        <Package size={14} />
                        <Text variant="bodyXs">{items.length} ítems</Text>
                    </div>
                }
            >
                <ItemsPendientes items={items} />
            </Section>

            {/* Discrepancias de Caja */}
            <Section
                title="Caja Chica"
                subtitle="Comparación entre saldo de caja y total de ventas en campo."
                action={
                    discrepancias && Object.values(discrepancias).some(v => Number(v) !== 0) ? (
                        <Badge variant="warning">Con discrepancias</Badge>
                    ) : (
                        <Badge variant="success">Sin discrepancias</Badge>
                    )
                }
            >
                <DiscrepanciasCaja discrepancias={discrepancias} datosCaja={datosCaja} />
            </Section>

            {/* Motivo de rechazo (si aplica) */}
            {conciliacion.estado === 'rechazado' && conciliacion.motivo_rechazo && (
                <Section
                    title="Motivo de Rechazo"
                    subtitle="Razón por la cual esta conciliación fue rechazada."
                >
                    <div className="p-6">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                            <Text variant="bodySmall" className="text-red-700">
                                {conciliacion.motivo_rechazo}
                            </Text>
                        </div>
                    </div>
                </Section>
            )}
        </div>
    );
}
