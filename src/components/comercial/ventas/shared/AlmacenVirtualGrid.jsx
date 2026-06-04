"use client";
import { useMemo } from 'react';
import { Package, AlertTriangle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

// ─── Helpers ────────────────────────────────────────────────────

/**
 * Determina el estado de vencimiento de un lote.
 * - "vencido": fecha pasada
 * - "proximo": vence en los próximos 30 días
 * - "ok": más de 30 días de vigencia
 * - "sin_fecha": sin fecha de vencimiento
 */
function getEstadoVencimiento(vencimiento) {
    if (!vencimiento) return 'sin_fecha';

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaVenc = new Date(vencimiento + 'T00:00:00');

    if (fechaVenc < hoy) return 'vencido';

    const diffMs = fechaVenc - hoy;
    const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDias <= 30) return 'proximo';
    return 'ok';
}

function formatFecha(fecha) {
    if (!fecha) return '—';
    const d = new Date(fecha + 'T00:00:00');
    return d.toLocaleDateString('es-PY', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

// ─── Componente de fila ─────────────────────────────────────────

function VencimientoBadge({ estado }) {
    switch (estado) {
        case 'vencido':
            return (
                <Badge variant="danger" className="gap-1">
                    <XCircle className="w-3 h-3" />
                    Vencido
                </Badge>
            );
        case 'proximo':
            return (
                <Badge variant="warning" className="gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Próximo a vencer
                </Badge>
            );
        default:
            return null;
    }
}

// ─── Componente Principal ───────────────────────────────────────

/**
 * Grid de stock disponible del almacén virtual del vendedor.
 * Muestra ítems agrupados con indicación visual de vencimiento.
 *
 * @param {Object} props
 * @param {Array} props.items - Lista de ítems del almacén virtual
 * @param {boolean} props.loading - Estado de carga
 */
export default function AlmacenVirtualGrid({ items = [], loading = false }) {
    // Agrupar por variante para mostrar resumen
    const itemsConEstado = useMemo(() => {
        return items.map(item => ({
            ...item,
            estadoVencimiento: getEstadoVencimiento(item.vencimiento),
        }));
    }, [items]);

    // Resumen por variante
    const resumenVariantes = useMemo(() => {
        const map = new Map();
        for (const item of itemsConEstado) {
            const key = item.variante_id;
            if (!map.has(key)) {
                map.set(key, {
                    variante_id: item.variante_id,
                    product_code: item.product_code,
                    nombre_variante: item.nombre_variante,
                    total_disponible: 0,
                    lotes: [],
                    tieneProximoVencer: false,
                    tieneVencido: false,
                });
            }
            const grupo = map.get(key);
            grupo.total_disponible += item.disponible;
            grupo.lotes.push(item);
            if (item.estadoVencimiento === 'proximo') grupo.tieneProximoVencer = true;
            if (item.estadoVencimiento === 'vencido') grupo.tieneVencido = true;
        }
        return Array.from(map.values());
    }, [itemsConEstado]);

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
                <div className="flex items-center justify-center gap-3 text-slate-400">
                    <div className="w-5 h-5 border-2 border-slate-300 border-t-emerald-500 rounded-full animate-spin" />
                    <span className="text-sm">Cargando stock...</span>
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-500">Sin stock disponible</p>
                <p className="text-xs text-slate-400 mt-1">
                    No tenés mercadería en consignación actualmente.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-slate-50 text-slate-500">
                        <th className="py-3 pl-6 pr-4 text-[11px] font-black uppercase tracking-widest">
                            Código
                        </th>
                        <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">
                            Producto
                        </th>
                        <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">
                            Lote
                        </th>
                        <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest text-center">
                            Vencimiento
                        </th>
                        <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest text-right">
                            Disponible
                        </th>
                        <th className="py-3 pr-6 pl-4 text-[11px] font-black uppercase tracking-widest text-center">
                            Estado
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {itemsConEstado.map((item, idx) => {
                        const estado = item.estadoVencimiento;
                        const isVencido = estado === 'vencido';
                        const isProximo = estado === 'proximo';

                        return (
                            <tr
                                key={`${item.variante_id}-${item.lote_codigo}-${idx}`}
                                className={cn(
                                    'border-t border-slate-100 transition-colors',
                                    isVencido && 'bg-red-50/50',
                                    isProximo && 'bg-amber-50/40',
                                    !isVencido && !isProximo && 'hover:bg-slate-50/50'
                                )}
                            >
                                <td className="py-3 pl-6 pr-4">
                                    <span className={cn(
                                        'text-xs font-mono font-bold',
                                        isVencido ? 'text-red-400 line-through' : 'text-slate-700'
                                    )}>
                                        {item.product_code}
                                    </span>
                                </td>
                                <td className="py-3 px-4">
                                    <span className={cn(
                                        'text-sm',
                                        isVencido ? 'text-red-400 line-through' : 'text-slate-800 font-medium'
                                    )}>
                                        {item.nombre_variante}
                                    </span>
                                </td>
                                <td className="py-3 px-4">
                                    <span className="text-xs text-slate-500 font-mono">
                                        {item.lote_codigo}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                    <span className={cn(
                                        'text-xs',
                                        isVencido && 'text-red-500 font-semibold',
                                        isProximo && 'text-amber-600 font-semibold',
                                        !isVencido && !isProximo && 'text-slate-500'
                                    )}>
                                        {formatFecha(item.vencimiento)}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-right">
                                    <span className={cn(
                                        'text-sm font-bold tabular-nums',
                                        isVencido ? 'text-red-400' : 'text-slate-800'
                                    )}>
                                        {item.disponible}
                                    </span>
                                </td>
                                <td className="py-3 pr-6 pl-4 text-center">
                                    <VencimientoBadge estado={estado} />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Resumen por variante */}
            {resumenVariantes.length > 0 && (
                <div className="border-t border-slate-200 bg-slate-50/50 px-6 py-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                            {resumenVariantes.length} {resumenVariantes.length === 1 ? 'producto' : 'productos'} · {items.length} {items.length === 1 ? 'lote' : 'lotes'}
                        </span>
                        <div className="flex items-center gap-3">
                            {resumenVariantes.some(v => v.tieneProximoVencer) && (
                                <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                                    <AlertTriangle className="w-3 h-3" />
                                    Lotes próximos a vencer
                                </span>
                            )}
                            {resumenVariantes.some(v => v.tieneVencido) && (
                                <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                                    <XCircle className="w-3 h-3" />
                                    Lotes vencidos (no disponibles para venta)
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
