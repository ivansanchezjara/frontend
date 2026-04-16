"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Cookies from 'js-cookie';
import LoadingScreen from '@/components/ui/LoadingScreen';
import EmptyState from '@/components/ui/EmptyState';
import { Settings, Eye, ChevronRight, Package, User, Calendar, Plus, BarChart3, CheckCircle, TrendingUp, DollarSign } from 'lucide-react';

export default function AjustesPage() {
    const [ajustes, setAjustes] = useState([]);
    const [loading, setLoading] = useState(true);

    const getApiUrl = () => {
        if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
        if (typeof window !== 'undefined') {
            return `${window.location.protocol}//${window.location.hostname}:8000`;
        }
        return 'http://127.0.0.1:8000';
    };

    const fetchAjustes = async () => {
        setLoading(true);
        try {
            const token = Cookies.get('token');
            const API_BASE = getApiUrl();
            const response = await fetch(`${API_BASE}/api/inventario/ajustes/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setAjustes(data.results || data);
            }
        } catch (error) {
            console.error("Error cargando ajustes:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAjustes();
    }, []);

    const handleAprobar = async (id, e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm("¿Confirmar aprobación de este ajuste comercial? Los costos y precios de venta del producto se actualizarán inmediatamente.")) return;
        
        try {
            const token = Cookies.get('token');
            const API_BASE = getApiUrl();
            const response = await fetch(`${API_BASE}/api/inventario/ajustes/${id}/aprobar/`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                fetchAjustes();
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
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight text-violet-600 uppercase">Ajustes Comerciales</h1>
                    <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                        <Link href="/movimientos" className="hover:text-violet-600 transition-colors">Movimientos</Link>
                        <ChevronRight size={14} />
                        <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Costos & Precios</span>
                    </div>
                </div>
                <Link
                    href="/movimientos/ajustes/nuevo"
                    className="bg-violet-600 hover:bg-violet-700 text-white font-black py-4 px-8 rounded-[24px] shadow-xl shadow-violet-100 transition-all flex items-center gap-2 uppercase text-xs tracking-widest"
                >
                    <Plus size={18} /> Registrar Ajuste
                </Link>
            </div>

            {loading ? (
                <LoadingScreen message="Sincronizando ajustes comerciales..." />
            ) : ajustes.length === 0 ? (
                <EmptyState
                    icon="📊"
                    title="No hay ajustes comerciales"
                    message="Aquí verás todos los cambios realizados en costos FOB, Landed y precios de venta."
                    actionLabel="Nuevo Ajuste"
                    onAction={() => window.location.href = '/movimientos/ajustes/nuevo'}
                />
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {ajustes.map((ajuste) => (
                        <div key={ajuste.id} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-lg hover:border-violet-200 transition-all group flex flex-col md:flex-row items-center gap-6">
                            {/* Icono de Estado */}
                            <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center shrink-0 shadow-sm border ${ajuste.estado === 'APROBADO' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-violet-50 text-violet-600 border-violet-100'}`}>
                                {ajuste.estado === 'APROBADO' ? <CheckCircle size={32} /> : <Settings size={32} className="animate-spin-slow" />}
                            </div>

                            {/* Info Principal */}
                            <div className="flex-1 min-w-0 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">ID #{ajuste.id}</span>
                                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${ajuste.estado === 'APROBADO' ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700'}`}>
                                        {ajuste.estado}
                                    </span>
                                    <span className="text-[9px] font-black px-3 py-1 bg-slate-100 text-slate-500 rounded-full uppercase tracking-widest">
                                        {ajuste.motivo}
                                    </span>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 truncate tracking-tight">
                                    {ajuste.variante_nombre}
                                </h3>
                                <p className="text-slate-500 font-bold text-xs mt-1 uppercase tracking-widest opacity-60">
                                    Cód: {ajuste.variante_codigo}
                                </p>
                                
                                <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-4 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                                    <span className="flex items-center gap-2"><Calendar size={14} /> {new Date(ajuste.fecha).toLocaleDateString()}</span>
                                    <span className="flex items-center gap-2"><User size={14} /> {ajuste.usuario_nombre}</span>
                                    {ajuste.nuevo_costo_fob && <span className="flex items-center gap-1 text-emerald-600"><TrendingUp size={14} /> Cambio de Costo</span>}
                                    {ajuste.nuevo_precio_0 && <span className="flex items-center gap-1 text-blue-600"><DollarSign size={14} /> Cambio de Precio</span>}
                                </div>
                            </div>

                            {/* Acciones */}
                            <div className="flex items-center gap-3">
                                {ajuste.estado === 'BORRADOR' && (
                                    <button 
                                        onClick={(e) => handleAprobar(ajuste.id, e)}
                                        className="bg-violet-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-violet-100 hover:bg-violet-700 transition-all border border-violet-500"
                                    >
                                        Aprobar Ajuste
                                    </button>
                                )}
                                {ajuste.estado === 'APROBADO' && (
                                    <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                                        <TrendingUp size={14} /> Aplicado
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <style jsx>{`
                .animate-spin-slow {
                    animation: spin 6s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
