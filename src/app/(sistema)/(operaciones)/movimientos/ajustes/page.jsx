"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import LoadingScreen from '@/components/ui/LoadingScreen';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import { Settings2, User, Calendar, Plus, Package, CheckCircle, Clock } from 'lucide-react';
import { getApiUrl } from '@/services/api';

export default function AjustesInventarioPage() {
    const [ajustes, setAjustes] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

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

    // RESTAURAMOS LA FUNCIÓN DE APROBACIÓN
    const handleAprobar = async (id, e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm("¿Confirmar aprobación de este ajuste de inventario? El stock físico, lotes y vencimientos se actualizarán inmediatamente.")) return;

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
                fetchAjustes(); // Recargamos la lista para ver el cambio de estado
            } else {
                const errorData = await response.json();
                alert(`Error al aprobar: ${errorData.error || errorData.detail || 'Desconocido'}`);
            }
        } catch (error) {
            alert("Error de conexión al intentar aprobar.");
        }
    };

    return (
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
            <PageHeader
                breadcrumbs={[
                    { label: 'Gestión de Movimientos', href: '/movimientos' },
                    { label: 'Ajustes de Inventario' }
                ]}
                subtitle="Corregir discrepancias de stock, lotes y fechas de vencimiento de forma auditada."
            >
                <Link
                    href="/movimientos/ajustes/nuevo"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 px-6 rounded-xl shadow-lg shadow-blue-100 transition-all flex items-center gap-2 uppercase text-[10px] tracking-widest active:scale-95"
                >
                    <Plus size={16} /> Registrar Ajuste
                </Link>
            </PageHeader>

            <main className="flex-1 overflow-y-auto p-8 min-w-0">
                <div className="max-w-[1800px] mx-auto space-y-6">

                    {loading ? (
                        <LoadingScreen message="Cargando historial de ajustes de inventario..." />
                    ) : ajustes.length === 0 ? (
                        <EmptyState
                            icon={<Settings2 size={48} className="text-slate-300 mx-auto mb-4" />}
                            title="No hay ajustes de inventario"
                            message="Aquí verás el historial de todas las correcciones de stock, lotes y vencimientos."
                            actionLabel="Nuevo Ajuste"
                            onAction={() => router.push('/movimientos/ajustes/nuevo')}
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {ajustes.map((ajuste) => (
                                <div key={ajuste.id} className={`bg-white p-6 rounded-[32px] border shadow-sm hover:shadow-lg transition-all group flex flex-col md:flex-row items-center gap-6 ${ajuste.estado === 'BORRADOR' ? 'border-amber-200 hover:border-amber-400' : 'border-slate-200 hover:border-blue-200'}`}>

                                    {/* Icono de Estado */}
                                    <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center shrink-0 shadow-sm border ${ajuste.estado === 'APROBADO' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-500 border-amber-100'}`}>
                                        {ajuste.estado === 'APROBADO' ? <CheckCircle size={32} /> : <Clock size={32} />}
                                    </div>

                                    {/* Info Principal */}
                                    <div className="flex-1 min-w-0 text-center md:text-left">
                                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">ID #{ajuste.id}</span>

                                            <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${ajuste.estado === 'APROBADO' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {ajuste.estado || 'BORRADOR'}
                                            </span>

                                            <span className="text-[9px] font-black px-3 py-1 bg-slate-100 text-slate-600 rounded-full uppercase tracking-widest border border-slate-200">
                                                {ajuste.motivo?.replace('_', ' ') || 'AJUSTE'}
                                            </span>
                                        </div>

                                        <h3 className="text-xl font-black text-slate-900 truncate tracking-tight">
                                            {ajuste.variante_nombre || 'Producto Ajustado'}
                                        </h3>

                                        {ajuste.observaciones && (
                                            <p className="text-slate-500 font-medium text-sm mt-1 truncate">
                                                "{ajuste.observaciones}"
                                            </p>
                                        )}

                                        <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-4 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                                            <span className="flex items-center gap-2"><Calendar size={14} /> {new Date(ajuste.fecha || ajuste.creado_en).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-2"><User size={14} /> {ajuste.usuario_nombre || 'Usuario'}</span>
                                        </div>
                                    </div>

                                    {/* Botón de Acción (Solo si es Borrador) */}
                                    <div className="flex items-center gap-3">
                                        {(ajuste.estado === 'BORRADOR' || !ajuste.estado) && (
                                            <button
                                                onClick={(e) => handleAprobar(ajuste.id, e)}
                                                className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-amber-500 hover:shadow-amber-200 transition-all border border-transparent"
                                            >
                                                Aprobar Ajuste
                                            </button>
                                        )}
                                        {ajuste.estado === 'APROBADO' && (
                                            <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                                                <CheckCircle size={14} /> Stock Actualizado
                                            </div>
                                        )}
                                    </div>

                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}