export default function CategoryFilter({ categorias, value, onChange }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">
                Categoría
            </label>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full sm:w-48 appearance-none bg-white pl-6 pr-12 py-3.5 rounded-2xl border border-slate-200 font-semibold text-slate-700 outline-none shadow-sm cursor-pointer hover:border-slate-300 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                >
                    <option value="Todas">Todas las Categorías</option>
                    {categorias.map(cat => (
                        <option key={cat.id} value={cat.nombre}>
                            {cat.nombre}
                        </option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                </div>
            </div>
        </div>
    );
}