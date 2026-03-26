export default function CategoryFilter({ categorias, value, onChange }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">
                Categoría
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="bg-white px-6 py-3.5 rounded-2xl border border-slate-200 font-bold text-slate-600 outline-none shadow-sm cursor-pointer hover:border-slate-300 transition-all"
            >
                <option value="Todas">Todas</option>
                {categorias.map(cat => (
                    <option key={cat.id} value={cat.nombre}>
                        {cat.nombre}
                    </option>
                ))}
            </select>
        </div>
    );
}