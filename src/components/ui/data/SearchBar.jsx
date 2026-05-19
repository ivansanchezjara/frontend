"use client";
import { forwardRef } from 'react';
import { Search, X } from 'lucide-react';
import Button from '../basics/Button';

/**
 * SearchBar estandarizada para listados, tablas y modales del ERP.
 * Proporciona una entrada de búsqueda refinada con micro-animaciones en el icono,
 * botón para limpiar y soporte para referencias (ref).
 * 
 * @param {Object} props
 * @param {String} props.value - Valor del término de búsqueda
 * @param {Function} props.onChange - Callback llamado con el nuevo string al escribir o limpiar
 * @param {String} props.placeholder - Marcador de posición (default: 'Buscar...')
 * @param {String} props.className - Clases CSS adicionales para el contenedor exterior
 * @param {String} props.inputClassName - Clases CSS adicionales para el input nativo
 */
export const SearchBar = forwardRef(({
    value,
    onChange,
    placeholder = 'Buscar...',
    className = '',
    inputClassName = '',
    ...props
}, ref) => {
    return (
        <div className={`relative group w-full ${className}`}>
            {/* Icono de búsqueda: sutil, centrado y con micro-animación de escala y color al hacer foco */}
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 group-focus-within:scale-105 transition-all duration-300 pointer-events-none">
                <Search size={16} className="shrink-0" />
            </div>

            {/* Input nativo con estilos premium y anillos de enfoque consistentes */}
            <input
                ref={ref}
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all duration-200 text-sm font-medium text-slate-700 placeholder:text-slate-400 shadow-inner focus:shadow-none ${inputClassName}`}
                {...props}
            />

            {/* Botón limpiar: Reutiliza el componente atómico Button en variante ghost */}
            {value && (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onChange('')}
                    icon={X}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 w-7 h-7 rounded-lg active:scale-95 shrink-0 transition-all duration-200"
                    title="Limpiar búsqueda"
                />
            )}
        </div>
    );
});

SearchBar.displayName = 'SearchBar';
export default SearchBar;
