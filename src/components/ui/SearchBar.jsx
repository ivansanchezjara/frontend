export default function SearchBar({ value, onChange, placeholder }) {
    return (
        <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">
                Buscador Inteligente
            </label>
            <div className="relative group">
                <span className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors">🔍</span>
                <input
                    type="text"
                    placeholder={placeholder}
                    className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition shadow-sm font-medium text-slate-700"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
                {value && (
                    <button
                        onClick={() => onChange('')}
                        className="absolute right-4 top-3.5 text-slate-300 hover:text-slate-500 transition-colors cursor-pointer"
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
}