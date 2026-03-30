export default function ColumnSelector({ opciones, visibles, onToggle, isOpen, setIsOpen }) {
    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`px-4 py-3.5 rounded-2xl border transition-all shadow-sm flex items-center gap-2 font-semibold text-sm cursor-pointer ${isOpen ? 'bg-blue-600 border-blue-600 text-white shadow-blue-500/20' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.5-6h15m-15-6h15" />
                </svg>
                <span>Columnas</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-200/60 p-5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-wider">Personalizar Vista</p>
                    <div className="grid grid-cols-1 gap-1.5">
                        {opciones.map(opt => (
                            <label key={opt.id} className="flex items-center gap-3 cursor-pointer group p-2.5 hover:bg-slate-50 rounded-xl transition-colors">
                                <div className="relative flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        checked={visibles.includes(opt.id)}
                                        onChange={() => onToggle(opt.id)}
                                        className="w-4 h-4 rounded appearance-none border-2 border-slate-300 checked:bg-blue-600 checked:border-blue-600 transition-colors cursor-pointer"
                                    />
                                    {visibles.includes(opt.id) && (
                                        <svg className="w-3 h-3 text-white absolute pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                                <span className={`text-sm font-semibold transition-colors ${visibles.includes(opt.id) ? 'text-slate-700' : 'text-slate-500 group-hover:text-slate-700'}`}>
                                    {opt.label}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}