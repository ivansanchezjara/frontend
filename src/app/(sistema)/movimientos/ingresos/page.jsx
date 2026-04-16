"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Cookies from 'js-cookie';
import LoadingScreen from '@/components/ui/LoadingScreen';
import EmptyState from '@/components/ui/EmptyState';
import { CheckCircle, Clock, Eye, ChevronRight, Package, User, MapPin, Plus, Calendar } from 'lucide-react';

export default function IngresosPage() {
    const [ingresos, setIngresos] = useState([]);
    const [loading, setLoading] = useState(true);

    const getApiUrl = () => {
        if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
        if (typeof window !== 'undefined') {
            return `${window.location.protocol}//${window.location.hostname}:8000`;
        }
        return 'http://127.0.0.1:8000';
    };

    const fetchIngresos = async () => {
        setLoading(true);
        try {
            const token = Cookies.get('token');
            const API_BASE = getApiUrl();
            const response = await fetch(`${API_BASE}/api/inventario/ingresos/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setIngresos(data.results || data);
            }
        } catch (error) {
            console.error("Error cargando ingresos:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIngresos();
    }, []);

    const handleAprobar = async (id, e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm("¿Confirmar aprobación de este ingreso? El stock se cargará inmediatamente.")) return;
        
        try {
            const token = Cookies.get('token');
            const API_BASE = getApiUrl();
            const response = await fetch(`${API_BASE}/api/inventario/ingresos/${id}/aprobar/`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                fetchIngresos();
            } else {
                const errorData = await response.json();
                alert(`Error al aprobar: ${errorData.error || 'Desconocido'}`);
            }
        } catch (error) {
            alert("Error de conexión.");
        }
    };

    return (
        <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestión de Ingresos</h1>
                    <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                        <Link href="/movimientos" className="hover:text-emerald-600 transition-colors">Movimientos</Link>
                        <ChevronRight size={14} />
                        <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Arribos de Mercadería</span>
                    </div>
                </div>
                <Link
                    href="/movimientos/ingresos/nuevo"
                    className="bg-slate-900 hover:bg-slate-800 text-white font-black py-4 px-8 rounded-[24px] shadow-xl shadow-slate-200 transition-all flex items-center gap-2 uppercase text-xs tracking-widest"
                >
                    <Plus size={18} /> Registrar Nuevo Ingreso
                </Link>
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
                        <div key={ing.id} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all group flex flex-col md:flex-row items-center gap-6">
                            {/* Icono de Estado */}
                            <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center shrink-0 shadow-sm border ${ing.estado === 'APROBADO' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                {ing.estado === 'APROBADO' ? <CheckCircle size={32} /> : <Clock size={32} className="animate-pulse" />}
                            </div>

                            {/* Info Principal */}
                            <div className="flex-1 min-w-0 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">ID #{ing.id}</span>
                                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${ing.estado === 'APROBADO' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
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
                                <Link 
                                    href={`/movimientos/ingresos/${ing.id}/detalle`}
                                    className="px-6 py-3 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-2xl transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest border border-slate-100"
                                >
                                    <Eye size={16} /> Ver Auditoría
                                </Link>
                                
                                {ing.estado === 'BORRADOR' && (
                                    <>
                                        <Link 
                                            href={`/movimientos/ingresos/${ing.id}`}
                                            className="px-6 py-3 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-2xl transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest border border-blue-100"
                                        >
                                            Editar
                                        </Link>
                                        <button 
                                            onClick={(e) => handleAprobar(ing.id, e)}
                                            className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all border border-emerald-500"
                                        >
                                            Aprobar Stock
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
