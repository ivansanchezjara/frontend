"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { Search, Plus, Settings, Package, AlertCircle, Check, Info, TrendingUp, DollarSign, ArrowRight, BarChart3 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

export default function NuevoAjustePage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [productos, setProductos] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    
    const [ajuste, setAjuste] = useState({
        variante: '',
        motivo: 'ERROR_CARGA',
        observaciones: '',
        nuevo_costo_fob: '',
        nuevo_costo_landed: '',
        nuevo_precio_0: '',
        nuevo_precio_1: '',
        nuevo_precio_2: '',
        nuevo_precio_3: '',
        nuevo_precio_4: '',
    });

    const [selectedVarianteInfo, setSelectedVarianteInfo] = useState(null);

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
        async function loadProductos() {
            try {
                // Traemos variantes (usando el endpoint de catálogo)
                const res = await fetch(`${API_BASE}/api/catalogo/productos/`, { 
                    headers: { 'Authorization': `Bearer ${token}` } 
                });
                const data = await res.json();
                
                // Extraer todas las variantes de todos los productos
                const allVariantes = [];
                data.results?.forEach(p => {
                    p.variantes?.forEach(v => {
                        allVariantes.push({
                            ...v,
                            producto_nombre: p.nombre_general,
                            categoria: p.categoria_nombre
                        });
                    });
                });
                setProductos(allVariantes);
            } catch (err) { console.error(err); }
        }
        loadProductos();
    }, []);

    const handleAjusteChange = (e) => {
        const { name, value } = e.target;
        setAjuste(prev => ({ ...prev, [name]: value }));
    };

    const selectVariante = (v) => {
        setSelectedVarianteInfo(v);
        setAjuste(prev => ({
            ...prev,
            variante: v.id,
            // Inicializar con valores actuales por comodidad
            nuevo_costo_fob: v.costo_fob || '',
            nuevo_costo_landed: v.costo_landed || '',
            nuevo_precio_0: v.precio_0_publico || '',
            nuevo_precio_1: v.precio_1_estudiante || '',
            nuevo_precio_2: v.precio_2_reventa || '',
            nuevo_precio_3: v.precio_3_mayorista || '',
            nuevo_precio_4: v.precio_4_intercompany || '',
        }));
        setIsSearchOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!ajuste.variante || isSubmitting) return;

        setIsSubmitting(true);
        const token = Cookies.get('token');
        const API_BASE = getApiUrl();

        // Limpiar strings vacíos para que viajen como null al backend
        const cleanData = {};
        Object.keys(ajuste).forEach(key => {
            cleanData[key] = ajuste[key] === '' ? null : ajuste[key];
        });

        try {
            const response = await fetch(`${API_BASE}/api/inventario/ajustes/`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`, 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify(cleanData)
            });

            if (response.ok) {
                router.push('/movimientos/ajustes');
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

    const filteredProductos = productos.filter(v => 
        v.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.producto_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.nombre_variante?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
            <PageHeader
                breadcrumbs={[
                    { label: 'Gestión de Movimientos', href: '/movimientos' },
                    { label: 'Ajustes Comerciales', href: '/movimientos/ajustes' },
                    { label: 'Nuevo Ajuste' }
                ]}
                subtitle="Modificá costos y precios de venta de un producto específico."
            >
                <button 
                    disabled={isSubmitting || !ajuste.variante} 
                    onClick={handleSubmit} 
                    className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg ${(!ajuste.variante) ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100'}`}
                >
                    {isSubmitting ? 'GUARDANDO...' : 'REGISTRAR AJUSTE'}
                </button>
            </PageHeader>

            <main className="flex-1 overflow-y-auto p-8 min-w-0">
                <div className="max-w-[1800px] mx-auto space-y-6">
                {/* Columna Izquierda: Producto */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-6">
                        <h3 className="text-xs font-black text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Package size={14} /> Producto
                        </h3>

                        {!selectedVarianteInfo ? (
                            <button 
                                onClick={() => setIsSearchOpen(true)}
                                className="w-full p-10 border-2 border-dashed border-slate-200 rounded-[30px] text-slate-400 hover:border-violet-400 hover:text-violet-500 transition-all flex flex-col items-center gap-4 bg-slate-50/50"
                            >
                                <Search size={40} className="opacity-20" />
                                <span className="font-black uppercase tracking-widest text-[10px]">Buscar Producto</span>
                            </button>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-6 bg-violet-50/50 border border-violet-100 rounded-[30px] text-center">
                                    <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-1">{selectedVarianteInfo.product_code}</p>
                                    <h4 className="font-black text-slate-900 text-lg leading-tight">{selectedVarianteInfo.producto_nombre}</h4>
                                    <p className="text-xs font-bold text-slate-500">{selectedVarianteInfo.nombre_variante}</p>
                                    <button onClick={() => setIsSearchOpen(true)} className="text-[10px] font-black text-violet-600 uppercase tracking-widest mt-4 hover:underline">Cambiar</button>
                                </div>
                                
                                <div className="bg-slate-900 rounded-[30px] p-6 text-white overflow-hidden relative">
                                    <BarChart3 className="absolute -right-4 -bottom-4 text-white/5 w-24 h-24" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Motivo del ajuste</p>
                                    <select 
                                        name="motivo" 
                                        value={ajuste.motivo} 
                                        onChange={handleAjusteChange}
                                        className="w-full bg-white/10 border border-white/10 rounded-xl p-3 font-bold text-xs outline-none focus:ring-2 focus:ring-violet-500 appearance-none"
                                    >
                                        <option value="ERROR_CARGA">Error de carga</option>
                                        <option value="INFLACION">Inflación / T. Cambios</option>
                                        <option value="ESTRATEGIA">Estrategia Comercial</option>
                                        <option value="COSTO_EXTRA">Costos Extra</option>
                                        <option value="OTROS">Otros</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="bg-white p-6 rounded-[40px] border border-slate-200 shadow-sm">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Observaciones internas</label>
                        <textarea 
                            name="observaciones" 
                            value={ajuste.observaciones} 
                            onChange={handleAjusteChange}
                            rows="4"
                            placeholder="Detalla el porqué del cambio..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-[24px] p-5 font-medium text-sm outline-none focus:ring-4 focus:ring-violet-500/10 transition-all resize-none"
                        ></textarea>
                    </div>
                </div>

                {/* Columna Derecha: Valores */}
                <div className={`md:col-span-2 space-y-6 transition-opacity ${!selectedVarianteInfo ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                    {/* Sección Costos */}
                    <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <TrendingUp size={14} className="text-emerald-500" /> Ajuste de Costos (USD)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nuevo Costo FOB</label>
                                <div className="flex items-center gap-3">
                                    <div className="text-[10px] font-bold text-slate-300 w-16 text-right">Anterior: {selectedVarianteInfo?.costo_fob || '0.00'}</div>
                                    <input 
                                        type="number" step="0.01" name="nuevo_costo_fob" value={ajuste.nuevo_costo_fob} onChange={handleAjusteChange}
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black transition-all focus:ring-4 focus:ring-emerald-500/10 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nuevo Costo Landed</label>
                                <div className="flex items-center gap-3">
                                    <div className="text-[10px] font-bold text-slate-300 w-16 text-right">Anterior: {selectedVarianteInfo?.costo_landed || '0.00'}</div>
                                    <input 
                                        type="number" step="0.01" name="nuevo_costo_landed" value={ajuste.nuevo_costo_landed} onChange={handleAjusteChange}
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black transition-all focus:ring-4 focus:ring-emerald-500/10 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sección Precios */}
                    <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <DollarSign size={14} className="text-blue-500" /> Ajuste de Precios de Venta
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            {[0,1,2,3,4].map(i => (
                                <div key={i} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 bg-slate-50/50 p-4 rounded-[24px] border border-slate-100">
                                    <div className="w-24">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Precio {i}</p>
                                        <p className="text-[10px] font-bold text-blue-600">
                                            {i === 0 ? 'Público' : i === 1 ? 'Estudiante' : i === 2 ? 'Reventa' : i === 3 ? 'Mayorista' : 'Intercompany'}
                                        </p>
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-300 md:w-20">Ant: {selectedVarianteInfo?.[`precio_${i}_publico`] || selectedVarianteInfo?.[`precio_${i}_estudiante`] || selectedVarianteInfo?.[`precio_${i}_reventa`] || selectedVarianteInfo?.[`precio_${i}_mayorista`] || selectedVarianteInfo?.[`precio_${i}_intercompany`] || '0.00'}</div>
                                    <ArrowRight size={14} className="text-slate-200 hidden md:block" />
                                    <input 
                                        type="number" step="0.01" name={`nuevo_precio_${i}`} value={ajuste[`nuevo_precio_${i}`]} onChange={handleAjusteChange}
                                        placeholder="Nuevo valor..."
                                        className="flex-1 bg-white border border-slate-200 rounded-xl p-3 font-black text-sm focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de búsqueda */}
            {isSearchOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-slate-100 flex items-center gap-4 bg-slate-50">
                            <div className="flex-1 relative">
                                <Search size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    autoFocus 
                                    type="text" 
                                    placeholder="Buscar producto a ajustar..." 
                                    className="w-full h-14 bg-white rounded-2xl pl-14 pr-6 text-lg font-black border border-slate-200 shadow-sm focus:ring-2 focus:ring-violet-500 transition-all outline-none" 
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)} 
                                />
                            </div>
                            <button onClick={() => setIsSearchOpen(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl text-slate-400 hover:bg-slate-200 transition-all">✕</button>
                        </div>
                        
                        <div className="p-4 max-h-[400px] overflow-y-auto">
                            {filteredProductos.length === 0 ? (
                                <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                    No se encontraron productos en el catálogo.
                                </div>
                            ) : (
                                filteredProductos.map(v => (
                                    <button 
                                        key={v.id} 
                                        onClick={() => selectVariante(v)} 
                                        className="w-full p-5 flex items-center justify-between rounded-3xl transition-all text-left mb-2 hover:bg-violet-50 border-2 border-transparent hover:border-violet-100 group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-violet-500 transition-all">
                                                <Package size={24} />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black text-violet-500 uppercase tracking-widest">{v.product_code}</div>
                                                <div className="font-black text-slate-900 leading-tight">{v.producto_nombre}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase">{v.nombre_variante}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">COSTO FOB</div>
                                            <div className="text-lg font-black text-slate-900">${v.costo_fob}</div>
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
            </main>
        </div>
    );
}
