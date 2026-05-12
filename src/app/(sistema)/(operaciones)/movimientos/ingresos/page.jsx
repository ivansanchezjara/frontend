"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LoadingScreen from '@/components/ui/LoadingScreen';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import Pagination from '@/components/ui/Pagination';
import { 
    CheckCircle, Clock, Package, User, MapPin, 
    Plus, Calendar, XCircle, Search, Filter, ChevronDown 
} from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useDebounce } from '@/hooks/useDebounce';
import { getIngresos, aprobarIngreso, rechazarIngreso } from '@/services/apis/movimientos';

export default function IngresosPage() {
    const router = useRouter();
    
    // Estados de filtros y paginación
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 500);
    const [filters, setFilters] = useState({
        fecha_inicio: '',
        fecha_fin: '',
        estado: ''
    });
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 24;

    const { data: ingresosData, loading, execute: fetchIngresos } = useApi(getIngresos, {
        auto: false,
        initialData: { results: [], count: 0 }
    });

    const { execute: approveIngresoAction, loading: isAprobando } = useApi(aprobarIngreso, { auto: false });
    const { execute: rejectIngresoAction, loading: isRechazando } = useApi(rechazarIngreso, { auto: false });

    // Cargar datos cuando cambian los filtros o la página
    useEffect(() => {
        fetchIngresos({
            page,
            search: debouncedSearch,
            ...filters
        });
    }, [page, debouncedSearch, filters, fetchIngresos]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPage(1); // Volver a la primera página al filtrar
    };

    const ingresos = ingresosData?.results || [];
    const totalCount = ingresosData?.count || 0;

    const handleAprobar = async (id, e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm("¿Confirmar aprobación de este ingreso? El stock se cargará inmediatamente.")) return;

        try {
            await approveIngresoAction(id);
            fetchIngresos();
        } catch (error) {
            // useErrorHandler will show the notification
        }
    };

    const handleRechazar = async (id, e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm("¿Confirmar rechazo de este ingreso? Esta acción es irreversible.")) return;

        try {
            await rejectIngresoAction(id);
            fetchIngresos();
        } catch (error) {
            // useErrorHandler will show the notification
        }
    };

    return (
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
            <PageHeader
                breadcrumbs={[
                    { label: 'Gestión de Movimientos', href: '/movimientos' },
                    { label: 'Ingresos de Mercadería' }
                ]}
                subtitle={
                    <>
                        <Package size={12} />
                        <span>Podés registrar borradores y aprobarlos para cargar stock.</span>

                    </>
                }
            >
                <Link
                    href="/movimientos/ingresos/nuevo"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 px-6 rounded-xl shadow-lg shadow-blue-100 transition-all flex items-center gap-2 uppercase text-[10px] tracking-widest active:scale-95"
                >
                    <Plus size={16} /> Nuevo Ingreso
                </Link>
            </PageHeader>

            <main className="flex-1 overflow-y-auto p-8 min-w-0">
                <div className="max-w-[1800px] mx-auto space-y-6">
                    
                    {/* Barra de Búsqueda y Filtros */}
                    <div className="bg-white p-4 rounded-[24px] border border-slate-200 shadow-sm space-y-3">
                        <div className="flex flex-col lg:flex-row gap-3">
                            {/* Buscador Principal */}
                            <div className="flex-1 relative">
                                <Search size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 ${loading ? 'text-blue-500 animate-pulse' : 'text-slate-400'}`} />
                                <input 
                                    type="text" 
                                    placeholder="Buscar por descripción, comprobante, ID o marca..."
                                    className="w-full h-11 bg-slate-50 rounded-xl pl-11 pr-6 text-[11px] font-bold border border-transparent focus:border-blue-200 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setPage(1);
                                    }}
                                />
                            </div>

                            {/* Filtros Secundarios */}
                            <div className="flex flex-wrap gap-3">
                                <div className="flex items-center bg-slate-50 rounded-xl px-4 border border-slate-100 focus-within:border-blue-200 focus-within:bg-white transition-all">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Desde</span>
                                        <input 
                                            type="date"
                                            name="fecha_inicio"
                                            className="bg-transparent h-11 text-[10px] font-bold outline-none text-slate-600"
                                            value={filters.fecha_inicio}
                                            onChange={handleFilterChange}
                                        />
                                    </div>
                                    <div className="w-px h-4 bg-slate-200 mx-4" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Hasta</span>
                                        <input 
                                            type="date"
                                            name="fecha_fin"
                                            className="bg-transparent h-11 text-[10px] font-bold outline-none text-slate-600"
                                            value={filters.fecha_fin}
                                            onChange={handleFilterChange}
                                        />
                                    </div>
                                </div>

                                <div className="relative">
                                    <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <select 
                                        name="estado"
                                        className="h-11 bg-slate-50 rounded-xl pl-10 pr-8 text-[10px] font-black uppercase border border-transparent focus:border-blue-200 focus:bg-white transition-all outline-none appearance-none min-w-[150px] cursor-pointer text-slate-600"
                                        value={filters.estado}
                                        onChange={handleFilterChange}
                                    >
                                        <option value="">Estado: Todos</option>
                                        <option value="BORRADOR">Borrador</option>
                                        <option value="APROBADO">Aprobado</option>
                                        <option value="RECHAZADO">Rechazado</option>
                                    </select>
                                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>

                                <button 
                                    onClick={() => {
                                        setSearchTerm('');
                                        setFilters({ fecha_inicio: '', fecha_fin: '', estado: '' });
                                        setPage(1);
                                    }}
                                    className="h-11 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"
                                >
                                    Limpiar
                                </button>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <LoadingScreen message="Sincronizando ingresos..." />
                    ) : ingresos.length === 0 ? (
                        <EmptyState
                            icon="📥"
                            title="No hay ingresos registrados"
                            message="Aquí verás toda la mercadería que llega a tus depósitos."
                            actionLabel="Nuevo Ingreso"
                            onAction={() => window.location.href = '/movimientos/ingresos/nuevo'}
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {ingresos.map((ing) => (
                                <div
                                    key={ing.id}
                                    onClick={() => router.push(`/movimientos/ingresos/${ing.id}/detalle`)}
                                    className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all group flex flex-col md:flex-row items-center gap-6 cursor-pointer"
                                >
                                    {/* Icono de Estado */}
                                    <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center shrink-0 shadow-sm border ${
                                        ing.estado === 'APROBADO' 
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                            : ing.estado === 'RECHAZADO'
                                                ? 'bg-rose-50 text-rose-600 border-rose-100'
                                                : 'bg-amber-50 text-amber-600 border-amber-100'
                                    }`}>
                                        {ing.estado === 'APROBADO' ? (
                                            <CheckCircle size={32} />
                                        ) : ing.estado === 'RECHAZADO' ? (
                                            <XCircle size={32} />
                                        ) : (
                                            <Clock size={32} className="animate-pulse" />
                                        )}
                                    </div>

                                    {/* Info Principal */}
                                    <div className="flex-1 min-w-0 text-center md:text-left">
                                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">ID #{ing.id}</span>
                                            <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                                                ing.estado === 'APROBADO' 
                                                    ? 'bg-emerald-100 text-emerald-700' 
                                                    : ing.estado === 'RECHAZADO'
                                                        ? 'bg-rose-100 text-rose-700'
                                                        : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {ing.estado}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 truncate tracking-tight">{ing.descripcion}</h3>
                                        <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                                            <span className="flex items-center gap-2"><Calendar size={14} /> {new Date(ing.fecha_arribo).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-2"><MapPin size={14} /> {ing.deposito_nombre}</span>
                                            <span className="flex items-center gap-2"><User size={14} /> {ing.usuario_nombre?.split(' ')[0]}</span>
                                        </div>
                                    </div>

                                    {/* Acciones */}
                                    <div className="flex items-center gap-3">
                                        {ing.estado === 'BORRADOR' && (
                                            <>
                                                <Link
                                                    href={`/movimientos/ingresos/${ing.id}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="px-6 py-3 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-2xl transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest border border-blue-100"
                                                >
                                                    Editar
                                                </Link>
                                                <button
                                                    onClick={(e) => handleAprobar(ing.id, e)}
                                                    disabled={isAprobando || isRechazando}
                                                    className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all border border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isAprobando ? "Aprobando..." : "Aprobar Ingreso"}
                                                </button>
                                                <button
                                                    onClick={(e) => handleRechazar(ing.id, e)}
                                                    disabled={isAprobando || isRechazando}
                                                    className="bg-rose-50 text-rose-600 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-100 transition-all border border-rose-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isRechazando ? "Rechazando..." : "Rechazar"}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Paginación */}
                    {!loading && totalCount > PAGE_SIZE && (
                        <Pagination 
                            count={totalCount}
                            pageSize={PAGE_SIZE}
                            currentPage={page}
                            onPageChange={setPage}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}
