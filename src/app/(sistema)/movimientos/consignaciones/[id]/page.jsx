"use client";
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Cookies from 'js-cookie';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { 
    Truck, Package, MapPin, User, Calendar, 
    CheckCircle, AlertCircle, Clock, ChevronRight, 
    RotateCcw, DollarSign, ArrowRight, ArrowDown, 
    History, Info, ClipboardList, Plus, Search
} from 'lucide-react';

export default function DetalleConsignacionPage({ params }) {
    const { id } = use(params);
    const [consignacion, setConsignacion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('resumen'); // resumen, devoluciones, liquidaciones
    
    // Estados para modales
    const [showDevolucionModal, setShowDevolucionModal] = useState(false);
    const [showLiquidacionModal, setShowLiquidacionModal] = useState(false);
    
    const [depositos, setDepositos] = useState([]);

    const getApiUrl = () => {
        if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
        if (typeof window !== 'undefined') {
            return `${window.location.protocol}//${window.location.hostname}:8000`;
        }
        return 'http://127.0.0.1:8000';
    };

    const fetchDetail = async () => {
        try {
            const token = Cookies.get('token');
            const API_BASE = getApiUrl();
            const res = await fetch(`${API_BASE}/api/inventario/consignaciones/${id}/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setConsignacion(data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchDepositos = async () => {
        try {
            const token = Cookies.get('token');
            const API_BASE = getApiUrl();
            const res = await fetch(`${API_BASE}/api/inventario/depositos/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setDepositos(data.results || data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchDetail();
        fetchDepositos();
    }, [id]);

    const handleAprobarSalida = async () => {
        if (!confirm("¿Aprobar esta consignación? El stock se descontará de los depósitos seleccionados.")) return;
        try {
            const token = Cookies.get('token');
            const API_BASE = getApiUrl();
            const res = await fetch(`${API_BASE}/api/inventario/consignaciones/${id}/aprobar/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchDetail();
            else alert("Error al aprobar");
        } catch (err) { alert("Error de conexión"); }
    };

    if (loading) return <LoadingScreen message="Cargando detalles de consignación..." />;
    if (!consignacion) return <div className="p-20 text-center font-black uppercase text-slate-400">Consignación no encontrada</div>;

    const resumen = consignacion.resumen_stock || {};

    return (
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
            <MovimientoHeader
                breadcrumbs={[
                    { label: 'Gestión de Movimientos', href: '/movimientos' },
                    { label: 'Consignaciones', href: '/movimientos/consignaciones' },
                    { label: `Salida #${consignacion.id}` }
                ]}
                subtitle={`${consignacion.responsable} • ${consignacion.destino}`}
            >
                {consignacion.estado === 'BORRADOR' && (
                    <button 
                        onClick={handleAprobarSalida}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 transition-all flex items-center gap-2 active:scale-95"
                    >
                        <CheckCircle size={18} /> Aprobar Salida
                    </button>
                )}
                {consignacion.estado === 'APROBADO' && !resumen.completado && (
                    <>
                        <button 
                            onClick={() => setShowDevolucionModal(true)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95 border border-slate-200"
                        >
                            <RotateCcw size={16} /> Devolución
                        </button>
                        <button 
                            onClick={() => setShowLiquidacionModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 transition-all flex items-center gap-2 active:scale-95"
                        >
                            <DollarSign size={16} /> Liquidar
                        </button>
                    </>
                )}
                <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest ${consignacion.estado === 'APROBADO' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                    {consignacion.estado}
                </span>
            </MovimientoHeader>

            <main className="flex-1 overflow-y-auto p-8 min-w-0">
                <div className="max-w-[1800px] mx-auto space-y-6">

            {/* Grid de Resumen de Stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Enviado', val: resumen.enviado, icon: <ArrowRight className="text-purple-400" />, sub: 'Stock en calle' },
                    { label: 'Devuelto', val: resumen.devuelto, icon: <RotateCcw className="text-emerald-400" />, sub: 'Stock en depósito' },
                    { label: 'Liquidado', val: resumen.liquidado, icon: <DollarSign className="text-blue-400" />, sub: 'Ventas/Resultados' },
                    { label: 'Pendiente', val: resumen.pendiente, icon: <Clock className={`text-amber-400 ${resumen.pendiente > 0 ? 'animate-pulse' : ''}`} />, sub: 'Aun fuera' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-125 transition-transform duration-500">
                             {stat.icon}
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                            {stat.icon}
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            <h4 className="text-2xl font-black text-slate-900 leading-tight">{stat.val} <span className="text-xs font-bold text-slate-300">un.</span></h4>
                            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.1em]">{stat.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs y Contenido Principal */}
            <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
                <div className="flex border-b border-slate-100 bg-slate-50/50">
                    {[
                        { id: 'resumen', label: 'Items & Salida', icon: <ClipboardList size={16} /> },
                        { id: 'devoluciones', label: 'Devoluciones', icon: <RotateCcw size={16} /> },
                        { id: 'liquidaciones', label: 'Liquidaciones', icon: <DollarSign size={16} /> },
                        { id: 'historial', label: 'Cronología', icon: <History size={16} /> },
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-8 py-5 text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-purple-600 border-b-2 border-purple-600 scale-105 z-10' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-8">
                    {activeTab === 'resumen' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Detalle de mercadería enviada</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {consignacion.items?.map((item, i) => (
                                        <div key={i} className="p-5 bg-slate-50 border border-slate-100 rounded-[28px] flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm group-hover:bg-purple-600 group-hover:text-white transition-all">
                                                    <Package size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.lote_codigo}</p>
                                                    <h4 className="font-black text-slate-800">{item.variante_nombre}</h4>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Origen: {item.deposito_nombre}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Enviado</div>
                                                <div className="text-xl font-black text-slate-900">{item.cantidad} <span className="text-[10px] text-slate-300">un.</span></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'devoluciones' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                             {/* Aquí se listarían las devoluciones realizadas */}
                             <p className="text-center py-20 text-slate-300 font-black uppercase tracking-widest text-xs italic">Registros de retornos a depósito se mostrarán aquí.</p>
                        </div>
                    )}

                    {activeTab === 'liquidaciones' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                             {/* Aquí se listarían las liquidaciones */}
                             <p className="text-center py-20 text-slate-300 font-black uppercase tracking-widest text-xs italic">Registros de ventas y cierres parciales se mostrarán aquí.</p>
                        </div>
                    )}
                    
                    {activeTab === 'historial' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                             <div className="flex gap-4 items-start">
                                 <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0"><CheckCircle size={14} /></div>
                                 <div>
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Creación del Registro</p>
                                     <p className="text-sm font-bold text-slate-700">Comprobante generado por {consignacion.usuario_nombre}</p>
                                     <p className="text-[10px] text-slate-400 font-bold">{new Date(consignacion.fecha_salida).toLocaleString()}</p>
                                 </div>
                             </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modales (Simplicados para demostración, se expandirían con forms reales) */}
            {showDevolucionModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden p-8 space-y-6">
                        <h2 className="text-2xl font-black text-slate-900 uppercase">Nueva Devolución</h2>
                        <p className="text-slate-500 font-bold text-sm leading-relaxed">Este formulario registrará los ítems que regresan físicamente al stock desde la consignación del responsable.</p>
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-4">
                            <AlertCircle className="text-amber-500" />
                            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Función en desarrollo para despliegue de ítems parciales.</p>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button onClick={() => setShowDevolucionModal(false)} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
                </div>
            </main>
        </div>
    );
}
