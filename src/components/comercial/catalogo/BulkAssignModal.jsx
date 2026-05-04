"use client";
import { useState, useEffect } from 'react';
import { getProductos } from '@/services/api';
import { Search, Package, ChevronRight, Check } from 'lucide-react';

export default function BulkAssignModal({ isOpen, onClose, onAssign, selectedCount }) {
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState([]); // Array de IDs (pueden ser productos o variantes)
    const [targetType, setTargetType] = useState('gallery'); // 'gallery', 'product_main', 'variant_main'

    useEffect(() => {
        setSelectedIds([]); // Limpiar selección al cambiar el tipo de destino
    }, [targetType]);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            setSelectedIds([]); // Limpiar selección previa al abrir
            setTargetType('gallery'); // Resetear tipo al abrir
            getProductos().then(data => {
                const list = data.results || data;
                setProductos(Array.isArray(list) ? list : []);
                setLoading(false);
            }).catch(err => {
                console.error("Error cargando productos:", err);
                setLoading(false);
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleAssignClick = () => {
        if (selectedIds.length === 0) return;
        onAssign(selectedIds, targetType);
    };

    const toggleId = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(vId => vId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const filteredProductos = productos.filter(p => 
        p.nombre_general.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.variants.some(v => v.nombre_variante.toLowerCase().includes(searchTerm.toLowerCase()) || v.product_code.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-6 border-b border-slate-100 bg-slate-50">
                    <h3 className="text-lg font-black text-slate-900">Asignación de Medios</h3>
                    <p className="text-xs text-slate-500 mt-1">
                        Vas a asignar <strong>{selectedCount}</strong> {selectedCount === 1 ? 'imagen' : 'imágenes'} al catálogo.
                    </p>
                </div>

                {/* Selector de tipo de asignación */}
                <div className="px-6 py-4 bg-white border-b border-slate-100 flex gap-2">
                    {[
                        { id: 'gallery', label: 'Galería Extra' },
                        { id: 'variant_main', label: 'Imagen SKU' },
                        { id: 'product_main', label: 'Principal Producto' }
                    ].map(type => (
                        <button
                            key={type.id}
                            onClick={() => setTargetType(type.id)}
                            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${targetType === type.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'}`}
                        >
                            {type.label}
                        </button>
                    ))}
                </div>

                <div className="p-4 border-b border-slate-100">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar producto o SKU..." 
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {loading ? (
                        <div className="p-10 text-center text-slate-400 text-xs font-bold animate-pulse">Cargando catálogo...</div>
                    ) : (
                        <div className="space-y-1">
                            {filteredProductos.map(p => (
                                <div key={p.id} className="space-y-1">
                                    {targetType === 'product_main' ? (
                                        <button
                                            onClick={() => toggleId(p.id)}
                                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left border ${selectedIds.includes(p.id) ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500/10' : 'hover:bg-slate-50 border-transparent'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs overflow-hidden">
                                                    {p.imagen_principal_url ? <img src={p.imagen_principal_url} className="w-full h-full object-cover" /> : <Package size={14} className="text-slate-400" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-700">{p.nombre_general}</p>
                                                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">{p.general_code}</p>
                                                </div>
                                            </div>
                                            {selectedIds.includes(p.id) && <Check size={16} className="text-blue-500" />}
                                        </button>
                                    ) : (
                                        <>
                                            <div className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 rounded-lg">
                                                {p.nombre_general}
                                            </div>
                                            {p.variants.map(v => (
                                                <button
                                                    key={v.id}
                                                    onClick={() => toggleId(v.id)}
                                                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left border ${selectedIds.includes(v.id) ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500/10' : 'hover:bg-slate-50 border-transparent'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs overflow-hidden">
                                                            {v.imagen_url ? <img src={v.imagen_url} className="w-full h-full object-cover" /> : <Package size={14} className="text-slate-400" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-700">{v.nombre_variante}</p>
                                                            <p className="text-[10px] font-mono text-slate-400">{v.product_code}</p>
                                                        </div>
                                                    </div>
                                                    {selectedIds.includes(v.id) && <Check size={16} className="text-blue-500" />}
                                                </button>
                                            ))}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-100 transition-colors">
                        Cancelar
                    </button>
                    <button 
                        disabled={selectedIds.length === 0}
                        onClick={handleAssignClick}
                        className="flex-1 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                        Asignar a {selectedIds.length} {selectedIds.length === 1 ? 'elemento' : 'elementos'}
                    </button>
                </div>
            </div>
        </div>
    );
}
