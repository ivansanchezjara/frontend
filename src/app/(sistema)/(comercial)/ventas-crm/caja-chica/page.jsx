"use client";
import { useEffect, useState, useCallback } from 'react';
import { Wallet, Plus, ArrowDownCircle, ArrowUpCircle, Calendar } from 'lucide-react';
import { EmptyState, LoadingScreen, PageHeader, Pagination, Badge, Button, Input, Section, Text } from '@/components/ui';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/components/ui/feedback/ToastContext';
import { getMovimientosCaja, getSaldoCajaChica, createMovimientoCaja } from '@/services/apis/ventas';
import { cn } from '@/lib/utils';
import CajaChicaResumen from '@/components/comercial/ventas/shared/CajaChicaResumen';

// ─── Configuración ──────────────────────────────────────────────

const MONEDAS = [
    { value: 'USD', label: 'USD - Dólar' },
    { value: 'BRL', label: 'BRL - Real' },
    { value: 'PYG', label: 'PYG - Guaraní' },
];

const TIPO_BADGE_MAP = {
    ingreso: { variant: 'success', label: 'Ingreso', icon: ArrowUpCircle },
    egreso: { variant: 'danger', label: 'Egreso', icon: ArrowDownCircle },
};

const MONEDA_SYMBOL = { USD: 'US$', BRL: 'R$', PYG: '₲' };

function formatMonto(monto, moneda) {
    const num = Number(monto) || 0;
    const decimals = moneda === 'PYG' ? 0 : 2;
    const formatted = decimals === 0
        ? num.toLocaleString('es-PY', { maximumFractionDigits: 0 })
        : num.toLocaleString('es-PY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${MONEDA_SYMBOL[moneda] || ''} ${formatted}`;
}

function formatFecha(fecha) {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-PY', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

// ─── Formulario de Egreso ───────────────────────────────────────

function EgresoForm({ onSuccess, saldos }) {
    const { showToast } = useToast();
    const { loading: submitting, execute: submitEgreso } = useApi(createMovimientoCaja);

    const [form, setForm] = useState({
        monto: '',
        moneda: 'PYG',
        concepto: '',
        fecha: new Date().toISOString().slice(0, 16),
    });
    const [errors, setErrors] = useState({});

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const validate = () => {
        const newErrors = {};
        const monto = parseFloat(form.monto);

        if (!form.monto || isNaN(monto) || monto <= 0) {
            newErrors.monto = 'El monto debe ser mayor a cero.';
        } else {
            // Verificar saldo disponible
            const saldoDisponible = saldos?.[form.moneda]?.saldo ?? 0;
            if (monto > saldoDisponible) {
                newErrors.monto = `Saldo insuficiente. Disponible: ${formatMonto(saldoDisponible, form.moneda)}`;
            }
        }

        if (!form.concepto.trim()) {
            newErrors.concepto = 'El concepto es obligatorio.';
        } else if (form.concepto.length > 200) {
            newErrors.concepto = 'Máximo 200 caracteres.';
        }

        if (!form.fecha) {
            newErrors.fecha = 'La fecha es obligatoria.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            await submitEgreso({
                tipo: 'egreso',
                monto: parseFloat(form.monto),
                moneda: form.moneda,
                concepto: form.concepto.trim(),
                fecha: new Date(form.fecha).toISOString(),
            });
            showToast('Egreso registrado correctamente', 'success');
            setForm({ monto: '', moneda: 'PYG', concepto: '', fecha: new Date().toISOString().slice(0, 16) });
            setErrors({});
            if (onSuccess) onSuccess();
        } catch (err) {
            const detail = err?.data?.monto?.[0] || err?.data?.detail || err?.message || 'Error al registrar el egreso.';
            showToast(detail, 'error');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Monto */}
                <Input
                    label="Monto"
                    type="number"
                    step={form.moneda === 'PYG' ? '1' : '0.01'}
                    min="0"
                    placeholder="0"
                    value={form.monto}
                    onChange={(e) => handleChange('monto', e.target.value)}
                    error={errors.monto}
                />

                {/* Moneda */}
                <div className="flex flex-col gap-1.5">
                    <Text as="label" variant="label">Moneda</Text>
                    <select
                        value={form.moneda}
                        onChange={(e) => handleChange('moneda', e.target.value)}
                        className={cn(
                            'block w-full rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium',
                            'px-3.5 py-2.5 outline-none transition-all',
                            'focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                        )}
                        aria-label="Moneda"
                    >
                        {MONEDAS.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                </div>

                {/* Fecha */}
                <Input
                    label="Fecha"
                    type="datetime-local"
                    value={form.fecha}
                    onChange={(e) => handleChange('fecha', e.target.value)}
                    error={errors.fecha}
                />
            </div>

            {/* Concepto */}
            <Input
                label="Concepto"
                type="text"
                placeholder="Descripción del gasto (ej: combustible, viáticos...)"
                maxLength={200}
                value={form.concepto}
                onChange={(e) => handleChange('concepto', e.target.value)}
                error={errors.concepto}
            />

            {/* Botón submit */}
            <div className="flex justify-end pt-2">
                <Button
                    type="submit"
                    variant="danger"
                    size="md"
                    icon={ArrowDownCircle}
                    disabled={submitting}
                    className="rounded-xl font-bold text-xs"
                >
                    {submitting ? 'REGISTRANDO...' : 'REGISTRAR EGRESO'}
                </Button>
            </div>
        </form>
    );
}

// ─── Tabla de Movimientos ───────────────────────────────────────

function MovimientosTable({ movimientos }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-slate-50 text-slate-500">
                        <th className="py-3 pl-6 pr-4 text-[11px] font-black uppercase tracking-widest">Tipo</th>
                        <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">Concepto</th>
                        <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest text-right">Monto</th>
                        <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">Moneda</th>
                        <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">Fecha</th>
                    </tr>
                </thead>
                <tbody>
                    {movimientos.map(mov => {
                        const tipoConfig = TIPO_BADGE_MAP[mov.tipo] || { variant: 'default', label: mov.tipo };
                        const Icon = tipoConfig.icon;
                        return (
                            <tr
                                key={mov.id}
                                className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors"
                            >
                                <td className="py-3 pl-6 pr-4">
                                    <div className="flex items-center gap-2">
                                        {Icon && (
                                            <Icon className={cn(
                                                'w-4 h-4',
                                                mov.tipo === 'ingreso' ? 'text-green-500' : 'text-red-500'
                                            )} />
                                        )}
                                        <Badge variant={tipoConfig.variant}>{tipoConfig.label}</Badge>
                                    </div>
                                </td>
                                <td className="py-3 px-4">
                                    <span className="text-sm text-slate-700">{mov.concepto || '—'}</span>
                                </td>
                                <td className="py-3 px-4 text-right">
                                    <span className={cn(
                                        'text-sm font-semibold',
                                        mov.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'
                                    )}>
                                        {mov.tipo === 'ingreso' ? '+' : '-'} {formatMonto(mov.monto, mov.moneda)}
                                    </span>
                                </td>
                                <td className="py-3 px-4">
                                    <span className="text-xs text-slate-500 font-medium">{mov.moneda}</span>
                                </td>
                                <td className="py-3 px-4">
                                    <span className="text-xs text-slate-400">{formatFecha(mov.fecha)}</span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

// ─── Página Principal ───────────────────────────────────────────

export default function CajaChicaPage() {
    const {
        data: saldoData,
        loading: loadingSaldo,
        execute: fetchSaldo,
    } = useApi(getSaldoCajaChica);

    const {
        data: movimientosData,
        loading: loadingMovimientos,
        execute: fetchMovimientos,
    } = useApi(getMovimientosCaja);

    const movimientos = movimientosData?.results || [];
    const count = movimientosData?.count || 0;
    const pageSize = 24;

    const [page, setPage] = useState(1);
    const [showForm, setShowForm] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    // Cargar datos iniciales
    useEffect(() => {
        fetchSaldo();
    }, [fetchSaldo]);

    useEffect(() => {
        fetchMovimientos({ page }).then(() => setHasLoadedOnce(true));
    }, [fetchMovimientos, page]);

    // Refrescar después de registrar un egreso
    const handleEgresoSuccess = useCallback(() => {
        fetchSaldo();
        fetchMovimientos({ page: 1 });
        setPage(1);
        setShowForm(false);
    }, [fetchSaldo, fetchMovimientos]);

    // Pantalla de carga inicial
    if (loadingSaldo && loadingMovimientos && !hasLoadedOnce) {
        return <LoadingScreen texto="Cargando caja chica..." />;
    }

    const saldos = saldoData?.saldos || {};

    return (
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">

            {/* HEADER */}
            <PageHeader
                title="Caja Chica"
                subtitle={`Ventas · ${count} movimientos en el período activo`}
                subtitleClassName="text-emerald-600"
            >
                <Button
                    variant={showForm ? 'secondary' : 'danger'}
                    size="md"
                    icon={showForm ? undefined : Plus}
                    className="rounded-xl font-bold text-xs shadow-lg shadow-red-100/50 cursor-pointer"
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? 'CANCELAR' : 'REGISTRAR EGRESO'}
                </Button>
            </PageHeader>

            <main className="flex-1 overflow-y-auto p-8 min-w-0">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* RESUMEN DE SALDOS */}
                    <CajaChicaResumen saldos={saldos} loading={loadingSaldo && !hasLoadedOnce} />

                    {/* FORMULARIO DE EGRESO */}
                    {showForm && (
                        <Section
                            title="REGISTRAR EGRESO"
                            subtitle="Registrar un gasto de caja chica"
                            action={
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                    <Wallet className="w-3.5 h-3.5" />
                                    <span>Nuevo movimiento</span>
                                </div>
                            }
                        >
                            <EgresoForm
                                onSuccess={handleEgresoSuccess}
                                saldos={saldos}
                            />
                        </Section>
                    )}

                    {/* LISTADO DE MOVIMIENTOS */}
                    <Section
                        title="MOVIMIENTOS DEL PERÍODO"
                        subtitle="Movimientos posteriores a la última conciliación"
                        action={
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Período activo</span>
                            </div>
                        }
                    >
                        <div className={cn(
                            'transition-opacity duration-300',
                            loadingMovimientos ? 'opacity-50 pointer-events-none' : 'opacity-100'
                        )}>
                            {movimientos.length === 0 ? (
                                <div className="p-8">
                                    <EmptyState
                                        titulo="Sin movimientos"
                                        descripcion="No hay movimientos registrados en el período activo. Los ingresos se generan automáticamente al confirmar ventas en campo con pago en efectivo."
                                    />
                                </div>
                            ) : (
                                <MovimientosTable movimientos={movimientos} />
                            )}
                        </div>
                    </Section>

                    {/* PAGINACIÓN */}
                    {count > pageSize && (
                        <Pagination
                            count={count}
                            pageSize={pageSize}
                            currentPage={page}
                            onPageChange={setPage}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}
