import { Search, X } from 'lucide-react';

export default function SearchBar({
    value,
    onChange,
    placeholder = 'Buscar...',
    className = '',
    inputClassName = '',
    ...props
}) {
    return (
        <div className={`relative group w-full ${className}`}>
            {/* Icono de búsqueda: sutil, centrado y con micro-animación al hacer foco */}
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 group-focus-within:scale-105 transition-all duration-300 pointer-events-none">
                <Search size={16} className="shrink-0" />
            </div>

            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all duration-200 text-sm font-medium text-slate-700 placeholder:text-slate-400 shadow-inner focus:shadow-none ${inputClassName}`}
                {...props}
            />

            {/* Botón limpiar: diseño minimalista y dinámico con icono estandarizado */}
            {value && (
                <button
                    type="button"
                    onClick={() => onChange('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-all duration-200 cursor-pointer p-1 rounded-lg hover:bg-slate-100 active:scale-95"
                    title="Limpiar búsqueda"
                >
                    <X size={14} className="shrink-0" />
                </button>
            )}
        </div>
    );
}
