"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Cookies from 'js-cookie';
import LoadingScreen from '@/components/ui/LoadingScreen';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import { Truck, Eye, ChevronRight, Package, User, Calendar, Plus, MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function ConsignacionesPage() {
    const [consignaciones, setConsignaciones] = useState([]);
    const [loading, setLoading] = useState(true);

    const getApiUrl = () => {
        if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
        if (typeof window !== 'undefined') {
            return `${window.location.protocol}//${window.location.hostname}:8000`;
        }
        return 'http://127.0.0.1:8000';
    };

    const fetchConsignaciones = async () => {
        setLoading(true);
        try {
            const token = Cookies.get('token');
            const API_BASE = getApiUrl();
            const response = await fetch(`${API_BASE}/api/inventario/consignaciones/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setConsignaciones(data.results || data);
            }
        } catch (error) {
            console.error("Error cargando consignaciones:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConsignaciones();
    }, []);

    return (
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
            <PageHeader
                breadcrumbs={[
                    { label: 'Gestión de Movimientos', href: '/movimientos' },
                    { label: 'Consignaciones' }
                ]}
                subtitle="Gestioná mercadería enviada a clientes en calidad de préstamo o consignación."
            >
                <Link
                    href="/movimientos/consignaciones/nuevo"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 px-6 rounded-xl shadow-lg shadow-blue-100 transition-all flex items-center gap-2 uppercase text-[10px] tracking-widest active:scale-95"
                >
                    <Plus size={16} /> Registrar Salida
                </Link>
            </PageHeader>

            <main className="flex-1 overflow-y-auto p-8 min-w-0">
                <div className="max-w-[1800px] mx-auto space-y-6">

            {loading ? (
                <LoadingScreen message="Cargando hojas de ruta de consignación..." />
            ) : consignaciones.length === 0 ? (
                <EmptyState
                    icon="🚚"
                    title="No hay consignaciones activas"
                    message="Aquí podrás gestionar la mercadería enviada a clientes o vendedores de forma temporal."
                    actionLabel="Registrar Salida"
                    onAction={() => window.location.href = '/movimientos/consignaciones/nuevo'}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {consignaciones.map((cons) => (
                        <Link 
                            key={cons.id} 
                            href={`/movimientos/consignaciones/${cons.id}`}
                            className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col relative overflow-hidden"
                        >
                            <div className={`absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-[60px] -z-0 transition-transform group-hover:scale-110`}></div>
                            
                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${cons.estado === 'APROBADO' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {cons.estado}
                                </span>
                                <span className="text-[10px] font-black text-slate-400">#{cons.id}</span>
                            </div>

                            <div className="space-y-4 relative z-10">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight truncate">
                                        {cons.responsable}
                                    </h3>
                                    <p className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
                                        <MapPin size={12} className="text-blue-400" /> {cons.destino}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 border-y border-slate-50 py-4">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Enviado</p>
                                        <p className="font-black text-slate-700">{cons.resumen_stock?.enviado} un.</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Pendiente</p>
                                        <p className={`font-black ${cons.resumen_stock?.pendiente > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                            {cons.resumen_stock?.pendiente} un.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(cons.fecha_salida).toLocaleDateString()}</span>
                                    {cons.fecha_esperada_devolucion && (
                                        <span className={`flex items-center gap-1.5 ${new Date(cons.fecha_esperada_devolucion) < new Date() ? 'text-rose-500' : ''}`}>
                                            <Clock size={14} /> {new Date(cons.fecha_esperada_devolucion).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between group-hover:text-blue-600 transition-all font-black text-[10px] uppercase tracking-widest">
                                Ver Detalles / Gestionar <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
                </div>
            </main>
        </div>
    );
}
