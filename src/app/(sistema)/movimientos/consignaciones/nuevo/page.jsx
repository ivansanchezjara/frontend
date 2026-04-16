"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { Truck, Plus, Package, MapPin, User, Calendar, Trash2, Search, AlertCircle, Info, ChevronRight, LayoutGrid } from 'lucide-react';
import LoadingScreen from '@/components/ui/LoadingScreen';

export default function NuevaConsignacionPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [stockItems, setStockItems] = useState([]);
    
    const [header, setHeader] = useState({
        responsable: '',
        destino: '',
        fecha_esperada_devolucion: '',
        observaciones: ''
    });

    const [items, setItems] = useState([]);

    const getApiUrl = () => {
        if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
        if (typeof window !== 'undefined') {
            return `${window.location.protocol}//${window.location.hostname}:8000`;
        }
        return 'http://127.0.0.1:8000';
    };

    const fetchStock = async () => {
        try {
            const token = Cookies.get('token');
            const API_BASE = getApiUrl();
            const res = await fetch(`${API_BASE}/api/inventario/stock-lotes/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            // Manejar tanto respuestas paginadas (.results) como listas directas
            const rawItems = Array.isArray(data) ? data : (data.results || []);
            
            // Filtrar lotes con stock > 0
            setStockItems(rawItems.filter(l => l.cantidad > 0));
        } catch (err) {
            console.error("Error fetching stock for consignments:", err);
            // Si el fetch inicial falla, es señal de que el backend no responde
        }
    };

    useEffect(() => {
        fetchStock();
    }, []);

    const handleChangeHeader = (e) => {
        setHeader({ ...header, [e.target.name]: e.target.value });
    };

    const addItem = (lote) => {
        if (items.find(i => i.lote === lote.id)) return;
        setItems([...items, {
            lote: lote.id,
            variante_nombre: lote.variante_nombre || 'Producto',
            lote_codigo: lote.lote_codigo,
            deposito_nombre: lote.deposito_nombre,
            stock_max: lote.cantidad,
            cantidad: 1
        }]);
        setIsSearchOpen(false);
        setSearchTerm('');
    };

    const updateItemCantidad = (idx, value) => {
        const newItems = [...items];
        const cant = parseInt(value) || 0;
        newItems[idx].cantidad = Math.min(cant, newItems[idx].stock_max);
        setItems(newItems);
    };

    const removeItem = (idx) => {
        setItems(items.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting || items.length === 0 || !header.responsable || !header.destino) return;

        setIsSubmitting(true);
        try {
            const token = Cookies.get('token');
            const API_BASE = getApiUrl();
            const payload = {
                ...header,
                fecha_esperada_devolucion: header.fecha_esperada_devolucion || null,
                items: items.map(i => ({ 
                    lote: i.lote, 
                    cantidad: i.cantidad 
                }))
            };

            const res = await fetch(`${API_BASE}/api/inventario/consignaciones/`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                router.push('/movimientos/consignaciones');
            } else {
                const contentType = res.headers.get("content-type");
                let errorMessage = "Error desconocido";
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    const data = await res.json();
                    errorMessage = JSON.stringify(data);
                } else {
                    errorMessage = await res.text();
                }
                alert("Error del servidor: " + errorMessage.substring(0, 200));
            }
        } catch (err) {
            console.error("Connection Error:", err);
            alert("Error de conexión: No se pudo contactar con el servidor. Verifique que el backend esté corriendo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredStock = stockItems.filter(l => 
        l.lote_codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.variante_nombre?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 bg-slate-50 min-h-screen pb-24">
            {/* Header de página */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <Link href="/movimientos/consignaciones" className="text-purple-600 font-bold text-xs uppercase tracking-widest hover:text-purple-700 flex items-center gap-1 mb-2">← Volver</Link>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white">
                            <Truck size={24} />
                        </div>
                        Nueva Consignación
                    </h1>
                </div>

                <button 
                    onClick={handleSubmit}
                    disabled={isSubmitting || items.length === 0 || !header.responsable}
                    className="px-10 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-100 transition-all active:scale-95"
                >
                    {isSubmitting ? 'PROCESANDO...' : 'REGISTRAR SALIDA'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Panel lateral: Datos de Cabecera */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-6">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Info size={14} /> Datos del receptor
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Responsable / Cliente</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input 
                                        type="text" name="responsable" value={header.responsable} onChange={handleChangeHeader}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 font-bold text-slate-800 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all placeholder:text-slate-300"
                                        placeholder="Nombre de la persona..."
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Destino / Lugar</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input 
                                        type="text" name="destino" value={header.destino} onChange={handleChangeHeader}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 font-bold text-slate-800 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all placeholder:text-slate-300"
                                        placeholder="Ej: Clínica X, Vendedor Juan..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Fecha Retorno (Est.)</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input 
                                        type="date" name="fecha_esperada_devolucion" value={header.fecha_esperada_devolucion} onChange={handleChangeHeader}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 font-bold text-slate-800 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-xl relative overflow-hidden">
                        <LayoutGrid className="absolute -right-4 -bottom-4 text-white/5 w-24 h-24" />
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Notas Internas</h3>
                        <textarea 
                            name="observaciones" value={header.observaciones} onChange={handleChangeHeader}
                            rows="4" className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                            placeholder="Comentarios adicionales..."
                        />
                    </div>
                </div>

                {/* Grid principal: Ítems */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm min-h-[400px]">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Package size={16} /> Productos a enviar
                            </h3>
                            <button 
                                onClick={() => setIsSearchOpen(true)}
                                className="bg-purple-50 text-purple-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-purple-100 transition-all flex items-center gap-2"
                            >
                                <Plus size={14} /> Seleccionar de Stock
                            </button>
                        </div>

                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-300 border-2 border-dashed border-slate-100 rounded-[30px] bg-slate-50/50">
                                <Package size={48} className="opacity-20 mb-4" />
                                <p className="font-black text-[10px] uppercase tracking-widest">No hay productos seleccionados</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {items.map((item, idx) => (
                                    <div key={idx} className="bg-slate-50 border border-slate-100 p-6 rounded-[30px] flex items-center gap-6 animate-in slide-in-from-right-4 duration-300">
                                        <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 font-black shrink-0">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">{item.lote_codigo}</p>
                                            <h4 className="font-black text-slate-800 truncate">{item.variante_nombre}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">En: {item.deposito_nombre}</p>
                                        </div>
                                        <div className="w-32">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Cantidad</p>
                                            <div className="bg-white border border-slate-200 rounded-xl p-2 flex items-center justify-center">
                                                <input 
                                                    type="number" value={item.cantidad} onChange={(e) => updateItemCantidad(idx, e.target.value)}
                                                    className="w-full text-center font-black text-slate-800 outline-none" min="1"
                                                />
                                            </div>
                                            <p className="text-[8px] font-bold text-center mt-1 text-slate-400">Stock disp: {item.stock_max}</p>
                                        </div>
                                        <button onClick={() => removeItem(idx)} className="text-slate-300 hover:text-rose-500 transition-colors bg-white hover:bg-rose-50 p-3 rounded-xl border border-transparent hover:border-rose-100 shadow-sm">
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de búsqueda de stock */}
            {isSearchOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-slate-100 flex items-center gap-4 bg-slate-50">
                            <div className="flex-1 relative">
                                <Search size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    autoFocus type="text" placeholder="Buscar por código de lote o producto..." 
                                    className="w-full h-14 bg-white rounded-2xl pl-14 pr-6 text-lg font-black border border-slate-200 shadow-sm focus:ring-2 focus:ring-purple-500 transition-all outline-none" 
                                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
                                />
                            </div>
                            <button onClick={() => setIsSearchOpen(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl text-slate-400 hover:bg-slate-200 transition-all font-black">✕</button>
                        </div>
                        
                        <div className="p-4 max-h-[400px] overflow-y-auto space-y-2">
                            {stockItems.length === 0 ? (
                                <div className="p-20 text-center space-y-4">
                                    <div className="text-4xl">📦</div>
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs italic">
                                        No hay stock físico disponible en ningún depósito.<br/>
                                        <span className="text-[10px] text-slate-300">Primero debes registrar un ingreso de mercadería.</span>
                                    </p>
                                </div>
                            ) : filteredStock.length === 0 ? (
                                <div className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">
                                    No se encontraron lotes que coincidan con "{searchTerm}"
                                </div>
                            ) : (
                                filteredStock.map(lote => (
                                    <button 
                                        key={lote.id} onClick={() => addItem(lote)}
                                        className="w-full p-5 flex items-center justify-between rounded-3xl transition-all text-left hover:bg-purple-50 border-2 border-transparent hover:border-purple-100 group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-purple-500 transition-all font-black">
                                                <Package size={24} />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black text-purple-500 uppercase tracking-widest">{lote.lote_codigo}</div>
                                                <h5 className="font-black text-slate-900 group-hover:text-purple-900">{lote.variante_nombre}</h5>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase">{lote.deposito_nombre}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">STOCK</div>
                                            <div className="text-lg font-black text-slate-900 group-hover:text-purple-600">{lote.cantidad} <span className="text-[10px] text-slate-300">un.</span></div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                        <div className="p-6 bg-slate-50 flex justify-end">
                            <button onClick={() => setIsSearchOpen(false)} className="bg-slate-900 text-white px-10 py-4 rounded-3xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all">CERRAR</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
