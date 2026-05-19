"use client";
import React from 'react';
import { Filter, ChevronDown, LayoutGrid, List } from 'lucide-react';
import { Button, Text, SearchBar } from '@/components/ui';

/**
 * MovimientosFilterBar estandarizado (Strict Light Mode).
 * Barra de control de búsqueda y filtros avanzados para listados de movimientos.
 * Integra el buscador premium unificado (SearchBar), controles de rangos de fechas,
 * selección de estado por filtro y selector de vista interactiva (Grilla / Tabla).
 * Reutiliza las piezas de interfaz (Button, Typography - Text, SearchBar).
 */
export default function MovimientosFilterBar({
    searchTerm,
    setSearchTerm,
    filters,
    handleFilterChange,
    onClear,
    loading,
    placeholder = "Buscar...",
    estadoOptions = [
        { value: "BORRADOR", label: "Borrador" },
        { value: "APROBADO", label: "Aprobado" },
        { value: "RECHAZADO", label: "Rechazado" }
    ],
    vista,
    setVista
}) {
    return (
        <div className="bg-white p-4 rounded-[24px] border border-slate-200 shadow-sm space-y-3 font-sans">
            <div className="flex flex-col lg:flex-row gap-3">
                {/* Contenedor del Buscador + Toggle siempre alineados horizontalmente */}
                <div className="flex-1 flex items-center gap-3">
                    {/* Buscador Principal Unificado */}
                    <SearchBar 
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder={placeholder}
                        className="flex-1"
                    />

                    {/* Toggle Grilla / Tabla */}
                    {vista && setVista && (
                        <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1 shrink-0 h-11 select-none">
                            <Button
                                variant={vista === 'grilla' ? 'outline' : 'ghost'}
                                onClick={() => setVista('grilla')}
                                title="Vista grilla"
                                className={`flex items-center justify-center gap-1.5 px-3 h-9 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all select-none border-none ${
                                    vista === 'grilla' 
                                        ? 'bg-white text-blue-600 shadow-sm' 
                                        : 'text-slate-400 hover:text-blue-500'
                                }`}
                            >
                                <LayoutGrid size={13} />
                                <span className="hidden sm:inline">Grilla</span>
                            </Button>
                            <Button
                                variant={vista === 'tabla' ? 'outline' : 'ghost'}
                                onClick={() => setVista('tabla')}
                                title="Vista tabla"
                                className={`flex items-center justify-center gap-1.5 px-3 h-9 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all select-none border-none ${
                                    vista === 'tabla' 
                                        ? 'bg-white text-blue-600 shadow-sm' 
                                        : 'text-slate-400 hover:text-blue-500'
                                }`}
                            >
                                <List size={13} />
                                <span className="hidden sm:inline">Tabla</span>
                            </Button>
                        </div>
                    )}
                </div>

                {/* Filtros Secundarios */}
                <div className="flex flex-wrap gap-3 select-none">
                    <div className="flex items-center bg-slate-50 rounded-xl px-4 border border-slate-100 focus-within:border-blue-200 focus-within:bg-white transition-all">
                        <div className="flex items-center gap-2">
                            <Text variant="label" className="text-[8px] text-slate-400 block tracking-widest">
                                Desde
                            </Text>
                            <input 
                                type="date"
                                name="fecha_inicio"
                                className="bg-transparent h-11 text-[10px] font-bold outline-none text-slate-600 cursor-pointer"
                                value={filters.fecha_inicio}
                                onChange={handleFilterChange}
                            />
                        </div>
                        <div className="w-px h-4 bg-slate-200 mx-4" />
                        <div className="flex items-center gap-2">
                            <Text variant="label" className="text-[8px] text-slate-400 block tracking-widest">
                                Hasta
                            </Text>
                            <input 
                                type="date"
                                name="fecha_fin"
                                className="bg-transparent h-11 text-[10px] font-bold outline-none text-slate-600 cursor-pointer"
                                value={filters.fecha_fin}
                                onChange={handleFilterChange}
                            />
                        </div>
                    </div>

                    <div className="relative">
                        <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <select 
                            name="estado"
                            className="h-11 bg-slate-50 rounded-xl pl-10 pr-8 text-[10px] font-black uppercase border border-transparent focus:border-blue-200 focus:bg-white transition-all outline-none appearance-none min-w-[150px] cursor-pointer text-slate-600"
                            value={filters.estado}
                            onChange={handleFilterChange}
                        >
                            <option value="">Estado: Todos</option>
                            {estadoOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>

                    <Button 
                        variant="ghost"
                        onClick={onClear}
                        className="h-11 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 active:scale-95 transition-all"
                    >
                        Limpiar
                    </Button>
                </div>
            </div>
        </div>
    );
}
