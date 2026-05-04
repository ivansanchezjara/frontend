"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Cookies from 'js-cookie';
import LoadingScreen from '@/components/ui/LoadingScreen';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import { Trash2, Package, User, Calendar, Plus, Clock } from 'lucide-react';
import { getApiUrl } from '@/services/api';

export default function BajasPage() {
    const [bajas, setBajas] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchBajas = async () => {
        setLoading(true);
        try {
            const token = Cookies.get('token');
            const API_BASE = getApiUrl();
            const response = await fetch(`${API_BASE}/api/inventario/bajas/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setBajas(data.results || data);
            }
        } catch (error) {
            console.error("Error cargando bajas:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBajas();
    }, []);

    const handleAprobar = async (id, e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm("¿Confirmar aprobación de esta baja? El stock se descontará inmediatamente.")) return;

        try {
            const token = Cookies.get('token');
            const API_BASE = getApiUrl();
            const response = await fetch(`${API_BASE}/api/inventario/bajas/${id}/aprobar/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                fetchBajas();
            } else {
                const errorData = await response.json();
                alert(`Error al aprobar: ${errorData.error || 'Desconocido'}`);
            }
        } catch (error) {
            alert("Error de conexión.");
        }
    };

    const getMotivoLabel = (motivo) => {
        const motivos = {
            'VENCIMIENTO': 'Vencimiento',
            'ROTURA': 'Rotura / Daño',
            'PERDIDA': 'Pérdida',
            'ERROR_STOCK': 'Ajuste Stock'
        };
        return motivos[motivo] || motivo;
    };

    return (
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
            <PageHeader
                breadcrumbs={[
                    { label: 'Gestión de Movimientos', href: '/movimientos' },
                    { label: 'Bajas de Inventario' }
                ]}
                subtitle="Registrá pérdidas, mermas o productos vencidos para darlos de baja."
            >
                <Link
                    href="/movimientos/bajas/nuevo"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 px-6 rounded-xl shadow-lg shadow-blue-100 transition-all flex items-center gap-2 uppercase text-[10px] tracking-widest active:scale-95"
                >
                    <Plus size={16} /> Nueva Baja
                </Link>
            </PageHeader>

            <main className="flex-1 overflow-y-auto p-8 min-w-0">
                <div className="max-w-[1800px] mx-auto space-y-6">

                    {loading ? (
                        <LoadingScreen message="Sincronizando bajas..." />
                    ) : bajas.length === 0 ? (
                        <EmptyState
                            icon="📤"
                            title="No hay bajas registradas"
                            message="Aquí se listarán todos los productos descontados por rotura, vencimiento o pérdida."
                            actionLabel="Nueva Baja"
                            onAction={() => window.location.href = '/movimientos/bajas/nuevo'}
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {bajas.map((baja) => (
                                <div key={baja.id} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-lg hover:border-rose-200 transition-all group flex flex-col md:flex-row items-center gap-6">
                                    {/* Icono de Estado */}
                                    <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center shrink-0 shadow-sm border ${baja.estado === 'APROBADO' ? 'bg-slate-50 text-slate-400 border-slate-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                        <Trash2 size={32} />
                                    </div>

                                    {/* Info Principal */}
                                    <div className="flex-1 min-w-0 text-center md:text-left">
                                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">ID #{baja.id}</span>
                                            <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${baja.estado === 'APROBADO' ? 'bg-slate-100 text-slate-600' : 'bg-rose-100 text-rose-700'}`}>
                                                {baja.estado}
                                            </span>
                                            <span className="text-[9px] font-black px-3 py-1 bg-amber-100 text-amber-700 rounded-full uppercase tracking-widest">
                                                {getMotivoLabel(baja.motivo)}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 truncate tracking-tight">
                                            {baja.cantidad} x {baja.variante_nombre}
                                        </h3>
                                        <p className="text-slate-500 text-xs font-medium mt-1 italic">
                                            "{baja.observaciones || 'Sin observaciones'}"
                                        </p>
                                        <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                                            <span className="flex items-center gap-2"><Calendar size={14} /> {new Date(baja.fecha).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-2"><Clock size={14} /> {baja.deposito_nombre}</span>
                                            <span className="flex items-center gap-2"><User size={14} /> {baja.usuario_nombre}</span>
                                        </div>
                                    </div>

                                    {/* Acciones */}
                                    <div className="flex items-center gap-3">
                                        {baja.estado === 'BORRADOR' && (
                                            <button
                                                onClick={(e) => handleAprobar(baja.id, e)}
                                                className="bg-rose-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-100 hover:bg-rose-700 transition-all border border-rose-500"
                                            >
                                                Aprobar Baja
                                            </button>
                                        )}
                                        {baja.estado === 'APROBADO' && (
                                            <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-xl">
                                                <Package size={14} /> Stock Descontado
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
