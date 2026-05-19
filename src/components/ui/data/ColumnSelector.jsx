"use client";
import { useState, useEffect, useRef, useMemo } from 'react';
import { SlidersHorizontal, ChevronDown, Check, Search, X, RefreshCw } from 'lucide-react';
import { Text } from '../basics/Typography';
import Button from '../basics/Button';

/**
 * Componente ColumnSelector estandarizado para tablas del ERP.
 * Permite mostrar/ocultar columnas de forma dinámica con un diseño premium.
 * 
 * @param {Object} props
 * @param {Array} props.opciones - Array de objetos con las columnas disponibles [{ id, label, required }]
 * @param {Array} props.visibles - Array de strings con los ids de las columnas visibles
 * @param {Function} props.onToggle - Callback llamado al activar/desactivar una columna individual (opcional)
 * @param {Function} props.onChange - Callback premium que retorna el array de columnas visibles actualizado (opcional, recomendado)
 * @param {Boolean} props.isOpen - Sobrescribe el estado de apertura (modo controlado)
 * @param {Function} props.setIsOpen - Función para cambiar el estado de apertura (modo controlado)
 * @param {Array} props.defaultVisibles - Columnas que se mostrarán al hacer "Restablecer" (opcional)
 */
export default function ColumnSelector({
    opciones = [],
    visibles = [],
    onToggle,
    onChange,
    isOpen: controlledIsOpen,
    setIsOpen: controlledSetIsOpen,
    defaultVisibles,
}) {
    const [isOpenInternal, setIsOpenInternal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef(null);

    // Soporte para modo controlado y no controlado
    const isControlled = controlledIsOpen !== undefined && controlledSetIsOpen !== undefined;
    const isOpen = isControlled ? controlledIsOpen : isOpenInternal;
    const setIsOpen = isControlled ? controlledSetIsOpen : setIsOpenInternal;

    // Cerrar al hacer clic fuera del componente
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, setIsOpen]);

    // Cerrar al presionar la tecla Escape
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, setIsOpen]);

    // Limpiar búsqueda al cerrar
    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
        }
    }, [isOpen]);

    // Filtrar columnas si hay un término de búsqueda
    const filteredOptions = useMemo(() => {
        if (!searchQuery.trim()) return opciones;
        const query = searchQuery.toLowerCase();
        return opciones.filter(opt =>
            opt.label.toLowerCase().includes(query)
        );
    }, [opciones, searchQuery]);

    // Manejador del toggle de columnas individuales
    const handleToggle = (id, isRequired) => {
        if (isRequired) return; // Las columnas requeridas no se pueden ocultar

        if (onChange) {
            const newVisibles = visibles.includes(id)
                ? visibles.filter(v => v !== id)
                : [...visibles, id];
            onChange(newVisibles);
        } else if (onToggle) {
            onToggle(id);
        }
    };

    // Mostrar todas las columnas
    const handleSelectAll = () => {
        const allIds = opciones.map(opt => opt.id);
        if (onChange) {
            onChange(allIds);
        } else if (onToggle) {
            opciones.forEach(opt => {
                if (!visibles.includes(opt.id)) {
                    onToggle(opt.id);
                }
            });
        }
    };

    // Ocultar todas las columnas excepto las requeridas
    const handleDeselectAll = () => {
        const requiredIds = opciones.filter(opt => opt.required).map(opt => opt.id);
        if (onChange) {
            onChange(requiredIds);
        } else if (onToggle) {
            opciones.forEach(opt => {
                if (visibles.includes(opt.id) && !opt.required) {
                    onToggle(opt.id);
                }
            });
        }
    };

    // Restablecer a la vista por defecto
    const handleReset = () => {
        if (defaultVisibles) {
            if (onChange) {
                onChange(defaultVisibles);
            } else if (onToggle) {
                opciones.forEach(opt => {
                    const shouldBeVisible = defaultVisibles.includes(opt.id);
                    const isCurrentlyVisible = visibles.includes(opt.id);
                    if (shouldBeVisible !== isCurrentlyVisible) {
                        onToggle(opt.id);
                    }
                });
            }
        }
    };

    return (
        <div ref={containerRef} className="relative inline-block">
            {/* Trigger Button: Utiliza el componente Button estandarizado */}
            <Button
                variant="secondary"
                size="md"
                onClick={() => setIsOpen(!isOpen)}
                icon={SlidersHorizontal}
                className={`font-semibold transition-all hover:bg-slate-50 duration-200 select-none ${
                    isOpen ? 'border-slate-300 bg-slate-100/80 shadow-inner' : 'bg-white'
                }`}
            >
                <span>Columnas</span>
                <span className="ml-1 text-[10px] font-black text-slate-500 bg-slate-200/50 px-2 py-0.5 rounded-full">
                    {visibles.length}/{opciones.length}
                </span>
                <ChevronDown 
                    size={14} 
                    className={`text-slate-400 ml-1.5 transition-transform duration-300 ${
                        isOpen ? 'rotate-180 text-slate-600' : ''
                    }`} 
                />
            </Button>

            {/* Dropdown Popover */}
            {isOpen && (
                <div 
                    className="absolute right-0 mt-2.5 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-slate-200/80 p-4 z-50 animate-in fade-in slide-in-from-top-3 duration-250 origin-top-right ease-out"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-100">
                        <Text variant="label" className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                            Personalizar Vista
                        </Text>
                    </div>

                    {/* Bulk Actions Bar */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        <button
                            type="button"
                            onClick={handleSelectAll}
                            className="text-[10px] font-extrabold text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded-lg transition-colors cursor-pointer select-none"
                        >
                            Mostrar todas
                        </button>
                        
                        {defaultVisibles ? (
                            <button
                                type="button"
                                onClick={handleReset}
                                className="text-[10px] font-extrabold text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer select-none"
                                title="Restablecer columnas por defecto"
                            >
                                <RefreshCw size={10} className="shrink-0" />
                                Restablecer
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleDeselectAll}
                                className="text-[10px] font-extrabold text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors cursor-pointer select-none"
                            >
                                Ocultar todas
                            </button>
                        )}
                    </div>

                    {/* Search / Filter Input */}
                    {opciones.length > 5 && (
                        <div className="relative mb-3 group">
                            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Filtrar columnas..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all duration-200 text-xs font-semibold text-slate-700 placeholder:text-slate-400"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-md hover:bg-slate-100"
                                >
                                    <X size={10} />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Options List */}
                    <div className="grid grid-cols-1 gap-0.5 max-h-60 overflow-y-auto pr-1 -mr-1 custom-scrollbar">
                        {filteredOptions.length === 0 ? (
                            <div className="text-center py-6 text-xs font-medium text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                Sin resultados
                            </div>
                        ) : (
                            filteredOptions.map(opt => {
                                const isChecked = visibles.includes(opt.id);
                                const isRequired = opt.required;

                                return (
                                    <label
                                        key={opt.id}
                                        onClick={(e) => {
                                            // Prevenir doble clic en labels complejos
                                            e.stopPropagation();
                                        }}
                                        className={`flex items-center justify-between gap-3 cursor-pointer group p-2 rounded-xl transition-all duration-200 select-none
                                            ${isChecked
                                                ? 'bg-slate-50/60 hover:bg-slate-100/50'
                                                : 'hover:bg-slate-50/30'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            {/* Custom Checkbox */}
                                            <div className="relative flex items-center justify-center shrink-0">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    disabled={isRequired}
                                                    onChange={() => handleToggle(opt.id, isRequired)}
                                                    className="sr-only"
                                                />
                                                <div
                                                    className={`w-4 h-4 rounded-md border transition-all duration-200 flex items-center justify-center
                                                        ${isChecked
                                                            ? 'bg-emerald-600 border-emerald-600 shadow-sm shadow-emerald-600/10 scale-105'
                                                            : 'border-slate-300 bg-white group-hover:border-slate-400'
                                                        }
                                                        ${isRequired ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400' : ''}`}
                                                >
                                                    {isChecked && (
                                                        <Check size={11} strokeWidth={3.5} className="text-white animate-in zoom-in-50 duration-150" />
                                                    )}
                                                </div>
                                            </div>

                                            <span
                                                className={`text-xs font-semibold transition-colors duration-200 truncate
                                                    ${isChecked
                                                        ? 'text-slate-800 font-bold'
                                                        : 'text-slate-500 group-hover:text-slate-700'
                                                    }
                                                    ${isRequired ? 'text-slate-400' : ''}`}
                                            >
                                                {opt.label}
                                            </span>
                                        </div>

                                        {isRequired && (
                                            <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md uppercase tracking-wider scale-90">
                                                Fijo
                                            </span>
                                        )}
                                    </label>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
