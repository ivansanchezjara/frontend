"use client";
import { DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui';

// ─── Configuración de monedas ───────────────────────────────────

const MONEDA_CONFIG = {
    USD: { label: 'Dólar (USD)', symbol: 'US$', color: 'emerald', decimals: 2 },
    BRL: { label: 'Real (BRL)', symbol: 'R$', color: 'blue', decimals: 2 },
    PYG: { label: 'Guaraní (PYG)', symbol: '₲', color: 'amber', decimals: 0 },
};

function formatMonto(monto, decimals) {
    const num = Number(monto) || 0;
    if (decimals === 0) {
        return num.toLocaleString('es-PY', { maximumFractionDigits: 0 });
    }
    return num.toLocaleString('es-PY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Tarjeta de saldo por moneda ────────────────────────────────

function SaldoCard({ moneda, data }) {
    const config = MONEDA_CONFIG[moneda];
    if (!config) return null;

    const saldo = data?.saldo ?? 0;
    const ingresos = data?.ingresos ?? 0;
    const egresos = data?.egresos ?? 0;

    const colorMap = {
        emerald: {
            bg: 'bg-emerald-50',
            border: 'border-emerald-200',
            icon: 'text-emerald-600 bg-emerald-100',
            saldo: saldo >= 0 ? 'text-emerald-700' : 'text-red-600',
        },
        blue: {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            icon: 'text-blue-600 bg-blue-100',
            saldo: saldo >= 0 ? 'text-blue-700' : 'text-red-600',
        },
        amber: {
            bg: 'bg-amber-50',
            border: 'border-amber-200',
            icon: 'text-amber-600 bg-amber-100',
            saldo: saldo >= 0 ? 'text-amber-700' : 'text-red-600',
        },
    };

    const colors = colorMap[config.color];

    return (
        <div className={cn(
            'rounded-xl border p-4 transition-all',
            colors.bg, colors.border
        )}>
            <div className="flex items-center gap-3 mb-3">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', colors.icon)}>
                    <DollarSign className="w-4 h-4" />
                </div>
                <Text variant="label" className="text-slate-600 text-xs font-bold">
                    {config.label}
                </Text>
            </div>

            <div className="mb-3">
                <Text className={cn('text-xl font-black', colors.saldo)}>
                    {config.symbol} {formatMonto(saldo, config.decimals)}
                </Text>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
                <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="w-3 h-3" />
                    <span className="font-semibold">
                        {config.symbol} {formatMonto(ingresos, config.decimals)}
                    </span>
                </div>
                <div className="flex items-center gap-1 text-red-500">
                    <TrendingDown className="w-3 h-3" />
                    <span className="font-semibold">
                        {config.symbol} {formatMonto(egresos, config.decimals)}
                    </span>
                </div>
            </div>
        </div>
    );
}

// ─── Componente Principal ───────────────────────────────────────

/**
 * CajaChicaResumen - Muestra el resumen de saldos de caja chica por moneda.
 * @param {Object} props
 * @param {Object} props.saldos - Objeto con saldos por moneda { USD: {saldo, ingresos, egresos}, ... }
 * @param {boolean} props.loading - Estado de carga
 */
export default function CajaChicaResumen({ saldos, loading }) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['USD', 'BRL', 'PYG'].map(m => (
                    <div key={m} className="rounded-xl border border-slate-200 bg-slate-50 p-4 animate-pulse">
                        <div className="h-8 bg-slate-200 rounded w-1/2 mb-3" />
                        <div className="h-6 bg-slate-200 rounded w-3/4 mb-3" />
                        <div className="h-4 bg-slate-200 rounded w-full" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['USD', 'BRL', 'PYG'].map(moneda => (
                <SaldoCard
                    key={moneda}
                    moneda={moneda}
                    data={saldos?.[moneda]}
                />
            ))}
        </div>
    );
}
