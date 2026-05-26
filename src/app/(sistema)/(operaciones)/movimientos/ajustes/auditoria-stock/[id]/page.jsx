"use client";
import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    ClipboardList, Lock, CheckCircle, XCircle, Play,
    BarChart3, Search, Save, ArrowRight
} from 'lucide-react';
import { PageHeader, Text, Heading, Badge, LoadingScreen } from '@/components/ui';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/components/ui/feedback/ToastContext';
import { useConfirm } from '@/components/ui/feedback/ConfirmContext';
import {
    getAuditoriaStock, iniciarConteoAuditoria, registrarConteoAuditoria,
    pasarConciliacionAuditoria, aprobarAuditoriaStock, rechazarAuditoriaStock,
} from '@/services/apis/movimientos';

const ESTADO_CONFIG = {
    BORRADOR: { label: 'Borrador', color: 'bg-slate-100 text-slate-600' },
    EN_CONTEO: { label: 'En Conteo (Bloqueado)', color: 'bg-amber-100 text-amber-700' },
    EN_CONCILIACION: { label: 'En Conciliación', color: 'bg-blue-100 text-blue-700' },
    APROBADO: { label: 'Aprobado', color: 'bg-emerald-100 text-emerald-700' },
    RECHAZADO: { label: 'Rechazado', color: 'bg-red-100 text-red-600' },
};

export default function AuditoriaStockDetailPage() {
    const params = useParams();
    const { showToast } = useToast();
    const { confirm } = useConfirm();
    const id = params.id;

    const [auditoria, setAuditoria] = useState(null);
    const [conteoLocal, setConteoLocal] = useState({});
    const [searchLinea, setSearchLinea] = useState('');
    const [filterDiferencia, setFilterDiferencia] = useState(false);

    const { loading, execute: fetchAuditoria } = useApi(getAuditoriaStock, { auto: false });
    const { execute: doIniciar, loading: loadingIniciar } = useApi(iniciarConteoAuditoria, { auto: false });
    const { execute: doConteo, loading: loadingConteo } = useApi(registrarConteoAuditoria, { auto: false });
    const { execute: doConciliar, loading: loadingConciliar } = useApi(pasarConciliacionAuditoria, { auto: false });
    const { execute: doAprobar, loading: loadingAprobar } = useApi(aprobarAuditoriaStock, { auto: false });
    const { execute: doRechazar, loading: loadingRechazar } = useApi(rechazarAuditoriaStock, { auto: false });

    useEffect(() => { loadData(); }, [id]);

    async function loadData() {
        const result = await fetchAuditoria(id);
        if (result) {
            setAuditoria(result);
            const local = {};
            (result.lineas || []).forEach(l => { local[l.id] = { cantidad_fisica: l.cantidad_fisica ?? '', observacion: l.observacion || '' }; });
            setConteoLocal(local);
        }
    }

    const handleIniciar = async () => {
        if (!await confirm("¿Iniciar el conteo? Los productos quedarán bloqueados para venta hasta finalizar.", "Iniciar Conteo")) return;
        try { const r = await doIniciar(id); setAuditoria(r); showToast("Conteo iniciado. Productos bloqueados.", "success"); }
        catch { showToast("Error al iniciar conteo.", "error"); }
    };
    const handleConteoChange = (lineaId, field, value) => {
        setConteoLocal(prev => ({ ...prev, [lineaId]: { ...prev[lineaId], [field]: value } }));
    };
    const handleGuardarConteo = async () => {
        const lineas = Object.entries(conteoLocal)
            .filter(([, v]) => v.cantidad_fisica !== '' && v.cantidad_fisica !== null)
            .map(([lid, v]) => ({ id: parseInt(lid), cantidad_fisica: parseInt(v.cantidad_fisica), observacion: v.observacion || '' }));
        if (lineas.length === 0) { showToast("No hay conteos para guardar.", "error"); return; }
        try { const r = await doConteo(id, lineas); setAuditoria(r); showToast(`${lineas.length} línea(s) guardadas.`, "success"); }
        catch { showToast("Error al guardar conteo.", "error"); }
    };
    const handleConciliar = async () => {
        if (!await confirm("¿Pasar a conciliación? Podrá revisar las diferencias antes de aprobar.", "Pasar a Conciliación")) return;
        try { const r = await doConciliar(id); setAuditoria(r); showToast("Auditoría en etapa de conciliación.", "success"); }
        catch { showToast("Error al pasar a conciliación.", "error"); }
    };
    const handleAprobar = async () => {
        if (!await confirm("¿Aprobar esta auditoría? Se aplicarán las diferencias al stock real.", "Aprobar Auditoría")) return;
        try { const r = await doAprobar(id); setAuditoria(r); showToast("Auditoría aprobada. Stock actualizado.", "success"); }
        catch { showToast("Error al aprobar auditoría.", "error"); }
    };
    const handleRechazar = async () => {
        if (!await confirm("¿Rechazar esta auditoría? No se aplicarán cambios al stock.", "Rechazar Auditoría")) return;
        try { const r = await doRechazar(id); setAuditoria(r); showToast("Auditoría rechazada. Productos desbloqueados.", "success"); }
        catch { showToast("Error al rechazar auditoría.", "error"); }
    };

    const lineasFiltradas = useMemo(() => {
        if (!auditoria?.lineas) return [];
        let lineas = auditoria.lineas;
        if (searchLinea) {
            const s = searchLinea.toLowerCase();
            lineas = lineas.filter(l => l.variante_codigo?.toLowerCase().includes(s) || l.variante_nombre?.toLowerCase().includes(s) || l.nombre_variante?.toLowerCase().includes(s) || l.lote_codigo?.toLowerCase().includes(s));
        }
        if (filterDiferencia) lineas = lineas.filter(l => l.contado && l.diferencia !== 0);
        return lineas;
    }, [auditoria?.lineas, searchLinea, filterDiferencia]);

    const stats = useMemo(() => {
        if (!auditoria?.lineas) return { total: 0, contadas: 0, diferencias: 0, sobrante: 0, faltante: 0 };
        const lineas = auditoria.lineas;
        const contadas = lineas.filter(l => l.contado);
        const conDif = contadas.filter(l => l.diferencia !== 0);
        return { total: lineas.length, contadas: contadas.length, diferencias: conDif.length,
            sobrante: conDif.filter(l => l.diferencia > 0).reduce((s, l) => s + l.diferencia, 0),
            faltante: conDif.filter(l => l.diferencia < 0).reduce((s, l) => s + Math.abs(l.diferencia), 0) };
    }, [auditoria?.lineas]);

    if (loading || !auditoria) return <LoadingScreen />;
    const config = ESTADO_CONFIG[auditoria.estado] || ESTADO_CONFIG.BORRADOR;
    const esEditable = ['EN_CONTEO', 'EN_CONCILIACION'].includes(auditoria.estado);

    return (
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
            <PageHeader
                breadcrumbs={[
                    { label: "Gestión de Movimientos", href: "/movimientos" },
                    { label: "Ajustes de Inventario", href: "/movimientos/ajustes" },
                    { label: "Auditoría de Stock", href: "/movimientos/ajustes/auditoria-stock" },
                    { label: `AUD-${auditoria.id}` },
                ]}
                subtitle={<><ClipboardList size={12} />{auditoria.titulo}</>}
            >
                <div className="flex items-center gap-2">
                    {auditoria.estado === 'BORRADOR' && (<>
                        <button onClick={handleRechazar} disabled={loadingRechazar} className="px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all">CANCELAR</button>
                        <button onClick={handleIniciar} disabled={loadingIniciar} className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95"><Play size={14} /> INICIAR CONTEO</button>
                    </>)}
                    {auditoria.estado === 'EN_CONTEO' && (<>
                        <button onClick={handleGuardarConteo} disabled={loadingConteo} className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95"><Save size={14} /> GUARDAR CONTEO</button>
                        <button onClick={handleConciliar} disabled={loadingConciliar} className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95"><ArrowRight size={14} /> CONCILIAR</button>
                    </>)}
                    {auditoria.estado === 'EN_CONCILIACION' && (<>
                        <button onClick={handleGuardarConteo} disabled={loadingConteo} className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95"><Save size={14} /> GUARDAR CAMBIOS</button>
                        <button onClick={handleRechazar} disabled={loadingRechazar} className="px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-red-50 text-red-600 hover:bg-red-100 transition-all"><XCircle size={14} className="inline mr-1" />RECHAZAR</button>
                        <button onClick={handleAprobar} disabled={loadingAprobar} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95"><CheckCircle size={14} /> APROBAR</button>
                    </>)}
                </div>
            </PageHeader>

            <main className="flex-1 overflow-y-auto p-8 min-w-0">
                <div className="max-w-[1800px] mx-auto space-y-6">
                    {/* Info + Estado */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-3">
                                <Badge className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border-none ${config.color}`}>{config.label}</Badge>
                                {auditoria.marca_filtro && <Badge className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border-none bg-purple-100 text-purple-700">Marca: {auditoria.marca_filtro}</Badge>}
                                <Badge className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border-none bg-slate-100 text-slate-600">{auditoria.deposito_nombre ? `📍 ${auditoria.deposito_nombre}` : 'Todos los depósitos'}</Badge>
                            </div>
                            <div className="flex items-center gap-6 text-xs text-slate-400">
                                <span>Creado: {new Date(auditoria.fecha_creacion).toLocaleString('es-PY')}</span>
                                <span>por {auditoria.usuario_nombre}</span>
                                {auditoria.aprobado_por_nombre && <span className="text-emerald-600">Aprobado por: {auditoria.aprobado_por_nombre}</span>}
                            </div>
                        </div>
                        {auditoria.observaciones && <Text variant="bodySm" className="text-slate-500 italic">"{auditoria.observaciones}"</Text>}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center"><Text variant="label" className="text-slate-400 block mb-1">TOTAL LOTES</Text><Text className="text-2xl font-black text-slate-900">{stats.total}</Text></div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center"><Text variant="label" className="text-slate-400 block mb-1">CONTADOS</Text><Text className="text-2xl font-black text-blue-600">{stats.contadas}</Text></div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center"><Text variant="label" className="text-slate-400 block mb-1">CON DIFERENCIA</Text><Text className="text-2xl font-black text-amber-600">{stats.diferencias}</Text></div>
                        <div className="bg-white p-4 rounded-2xl border border-emerald-100 text-center"><Text variant="label" className="text-slate-400 block mb-1">SOBRANTE</Text><Text className="text-2xl font-black text-emerald-600">+{stats.sobrante}</Text></div>
                        <div className="bg-white p-4 rounded-2xl border border-red-100 text-center"><Text variant="label" className="text-slate-400 block mb-1">FALTANTE</Text><Text className="text-2xl font-black text-red-600">-{stats.faltante}</Text></div>
                    </div>

                    {auditoria.estado === 'EN_CONTEO' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                            <Lock size={18} className="text-amber-600 shrink-0" />
                            <Text variant="bodySm" className="text-amber-700 font-medium">Los productos de esta auditoría están <strong>bloqueados para venta</strong>. Complete el conteo y pase a conciliación para revisar diferencias.</Text>
                        </div>
                    )}

                    {/* Tabla */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white sticky top-0 z-20">
                            <Heading level={5}>Líneas de Auditoría ({lineasFiltradas.length})</Heading>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="text" placeholder="Buscar lote o producto..." value={searchLinea} onChange={(e) => setSearchLinea(e.target.value)}
                                        className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs w-[220px] focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer select-none">
                                    <input type="checkbox" checked={filterDiferencia} onChange={(e) => setFilterDiferencia(e.target.checked)} className="rounded" />Solo diferencias
                                </label>
                            </div>
                        </div>
                        <div className="overflow-auto max-h-[600px]">
                            <table className="w-full border-collapse text-[11px]">
                                <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-100 uppercase text-slate-400 font-black">
                                    <tr>
                                        <th className="p-3 text-left w-[140px]">Código</th>
                                        <th className="p-3 text-left">Producto / Variante</th>
                                        <th className="p-3 text-left w-[120px]">Lote</th>
                                        <th className="p-3 text-left w-[100px]">Depósito</th>
                                        <th className="p-3 text-center w-[90px]">Sistema</th>
                                        <th className="p-3 text-center w-[110px]">Físico</th>
                                        <th className="p-3 text-center w-[80px]">Dif.</th>
                                        <th className="p-3 text-left w-[180px]">Observación</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {lineasFiltradas.map((linea) => {
                                        const local = conteoLocal[linea.id] || {};
                                        const dif = local.cantidad_fisica !== '' && local.cantidad_fisica !== null ? parseInt(local.cantidad_fisica) - linea.cantidad_sistema : linea.diferencia;
                                        const hasDif = linea.contado && linea.diferencia !== 0;
                                        return (
                                            <tr key={linea.id} className={`hover:bg-slate-50/80 transition-all ${hasDif ? 'bg-amber-50/30' : ''}`}>
                                                <td className="p-2.5"><Text variant="bodyXs" className="text-blue-600 font-black uppercase tracking-wider">{linea.variante_codigo}</Text></td>
                                                <td className="p-2.5"><Text className="font-bold text-slate-900 text-[11px] truncate">{linea.variante_nombre}</Text><Text variant="bodyXs" className="text-slate-400">{linea.nombre_variante}</Text></td>
                                                <td className="p-2.5"><Text variant="bodyXs" className="font-bold text-slate-700">{linea.lote_codigo}</Text>{linea.vencimiento && <Text variant="bodyXs" className={new Date(linea.vencimiento) < new Date() ? 'text-red-500' : 'text-slate-400'}>{new Date(linea.vencimiento).toLocaleDateString('es-PY')}</Text>}</td>
                                                <td className="p-2.5"><Text variant="bodyXs" className="text-slate-500">{linea.deposito_nombre}</Text></td>
                                                <td className="p-2.5 text-center"><Text className="font-black text-slate-900">{linea.cantidad_sistema}</Text></td>
                                                <td className="p-2.5 text-center">
                                                    {esEditable ? (<input type="number" min="0" value={local.cantidad_fisica ?? ''} onChange={(e) => handleConteoChange(linea.id, 'cantidad_fisica', e.target.value)} className="w-full border border-slate-200 rounded-lg p-1.5 text-center font-bold text-[11px] focus:ring-2 focus:ring-blue-500 outline-none" placeholder="—" />
                                                    ) : (<Text className={`font-black ${linea.contado ? 'text-slate-900' : 'text-slate-300'}`}>{linea.cantidad_fisica ?? '—'}</Text>)}
                                                </td>
                                                <td className="p-2.5 text-center">
                                                    {(linea.contado || (local.cantidad_fisica !== '' && local.cantidad_fisica !== null)) ? (
                                                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black ${dif > 0 ? 'bg-emerald-100 text-emerald-700' : dif < 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>{dif > 0 ? `+${dif}` : dif}</span>
                                                    ) : <Text className="text-slate-300">—</Text>}
                                                </td>
                                                <td className="p-2.5">
                                                    {esEditable ? (<input type="text" value={local.observacion ?? ''} onChange={(e) => handleConteoChange(linea.id, 'observacion', e.target.value)} className="w-full border border-slate-200 rounded-lg p-1.5 text-[10px] focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nota..." maxLength={255} />
                                                    ) : <Text variant="bodyXs" className="text-slate-400 italic truncate">{linea.observacion || '—'}</Text>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {lineasFiltradas.length === 0 && (
                                        <tr><td colSpan={8} className="py-16 text-center"><ClipboardList size={32} className="mx-auto text-slate-200 mb-3" /><Text variant="bodySm" className="text-slate-400">{searchLinea || filterDiferencia ? 'No se encontraron líneas con los filtros aplicados.' : 'No hay líneas en esta auditoría.'}</Text></td></tr>
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
