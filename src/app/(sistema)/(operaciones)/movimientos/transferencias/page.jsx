"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Cookies from 'js-cookie';
import LoadingScreen from '@/components/ui/LoadingScreen';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import { ArrowRightLeft, Eye, Package, User, Calendar, Plus, MapPin, CheckCircle, Clock } from 'lucide-react';
import { getApiUrl } from '@/services/api';

export default function TransferenciasPage() {
    const [transferencias, setTransferencias] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTransferencias = async () => {
        setLoading(true);
        try {
            const token = Cookies.get('token');
            const API_BASE = getApiUrl();
            const response = await fetch(`${API_BASE}/api/inventario/transferencias/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setTransferencias(data.results || data);
            }
        } catch (error) {
            console.error("Error cargando transferencias:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransferencias();
    }, []);

    const handleAprobar = async (id, e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm("¿Confirmar aprobación de esta transferencia? El stock se moverá inmediatamente entre depósitos.")) return;

        try {
            const token = Cookies.get('token');
            const API_BASE = getApiUrl();
            const response = await fetch(`${API_BASE}/api/inventario/transferencias/${id}/aprobar/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                fetchTransferencias();
            } else {
                const errorData = await response.json();
                alert(`Error al aprobar: ${errorData.error || 'Desconocido'}`);
            }
        } catch (error) {
            alert("Error de conexión.");
        }
    };

    return (
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
            <PageHeader
                breadcrumbs={[
                    { label: 'Gestión de Movimientos', href: '/movimientos' },
                    { label: 'Transferencias Internas' }
                ]}
                subtitle="Movilizá stock entre depósitos de forma auditada."
            >
                <Link
                    href="/movimientos/transferencias/nuevo"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 px-6 rounded-xl shadow-lg shadow-blue-100 transition-all flex items-center gap-2 uppercase text-[10px] tracking-widest active:scale-95"
                >
                    <Plus size={16} /> Nueva Transferencia
                </Link>
            </PageHeader>

            <main className="flex-1 overflow-y-auto p-8 min-w-0">
                <div className="max-w-[1800px] mx-auto space-y-6">

                    {loading ? (
                        <LoadingScreen message="Sincronizando transferencias..." />
                    ) : transferencias.length === 0 ? (
                        <EmptyState
                            icon="🔄"
                            title="No hay transferencias registradas"
                            message="Aquí verás todos los movimientos de stock realizados entre tus depósitos."
                            actionLabel="Nueva Transferencia"
                            onAction={() => window.location.href = '/movimientos/transferencias/nuevo'}
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {transferencias.map((transf) => (
                                <div key={transf.id} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all group flex flex-col md:flex-row items-center gap-6">
                                    {/* Icono de Estado */}
                                    <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center shrink-0 shadow-sm border ${transf.estado === 'APROBADO' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                        {transf.estado === 'APROBADO' ? <CheckCircle size={32} /> : <ArrowRightLeft size={32} className="animate-pulse" />}
                                    </div>

                                    {/* Info Principal */}
                                    <div className="flex-1 min-w-0 text-center md:text-left">
                                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">ID #{transf.id}</span>
                                            <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${transf.estado === 'APROBADO' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {transf.estado}
                                            </span>
                                            <span className="text-[9px] font-black px-3 py-1 bg-slate-100 text-slate-500 rounded-full uppercase tracking-widest">
                                                {transf.items?.length || 0} Ítems
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 truncate tracking-tight">
                                            {transf.deposito_origen_nombre} → {transf.deposito_destino_nombre}
                                        </h3>
                                        <p className="text-slate-500 text-xs font-medium mt-1 italic">
                                            {transf.observaciones || 'Sin observaciones'}
                                        </p>
                                        <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-4 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                                            <span className="flex items-center gap-2"><Calendar size={14} /> {new Date(transf.fecha).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-2"><User size={14} /> {transf.usuario_nombre}</span>
                                        </div>
                                    </div>

                                    {/* Acciones */}
                                    <div className="flex items-center gap-3">
                                        {transf.estado === 'BORRADOR' && (
                                            <button
                                                onClick={(e) => handleAprobar(transf.id, e)}
                                                className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all border border-blue-500"
                                            >
                                                Aprobar Movimiento
                                            </button>
                                        )}
                                        {transf.estado === 'APROBADO' && (
                                            <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-xl">
                                                <Package size={14} /> Stock Movido
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
