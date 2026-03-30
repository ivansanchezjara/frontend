export default function SearchBar({ value, onChange, placeholder }) {
    return (
        <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">
                Buscar Productos
            </label>
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder={placeholder}
                    className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all shadow-sm font-semibold text-slate-700 placeholder:text-slate-400"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
                {value && (
                    <button
                        onClick={() => onChange('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors cursor-pointer bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}