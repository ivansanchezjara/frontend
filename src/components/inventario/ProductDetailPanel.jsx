// src/components/inventario/ProductDetailPanel.jsx
import { useEffect } from 'react';
import { getFullImageUrl } from '@/services/api';

export default function ProductDetailPanel({ producto, onClose }) {

    // 1. LOS HOOKS SIEMPRE VAN ARRIBA DE TODO (Regla de React)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // 2. EL RETURN CONDICIONAL VA DESPUÉS DE LOS HOOKS
    if (!producto) return null;

    // 3. RENDERIZADO NORMAL
    return (
        <>
            {/* Fondo oscuro (Overlay) */}
            <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Panel Lateral */}
            <aside className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-500 translate-x-0 flex flex-col">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ficha Técnica</h3>
                        <p className="font-mono text-blue-600 font-bold mt-1">{producto.general_code}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-red-500 rounded-2xl transition-all shadow-sm cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    <div className="w-full aspect-square bg-white rounded-[2.5rem] border border-slate-100 flex items-center justify-center p-12 shadow-inner relative group overflow-hidden">
                        <img
                            src={getFullImageUrl(producto.imagen_principal_url)}
                            alt={producto.nombre_general}
                            className="w-full h-full object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-110"
                        />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-slate-900 leading-tight">{producto.nombre_general}</h2>
                        <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase">
                            {producto.categoria?.nombre || 'Sin Categoría'}
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">{producto.description}</p>
                </div>
            </aside>
        </>
    );
}