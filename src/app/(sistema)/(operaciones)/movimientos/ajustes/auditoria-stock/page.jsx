"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ClipboardList, Plus, Search, Lock, CheckCircle,
    Clock, XCircle, BarChart3, Filter
} from 'lucide-react';
import { PageHeader, Text, Heading, Badge, Pagination, EmptyState, LoadingScreen } from '@/components/ui';
import { useApi } from '@/hooks/useApi';
import { getAuditoriasStock } from '@/services/apis/movimientos';

const ESTADO_CONFIG = {
    BORRADOR: { label: 'Borrador', color: 'bg-slate-100 text-slate-600', icon: Clock },
    EN_CONTEO: { label: 'En Conteo', color: 'bg-amber-100 text-amber-700', icon: Lock },
    EN_CONCILIACION: { label: 'Conciliación', color: 'bg-blue-100 text-blue-700', icon: BarChart3 },
    APROBADO: { label: 'Aprobado', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    RECHAZADO: { label: 'Rechazado', color: 'bg-red-100 text-red-600', icon: XCircle },
};

export default function AuditoriaStockPage() {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [estadoFilter, setEstadoFilter] = useState('');

    const { data, loading, execute } = useApi(getAuditoriasStock, { auto: false });

    useEffect(() => {
        const params = { page };
        if (searchTerm) params.search = searchTerm;
        if (estadoFilter) params.estado = estadoFilter;
        execute(params);
    }, [page, searchTerm, estadoFilter]);

    const auditorias = data?.results || [];
    const totalCount = data?.count || 0;

    return (
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
            <PageHeader
                breadcrumbs={[
                    { label: "Gestión de Movimientos", href: "/movimientos" },
                    { label: "Ajustes de Inventario", href: "/movimientos/ajustes" },
                    { label: "Auditoría de Stock" },
                ]}
                subtitle={<><ClipboardList size={12} />Recuentos masivos y conciliación de stock</>}
            >
                <button
                    onClick={() => router.push('/movimientos/ajustes/auditoria-stock/nuevo')}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 transition-all active:scale-95"
                >
                    <Plus size={14} /> NUEVA AUDITORÍA
                </button>
            </PageHeader>

            <main className="flex-1 overflow-y-auto p-8 min-w-0">
                <div className="max-w-[1600px] mx-auto space-y-6">
                    {/* Filtros */}
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="relative flex-1 min-w-[280px] max-w-md">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder="Buscar por título, marca, usuario..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter size={14} className="text-slate-400" />
                            <select value={estadoFilter}
                                onChange={(e) => { setEstadoFilter(e.target.value); setPage(1); }}
                                className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none">
                                <option value="">Todos los estados</option>
                                <option value="BORRADOR">Borrador</option>
                                <option value="EN_CONTEO">En Conteo</option>
                                <option value="EN_CONCILIACION">En Conciliación</option>
                                <option value="APROBADO">Aprobado</option>
                                <option value="RECHAZADO">Rechazado</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (<LoadingScreen />) : auditorias.length === 0 ? (
                        <EmptyState icon={<ClipboardList size={48} />} title="Sin auditorías"
                            description="No se encontraron auditorías de stock. Creá una nueva para iniciar un recuento masivo." />
                    ) : (
                        <div className="space-y-3">
                            {auditorias.map((aud) => {
                                const config = ESTADO_CONFIG[aud.estado] || ESTADO_CONFIG.BORRADOR;
                                const IconEstado = config.icon;
                                const progreso = aud.total_lineas > 0 ? Math.round((aud.lineas_contadas / aud.total_lineas) * 100) : 0;
                                return (
                                    <button key={aud.id}
                                        onClick={() => router.push(`/movimientos/ajustes/auditoria-stock/${aud.id}`)}
                                        className="w-full text-left bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${config.color}`}>
                                                <IconEstado size={22} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <Text variant="bodyXs" className="text-slate-400 font-black uppercase tracking-widest">AUD-{aud.id}</Text>
                                                    <Badge className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest border-none ${config.color}`}>{config.label}</Badge>
                                                    {aud.modo_seleccion === 'MARCA' && aud.marca_filtro && (
                                                        <Badge className="text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest border-none bg-purple-100 text-purple-700">{aud.marca_filtro}</Badge>
                                                    )}
                                                </div>
                                                <Heading level={5} className="text-slate-900 group-hover:text-blue-600 transition-colors truncate">{aud.titulo}</Heading>
                                                <div className="flex items-center gap-4 mt-1">
                                                    <Text variant="bodyXs" className="text-slate-400">{new Date(aud.fecha_creacion).toLocaleDateString('es-PY')}</Text>
                                                    <Text variant="bodyXs" className="text-slate-400">por {aud.usuario_nombre}</Text>
                                                    {aud.deposito_nombre && <Text variant="bodyXs" className="text-slate-400">📍 {aud.deposito_nombre}</Text>}
                                                </div>
                                            </div>
                                            <div className="shrink-0 text-right min-w-[120px]">
                                                <Text variant="label" className="text-slate-400 block mb-1">PROGRESO</Text>
                                                <Text className="text-lg font-black text-slate-900">{aud.lineas_contadas}/{aud.total_lineas}</Text>
                                                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progreso}%` }} />
                                                </div>
                                                {aud.total_diferencias > 0 && <Text variant="bodyXs" className="text-amber-600 font-bold mt-1">{aud.total_diferencias} diferencias</Text>}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    {totalCount > 24 && <Pagination currentPage={page} totalItems={totalCount} pageSize={24} onPageChange={setPage} />}
                </div>
            </main>
        </div>
    );
}
