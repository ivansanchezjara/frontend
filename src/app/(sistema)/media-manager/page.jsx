"use client";
import { useState } from 'react';
import Header from '@/components/ui/Header';
import { 
    Folder, Image as ImageIcon, Search, Upload, Filter, 
    MoreVertical, Trash2, Edit2, Link as LinkIcon, 
    AlertCircle, HardDrive, CheckSquare
} from 'lucide-react';
import Link from 'next/link';

export default function MediaManagerPage() {
    // Estado mock temporal hasta conectar backend
    const [carpetas] = useState([
        { id: '1', nombre: 'productos', activos: 45, peso: '15 MB' },
        { id: '2', nombre: 'variantes', activos: 120, peso: '38 MB' },
        { id: '3', nombre: 'temporal', activos: 5, peso: '2 MB' },
        { id: '4', nombre: 'huérfanas', activos: 12, peso: '8 MB', color: 'text-amber-500' }
    ]);

    const [archivos] = useState([
        { id: 1, nombre: 'prod_123_main.jpg', url: 'https://via.placeholder.com/300x300?text=Prod1', peso: '250 KB', fecha: '12/04/2026', linkeado: true },
        { id: 2, nombre: 'var_45_front.png', url: 'https://via.placeholder.com/300x300?text=Prod2', peso: '400 KB', fecha: '14/04/2026', linkeado: true },
        { id: 3, nombre: 'banner_promo_old.jpg', url: 'https://via.placeholder.com/300x300?text=Promo', peso: '800 KB', fecha: '01/01/2026', linkeado: false }
    ]);

    const [carpetaActual, setCarpetaActual] = useState('1');

    return (
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
            {/* Cabecera */}
            <Header 
                title="Gestor de Medios" 
                subtitle={<><HardDrive size={12} /> Almacenamiento y Archivos</>}
            >
                 <Link
                    href="/catalogo"
                    className="bg-white text-slate-600 border border-slate-200 px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all shadow-sm active:scale-95 cursor-pointer mr-2"
                >
                    ← VOLVER A CATÁLOGO
                </Link>
                <button className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-800 transition-all shadow-sm active:scale-95">
                    <Upload size={14} /> SUBIR ARCHIVO
                </button>
            </Header>

            <main className="flex-1 overflow-hidden flex min-w-0 p-4 gap-4 max-w-[1700px] mx-auto w-full">
                
                {/* Panel Izquierdo: Directorios */}
                <div className="w-64 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden shrink-0">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Directorios del Disco</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {carpetas.map(c => (
                            <button
                                key={c.id}
                                onClick={() => setCarpetaActual(c.id)}
                                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left ${carpetaActual === c.id ? 'bg-blue-50 border border-blue-200 shadow-sm' : 'hover:bg-slate-50 border border-transparent'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <Folder size={18} className={c.id === '4' ? 'text-amber-500 fill-amber-500/20' : (carpetaActual === c.id ? 'text-blue-500 fill-blue-500/20' : 'text-slate-400')} />
                                    <div>
                                        <p className={`text-sm font-bold capitalize ${carpetaActual === c.id ? 'text-blue-700' : 'text-slate-700'}`}>{c.nombre}</p>
                                        <p className="text-[10px] font-bold text-slate-400">{c.peso}</p>
                                    </div>
                                </div>
                                <span className={`text-xs font-black px-2 py-0.5 rounded-md ${carpetaActual === c.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                    {c.activos}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                        <button className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-xs font-bold hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50 transition-all shadow-sm active:scale-95">
                            <AlertCircle size={14} /> AUDITAR HUÉRFANAS
                        </button>
                    </div>
                </div>

                {/* Panel Derecho: Explorador */}
                <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
                    {/* Barra de herramientas del explorador */}
                    <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="relative w-72">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar archivo por nombre..." 
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                                />
                            </div>
                            <div className="h-6 w-px bg-slate-200"></div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{archivos.length} elementos</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <button className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors" title="Selección Múltiple">
                                <CheckSquare size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Grilla de Archivos */}
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                            {archivos.map(archivo => (
                                <div key={archivo.id} className="group flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-300 transition-all cursor-pointer">
                                    <div className="relative aspect-square bg-slate-100 overflow-hidden">
                                        <img src={archivo.url} alt={archivo.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        
                                        {!archivo.linkeado && (
                                            <div className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                                <AlertCircle size={10} /> HUÉRFANA
                                            </div>
                                        )}
                                        {archivo.linkeado && (
                                            <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                                <LinkIcon size={10} /> EN USO
                                            </div>
                                        )}

                                        <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="w-7 h-7 bg-white/90 backdrop-blur rounded-md flex items-center justify-center text-slate-600 hover:text-blue-600 shadow-sm transition-colors" title="Editar / Mover">
                                                <Edit2 size={12} />
                                            </button>
                                            <button className="w-7 h-7 bg-white/90 backdrop-blur rounded-md flex items-center justify-center text-slate-600 hover:text-red-600 shadow-sm transition-colors" title="Eliminar">
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-3">
                                        <p className="text-xs font-bold text-slate-900 truncate" title={archivo.nombre}>{archivo.nombre}</p>
                                        <div className="flex items-center justify-between mt-1.5">
                                            <span className="text-[10px] font-semibold text-slate-400">{archivo.fecha}</span>
                                            <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{archivo.peso}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
