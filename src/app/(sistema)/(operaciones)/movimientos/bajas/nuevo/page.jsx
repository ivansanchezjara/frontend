"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { Search, Package, AlertCircle, Info } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import ProductSearchModal from '@/components/movimientos/ProductSearchModal';
import { getApiUrl } from '@/services/api';

export default function NuevaBajaPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [stockLotes, setStockLotes] = useState([]);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    const [baja, setBaja] = useState({
        lote: '',
        cantidad: 1,
        motivo: 'ROTURA',
        observaciones: ''
    });

    const [selectedLoteInfo, setSelectedLoteInfo] = useState(null);

    useEffect(() => {
        const token = Cookies.get('token');
        const API_BASE = getApiUrl();
        async function loadData() {
            try {
                // Para simplificar, traemos los lotes que tienen stock
                const res = await fetch(`${API_BASE}/api/inventario/stock-lotes/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                setStockLotes(Array.isArray(data) ? data : (data.results || []));
            } catch (err) {
                console.error("Error cargando lotes:", err);
            }
        }
        loadData();
    }, []);

    const handleBajaChange = (e) => {
        const { name, value } = e.target;
        setBaja(prev => ({ ...prev, [name]: value }));

        if (name === 'cantidad' && selectedLoteInfo) {
            const val = value === '' ? '' : parseInt(value, 10);

            if (val !== '' && val > selectedLoteInfo.cantidad) {
                setErrorMsg(`La cantidad no puede superar el stock disponible (${selectedLoteInfo.cantidad})`);
            } else if (val !== '' && val <= 0) {
                setErrorMsg(`La cantidad debe ser mayor a 0.`);
            } else {
                setErrorMsg(null);
            }
        }
    };

    const selectLote = (lote) => {
        setBaja(prev => ({ ...prev, lote: lote.id, cantidad: 1 }));
        setSelectedLoteInfo(lote);
        setIsSearchOpen(false);
        setErrorMsg(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validaciones extra antes de enviar
        if (!baja.lote || isSubmitting || errorMsg) return;
        if (!baja.cantidad || Number(baja.cantidad) <= 0) {
            setErrorMsg("Ingrese una cantidad válida.");
            return;
        }

        setIsSubmitting(true);
        const token = Cookies.get('token');
        const API_BASE = getApiUrl();

        try {
            const response = await fetch(`${API_BASE}/api/inventario/bajas/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...baja,
                    cantidad: Number(baja.cantidad) // Aseguramos que sea un número para el backend
                })
            });

            if (response.ok) {
                router.push('/movimientos/bajas');
            } else {
                const errData = await response.json();
                alert("Error al guardar: " + JSON.stringify(errData));
            }
        } catch (error) {
            alert("Error de conexión.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
            <PageHeader
                breadcrumbs={[
                    { label: 'Gestión de Movimientos', href: '/movimientos' },
                    { label: 'Bajas de Inventario', href: '/movimientos/bajas' },
                    { label: 'Nueva Baja' }
                ]}
                subtitle="Registrá pérdidas, mermas o productos vencidos para darlos de baja."
            >
                <button
                    disabled={isSubmitting || !baja.lote || !!errorMsg || !baja.cantidad}
                    onClick={handleSubmit}
                    className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg ${(!baja.lote || !!errorMsg || !baja.cantidad) ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100'}`}
                >
                    {isSubmitting ? 'GUARDANDO...' : 'GUARDAR BAJA'}
                </button>
            </PageHeader>

            <main className="flex-1 overflow-y-auto p-8 min-w-0">
                <div className="max-w-[1800px] mx-auto space-y-6">

                    <div className="grid grid-cols-1 gap-6">
                        {/* Selección de Producto/Lote */}
                        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Package size={14} /> Producto y Lote a descontar
                            </h3>

                            {!selectedLoteInfo ? (
                                <button
                                    onClick={() => setIsSearchOpen(true)}
                                    className="w-full p-10 border-2 border-dashed border-slate-200 rounded-[24px] text-slate-400 hover:border-rose-400 hover:text-rose-500 transition-all flex flex-col items-center gap-4 bg-slate-50/50"
                                >
                                    <Search size={40} className="opacity-20" />
                                    <span className="font-black uppercase tracking-widest text-xs">Click para buscar producto en stock</span>
                                </button>
                            ) : (
                                <div className="flex items-center justify-between p-6 bg-rose-50/50 border border-rose-100 rounded-[24px]">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-rose-100 shadow-sm">
                                            <Package size={24} className="text-rose-600" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">{selectedLoteInfo.lote_codigo}</p>
                                            <h4 className="font-black text-slate-900 text-lg">
                                                {selectedLoteInfo.variante_nombre} <span className="text-slate-400 text-sm font-bold">| {selectedLoteInfo.nombre_variante}</span>
                                            </h4>
                                            <p className="text-xs font-bold text-slate-500">Depósito: {selectedLoteInfo.deposito_nombre}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Disponible</p>
                                        <p className="text-2xl font-black text-slate-900">{selectedLoteInfo.cantidad} <span className="text-sm">unid.</span></p>
                                        <button onClick={() => setSelectedLoteInfo(null)} className="text-[10px] font-black text-rose-600 uppercase tracking-widest mt-2 hover:underline">Cambiar</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Detalles de la Baja */}
                        <div className={`bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm transition-opacity ${!selectedLoteInfo ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <Info size={14} /> Detalles de la Operación
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Cantidad a descontar</label>
                                    <input
                                        type="number"
                                        name="cantidad"
                                        value={baja.cantidad}
                                        onChange={handleBajaChange}
                                        min="1"
                                        className={`w-full bg-slate-50 border ${errorMsg ? 'border-red-500 ring-2 ring-red-50' : 'border-slate-200'} rounded-[20px] p-4 font-black text-lg outline-none focus:ring-4 focus:ring-rose-500/10 transition-all`}
                                    />
                                    {errorMsg && (
                                        <p className="text-red-500 text-[10px] font-black uppercase mt-2 ml-2 flex items-center gap-1">
                                            <AlertCircle size={12} /> {errorMsg}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Motivo de la baja</label>
                                    <select
                                        name="motivo"
                                        value={baja.motivo}
                                        onChange={handleBajaChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-[20px] p-4 font-black text-sm outline-none focus:ring-4 focus:ring-rose-500/10 transition-all appearance-none"
                                    >
                                        <option value="VENCIMIENTO">Vencimiento de producto</option>
                                        <option value="ROTURA">Rotura o Daño</option>
                                        <option value="PERDIDA">Pérdida o Extravío</option>
                                        <option value="ERROR_STOCK">Ajuste por diferencia de inventario</option>
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Observaciones adicionales</label>
                                    <textarea
                                        name="observaciones"
                                        value={baja.observaciones}
                                        onChange={handleBajaChange}
                                        rows="3"
                                        placeholder="Escribe aquí el motivo detallado de la baja..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-[24px] p-5 font-medium text-sm outline-none focus:ring-4 focus:ring-rose-500/10 transition-all resize-none"
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Modal de búsqueda de producto */}
                    <ProductSearchModal
                        isOpen={isSearchOpen}
                        onClose={() => setIsSearchOpen(false)}
                        onSelect={selectLote}
                        lotes={stockLotes}
                    />
                </div>
            </main>
        </div>
    );
}