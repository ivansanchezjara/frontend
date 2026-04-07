// src/components/ui/SearchBar.jsx
export default function SearchBar({ value, onChange, placeholder }) {
    return (
        <div className="relative group w-full">
            {/* Ícono de lupa: un poco más sutil y centrado */}
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
            </div>

            <input
                type="text"
                placeholder={placeholder}
                // 🚀 Cambios clave: py-2.5 (más compacto), text-sm, bg-slate-50 por defecto
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400 shadow-inner group-hover:shadow-none"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />

            {/* Botón limpiar: diseño más minimalista */}
            {value && (
                <button
                    onClick={() => onChange('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer p-1 rounded-full hover:bg-slate-200"
                    title="Limpiar búsqueda"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>
    );
}