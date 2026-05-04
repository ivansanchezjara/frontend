import { useState, useEffect } from 'react';
import { Search, Package, Check } from 'lucide-react';

export default function ProductSearchModal({ 
    isOpen, 
    onClose, 
    onSelect, 
    lotes = [], 
    placeholder = "Buscar por lote, código o nombre...",
    emptyMessage = "No se encontraron productos con stock."
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [lastAddedId, setLastAddedId] = useState(null);

    // Limpiar búsqueda al abrir
    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const filteredLotes = lotes.filter(l => 
        l.lote_codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.variante_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.variante_codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.nombre_variante?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (lote) => {
        setLastAddedId(lote.id);
        setTimeout(() => setLastAddedId(null), 800);
        onSelect(lote);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="p-8 border-b border-slate-100 flex items-center gap-4 bg-slate-50 shrink-0">
                    <div className="flex-1 relative">
                        <Search size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            autoFocus 
                            type="text" 
                            placeholder={placeholder} 
                            className="w-full h-14 bg-white rounded-2xl pl-14 pr-6 text-lg font-black border border-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                        />
                    </div>
                    <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-2xl text-slate-400 hover:bg-slate-200 transition-all shrink-0">✕</button>
                </div>
                
                <div className="p-4 overflow-y-auto flex-1 min-h-[300px]">
                    {filteredLotes.length === 0 ? (
                        <div className="p-20 text-center">
                            <Package size={40} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">{emptyMessage}</p>
                        </div>
                    ) : (
                        filteredLotes.map(l => (
                            <button 
                                key={l.id} 
                                onClick={() => handleSelect(l)} 
                                className={`w-full p-5 flex items-center justify-between rounded-3xl transition-all text-left mb-2 border-2 ${lastAddedId === l.id ? 'bg-emerald-50 border-emerald-300 scale-95' : 'hover:bg-blue-50 border-transparent hover:border-blue-100 group'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-300 shadow-sm group-hover:text-blue-500 transition-all">
                                        {lastAddedId === l.id ? <Check className="text-emerald-500" /> : <Package size={24} />}
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{l.lote_codigo}</div>
                                        <div className="font-black text-slate-900">
                                            {l.variante_nombre} <span className="text-slate-400 text-sm">| {l.nombre_variante}</span>
                                        </div>
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
                <div className="p-6 bg-slate-50 flex justify-end shrink-0 border-t border-slate-100">
                    <button onClick={onClose} className="bg-slate-900 text-white px-10 py-4 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all">CERRAR</button>
                </div>
            </div>
        </div>
    );
}
