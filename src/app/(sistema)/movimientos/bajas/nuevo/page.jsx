"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { Search, Plus, Trash2, Package, AlertCircle, Check, Info } from 'lucide-react';

export default function NuevaBajaPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [stockLotes, setStockLotes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    const [baja, setBaja] = useState({
        lote: '',
        cantidad: 1,
        motivo: 'ROTURA',
        observaciones: ''
    });

    const [selectedLoteInfo, setSelectedLoteInfo] = useState(null);

    const getApiUrl = () => {
        if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
        if (typeof window !== 'undefined') {
            return `${window.location.protocol}//${window.location.hostname}:8000`;
        }
        return 'http://127.0.0.1:8000';
    };

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
                setStockLotes(data.results || data);
            } catch (err) { console.error(err); }
        }
        loadData();
    }, []);

    const handleBajaChange = (e) => {
        const { name, value } = e.target;
        setBaja(prev => ({ ...prev, [name]: value }));
        
        if (name === 'cantidad' && selectedLoteInfo) {
            if (parseInt(value) > selectedLoteInfo.cantidad) {
                setErrorMsg(`La cantidad no puede superar el stock disponible (${selectedLoteInfo.cantidad})`);
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
        if (!baja.lote || isSubmitting || errorMsg) return;

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
                body: JSON.stringify(baja)
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

    const filteredLotes = stockLotes.filter(l => 
        l.lote_codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.variante_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.variante_codigo?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 bg-slate-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <Link href="/movimientos/bajas" className="text-rose-600 font-bold text-xs uppercase tracking-widest hover:text-rose-700 flex items-center gap-1 mb-2">← Volver</Link>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center text-white">
                            <Trash2 size={24} />
                        </div>
                        Nueva Baja de Inventario
                    </h1>
                </div>

                <button 
                    disabled={isSubmitting || !baja.lote || !!errorMsg} 
                    onClick={handleSubmit} 
                    className={`px-8 py-4 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-xl ${(!baja.lote || !!errorMsg) ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-100'}`}
                >
                    {isSubmitting ? 'GUARDANDO...' : 'GUARDAR BAJA'}
                </button>
            </div>

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
                                    <h4 className="font-black text-slate-900 text-lg">{selectedLoteInfo.variante_nombre}</h4>
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
            {isSearchOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-slate-100 flex items-center gap-4 bg-slate-50">
                            <div className="flex-1 relative">
                                <Search size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    autoFocus 
                                    type="text" 
                                    placeholder="Buscar por lote, código o nombre..." 
                                    className="w-full h-14 bg-white rounded-2xl pl-14 pr-6 text-lg font-black border border-slate-200 shadow-sm focus:ring-2 focus:ring-rose-500 transition-all outline-none" 
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)} 
                                />
                            </div>
                            <button onClick={() => setIsSearchOpen(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl text-slate-400 hover:bg-slate-200 transition-all">✕</button>
                        </div>
                        
                        <div className="p-4 max-h-[500px] overflow-y-auto">
                            {filteredLotes.length === 0 ? (
                                <div className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                    No se encontraron productos con stock.
                                </div>
                            ) : (
                                filteredLotes.map(l => (
                                    <button 
                                        key={l.id} 
                                        onClick={() => selectLote(l)} 
                                        className="w-full p-5 flex items-center justify-between rounded-3xl transition-all text-left mb-2 hover:bg-rose-50 border-2 border-transparent hover:border-rose-100 group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-rose-500 transition-all">
                                                <Package size={24} />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{l.lote_codigo}</div>
                                                <div className="font-black text-slate-900">{l.variante_nombre}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase">{l.deposito_nombre}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">STOCK</div>
                                            <div className="text-xl font-black text-slate-900">{l.cantidad}</div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                        <div className="p-6 bg-slate-50 flex justify-end">
                            <button onClick={() => setIsSearchOpen(false)} className="bg-slate-900 text-white px-10 py-4 rounded-3xl font-black text-sm uppercase tracking-widest">CERRAR</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
